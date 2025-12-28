const form = document.getElementById("signupForm");
const btn = document.getElementById("continueBtn");

// Password visibility toggle
const togglePasswordBtn = document.getElementById("togglePassword");
togglePasswordBtn.addEventListener("click", function() {
  const input = document.getElementById("password");
  const isHidden = input.type === "password";
  if (isHidden) {
    input.type = "text";
    togglePasswordBtn.textContent = "Hide";
  } else {
    input.type = "password";
    togglePasswordBtn.textContent = "Show";
  }
});

// Confirm password visibility toggle
const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");
toggleConfirmPasswordBtn.addEventListener("click", function() {
  const input = document.getElementById("confirmPassword");
  const isHidden = input.type === "password";
  if (isHidden) {
    input.type = "text";
    toggleConfirmPasswordBtn.textContent = "Hide";
  } else {
    input.type = "password";
    toggleConfirmPasswordBtn.textContent = "Show";
  }
});

// Password strength elements
const passwordInput = document.getElementById("password");
const strengthMeter = document.getElementById("passwordStrength");
const strengthBar = document.getElementById("strengthBar");
const strengthLabel = document.getElementById("strengthLabel");
const checklist = document.getElementById("passwordChecklist");

// Password requirements
const requirements = {
  length: {
    el: document.getElementById("req-length"),
    test: function(v) {
      return v.length >= 8;
    }
  },
  uppercase: {
    el: document.getElementById("req-uppercase"),
    test: function(v) {
      return /[A-Z]/.test(v);
    }
  },
  lowercase: {
    el: document.getElementById("req-lowercase"),
    test: function(v) {
      return /[a-z]/.test(v);
    }
  },
  number: {
    el: document.getElementById("req-number"),
    test: function(v) {
      return /[0-9]/.test(v);
    }
  },
  special: {
    el: document.getElementById("req-special"),
    test: function(v) {
      return /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(v);
    }
  }
};

function checkPasswordStrength(password) {
  let score = 0;
  const keys = Object.keys(requirements);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const req = requirements[key];
    const passed = req.test(password);
    
    if (passed) {
      req.el.classList.add("valid");
      score++;
    } else {
      req.el.classList.remove("valid");
    }
  }
  
  let strength = "";
  if (password.length === 0) {
    strength = "";
  } else if (score <= 2) {
    strength = "weak";
  } else if (score <= 4) {
    strength = "medium";
  } else {
    strength = "strong";
  }
  
  
  strengthBar.className = "strength-bar " + strength;
  strengthLabel.className = "strength-label " + strength;
  
  if (strength) {
    strengthLabel.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
  } else {
    strengthLabel.textContent = "";
  }
  
  return score;
}

passwordInput.addEventListener("focus", function() {
  strengthMeter.hidden = false;
  checklist.hidden = false;
});

passwordInput.addEventListener("input", function() {
  checkPasswordStrength(passwordInput.value);
  
  const confirmInput = document.getElementById("confirmPassword");
  if (confirmInput && confirmInput.value) {
    validateField("confirmPassword");
    updateButton();
  }
});


const countryBtn = document.getElementById("countryBtn");
const countryList = document.getElementById("countryList");

function setCountry(iso, code, name) {
  const img = document.getElementById("flagImg");
  if (img) {
    img.src = "https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/" + iso + ".svg";
    if (name) {
      img.alt = name;
    } else {
      img.alt = "Country flag";
    }
  }
  const dialCode = document.getElementById("dialCode");
  dialCode.textContent = code;
  countryBtn.dataset.iso = iso;
  if (name) {
    countryBtn.dataset.name = name;
  } else {
    countryBtn.dataset.name = "";
  }
}

function openCountry() {
  countryList.hidden = false;
  countryBtn.setAttribute("aria-expanded", "true");
  const first = countryList.querySelector("[role='option']");
  if (first) {
    first.focus();
  }
}

function closeCountry() {
  countryList.hidden = true;
  countryBtn.setAttribute("aria-expanded", "false");
}

countryBtn.addEventListener("click", function() {
  if (countryList.hidden) {
    openCountry();
  } else {
    closeCountry();
  }
});

countryList.addEventListener("click", function(e) {
  const li = e.target.closest("[role='option']");
  if (!li) {
    return;
  }
  setCountry(li.dataset.iso, li.dataset.code, li.dataset.name);
  closeCountry();
  document.getElementById("phone").focus();
});

countryList.addEventListener("keydown", function(e) {
  const optionElements = countryList.querySelectorAll("[role='option']");
  const options = Array.prototype.slice.call(optionElements);
  const i = options.indexOf(document.activeElement);

  if (e.key === "Escape") {
    e.preventDefault();
    closeCountry();
    countryBtn.focus();
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    const li = document.activeElement;
    if (li && li.dataset && li.dataset.code) {
      setCountry(li.dataset.iso, li.dataset.code, li.dataset.name);
      closeCountry();
      document.getElementById("phone").focus();
    }
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const nextIndex = Math.min(i + 1, options.length - 1);
    if (options[nextIndex]) {
      options[nextIndex].focus();
    }
  }
  
  if (e.key === "ArrowUp") {
    e.preventDefault();
    const prevIndex = Math.max(i - 1, 0);
    if (options[prevIndex]) {
      options[prevIndex].focus();
    }
  }
});

