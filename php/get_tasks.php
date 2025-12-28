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

// Get filter parameter (today, upcoming, all)
$filter = "all";
if (isset($_GET['filter'])) {
    $filter = $_GET['filter'];
}

try {
    // Create tasks table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS doctor_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(255),
        INDEX idx_doctor_tasks_doctor_id (doctor_id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Build query based on filter
    $sql = "SELECT * FROM doctor_tasks WHERE doctor_id = ?";
    $params = array($doctor_id);
    
    if ($filter === 'today') {
        $sql = $sql . " AND DATE(due_date) = CURDATE()";
    } elseif ($filter === 'upcoming') {
        $sql = $sql . " AND DATE(due_date) >= CURDATE() AND status != 'completed' AND status != 'cancelled'";
    }
    
    $sql = $sql . " ORDER BY 
        CASE status 
            WHEN 'in_progress' THEN 1 
            WHEN 'pending' THEN 2 
            WHEN 'completed' THEN 3 
            WHEN 'cancelled' THEN 4 
        END,
        CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
        END,
        due_date ASC,
        created_at DESC
        LIMIT 50";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll();

    // Get count by status
    $stmt = $pdo->prepare("
        SELECT 
            status,
            COUNT(*) as count 
        FROM doctor_tasks 
        WHERE doctor_id = ? 
        GROUP BY status
    ");
    $stmt->execute(array($doctor_id));
    $statusCounts = array();
    $rows = $stmt->fetchAll();
    foreach ($rows as $row) {
        $statusCounts[$row['status']] = (int)$row['count'];
    }

    echo json_encode(array(
        'ok' => true,
        'tasks' => $tasks,
        'statusCounts' => $statusCounts,
        'total' => count($tasks)
    ));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'ok' => false,
        'error' => 'Failed to fetch tasks: ' . $e->getMessage()
    ));
}
