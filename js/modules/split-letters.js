/**
 * split-letters.js — Parte el texto de un elemento en un <span> por letra
 * para poder animarlas por separado (intro y firma del footer).
 *
 * Ojo con la accesibilidad: un lector de pantalla leería las letras sueltas.
 * Úsalo solo dentro de contenedores decorativos con aria-hidden="true".
 *
 * Marca el elemento con `.is-split`: el CSS lo usa para saber si los estilos
 * de texto van en el bloque entero (sin partir) o en cada letra.
 */
export function splitLetters(el, letterClass) {
  // [...texto] separa por caracteres reales, no por unidades UTF-16.
  const chars = [...el.textContent.trim()];
  const frag = document.createDocumentFragment();

  const letters = chars.map((ch) => {
    const span = document.createElement("span");
    span.className = letterClass;
    span.textContent = ch;
    frag.appendChild(span);
    return span;
  });

  el.replaceChildren(frag);
  el.classList.add("is-split");
  return letters;
}
