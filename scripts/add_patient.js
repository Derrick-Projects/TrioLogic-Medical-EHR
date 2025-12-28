"use strict";

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

// Initialize Flatpickr datepicker
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

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const avatarPreview = document.getElementById("avatarPreview");

const countryBtn = document.getElementById("countryBtn");
const countryMenu = document.getElementById("countryMenu");
const flagImg = document.getElementById("flagImg");
const dialCode = document.getElementById("dialCode");


const nationalityBtn = document.getElementById("nationalityBtn");
const nationalityMenu = document.getElementById("nationalityMenu");
const nationalityFlag = document.getElementById("nationalityFlag");
const nationalityLabel = document.getElementById("nationalityLabel");
const nationalityValue = document.getElementById("nationality");

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

// Upload preview
if (uploadBtn) {
  uploadBtn.addEventListener("click", function() {
    if (fileInput) {
      fileInput.click();
    }
  });
}

if (fileInput) {
  fileInput.addEventListener("change", function() {
    const f = fileInput.files && fileInput.files[0];
    if (!f) {
      return;
    }

    const url = URL.createObjectURL(f);

    // Replace inner placeholder with an img
    avatarPreview.innerHTML = "";
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Profile preview";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    avatarPreview.appendChild(img);
  });
}


function closeNatMenu() {
  if (nationalityMenu) {
    nationalityMenu.classList.remove("is-open");
  }
  if (nationalityBtn) {
    nationalityBtn.setAttribute("aria-expanded", "false");
  }
}

function toggleNatMenu() {
  if (!nationalityMenu) {
    return;
  }
  const open = nationalityMenu.classList.toggle("is-open");
  if (nationalityBtn) {
    nationalityBtn.setAttribute("aria-expanded", String(open));
  }
}

if (nationalityBtn) {
  nationalityBtn.addEventListener("click", function(e) {
    e.preventDefault();
    toggleNatMenu();
  });
}

if (nationalityMenu) {
  nationalityMenu.addEventListener("click", function(e) {
    const btn = e.target.closest(".countryOption");
    if (!btn) {
      return;
    }

    const iso = btn.getAttribute("data-iso") || "ng";
    const name = btn.getAttribute("data-name") || "Nationality";

    if (nationalityFlag) {
      nationalityFlag.src = "https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/" + iso + ".svg";
      nationalityFlag.alt = name;
    }
    if (nationalityLabel) {
      nationalityLabel.textContent = name;
    }
    if (nationalityValue) {
      nationalityValue.value = iso.toUpperCase();
    }

    closeNatMenu();
  });
}

document.addEventListener("click", function(e) {
  if (e.target.closest("#nationalityBtn") || e.target.closest("#nationalityMenu")) {
    return;
  }
  closeNatMenu();
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    closeNatMenu();
  }
});

// Phone country dropdown
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

// Load doctor name 
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

loadDoctorName();

// Form validation & navigation
const continueBtn = document.querySelector(".btnContinue");
const form = document.querySelector(".formGrid");

if (continueBtn) {
  continueBtn.addEventListener("click", function(e) {
    e.preventDefault();
    
    // Get form values
    const firstNameEl = document.getElementById("firstName");
    const lastNameEl = document.getElementById("lastName");
    const emailEl = document.getElementById("email");
    const genderEl = document.getElementById("gender");
    const addressEl = document.getElementById("address");
    const nationalityEl = document.getElementById("nationality");
    const zipEl = document.getElementById("zip");
    const stateEl = document.getElementById("state");
    const dobEl = document.getElementById("dob");
    const phoneEl = document.getElementById("phone");
    const dialCodeEl = document.getElementById("dialCode");
    
    const firstName = firstNameEl ? firstNameEl.value.trim() : "";
    const lastName = lastNameEl ? lastNameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";
    const gender = genderEl ? genderEl.value : "";
    const address = addressEl ? addressEl.value.trim() : "";
    const nationality = nationalityEl ? nationalityEl.value : "";
    const zip = zipEl ? zipEl.value.trim() : "";
    const state = stateEl ? stateEl.value : "";
    const dob = dobEl ? dobEl.value : "";
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const dialCodeValue = dialCodeEl ? dialCodeEl.textContent : "";
    
    // Validate required fields
    if (!firstName) {
      alert("Please enter First Name");
      if (firstNameEl) {
        firstNameEl.focus();
      }
      return;
    }
    
    if (!lastName) {
      alert("Please enter Last Name");
      if (lastNameEl) {
        lastNameEl.focus();
      }
      return;
    }
    
    if (!email) {
      alert("Please enter Email Address");
      if (emailEl) {
        emailEl.focus();
      }
      return;
    }
    
    // email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address");
      if (emailEl) {
        emailEl.focus();
      }
      return;
    }
    
    if (!gender) {
      alert("Please select Gender");
      if (genderEl) {
        genderEl.focus();
      }
      return;
    }
    
    if (!address) {
      alert("Please enter Address");
      if (addressEl) {
        addressEl.focus();
      }
      return;
    }
    
    if (!nationality) {
      alert("Please select Nationality");
      return;
    }
    
    if (!zip) {
      alert("Please enter Zip code");
      if (zipEl) {
        zipEl.focus();
      }
      return;
    }
    
    if (!state) {
      alert("Please select State");
      if (stateEl) {
        stateEl.focus();
      }
      return;
    }
    
    if (!dob) {
      alert("Please select Date of Birth");
      if (dobEl) {
        dobEl.focus();
      }
      return;
    }
    
    if (!phone) {
      alert("Please enter Phone Number");
      if (phoneEl) {
        phoneEl.focus();
      }
      return;
    }
    
    // Store data in sessionStorage for next page
    const patientData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      gender: gender,
      address: address,
      nationality: nationality,
      zip: zip,
      state: state,
      dob: dob,
      phone: dialCodeValue + phone,
      dialCode: dialCodeValue,
      phoneNumber: phone
    };
    
    sessionStorage.setItem("patientPersonalInfo", JSON.stringify(patientData));
    
    
    window.location.href = "./add_patients2.html";
  });
}
