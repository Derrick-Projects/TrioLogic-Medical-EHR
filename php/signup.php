<?php
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
    json_out(405, array("ok" => false, "message" => "Method not allowed."));
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$username = "";
if (isset($data["username"])) {
    $username = trim((string)$data["username"]);
}

$email = "";
if (isset($data["email"])) {
    $email = trim((string)$data["email"]);
}

$password = "";
if (isset($data["password"])) {
    $password = (string)$data["password"];
}

$firstName = "";
if (isset($data["first_name"])) {
    $firstName = trim((string)$data["first_name"]);
}

$lastName = "";
if (isset($data["last_name"])) {
    $lastName = trim((string)$data["last_name"]);
}

// Optional
$phoneCode = "";
if (isset($data["phone_country_code"])) {
    $phoneCode = trim((string)$data["phone_country_code"]);
}

$phoneNum = "";
if (isset($data["phone_number"])) {
    $phoneNum = trim((string)$data["phone_number"]);
}

if ($username === "" || $email === "" || $password === "" || $firstName === "" || $lastName === "") {
    json_out(400, array("ok" => false, "message" => "First name, last name, username, email, and password are required."));
}

if (!preg_match("/^[a-zA-Z0-9._-]{3,20}$/", $username)) {
    json_out(400, array("ok" => false, "message" => "Invalid username format."));
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(400, array("ok" => false, "message" => "Invalid email address."));
}

if (strlen($password) < 6) {
    json_out(400, array("ok" => false, "message" => "Password must be at least 6 characters."));
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Read doctors table columns
    $colStmt = $pdo->prepare("
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'doctors'
    ");
    $colStmt->execute();
    $cols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    $pdo->beginTransaction();

    // Insert doctor
    $fields = array("first_name", "last_name", "username", "email", "password_hash");
    $params = array($firstName, $lastName, $username, $email, $hash);

    if (in_array("phone_country_code", $cols, true)) {
        $fields[] = "phone_country_code";
        if ($phoneCode !== "") {
            $params[] = $phoneCode;
        } else {
            $params[] = null;
        }
    }
    if (in_array("phone_number", $cols, true)) {
        $fields[] = "phone_number";
        if ($phoneNum !== "") {
            $params[] = $phoneNum;
        } else {
            $params[] = null;
        }
    }

    $placeholders = implode(", ", array_fill(0, count($fields), "?"));
    $sql = "INSERT INTO doctors (" . implode(", ", $fields) . ") VALUES (" . $placeholders . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $doctorId = (int)$pdo->lastInsertId();

    // Generate 6-digit code
    $code = (string)random_int(100000, 999999);
    $codeHash = password_hash($code, PASSWORD_DEFAULT);
    $expiresAt = (new DateTime("+15 minutes"))->format("Y-m-d H:i:s");

    // Expire previous active codes
    $pdo->prepare("
        UPDATE email_verifications
        SET expires_at = NOW()
        WHERE doctor_id = ?
          AND verified_at IS NULL
          AND expires_at > NOW()
    ")->execute(array($doctorId));

    // Insert new verification row
    $pdo->prepare("
        INSERT INTO email_verifications (doctor_id, token, expires_at)
        VALUES (?, ?, ?)
    ")->execute(array($doctorId, $codeHash, $expiresAt));

    $pdo->commit();

    // Send email if it fails, user can still click resend on verification page
    $fullName = trim($firstName . " " . $lastName);
    $subject = "Your verification code";
    $html = "<div style='font-family:Arial,sans-serif;line-height:1.5'>" .
            "<h2>Email Verification</h2>" .
            "<p>Your verification code is:</p>" .
            "<div style='font-size:28px;font-weight:800;letter-spacing:4px;margin:16px 0'>" . htmlspecialchars($code) . "</div>" .
            "<p>This code expires in <b>15 minutes</b>.</p>" .
            "</div>";

    $toName = $username;
    if ($fullName !== "") {
        $toName = $fullName;
    }

    try {
        sendEmailSendGrid($email, $toName, $subject, $html);
        json_out(200, array("ok" => true, "message" => "Account created. Verification code sent."));
    } catch (Exception $mailErr) {
        // Don't block signup if email sending fails
        json_out(200, array("ok" => true, "message" => "Account created. Could not send code — please click Resend on the next page."));
    }

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $errorCode = 0;
    if (isset($e->errorInfo[1])) {
        $errorCode = $e->errorInfo[1];
    }
    
    if ((int)$errorCode === 1062) {
        json_out(409, array("ok" => false, "message" => "User already exists (username or email)."));
    }

    json_out(500, array("ok" => false, "message" => "Server error: " . $e->getMessage()));
}
