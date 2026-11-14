/**
 * theme.js — Alterna entre modo claro y oscuro.
 * El tema inicial ya se aplica con un script inline en <head> (anti-FOUC).
 * Aquí se cablea el botón y se persiste la elección.
 *
 * El cambio se revela con un círculo que nace del botón y crece hasta cubrir
 * la pantalla (View Transitions API): el navegador fotografía la página con
 * el tema viejo, aplica el nuevo y aquí se anima el recorte de la vista nueva
 * (CSS en «Toggle de tema», components.css). Sin soporte o con
 * prefers-reduced-motion, el cambio es inmediato.
 *
 * El header va en una captura propia (`.theme-switching .header` le da un
 * view-transition-name). Dentro de la captura de la página, en móvil con la
 * barra de direcciones visible, el header sticky quedaba tapado por ella y
 * desaparecía mientras duraba el círculo. Como capa aparte, el navegador lo
 * coloca según su caja real.
 */
const KEY = "ae-theme";
const root = document.documentElement;

const REVEAL_MS = 500;
const REVEAL_EASE = "ease-in-out";
const HEADER_LAYER = "site-header"; // = view-transition-name del CSS

const isDark = () => root.getAttribute("data-theme") === "dark";

function syncPressed(toggle) {
  toggle.setAttribute("aria-pressed", String(isDark()));
}

function applyTheme(dark, toggle) {
  if (dark) {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch (e) {
    /* localStorage no disponible: el cambio sigue funcionando en la sesión */
  }
  syncPressed(toggle);
}

/** Lee una propiedad calculada de un pseudo de la transición (o null). */
function pseudoStyle(pseudo) {
  try {
    return getComputedStyle(root, pseudo);
  } catch (e) {
    return null;
  }
}

/** Traslación (x, y) de un transform calculado; 0,0 si no se puede leer. */
function translationOf(transform) {
  try {
    const m = new DOMMatrixReadOnly(transform && transform !== "none" ? transform : undefined);
    return { x: m.m41, y: m.m42 };
  } catch (e) {
    return { x: 0, y: 0 };
  }
}

export function initTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  syncPressed(toggle);

  toggle.addEventListener("click", () => {
    const dark = !isDark();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition !== "function" || reduceMotion) {
      applyTheme(dark, toggle);
      return;
    }

    // Centro del botón, medido antes de las capturas (coordenadas del viewport).
    const t = toggle.getBoundingClientRect();
    const x = t.left + t.width / 2;
    const y = t.top + t.height / 2;
    const header = toggle.closest(".header");
    const h = header ? header.getBoundingClientRect() : null;

    // Sin transiciones de color mientras dura el cambio (dentro del círculo
    // tiene que verse ya el tema nuevo, no un fundido desde el viejo) y con
    // el header en su propia capa.
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(() => applyTheme(dark, toggle));
    const cleanUp = () => root.classList.remove("theme-switching");
    transition.finished.then(cleanUp, cleanUp);

    transition.ready
      .then(() => {
        // Las capas de la transición no usan el viewport como origen sino el
        // «snapshot containing block», que en móvil incluye la barra de
        // direcciones: el centro medido arriba quedaría ~56 px por encima del
        // botón. El desfase se lee de dónde ha colocado el navegador la capa
        // del header (en escritorio es 0).
        let dx = 0;
        let dy = 0;
        if (h) {
          const group = pseudoStyle(`::view-transition-group(${HEADER_LAYER})`);
          const at = translationOf(group && group.transform);
          dx = at.x - h.left;
          dy = at.y - h.top;
        }
        const cx = x + dx;
        const cy = y + dy;

        // Radio hasta la esquina más lejana de esa misma área.
        const area = pseudoStyle("::view-transition");
        const w = (area && parseFloat(area.width)) || window.innerWidth;
        const hgt = (area && parseFloat(area.height)) || window.innerHeight;
        const radius = Math.hypot(Math.max(cx, w - cx), Math.max(cy, hgt - cy));

        const reveal = (layer, px, py) =>
          root.animate(
            {
              clipPath: [
                `circle(0px at ${px}px ${py}px)`,
                `circle(${radius}px at ${px}px ${py}px)`,
              ],
            },
            {
              duration: REVEAL_MS,
              easing: REVEAL_EASE,
              pseudoElement: `::view-transition-new(${layer})`,
            }
          );

        reveal("root", cx, cy);
        // El mismo círculo sobre la capa del header, en sus coordenadas
        // locales: los dos bordes coinciden y se ve un único círculo.
        if (h) reveal(HEADER_LAYER, x - h.left, y - h.top);
      })
      .catch(() => {
        /* transición omitida (p. ej. pestaña oculta): el tema ya se aplicó */
      });
  });
}
