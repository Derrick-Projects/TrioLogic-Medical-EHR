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

    if (!isset($input['current_password']) || !isset($input['new_password'])) {
        throw new Exception('Current password and new password are required');
    }

    $doctorId = $_SESSION['doctor_id'];
    $currentPassword = $input['current_password'];
    $newPassword = $input['new_password'];
    
    // Validate new password
    if (strlen($newPassword) < 8) {
        throw new Exception('New password must be at least 8 characters long');
    }
    
    // Get current password hash
    $stmt = $pdo->prepare("SELECT password FROM doctors WHERE id = ?");
    $stmt->execute(array($doctorId));
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$doctor) {
        throw new Exception('Doctor not found');
    }
    
    // Verify current password
    if (!password_verify($currentPassword, $doctor['password'])) {
        throw new Exception('Current password is incorrect');
    }
    
    // Hash new password
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update password
    $stmt = $pdo->prepare("UPDATE doctors SET password = ? WHERE id = ?");
    $stmt->execute(array($newPasswordHash, $doctorId));
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Password updated successfully'
    ));
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => $e->getMessage()
    ));
}
