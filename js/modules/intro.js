/**
 * intro.js — Intro de marca de la landing (≈3 s, primera visita de la sesión).
 *
 * Guion:
 *   1. El monograma AE se dibuja de una sola línea (es un único contorno
 *      cerrado), se asienta en relleno y lo cruza un destello.
 *   2. El nombre entra letra a letra, girando en X con un pequeño rebote, y
 *      se sostiene un instante completo para que se lea.
 *   3. El fondo se desvanece mientras marca y nombre vuelan hasta su sitio en
 *      el header (técnica FLIP: se mide origen y destino y solo se anima
 *      `transform`). Al aterrizar, la marca real del header los releva.
 *
 * Quién decide si se reproduce: el script inline del <head>. Pone
 * `.has-intro` en <html> solo si es la primera visita de la sesión, no se
 * llega a un ancla (#proyectos…) y no hay prefers-reduced-motion. Así la capa
 * tapa la página desde el primer pintado, sin destellos de contenido.
 *
 * Robustez:
 *   - Si este módulo no llega a ejecutarse, una animación CSS retira la capa
 *     sola (ver «INTRO» en sections.css).
 *   - Si arranca tarde (red lenta), se omite: quien ya esperó no debe esperar
 *     más.
 *   - Un clic, tecla, rueda o toque la acelera ×4.
 *   - El destino del vuelo se mide al despegar, no al arrancar: un `resize`
 *     previo (la barra del navegador móvil al cargar) no lo descuadra.
 *
 * Animaciones con la Web Animations API (nativa): permite orquestar un guion
 * con retardos absolutos y acelerarlo entero cambiando `playbackRate`.
 *
 * Devuelve una promesa que se resuelve cuando el contenido ya puede mostrarse
 * (con el vuelo ya avanzado). reveal.js la espera para que el hero entre
 * entonces y no escondido bajo la capa.
 *
 * Para depurar: las herramientas de captura que «asientan» las animaciones
 * antes de fotografiar (Playwright, la extensión de Chrome…) la saltan al
 * final. Para ver un fotograma, pausa `document.getAnimations()` y fija su
 * `currentTime`.
 */
import { splitLetters } from "./split-letters.js";

const html = document.documentElement;

const LATE_START_MS = 2500; // si el módulo llega más tarde, se omite la intro
const FONT_WAIT_MS = 700; // tope de espera a Space Grotesk antes de medir
const SAFETY_MS = 7000; // pase lo que pase, a los 7 s la capa desaparece
const SPEED_UP = 4;

const EASE_TRACE = "cubic-bezier(.45, .05, .2, 1)"; // el mismo del trazo del hero
const EASE_BACK = "cubic-bezier(.34, 1.56, .64, 1)"; // salida con rebote
const EASE_IN_OUT = "cubic-bezier(.65, 0, .35, 1)";

// Guion, en ms desde que arranca la intro.
const T = {
  trace: 120,
  traceDur: 1300,
  glint: 1050,
  glintDur: 800,
  letters: 600,
  letterDur: 520,
  stagger: 30,
  hold: 250, // el nombre, ya completo, quieto antes de despegar (vuelo a los 2,1 s)
  flyDur: 900,
  fadeDur: 700,
  // El hero empieza a entrar con el vuelo ya avanzado: si entrara a la vez,
  // su título (el mismo nombre) se cruzaría con el que va volando.
  revealDelay: 380,
};

