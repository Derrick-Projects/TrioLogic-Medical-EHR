<?php
// delete_patient.php - Delete patient and all related data
session_start();
header('Content-Type: application/json');

require __DIR__ . '/config_db.php';

// Check if doctor is logged in
if (!isset($_SESSION["doctor_id"])) {
    http_response_code(401);
    echo json_encode(array("ok" => false, "error" => "Not authenticated"));
    exit;
}

$doctor_id = (int)$_SESSION["doctor_id"];

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("ok" => false, "error" => "Method not allowed"));
    exit;
}

// Get patient ID from request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$patient_id_raw = "";
if (isset($data['patient_id'])) {
    $patient_id_raw = $data['patient_id'];
}

// Handle patient ID format like "P0011" - strip 'P' prefix if present
$patient_id = 0;
if (is_string($patient_id_raw) && preg_match('/^P(\d+)$/i', $patient_id_raw, $matches)) {
    $patient_id = (int)$matches[1];
} else {
    $patient_id = (int)$patient_id_raw;
}

if ($patient_id <= 0) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Invalid patient ID"));
    exit;
}

try {
    // Verify patient belongs to this doctor
    $stmt = $pdo->prepare("SELECT id FROM patients WHERE id = ? AND doctor_id = ?");
    $stmt->execute(array($patient_id, $doctor_id));
    $patient = $stmt->fetch();
    
    if (!$patient) {
        http_response_code(403);
        echo json_encode(array("ok" => false, "error" => "Patient not found or access denied"));
        exit;
    }
    
    
    $pdo->beginTransaction();
    
    // Delete scan files from filesystem
    $stmt = $pdo->prepare("SELECT file_path FROM patient_scans WHERE patient_id = ?");
    $stmt->execute(array($patient_id));
    $scans = $stmt->fetchAll();
    
    foreach ($scans as $scan) {
        $filePath = __DIR__ . '/../' . $scan['file_path'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
    
    // Remove patient scans directory if empty
    $scanDir = __DIR__ . '/../uploads/scans/' . $patient_id;
    if (is_dir($scanDir)) {
        @rmdir($scanDir); // Only removes if empty
    }
    
    // Delete from all related tables (foreign keys with CASCADE will handle most)
    // But we'll explicitly delete for clarity and to handle tables without CASCADE
    
    // Delete patient scans
    $pdo->prepare("DELETE FROM patient_scans WHERE patient_id = ?")->execute(array($patient_id));
    
    // Delete emergency contacts
    $pdo->prepare("DELETE FROM patient_emergency_contacts WHERE patient_id = ?")->execute(array($patient_id));
    
    // Delete medications
    $pdo->prepare("DELETE FROM patient_medications WHERE patient_id = ?")->execute(array($patient_id));
    
    // Delete surgeries
    $pdo->prepare("DELETE FROM patient_surgeries WHERE patient_id = ?")->execute(array($patient_id));
    
    // Delete allergies
    $pdo->prepare("DELETE FROM patient_allergies WHERE patient_id = ?")->execute(array($patient_id));
    
    // Delete conditions
    $pdo->prepare("DELETE FROM patient_conditions WHERE patient_id = ?")->execute(array($patient_id));
    
    // Check if billing table exists and delete from it
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_billing'");
    $stmt->execute();
    if ($stmt->fetch()) {
        $pdo->prepare("DELETE FROM patient_billing WHERE patient_id = ?")->execute(array($patient_id));
    }
    
    // Finally delete the patient record
    $stmt = $pdo->prepare("DELETE FROM patients WHERE id = ? AND doctor_id = ?");
    $stmt->execute(array($patient_id, $doctor_id));
    
    $pdo->commit();
    
    echo json_encode(array(
        "ok" => true,
        "message" => "Patient and all related data deleted successfully"
    ));
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Delete failed: " . $e->getMessage()));
}
