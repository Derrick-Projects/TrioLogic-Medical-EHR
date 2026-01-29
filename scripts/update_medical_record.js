// Theme initialization
(function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();

// Get patient ID from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

// Store selected files for upload
let selectedFiles = [];

// DOM Ready
document.addEventListener("DOMContentLoaded", function() {
  loadDoctorInfo();

  if (!patientId) {
    showToast("No patient ID provided", "error");
    setTimeout(() => window.location.href = "patients.html", 2000);
    return;
  }

  initializePage();
});

// Initialize all components
function initializePage() {
  loadPatientName();
  loadMedicalRecords();
  setupTabs();
  setupForms();
  setupDatePickers();
  setupFileUpload();
  setupBMICalculation();
  setupThemeToggle();
  setupLogout();
}

// Load doctor info for topbar
function loadDoctorInfo() {
  fetch("../php/me.php")
    .then(res => res.json())
    .then(data => {
      if (data.ok && data.name) {
        const nameEl = document.querySelector('[data-doctor-name]');
        if (nameEl) {
          nameEl.textContent = data.name;
        }
      }
    })
    .catch(err => console.error("Error loading doctor info:", err));
}

// Load patient name for header
function loadPatientName() {
  fetch("../php/get_patient_details.php?id=" + encodeURIComponent(patientId))
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById("patientName").textContent = data.patient.fullName;
      }
    })
    .catch(err => console.error("Error loading patient name:", err));
}

// Setup tab switching
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", function() {
      const targetPanel = this.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("is-active"));
      panels.forEach(p => p.classList.remove("is-active"));

      this.classList.add("is-active");
      document.getElementById(targetPanel + "-panel").classList.add("is-active");
    });
  });
}

// Setup Flatpickr date pickers
function setupDatePickers() {
  flatpickr("#recorded_at", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    defaultDate: new Date(),
    time_24hr: true
  });

  flatpickr("#scan_date", {
    dateFormat: "Y-m-d"
  });

  flatpickr("#note_date", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    defaultDate: new Date(),
    time_24hr: true
  });

  flatpickr("#start_date", {
    dateFormat: "Y-m-d",
    defaultDate: new Date()
  });

  flatpickr("#end_date", {
    dateFormat: "Y-m-d"
  });
}

// Auto-calculate BMI
function setupBMICalculation() {
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const bmiInput = document.getElementById("bmi");

  function calculateBMI() {
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);

    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      bmiInput.value = bmi.toFixed(1);
    } else {
      bmiInput.value = "";
    }
  }

  weightInput.addEventListener("input", calculateBMI);
  heightInput.addEventListener("input", calculateBMI);
}

// Setup form submissions
function setupForms() {
  document.getElementById("vitalsForm").addEventListener("submit", function(e) {
    e.preventDefault();
    saveVitalSigns();
  });

  document.getElementById("scansForm").addEventListener("submit", function(e) {
    e.preventDefault();
    uploadScans();
  });

  document.getElementById("notesForm").addEventListener("submit", function(e) {
    e.preventDefault();
    saveClinicalNote();
  });

  document.getElementById("prescriptionsForm").addEventListener("submit", function(e) {
    e.preventDefault();
    savePrescription();
  });
}

// Save vital signs
function saveVitalSigns() {
  const data = {
    patient_id: patientId,
    blood_pressure_systolic: document.getElementById("bp_systolic").value || null,
    blood_pressure_diastolic: document.getElementById("bp_diastolic").value || null,
    heart_rate: document.getElementById("heart_rate").value || null,
    temperature: document.getElementById("temperature").value || null,
    oxygen_saturation: document.getElementById("oxygen_saturation").value || null,
    respiratory_rate: document.getElementById("respiratory_rate").value || null,
    weight: document.getElementById("weight").value || null,
    height: document.getElementById("height").value || null,
    bmi: document.getElementById("bmi").value || null,
    notes: document.getElementById("vital_notes").value || null,
    recorded_at: document.getElementById("recorded_at").value || null
  };

  // Validate at least one field is filled
  const hasData = Object.entries(data).some(([key, val]) => key !== 'patient_id' && val !== null && val !== '');
  if (!hasData) {
    showToast("Please enter at least one vital sign", "error");
    return;
  }

  fetch("../php/save_vital_signs.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if (result.ok) {
      showToast("Vital signs recorded successfully", "success");
      document.getElementById("vitalsForm").reset();
      loadMedicalRecords();
    } else {
      showToast(result.error || "Failed to save vital signs", "error");
    }
  })
  .catch(err => {
    console.error("Error:", err);
    showToast("Error saving vital signs", "error");
  });
}

