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

// Get JSON data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Invalid JSON data"));
    exit;
}

try {
    if (isset($data['id']) && $data['id']) {
        // Update existing task
        $sql = "UPDATE doctor_tasks SET 
                title = ?,
                description = ?,
                status = ?,
                priority = ?,
                due_date = ?,
                updated_by = ?
                WHERE id = ? AND doctor_id = ?";
        
        $title = "";
        if (isset($data['title'])) {
            $title = $data['title'];
        }
        
        $description = "";
        if (isset($data['description'])) {
            $description = $data['description'];
        }
        
        $status = "pending";
        if (isset($data['status'])) {
            $status = $data['status'];
        }
        
        $priority = "medium";
        if (isset($data['priority'])) {
            $priority = $data['priority'];
        }
        
        $dueDate = null;
        if (isset($data['due_date'])) {
            $dueDate = $data['due_date'];
        }
        
        $updatedBy = "Doctor";
        if (isset($data['updated_by'])) {
            $updatedBy = $data['updated_by'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array(
            $title,
            $description,
            $status,
            $priority,
            $dueDate,
            $updatedBy,
            $data['id'],
            $doctor_id
        ));
        
        echo json_encode(array(
            'success' => true,
            'message' => 'Task updated successfully',
            'task_id' => $data['id']
        ));
    } else {
        // Create new task
        $sql = "INSERT INTO doctor_tasks (
                    doctor_id, title, description, status, priority, due_date, updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $title = "";
        if (isset($data['title'])) {
            $title = $data['title'];
        }
        
        $description = "";
        if (isset($data['description'])) {
            $description = $data['description'];
        }
        
        $status = "pending";
        if (isset($data['status'])) {
            $status = $data['status'];
        }
        
        $priority = "medium";
        if (isset($data['priority'])) {
            $priority = $data['priority'];
        }
        
        $dueDate = null;
        if (isset($data['due_date'])) {
            $dueDate = $data['due_date'];
        }
        
        $updatedBy = "Doctor";
        if (isset($data['updated_by'])) {
            $updatedBy = $data['updated_by'];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array(
            $doctor_id,
            $title,
            $description,
            $status,
            $priority,
            $dueDate,
            $updatedBy
        ));
        
        echo json_encode(array(
            'success' => true,
            'message' => 'Task created successfully',
            'task_id' => $pdo->lastInsertId()
        ));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Failed to save task: ' . $e->getMessage()
    ));
}
