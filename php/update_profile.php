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
    
    // Build update query based on provided fields
    $updates = array();
    $params = array();
    
    if (isset($input['name'])) {
        $updates[] = "name = ?";
        $params[] = $input['name'];
    }
    
    if (isset($input['email'])) {
        $updates[] = "email = ?";
        $params[] = $input['email'];
    }
    
    if (isset($input['phone'])) {
        $updates[] = "phone = ?";
        $params[] = $input['phone'];
    }
    
    if (isset($input['specialization'])) {
        $updates[] = "specialization = ?";
        $params[] = $input['specialization'];
    }
    
    if (empty($updates)) {
        throw new Exception('No fields to update');
    }
    
    // Add doctor_id to params
    $params[] = $doctorId;
    
    // Execute update
    $sql = "UPDATE doctors SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Profile updated successfully'
    ));
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ));
}
