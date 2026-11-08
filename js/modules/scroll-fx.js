/**
 * scroll-fx.js — Efectos ligados al scroll:
 *   1) Barra de progreso de lectura (fina, en el borde superior).
 *   2) Parallax sutil del hero (profundidad entre capas).
 *
 * Todo se actualiza en un único handler con throttle por requestAnimationFrame.
 *
 * La barra de progreso se muestra siempre: no es decoración, informa de la
 * posición de lectura. El parallax sí es decoración, así que se apaga con
 * `prefers-reduced-motion: reduce` (y se reactiva si la preferencia cambia
 * en caliente, devolviendo las capas a su sitio).
 */
export function initScrollFx() {
  // --- Barra de progreso ---
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  // --- Referencias para el parallax del hero ---
  const hero = document.querySelector(".hero");
  const heroVisual = document.querySelector(".hero-visual");
  const heroMark = document.querySelector(".hero-visual__mark");

  // El .hero-visual tiene data-reveal (anima su transform al entrar). Para no
  // pisar esa animación, solo tomamos el control de su transform cuando el
  // reveal ha terminado. La capa __mark no tiene reveal: es segura desde ya.
  let visualReady = false;
  if (heroVisual) {
    if (heroVisual.classList.contains("is-visible")) visualReady = true;
    heroVisual.addEventListener(
      "transitionend",
      (e) => {
        if (e.propertyName === "transform") visualReady = true;
      },
      { once: true }
    );
    // Fallback: si el transitionend no llega (p. ej. reveal instantáneo),
    // activamos el parallax igualmente pasado el tiempo del reveal.
    setTimeout(() => {
      visualReady = true;
    }, 700);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // El monograma vive DENTRO de .hero-visual, así que hereda su transform y
  // los dos se suman. Este valor es solo el extra: el total real es
  // 0.12 + 0.05 = 0.17. Al ser el fondo debe quedarse más atrás que las
  // tarjetas (0.12), pero por poco; con la diferencia grande de antes se
  // despegaba de la composición y se salía de su caja al bajar.
  const MARK_EXTRA = 0.05;

  const clearParallax = () => {
    if (heroVisual) heroVisual.style.transform = "";
    if (heroMark) heroMark.style.transform = "";
  };

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${docH > 0 ? Math.min(1, y / docH) : 0})`;

    if (!reducedMotion.matches && hero && y < hero.offsetHeight) {
      if (visualReady && heroVisual) {
        heroVisual.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
      }
      if (heroMark) {
        heroMark.style.transform = `translate3d(0, ${y * MARK_EXTRA}px, 0)`;
      }
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  // Si la preferencia cambia con la página abierta, hay que limpiar los
  // transforms ya aplicados: si no, las capas se quedarían congeladas
  // desplazadas justo al activar "reducir movimiento".
  reducedMotion.addEventListener("change", () => {
    clearParallax();
    onScroll();
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}
