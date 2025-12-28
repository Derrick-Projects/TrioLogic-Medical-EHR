const form = document.getElementById("loginForm");
const btn = document.getElementById("loginBtn");


const togglePasswordBtn = document.getElementById("togglePassword");
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", function() {
    const input = document.getElementById("password");
    const isHidden = input.type === "password";
    if (isHidden) {
      input.type = "text";
    } else {
      input.type = "password";
    }
    togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
  });
}


const requiredIds = ["username", "password"];

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

  if (id === "username") {
    const ok = /^[a-zA-Z0-9._-]{3,20}$/.test(value);
    if (!ok) {
      showError(id, "Username must be 3-20 characters (letters, numbers, . _ -).");
      return false;
    }
  }

  if (id === "password") {
    if (value.length < 6) {
      showError(id, "Password must be at least 6 characters.");
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
  const value = (input.value || "").trim();
  if (!value) {
    return false;
  }
  if (id === "username") {
    return /^[a-zA-Z0-9._-]{3,20}$/.test(value);
  }
  if (id === "password") {
    return value.length >= 6;
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
  
  let ok = true;
  for (let i = 0; i < requiredIds.length; i++) {
    if (!validateField(requiredIds[i])) {
      ok = false;
    }
  }
  updateButton();
  if (!ok) {
    return;
  }

  btn.textContent = "Logging in...";
  btn.disabled = true;

  const payload = {
    username: document.getElementById("username").value.trim(),
    password: document.getElementById("password").value
  };

  fetch("../php/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(function(res) {
    return res.json().then(function(data) {
      return { ok: res.ok, status: res.status, data: data };
    }).catch(function() {
      return { ok: res.ok, status: res.status, data: {} };
    });
  })
  .then(function(result) {
    const res = result;
    const data = result.data;
    
    // Success
    if (res.ok && data.ok) {
      showToast(data.message || "Login successful", "success");
      setTimeout(function() {
        window.location.href = data.redirect || "./homepage.html";
      }, 900);
      return;
    }

    // Unverified: redirect to code verification page
    if (res.status === 403 && data.redirect) {
      showToast(data.message || "Please verify your email.", "error");
      setTimeout(function() {
        window.location.href = data.redirect;
      }, 900);
      return;
    }

    throw new Error(data.message || "Login failed.");
  })
  .catch(function(err) {
    showToast(err.message || "Login failed.", "error");
    btn.textContent = "Log In";
    updateButton();
  });
});

// Init
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
