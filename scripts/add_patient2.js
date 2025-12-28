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

//IndexedDB for storing scan files across pages 
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
  
  saveScans: function(scans) {
    const self = this;
    return this.open().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(self.storeName, "readwrite");
        const store = tx.objectStore(self.storeName);
        
        
        store.clear();
        
        
        for (let i = 0; i < scans.length; i++) {
          const scan = scans[i];
          store.add({
            file: scan.file,
            scanType: scan.scanType,
            scanDate: scan.scanDate,
            description: scan.description,
            fileName: scan.file.name,
            fileSize: scan.file.size,
            mimeType: scan.file.type
          });
        }
        
        tx.oncomplete = function() {
          resolve();
        };
        tx.onerror = function() {
          reject(tx.error);
        };
      });
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
    });
  },
  
  clear: function() {
    const self = this;
    return this.open().then(function(db) {
      const tx = db.transaction(self.storeName, "readwrite");
      const store = tx.objectStore(self.storeName);
      store.clear();
    });
  }
};

// Initialize Flatpickr datepickers
document.addEventListener("DOMContentLoaded", function() {
  if (typeof flatpickr !== "undefined") {
    // Surgery date picker
    flatpickr("#surgeryDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      maxDate: "today",
      allowInput: true,
      disableMobile: true
    });
    
    
    flatpickr("#visitDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      allowInput: true,
      disableMobile: true
    });

    // Scan date picker
    flatpickr("#scanDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      maxDate: "today",
      allowInput: true,
      disableMobile: true
    });
  }
});

// Flow navigation for step 2
document.addEventListener("DOMContentLoaded", function() {
  loadDoctorName();
  initScanUpload();
  
  const backBtn = document.getElementById("backBtn");
  const continueBtn = document.getElementById("continueBtn");
  const addMedicationBtn = document.getElementById("addMedicationBtn");

  // Add another medication row
  if (addMedicationBtn) {
    addMedicationBtn.addEventListener("click", function() {
      const container = document.getElementById("medicationsContainer");
      const newRow = document.createElement("div");
      newRow.className = "twoCol twoCol--tight medication-row";
      newRow.innerHTML = '<div class="field">' +
          '<div class="fieldLabel">Name of Medication</div>' +
          '<input class="input medication-name" type="text" placeholder="Please specify" />' +
        '</div>' +
        '<div class="field">' +
          '<div class="fieldLabel">Reason for Medication</div>' +
          '<input class="input medication-reason" type="text" placeholder="Please Specify" />' +
        '</div>';
      container.appendChild(newRow);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", function() {
      window.location.href = "./add_patient.html";
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", function() {
      // Collect conditions
      const conditions = [];
      const conditionCheckboxes = document.querySelectorAll("[data-condition]:checked");
      for (let i = 0; i < conditionCheckboxes.length; i++) {
        const cb = conditionCheckboxes[i];
        conditions.push({
          code: cb.getAttribute("data-condition"),
          detail: null
        });
      }
      
      // Collect "other" conditions
      const conditionsOther = document.getElementById("conditionsOther");
      if (conditionsOther && conditionsOther.value.trim()) {
        conditions.push({
          code: "other",
          detail: conditionsOther.value.trim()
        });
      }

      // Collect allergies
      const allergies = [];
      const allergyCheckboxes = document.querySelectorAll("[data-allergy]:checked");
      for (let j = 0; j < allergyCheckboxes.length; j++) {
        const acb = allergyCheckboxes[j];
        allergies.push({
          code: acb.getAttribute("data-allergy"),
          detail: null
        });
      }
      
      // Collect "other" allergies
      const allergiesOther = document.getElementById("allergiesOther");
      if (allergiesOther && allergiesOther.value.trim()) {
        allergies.push({
          code: "other",
          detail: allergiesOther.value.trim()
        });
      }

      // Collect medications
      const medications = [];
      const medicationRows = document.querySelectorAll(".medication-row");
      for (let k = 0; k < medicationRows.length; k++) {
        const row = medicationRows[k];
        const nameEl = row.querySelector(".medication-name");
        const reasonEl = row.querySelector(".medication-reason");
        const name = nameEl ? nameEl.value.trim() : "";
        const reason = reasonEl ? reasonEl.value.trim() : "";
        
        if (name) { 
          medications.push({
            name: name,
            reason: reason || ""
          });
        }
      }

      // Collect surgeries
      const surgeries = [];
      const surgeryDetailEl = document.getElementById("surgeryDetail");
      const surgeryDateEl = document.getElementById("surgeryDate");
      const surgeryDetail = surgeryDetailEl ? surgeryDetailEl.value.trim() : "";
      const surgeryDate = surgeryDateEl ? surgeryDateEl.value : "";
      
      if (surgeryDetail) {
        surgeries.push({
          detail: surgeryDetail,
          date: surgeryDate || null
        });
      }

      // Collect visit details
      const visitDateEl = document.getElementById("visitDate");
      const immunizedEl = document.getElementById("immunized");
      const notesEl = document.getElementById("notes");
      
      const visitDate = visitDateEl ? visitDateEl.value : null;
      const immunized = (immunizedEl && immunizedEl.checked) ? 1 : 0;
      let notes = notesEl ? notesEl.value.trim() : null;
      if (notes === "") {
        notes = null;
      }

      // Collect scans data file metadata for storage, actual files will be uploaded when patient is saved
      const scans = window.uploadedScans || [];

      // Store medical history in sessionStorage
      const scansMeta = [];
      for (let m = 0; m < scans.length; m++) {
        const s = scans[m];
        scansMeta.push({
          scanType: s.scanType,
          scanDate: s.scanDate,
          description: s.description,
          fileName: s.file.name,
          fileSize: s.file.size,
          mimeType: s.file.type
        });
      }

      const medicalHistory = {
        conditions: conditions,
        allergies: allergies,
        medications: medications,
        surgeries: surgeries,
        visitDate: visitDate,
        immunized: immunized,
        notes: notes,
        scans: scansMeta,
        hasScans: scans.length > 0,
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem("patientMedicalHistory", JSON.stringify(medicalHistory));
      
      // Save scan files to IndexedDB for retrieval on final step
      if (scans.length > 0) {
        ScanStorage.saveScans(scans).then(function() {
          window.location.href = "./add_patient3.html";
        }).catch(function(err) {
          console.error("Failed to save scans:", err);
          
          window.location.href = "./add_patient3.html";
        });
      } else {
        
        ScanStorage.clear();
        window.location.href = "./add_patient3.html";
      }
    });
  }
});

// Scan Upload Functionality
window.uploadedScans = [];

function initScanUpload() {
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("scanFileInput");
  const browseBtn = document.getElementById("browseBtn");
  const preview = document.getElementById("scansPreview");
  
  if (!uploadZone || !fileInput) {
    return;
  }

  
  if (browseBtn) {
    browseBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      fileInput.click();
    });
  }
  
  uploadZone.addEventListener("click", function() {
    fileInput.click();
  });

  // Drag and drop
  uploadZone.addEventListener("dragover", function(e) {
    e.preventDefault();
    uploadZone.classList.add("is-dragover");
  });

  uploadZone.addEventListener("dragleave", function() {
    uploadZone.classList.remove("is-dragover");
  });

  uploadZone.addEventListener("drop", function(e) {
    e.preventDefault();
    uploadZone.classList.remove("is-dragover");
    handleFiles(e.dataTransfer.files);
  });

  
  fileInput.addEventListener("change", function() {
    handleFiles(fileInput.files);
    fileInput.value = ""; 
  });

  function handleFiles(files) {
    const scanTypeEl = document.getElementById("scanType");
    const scanDateEl = document.getElementById("scanDate");
    const scanDescEl = document.getElementById("scanDescription");
    
    const scanType = scanTypeEl ? scanTypeEl.value : "";
    const scanDate = scanDateEl ? scanDateEl.value : "";
    const description = scanDescEl ? scanDescEl.value.trim() : "";
    
    for (let i = 0; i < files.length; i++) {
      (function(file) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert('File "' + file.name + '" exceeds 10MB limit.');
          return;
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/dicom"];
        let isValidType = false;
        for (let j = 0; j < validTypes.length; j++) {
          const typePrefix = validTypes[j].split("/")[0];
          if (file.type.indexOf(typePrefix) === 0) {
            isValidType = true;
            break;
          }
        }
        if (!isValidType && file.name.toLowerCase().indexOf(".dcm") !== -1) {
          isValidType = true;
        }
        if (!isValidType && file.type === "application/pdf") {
          isValidType = true;
        }
        if (!isValidType && file.type.indexOf("image/") === 0) {
          isValidType = true;
        }
        
        if (!isValidType) {
          alert('File "' + file.name + '" is not a supported format.');
          return;
        }

        // Add to uploaded scans
        const scanData = {
          id: Date.now() + Math.random(),
          file: file,
          scanType: scanType,
          scanDate: scanDate,
          description: description
        };
        
        window.uploadedScans.push(scanData);
        renderScanPreview(scanData, preview);
      })(files[i]);
    }
  }
}

