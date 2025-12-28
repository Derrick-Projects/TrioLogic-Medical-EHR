"use strict";

document.addEventListener("DOMContentLoaded", function() {
  if (typeof flatpickr !== "undefined") {
    flatpickr("#dob", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      maxDate: "today",
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


const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("id");

let currentPatientData = null;


document.addEventListener("DOMContentLoaded", function() {
  loadDoctorInfo();
  
  if (!patientId) {
    showError("No patient ID provided");
    return;
  }
  
  loadPatientDetails();
  
  
  const form = document.getElementById("patientForm");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  
  const viewBtn = document.getElementById("viewPatientBtn");
  if (viewBtn) {
    viewBtn.onclick = function() {
      window.location.href = "view_patient.html?id=" + patientId;
    };
  }
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


function loadPatientDetails() {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const editForm = document.getElementById("editPatientForm");

  fetch("../php/get_patient_details.php?id=" + encodeURIComponent(patientId))
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      if (!data.success) {
        showError(data.message || "Failed to load patient details");
        return;
      }

      currentPatientData = data;

      // Hide loading, show form
      if (loadingState) {
        loadingState.style.display = "none";
      }
      if (editForm) {
        editForm.style.display = "block";
      }

      
      populateForm(data.patient);
    })
    .catch(function(err) {
      console.error("Error loading patient details:", err);
      showError("An error occurred while loading patient details");
    });
}

// Show error state
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


function populateForm(patient) {
  
  const titleEl = document.getElementById("patientNameTitle");
  if (titleEl) {
    titleEl.textContent = patient.fullName;
  }

  // Populate hidden field
  setValue("patientId", patient.id);

  
  setValue("firstName", patient.firstName);
  setValue("lastName", patient.lastName);
  setValue("dob", patient.dob);
  setValue("sex", patient.sex);
  setValue("bloodType", patient.bloodType);

  
  setValue("email", patient.email);
  
  
  if (patient.phone) {
    const phoneParts = patient.phone.trim().split(" ");
    if (phoneParts.length >= 2) {
      setValue("phoneCountryCode", phoneParts[0]);
      setValue("phoneNumber", phoneParts.slice(1).join(" "));
    } else {
      setValue("phoneNumber", patient.phone);
    }
  }

  
  if (patient.address && patient.address !== "-") {
    const addressParts = patient.address.split(", ");
    const filteredParts = [];
    for (let i = 0; i < addressParts.length; i++) {
      if (addressParts[i]) {
        filteredParts.push(addressParts[i]);
      }
    }
    if (filteredParts.length > 0) {
      setValue("addressLine1", filteredParts[0] || "");
      
      
      if (filteredParts.length > 1) {
        setValue("city", filteredParts[1] || "");
      }
      if (filteredParts.length > 2) {
        const statePostal = filteredParts[2].split(" ");
        setValue("stateProvince", statePostal[0] || "");
        setValue("postalCode", statePostal[1] || "");
      }
      if (filteredParts.length > 3) {
        setValue("country", filteredParts[3] || "");
      }
    }
  }
}

// Helper to set form field value
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value) {
    el.value = value;
  }
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();

  const saveBtn = document.getElementById("saveBtn");
  const saveBtnText = document.getElementById("saveBtnText");

  if (saveBtn) {
    saveBtn.disabled = true;
  }
  if (saveBtnText) {
    saveBtnText.textContent = "Saving...";
  }

  const firstNameEl = document.getElementById("firstName");
  const lastNameEl = document.getElementById("lastName");
  const emailEl = document.getElementById("email");
  const phoneCountryCodeEl = document.getElementById("phoneCountryCode");
  const phoneNumberEl = document.getElementById("phoneNumber");
  const dobEl = document.getElementById("dob");
  const sexEl = document.getElementById("sex");
  const bloodTypeEl = document.getElementById("bloodType");
  const addressLine1El = document.getElementById("addressLine1");
  const addressLine2El = document.getElementById("addressLine2");
  const cityEl = document.getElementById("city");
  const stateProvinceEl = document.getElementById("stateProvince");
  const postalCodeEl = document.getElementById("postalCode");
  const countryEl = document.getElementById("country");
  const patientIdEl = document.getElementById("patientId");

  const formData = {
    patientId: patientIdEl ? patientIdEl.value : "",
    firstName: firstNameEl ? firstNameEl.value.trim() : "",
    lastName: lastNameEl ? lastNameEl.value.trim() : "",
    email: emailEl ? emailEl.value.trim() : "",
    phoneCountryCode: phoneCountryCodeEl ? phoneCountryCodeEl.value.trim() : "",
    phoneNumber: phoneNumberEl ? phoneNumberEl.value.trim() : "",
    dob: dobEl ? dobEl.value : "",
    sex: sexEl ? sexEl.value : "",
    bloodType: bloodTypeEl ? bloodTypeEl.value : "",
    addressLine1: addressLine1El ? addressLine1El.value.trim() : "",
    addressLine2: addressLine2El ? addressLine2El.value.trim() : "",
    city: cityEl ? cityEl.value.trim() : "",
    stateProvince: stateProvinceEl ? stateProvinceEl.value.trim() : "",
    postalCode: postalCodeEl ? postalCodeEl.value.trim() : "",
    country: countryEl ? countryEl.value.trim() : ""
  };

  fetch("../php/update_patient.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    if (data.success) {
      showAlert("success", "Patient updated successfully!");
      
      // Redirect after a short delay
      setTimeout(function() {
        window.location.href = "view_patient.html?id=" + patientId;
      }, 1500);
    } else {
      showAlert("error", data.message || "Failed to update patient");
      if (saveBtn) {
        saveBtn.disabled = false;
      }
      if (saveBtnText) {
        saveBtnText.textContent = "Save Changes";
      }
    }
  })
  .catch(function(err) {
    console.error("Error saving patient:", err);
    showAlert("error", "An error occurred while saving");
    if (saveBtn) {
      saveBtn.disabled = false;
    }
    if (saveBtnText) {
      saveBtnText.textContent = "Save Changes";
    }
  });
}

// Show alert message
function showAlert(type, message) {
  
  const existingAlerts = document.querySelectorAll(".alert");
  for (let i = 0; i < existingAlerts.length; i++) {
    existingAlerts[i].remove();
  }

  const alert = document.createElement("div");
  alert.className = "alert alert-" + type;
  
  let iconText;
  if (type === "success") {
    iconText = "✓";
  } else {
    iconText = "⚠";
  }
  
  alert.innerHTML = '<span class="alert-icon">' + iconText + '</span><span>' + message + '</span>';

  const form = document.getElementById("patientForm");
  if (form) {
    form.parentElement.insertBefore(alert, form);
    

    setTimeout(function() {
      alert.remove();
    }, 5000);
  }
}

// Utility function to escape HTML
function escapeHtml(str) {
  if (!str) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
