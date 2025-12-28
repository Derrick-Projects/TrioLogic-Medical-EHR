(function initMobileNav() {
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMobileNav);
  } else {
    setupMobileNav();
  }

  function setupMobileNav() {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) {
      return;
    }

    
    let mobileMenuBtn = document.getElementById("mobileMenuBtn");
    if (!mobileMenuBtn) {
      mobileMenuBtn = document.createElement("button");
      mobileMenuBtn.id = "mobileMenuBtn";
      mobileMenuBtn.className = "mobileMenuBtn";
      mobileMenuBtn.setAttribute("aria-label", "Open menu");
      mobileMenuBtn.innerHTML = '<svg viewBox="0 0 24 24">' +
        '<line x1="3" y1="6" x2="21" y2="6"></line>' +
        '<line x1="3" y1="12" x2="21" y2="12"></line>' +
        '<line x1="3" y1="18" x2="21" y2="18"></line>' +
        '</svg>';
      
      
      const topbar = document.querySelector(".topbar");
      if (topbar) {
        topbar.insertBefore(mobileMenuBtn, topbar.firstChild);
      }
    }

    
    let overlay = document.getElementById("mobileOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mobileOverlay";
      overlay.className = "mobileOverlay";
      document.body.appendChild(overlay);
    }

    
    let closeBtn = sidebar.querySelector(".sidebar__close");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.className = "sidebar__close";
      closeBtn.setAttribute("aria-label", "Close menu");
      closeBtn.innerHTML = '<svg viewBox="0 0 24 24">' +
        '<line x1="18" y1="6" x2="6" y2="18"></line>' +
        '<line x1="6" y1="6" x2="18" y2="18"></line>' +
        '</svg>';
      sidebar.insertBefore(closeBtn, sidebar.firstChild);
    }

    
    function closeMenu() {
      sidebar.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      document.body.style.overflow = "";
    }

    
    mobileMenuBtn.addEventListener("click", function() {
      sidebar.classList.add("is-open");
      overlay.classList.add("is-visible");
      document.body.style.overflow = "hidden";
    });

    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
        closeMenu();
      }
    });

    
    const navItems = sidebar.querySelectorAll(".snav__item");
    for (let i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener("click", function() {
        if (window.innerWidth <= 768) {
          closeMenu();
        }
      });
    }

    
    window.addEventListener("resize", function() {
      if (window.innerWidth > 768 && sidebar.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }
})();
