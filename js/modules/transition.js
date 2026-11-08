/**
 * transition.js — Transición suave entre páginas.
 *
 * Problema que resuelve: al navegar entre documentos HTML separados (landing ↔
 * fichas de proyecto) el navegador recarga y se ve un parpadeo brusco. Aquí
 * cubrimos ese hueco con un velo del color del canvas: fade-in al llegar y
 * fade-out (tapando) al salir.
 *
 * Reparto de responsabilidades:
 *   - Entrada: la anima el CSS solo (animación en `.js-nav .page-veil`), así se
 *     auto-cura aunque este módulo falle o tarde en cargar.
 *   - Salida: la controla este módulo interceptando los clics en enlaces
 *     internos, y navega cuando el velo ya tapa.
 *
 * Mejora progresiva: la clase `.js-nav` la añade un script del <head>. Sin JS
 * nunca se activa el velo y la navegación es la nativa del navegador.
 *
 * NO interfiere con scroll-nav.js: los enlaces de ancla (href="#…") se ignoran
 * aquí y los sigue gestionando aquel módulo.
 */
export function initPageTransition() {
  const veil = document.querySelector("[data-page-veil]");
  if (!veil) return;

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Si el usuario vuelve con "atrás" y la página se restaura desde la bfcache,
  // el velo podría quedar congelado tapando el contenido: lo destapamos.
  window.addEventListener("pageshow", () => {
    veil.classList.remove("is-leaving");
  });

  if (prefersReduced) return; // sin animación de salida: navegación nativa.

  document.addEventListener("click", (e) => {
    // Respeta clics de sistema (abrir en pestaña nueva…) y botones no primarios.
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    // Se descartan: anclas internas (las gestiona scroll-nav.js), descargas,
    // enlaces que abren en otra pestaña y protocolos especiales (mailto/tel).
    if (href.startsWith("#")) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;
    if (/^(mailto:|tel:)/i.test(href)) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (_) {
      return;
    }

    if (url.origin !== window.location.origin) return; // enlace externo
    // Misma página y solo cambia el hash → es un salto interno, no navegamos.
    if (url.pathname === window.location.pathname && url.hash) return;

    e.preventDefault();
    veil.classList.add("is-leaving");

    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.location.href = url.href;
    };

    // Navega cuando el velo termina de tapar…
    veil.addEventListener("animationend", go, { once: true });
    // …y una red de seguridad por si el evento no llega a dispararse.
    window.setTimeout(go, 600);
  });
}
