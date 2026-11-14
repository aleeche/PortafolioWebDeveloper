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
import { initIntro } from "./modules/intro.js";
import { initSignature } from "./modules/signature.js";

function start() {
  // La intro va primero: bloquea el scroll y decide cuándo entra el contenido.
  const contentReady = initIntro();

  initPageTransition();
  initTheme();
  initNav();
  initReveal(contentReady);
  initForm();
  initScrollNav();
  initScrollFx();
  initPointerGlow();
  initLightbox();
  initSignature();

  // Año dinámico en el footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
