/**
 * intro.js — Intro de marca de la landing (≈3 s, primera visita de la sesión).
 *
 * Guion:
 *   1. El monograma AE se dibuja de una sola línea (es un único contorno
 *      cerrado), se asienta en relleno y lo cruza un destello.
 *   2. El nombre entra letra a letra, girando en X con un pequeño rebote, y
 *      se sostiene un instante completo para que se lea.
 *   3. Zoom de apertura, al estilo de la app de X (antes Twitter): el nombre
 *      se despide en su sitio y el monograma, solo, toma aire (encoge un
 *      poco) y se lanza hacia la pantalla. No es un dibujo que crece sino un
 *      hueco con su forma: al agrandarse destapa la página, que se ve a
 *      través de él y se asienta (crece un pelo, como si la cámara avanzara
 *      con el monograma).
 *
 * Cómo se hace el hueco (paso 3): en un mismo fotograma, el fondo y el
 * monograma dibujado se cambian por un telón SVG a pantalla completa (un
 * rectángulo del color del fondo con el contorno del monograma recortado,
 * fill-rule evenodd) y, debajo, un núcleo del color de acento que asoma por
 * el hueco. Juntos se ven idénticos al monograma relleno. Luego el telón
 * escala alrededor del punto más grueso del trazo (POLE) y el núcleo se
 * desvanece: por el hueco aparece la página. El telón es vectorial y se
 * repinta en cada fotograma, así que se ve nítido a ×100 (una capa escalada
 * por el compositor se pixelaría).
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
 *   - El zoom se mide al lanzarse, no al arrancar: un `resize` previo (la
 *     barra del navegador móvil al cargar) no lo descentra.
 *
 * Animaciones con la Web Animations API (nativa): permite orquestar un guion
 * con retardos absolutos y acelerarlo entero cambiando `playbackRate`.
 *
 * Devuelve una promesa que se resuelve cuando el contenido ya puede mostrarse
 * (al empezar el zoom). reveal.js la espera para que el hero entre entonces y
 * no escondido bajo la capa.
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
const EASE_BREATHE = "cubic-bezier(.45, 0, .55, 1)"; // tomar aire: suave a ambos lados
const EASE_ZOOM = "cubic-bezier(.6, 0, .35, 1)"; // arranca contenido, estalla y se calma
const EASE_SETTLE = "cubic-bezier(.22, 1, .36, 1)"; // = --ease (tokens.css)

// Guion de los pasos 1 y 2, en ms desde que arranca la intro.
const T = {
  trace: 120,
  traceDur: 1300,
  glint: 1050,
  glintDur: 800,
  letters: 600,
  letterDur: 520,
  stagger: 30,
  hold: 250, // el nombre, ya completo, quieto antes del zoom (a los 2,1 s)
};

// Paso 3: el zoom. Las escalas son relativas al monograma en reposo.
const Z = {
  squeeze: 0.86, // tomar aire: encoge hasta aquí antes de lanzarse
  squeezeDur: 280,
  zoomDur: 720,
  steps: 24, // fotogramas clave del zoom (ver zoomIn)
  // El monograma sigue macizo mientras se acerca y, ya grande, se vuelve
  // ventana: su acento se desvanece entre estas escalas.
  coreFade: [2.5, 10],
  // El nombre no hace zoom: se despide en su sitio mientras el monograma toma
  // aire, antes de que el hueco llegue a pasar por debajo de él.
  nameOutDur: 260,
  nameDrop: "0.25em", // bajada mínima al irse, para que no sea un simple apagón
  curtainFadeFrom: 0.45, // las últimas esquinas del telón salen fundiéndose
  settleFrom: 0.95, // la página, detrás, se asienta desde esta escala
};

// Centro del zoom, en unidades del viewBox del monograma (0 0 100 68.65): el
// punto del trazo más alejado de sus bordes, en el asta de la E bajo el brazo
// superior. Es el último en quedar descubierto, así que la página se destapa
// antes (y con menos escala) que con cualquier otro centro. `r` es el radio
// del mayor círculo que cabe ahí dentro (6,17, con margen): cuando ese
// círculo ya cubre la pantalla, el zoom puede terminar.
// Depende del trazado: si cambia assets/img/logo-ae.svg, hay que recalcularlo.
const POLE = { x: 55.7, y: 31.2, r: 6 };

export function initIntro() {
  const intro = document.querySelector("[data-intro]");
  if (!intro || !html.classList.contains("has-intro")) return Promise.resolve();

  let releaseContent;
  const contentReady = new Promise((resolve) => {
    releaseContent = resolve;
  });

  const mark = intro.querySelector(".intro__mark");
  const markPath = intro.querySelector(".intro__mark-path");
  const glint = intro.querySelector(".intro__glint");
  const name = intro.querySelector(".intro__name");
  const core = intro.querySelector(".intro__core");
  const curtain = intro.querySelector(".intro__curtain");
  const curtainShape = intro.querySelector(".intro__curtain-shape");
  const page = document.querySelector("main");

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

  // El asentamiento de la página se hace sobre <main>, fuera de la capa: si
  // la intro termina antes de tiempo, no puede quedarse a medio escalar.
  let settle = null;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    SKIP_EVENTS.forEach((type) => window.removeEventListener(type, speedUp));
    window.removeEventListener("resize", jumpToEnd);
    if (settle) settle.finish();
    html.style.overflow = "";
    html.style.scrollbarGutter = "";
    intro.remove();
    releaseContent();
  };

  const canAnimate = typeof intro.animate === "function";
  if (
    performance.now() > LATE_START_MS ||
    !canAnimate ||
    !mark ||
    !markPath ||
    !name ||
    !core ||
    !curtain ||
    !curtainShape
  ) {
    finish();
    return contentReady;
  }

  // Desde aquí manda este módulo: fuera la red de seguridad del CSS.
  intro.style.animation = "none";
  // Bloquea el scroll (hasta el final: la página no se ve entera hasta que
  // termina el zoom) sin que el header se mueva al desaparecer la barra.
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

    // Espera sin efecto visual hasta el zoom: la última letra asentada y el
    // destello ya pasado, más un respiro para leer el nombre. Va en `anims`
    // para acelerarse con el resto si hay prisa.
    const lettersEnd = T.letters + (letters.length - 1) * T.stagger + T.letterDur;
    const zoomAt = Math.max(lettersEnd, T.glint + T.glintDur) + T.hold;
    add(intro, null, { duration: zoomAt }).finished.then(zoomIn, finish);
  }

  // 3 · Zoom de apertura.
  function zoomIn() {
    if (finished) return;

    // Se mide AHORA y no al arrancar: si la ventana cambió de tamaño entre
    // medias (en móvil, la barra de direcciones lo hace al cargar), el zoom
    // sigue saliendo del monograma.
    const box = curtain.getBoundingClientRect(); // = la pantalla
    const m = mark.getBoundingClientRect();
    const k = m.width / 100; // px por unidad del dibujo (el viewBox mide 100)
    // Centro del zoom en coordenadas del telón (px desde su esquina).
    const px = m.left - box.left + POLE.x * k;
    const py = m.top - box.top + POLE.y * k;

    // Distancia a la esquina más lejana: cuando el círculo de POLE la
    // alcanza, el hueco cubre la pantalla entera.
    const reach = Math.max(
      Math.hypot(px, py),
      Math.hypot(box.width - px, py),
      Math.hypot(px, box.height - py),
      Math.hypot(box.width - px, box.height - py)
    );
    const end = Math.max(reach / (POLE.r * k), 8);

    // El telón: un cuadrado que tapa la pantalla incluso con el monograma
    // encogido, menos el monograma (su mismo trazado). Unidades del dibujo.
    const half = reach / (Z.squeeze * k) + 10;
    const r2 = (n) => Math.round(n * 100) / 100;
    curtainShape.setAttribute(
      "d",
      `M${r2(POLE.x - half)} ${r2(POLE.y - half)}h${r2(2 * half)}v${r2(2 * half)}` +
        `h${r2(-2 * half)}Z ${markPath.getAttribute("d")}`
    );

    // Transform del telón con el monograma a escala `s` alrededor del centro.
    // Solo cambia `s` entre fotogramas: interpolar traslación y escala por
    // separado sigue siendo exactamente un zoom sobre ese punto.
    const curtainAt = (s) =>
      `translate(${r2(px - s * k * POLE.x)}px, ${r2(py - s * k * POLE.y)}px) scale(${s * k})`;

    // Tomar aire (solo el monograma).
    add(curtainShape, [{ transform: curtainAt(1) }, { transform: curtainAt(Z.squeeze) }], {
      duration: Z.squeezeDur,
      easing: EASE_BREATHE,
    });

    // El nombre se va en su sitio, sin escalar.
    add(
      name,
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: `translateY(${Z.nameDrop})` },
      ],
      { duration: Z.nameOutDur, easing: "cubic-bezier(.4, 0, 1, 1)" }
    );

    // Lanzarse. Las escalas se reparten en progresión geométrica: un zoom se
    // percibe en proporciones (de ×1 a ×2 se siente igual que de ×50 a ×100),
    // y así la curva EASE_ZOOM manda de verdad sobre el ritmo. Todos los
    // elementos comparten fotogramas y curva: sus fundidos van atados a la
    // escala del telón, no al reloj.
    const scales = [];
    for (let i = 0; i <= Z.steps; i++) {
      scales.push(Z.squeeze * (end / Z.squeeze) ** (i / Z.steps));
    }
    const frames = (fn) => scales.map((s, i) => ({ offset: i / Z.steps, ...fn(s) }));
    const launch = {
      duration: Z.zoomDur,
      delay: Z.squeezeDur,
      easing: EASE_ZOOM,
      fill: "forwards", // en su espera manda «tomar aire»
    };
    add(
      curtainShape,
      frames((s) => ({
        transform: curtainAt(s),
        opacity: fadeOut(s, end * Z.curtainFadeFrom, end),
      })),
      launch
    );
    add(core, frames((s) => ({ opacity: fadeOut(s, ...Z.coreFade) })), launch);

    // La página se asienta detrás, desde el mismo centro. Solo durante el
    // zoom (fill backwards): al terminar, <main> se queda sin transform.
    if (page) {
      const p = page.getBoundingClientRect();
      const origin = `${box.left + px - p.left}px ${box.top + py - p.top}px`;
      settle = add(
        page,
        [
          { transformOrigin: origin, transform: `scale(${Z.settleFrom})` },
          { transformOrigin: origin, transform: "scale(1)" },
        ],
        { duration: Z.zoomDur, delay: Z.squeezeDur, easing: EASE_SETTLE, fill: "backwards" }
      );
    }

    // Todo lo anterior entra en el mismo fotograma que este cambio de capas:
    // el telón y el núcleo relevan al fondo y al monograma sin que se note.
    intro.classList.add("is-zooming");

    // El hero entra al lanzarse el zoom: sube mientras se destapa (espera
    // acelerable como el resto).
    add(intro, null, { duration: Z.squeezeDur }).finished.then(releaseContent, releaseContent);

    // En pleno zoom, un cambio de tamaño deja el centro obsoleto: al final.
    window.addEventListener("resize", jumpToEnd);
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);
  }
}

/**
 * Opacidad que se funde de 1 a 0 mientras la escala `s` va de `from` a `to`,
 * en proporción (escala logarítmica, como se percibe el zoom).
 */
function fadeOut(s, from, to) {
  const t = Math.log(s / from) / Math.log(to / from);
  return Math.round(Math.min(1, Math.max(0, 1 - t)) * 1000) / 1000;
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
