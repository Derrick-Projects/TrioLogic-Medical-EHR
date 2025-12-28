<?php
// Patient list for appointment selection
session_start();
header('Content-Type: application/json');

require __DIR__ . '/config_db.php';

if (!isset($_SESSION["doctor_id"])) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Not authenticated"));
    exit;
}

$doctor_id = (int)$_SESSION["doctor_id"];

try {
    $sql = "SELECT 
                id, 
                CONCAT(first_name, ' ', last_name) as name,
                email,
                phone_number
            FROM patients
            WHERE doctor_id = ?
            ORDER BY first_name, last_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array($doctor_id));
    $patients = $stmt->fetchAll();
    
    echo json_encode(array(
        'success' => true,
        'patients' => $patients
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Failed to fetch patients: ' . $e->getMessage()
    ));
}
