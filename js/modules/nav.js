/**
 * nav.js — Menú móvil, sombra del header al hacer scroll y scroll-spy.
 */
export function initNav() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const backdrop = document.querySelector("[data-nav-backdrop]");

  /* --- Header: sombra al hacer scroll + altura real para el salto del nav --- */
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Publica la altura real del header en --header-h para que scroll-margin-top
    // posicione bien el destino del salto en cada breakpoint (el header no mide
    // lo mismo en móvil, tablet y escritorio).
    const setHeaderH = () =>
      document.documentElement.style.setProperty("--header-h", `${Math.round(header.offsetHeight)}px`);
    setHeaderH();
    if ("ResizeObserver" in window) {
      new ResizeObserver(setHeaderH).observe(header);
    } else {
      window.addEventListener("resize", setHeaderH, { passive: true });
      window.addEventListener("load", setHeaderH);
    }
  }

  /* --- Menú móvil --- */
  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove("is-open");
      backdrop?.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    const openMenu = () => {
      nav.classList.add("is-open");
      backdrop?.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeMenu() : openMenu();
    });

    backdrop?.addEventListener("click", closeMenu);
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  /* --- Scroll-spy: resalta el enlace de la sección visible --- */
  const spyLinks = [...document.querySelectorAll("[data-spy]")];
  const sections = spyLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            spyLinks.forEach((link) =>
              link.classList.toggle("is-active", link.getAttribute("href") === id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }
}
