<?php
require __DIR__ . "/config_db.php";

session_start();
header("Content-Type: application/json");

// Check if user is authenticated
if (!isset($_SESSION["doctor_id"])) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Not authenticated."));
    exit;
}

$doctorId = (int) $_SESSION["doctor_id"];

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Invalid JSON data"));
    exit;
}

// Get patient ID and remove 'P' prefix if present
$patientIdParam = "";
if (isset($data['patientId'])) {
    $patientIdParam = $data['patientId'];
}
$patientId = (int) ltrim($patientIdParam, 'P');

if (!$patientId) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Invalid patient ID."));
    exit;
}

try {
    // Verify patient belongs to this doctor
    $stmt = $pdo->prepare("SELECT id FROM patients WHERE id = ? AND doctor_id = ?");
    $stmt->execute(array($patientId, $doctorId));
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(array("success" => false, "message" => "Patient not found or access denied."));
        exit;
    }

    $pdo->beginTransaction();

    // Update basic patient information
    $stmt = $pdo->prepare("
        UPDATE patients SET
            first_name = ?,
            last_name = ?,
            email = ?,
            phone_country_code = ?,
            phone_number = ?,
            dob = ?,
            sex = ?,
            address_line1 = ?,
            nationality = ?,
            zip_code = ?,
            state = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND doctor_id = ?
    ");
    
    $firstName = "";
    if (isset($data['firstName'])) {
        $firstName = trim($data['firstName']);
    }
    
    $lastName = "";
    if (isset($data['lastName'])) {
        $lastName = trim($data['lastName']);
    }
    
    $email = "";
    if (isset($data['email'])) {
        $email = trim($data['email']);
    }
    
    $phoneCountryCode = "";
    if (isset($data['phoneCountryCode'])) {
        $phoneCountryCode = trim($data['phoneCountryCode']);
    }
    
    $phoneNumber = "";
    if (isset($data['phoneNumber'])) {
        $phoneNumber = trim($data['phoneNumber']);
    }
    
    $dob = null;
    if (isset($data['dob'])) {
        $dob = $data['dob'];
    }
    
    $sex = null;
    if (isset($data['sex'])) {
        $sex = $data['sex'];
    }
    
    $addressLine1 = "";
    if (isset($data['addressLine1'])) {
        $addressLine1 = trim($data['addressLine1']);
    }
    
    $country = "";
    if (isset($data['country'])) {
        $country = trim($data['country']);
    }
    
    $postalCode = "";
    if (isset($data['postalCode'])) {
        $postalCode = trim($data['postalCode']);
    }
    
    $stateProvince = "";
    if (isset($data['stateProvince'])) {
        $stateProvince = trim($data['stateProvince']);
    }
    
    $stmt->execute(array(
        $firstName,
        $lastName,
        $email,
        $phoneCountryCode,
        $phoneNumber,
        $dob,
        $sex,
        $addressLine1,
        $country,
        $postalCode,
        $stateProvince,
        $patientId,
        $doctorId
    ));

    $pdo->commit();

    echo json_encode(array(
        'success' => true,
        'message' => 'Patient updated successfully'
    ));

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Database error in update_patient.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Database error occurred.'
    ));
}
