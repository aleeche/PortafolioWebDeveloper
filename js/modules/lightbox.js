/**
 * lightbox.js — Visor de imágenes ampliadas para las páginas de proyecto.
 *
 * Mejora progresiva: sin JS las imágenes se ven igual. Con JS, cada imagen
 * marcada con [data-zoomable] recibe un botón "ampliar" y, al abrirla, se
 * muestra en grande sobre un fondo difuminado, con flechas para navegar
 * entre todas las imágenes de la página.
 */
export function initLightbox() {
  const images = [...document.querySelectorAll("[data-zoomable]")];
  if (!images.length) return;

  // Colección de imágenes (en orden de aparición) para la navegación
  const items = images.map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.getAttribute("alt") || "",
  }));
  const single = items.length < 2;

  let current = 0;
  let lastFocused = null;

  // ---- Construir el visor una sola vez ----
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Visor de imágenes");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <button class="lightbox__btn lightbox__close" type="button" aria-label="Cerrar (Esc)">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <button class="lightbox__btn lightbox__nav lightbox__nav--prev" type="button" aria-label="Imagen anterior">
      <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
    </button>
    <button class="lightbox__btn lightbox__nav lightbox__nav--next" type="button" aria-label="Imagen siguiente">
      <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    </button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="">
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector(".lightbox__img");
  const captionEl = overlay.querySelector(".lightbox__caption");
  const btnClose = overlay.querySelector(".lightbox__close");
  const btnPrev = overlay.querySelector(".lightbox__nav--prev");
  const btnNext = overlay.querySelector(".lightbox__nav--next");

  if (single) {
    btnPrev.hidden = true;
    btnNext.hidden = true;
  }

  function render() {
    const item = items[current];
    imgEl.src = item.src;
    imgEl.alt = item.alt;
    captionEl.textContent = single
      ? item.alt
      : `${item.alt}  ·  ${current + 1} / ${items.length}`;
  }

  function open(index) {
    current = index;
    lastFocused = document.activeElement;
    render();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    btnClose.focus();
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function go(delta) {
    current = (current + delta + items.length) % items.length;
    render();
  }

  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && !single) go(1);
    else if (e.key === "ArrowLeft" && !single) go(-1);
    else if (e.key === "Tab") trapFocus(e);
  }

  // Mantiene el foco dentro del visor mientras está abierto
  function trapFocus(e) {
    const focusables = [...overlay.querySelectorAll("button:not([hidden])")];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => go(-1));
  btnNext.addEventListener("click", () => go(1));

  // Cerrar al pulsar el fondo difuminado (no la imagen ni los controles)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.classList.contains("lightbox__figure")) close();
  });

  // ---- Preparar cada imagen: envolver y añadir el botón de ampliar ----
  images.forEach((img, index) => {
    const wrap = document.createElement("div");
    wrap.className = "zoom-wrap";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    img.style.cursor = "zoom-in";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "zoom-btn";
    btn.setAttribute("aria-label", "Ampliar imagen");
    btn.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i>';
    wrap.appendChild(btn);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      open(index);
    });
    img.addEventListener("click", () => open(index));
  });
}
