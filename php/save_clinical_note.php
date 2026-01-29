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
if (empty($data['patient_id'])) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Patient ID is required"));
    exit;
}

if (empty($data['note_content'])) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Note content is required"));
    exit;
}

// Validate minimum note length
$note_content = trim($data['note_content']);
if (strlen($note_content) < 10) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Clinical note must be at least 10 characters"));
    exit;
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

    // Validate note_type
    $note_type = isset($data['note_type']) && $data['note_type'] !== '' ? trim($data['note_type']) : 'visit';
    $valid_types = array('visit', 'observation', 'diagnosis', 'treatment', 'other');

    if (!in_array($note_type, $valid_types)) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "Invalid note type. Must be one of: visit, observation, diagnosis, treatment, other"));
        exit;
    }

    // Get note_date timestamp
    $note_date = isset($data['note_date']) && $data['note_date'] !== '' ? $data['note_date'] : date('Y-m-d H:i:s');

    // Insert clinical note
    $pdo->beginTransaction();

    $sql = "INSERT INTO patient_clinical_notes (
        patient_id,
        note_title,
        note_content,
        note_type,
        written_by,
        note_date
    ) VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array(
        $patient_id,
        isset($data['note_title']) && $data['note_title'] !== '' ? trim($data['note_title']) : null,
        $note_content,
        $note_type,
        $doctor_id,
        $note_date
    ));

    $note_id = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode(array(
        "ok" => true,
        "note_id" => $note_id,
        "message" => "Clinical note saved successfully"
    ));

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Database error: " . $e->getMessage()));
}
?>
