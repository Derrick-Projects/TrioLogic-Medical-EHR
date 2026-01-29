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

// Get patient_id from query string
if (!isset($_GET['patient_id'])) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Patient ID is required"));
    exit;
}

// Extract numeric patient ID
$patient_id_raw = $_GET['patient_id'];
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

    // Fetch vital signs
    $stmt = $pdo->prepare("
        SELECT
            vs.id,
            vs.blood_pressure_systolic,
            vs.blood_pressure_diastolic,
            vs.heart_rate,
            vs.temperature,
            vs.oxygen_saturation,
            vs.respiratory_rate,
            vs.weight,
            vs.height,
            vs.bmi,
            vs.notes,
            vs.recorded_at,
            CONCAT(d.first_name, ' ', d.last_name) as recorded_by
        FROM patient_vital_signs vs
        LEFT JOIN doctors d ON vs.recorded_by = d.id
        WHERE vs.patient_id = ?
        ORDER BY vs.recorded_at DESC
        LIMIT 20
    ");
    $stmt->execute(array($patient_id));
    $vital_signs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    
    foreach ($vital_signs as &$vital) {
        // Combine blood pressure if both values exist
        if ($vital['blood_pressure_systolic'] && $vital['blood_pressure_diastolic']) {
            $vital['blood_pressure'] = $vital['blood_pressure_systolic'] . '/' . $vital['blood_pressure_diastolic'];
        } else {
            $vital['blood_pressure'] = null;
        }
    }

    
    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.medication_name,
            p.dosage,
            p.frequency,
            p.duration,
            p.start_date,
            p.end_date,
            p.notes,
            p.status,
            p.created_at,
            CONCAT(d.first_name, ' ', d.last_name) as prescribed_by
        FROM patient_prescriptions p
        LEFT JOIN doctors d ON p.prescribed_by = d.id
        WHERE p.patient_id = ?
        ORDER BY p.created_at DESC
        LIMIT 20
    ");
    $stmt->execute(array($patient_id));
    $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    
    $stmt = $pdo->prepare("
        SELECT
            n.id,
            n.note_title,
            n.note_content,
            n.note_type,
            n.note_date,
            n.created_at,
            CONCAT(d.first_name, ' ', d.last_name) as written_by
        FROM patient_clinical_notes n
        LEFT JOIN doctors d ON n.written_by = d.id
        WHERE n.patient_id = ?
        ORDER BY n.note_date DESC
        LIMIT 20
    ");
    $stmt->execute(array($patient_id));
    $clinical_notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch scans
    $stmt = $pdo->prepare("
        SELECT
            s.id,
            s.scan_type,
            s.scan_name,
            s.file_name,
            s.file_path,
            s.file_size,
            s.mime_type,
            s.description,
            s.scan_date,
            s.created_at,
            CONCAT(d.first_name, ' ', d.last_name) as uploaded_by
        FROM patient_scans s
        LEFT JOIN doctors d ON s.uploaded_by = d.id
        WHERE s.patient_id = ?
        ORDER BY s.created_at DESC
        LIMIT 20
    ");
    $stmt->execute(array($patient_id));
    $scans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return combined data
    echo json_encode(array(
        "ok" => true,
        "patient_id" => 'P' . str_pad($patient_id, 4, '0', STR_PAD_LEFT),
        "vital_signs" => $vital_signs,
        "prescriptions" => $prescriptions,
        "clinical_notes" => $clinical_notes,
        "scans" => $scans
    ));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Database error: " . $e->getMessage()));
}
?>
