<?php

header('Content-Type: application/json');

require __DIR__ . '/config_db.php';

$patient_id = 0;
if (isset($_POST["patient_id"])) {
    $patient_id = (int)$_POST["patient_id"];
}

if ($patient_id <= 0) {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Missing or invalid patient_id"));
    exit;
}

$billing_type = "";
if (isset($_POST["billing_type"])) {
    $billing_type = trim($_POST["billing_type"]);
}

$insurance_provider = "";
if (isset($_POST["insurance_provider"])) {
    $insurance_provider = trim($_POST["insurance_provider"]);
}

$insurance_number = "";
if (isset($_POST["insurance_number"])) {
    $insurance_number = trim($_POST["insurance_number"]);
}

$billing_amount = null;
if (isset($_POST["billing_amount"])) {
    $billing_amount = $_POST["billing_amount"];
}

$amount_paid = null;
if (isset($_POST["amount_paid"])) {
    $amount_paid = $_POST["amount_paid"];
}

$payment_status = "";
if (isset($_POST["payment_status"])) {
    $payment_status = trim($_POST["payment_status"]);
}

$billing_date = null;
if (isset($_POST["billing_date"])) {
    $billing_date = $_POST["billing_date"];
}

$due_date = null;
if (isset($_POST["due_date"])) {
    $due_date = $_POST["due_date"];
}

if ($billing_type === "") {
    http_response_code(400);
    echo json_encode(array("ok" => false, "error" => "Billing Type is required"));
    exit;
}

// Normalize money fields
function moneyOrNull($v) {
    if ($v === null) {
        return null;
    }
    $v = trim((string)$v);
    if ($v === "") {
        return null;
    }
    if (!is_numeric($v)) {
        return null;
    }
    return number_format((float)$v, 2, ".", "");
}

$billing_amount = moneyOrNull($billing_amount);
$amount_paid = moneyOrNull($amount_paid);

// Dates: allow NULL
if (!$billing_date || $billing_date === "") {
    $billing_date = null;
}
if (!$due_date || $due_date === "") {
    $due_date = null;
}

try {
    // Ensure the patient exists
    $chk = $pdo->prepare("SELECT id FROM patients WHERE id = ?");
    $chk->execute(array($patient_id));
    if (!$chk->fetch()) {
        http_response_code(404);
        echo json_encode(array("ok" => false, "error" => "Patient not found"));
        exit;
    }

    $sql = "UPDATE patients
            SET billing_type = :billing_type,
                insurance_provider = :insurance_provider,
                insurance_number = :insurance_number,
                billing_amount = :billing_amount,
                amount_paid = :amount_paid,
                payment_status = :payment_status,
                billing_date = :billing_date,
                due_date = :due_date,
                form_status = 'complete',
                last_step_completed = 4
            WHERE id = :patient_id";

    $insuranceProviderValue = null;
    if ($insurance_provider !== "") {
        $insuranceProviderValue = $insurance_provider;
    }
    
    $insuranceNumberValue = null;
    if ($insurance_number !== "") {
        $insuranceNumberValue = $insurance_number;
    }
    
    $paymentStatusValue = null;
    if ($payment_status !== "") {
        $paymentStatusValue = $payment_status;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array(
        ":billing_type" => $billing_type,
        ":insurance_provider" => $insuranceProviderValue,
        ":insurance_number" => $insuranceNumberValue,
        ":billing_amount" => $billing_amount,
        ":amount_paid" => $amount_paid,
        ":payment_status" => $paymentStatusValue,
        ":billing_date" => $billing_date,
        ":due_date" => $due_date,
        ":patient_id" => $patient_id
    ));

    echo json_encode(array("ok" => true));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => $e->getMessage()));
}
