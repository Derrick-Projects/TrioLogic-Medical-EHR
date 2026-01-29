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

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("ok" => false, "error" => "Method not allowed"));
    exit;
}

// Validate patient_id
$patient_id = 0;
if (isset($_POST['patient_id'])) {
    $patient_id_raw = $_POST['patient_id'];
    // Handle both "P0001" format and numeric format
    if (preg_match('/^P(\d+)$/i', $patient_id_raw, $matches)) {
        $patient_id = (int)$matches[1];
    } else {
        $patient_id = (int)$patient_id_raw;
    }
}
if ($patient_id <= 0) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Invalid patient ID"));
    exit;
}

// Verify patient belongs to this doctor
$stmt = $pdo->prepare("SELECT id FROM patients WHERE id = ? AND doctor_id = ?");
$stmt->execute(array($patient_id, $doctor_id));
if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode(array("ok" => false, "error" => "Patient not found or access denied"));
    exit;
}

// Checking if file was uploaded
if (!isset($_FILES['scan']) || $_FILES['scan']['error'] !== UPLOAD_ERR_OK) {
    $error = 'No file';
    if (isset($_FILES['scan'])) {
        $error = $_FILES['scan']['error'];
    }
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "File upload failed: " . $error));
    exit;
}

$file = $_FILES['scan'];

// Validate file size (10MB max)
$maxSize = 10 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "File exceeds 10MB limit"));
    exit;
}

// Validate file type
$allowedMimes = array(
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/dicom'
);
$allowedExtensions = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'dcm');

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Allow if type matches OR extension is valid
$isValidMime = in_array($mimeType, $allowedMimes) || strpos($mimeType, 'image/') === 0;
$isValidExt = in_array($extension, $allowedExtensions);

if (!$isValidMime && !$isValidExt) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Invalid file type"));
    exit;
}

// Get additional metadata
$scanType = 'other';
if (isset($_POST['scan_type'])) {
    $scanType = trim($_POST['scan_type']);
}

$scanName = $file['name'];
if (isset($_POST['scan_name'])) {
    $scanName = trim($_POST['scan_name']);
}

$description = '';
if (isset($_POST['description'])) {
    $description = trim($_POST['description']);
}

$scanDate = null;
if (!empty($_POST['scan_date'])) {
    $scanDate = $_POST['scan_date'];
}

// Create upload directory structure
$uploadBase = __DIR__ . '/../uploads/scans';
$patientDir = $uploadBase . '/' . $patient_id;

if (!is_dir($patientDir)) {
    if (!mkdir($patientDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(array("ok" => false, "error" => "Failed to create upload directory"));
        exit;
    }
}

// Generate unique filename
$uniqueName = uniqid('scan_', true) . '.' . $extension;
$filePath = $patientDir . '/' . $uniqueName;
$relativePath = 'uploads/scans/' . $patient_id . '/' . $uniqueName;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Failed to save file"));
    exit;
}


try {
    $sql = "INSERT INTO patient_scans (
        patient_id, scan_type, scan_name, file_name, file_path, 
        file_size, mime_type, description, scan_date, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    
    $descriptionValue = null;
    if ($description !== '') {
        $descriptionValue = $description;
    }
    
    $stmt->execute(array(
        $patient_id,
        $scanType,
        $scanName,
        $file['name'],
        $relativePath,
        $file['size'],
        $mimeType,
        $descriptionValue,
        $scanDate,
        $doctor_id
    ));
    
    $scanId = $pdo->lastInsertId();
    
    echo json_encode(array(
        "ok" => true,
        "scan_id" => $scanId,
        "file_path" => $relativePath,
        "message" => "Scan uploaded successfully"
    ));
    
} catch (Exception $e) {
    // Delete uploaded file if database error
    @unlink($filePath);
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "Database error: " . $e->getMessage()));
}
