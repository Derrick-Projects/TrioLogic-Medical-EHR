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

if (!$data || !isset($data['task_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing task_id or status"));
    exit;
}

try {
    $sql = "UPDATE doctor_tasks SET status = ? WHERE id = ? AND doctor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array($data['status'], $data['task_id'], $doctor_id));
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(array(
            'success' => true,
            'message' => 'Task status updated successfully'
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            'success' => false,
            'message' => 'Task not found or no changes made'
        ));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Failed to update task status: ' . $e->getMessage()
    ));
}