// Save prescription
function savePrescription() {
  const data = {
    patient_id: patientId,
    medication_name: document.getElementById("medication_name").value,
    dosage: document.getElementById("dosage").value,
    frequency: document.getElementById("frequency").value,
    duration: document.getElementById("duration").value || null,
    start_date: document.getElementById("start_date").value,
    end_date: document.getElementById("end_date").value || null,
    notes: document.getElementById("prescription_notes").value || null
  };

  fetch("../php/save_prescription.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if (result.ok) {
      showToast("Prescription saved successfully", "success");
      document.getElementById("prescriptionsForm").reset();
      loadMedicalRecords();
    } else {
      showToast(result.error || "Failed to save prescription", "error");
    }
  })
  .catch(err => {
    console.error("Error:", err);
    showToast("Error saving prescription", "error");
  });
}

// Save clinical note
function saveClinicalNote() {
  const noteContent = document.getElementById("note_content").value.trim();

  if (noteContent.length < 10) {
    showToast("Clinical note must be at least 10 characters", "error");
    return;
  }

  const data = {
    patient_id: patientId,
    note_title: document.getElementById("note_title").value || null,
    note_content: noteContent,
    note_type: document.getElementById("note_type").value,
    note_date: document.getElementById("note_date").value || null
  };

  fetch("../php/save_clinical_note.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if (result.ok) {
      showToast("Clinical note saved successfully", "success");
      document.getElementById("notesForm").reset();
      loadMedicalRecords();
    } else {
      showToast(result.error || "Failed to save note", "error");
    }
  })
  .catch(err => {
    console.error("Error:", err);
    showToast("Error saving note", "error");
  });
}

// File upload handling
function setupFileUpload() {
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("scanFileInput");
  const browseBtn = document.getElementById("browseScanBtn");

  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", function() {
    handleFiles(this.files);
  });

  uploadZone.addEventListener("dragover", function(e) {
    e.preventDefault();
    this.classList.add("dragover");
  });

  uploadZone.addEventListener("dragleave", function() {
    this.classList.remove("dragover");
  });

  uploadZone.addEventListener("drop", function(e) {
    e.preventDefault();
    this.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(files) {
  selectedFiles = Array.from(files);
  renderFilePreview();
}

function renderFilePreview() {
  const preview = document.getElementById("scanPreview");
  if (selectedFiles.length === 0) {
    preview.innerHTML = "";
    return;
  }

  let html = '<div class="file-list">';
  selectedFiles.forEach((file, index) => {
    html += `
      <div class="file-item">
        <div class="file-icon">📄</div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button type="button" class="file-remove" onclick="removeFile(${index})">✕</button>
      </div>
    `;
  });
  html += '</div>';
  preview.innerHTML = html;
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFilePreview();
}

// Upload scans to server
function uploadScans() {
  if (selectedFiles.length === 0) {
    showToast("Please select at least one file", "error");
    return;
  }

  const scanType = document.getElementById("scan_type").value;
  if (!scanType) {
    showToast("Please select scan type", "error");
    return;
  }

  const scanDate = document.getElementById("scan_date").value || null;
  const description = document.getElementById("scan_description").value || "";

  const uploadBtn = document.getElementById("uploadScanBtn");
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  uploadFilesSequentially(0);

  function uploadFilesSequentially(index) {
    if (index >= selectedFiles.length) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload Scan";
      showToast("All scans uploaded successfully", "success");
      document.getElementById("scansForm").reset();
      selectedFiles = [];
      renderFilePreview();
      loadMedicalRecords();
      return;
    }

    const file = selectedFiles[index];
    const formData = new FormData();
    formData.append("scan", file);
    formData.append("patient_id", patientId);
    formData.append("scan_type", scanType);
    formData.append("scan_name", file.name);
    if (scanDate) formData.append("scan_date", scanDate);
    if (description) formData.append("description", description);

    fetch("../php/upload_scan.php", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(result => {
      if (result.ok) {
        uploadFilesSequentially(index + 1);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    })
    .catch(err => {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload Scan";
      showToast("Error uploading " + file.name + ": " + err.message, "error");
    });
  }
}

// Load medical records history
function loadMedicalRecords() {
  fetch("../php/get_medical_records.php?patient_id=" + encodeURIComponent(patientId))
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        renderVitalsHistory(data.vital_signs || []);
        renderPrescriptionsHistory(data.prescriptions || []);
        renderNotesHistory(data.clinical_notes || []);
        renderExistingScans(data.scans || []);
      }
    })
    .catch(err => console.error("Error loading medical records:", err));
}

