const form = document.getElementById("forgotPasswordForm");
const btn = document.getElementById("resetBtn");
const successMessage = document.getElementById("successMessage");
const emailInput = document.getElementById("email");


function showError(id, msg) {
  const el = document.querySelector('[data-error-for="' + id + '"]');
  if (el) {
    el.textContent = msg || "";
  }
}

function validateField(id) {
  const input = document.getElementById(id);
  if (!input) {
    return true;
  }

  const value = (input.value || "").trim();

  
  if (!value) {
    showError(id, "This field is required.");
    return false;
  }

  if (id === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showError(id, "Please enter a valid email address.");
      return false;
    }
  }

  showError(id, "");
  return true;
}

function validateFieldSilent(id) {
  const input = document.getElementById(id);
  if (!input) {
    return true;
  }
  const value = (input.value || "").trim();
  
  if (!value) {
    return false;
  }
  
  if (id === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  return true;
}

function updateButton() {
  const isValid = validateFieldSilent("email");
  btn.disabled = !isValid;
}

// Real-time validation
emailInput.addEventListener("input", function() {
  updateButton();
});
emailInput.addEventListener("blur", function() {
  validateField("email");
});


form.addEventListener("submit", function(e) {
  e.preventDefault();

  
  const emailValid = validateField("email");
  if (!emailValid) {
    return;
  }

  
  btn.disabled = true;
  btn.textContent = "Sending...";

  const formData = new FormData();
  formData.append("email", emailInput.value.trim());

  fetch("../php/forgot_password.php", {
    method: "POST",
    body: formData
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    if (data.success || data.ok) {
      
      successMessage.style.display = "flex";
      const fieldEl = form.querySelector(".field");
      if (fieldEl) {
        fieldEl.style.display = "none";
      }
      btn.style.display = "none";
      
      // Optionally redirect after delay
      setTimeout(function() {
        window.location.href = "./login.html";
      }, 5000);
    } else {
      showError("email", data.message || "Failed to send reset link. Please try again.");
      btn.disabled = false;
      btn.textContent = "Send Reset Link";
    }
  })
  .catch(function(error) {
    console.error("Error:", error);
    showError("email", "An error occurred. Please try again later.");
    btn.disabled = false;
    btn.textContent = "Send Reset Link";
  });
});


updateButton();
