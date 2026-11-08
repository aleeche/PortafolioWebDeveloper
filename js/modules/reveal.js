/**
 * reveal.js — Animación de entrada al hacer scroll (IntersectionObserver).
 * Respeta prefers-reduced-motion: si está activo, muestra todo de inmediato.
 */
export function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  els.forEach((el) => observer.observe(el));
}
