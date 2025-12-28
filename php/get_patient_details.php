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

// Get patient ID from query parameter
$patientIdParam = '';
if (isset($_GET['id'])) {
    $patientIdParam = $_GET['id'];
}

// Remove 'P' prefix if present and convert to integer
$patientId = (int) ltrim($patientIdParam, 'P');

if (!$patientId) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Invalid patient ID."));
    exit;
}

try {
    // Fetch patient basic information
    $stmt = $pdo->prepare("
        SELECT 
            id,
            first_name,
            last_name,
            email,
            phone_country_code,
            phone_number,
            dob,
            sex,
            address_line1,
            nationality,
            zip_code,
            state,
            created_at,
            updated_at
        FROM patients
        WHERE id = ? AND doctor_id = ?
    ");
    
    $stmt->execute(array($patientId, $doctorId));
    $patient = $stmt->fetch();

    if (!$patient) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Patient not found."));
        exit;
    }

    // Fetch patient conditions
    $stmt = $pdo->prepare("
        SELECT condition_code, detail
        FROM patient_conditions
        WHERE patient_id = ?
    ");
    $stmt->execute(array($patientId));
    $conditions = $stmt->fetchAll();

    // Fetch patient medications
    $stmt = $pdo->prepare("
        SELECT medication_name, reason_for_medication
        FROM patient_medications
        WHERE patient_id = ?
    ");
    $stmt->execute(array($patientId));
    $medications = $stmt->fetchAll();

    // Fetch patient allergies
    $stmt = $pdo->prepare("
        SELECT allergy_code, detail
        FROM patient_allergies
        WHERE patient_id = ?
    ");
    $stmt->execute(array($patientId));
    $allergies = $stmt->fetchAll();

    // Fetch patient emergency contacts
    $stmt = $pdo->prepare("
        SELECT contact_first_name, contact_last_name, contact_email, relationship, phone_country_code, phone_number
        FROM patient_emergency_contacts
        WHERE patient_id = ?
    ");
    $stmt->execute(array($patientId));
    $emergencyContacts = $stmt->fetchAll();

    // Format response
    $firstName = '';
    if (isset($patient['first_name'])) {
        $firstName = $patient['first_name'];
    }
    $lastName = '';
    if (isset($patient['last_name'])) {
        $lastName = $patient['last_name'];
    }
    $fullName = trim($firstName . ' ' . $lastName);
    
    $phoneCountryCode = '';
    if (isset($patient['phone_country_code'])) {
        $phoneCountryCode = $patient['phone_country_code'];
    }
    $phoneNumber = '';
    if (isset($patient['phone_number'])) {
        $phoneNumber = $patient['phone_number'];
    }
    $phone = trim($phoneCountryCode . ' ' . $phoneNumber);
    
    $addressLine1 = '';
    if (isset($patient['address_line1'])) {
        $addressLine1 = $patient['address_line1'];
    }
    $patientState = '';
    if (isset($patient['state'])) {
        $patientState = $patient['state'];
    }
    $zipCode = '';
    if (isset($patient['zip_code'])) {
        $zipCode = $patient['zip_code'];
    }
    $nationality = '';
    if (isset($patient['nationality'])) {
        $nationality = $patient['nationality'];
    }
    $address = trim($addressLine1 . ', ' . $patientState . ' ' . $zipCode . ', ' . $nationality);
    
    // Calculate age
    $age = null;
    if (isset($patient['dob']) && $patient['dob']) {
        $age = date_diff(date_create($patient['dob']), date_create('today'))->y;
    }
    
    // Build conditions array
    $conditionsArray = array();
    foreach ($conditions as $condition) {
        $conditionCode = '';
        if (isset($condition['condition_code'])) {
            $conditionCode = $condition['condition_code'];
        }
        $conditionDetail = '';
        if (isset($condition['detail'])) {
            $conditionDetail = $condition['detail'];
        }
        $conditionsArray[] = array(
            'condition_name' => $conditionCode,
            'notes' => $conditionDetail,
            'diagnosed_date' => null,
            'status' => 'active'
        );
    }
    
    // Build medications array
    $medicationsArray = array();
    foreach ($medications as $medication) {
        $medicationName = '';
        if (isset($medication['medication_name'])) {
            $medicationName = $medication['medication_name'];
        }
        $reasonForMedication = '';
        if (isset($medication['reason_for_medication'])) {
            $reasonForMedication = $medication['reason_for_medication'];
        }
        $medicationsArray[] = array(
            'medication_name' => $medicationName,
            'notes' => $reasonForMedication,
            'dosage' => null,
            'frequency' => null,
            'start_date' => null,
            'end_date' => null
        );
    }
    
    // Build allergies array
    $allergiesArray = array();
    foreach ($allergies as $allergy) {
        $allergyCode = '';
        if (isset($allergy['allergy_code'])) {
            $allergyCode = $allergy['allergy_code'];
        }
        $allergyDetail = '';
        if (isset($allergy['detail'])) {
            $allergyDetail = $allergy['detail'];
        }
        $allergiesArray[] = array(
            'allergy_name' => $allergyCode,
            'notes' => $allergyDetail,
            'severity' => 'mild',
            'reaction' => null
        );
    }
    
    // Build emergency contacts array
    $emergencyContactsArray = array();
    foreach ($emergencyContacts as $contact) {
        $contactFirstName = '';
        if (isset($contact['contact_first_name'])) {
            $contactFirstName = $contact['contact_first_name'];
        }
        $contactLastName = '';
        if (isset($contact['contact_last_name'])) {
            $contactLastName = $contact['contact_last_name'];
        }
        $contactName = trim($contactFirstName . ' ' . $contactLastName);
        
        $contactEmail = '';
        if (isset($contact['contact_email'])) {
            $contactEmail = $contact['contact_email'];
        }
        $contactRelationship = '';
        if (isset($contact['relationship'])) {
            $contactRelationship = $contact['relationship'];
        }
        $contactPhoneCode = '';
        if (isset($contact['phone_country_code'])) {
            $contactPhoneCode = $contact['phone_country_code'];
        }
        $contactPhoneNumber = '';
        if (isset($contact['phone_number'])) {
            $contactPhoneNumber = $contact['phone_number'];
        }
        
        $emergencyContactsArray[] = array(
            'name' => $contactName,
            'email' => $contactEmail,
            'relationship' => $contactRelationship,
            'phone' => trim($contactPhoneCode . ' ' . $contactPhoneNumber),
            'isPrimary' => true
        );
    }
    
    // Build patient email
    $patientEmail = '';
    if (isset($patient['email'])) {
        $patientEmail = $patient['email'];
    }
    
    // Build patient dob
    $patientDob = '';
    if (isset($patient['dob'])) {
        $patientDob = $patient['dob'];
    }
    
    // Build patient sex
    $patientSex = '';
    if (isset($patient['sex'])) {
        $patientSex = $patient['sex'];
    }
    
    // Build patient created_at
    $patientCreatedAt = '';
    if (isset($patient['created_at'])) {
        $patientCreatedAt = $patient['created_at'];
    }
    
    // Build patient updated_at
    $patientUpdatedAt = '';
    if (isset($patient['updated_at'])) {
        $patientUpdatedAt = $patient['updated_at'];
    }
    
    // Build display name
    $displayName = 'Unknown Patient';
    if ($fullName !== '') {
        $displayName = $fullName;
    }

    $response = array(
        'success' => true,
        'patient' => array(
            'id' => 'P' . str_pad($patient['id'], 4, '0', STR_PAD_LEFT),
            'firstName' => $firstName,
            'lastName' => $lastName,
            'fullName' => $displayName,
            'email' => $patientEmail,
            'phone' => $phone,
            'dob' => $patientDob,
            'age' => $age,
            'sex' => $patientSex,
            'bloodType' => null,
            'address' => $address,
            'createdAt' => $patientCreatedAt,
            'updatedAt' => $patientUpdatedAt
        ),
        'conditions' => $conditionsArray,
        'medications' => $medicationsArray,
        'allergies' => $allergiesArray,
        'emergencyContacts' => $emergencyContactsArray
    );

    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Database error in get_patient_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Database error occurred.'
    ));
}
