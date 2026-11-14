/**
 * theme.js — Alterna entre modo claro y oscuro.
 * El tema inicial ya se aplica con un script inline en <head> (anti-FOUC).
 * Aquí se cablea el botón y se persiste la elección.
 *
 * El cambio se revela con un círculo que nace del botón y crece hasta cubrir
 * la pantalla (View Transitions API): el navegador fotografía la página con
 * el tema viejo, aplica el nuevo y revela la vista nueva con un recorte
 * circular animado en CSS (@keyframes theme-reveal, «Toggle de tema» en
 * components.css); aquí solo se calculan centro y radio. Sin soporte o con
 * prefers-reduced-motion, el cambio es inmediato.
 *
 * Se captura el <body> y no el documento (la captura «root» por defecto).
 * Capturando el documento, Chrome Android mide las posiciones sticky contra
 * el área de captura, que se extiende bajo su barra de direcciones: con la
 * barra visible, el header quedaba tapado por ella mientras duraba el círculo.
 * Los nombres de captura y el fondo del body son fijos (CSS): al terminar no
 * cambia ningún estilo, para que la página no se recomponga en el último
 * fotograma (en móvil, un parpadeo).
 */
const KEY = "ae-theme";
const root = document.documentElement;

const REVEAL_MS = 500; // = duración de @keyframes theme-reveal (components.css)

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

  // Un toque durante el círculo cortaría de golpe la transición en curso y
  // el tema entero aparecería de una vez (un destello): se ignora hasta que
  // termine (medio segundo).
  let switching = false;

  toggle.addEventListener("click", () => {
    if (switching) return;
    const dark = !isDark();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Con el menú móvil abierto, cambio inmediato: su panel y su fondo son
    // position:fixed, no viajan en la captura del body y desaparecerían
    // mientras dura el círculo.
    const menuOpen = document.querySelector("[data-nav].is-open");
    if (typeof document.startViewTransition !== "function" || reduceMotion || menuOpen) {
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
    // superior (el principio del documento, no el de la pantalla). La
    // animación es CSS (@keyframes theme-reveal): aquí solo se le pasan
    // centro y radio.
    const page = document.body.getBoundingClientRect();
    root.style.setProperty("--reveal-x", `${x - page.left}px`);
    root.style.setProperty("--reveal-y", `${y - page.top}px`);
    root.style.setProperty("--reveal-r", `${radius}px`);

    // Mientras dura el cambio, sin transiciones de color: dentro del círculo
    // tiene que verse ya el tema nuevo, no un fundido desde el viejo.
    switching = true;
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(() => applyTheme(dark, toggle));

    let done = false;
    const cleanUp = () => {
      if (done) return;
      done = true;
      switching = false;
      root.classList.remove("theme-switching");
    };
    transition.finished.then(cleanUp, cleanUp);
    // Red de seguridad: si `finished` no llegara, el botón no se queda bloqueado.
    window.setTimeout(cleanUp, REVEAL_MS + 1500);
    // Si se omite (p. ej. pestaña oculta) el tema ya está aplicado: sin ruido.
    transition.ready.catch(() => {});
  });
}
