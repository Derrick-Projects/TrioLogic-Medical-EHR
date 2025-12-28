<?php
session_start();
header('Content-Type: application/json');

require __DIR__ . '/config_db.php';

// Check if doctor is logged in
if (!isset($_SESSION["doctor_id"])) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Not authenticated"));
    exit;
}

$doctor_id = (int)$_SESSION["doctor_id"];

// Get JSON data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['patient_id']) || !isset($data['appointment_date']) || !isset($data['appointment_time'])) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields"));
    exit;
}

try {
    if (isset($data['id']) && $data['id']) {
        // Update existing appointment
        $sql = "UPDATE appointments SET 
                    patient_id = ?,
                    appointment_date = ?,
                    appointment_time = ?,
                    duration = ?,
                    status = ?,
                    appointment_type = ?,
                    reason = ?,
                    notes = ?
                WHERE id = ? AND doctor_id = ?";
        
        $duration = 30;
        if (isset($data['duration'])) {
            $duration = $data['duration'];
        }
        
        $status = "scheduled";
        if (isset($data['status'])) {
            $status = $data['status'];
        }
        
        $appointmentType = "checkup";
        if (isset($data['appointment_type'])) {
            $appointmentType = $data['appointment_type'];
        }
        
        $reason = "";
        if (isset($data['reason'])) {
            $reason = $data['reason'];
        }
        
        $notes = "";
        if (isset($data['notes'])) {
            $notes = $data['notes'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array(
            $data['patient_id'],
            $data['appointment_date'],
            $data['appointment_time'],
            $duration,
            $status,
            $appointmentType,
            $reason,
            $notes,
            $data['id'],
            $doctor_id
        ));
        
        echo json_encode(array(
            'success' => true,
            'message' => 'Appointment updated successfully',
            'appointment_id' => $data['id']
        ));
    } else {
        // Create new appointment
        $sql = "INSERT INTO appointments (
                    doctor_id, patient_id, appointment_date, appointment_time,
                    duration, status, appointment_type, reason, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $duration = 30;
        if (isset($data['duration'])) {
            $duration = $data['duration'];
        }
        
        $status = "scheduled";
        if (isset($data['status'])) {
            $status = $data['status'];
        }
        
        $appointmentType = "checkup";
        if (isset($data['appointment_type'])) {
            $appointmentType = $data['appointment_type'];
        }
        
        $reason = "";
        if (isset($data['reason'])) {
            $reason = $data['reason'];
        }
        
        $notes = "";
        if (isset($data['notes'])) {
            $notes = $data['notes'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array(
            $doctor_id,
            $data['patient_id'],
            $data['appointment_date'],
            $data['appointment_time'],
            $duration,
            $status,
            $appointmentType,
            $reason,
            $notes
        ));
        
        echo json_encode(array(
            'success' => true,
            'message' => 'Appointment created successfully',
            'appointment_id' => $pdo->lastInsertId()
        ));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Failed to save appointment: ' . $e->getMessage()
    ));
}
