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

try {
    $data = array();

    // Total patients
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM patients WHERE doctor_id = ?");
    $stmt->execute(array($doctor_id));
    $row = $stmt->fetch();
    $data['totalPatients'] = (int)$row['count'];

    // Total conditions
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM patient_conditions pc 
        INNER JOIN patients p ON pc.patient_id = p.id 
        WHERE p.doctor_id = ?
    ");
    $stmt->execute(array($doctor_id));
    $row = $stmt->fetch();
    $data['totalConditions'] = (int)$row['count'];

    // Total medications
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM patient_medications pm 
        INNER JOIN patients p ON pm.patient_id = p.id 
        WHERE p.doctor_id = ?
    ");
    $stmt->execute(array($doctor_id));
    $row = $stmt->fetch();
    $data['totalMedications'] = (int)$row['count'];

    // Total allergies
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM patient_allergies pa 
        INNER JOIN patients p ON pa.patient_id = p.id 
        WHERE p.doctor_id = ?
    ");
    $stmt->execute(array($doctor_id));
    $row = $stmt->fetch();
    $data['totalAllergies'] = (int)$row['count'];

    // Conditions breakdown
    $stmt = $pdo->prepare("
        SELECT 
            pc.condition_code,
            COUNT(*) as count
        FROM patient_conditions pc
        INNER JOIN patients p ON pc.patient_id = p.id
        WHERE p.doctor_id = ?
        GROUP BY pc.condition_code
        ORDER BY count DESC
    ");
    $stmt->execute(array($doctor_id));
    $data['conditions'] = $stmt->fetchAll();

    // Medications breakdown
    $stmt = $pdo->prepare("
        SELECT 
            pm.medication_name,
            COUNT(*) as count
        FROM patient_medications pm
        INNER JOIN patients p ON pm.patient_id = p.id
        WHERE p.doctor_id = ?
        GROUP BY pm.medication_name
        ORDER BY count DESC
        LIMIT 10
    ");
    $stmt->execute(array($doctor_id));
    $data['medications'] = $stmt->fetchAll();

    // Allergies breakdown
    $stmt = $pdo->prepare("
        SELECT 
            pa.allergy_code,
            COUNT(*) as count
        FROM patient_allergies pa
        INNER JOIN patients p ON pa.patient_id = p.id
        WHERE p.doctor_id = ?
        GROUP BY pa.allergy_code
        ORDER BY count DESC
        LIMIT 10
    ");
    $stmt->execute(array($doctor_id));
    $data['allergies'] = $stmt->fetchAll();

    // Demographics (gender distribution)
    $stmt = $pdo->prepare("
        SELECT 
            sex,
            COUNT(*) as count
        FROM patients
        WHERE doctor_id = ?
        GROUP BY sex
    ");
    $stmt->execute(array($doctor_id));
    $demographics = $stmt->fetchAll();
    
    $data['demographics'] = array(
        'male' => 0,
        'female' => 0
    );
    
    foreach ($demographics as $demo) {
        $sex = strtolower($demo['sex']);
        if ($sex === 'male') {
            $data['demographics']['male'] = (int)$demo['count'];
        } elseif ($sex === 'female') {
            $data['demographics']['female'] = (int)$demo['count'];
        }
    }

    echo json_encode(array(
        'ok' => true,
        'data' => $data
    ));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'ok' => false,
        'error' => 'Failed to fetch reports data: ' . $e->getMessage()
    ));
}
