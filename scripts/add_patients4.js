// Theme toggle functionality
(function initTheme() {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  
  if (!themeToggle || !themeIcon) {
    return;
  }
  
  const savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener("click", function() {
    const currentTheme = root.getAttribute("data-theme") || "light";
    let newTheme;
    if (currentTheme === "dark") {
      newTheme = "light";
    } else {
      newTheme = "dark";
    }
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
  
  function updateThemeIcon(theme) {
    const sunIcon = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
    const moonIcon = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";
    const pathEl = themeIcon.querySelector("path");
    if (pathEl) {
      if (theme === "dark") {
        pathEl.setAttribute("d", moonIcon);
      } else {
        pathEl.setAttribute("d", sunIcon);
      }
    }
  }
})();

// IndexedDB for retrieving scan files 
const ScanStorage = {
  dbName: "PatientScansDB",
  storeName: "scans",
  
  open: function() {
    const self = this;
    return new Promise(function(resolve, reject) {
      const request = indexedDB.open(self.dbName, 1);
      request.onerror = function() {
        reject(request.error);
      };
      request.onsuccess = function() {
        resolve(request.result);
      };
      request.onupgradeneeded = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(self.storeName)) {
          db.createObjectStore(self.storeName, { keyPath: "id", autoIncrement: true });
        }
      };
    });
  },
  
  getScans: function() {
    const self = this;
    return this.open().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(self.storeName, "readonly");
        const store = tx.objectStore(self.storeName);
        const request = store.getAll();
        request.onsuccess = function() {
          resolve(request.result);
        };
        request.onerror = function() {
          reject(request.error);
        };
      });
    }).catch(function() {
      return [];
    });
  },
  
  clear: function() {
    const self = this;
    return this.open().then(function(db) {
      const tx = db.transaction(self.storeName, "readwrite");
      const store = tx.objectStore(self.storeName);
      store.clear();
    }).catch(function() {
      // Ignore errors
    });
  }
};


function uploadPatientScans(patientId, statusMsg) {
  return ScanStorage.getScans().then(function(scans) {
    if (!scans || scans.length === 0) {
      return { uploaded: 0, failed: 0 };
    }
    
    let uploaded = 0;
    let failed = 0;
    const totalScans = scans.length;
    
    // Create a sequential upload chain
    function uploadNext(index) {
      if (index >= scans.length) {
        // clear IndexedDB
        return ScanStorage.clear().then(function() {
          return { uploaded: uploaded, failed: failed };
        });
      }
      
      const scan = scans[index];
      const formData = new FormData();
      formData.append("patient_id", patientId);
      formData.append("scan", scan.file);
      formData.append("scan_type", scan.scanType || "other");
      formData.append("scan_name", scan.description || scan.fileName);
      formData.append("description", scan.description || "");
      formData.append("scan_date", scan.scanDate || "");
      
      return fetch("../php/upload_scan.php", {
        method: "POST",
        body: formData
      })
      .then(function(res) {
        return res.json().catch(function() { return null; }).then(function(data) {
          if (res.ok && data && data.ok) {
            uploaded++;
            if (statusMsg) {
              statusMsg.textContent = "Uploading scans... (" + uploaded + "/" + totalScans + ")";
            }
          } else {
            failed++;
          }
          return uploadNext(index + 1);
        });
      })
      .catch(function(err) {
        console.error("Scan upload error:", err);
        failed++;
        return uploadNext(index + 1);
      });
    }
    
    return uploadNext(0);
  });
}

// Initialize Flatpickr datepickers
document.addEventListener("DOMContentLoaded", function() {
  if (typeof flatpickr !== "undefined") {
    // Billing date picker
    flatpickr("#billingDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      allowInput: true,
      disableMobile: true
    });
    
    // Due date picker
    flatpickr("#dueDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      minDate: "today",
      allowInput: true,
      disableMobile: true
    });
  }
});

