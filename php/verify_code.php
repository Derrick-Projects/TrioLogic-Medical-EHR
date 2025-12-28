<?php
require __DIR__ . "/config_db.php";

header("Content-Type: application/json; charset=utf-8");

function json_out($code, $arr) {
    http_response_code($code);
    echo json_encode($arr);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$email = "";
if (isset($data["email"])) {
    $email = trim((string)$data["email"]);
}

$code = "";
if (isset($data["code"])) {
    $code = trim((string)$data["code"]);
}

if ($email === "" || $code === "") {
    json_out(400, array("ok" => false, "message" => "Email and code are required."));
}

if (!preg_match('/^\d{6}$/', $code)) {
    json_out(400, array("ok" => false, "message" => "Code must be a 6-digit number."));
}

try {
    $stmt = $pdo->prepare("SELECT id, is_verified FROM doctors WHERE email = ? LIMIT 1");
    $stmt->execute(array($email));
    $doc = $stmt->fetch();

    if (!$doc) {
        json_out(404, array("ok" => false, "message" => "No account found for this email."));
    }

    if ((int)$doc["is_verified"] === 1) {
        json_out(200, array("ok" => true, "message" => "Email already verified.", "redirect" => "login.html"));
    }

    $doctorId = (int)$doc["id"];

    $v = $pdo->prepare("
        SELECT id, token, expires_at
        FROM email_verifications
        WHERE doctor_id = ?
          AND verified_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $v->execute(array($doctorId));
    $row = $v->fetch();

    if (!$row) {
        json_out(400, array("ok" => false, "message" => "No active verification code found. Please resend."));
    }

    $now = new DateTime();
    $exp = new DateTime($row["expires_at"]);
    if ($now > $exp) {
        json_out(400, array("ok" => false, "message" => "Code expired. Please resend a new code."));
    }

    if (!password_verify($code, $row["token"])) {
        json_out(400, array("ok" => false, "message" => "Invalid code."));
    }

    $pdo->beginTransaction();
    $pdo->prepare("UPDATE doctors SET is_verified = 1 WHERE id = ?")->execute(array($doctorId));
    $pdo->prepare("UPDATE email_verifications SET verified_at = NOW() WHERE id = ?")->execute(array((int)$row["id"]));
    $pdo->commit();

    json_out(200, array("ok" => true, "message" => "Email verified successfully.", "redirect" => "login.html"));

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(500, array("ok" => false, "message" => "Server error: " . $e->getMessage()));
}
