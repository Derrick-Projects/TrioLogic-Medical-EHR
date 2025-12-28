document.addEventListener("DOMContentLoaded", function() {
  if (typeof flatpickr !== "undefined") {
    flatpickr("#appointmentDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      minDate: "today",
      allowInput: true,
      disableMobile: true
    });
  }
});

// Theme Toggle Functionality
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

// Load doctor info from me.php
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

let currentFilter = "week";
let patientsData = [];
let currentAppointmentsData = [];

// Helper functions
function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeString) {
  if (!timeString) {
    return "-";
  }
  const parts = timeString.split(":");
  const hours = parts[0];
  const minutes = parts[1];
  const hour = parseInt(hours);
  let ampm;
  if (hour >= 12) {
    ampm = "PM";
  } else {
    ampm = "AM";
  }
  const hour12 = hour % 12 || 12;
  return hour12 + ":" + minutes + " " + ampm;
}

function getStatusBadgeClass(status) {
  const map = {
    "scheduled": "badge-info",
    "completed": "badge-success",
    "cancelled": "badge-danger",
    "no_show": "badge-secondary"
  };
  return map[status] || "badge-secondary";
}

function getStatusText(status) {
  const map = {
    "scheduled": "Scheduled",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "no_show": "No Show"
  };
  return map[status] || status;
}

// Fetch appointments
function fetchAppointments(filter) {
  if (!filter) {
    filter = "week";
  }
  return fetch("../php/get_appointments.php?filter=" + filter, {
    credentials: "same-origin"
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success) {
      return result;
    } else {
      console.error("Failed to fetch appointments:", result.message);
      return null;
    }
  })
  .catch(function(error) {
    console.error("Error fetching appointments:", error);
    return null;
  });
}

// Fetch patients list for dropdown
function fetchPatientsList() {
  fetch("../php/get_patients_list.php", {
    credentials: "same-origin"
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success) {
      patientsData = result.patients;
      populatePatientsDropdown();
    }
  })
  .catch(function(error) {
    console.error("Error fetching patients:", error);
  });
}

function populatePatientsDropdown() {
  const select = document.getElementById("patientId");
  if (!select) {
    return;
  }
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">Select a patient...</option>';
  
  for (let i = 0; i < patientsData.length; i++) {
    const patient = patientsData[i];
    const option = document.createElement("option");
    option.value = patient.id;
    option.textContent = patient.name;
    select.appendChild(option);
  }
}


function updateStats(counts) {
  const statScheduled = document.getElementById("statScheduled");
  const statCompleted = document.getElementById("statCompleted");
  const statCancelled = document.getElementById("statCancelled");
  const statNoShow = document.getElementById("statNoShow");
  
  if (statScheduled) {
    statScheduled.textContent = counts.scheduled || 0;
  }
  if (statCompleted) {
    statCompleted.textContent = counts.completed || 0;
  }
  if (statCancelled) {
    statCancelled.textContent = counts.cancelled || 0;
  }
  if (statNoShow) {
    statNoShow.textContent = counts.no_show || 0;
  }
}