(function () {
  loadDoctorName();
  
  const form = document.getElementById("billingForm");
  const statusMsg = document.getElementById("statusMsg");
  const saveBtn = document.getElementById("saveBtn");

  // Load data from previous steps
  const personalInfo = JSON.parse(sessionStorage.getItem("patientPersonalInfo") || "{}");
  const medicalHistory = JSON.parse(sessionStorage.getItem("patientMedicalHistory") || "{}");
  const emergencyContact = JSON.parse(sessionStorage.getItem("patientEmergencyContact") || "{}");

  // Check if we have the required data
  if (!personalInfo.firstName) {
    statusMsg.textContent = "⚠️ No patient data found. Please start from Step 1.";
    saveBtn.disabled = true;
    setTimeout(function() {
      window.location.href = "./add_patient.html";
    }, 2000);
    return;
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const billingTypeEl = document.getElementById("billingType");
    const billingType = billingTypeEl ? billingTypeEl.value.trim() : "";
    
    if (!billingType) {
      statusMsg.textContent = "❌ Billing Type is required.";
      return;
    }

    // Collect all patient data
    const patientData = {
      personalInfo: personalInfo,
      medicalHistory: medicalHistory,
      emergencyContact: emergencyContact
    };

    saveBtn.disabled = true;
    statusMsg.textContent = "Saving patient record…";

    // Save patient record first
    fetch("../php/save_patient.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patientData)
    })
    .then(function(patientRes) {
      return patientRes.json().catch(function() { return null; }).then(function(patientDataResult) {
        return { res: patientRes, data: patientDataResult };
      });
    })
    .then(function(result) {
      const patientRes = result.res;
      const patientDataResult = result.data;

      if (!patientRes.ok || !patientDataResult || !patientDataResult.ok) {
        let msg;
        if (patientDataResult && patientDataResult.error) {
          msg = patientDataResult.error;
        } else {
          msg = "Save failed.";
        }
        statusMsg.textContent = "X " + msg;
        saveBtn.disabled = false;
        return Promise.reject("save_failed");
      }

      const patient_id = patientDataResult.patient_id;

      // Now save billing information if we have the patient_id
      const billingFormData = new FormData(form);
      billingFormData.set("patient_id", patient_id);

      return fetch("../php/save_patient_billing.php", {
        method: "POST",
        body: billingFormData
      })
      .then(function(billingRes) {
        return billingRes.json().catch(function() { return null; }).then(function(billingData) {
          return { 
            patient_id: patient_id, 
            billingOk: billingRes.ok && billingData && billingData.ok 
          };
        });
      });
    })
    .then(function(billingResult) {
      const patient_id = billingResult.patient_id;
      const billingOk = billingResult.billingOk;
      
      // Upload medical scans if any were added
      let scanPromise;
      if (medicalHistory.hasScans) {
        statusMsg.textContent = "Uploading medical scans...";
        scanPromise = uploadPatientScans(patient_id, statusMsg);
      } else {
        scanPromise = Promise.resolve({ uploaded: 0, failed: 0 });
      }
      
      return scanPromise.then(function(scanResult) {
        // Build status message
        const statusParts = [];
        statusParts.push("✅ Patient saved");
        
        if (billingOk) {
          statusParts.push("billing saved");
        } else {
          statusParts.push("billing save failed");
        }
        
        if (scanResult.uploaded > 0) {
          statusParts.push(scanResult.uploaded + " scan(s) uploaded");
        }
        if (scanResult.failed > 0) {
          statusParts.push(scanResult.failed + " scan(s) failed");
        }
        
        statusMsg.textContent = statusParts.join(", ") + "!";

        // Clear sessionStorage
        sessionStorage.removeItem("patientPersonalInfo");
        sessionStorage.removeItem("patientMedicalHistory");
        sessionStorage.removeItem("patientEmergencyContact");

        
        setTimeout(function() {
          window.location.href = "patients.html";
        }, 2000);
      });
    })
    .catch(function(err) {
      if (err !== "save_failed") {
        statusMsg.textContent = " Network error: " + err.message;
        saveBtn.disabled = false;
      }
    });
  });
})();

function loadDoctorName() {
  const target = document.querySelector("[data-doctor-name]");
  if (!target) {
    return;
  }

  fetch("../php/me.php", { credentials: "same-origin" })
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok && result.data.ok && result.data.name) {
        target.textContent = result.data.name;
      }
    })
    .catch(function() {});
}