document.addEventListener("click", function(e) {
  if (!countryList.hidden) {
    if (!e.target.closest("#countryBtn") && !e.target.closest("#countryList")) {
      closeCountry();
    }
  }
});


const requiredIds = ["firstName", "lastName", "username", "email", "password", "confirmPassword", "phone"];

function showError(id, msg) {
  const el = document.querySelector("[data-error-for='" + id + "']");
  if (el) {
    if (msg) {
      el.textContent = msg;
    } else {
      el.textContent = "";
    }
  }
}

function validateField(id) {
  const input = document.getElementById(id);
  if (!input) {
    return true;
  }

  let rawValue = input.value;
  if (!rawValue) {
    rawValue = "";
  }
  const value = rawValue.trim();

  if (!value) {
    showError(id, "This field is required.");
    return false;
  }

  if (id === "email") {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!emailOk) {
      showError(id, "Please enter a valid email address.");
      return false;
    }
  }

  if (id === "username") {
    const usernameOk = /^[a-zA-Z0-9._-]{3,20}$/.test(value);
    if (!usernameOk) {
      showError(id, "Username must be 3-20 characters (letters, numbers, . _ -).");
      return false;
    }
  }

  if (id === "password") {
    const score = checkPasswordStrength(value);
    if (score < 5) {
      showError(id, "Password must meet all requirements.");
      return false;
    }
  }

  if (id === "confirmPassword") {
    const passwordValue = document.getElementById("password").value;
    if (value !== passwordValue) {
      showError(id, "Passwords do not match.");
      return false;
    }
  }

  if (id === "phone") {
    const phoneOk = /^[0-9]{7,15}$/.test(value.replace(/\s+/g, ""));
    if (!phoneOk) {
      showError(id, "Enter a valid phone number (digits only).");
      return false;
    }
  }

  showError(id, "");
  return true;
}

function validateFieldSilent(id) {
  const input = document.getElementById(id);
  if (!input) {
    return false;
  }
  
  let rawValue = input.value;
  if (!rawValue) {
    rawValue = "";
  }
  const value = rawValue.trim();
  
  if (!value) {
    return false;
  }
  
  if (id === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  if (id === "username") {
    return /^[a-zA-Z0-9._-]{3,20}$/.test(value);
  }
  
  if (id === "password") {
    const hasLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(value);
    return hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  }
  
  if (id === "confirmPassword") {
    const passwordValue = document.getElementById("password").value;
    return value === passwordValue;
  }
  
  if (id === "phone") {
    return /^[0-9]{7,15}$/.test(value.replace(/\s+/g, ""));
  }
  
  return true;
}

function updateButton() {
  let allOk = true;
  for (let i = 0; i < requiredIds.length; i++) {
    if (!validateFieldSilent(requiredIds[i])) {
      allOk = false;
      break;
    }
  }
  
  btn.disabled = !allOk;
  
  if (allOk) {
    btn.classList.add("is-enabled");
  } else {
    btn.classList.remove("is-enabled");
  }
}


for (let i = 0; i < requiredIds.length; i++) {
  (function(id) {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", updateButton);
      input.addEventListener("blur", function() {
        validateField(id);
        updateButton();
      });
    }
  })(requiredIds[i]);
}


form.addEventListener("submit", function(e) {
  e.preventDefault();
  
  let allValid = true;
  for (let i = 0; i < requiredIds.length; i++) {
    if (!validateField(requiredIds[i])) {
      allValid = false;
    }
  }
  
  updateButton();
  
  if (!allValid) {
    return;
  }

  btn.textContent = "Submitting...";
  btn.disabled = true;

  const payload = {
    first_name: document.getElementById("firstName").value.trim(),
    last_name: document.getElementById("lastName").value.trim(),
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    phone_country_code: document.getElementById("dialCode").textContent.trim(),
    phone_number: document.getElementById("phone").value.trim()
  };

  fetch("../php/signup.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(function(res) {
    return res.json().then(function(data) {
      return { response: res, data: data };
    }).catch(function() {
      return { response: res, data: {} };
    });
  })
  .then(function(result) {
    const res = result.response;
    const data = result.data;
    
    if (!res.ok || !data.ok) {
      let errorMessage = data.message;
      if (!errorMessage) {
        errorMessage = "Signup failed.";
      }
      throw new Error(errorMessage);
    }

    
    let successMessage = data.message;
    if (!successMessage) {
      successMessage = "Account created. Verification code sent.";
    }
    showToast(successMessage, "success");

    const emailParam = encodeURIComponent(payload.email);
    setTimeout(function() {
      window.location.href = "./code_verifications.html?email=" + emailParam;
    }, 900);
  })
  .catch(function(err) {
    let errorMessage = err.message;
    if (!errorMessage) {
      errorMessage = "Signup failed.";
    }
    showToast(errorMessage, "error");
    btn.textContent = "Continue";
    updateButton();
  });
});


updateButton();

// Toast
function showToast(message, type) {
  const host = getToastHost();
  const toast = document.createElement("div");
  toast.className = "toast toast--" + type;
  toast.textContent = message;
  host.appendChild(toast);
  
  setTimeout(function() {
    toast.classList.add("is-visible");
  }, 10);
  
  setTimeout(function() {
    toast.classList.remove("is-visible");
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 2400);
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
