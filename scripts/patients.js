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

// Load doctor info
document.addEventListener("DOMContentLoaded", function() {
  loadDoctorInfo();
  loadRecentPatients();
  setupNavigation();
});

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

function loadRecentPatients() {
  const patientsList = document.getElementById("patientsList");
  const patientCount = document.getElementById("patientCount");

  if (!patientsList) {
    return;
  }

  fetch("../php/get_patients.php")
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      if (!data.ok) {
        patientsList.innerHTML = '<div style="grid-column: 1/-1; padding: 40px 0; text-align: center; color: #9ca3af;">' +
          '<p>Unable to load patients. Please try again later.</p>' +
          '</div>';
        return;
      }

      const patients = data.data || [];

      if (patients.length === 0) {
        patientsList.innerHTML = '<div style="grid-column: 1/-1; padding: 40px 0; text-align: center; color: #9ca3af;">' +
          '<p style="margin: 0; font-size: 16px; font-weight: 600;">No patients yet</p>' +
          '<p style="margin: 6px 0 0; font-size: 14px;">Click "Add New Patient" to get started</p>' +
          '</div>';
        if (patientCount) {
          patientCount.textContent = "0 patients";
        }
        return;
      }

      let html = "";
      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const escapedName = escapeHtml(patient.name);
        const escapedNameForAttr = escapedName.replace(/'/g, "\\'");
        const statusLabel = patient.status.charAt(0).toUpperCase() + patient.status.slice(1);
        
        html += '<div class="tableRow">' +
          '<div class="tableCol name">' + escapedName + '</div>' +
          '<div class="tableCol">' + escapeHtml(patient.id) + '</div>' +
          '<div class="tableCol">' + formatDate(patient.dateAdded) + '</div>' +
          '<div class="tableCol">' +
            '<span class="statusPill ' + patient.status + '">' + statusLabel + '</span>' +
          '</div>' +
          '<div class="tableCol">' +
            '<div class="tableActions">' +
              '<button class="tableActionBtn" aria-label="View patient" title="View" onclick="window.location.href=\'view_patient.html?id=' + patient.id + '\'">👁️</button>' +
              '<button class="tableActionBtn" aria-label="Update medical record" title="Update Record" onclick="window.location.href=\'update_medical_record.html?id=' + patient.id + '\'">📔</button>' +
              '<button class="tableActionBtn" aria-label="Edit patient" title="Edit" onclick="window.location.href=\'edit_patient.html?id=' + patient.id + '\'">✏️</button>' +
              '<button class="tableActionBtn tableActionBtn--delete" aria-label="Delete patient" title="Delete" onclick="deletePatient(\'' + patient.id + '\', \'' + escapedNameForAttr + '\')">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<polyline points="3 6 5 6 21 6"></polyline>' +
                  '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                  '<line x1="10" y1="11" x2="10" y2="17"></line>' +
                  '<line x1="14" y1="11" x2="14" y2="17"></line>' +
                '</svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
      patientsList.innerHTML = html;

      if (patientCount) {
        const pluralText = patients.length === 1 ? "patient" : "patients";
        patientCount.textContent = patients.length + " " + pluralText;
      }
    })
    .catch(function(err) {
      console.error("Error loading patients:", err);
      patientsList.innerHTML = '<div style="grid-column: 1/-1; padding: 40px 0; text-align: center; color: #9ca3af;">' +
        '<p>Error loading patients. Please try again.</p>' +
        '</div>';
    });
}


function setupNavigation() {
  const patientBtn = document.querySelector('.snav__item[href="./patients.html"]');
  if (patientBtn) {
    patientBtn.classList.add("is-active");
  }
}


