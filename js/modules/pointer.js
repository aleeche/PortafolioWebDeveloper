/**
 * pointer.js — Glow ambiental que sigue al puntero.
 *
 * Una luz radial muy tenue detrás del contenido (z-index: -1), que asoma por
 * las zonas de lienzo alrededor de las tarjetas. Da sensación de fuente de luz
 * sobre el soft UI sin restar legibilidad.
 *
 * Solo se activa con puntero fino (ratón/trackpad); en táctil no se crea nada.
 * Por decisión de producto, se muestra siempre (no se ata a reduced-motion).
 */
export function initPointerGlow() {
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return;

  const SIZE = 600;
  const glow = document.createElement("div");
  glow.className = "pointer-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  let x = 0;
  let y = 0;
  let ticking = false;
  const render = () => {
    glow.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
    ticking = false;
  };

  window.addEventListener(
    "mousemove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!glow.classList.contains("is-active")) glow.classList.add("is-active");
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => glow.classList.remove("is-active"));
}