export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro || !html.classList.contains("has-intro")) return Promise.resolve();

  let releaseContent;
  const contentReady = new Promise((resolve) => {
    releaseContent = resolve;
  });

  const brand = document.querySelector(".header .brand");
  const mark = intro.querySelector(".intro__mark");
  const markPath = intro.querySelector(".intro__mark-path");
  const glint = intro.querySelector(".intro__glint");
  const name = intro.querySelector(".intro__name");
  const backdrop = intro.querySelector(".intro__backdrop");

  const anims = [];
  let rate = 1;
  const add = (el, keyframes, options) => {
    const anim = el.animate(keyframes, { fill: "both", ...options });
    if (rate !== 1) anim.updatePlaybackRate(rate); // nace ya acelerada
    anims.push(anim);
    return anim;
  };
  const speedUp = () => {
    rate = SPEED_UP;
    anims.forEach((a) => a.updatePlaybackRate(rate));
  };
  const jumpToEnd = () => anims.forEach((a) => a.finish());
  const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

  const unlockScroll = () => {
    html.style.overflow = "";
    html.style.scrollbarGutter = "";
  };

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    SKIP_EVENTS.forEach((type) => window.removeEventListener(type, speedUp));
    window.removeEventListener("resize", jumpToEnd);
    unlockScroll();
    html.classList.add("intro-done"); // muestra la marca real del header
    if (brand) brand.style.animation = "";
    intro.remove();
    releaseContent();
  };

  const canAnimate = typeof intro.animate === "function";
  if (performance.now() > LATE_START_MS || !canAnimate || !brand || !mark || !name) {
    finish();
    return contentReady;
  }

  // Desde aquí manda este módulo: fuera las redes de seguridad del CSS.
  intro.style.animation = "none";
  brand.style.animation = "none";
  // Bloquea el scroll sin que el header se mueva al desaparecer la barra.
  html.style.overflow = "hidden";
  html.style.scrollbarGutter = "stable";

  SKIP_EVENTS.forEach((type) =>
    window.addEventListener(type, speedUp, { passive: true })
  );
  window.setTimeout(finish, SAFETY_MS);

  waitForFont().then(() => {
    if (finished) return;
    try {
      play();
    } catch (_) {
      finish();
    }
  });

  return contentReady;

  // ------------------------------------------------------------------

  function play() {
    const letters = splitLetters(name, "intro__letter");

    // 1 · Trazo del monograma → relleno.
    add(
      markPath,
      [
        { strokeDashoffset: 1, strokeOpacity: 1, fillOpacity: 0, easing: EASE_TRACE },
        { strokeDashoffset: 0, strokeOpacity: 1, fillOpacity: 0, offset: 0.68, easing: "ease-out" },
        { strokeDashoffset: 0, strokeOpacity: 0, fillOpacity: 1 },
      ],
      { duration: T.traceDur, delay: T.trace }
    );

    if (glint) {
      add(
        glint,
        [
          { transform: "translateX(-30px) skewX(-20deg)" },
          { transform: "translateX(130px) skewX(-20deg)" },
        ],
        { duration: T.glintDur, delay: T.glint, easing: "cubic-bezier(.45, 0, .55, 1)" }
      );
    }

    // 2 · Letras.
    letters.forEach((el, i) => {
      add(
        el,
        [
          { opacity: 0, transform: "translateY(.55em) rotateX(-90deg) scale(.6)" },
          { opacity: 1, transform: "translateY(0) rotateX(0deg) scale(1)" },
        ],
        { duration: T.letterDur, delay: T.letters + i * T.stagger, easing: EASE_BACK }
      );
    });

    // Espera sin efecto visual hasta el vuelo: la última letra asentada y el
    // destello ya pasado, más un respiro para leer el nombre. Va en `anims`
    // para acelerarse con el resto si hay prisa.
    const lettersEnd = T.letters + (letters.length - 1) * T.stagger + T.letterDur;
    const flyAt = Math.max(lettersEnd, T.glint + T.glintDur) + T.hold;
    add(intro, null, { duration: flyAt }).finished.then(takeOff, finish);
  }

  // 3 · Vuelo al header + fundido del fondo.
  function takeOff() {
    if (finished) return;

    // Se mide AHORA y no al arrancar: si la ventana cambió de tamaño entre
    // medias (en móvil, la barra de direcciones lo hace al cargar), el
    // destino sigue siendo el bueno.
    const fly = (el, target) => {
      const keyframes = target
        ? [{ transform: "translate(0px, 0px) scale(1)" }, { transform: target }]
        : [{ opacity: 1 }, { opacity: 0 }]; // destino oculto (móvil muy estrecho)
      add(el, keyframes, { duration: T.flyDur, easing: EASE_IN_OUT, fill: "forwards" });
    };
    fly(mark, flyTo(mark, brand.querySelector(".brand__mark")));
    fly(name, flyTo(name, brand.querySelector(".brand__name")));

    add(backdrop, [{ opacity: 1 }, { opacity: 0 }], {
      duration: T.fadeDur,
      easing: "ease-in-out",
      fill: "forwards",
    });

    // La página ya es usable: deja pasar clics y scroll…
    intro.style.pointerEvents = "none";
    unlockScroll();
    // …y el hero entra poco después (espera acelerable como el resto).
    add(intro, null, { duration: T.revealDelay }).finished.then(releaseContent, releaseContent);

    // En pleno vuelo, un cambio de tamaño deja el destino obsoleto: al final.
    window.addEventListener("resize", jumpToEnd);
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);
  }
}

/**
 * Transform que lleva `src` a ocupar la caja de `dst` (con transform-origin
 * 0 0): misma anchura, mismo borde izquierdo y centrado en vertical.
 * Devuelve null si el destino no se ve (p. ej. el nombre oculto en móvil).
 */
function flyTo(src, dst) {
  const a = src.getBoundingClientRect();
  const b = dst ? dst.getBoundingClientRect() : null;
  if (!b || !b.width || !a.width) return null;

  const scale = b.width / a.width;
  const x = b.left - a.left;
  const y = b.top + b.height / 2 - (a.top + (a.height * scale) / 2);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

/** Espera a Space Grotesk para medir con la fuente real, con un tope. */
function waitForFont() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS));
  return Promise.race([
    document.fonts.load('700 1em "Space Grotesk"'),
    timeout,
  ]).catch(() => {});
}
