"use strict";
(function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const root = document.documentElement;
  
  const savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener("click", function() {
      const currentTheme = root.getAttribute("data-theme");
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
  }
  
  function updateThemeIcon(theme) {
    if (!themeIcon) {
      return;
    }
    if (theme === "dark") {
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    } else {
      themeIcon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  }
})();


const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");


document.addEventListener("DOMContentLoaded", function() {
  loadDoctorInfo();
  
  if (!patientId) {
    showError("No patient ID provided");
    return;
  }
  
  loadPatientDetails();
});


function loadDoctorInfo() {
  fetch("../php/me.php")
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      if (data.ok && data.name) {
        const nameEl = document.querySelector("[data-doctor-name]");
        if (nameEl) {
          nameEl.textContent = data.name;
        }
      }
    })
    .catch(function(err) {
      console.error("Error loading doctor info:", err);
    });
}

// Load patient details
function loadPatientDetails() {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const patientDetails = document.getElementById("patientDetails");

  fetch("../php/get_patient_details.php?id=" + encodeURIComponent(patientId))
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      if (!data.success) {
        showError(data.message || "Failed to load patient details");
        return;
      }

      // Hide loading, show content
      if (loadingState) {
        loadingState.style.display = "none";
      }
      if (patientDetails) {
        patientDetails.style.display = "block";
      }

      // Populate patient data
      populatePatientInfo(data.patient);
      populateConditions(data.conditions);
      populateMedications(data.medications);
      populateAllergies(data.allergies);
      populateEmergencyContacts(data.emergencyContacts);

      // Setup edit button
      const editBtn = document.getElementById("editPatientBtn");
      if (editBtn) {
        editBtn.onclick = function() {
          window.location.href = "edit_patient.html?id=" + patientId;
        };
      }
    })
    .catch(function(err) {
      console.error("Error loading patient details:", err);
      showError("An error occurred while loading patient details");
    });
}

// Show error
function showError(message) {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const errorMessage = document.getElementById("errorMessage");

  if (loadingState) {
    loadingState.style.display = "none";
  }
  if (errorState) {
    errorState.style.display = "flex";
  }
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}

// Populate basic patient information
function populatePatientInfo(patient) {
  const fields = {
    patientName: patient.fullName,
    patientId: patient.id,
    patientFullName: patient.fullName,
    patientDob: formatDate(patient.dob),
    patientAge: patient.age ? patient.age + " years" : "-",
    patientSex: capitalize(patient.sex),
    patientBloodType: patient.bloodType || "-",
    patientEmail: patient.email || "-",
    patientPhone: patient.phone || "-",
    patientAddress: patient.address || "-"
  };

  const fieldIds = Object.keys(fields);
  for (let i = 0; i < fieldIds.length; i++) {
    const id = fieldIds[i];
    const el = document.getElementById(id);
    if (el) {
      el.textContent = fields[id];
    }
  }
}

// Populate medical conditions
function populateConditions(conditions) {
  const container = document.getElementById("conditionsList");
  if (!container) {
    return;
  }

  if (!conditions || conditions.length === 0) {
    container.innerHTML = '<p class="no-data">No conditions recorded</p>';
    return;
  }

  let html = "";
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const status = condition.status || "active";
    let diagnosedHtml = "";
    let notesHtml = "";
    
    if (condition.diagnosed_date) {
      diagnosedHtml = '<div class="list-item-detail"><strong>Diagnosed:</strong> <span>' + formatDate(condition.diagnosed_date) + '</span></div>';
    }
    if (condition.notes) {
      notesHtml = '<div class="list-item-detail"><strong>Notes:</strong> <span>' + escapeHtml(condition.notes) + '</span></div>';
    }
    
    html += '<div class="list-item">' +
      '<div class="list-item-header">' +
        '<div class="list-item-title">' + escapeHtml(condition.condition_name) + '</div>' +
        '<span class="list-item-badge ' + status + '">' + capitalize(status) + '</span>' +
      '</div>' +
      '<div class="list-item-details">' +
        diagnosedHtml +
        notesHtml +
      '</div>' +
    '</div>';
  }
  
  container.innerHTML = html;
}

