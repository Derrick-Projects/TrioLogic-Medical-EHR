<?php
// Forgot Password - Send password reset email via SendGrid

require __DIR__ . "/config_db.php";
require __DIR__ . "/sendgrid_mailer.php";

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

$email = "";
if (isset($data["email"])) {
    $email = trim((string)$data["email"]);
}

if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(400, array("ok" => false, "success" => false, "message" => "Please enter a valid email address."));
}

// Change this if your folder name differs
$BASE_URL = "http://localhost/Medical_EHR/htmls";

try {
    // Find doctor by email
    $stmt = $pdo->prepare("SELECT id, email, first_name, last_name FROM doctors WHERE email = ? LIMIT 1");
    $stmt->execute(array($email));
    $doc = $stmt->fetch();

    // Always return generic success (prevents account enumeration)
    $generic = array("ok" => true, "success" => true, "message" => "If that email is registered, you will receive a password reset link shortly.");

    if (!$doc) {
        json_out(200, $generic);
    }

    $doctorId = (int)$doc["id"];
    
    $firstName = "";
    if (isset($doc["first_name"])) {
        $firstName = (string)$doc["first_name"];
    }
    
    $lastName = "";
    if (isset($doc["last_name"])) {
        $lastName = (string)$doc["last_name"];
    }
    
    $name = trim($firstName . " " . $lastName);

    // Remove old resets for this doctor (keeps table clean)
    $pdo->prepare("DELETE FROM password_resets WHERE doctor_id = ?")->execute(array($doctorId));

    // Create token + expiry (30 minutes)
    $token = bin2hex(random_bytes(32)); // 64 hex chars
    $expiresAt = (new DateTime("+30 minutes"))->format("Y-m-d H:i:s");

    $ins = $pdo->prepare("INSERT INTO password_resets (doctor_id, token, expires_at) VALUES (?, ?, ?)");
    $ins->execute(array($doctorId, $token, $expiresAt));

    $resetLink = $BASE_URL . "/reset_password.html?token=" . rawurlencode($token);

    $displayName = "Doctor";
    if ($name !== "") {
        $displayName = $name;
    }

    $subject = "Reset your password - TrioLogic Medical EHR";
    $html = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" .
            "<h2 style='color: #2563eb;'>Password Reset Request</h2>" .
            "<p>Hello " . htmlspecialchars($displayName) . ",</p>" .
            "<p>You requested a password reset for your TrioLogic Medical EHR account.</p>" .
            "<p>Click the button below to set a new password:</p>" .
            "<p style='text-align: center; margin: 30px 0;'>" .
            "<a href=\"" . htmlspecialchars($resetLink) . "\" " .
            "style='background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>" .
            "Reset Password" .
            "</a>" .
            "</p>" .
            "<p><strong>This link expires in 30 minutes.</strong></p>" .
            "<p style='color: #666; font-size: 14px;'>If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>" .
            "<hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>" .
            "<p style='color: #999; font-size: 12px;'>TrioLogic Medical EHR Team</p>" .
            "</div>";

    // Send email via SendGrid
    sendEmailSendGrid($email, $displayName, $subject, $html);

    json_out(200, $generic);

} catch (Exception $e) {
    json_out(500, array("ok" => false, "success" => false, "message" => "Server error: " . $e->getMessage()));
}