// Render appointments
function renderAppointments() {
  const mount = document.getElementById("appointmentsMount");
  if (!mount) {
    return;
  }

  // Show loading
  mount.innerHTML = '<div class="loading-state">' +
    '<div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #2f80ed; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>' +
    '<div style="margin-top: 16px;">Loading appointments...</div>' +
    '</div>';

  fetchAppointments(currentFilter).then(function(data) {
    if (!data || !data.appointments || data.appointments.length === 0) {
      mount.innerHTML = '<div class="empty-state">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">' +
        '<path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8H5V8h14v2Z"></path>' +
        '</svg>' +
        '<h3>No appointments found</h3>' +
        '<p>Start by scheduling a new appointment</p>' +
        '<button class="btnPrimary" onclick="openAppointmentModal()">＋ New Appointment</button>' +
        '</div>';
      updateStats(data && data.counts ? data.counts : {});
      return;
    }

    // Store globally for edit access
    currentAppointmentsData = data.appointments;
    updateStats(data.counts);

    // Render appointments
    let html = "";
    for (let i = 0; i < data.appointments.length; i++) {
      const apt = data.appointments[i];
      const statusBadge = getStatusBadgeClass(apt.status);
      const statusText = getStatusText(apt.status);
      const date = formatDate(apt.appointment_date);
      const time = formatTime(apt.appointment_time);
      const typeFormatted = (apt.appointment_type || "checkup").replace("_", " ");
      
      html += '<div class="appointment-item">' +
        '<div class="appointment-time">' +
          '<div class="appointment-date">' + date + '</div>' +
          '<div class="appointment-time-slot">' + time + ' • ' + (apt.duration || 30) + ' min</div>' +
        '</div>' +
        '<div class="appointment-details">' +
          '<div class="appointment-patient">' + (apt.patient_name || "Unknown Patient") + '</div>' +
          '<div class="appointment-meta">' +
            '<span class="badge ' + statusBadge + '">' + statusText + '</span>' +
            '<span class="appointment-type">' + typeFormatted + '</span>' +
          '</div>' +
          (apt.reason ? '<div class="appointment-reason">' + apt.reason + '</div>' : '') +
        '</div>' +
        '<div class="appointment-actions">' +
          '<button onclick="editAppointment(' + apt.id + ')" title="Edit">' +
            '<svg style="width:16px;height:16px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor">' +
              '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
              '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    }

    mount.innerHTML = html;
  });
}

// Modal management
function openAppointmentModal(appointmentId) {
  const modal = document.getElementById("appointmentModal");
  const form = document.getElementById("appointmentForm");
  const title = document.getElementById("appointmentModalTitle");
  const submitBtn = document.getElementById("appointmentSubmitText");
  
  // Reset form
  form.reset();
  document.getElementById("appointmentId").value = "";
  
  if (appointmentId) {
    
    title.textContent = "Edit Appointment";
    submitBtn.textContent = "Update Appointment";
    
    let apt = null;
    for (let i = 0; i < currentAppointmentsData.length; i++) {
      if (currentAppointmentsData[i].id == appointmentId) {
        apt = currentAppointmentsData[i];
        break;
      }
    }
    if (apt) {
      document.getElementById("appointmentId").value = apt.id;
      document.getElementById("patientId").value = apt.patient_id;
      document.getElementById("appointmentDate").value = apt.appointment_date;
      document.getElementById("appointmentTime").value = apt.appointment_time;
      document.getElementById("duration").value = apt.duration || 30;
      document.getElementById("appointmentType").value = apt.appointment_type || "checkup";
      document.getElementById("appointmentStatus").value = apt.status || "scheduled";
      document.getElementById("reason").value = apt.reason || "";
      document.getElementById("notes").value = apt.notes || "";
    }
  } else {
    
    title.textContent = "New Appointment";
    submitBtn.textContent = "Create Appointment";
    
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("appointmentDate").value = today;
  }
  
  modal.setAttribute("aria-hidden", "false");
}

function closeAppointmentModal() {
  const modal = document.getElementById("appointmentModal");
  // Remove focus from any element inside modal before hiding
  if (document.activeElement && modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  modal.setAttribute("aria-hidden", "true");
}

window.editAppointment = function(appointmentId) {
  openAppointmentModal(appointmentId);
};


document.addEventListener("DOMContentLoaded", function() {
  
  loadDoctorInfo();
  
  
  fetchPatientsList();
  renderAppointments();

  
  const filterBtns = document.querySelectorAll(".filter-btn");
  for (let f = 0; f < filterBtns.length; f++) {
    filterBtns[f].addEventListener("click", function(e) {
      const allBtns = document.querySelectorAll(".filter-btn");
      for (let j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove("active");
      }
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      renderAppointments();
    });
  }

  
  const addBtn = document.getElementById("addAppointmentBtn");
  if (addBtn) {
    addBtn.addEventListener("click", function() {
      openAppointmentModal();
    });
  }

  // Close modal handlers
  const closeModalBtns = document.querySelectorAll('[data-modal-close="appointmentModal"]');
  for (let c = 0; c < closeModalBtns.length; c++) {
    closeModalBtns[c].addEventListener("click", closeAppointmentModal);
  }

  // Form submission
  const form = document.getElementById("appointmentForm");
  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      
      const submitBtn = document.getElementById("appointmentSubmitBtn");
      const submitText = document.getElementById("appointmentSubmitText");
      const originalText = submitText.textContent;
      
      submitBtn.disabled = true;
      submitText.textContent = "Saving...";
      
      const formData = new FormData(form);
      const data = {
        patient_id: formData.get("patient_id"),
        appointment_date: formData.get("appointment_date"),
        appointment_time: formData.get("appointment_time"),
        duration: formData.get("duration"),
        status: formData.get("status"),
        appointment_type: formData.get("appointment_type"),
        reason: formData.get("reason"),
        notes: formData.get("notes")
      };
      
      const appointmentId = formData.get("appointmentId");
      if (appointmentId) {
        data.id = appointmentId;
      }
      
      fetch("../php/save_appointment.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(result) {
        if (result.success) {
          closeAppointmentModal();
          renderAppointments();
        } else {
          alert(result.message || "Failed to save appointment");
        }
      })
      .catch(function(error) {
        console.error("Error saving appointment:", error);
        alert("An error occurred while saving the appointment");
      })
      .finally(function() {
        submitBtn.disabled = false;
        submitText.textContent = originalText;
      });
    });
  }
});

// Toast notification function
function showToast(message, type) {
  if (!type) {
    type = "info";
  }
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  
  let bgColor = "#3b82f6";
  if (type === "success") {
    bgColor = "#10b981";
  } else if (type === "error") {
    bgColor = "#ef4444";
  }
  
  toast.style.cssText = "position: fixed; top: 20px; right: 20px; background: " + bgColor + "; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 500; z-index: 10000; animation: slideIn 0.3s ease;";
  document.body.appendChild(toast);
  
  if (!document.querySelector("#toast-animations")) {
    const animStyle = document.createElement("style");
    animStyle.id = "toast-animations";
    animStyle.textContent = "@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }";
    document.head.appendChild(animStyle);
  }
  
  setTimeout(function() {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 3000);
}


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
