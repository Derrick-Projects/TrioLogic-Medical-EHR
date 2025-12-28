<?php
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

$password = "";
if (isset($data["password"])) {
    $password = (string)$data["password"];
}

if ($username === "" || $password === "") {
    json_out(400, array("ok" => false, "message" => "Username and password are required."));
}

if (!preg_match("/^[a-zA-Z0-9._-]{3,20}$/", $username)) {
    json_out(400, array("ok" => false, "message" => "Invalid username format."));
}

try {
    $stmt = $pdo->prepare("
        SELECT id, username, email, password_hash, is_verified, first_name, last_name
        FROM doctors
        WHERE username = ?
        LIMIT 1
    ");
    $stmt->execute(array($username));
    $doc = $stmt->fetch();

    if (!$doc) {
        json_out(401, array("ok" => false, "message" => "Invalid username or password."));
    }

    if (!password_verify($password, $doc["password_hash"])) {
        json_out(401, array("ok" => false, "message" => "Invalid username or password."));
    }

    // Block if not verified
    if ((int)$doc["is_verified"] !== 1) {
        $email = (string)$doc["email"];
        $redirect = "code_verifications.html?email=" . rawurlencode($email);

        json_out(403, array(
            "ok" => false,
            "code" => "UNVERIFIED",
            "message" => "Please verify your email before logging in.",
            "redirect" => $redirect
        ));
    }

    // Start session
    session_start();
    session_regenerate_id(true);

    $_SESSION["doctor_id"] = (int)$doc["id"];
    $_SESSION["username"]  = (string)$doc["username"];
    $_SESSION["email"]     = (string)$doc["email"];
    $_SESSION["name"]      = trim(((string)$doc["first_name"]) . " " . ((string)$doc["last_name"]));

    json_out(200, array(
        "ok" => true,
        "message" => "Login successful",
        "redirect" => "homepage.html"
    ));

} catch (Exception $e) {
    json_out(500, array("ok" => false, "message" => "Server error: " . $e->getMessage()));
}
