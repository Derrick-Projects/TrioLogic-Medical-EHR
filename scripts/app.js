// Optional: smooth scroll for the header links (nice + clean)
(function initSmoothScroll() {
  const anchors = document.querySelectorAll('a[href^="#"]');
  
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener("click", function(e) {
      const id = this.getAttribute("href");
      if (!id || id === "#") {
        return;
      }

      const el = document.querySelector(id);
      if (!el) {
        return;
      }

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
