<?php
require __DIR__ . "/config_db.php";

session_start();
header("Content-Type: application/json");

// Check if user is authenticated
if (!isset($_SESSION["doctor_id"])) {
    http_response_code(401);
    echo json_encode(array("ok" => false, "message" => "Not authenticated."));
    exit;
}

$doctorId = (int) $_SESSION["doctor_id"];

try {
    // Fetch patients for this doctor, ordered by most recent first
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
            created_at
        FROM patients
        WHERE doctor_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ");
    
    $stmt->execute(array($doctorId));
    $patients = $stmt->fetchAll();

    // Format the response
    $formattedPatients = array();
    foreach ($patients as $patient) {
        $firstName = isset($patient['first_name']) ? $patient['first_name'] : '';
        $lastName = isset($patient['last_name']) ? $patient['last_name'] : '';
        $fullName = trim($firstName . ' ' . $lastName);
        if ($fullName === '') {
            $fullName = 'Unknown Patient';
        }
        
        $phoneCode = isset($patient['phone_country_code']) ? $patient['phone_country_code'] : '';
        $phoneNum = isset($patient['phone_number']) ? $patient['phone_number'] : '';
        $phone = trim($phoneCode . $phoneNum);
        
        $email = isset($patient['email']) ? $patient['email'] : '';
        $createdAt = isset($patient['created_at']) ? $patient['created_at'] : '';
        
        $formattedPatients[] = array(
            'id' => 'P' . str_pad($patient['id'], 4, '0', STR_PAD_LEFT),
            'name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'dateAdded' => $createdAt,
            'status' => 'active'
        );
    }

    echo json_encode(array(
        'ok' => true,
        'data' => $formattedPatients,
        'count' => count($formattedPatients)
    ));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        'ok' => false,
        'message' => 'Database error'
    ));
}
