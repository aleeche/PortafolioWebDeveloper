/**
 * reveal.js — Animación de entrada al hacer scroll (IntersectionObserver).
 * Respeta prefers-reduced-motion: si está activo, muestra todo de inmediato.
 *
 * `ready`: promesa tras la que empieza a observar. La landing le pasa la de
 * la intro para que el hero entre cuando el fondo de la intro se desvanece,
 * no escondido debajo de ella.
 */
export function initReveal(ready = Promise.resolve()) {
  // Este módulo toma el relevo: desactiva la red de seguridad del CSS, que
  // muestra el contenido sola si el JS nunca llega (ver components.css).
  document.documentElement.classList.add("reveal-ready");

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

  ready.then(() => els.forEach((el) => observer.observe(el)));
}
