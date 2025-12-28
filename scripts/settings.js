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

// Show alert message
function showAlert(message, type) {
  if (!type) {
    type = "success";
  }
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-" + type;
  alertDiv.textContent = message;
  
  const container = document.querySelector(".container");
  const pageTitle = document.querySelector(".pageTitle");
  
  if (container && pageTitle && pageTitle.parentNode === container) {
    container.insertBefore(alertDiv, pageTitle.nextSibling);
  } else if (container) {
    container.prepend(alertDiv);
  } else {
    document.body.prepend(alertDiv);
  }
  
  setTimeout(function() {
    alertDiv.remove();
  }, 5000);
}


function showToast(message, type) {
  if (!type) {
    type = "info";
  }
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  
  let bgColor = "#3b82f6";
  if (type === "success") {
    bgColor = "#22c55e";
  } else if (type === "error") {
    bgColor = "#ef4444";
  }
  
  toast.style.cssText = "position: fixed; top: 20px; right: 20px; padding: 12px 24px; border-radius: 8px; color: #fff; font-weight: 500; z-index: 10000; animation: slideIn 0.3s ease; background: " + bgColor + ";";
  
  document.body.appendChild(toast);
  
  setTimeout(function() {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 3000);
}

// Load doctor information
function loadDoctorInfo() {
  
  fetch("../php/me.php", { credentials: "same-origin" })
    .then(function(nameResponse) {
      
      if (nameResponse.status === 401) {
        window.location.href = "./login.html";
        return null;
      }
      return nameResponse.json();
    })
    .then(function(nameData) {
      if (!nameData) {
        return;
      }
      if (nameData.ok && nameData.name) {
        const userNameEl = document.querySelector("[data-doctor-name]");
        if (userNameEl) {
          userNameEl.textContent = nameData.name;
        }
      }
      
      
      return fetch("../php/me.php", {
        method: "GET",
        credentials: "same-origin"
      });
    })
    .then(function(response) {
      if (!response) {
        return null;
      }
      if (response.status === 401) {
        window.location.href = "./login.html";
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to load doctor information");
      }
      return response.json();
    })
    .then(function(data) {
      if (!data) {
        return;
      }
      if (data.success || data.ok) {
        // Populate form fields
        const doctor = data.doctor || data;
        const doctorNameEl = document.getElementById("doctorName");
        const doctorEmailEl = document.getElementById("doctorEmail");
        const doctorPhoneEl = document.getElementById("doctorPhone");
        const specializationEl = document.getElementById("specialization");
        
        if (doctorNameEl) {
          doctorNameEl.value = doctor.name || "";
        }
        if (doctorEmailEl) {
          doctorEmailEl.value = doctor.email || "";
        }
        if (doctorPhoneEl) {
          doctorPhoneEl.value = doctor.phone || "";
        }
        if (specializationEl) {
          specializationEl.value = doctor.specialization || "";
        }
      }
    })
    .catch(function(error) {
      console.error("Error loading doctor info:", error);
    });
}

// Handle profile form submission
const profileForm = document.getElementById("profileForm");
if (profileForm) {
  profileForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("doctorName").value,
      email: document.getElementById("doctorEmail").value,
      phone: document.getElementById("doctorPhone").value,
      specialization: document.getElementById("specialization").value
    };

    fetch("../php/update_profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(formData)
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        showAlert("Profile updated successfully!", "success");
      } else {
        showAlert(data.message || "Failed to update profile", "error");
      }
    })
    .catch(function(error) {
      console.error("Error updating profile:", error);
      showAlert("An error occurred while updating profile", "error");
    });
  });
}

// Handle security form submission
const securityForm = document.getElementById("securityForm");
if (securityForm) {
  securityForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validation
    if (newPassword !== confirmPassword) {
      showAlert("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showAlert("Password must be at least 8 characters long", "error");
      return;
    }

    fetch("../php/update_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        showAlert("Password updated successfully!", "success");
        securityForm.reset();
      } else {
        showAlert(data.message || "Failed to update password", "error");
      }
    })
    .catch(function(error) {
      console.error("Error updating password:", error);
      showAlert("An error occurred while updating password", "error");
    });
  });
}

// Handle notification preferences changes
const notificationToggleIds = ["emailNotif", "taskReminders", "patientUpdates"];
for (let n = 0; n < notificationToggleIds.length; n++) {
  (function(toggleId) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener("change", function(e) {
        const setting = e.target.id;
        const value = e.target.checked;
        const payload = {};
        payload[setting] = value;

        fetch("../php/update_preferences.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          if (data.success) {
            showAlert("Preference updated", "success");
          }
        })
        .catch(function(error) {
          console.error("Error updating preference:", error);
        });
      });
    }
  })(notificationToggleIds[n]);
}

// Handle preference changes 
const preferenceSelectIds = ["theme", "language", "timezone"];
for (let p = 0; p < preferenceSelectIds.length; p++) {
  (function(selectId) {
    const select = document.getElementById(selectId);
    if (select) {
      select.addEventListener("change", function(e) {
        const setting = e.target.id;
        const value = e.target.value;
        const payload = {};
        payload[setting] = value;

        fetch("../php/update_preferences.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          if (data.success) {
            showAlert("Preference updated", "success");
          }
        })
        .catch(function(error) {
          console.error("Error updating preference:", error);
        });
      });
    }
  })(preferenceSelectIds[p]);
}

// Logout functionality
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


document.addEventListener("DOMContentLoaded", function() {
  loadDoctorInfo();
});
