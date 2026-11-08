/**
 * theme.js — Alterna entre modo claro y oscuro.
 * El tema inicial ya se aplica con un script inline en <head> (anti-FOUC).
 * Aquí solo cableamos el botón y persistimos la elección.
 */
const KEY = "ae-theme";
const root = document.documentElement;

function syncPressed(toggle) {
  const isDark = root.getAttribute("data-theme") === "dark";
  toggle.setAttribute("aria-pressed", String(isDark));
}

export function initTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  syncPressed(toggle);

  toggle.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", "dark");
    }
    try {
      localStorage.setItem(KEY, isDark ? "light" : "dark");
    } catch (e) {
      /* localStorage no disponible: el cambio sigue funcionando en la sesión */
    }
    syncPressed(toggle);
  });
}
