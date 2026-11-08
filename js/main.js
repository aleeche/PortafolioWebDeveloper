/**
 * main.js — Punto de entrada. Orquesta la inicialización de los módulos.
 */
import { initTheme } from "./modules/theme.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";
import { initForm } from "./modules/form.js";
import { initScrollNav } from "./modules/scroll-nav.js";
import { initScrollFx } from "./modules/scroll-fx.js";
import { initPointerGlow } from "./modules/pointer.js";
import { initLightbox } from "./modules/lightbox.js";
import { initPageTransition } from "./modules/transition.js";

function start() {
  initPageTransition();
  initTheme();
  initNav();
  initReveal();
  initForm();
  initScrollNav();
  initScrollFx();
  initPointerGlow();
  initLightbox();

  // Año dinámico en el footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
