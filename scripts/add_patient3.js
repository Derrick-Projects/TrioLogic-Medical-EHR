// Theme toggle functionality
(function initTheme() {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  
  if (!themeToggle || !themeIcon) {
    return;
  }
  
  const savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener("click", function() {
    const currentTheme = root.getAttribute("data-theme") || "light";
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
  
  function updateThemeIcon(theme) {
    const sunIcon = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
    const moonIcon = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";
    const pathEl = themeIcon.querySelector("path");
    if (pathEl) {
      if (theme === "dark") {
        pathEl.setAttribute("d", moonIcon);
      } else {
        pathEl.setAttribute("d", sunIcon);
      }
    }
  }
})();

document.addEventListener("DOMContentLoaded", function() {
  loadDoctorName();
  
  const backBtn = document.getElementById("backBtn");
  const saveBtn = document.getElementById("saveBtn");
  const countryBtn = document.getElementById("countryBtn");
  const countryMenu = document.getElementById("countryMenu");
  const flagImg = document.getElementById("flagImg");
  const dialCode = document.getElementById("dialCode");
  const form = document.querySelector(".formGrid");

  if (backBtn) {
    backBtn.addEventListener("click", function() {
      window.location.href = "./add_patients2.html";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function() {
      // Get form inputs
      const inputs = form.querySelectorAll(".input");
      const phoneInput = form.querySelector(".phoneInput");
      
      const contactName = inputs[0] ? inputs[0].value.trim() : "";
      const contactEmail = inputs[1] ? inputs[1].value.trim() : "";
      const contactRelationship = inputs[2] ? inputs[2].value.trim() : "";
      const contactPhone = phoneInput ? phoneInput.value.trim() : "";
      const contactDialCode = dialCode ? dialCode.textContent : "";
      
      // Validate required fields 
      if (!contactName) {
        alert("Please enter Contact Full Name");
        if (inputs[0]) {
          inputs[0].focus();
        }
        return;
      }
      
      if (!contactEmail) {
        alert("Please enter Email Address");
        if (inputs[1]) {
          inputs[1].focus();
        }
        return;
      }
      
      // Basic email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(contactEmail)) {
        alert("Please enter a valid email address");
        if (inputs[1]) {
          inputs[1].focus();
        }
        return;
      }
      
      if (!contactPhone) {
        alert("Please enter Phone Number");
        if (phoneInput) {
          phoneInput.focus();
        }
        return;
      }
      
      // Store emergency contact data
      const emergencyContact = {
        name: contactName,
        email: contactEmail,
        relationship: contactRelationship,
        phone: contactDialCode + contactPhone,
        dialCode: contactDialCode,
        phoneNumber: contactPhone
      };
      
      sessionStorage.setItem("patientEmergencyContact", JSON.stringify(emergencyContact));
      
      // Navigate to the billing page
      window.location.href = "./add_patients4.html";
    });
  }

  function closeMenu() {
    if (countryMenu) {
      countryMenu.classList.remove("is-open");
    }
    if (countryBtn) {
      countryBtn.setAttribute("aria-expanded", "false");
    }
  }

  function toggleMenu() {
    if (!countryMenu) {
      return;
    }
    const open = countryMenu.classList.toggle("is-open");
    if (countryBtn) {
      countryBtn.setAttribute("aria-expanded", String(open));
    }
  }

  if (countryBtn) {
    countryBtn.addEventListener("click", function(e) {
      e.preventDefault();
      toggleMenu();
    });
  }

  if (countryMenu) {
    countryMenu.addEventListener("click", function(e) {
      const btn = e.target.closest(".countryOption");
      if (!btn) {
        return;
      }

      const iso = btn.getAttribute("data-iso") || "ng";
      const dial = btn.getAttribute("data-dial") || "+";
      const name = btn.getAttribute("data-name") || "Country flag";

      if (flagImg) {
        flagImg.src = "https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/" + iso + ".svg";
        flagImg.alt = name;
      }
      if (dialCode) {
        dialCode.textContent = dial;
      }

      closeMenu();
    });
  }

  document.addEventListener("click", function(e) {
    if (!countryMenu) {
      return;
    }
    if (e.target.closest("#countryBtn") || e.target.closest("#countryMenu")) {
      return;
    }
    closeMenu();
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeMenu();
    }
  });
});

function loadDoctorName() {
  const target = document.querySelector("[data-doctor-name]");
  if (!target) {
    return;
  }

  fetch("../php/me.php", { credentials: "same-origin" })
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok && result.data.ok && result.data.name) {
        target.textContent = result.data.name;
      }
    })
    .catch(function() {});
}