function renderVitalsHistory(vitals) {
  const container = document.getElementById("vitalsHistory");
  if (vitals.length === 0) {
    container.innerHTML = '<p class="no-data">No vital signs recorded yet</p>';
    return;
  }

  let html = '<div class="history-list">';
  vitals.forEach(vital => {
    html += `
      <div class="history-item">
        <div class="history-date">${formatDateTime(vital.recorded_at)}</div>
        <div class="vitals-grid">
          ${vital.blood_pressure ? `<div class="vital-stat"><span>BP:</span> ${escapeHtml(vital.blood_pressure)} mmHg</div>` : ''}
          ${vital.heart_rate ? `<div class="vital-stat"><span>HR:</span> ${escapeHtml(vital.heart_rate)} bpm</div>` : ''}
          ${vital.temperature ? `<div class="vital-stat"><span>Temp:</span> ${escapeHtml(vital.temperature)}°C</div>` : ''}
          ${vital.oxygen_saturation ? `<div class="vital-stat"><span>SpO2:</span> ${escapeHtml(vital.oxygen_saturation)}%</div>` : ''}
          ${vital.respiratory_rate ? `<div class="vital-stat"><span>RR:</span> ${escapeHtml(vital.respiratory_rate)}/min</div>` : ''}
          ${vital.weight ? `<div class="vital-stat"><span>Weight:</span> ${escapeHtml(vital.weight)} kg</div>` : ''}
          ${vital.height ? `<div class="vital-stat"><span>Height:</span> ${escapeHtml(vital.height)} cm</div>` : ''}
          ${vital.bmi ? `<div class="vital-stat"><span>BMI:</span> ${escapeHtml(vital.bmi)}</div>` : ''}
        </div>
        ${vital.notes ? `<div class="history-notes">${escapeHtml(vital.notes)}</div>` : ''}
        <div class="history-meta">Recorded by ${escapeHtml(vital.recorded_by)}</div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderPrescriptionsHistory(prescriptions) {
  const container = document.getElementById("prescriptionsHistory");
  if (prescriptions.length === 0) {
    container.innerHTML = '<p class="no-data">No prescriptions recorded yet</p>';
    return;
  }

  let html = '<div class="history-list">';
  prescriptions.forEach(rx => {
    html += `
      <div class="prescription-item">
        <div class="prescription-header">
          <div class="prescription-name">${escapeHtml(rx.medication_name)}</div>
          <span class="prescription-status ${rx.status}">${capitalize(rx.status)}</span>
        </div>
        <div class="prescription-details">
          <div class="prescription-detail"><strong>Dosage:</strong> ${escapeHtml(rx.dosage)}</div>
          <div class="prescription-detail"><strong>Frequency:</strong> ${escapeHtml(rx.frequency)}</div>
          ${rx.duration ? `<div class="prescription-detail"><strong>Duration:</strong> ${escapeHtml(rx.duration)}</div>` : ''}
          <div class="prescription-detail"><strong>Start Date:</strong> ${formatDate(rx.start_date)}</div>
          ${rx.end_date ? `<div class="prescription-detail"><strong>End Date:</strong> ${formatDate(rx.end_date)}</div>` : ''}
          ${rx.notes ? `<div class="prescription-detail"><strong>Notes:</strong> ${escapeHtml(rx.notes)}</div>` : ''}
        </div>
        <div class="prescription-meta">Prescribed by ${escapeHtml(rx.prescribed_by)}</div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderNotesHistory(notes) {
  const container = document.getElementById("notesHistory");
  if (notes.length === 0) {
    container.innerHTML = '<p class="no-data">No clinical notes recorded yet</p>';
    return;
  }

  let html = '<div class="history-list">';
  notes.forEach(note => {
    html += `
      <div class="note-item">
        <div class="note-header">
          <div class="note-title">${note.note_title ? escapeHtml(note.note_title) : 'Untitled Note'}</div>
          <span class="note-type-badge">${capitalize(note.note_type)}</span>
        </div>
        <div class="note-content">${escapeHtml(note.note_content)}</div>
        <div class="note-meta">
          <span>${formatDateTime(note.note_date)}</span>
          <span>Written by ${escapeHtml(note.written_by)}</span>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderExistingScans(scans) {
  const container = document.getElementById("existingScans");
  if (scans.length === 0) {
    container.innerHTML = '<p class="no-data">No scans uploaded yet</p>';
    return;
  }

  let html = '<div class="history-list">';
  scans.forEach(scan => {
    html += `
      <div class="scan-item">
        <div class="scan-header">
          <div class="scan-name">${escapeHtml(scan.scan_name)}</div>
          <span class="scan-type-badge">${escapeHtml(scan.scan_type).toUpperCase()}</span>
        </div>
        ${scan.description ? `<div class="scan-details">${escapeHtml(scan.description)}</div>` : ''}
        <div class="scan-meta">
          <div>${scan.scan_date ? 'Scan Date: ' + formatDate(scan.scan_date) : ''}</div>
          <div>Uploaded by ${escapeHtml(scan.uploaded_by)} on ${formatDate(scan.created_at)}</div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// Theme toggle
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
}

// Logout
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
      fetch("../php/logout.php", { method: "POST" })
        .then(() => {
          window.location.href = "login.html";
        })
        .catch(err => {
          console.error("Logout error:", err);
          window.location.href = "login.html";
        });
    });
  }
}

// Utility functions
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show " + type;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
