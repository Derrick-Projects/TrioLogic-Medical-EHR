<?php
require __DIR__ . "/config_db.php";

session_start();
header("Content-Type: application/json");

if (!isset($_SESSION["doctor_id"])) {
    http_response_code(401);
    echo json_encode(array("ok" => false, "message" => "Not authenticated."));
    exit;
}

$doctorId = (int) $_SESSION["doctor_id"];

try {
    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors'"
    );
    $stmt->execute();
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $hasFirst = in_array("first_name", $cols, true);
    $hasLast = in_array("last_name", $cols, true);

    if ($hasFirst || $hasLast) {
        $fields = array();
        if ($hasFirst) {
            $fields[] = "first_name";
        }
        if ($hasLast) {
            $fields[] = "last_name";
        }
        $fields[] = "username";
        $sql = "SELECT " . implode(", ", $fields) . " FROM doctors WHERE id = ? LIMIT 1";
    } else {
        $sql = "SELECT username FROM doctors WHERE id = ? LIMIT 1";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array($doctorId));
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(array("ok" => false, "message" => "Doctor not found."));
        exit;
    }

    $last = "";
    if (isset($row["last_name"])) {
        $last = trim((string) $row["last_name"]);
    }
    
    $first = "";
    if (isset($row["first_name"])) {
        $first = trim((string) $row["first_name"]);
    }
    
    $username = "Doctor";
    if (isset($row["username"])) {
        $username = trim((string) $row["username"]);
    }

    if ($last !== "") {
        $display = "Dr. " . $last;
    } elseif ($first !== "") {
        $display = "Dr. " . $first;
    } else {
        $display = "Dr. " . $username;
    }

    echo json_encode(array("ok" => true, "name" => $display));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("ok" => false, "message" => "Server error."));
}
