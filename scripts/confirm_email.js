const emailEl = document.getElementById("emailTo");
const productEl = document.getElementById("productName");

const resendBtn = document.getElementById("resendBtn");
const resendText = document.getElementById("resendText");
const secondsEl = document.getElementById("seconds");
const resendSuffix = document.getElementById("resendSuffix");

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Optional URL params
const email = getParam("email");
const product = getParam("product");
if (email) {
  emailEl.textContent = email;
}
if (product) {
  productEl.textContent = product;
}

let remaining = 30;
let timer = null;

function setReady(ready) {
  resendBtn.disabled = !ready;
  if (ready) {
    resendBtn.classList.add("is-ready");
    resendBtn.style.cursor = "pointer";
  } else {
    resendBtn.classList.remove("is-ready");
    resendBtn.style.cursor = "not-allowed";
  }
}

function showCountdown() {
  resendText.textContent = "Resend in";
  secondsEl.style.display = "";
  resendSuffix.style.display = "";
  secondsEl.textContent = String(remaining);
  setReady(false);
}

function showReady() {
  resendText.textContent = "Resend now";
  secondsEl.style.display = "none";
  resendSuffix.style.display = "none";
  setReady(true);
}

function start() {
  remaining = 30;
  showCountdown();

  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(function() {
    remaining -= 1;
    secondsEl.textContent = String(remaining);
    if (remaining <= 0) {
      clearInterval(timer);
      timer = null;
      showReady();
    }
  }, 1000);
}

resendBtn.addEventListener("click", function() {
  if (resendBtn.disabled) {
    return;
  }

  alert("Verification email resent (demo).");
  start();
});

start();
