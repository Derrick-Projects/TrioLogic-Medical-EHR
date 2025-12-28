<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

$host = "127.0.0.1";
$dbname = "health_record";
$user = "root";
$pass = "";

try {
    $pdo = new PDO(
        "mysql:host=" . $host . ";dbname=" . $dbname . ";charset=utf8mb4",
        $user,
        $pass,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        )
    );
} catch (PDOException $e) {
    die("DB connection failed: " . $e->getMessage() . PHP_EOL);
}


//   Helpers existence checks
function tableExists($pdo, $table) {
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.TABLES
                           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
    $stmt->execute(array($table));
    return (bool)$stmt->fetchColumn();
}

function columnExists($pdo, $table, $column) {
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.COLUMNS
                           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
    $stmt->execute(array($table, $column));
    return (bool)$stmt->fetchColumn();
}

function indexExists($pdo, $table, $indexName) {
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.STATISTICS
                           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?");
    $stmt->execute(array($table, $indexName));
    return (bool)$stmt->fetchColumn();
}

function fkExists($pdo, $table, $constraintName) {
    $stmt = $pdo->prepare("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
                           WHERE TABLE_SCHEMA = DATABASE()
                             AND TABLE_NAME = ?
                             AND CONSTRAINT_NAME = ?
                             AND CONSTRAINT_TYPE = 'FOREIGN KEY'");
    $stmt->execute(array($table, $constraintName));
    return (bool)$stmt->fetchColumn();
}

function run($pdo, $sql, &$log, $label) {
    $pdo->exec($sql);
    $log[] = "✅ " . $label;
}

function skip(&$log, $label) {
    $log[] = "↪️  Skipped: " . $label;
}


// Schema updates

$log = array();

try {
    // A) doctors: unique indexes
    if (!indexExists($pdo, 'doctors', 'uq_doctors_username')) {
        run($pdo, "ALTER TABLE doctors ADD UNIQUE KEY uq_doctors_username (username)", $log, "doctors: added uq_doctors_username");
    } else {
        skip($log, "doctors: uq_doctors_username already exists");
    }

    if (!indexExists($pdo, 'doctors', 'uq_doctors_email')) {
        run($pdo, "ALTER TABLE doctors ADD UNIQUE KEY uq_doctors_email (email)", $log, "doctors: added uq_doctors_email");
    } else {
        skip($log, "doctors: uq_doctors_email already exists");
    }

    // B) email_verifications: indexes + FK + columns
    if (!indexExists($pdo, 'email_verifications', 'uq_email_verifications_token')) {
        run($pdo, "ALTER TABLE email_verifications ADD UNIQUE KEY uq_email_verifications_token (token)", $log, "email_verifications: added uq_email_verifications_token");
    } else {
        skip($log, "email_verifications: uq_email_verifications_token already exists");
    }

    if (!indexExists($pdo, 'email_verifications', 'idx_email_verifications_doctor_id')) {
        run($pdo, "ALTER TABLE email_verifications ADD INDEX idx_email_verifications_doctor_id (doctor_id)", $log, "email_verifications: added idx_email_verifications_doctor_id");
    } else {
        skip($log, "email_verifications: idx_email_verifications_doctor_id already exists");
    }

    if (!fkExists($pdo, 'email_verifications', 'fk_email_verifications_doctor')) {
        run($pdo, "ALTER TABLE email_verifications
                   ADD CONSTRAINT fk_email_verifications_doctor
                   FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                   ON DELETE CASCADE", $log, "email_verifications: added FK to doctors");
    } else {
        skip($log, "email_verifications: fk_email_verifications_doctor already exists");
    }

    if (!columnExists($pdo, 'email_verifications', 'created_at')) {
        run($pdo, "ALTER TABLE email_verifications ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP", $log, "email_verifications: added created_at");
    } else {
        skip($log, "email_verifications: created_at already exists");
    }

    if (!columnExists($pdo, 'email_verifications', 'verified_at')) {
        run($pdo, "ALTER TABLE email_verifications ADD COLUMN verified_at DATETIME NULL", $log, "email_verifications: added verified_at");
    } else {
        skip($log, "email_verifications: verified_at already exists");
    }

    // C) password_resets: indexes + FK + columns
    if (!indexExists($pdo, 'password_resets', 'uq_password_resets_token')) {
        run($pdo, "ALTER TABLE password_resets ADD UNIQUE KEY uq_password_resets_token (token)", $log, "password_resets: added uq_password_resets_token");
    } else {
        skip($log, "password_resets: uq_password_resets_token already exists");
    }

    if (!indexExists($pdo, 'password_resets', 'idx_password_resets_doctor_id')) {
        run($pdo, "ALTER TABLE password_resets ADD INDEX idx_password_resets_doctor_id (doctor_id)", $log, "password_resets: added idx_password_resets_doctor_id");
    } else {
        skip($log, "password_resets: idx_password_resets_doctor_id already exists");
    }

    if (!fkExists($pdo, 'password_resets', 'fk_password_resets_doctor')) {
        run($pdo, "ALTER TABLE password_resets
                   ADD CONSTRAINT fk_password_resets_doctor
                   FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                   ON DELETE CASCADE", $log, "password_resets: added FK to doctors");
    } else {
        skip($log, "password_resets: fk_password_resets_doctor already exists");
    }

    if (!columnExists($pdo, 'password_resets', 'created_at')) {
        run($pdo, "ALTER TABLE password_resets ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP", $log, "password_resets: added created_at");
    } else {
        skip($log, "password_resets: created_at already exists");
    }

    if (!columnExists($pdo, 'password_resets', 'used_at')) {
        run($pdo, "ALTER TABLE password_resets ADD COLUMN used_at DATETIME NULL", $log, "password_resets: added used_at");
    } else {
        skip($log, "password_resets: used_at already exists");
    }

    // D) patients: index + FK to doctors
    if (!indexExists($pdo, 'patients', 'idx_patients_doctor_id')) {
        run($pdo, "ALTER TABLE patients ADD INDEX idx_patients_doctor_id (doctor_id)", $log, "patients: added idx_patients_doctor_id");
    } else {
        skip($log, "patients: idx_patients_doctor_id already exists");
    }

    if (!fkExists($pdo, 'patients', 'fk_patients_doctor')) {
        run($pdo, "ALTER TABLE patients
                   ADD CONSTRAINT fk_patients_doctor
                   FOREIGN KEY (doctor_id) REFERENCES doctors(id)
                   ON DELETE CASCADE", $log, "patients: added FK to doctors");
    } else {
        skip($log, "patients: fk_patients_doctor already exists");
    }

    // E) patients: Step 1 additions (add one column at a time to avoid failures)
    //    - rename country -> nationality if needed
    if (columnExists($pdo, 'patients', 'country') && !columnExists($pdo, 'patients', 'nationality')) {
        run($pdo, "ALTER TABLE patients CHANGE country nationality VARCHAR(100) NULL", $log, "patients: renamed country to nationality");
    }

    $patientCols = [
        "email VARCHAR(255) NULL",
        "phone_country_code VARCHAR(10) NULL",
        "phone_number VARCHAR(30) NULL",
        "nationality VARCHAR(100) NULL",
        "state VARCHAR(100) NULL",
        "address_line1 VARCHAR(255) NULL",
        "zip_code VARCHAR(20) NULL",
        "reason_for_visit TEXT NULL",
        "form_status ENUM('draft','complete') NOT NULL DEFAULT 'draft'",
        "last_step_completed TINYINT UNSIGNED NOT NULL DEFAULT 0",
        "no_known_allergies TINYINT(1) NOT NULL DEFAULT 0",
        "no_surgeries TINYINT(1) NOT NULL DEFAULT 0",
        "no_medication TINYINT(1) NOT NULL DEFAULT 0",
    ];

    foreach ($patientCols as $def) {
        $colName = trim(explode(' ', $def)[0]);
        if (!columnExists($pdo, 'patients', $colName)) {
            run($pdo, "ALTER TABLE patients ADD COLUMN $def", $log, "patients: added $colName");
        } else {
            skip($log, "patients: $colName already exists");
        }
    }

    // F) Step 2/3 tables
    if (!tableExists($pdo, 'patient_conditions')) {
        run($pdo, "CREATE TABLE patient_conditions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            condition_code VARCHAR(50) NOT NULL,
            detail VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_patient_condition (patient_id, condition_code),
            INDEX idx_patient_conditions_patient_id (patient_id),
            CONSTRAINT fk_patient_conditions_patient
              FOREIGN KEY (patient_id) REFERENCES patients(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", $log, "created patient_conditions");
    } else {
        skip($log, "patient_conditions already exists");
    }

    if (!tableExists($pdo, 'patient_allergies')) {
        run($pdo, "CREATE TABLE patient_allergies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            allergy_code VARCHAR(50) NOT NULL,
            detail VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_patient_allergy (patient_id, allergy_code),
            INDEX idx_patient_allergies_patient_id (patient_id),
            CONSTRAINT fk_patient_allergies_patient
              FOREIGN KEY (patient_id) REFERENCES patients(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", $log, "created patient_allergies");
    } else {
        skip($log, "patient_allergies already exists");
    }

    if (!tableExists($pdo, 'patient_surgeries')) {
        run($pdo, "CREATE TABLE patient_surgeries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            surgery_detail TEXT NOT NULL,
            surgery_date DATE NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_patient_surgeries_patient_id (patient_id),
            CONSTRAINT fk_patient_surgeries_patient
              FOREIGN KEY (patient_id) REFERENCES patients(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", $log, "created patient_surgeries");
    } else {
        skip($log, "patient_surgeries already exists");
    }

    if (!tableExists($pdo, 'patient_medications')) {
        run($pdo, "CREATE TABLE patient_medications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            medication_name VARCHAR(255) NOT NULL,
            reason_for_medication VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_patient_medications_patient_id (patient_id),
            CONSTRAINT fk_patient_medications_patient
              FOREIGN KEY (patient_id) REFERENCES patients(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", $log, "created patient_medications");
    } else {
        skip($log, "patient_medications already exists");
    }

    if (!tableExists($pdo, 'patient_emergency_contacts')) {
        run($pdo, "CREATE TABLE patient_emergency_contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            contact_first_name VARCHAR(255) NULL,
            contact_last_name VARCHAR(255) NULL,
            contact_email VARCHAR(255) NULL,
            relationship VARCHAR(100) NULL,
            phone_country_code VARCHAR(10) NULL,
            phone_number VARCHAR(30) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_patient_emergency_contacts_patient_id (patient_id),
            CONSTRAINT fk_patient_emergency_contacts_patient
              FOREIGN KEY (patient_id) REFERENCES patients(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", $log, "created patient_emergency_contacts");
    } else {
        skip($log, "patient_emergency_contacts already exists");
    }

    // G) Patient Scans table for X-rays, MRI, CT scans, etc.
    if (!tableExists($pdo, 'patient_scans')) {
        run($pdo, "CREATE TABLE patient_scans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            scan_type VARCHAR(50) NOT NULL COMMENT 'xray, mri, ct, ultrasound, other',
            scan_name VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INT UNSIGNED NULL,
            mime_type VARCHAR(100) NULL,
            description TEXT NULL,
            scan_date DATE NULL,
            uploaded_by INT NULL COMMENT 'doctor_id who uploaded',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_patient_scans_patient_id (patient_id),
            INDEX idx_patient_scans_type (scan_type),
            CONSTRAINT fk_patient_scans_patient
              FOREIGN KEY (patient_id) REFERENCES patients(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", $log, "created patient_scans");
    } else {
        skip($log, "patient_scans already exists");
    }

    echo "✅ Schema update finished.\n\n";
    echo implode("\n", $log) . "\n";

} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Last actions:\n" . implode("\n", array_slice($log, -10)) . "\n";
}