// Populate medications
function populateMedications(medications) {
  const container = document.getElementById("medicationsList");
  if (!container) {
    return;
  }

  if (!medications || medications.length === 0) {
    container.innerHTML = '<p class="no-data">No medications recorded</p>';
    return;
  }

  let html = "";
  for (let i = 0; i < medications.length; i++) {
    const med = medications[i];
    let detailsHtml = "";
    
    if (med.dosage) {
      detailsHtml += '<div class="list-item-detail"><strong>Dosage:</strong> <span>' + escapeHtml(med.dosage) + '</span></div>';
    }
    if (med.frequency) {
      detailsHtml += '<div class="list-item-detail"><strong>Frequency:</strong> <span>' + escapeHtml(med.frequency) + '</span></div>';
    }
    if (med.start_date) {
      detailsHtml += '<div class="list-item-detail"><strong>Started:</strong> <span>' + formatDate(med.start_date) + '</span></div>';
    }
    if (med.end_date) {
      detailsHtml += '<div class="list-item-detail"><strong>Ended:</strong> <span>' + formatDate(med.end_date) + '</span></div>';
    }
    if (med.notes) {
      detailsHtml += '<div class="list-item-detail"><strong>Notes:</strong> <span>' + escapeHtml(med.notes) + '</span></div>';
    }
    
    html += '<div class="list-item">' +
      '<div class="list-item-header">' +
        '<div class="list-item-title">' + escapeHtml(med.medication_name) + '</div>' +
      '</div>' +
      '<div class="list-item-details">' +
        detailsHtml +
      '</div>' +
    '</div>';
  }
  
  container.innerHTML = html;
}

// Populate allergies
function populateAllergies(allergies) {
  const container = document.getElementById("allergiesList");
  if (!container) {
    return;
  }

  if (!allergies || allergies.length === 0) {
    container.innerHTML = '<p class="no-data">No allergies recorded</p>';
    return;
  }

  let html = "";
  for (let i = 0; i < allergies.length; i++) {
    const allergy = allergies[i];
    const severity = allergy.severity || "mild";
    let detailsHtml = "";
    
    if (allergy.reaction) {
      detailsHtml += '<div class="list-item-detail"><strong>Reaction:</strong> <span>' + escapeHtml(allergy.reaction) + '</span></div>';
    }
    if (allergy.notes) {
      detailsHtml += '<div class="list-item-detail"><strong>Notes:</strong> <span>' + escapeHtml(allergy.notes) + '</span></div>';
    }
    
    html += '<div class="list-item">' +
      '<div class="list-item-header">' +
        '<div class="list-item-title">' + escapeHtml(allergy.allergy_name) + '</div>' +
        '<span class="list-item-badge ' + severity + '">' + capitalize(severity) + '</span>' +
      '</div>' +
      '<div class="list-item-details">' +
        detailsHtml +
      '</div>' +
    '</div>';
  }
  
  container.innerHTML = html;
}


function populateEmergencyContacts(contacts) {
  const container = document.getElementById("emergencyContactsList");
  if (!container) {
    return;
  }

  if (!contacts || contacts.length === 0) {
    container.innerHTML = '<p class="no-data">No emergency contacts recorded</p>';
    return;
  }

  let html = "";
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    let primaryBadge = "";
    if (contact.isPrimary) {
      primaryBadge = '<span class="list-item-badge primary" style="margin-left: 8px; font-size: 10px;">Primary</span>';
    }
    
    html += '<div class="contact-card">' +
      '<div class="contact-icon">👤</div>' +
      '<div class="contact-info">' +
        '<div class="contact-name">' +
          escapeHtml(contact.name) +
          primaryBadge +
        '</div>' +
        '<div class="contact-relationship">' + escapeHtml(contact.relationship) + '</div>' +
        '<div class="contact-phone">📞 ' + escapeHtml(contact.phone) + '</div>' +
      '</div>' +
    '</div>';
  }
  
  container.innerHTML = html;
}


function escapeHtml(str) {
  if (!str) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) {
    return "-";
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

function capitalize(str) {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function showToast(message, type) {
  if (type === undefined) {
    type = "info";
  }
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  
  let bgColor;
  if (type === "success") {
    bgColor = "#10b981";
  } else if (type === "error") {
    bgColor = "#ef4444";
  } else {
    bgColor = "#3b82f6";
  }
  
  toast.style.cssText = "position: fixed; top: 20px; right: 20px; background: " + bgColor + "; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 500; z-index: 10000; animation: slideIn 0.3s ease;";
  document.body.appendChild(toast);
  
  if (!document.querySelector("#toast-animations")) {
    const style = document.createElement("style");
    style.id = "toast-animations";
    style.textContent = "@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }";
    document.head.appendChild(style);
  }
  
  setTimeout(function() {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 3000);
}


(function() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
      fetch("../php/logout.php", {
        method: "POST",
        credentials: "same-origin"
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.success) {
          showToast("Successfully Logged out", "success");
          setTimeout(function() {
            window.location.href = "./login.html";
          }, 1500);
        } else {
          showToast("Logout failed. Please try again.", "error");
        }
      })
      .catch(function(error) {
        console.error("Logout error:", error);
        showToast("An error occurred during logout", "error");
      });
    });
  }
})();
