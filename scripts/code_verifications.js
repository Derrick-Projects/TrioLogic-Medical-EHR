const emailEl = document.getElementById("verifyEmail");
const form = document.getElementById("verifyForm");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const errorEl = document.getElementById("verifyError");
const boxElements = document.querySelectorAll(".otp__box");
const boxes = [];
for (let b = 0; b < boxElements.length; b++) {
  boxes.push(boxElements[b]);
}

const params = new URLSearchParams(window.location.search);
const email = (params.get("email") || "").trim();

if (!email) {
  showToast("Missing email. Please sign up again.", "error");
  setTimeout(function() {
    window.location.href = "./signup.html";
  }, 900);
} else {
  emailEl.textContent = email;
  if (boxes[0]) {
    boxes[0].focus();
  }
}

function getCode() {
  let code = "";
  for (let i = 0; i < boxes.length; i++) {
    code = code + (boxes[i].value || "").trim();
  }
  return code;
}

function setError(msg) {
  errorEl.textContent = msg || "";
  if (msg) {
    errorEl.style.display = "block";
  } else {
    errorEl.style.display = "none";
  }
}

function updateVerifyBtn() {
  const code = getCode();
  const ok = /^\d{6}$/.test(code);
  verifyBtn.disabled = !ok;
}

for (let i = 0; i < boxes.length; i++) {
  (function(idx) {
    const box = boxes[idx];
    
    box.addEventListener("input", function(e) {
      // allow only digits
      box.value = (box.value || "").replace(/\D/g, "").slice(0, 1);
      setError("");
      updateVerifyBtn();
      if (box.value && idx < boxes.length - 1) {
        boxes[idx + 1].focus();
      }
    });

    box.addEventListener("keydown", function(e) {
      if (e.key === "Backspace" && !box.value && idx > 0) {
        boxes[idx - 1].focus();
      }
    });

    box.addEventListener("paste", function(e) {
      const clipData = e.clipboardData || window.clipboardData;
      const text = clipData.getData("text");
      const digits = (text || "").replace(/\D/g, "").slice(0, 6);
      if (digits.length) {
        e.preventDefault();
        for (let j = 0; j < boxes.length; j++) {
          boxes[j].value = digits[j] || "";
        }
        const focusIndex = Math.min(digits.length, 6) - 1;
        if (boxes[focusIndex]) {
          boxes[focusIndex].focus();
        }
        updateVerifyBtn();
      }
    });
  })(i);
}

form.addEventListener("submit", function(e) {
  e.preventDefault();
  setError("");

  const code = getCode();
  if (!/^\d{6}$/.test(code)) {
    setError("Enter the 6-digit code.");
    return;
  }

  verifyBtn.textContent = "Verifying...";
  verifyBtn.disabled = true;

  fetch("../php/verify_code.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, code: code })
  })
  .then(function(res) {
    return res.json().then(function(data) {
      return { ok: res.ok, data: data };
    }).catch(function() {
      return { ok: res.ok, data: {} };
    });
  })
  .then(function(result) {
    if (!result.ok || !result.data.ok) {
      throw new Error(result.data.message || "Verification failed.");
    }

    showToast(result.data.message || "Email verified successfully.", "success");
    setTimeout(function() {
      window.location.href = result.data.redirect || "./login.html";
    }, 900);
  })
  .catch(function(err) {
    setError(err.message || "Verification failed.");
    showToast(err.message || "Verification failed.", "error");
    verifyBtn.textContent = "Verify";
    updateVerifyBtn();
  });
});

resendBtn.addEventListener("click", function() {
  setError("");
  resendBtn.disabled = true;

  fetch("../php/resend_code.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email })
  })
  .then(function(res) {
    return res.json().then(function(data) {
      return { ok: res.ok, data: data };
    }).catch(function() {
      return { ok: res.ok, data: {} };
    });
  })
  .then(function(result) {
    if (!result.ok || !result.data.ok) {
      throw new Error(result.data.message || "Resend failed.");
    }

    showToast(result.data.message || "A new code has been sent.", "success");

    // cooldown
    let t = 30;
    const original = resendBtn.textContent;
    const tick = setInterval(function() {
      t--;
      resendBtn.textContent = "Resend (" + t + ")";
      if (t <= 0) {
        clearInterval(tick);
        resendBtn.textContent = original;
        resendBtn.disabled = false;
      }
    }, 1000);
  })
  .catch(function(err) {
    showToast(err.message || "Resend failed.", "error");
    resendBtn.disabled = false;
  });
});

updateVerifyBtn();

// Toast helpers same style
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
