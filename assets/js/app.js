/* ==========================================================================
   BrandLinker HQ — Core Interactions, Liquid Glass Sheen & UI Controls
   ========================================================================== */
(function () {
  // 1. Sticky Header State
  const header = document.querySelector(".site-header");
  if (header) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  // 2. Mobile Navigation Drawer
  const navToggle = document.querySelector(".nav-toggle");
  const mobileDrawer = document.querySelector(".mobile-drawer");
  if (navToggle && mobileDrawer) {
    const closeDrawer = () => {
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      mobileDrawer.classList.remove("is-open");
      document.body.style.overflow = "";
    };

    navToggle.addEventListener("click", () => {
      const open = !mobileDrawer.classList.contains("is-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      mobileDrawer.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });

    mobileDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeDrawer);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileDrawer.classList.contains("is-open")) {
        closeDrawer();
      }
    });
  }

  // 3. Liquid Glass & Card Cursor-Tracking Specular Highlight
  const interactiveSurfaces = document.querySelectorAll(".btn-glass, .brand-card");
  interactiveSurfaces.forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x.toFixed(1)}%`);
      el.style.setProperty("--my", `${y.toFixed(1)}%`);
    });
  });

  // 4. Scroll Reveal Animations
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length > 0) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }
  }

  // 5. Brands Page Filter
  const filterBtns = document.querySelectorAll("[data-filter]");
  const showcaseItems = document.querySelectorAll("[data-category]");
  if (filterBtns.length && showcaseItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const selected = btn.getAttribute("data-filter");
        filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        showcaseItems.forEach((item) => {
          const cat = item.getAttribute("data-category");
          const match = selected === "all" || cat === selected;
          item.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  // 6. Contact Form Pre-fill via Query Param (?brand=...) & Submission Handling
  const contactForm = document.getElementById("hq-contact-form");
  if (contactForm) {
    const brandSelect = document.getElementById("inquiry-brand");
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get("brand");
    if (preselect && brandSelect) {
      const option = Array.from(brandSelect.options).find(
        (opt) => opt.value.toLowerCase() === preselect.toLowerCase()
      );
      if (option) brandSelect.value = option.value;
    }

    const statusEl = document.getElementById("form-status");
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const name = (document.getElementById("inquiry-name")?.value || "").trim();
      const topic = brandSelect ? brandSelect.options[brandSelect.selectedIndex].text : "BrandLinker HQ";

      if (statusEl) {
        statusEl.textContent = `Thank you, ${name}. Your inquiry regarding ${topic} has been logged with BrandLinker Headquarters. Our team will respond within one business day.`;
        statusEl.classList.add("is-visible");
      }

      contactForm.reset();
    });
  }
})();
