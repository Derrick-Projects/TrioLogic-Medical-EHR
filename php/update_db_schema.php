<?php
require_once 'config_db.php';

try {
    echo "Starting database schema update...\n\n";

    // Create patient_vital_signs table
    echo "Creating patient_vital_signs table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS patient_vital_signs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        blood_pressure_systolic INT NULL COMMENT 'mmHg',
        blood_pressure_diastolic INT NULL COMMENT 'mmHg',
        heart_rate INT NULL COMMENT 'bpm',
        temperature DECIMAL(4,1) NULL COMMENT 'Celsius',
        oxygen_saturation INT NULL COMMENT '%',
        respiratory_rate INT NULL COMMENT 'breaths per minute',
        weight DECIMAL(5,2) NULL COMMENT 'kg',
        height DECIMAL(5,2) NULL COMMENT 'cm',
        bmi DECIMAL(4,1) NULL COMMENT 'calculated or manual',
        recorded_by INT NOT NULL COMMENT 'doctor_id',
        recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_patient_vital_signs_patient_id (patient_id),
        INDEX idx_patient_vital_signs_recorded_at (recorded_at),
        CONSTRAINT fk_patient_vital_signs_patient
            FOREIGN KEY (patient_id) REFERENCES patients(id)
            ON DELETE CASCADE,
        CONSTRAINT fk_patient_vital_signs_doctor
            FOREIGN KEY (recorded_by) REFERENCES doctors(id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "✓ patient_vital_signs table created successfully\n\n";

    // Create patient_prescriptions table
    echo "Creating patient_prescriptions table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS patient_prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100) NOT NULL COMMENT 'e.g., 500mg, 10ml',
        frequency VARCHAR(100) NOT NULL COMMENT 'e.g., twice daily, every 8 hours',
        duration VARCHAR(100) NULL COMMENT 'e.g., 7 days, 2 weeks',
        start_date DATE NOT NULL,
        end_date DATE NULL,
        notes TEXT NULL,
        prescribed_by INT NOT NULL COMMENT 'doctor_id',
        status ENUM('active', 'completed', 'discontinued') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_prescriptions_patient_id (patient_id),
        INDEX idx_patient_prescriptions_status (status),
        INDEX idx_patient_prescriptions_dates (start_date, end_date),
        CONSTRAINT fk_patient_prescriptions_patient
            FOREIGN KEY (patient_id) REFERENCES patients(id)
            ON DELETE CASCADE,
        CONSTRAINT fk_patient_prescriptions_doctor
            FOREIGN KEY (prescribed_by) REFERENCES doctors(id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "✓ patient_prescriptions table created successfully\n\n";

    // Create patient_clinical_notes table
    echo "Creating patient_clinical_notes table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS patient_clinical_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        note_title VARCHAR(255) NULL,
        note_content TEXT NOT NULL,
        note_type ENUM('visit', 'observation', 'diagnosis', 'treatment', 'other') NOT NULL DEFAULT 'visit',
        written_by INT NOT NULL COMMENT 'doctor_id',
        note_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_clinical_notes_patient_id (patient_id),
        INDEX idx_patient_clinical_notes_date (note_date),
        INDEX idx_patient_clinical_notes_type (note_type),
        CONSTRAINT fk_patient_clinical_notes_patient
            FOREIGN KEY (patient_id) REFERENCES patients(id)
            ON DELETE CASCADE,
        CONSTRAINT fk_patient_clinical_notes_doctor
            FOREIGN KEY (written_by) REFERENCES doctors(id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "patient_clinical_notes table created successfully\n\n";

    echo "Database schema update completed successfully!\n";
    echo "All tables have been created.\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
