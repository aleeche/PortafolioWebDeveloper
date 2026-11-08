/**
 * scroll-nav.js — Salto suave y direccional al pulsar enlaces internos.
 *
 * Reemplaza el scroll por ancla (CSS) con una animación controlada (easing
 * propio) y, al llegar, hace entrar el encabezado de la sección desde abajo
 * (si el usuario bajó) o desde arriba (si subió).
 *
 * Mejora progresiva: sin JS, el ancla nativa + `scroll-behavior` funcionan.
 *
 * Nota: por decisión de producto, este efecto se muestra siempre (no se ata a
 * prefers-reduced-motion). El usuario puede interrumpirlo con rueda/touch/tecla.
 */
export function initScrollNav() {
  const links = document.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let rafId = null;
  const cancel = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
  // El usuario puede interrumpir el desplazamiento en cualquier momento.
  ["wheel", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, cancel, { passive: true })
  );

  const animateTo = (targetY, onDone) => {
    cancel();
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) {
      onDone();
      return;
    }
    const duration = Math.min(1000, Math.max(400, Math.abs(dist) * 0.6));
    let startTime = null;
    const step = (now) => {
      if (startTime === null) startTime = now;
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, Math.round(startY + dist * easeInOutCubic(t)));
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
        onDone();
      }
    };
    rafId = requestAnimationFrame(step);
  };

  const playArrival = (target, direction) => {
    const head =
      target.querySelector(".section__head") || target.querySelector(".hero__intro");
    if (!head) return;
    const cls = direction === "up" ? "is-arriving-up" : "is-arriving-down";
    head.classList.remove("is-arriving-up", "is-arriving-down");
    void head.offsetWidth; // reinicia la animación si se repite
    head.classList.add(cls);
    head.addEventListener(
      "animationend",
      () => head.classList.remove(cls),
      { once: true }
    );
  };

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      // Mismo hueco que el salto de ancla nativo (scroll-margin-top en CSS):
      // si no se descuenta, el destino queda tapado tras el header sticky.
      const scrollMarginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const targetY = Math.round(target.getBoundingClientRect().top + window.scrollY - scrollMarginTop);
      const direction = targetY > window.scrollY ? "down" : "up";

      animateTo(targetY, () => {
        history.pushState(null, "", hash);
        // Foco accesible sin volver a desplazar la página.
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        playArrival(target, direction);
      });
    });
  });
}