function showDeleteModal(patientId, patientName) {
  
  const existingModal = document.getElementById("deleteModal");
  if (existingModal) {
    existingModal.remove();
  }

  
  const modal = document.createElement("div");
  modal.id = "deleteModal";
  modal.className = "modal-overlay";
  modal.innerHTML = '<div class="modal-container">' +
    '<div class="modal-icon">' +
      '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="3 6 5 6 21 6"></polyline>' +
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
        '<line x1="10" y1="11" x2="10" y2="17"></line>' +
        '<line x1="14" y1="11" x2="14" y2="17"></line>' +
      '</svg>' +
    '</div>' +
    '<h3 class="modal-title">Delete Patient</h3>' +
    '<p class="modal-message">Are you sure you want to delete <strong>"' + escapeHtml(patientName) + '"</strong>?</p>' +
    '<p class="modal-warning">This will permanently remove all patient data including medical history, scans, and billing information.</p>' +
    '<div class="modal-actions">' +
      '<button class="modal-btn modal-btn--cancel" id="modalCancelBtn">Cancel</button>' +
      '<button class="modal-btn modal-btn--delete" id="modalDeleteBtn">Delete Patient</button>' +
    '</div>' +
  '</div>';

  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(function() {
    modal.classList.add("is-visible");
  });

  // Handle cancel
  const cancelBtn = document.getElementById("modalCancelBtn");
  cancelBtn.addEventListener("click", function() {
    closeDeleteModal();
  });

  // Handle click outside
  modal.addEventListener("click", function(e) {
    if (e.target === modal) {
      closeDeleteModal();
    }
  });

  // Handle escape key
  function escHandler(e) {
    if (e.key === "Escape") {
      closeDeleteModal();
      document.removeEventListener("keydown", escHandler);
    }
  }
  document.addEventListener("keydown", escHandler);

  // Handle delete
  const deleteBtn = document.getElementById("modalDeleteBtn");
  deleteBtn.addEventListener("click", function() {
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<span class="btn-spinner"></span> Deleting...';
    executeDelete(patientId);
  });
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.classList.remove("is-visible");
    setTimeout(function() {
      modal.remove();
    }, 200);
  }
}


function deletePatient(patientId, patientName) {
  showDeleteModal(patientId, patientName);
}


function executeDelete(patientId) {
  fetch("../php/delete_patient.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ patient_id: patientId })
  })
  .then(function(response) {
    return response.json().then(function(data) {
      return { ok: response.ok, data: data };
    });
  })
  .then(function(result) {
    closeDeleteModal();
    if (result.ok && result.data.ok) {
      showToast("Successfully deleted patient data", "success");
      
      loadRecentPatients();
    } else {
      showToast(result.data.error || "Failed to delete patient", "error");
    }
  })
  .catch(function(err) {
    closeDeleteModal();
    console.error("Delete error:", err);
    showToast("Error deleting patient. Please try again.", "error");
  });
}


function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}


const searchInput = document.getElementById("globalSearch");
if (searchInput) {
  searchInput.addEventListener("input", function(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll(".tableRow");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nameEl = row.querySelector(".tableCol.name");
      const idEl = row.querySelector(".tableCol:nth-child(2)");
      const name = nameEl ? nameEl.textContent.toLowerCase() : "";
      const id = idEl ? idEl.textContent.toLowerCase() : "";
      
      const matches = name.indexOf(query) !== -1 || id.indexOf(query) !== -1;
      if (matches) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    }
  });
}

// Refresh button
const refreshBtns = document.querySelectorAll(".iconPlain");
for (let r = 0; r < refreshBtns.length; r++) {
  (function(btn) {
    btn.addEventListener("click", function() {
      btn.style.animation = "spin 0.6s ease-in-out";
      setTimeout(function() {
        btn.style.animation = "";
        loadRecentPatients();
      }, 600);
    });
  })(refreshBtns[r]);
}

// Add animation style
const spinStyle = document.createElement("style");
spinStyle.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
document.head.appendChild(spinStyle);

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


const editPatientCard = document.getElementById("editPatientCard");
if (editPatientCard) {
  editPatientCard.addEventListener("click", function(e) {
    e.preventDefault();
    const patientsListCard = document.querySelector(".recentCard");
    if (patientsListCard) {
      patientsListCard.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus on search input
      const searchEl = document.getElementById("globalSearch");
      if (searchEl) {
        setTimeout(function() {
          searchEl.focus();
        }, 500);
      }
    }
  });
}
