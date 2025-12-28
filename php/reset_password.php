<?php
//  Reset Password - Validate token and update password
require __DIR__ . "/config_db.php";

header("Content-Type: application/json; charset=utf-8");

function json_out($code, $arr) {
    http_response_code($code);
    echo json_encode($arr);
    exit;
}

$requestMethod = "";
if (isset($_SERVER["REQUEST_METHOD"])) {
    $requestMethod = $_SERVER["REQUEST_METHOD"];
}

if ($requestMethod !== "POST") {
    json_out(405, array("ok" => false, "success" => false, "message" => "Method not allowed."));
}

// Accept both JSON and form data
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$token = "";
if (isset($data["token"])) {
    $token = trim((string)$data["token"]);
}

$password = "";
if (isset($data["password"])) {
    $password = (string)$data["password"];
}

// Validate inputs
if ($token === "" || strlen($token) < 20) {
    json_out(400, array("ok" => false, "success" => false, "message" => "Invalid or missing reset token."));
}

if (strlen($password) < 8) {
    json_out(400, array("ok" => false, "success" => false, "message" => "Password must be at least 8 characters."));
}

try {
    // Find token and ensure not expired or used
    $stmt = $pdo->prepare("
        SELECT id, doctor_id, expires_at, used_at
        FROM password_resets
        WHERE token = ?
        LIMIT 1
    ");
    $stmt->execute(array($token));
    $row = $stmt->fetch();

    if (!$row) {
        json_out(400, array("ok" => false, "success" => false, "message" => "Reset link is invalid or has already been used."));
    }

    // Check if already used
    if ($row["used_at"] !== null) {
        json_out(400, array("ok" => false, "success" => false, "message" => "This reset link has already been used."));
    }

    // Check if expired
    $expiresAt = new DateTime($row["expires_at"]);
    if ($expiresAt < new DateTime()) {
        // Expired: delete it
        $pdo->prepare("DELETE FROM password_resets WHERE id = ?")->execute(array((int)$row["id"]));
        json_out(400, array("ok" => false, "success" => false, "message" => "Reset link has expired. Please request a new one."));
    }

    $doctorId = (int)$row["doctor_id"];
    $resetId = (int)$row["id"];
    
    // Hash the new password
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    // Update doctor password
    $upd = $pdo->prepare("UPDATE doctors SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $upd->execute(array($hash, $doctorId));

    // Mark reset as used
    $pdo->prepare("UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?")->execute(array($resetId));

    // Delete all other resets for this doctor (prevents reuse of old tokens)
    $pdo->prepare("DELETE FROM password_resets WHERE doctor_id = ? AND id != ?")->execute(array($doctorId, $resetId));

    $pdo->commit();

    json_out(200, array("ok" => true, "success" => true, "message" => "Password updated successfully. You can now log in."));

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(500, array("ok" => false, "success" => false, "message" => "Server error: " . $e->getMessage()));
}
