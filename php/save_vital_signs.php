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

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Invalid JSON data"));
    exit;
}

// Validate patient_id
if (empty($data['patient_id'])) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Patient ID is required"));
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

    // Validate at least one vital sign is provided
    $hasVitalSign = false;
    $vitalFields = array('blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate',
                        'temperature', 'oxygen_saturation', 'respiratory_rate',
                        'weight', 'height', 'bmi');

    foreach ($vitalFields as $field) {
        if (isset($data[$field]) && $data[$field] !== null && $data[$field] !== '') {
            $hasVitalSign = true;
            break;
        }
    }

    if (!$hasVitalSign) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "At least one vital sign measurement is required"));
        exit;
    }

    // Validate numeric ranges
    if (isset($data['blood_pressure_systolic']) && $data['blood_pressure_systolic'] !== null && $data['blood_pressure_systolic'] !== '') {
        $sys = (int)$data['blood_pressure_systolic'];
        if ($sys < 60 || $sys > 200) {
            http_response_code(400);
            echo json_encode(array("ok" => false, "error" => "Systolic blood pressure must be between 60-200 mmHg"));
            exit;
        }
    }

    if (isset($data['blood_pressure_diastolic']) && $data['blood_pressure_diastolic'] !== null && $data['blood_pressure_diastolic'] !== '') {
        $dia = (int)$data['blood_pressure_diastolic'];
        if ($dia < 40 || $dia > 140) {
            http_response_code(400);
            echo json_encode(array("ok" => false, "error" => "Diastolic blood pressure must be between 40-140 mmHg"));
            exit;
        }
    }

    if (isset($data['heart_rate']) && $data['heart_rate'] !== null && $data['heart_rate'] !== '') {
        $hr = (int)$data['heart_rate'];
        if ($hr < 40 || $hr > 200) {
            http_response_code(400);
            echo json_encode(array("ok" => false, "error" => "Heart rate must be between 40-200 bpm"));
            exit;
        }
    }

    if (isset($data['temperature']) && $data['temperature'] !== null && $data['temperature'] !== '') {
        $temp = (float)$data['temperature'];
        if ($temp < 35.0 || $temp > 42.0) {
            http_response_code(400);
            echo json_encode(array("ok" => false, "error" => "Temperature must be between 35-42°C"));
            exit;
        }
    }

    if (isset($data['oxygen_saturation']) && $data['oxygen_saturation'] !== null && $data['oxygen_saturation'] !== '') {
        $o2 = (int)$data['oxygen_saturation'];
        if ($o2 < 70 || $o2 > 100) {
            http_response_code(400);
            echo json_encode(array("ok" => false, "error" => "Oxygen saturation must be between 70-100%"));
            exit;
        }
    }

    if (isset($data['respiratory_rate']) && $data['respiratory_rate'] !== null && $data['respiratory_rate'] !== '') {
        $rr = (int)$data['respiratory_rate'];
        if ($rr < 8 || $rr > 40) {
            http_response_code(400);
            echo json_encode(array("ok" => false, "error" => "Respiratory rate must be between 8-40 breaths/min"));
            exit;
        }
    }

    // Auto-calculate BMI if weight and height are provided and BMI is not manually entered
    $weight = isset($data['weight']) && $data['weight'] !== '' ? (float)$data['weight'] : null;
    $height = isset($data['height']) && $data['height'] !== '' ? (float)$data['height'] : null;
    $bmi = isset($data['bmi']) && $data['bmi'] !== '' ? (float)$data['bmi'] : null;

    if ($weight !== null && $height !== null && $height > 0 && $bmi === null) {
        $heightInMeters = $height / 100;
        $bmi = $weight / ($heightInMeters * $heightInMeters);
        $bmi = round($bmi, 1);
    }

    // Get recorded_at timestamp
    $recorded_at = isset($data['recorded_at']) && $data['recorded_at'] !== '' ? $data['recorded_at'] : date('Y-m-d H:i:s');

    
    $pdo->beginTransaction();

    $sql = "INSERT INTO patient_vital_signs (
        patient_id,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        heart_rate,
        temperature,
        oxygen_saturation,
        respiratory_rate,
        weight,
        height,
        bmi,
        notes,
        recorded_by,
        recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array(
        $patient_id,
        isset($data['blood_pressure_systolic']) && $data['blood_pressure_systolic'] !== '' ? (int)$data['blood_pressure_systolic'] : null,
        isset($data['blood_pressure_diastolic']) && $data['blood_pressure_diastolic'] !== '' ? (int)$data['blood_pressure_diastolic'] : null,
        isset($data['heart_rate']) && $data['heart_rate'] !== '' ? (int)$data['heart_rate'] : null,
        isset($data['temperature']) && $data['temperature'] !== '' ? (float)$data['temperature'] : null,
        isset($data['oxygen_saturation']) && $data['oxygen_saturation'] !== '' ? (int)$data['oxygen_saturation'] : null,
        isset($data['respiratory_rate']) && $data['respiratory_rate'] !== '' ? (int)$data['respiratory_rate'] : null,
        $weight,
        $height,
        $bmi,
        isset($data['notes']) && $data['notes'] !== '' ? trim($data['notes']) : null,
        $doctor_id,
        $recorded_at
    ));

    $vital_signs_id = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode(array(
        "ok" => true,
        "vital_signs_id" => $vital_signs_id,
        "message" => "Vital signs recorded successfully"
    ));

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Database error: " . $e->getMessage()));
}
?>
