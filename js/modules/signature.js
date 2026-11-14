/**
 * signature.js — Firma del footer: el apellido a todo el ancho, cortado por
 * el borde inferior, con las letras subiendo en cascada al entrar en
 * pantalla (una sola vez).
 *
 * Mejora progresiva: sin JS o con prefers-reduced-motion, la palabra se ve
 * quieta y completa. El estado oculto de partida lo pone este módulo
 * (`.is-armed`), nunca el CSS por su cuenta: si algo falla, no se queda
 * invisible.
 */
import { splitLetters } from "./split-letters.js";

export function initSignature() {
  const word = document.querySelector("[data-signature]");
  if (!word) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  splitLetters(word, "footer__signature-letter").forEach((el, i) => {
    el.style.setProperty("--i", i); // escalona el retardo en CSS
  });
  word.classList.add("is-armed");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        word.classList.add("is-in");
        obs.disconnect();
      }
    },
    // Arranca cuando el borde superior asoma al 95% de la ventana.
    { rootMargin: "0px 0px -5% 0px" }
  );
  observer.observe(word);
}
