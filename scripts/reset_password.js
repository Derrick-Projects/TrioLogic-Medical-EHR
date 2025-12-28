const form = document.getElementById("resetForm");
const btn = document.getElementById("resetBtn");
const successMessage = document.getElementById("successMessage");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const togglePasswordBtn = document.getElementById("togglePassword");
const toggleConfirmBtn = document.getElementById("toggleConfirm");

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token") || "";

// Check if token exists
if (!token) {
  showToast("Invalid or missing reset token. Please request a new reset link.", "error");
  setTimeout(function() {
    window.location.href = "./forgot_password.html";
  }, 2000);
}

// Password show/hide toggle
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", function() {
    const isHidden = passwordInput.type === "password";
    if (isHidden) {
      passwordInput.type = "text";
    } else {
      passwordInput.type = "password";
    }
    togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
  });
}

if (toggleConfirmBtn) {
  toggleConfirmBtn.addEventListener("click", function() {
    const isHidden = confirmInput.type === "password";
    if (isHidden) {
      confirmInput.type = "text";
    } else {
      confirmInput.type = "password";
    }
    toggleConfirmBtn.textContent = isHidden ? "Hide" : "Show";
  });
}


function showError(id, msg) {
  const el = document.querySelector('[data-error-for="' + id + '"]');
  if (el) {
    el.textContent = msg || "";
  }
}

function validatePassword(showMsg) {
  if (showMsg === undefined) {
    showMsg = true;
  }
  const value = (passwordInput.value || "").trim();
  
  if (!value) {
    if (showMsg) {
      showError("password", "This field is required.");
    }
    return false;
  }
  
  if (value.length < 8) {
    if (showMsg) {
      showError("password", "Password must be at least 8 characters.");
    }
    return false;
  }
  
  showError("password", "");
  return true;
}

function validateConfirm(showMsg) {
  if (showMsg === undefined) {
    showMsg = true;
  }
  const password = (passwordInput.value || "").trim();
  const confirm = (confirmInput.value || "").trim();
  
  if (!confirm) {
    if (showMsg) {
      showError("confirm", "This field is required.");
    }
    return false;
  }
  
  if (confirm !== password) {
    if (showMsg) {
      showError("confirm", "Passwords do not match.");
    }
    return false;
  }
  
  showError("confirm", "");
  return true;
}

function validateAll(showMsg) {
  if (showMsg === undefined) {
    showMsg = true;
  }
  if (!token) {
    if (showMsg) {
      showToast("Invalid or missing reset token.", "error");
    }
    return false;
  }
  
  const passOk = validatePassword(showMsg);
  const confirmOk = validateConfirm(showMsg);
  
  return passOk && confirmOk;
}

function updateButton() {
  const ok = validateAll(false);
  btn.disabled = !ok;
}


if (passwordInput) {
  passwordInput.addEventListener("input", updateButton);
  passwordInput.addEventListener("blur", function() {
    validatePassword(true);
    updateButton();
  });
}
if (confirmInput) {
  confirmInput.addEventListener("input", updateButton);
  confirmInput.addEventListener("blur", function() {
    validateConfirm(true);
    updateButton();
  });
}

// Form submission
if (form) {
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    
    if (!validateAll(true)) {
      return;
    }
    
    btn.disabled = true;
    btn.textContent = "Resetting...";

    fetch("../php/reset_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token,
        password: passwordInput.value
      })
    })
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, data: data };
      }).catch(function() {
        return { ok: res.ok, data: {} };
      });
    })
    .then(function(result) {
      if (!result.ok || (!result.data.ok && !result.data.success)) {
        throw new Error(result.data.message || "Failed to reset password.");
      }

      // Show success message
      showToast("Password reset successful!", "success");
      
      // Hide form, show success message
      form.style.display = "none";
      successMessage.style.display = "block";

      // Redirect to login after delay
      setTimeout(function() {
        window.location.href = "./login.html";
      }, 3000);
    })
    .catch(function(err) {
      showToast(err.message || "Failed to reset password.", "error");
      btn.textContent = "Reset Password";
      updateButton();
    });
  });
}


function showToast(message, type) {
  if (!type) {
    type = "info";
  }
  const host = getToastHost();
  const toast = document.createElement("div");
  toast.className = "toast toast--" + type;
  toast.textContent = message;
  
  let bgColor = "#3b82f6";
  if (type === "success") {
    bgColor = "#22c55e";
  } else if (type === "error") {
    bgColor = "#ef4444";
  }
  
  toast.style.cssText = "position: fixed; top: 20px; right: 20px; padding: 12px 24px; border-radius: 8px; color: #fff; font-weight: 500; z-index: 10000; animation: slideIn 0.3s ease; background: " + bgColor + ";";
  
  host.appendChild(toast);
  
  setTimeout(function() {
    toast.classList.add("is-visible");
  }, 10);
  setTimeout(function() {
    toast.style.opacity = "0";
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 3000);
}

function getToastHost() {
  let host = document.getElementById("toastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "toastHost";
    document.body.appendChild(host);
  }
  return host;
}


updateButton();