function renderScanPreview(scanData, container) {
  const id = scanData.id;
  const file = scanData.file;
  const scanType = scanData.scanType;
  const scanDate = scanData.scanDate;
  const description = scanData.description;
  
  const item = document.createElement("div");
  item.className = "scanItem";
  item.dataset.scanId = id;
  
  // Thumbnail
  const thumb = document.createElement("div");
  thumb.className = "scanItem__thumb";
  
  if (file.type.indexOf("image/") === 0) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    thumb.appendChild(img);
  } else {
    // PDF or DICOM icon
    thumb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  }
  
  
  const info = document.createElement("div");
  info.className = "scanItem__info";
  
  const displayName = description || file.name;
  let typeLabel;
  if (scanType) {
    typeLabel = scanType.toUpperCase();
  } else {
    typeLabel = "Scan";
  }
  const sizeKB = (file.size / 1024).toFixed(1);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  let sizeDisplay;
  if (file.size > 1024 * 1024) {
    sizeDisplay = sizeMB + " MB";
  } else {
    sizeDisplay = sizeKB + " KB";
  }
  
  let metaText = typeLabel + " • " + sizeDisplay;
  if (scanDate) {
    metaText += " • " + scanDate;
  }
  
  info.innerHTML = '<div class="scanItem__name">' + displayName + '</div>' +
    '<div class="scanItem__meta">' + metaText + '</div>';
  
  
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "scanItem__remove";
  removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>';
  
  (function(scanId, itemEl) {
    removeBtn.addEventListener("click", function() {
      const newScans = [];
      for (let i = 0; i < window.uploadedScans.length; i++) {
        if (window.uploadedScans[i].id !== scanId) {
          newScans.push(window.uploadedScans[i]);
        }
      }
      window.uploadedScans = newScans;
      itemEl.remove();
    });
  })(id, item);
  
  item.appendChild(thumb);
  item.appendChild(info);
  item.appendChild(removeBtn);
  container.appendChild(item);
}

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
