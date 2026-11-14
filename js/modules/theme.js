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
 * Se captura el <body> y no el documento (la captura «root» por defecto).
 * Capturando el documento, Chrome Android mide las posiciones sticky contra
 * el área de captura, que se extiende bajo su barra de direcciones: con la
 * barra visible, el header quedaba tapado por ella mientras duraba el círculo.
 */
const KEY = "ae-theme";
const root = document.documentElement;

const REVEAL_MS = 500;
const REVEAL_EASE = "ease-in-out";

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

    // Centro del botón y radio hasta la esquina más lejana del viewport: el
    // círculo termina justo cubriendo la pantalla, esté donde esté el botón.
    const t = toggle.getBoundingClientRect();
    const x = t.left + t.width / 2;
    const y = t.top + t.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    // El recorte se aplica a la captura del body, cuyo origen es su esquina
    // superior (el principio del documento, no el de la pantalla).
    const page = document.body.getBoundingClientRect();
    const cx = x - page.left;
    const cy = y - page.top;

    // Mientras dura el cambio: el body es la capa capturada y no hay
    // transiciones de color (dentro del círculo tiene que verse ya el tema
    // nuevo, no un fundido desde el viejo).
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(() => applyTheme(dark, toggle));
    const cleanUp = () => root.classList.remove("theme-switching");
    transition.finished.then(cleanUp, cleanUp);

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${cx}px ${cy}px)`,
              `circle(${radius}px at ${cx}px ${cy}px)`,
            ],
          },
          {
            duration: REVEAL_MS,
            easing: REVEAL_EASE,
            pseudoElement: "::view-transition-new(page)",
          }
        );
      })
      .catch(() => {
        /* transición omitida (p. ej. pestaña oculta): el tema ya se aplicó */
      });
  });
}
