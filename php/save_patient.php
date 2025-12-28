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

// Extract personal information
$personalInfo = array();
if (isset($data['personalInfo'])) {
    $personalInfo = $data['personalInfo'];
}

$medicalHistory = array();
if (isset($data['medicalHistory'])) {
    $medicalHistory = $data['medicalHistory'];
}

$emergencyContact = array();
if (isset($data['emergencyContact'])) {
    $emergencyContact = $data['emergencyContact'];
}

// Validate required fields
$required = array('firstName', 'lastName', 'email', 'gender', 'address', 'nationality', 'zip', 'state', 'dob', 'phone');
foreach ($required as $field) {
    if (empty($personalInfo[$field])) {
        http_response_code(400);
        echo json_encode(array("ok" => false, "error" => "Missing required field: " . $field));
        exit;
    }
}

try {
    $pdo->beginTransaction();

    // Insert into patients table
    $sql = "INSERT INTO patients (
        doctor_id, 
        first_name, 
        last_name, 
        email, 
        sex, 
        address_line1, 
        nationality, 
        zip_code, 
        state, 
        dob, 
        phone_country_code,
        phone_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    
    $dialCode = '';
    if (isset($personalInfo['dialCode'])) {
        $dialCode = trim($personalInfo['dialCode']);
    }
    
    $phoneNumber = '';
    if (isset($personalInfo['phoneNumber'])) {
        $phoneNumber = trim($personalInfo['phoneNumber']);
    }
    
    $stmt->execute(array(
        $doctor_id,
        trim($personalInfo['firstName']),
        trim($personalInfo['lastName']),
        trim($personalInfo['email']),
        trim($personalInfo['gender']),
        trim($personalInfo['address']),
        trim($personalInfo['nationality']),
        trim($personalInfo['zip']),
        trim($personalInfo['state']),
        $personalInfo['dob'],
        $dialCode,
        $phoneNumber
    ));

    $patient_id = $pdo->lastInsertId();

    // Insert emergency contact if provided
    if (!empty($emergencyContact['name']) && !empty($emergencyContact['email'])) {
        // Split name into first and last name
        $nameParts = explode(' ', trim($emergencyContact['name']), 2);
        $contactFirstName = $nameParts[0];
        $contactLastName = '';
        if (isset($nameParts[1])) {
            $contactLastName = $nameParts[1];
        }
        
        $contactDialCode = '';
        if (isset($emergencyContact['dialCode'])) {
            $contactDialCode = trim($emergencyContact['dialCode']);
        }
        
        $contactPhoneNumber = '';
        if (isset($emergencyContact['phoneNumber'])) {
            $contactPhoneNumber = trim($emergencyContact['phoneNumber']);
        }
        
        $contactRelationship = '';
        if (isset($emergencyContact['relationship'])) {
            $contactRelationship = trim($emergencyContact['relationship']);
        }

        $sql = "INSERT INTO patient_emergency_contacts (
            patient_id,
            contact_first_name,
            contact_last_name,
            contact_email,
            relationship,
            phone_country_code,
            phone_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(array(
            $patient_id,
            $contactFirstName,
            $contactLastName,
            trim($emergencyContact['email']),
            $contactRelationship,
            $contactDialCode,
            $contactPhoneNumber
        ));
    }

    // Insert conditions into patient_conditions
    if (!empty($medicalHistory['conditions']) && is_array($medicalHistory['conditions'])) {
        $sql = "INSERT INTO patient_conditions (patient_id, condition_code, detail) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        foreach ($medicalHistory['conditions'] as $condition) {
            if (!empty($condition['code'])) {
                $conditionDetail = null;
                if (isset($condition['detail'])) {
                    $conditionDetail = $condition['detail'];
                }
                $stmt->execute(array(
                    $patient_id,
                    $condition['code'],
                    $conditionDetail
                ));
            }
        }
    }

    // Insert allergies into patient_allergies
    if (!empty($medicalHistory['allergies']) && is_array($medicalHistory['allergies'])) {
        $sql = "INSERT INTO patient_allergies (patient_id, allergy_code, detail) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        foreach ($medicalHistory['allergies'] as $allergy) {
            if (!empty($allergy['code'])) {
                $allergyDetail = null;
                if (isset($allergy['detail'])) {
                    $allergyDetail = $allergy['detail'];
                }
                $stmt->execute(array(
                    $patient_id,
                    $allergy['code'],
                    $allergyDetail
                ));
            }
        }
    }

    // Insert medications into patient_medications
    if (!empty($medicalHistory['medications']) && is_array($medicalHistory['medications'])) {
        $sql = "INSERT INTO patient_medications (patient_id, medication_name, reason_for_medication) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        foreach ($medicalHistory['medications'] as $medication) {
            if (!empty($medication['name'])) {
                $medicationReason = null;
                if (isset($medication['reason'])) {
                    $medicationReason = $medication['reason'];
                }
                $stmt->execute(array(
                    $patient_id,
                    $medication['name'],
                    $medicationReason
                ));
            }
        }
    }

    // Insert surgeries into patient_surgeries
    if (!empty($medicalHistory['surgeries']) && is_array($medicalHistory['surgeries'])) {
        $sql = "INSERT INTO patient_surgeries (patient_id, surgery_detail, surgery_date) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        foreach ($medicalHistory['surgeries'] as $surgery) {
            if (!empty($surgery['detail'])) {
                $surgeryDate = null;
                if (!empty($surgery['date'])) {
                    $surgeryDate = $surgery['date'];
                }
                $stmt->execute(array(
                    $patient_id,
                    $surgery['detail'],
                    $surgeryDate
                ));
            }
        }
    }

    $pdo->commit();

    echo json_encode(array(
        "ok" => true,
        "patient_id" => $patient_id,
        "message" => "Patient record saved successfully"
    ));

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Save failed: " . $e->getMessage()));
}
