<?php
require __DIR__ . "/config_db.php";
require __DIR__ . "/sendgrid_mailer.php";

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

if ($email === "") {
    json_out(400, array("ok" => false, "message" => "Email is required."));
}

try {
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, username, is_verified FROM doctors WHERE email = ? LIMIT 1");
    $stmt->execute(array($email));
    $doc = $stmt->fetch();

    if (!$doc) {
        json_out(404, array("ok" => false, "message" => "No account found for this email."));
    }
    
    if ((int)$doc["is_verified"] === 1) {
        json_out(200, array("ok" => true, "message" => "Already verified.", "redirect" => "login.html"));
    }

    $doctorId = (int)$doc["id"];

    $code = (string)random_int(100000, 999999);
    $codeHash = password_hash($code, PASSWORD_DEFAULT);
    $expiresAt = (new DateTime("+15 minutes"))->format("Y-m-d H:i:s");

    $pdo->beginTransaction();

    $pdo->prepare("
        UPDATE email_verifications
        SET expires_at = NOW()
        WHERE doctor_id = ?
          AND verified_at IS NULL
          AND expires_at > NOW()
    ")->execute(array($doctorId));

    $pdo->prepare("
        INSERT INTO email_verifications (doctor_id, token, expires_at)
        VALUES (?, ?, ?)
    ")->execute(array($doctorId, $codeHash, $expiresAt));

    $pdo->commit();

    $firstName = "";
    if (isset($doc["first_name"])) {
        $firstName = $doc["first_name"];
    }
    
    $lastName = "";
    if (isset($doc["last_name"])) {
        $lastName = $doc["last_name"];
    }
    
    $fullName = trim($firstName . " " . $lastName);
    
    if ($fullName !== "") {
        $toName = $fullName;
    } elseif (isset($doc["username"])) {
        $toName = $doc["username"];
    } else {
        $toName = $email;
    }

    $subject = "Your verification code";
    $html = "<div style='font-family:Arial,sans-serif;line-height:1.5'>" .
            "<h2>Email Verification</h2>" .
            "<p>Your new verification code is:</p>" .
            "<div style='font-size:28px;font-weight:800;letter-spacing:4px;margin:16px 0'>" . htmlspecialchars($code) . "</div>" .
            "<p>This code expires in <b>15 minutes</b>.</p>" .
            "</div>";

    sendEmailSendGrid($email, $toName, $subject, $html);

    json_out(200, array("ok" => true, "message" => "A new code has been sent."));

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_out(500, array("ok" => false, "message" => "Server error: " . $e->getMessage()));
}
