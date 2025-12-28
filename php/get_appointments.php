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

// Auto-create appointments table if not exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            patient_id INT NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            duration INT DEFAULT 30 COMMENT 'Duration in minutes',
            status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
            appointment_type VARCHAR(50) DEFAULT 'checkup',
            reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_doctor_date (doctor_id, appointment_date),
            INDEX idx_patient (patient_id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (PDOException $e) {
    // Table might already exist, continue
}

// Get filter parameter
$filter = "week";
if (isset($_GET['filter'])) {
    $filter = $_GET['filter'];
}

// Build WHERE clause based on filter
$whereDate = "";
if ($filter === 'today') {
    $whereDate = "AND appointment_date = CURDATE()";
} elseif ($filter === 'week') {
    $whereDate = "AND appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
} elseif ($filter === 'month') {
    $whereDate = "AND appointment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
} elseif ($filter === 'all') {
    $whereDate = "";
} else {
    $whereDate = "";
}

try {
    // Get appointments with patient details
    $sql = "SELECT 
                a.*,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.email as patient_email,
                p.phone_number as patient_phone,
                p.sex as patient_gender
            FROM appointments a
            INNER JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ? " . $whereDate . "
            ORDER BY 
                CASE a.status
                    WHEN 'scheduled' THEN 1
                    WHEN 'completed' THEN 2
                    WHEN 'cancelled' THEN 3
                    WHEN 'no_show' THEN 4
                END,
                a.appointment_date ASC,
                a.appointment_time ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array($doctor_id));
    $appointments = $stmt->fetchAll();
    
    // Get status counts
    $countSql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show
                FROM appointments
                WHERE doctor_id = ? " . $whereDate;
    
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute(array($doctor_id));
    $counts = $countStmt->fetch();
    
    echo json_encode(array(
        'success' => true,
        'appointments' => $appointments,
        'counts' => $counts
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Failed to fetch appointments: ' . $e->getMessage()
    ));
}
