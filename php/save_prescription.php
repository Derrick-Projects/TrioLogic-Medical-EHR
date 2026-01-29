<?php
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


$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Invalid JSON data"));
    exit;
}

// Validate required fields
$required = array('patient_id', 'medication_name', 'dosage', 'frequency', 'start_date');
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "Missing required field: " . $field));
        exit;
    }
}

// Extract numeric patient ID
$patient_id_raw = $data['patient_id'];
if (preg_match('/^P(\d+)$/i', $patient_id_raw, $matches)) {
    $patient_id = (int)$matches[1];
} else {
    $patient_id = (int)$patient_id_raw;
}

try {
    // Verify patient belongs to this doctor
    $stmt = $pdo->prepare("SELECT id FROM patients WHERE id = ? AND doctor_id = ?");
    $stmt->execute(array($patient_id, $doctor_id));
    $patient = $stmt->fetch();

    if (!$patient) {
        http_response_code(403);
        echo json_encode(array("ok" => false, "error" => "Access denied or patient not found"));
        exit;
    }

    // Validate dates
    $start_date = trim($data['start_date']);
    $end_date = isset($data['end_date']) && $data['end_date'] !== '' ? trim($data['end_date']) : null;

    
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "Invalid start_date format. Use YYYY-MM-DD"));
        exit;
    }

    if ($end_date !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "Invalid end_date format. Use YYYY-MM-DD"));
        exit;
    }

    // Validate end_date is after or equal to start_date
    if ($end_date !== null && strtotime($end_date) < strtotime($start_date)) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "End date must be after or equal to start date"));
        exit;
    }

    // Insert prescription
    $pdo->beginTransaction();

    $sql = "INSERT INTO patient_prescriptions (
        patient_id,
        medication_name,
        dosage,
        frequency,
        duration,
        start_date,
        end_date,
        notes,
        prescribed_by,
        status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array(
        $patient_id,
        trim($data['medication_name']),
        trim($data['dosage']),
        trim($data['frequency']),
        isset($data['duration']) && $data['duration'] !== '' ? trim($data['duration']) : null,
        $start_date,
        $end_date,
        isset($data['notes']) && $data['notes'] !== '' ? trim($data['notes']) : null,
        $doctor_id
    ));

    $prescription_id = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode(array(
        "ok" => true,
        "prescription_id" => $prescription_id,
        "message" => "Prescription saved successfully"
    ));

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Database error: " . $e->getMessage()));
}
?>
