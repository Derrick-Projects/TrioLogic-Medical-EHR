<?php
session_start();
header('Content-Type: application/json');

// Check if doctor is logged in
if (!isset($_SESSION['doctor_id'])) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Not authenticated'
    ));
    exit;
}

require_once './config_db.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid request data');
    }

    $doctorId = $_SESSION['doctor_id'];
    
    // Store preferences in session
    foreach ($input as $key => $value) {
        $_SESSION['preferences'][$key] = $value;
    }
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Preferences updated successfully'
    ));
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ));
}
