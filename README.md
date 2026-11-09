# Portafolio — Alejandro Echeverría Garrido

Sitio web personal y portafolio profesional de **Alejandro Echeverría Garrido**, desarrollador Full Stack.

Construido a mano con **HTML5, CSS3 y JavaScript Vanilla** (sin frameworks ni librerías de UI), siguiendo un lenguaje visual propio: **Soft UI de precisión** con modo claro/oscuro.

---

## Tecnologías

- **HTML5** semántico
- **CSS3** (custom properties, grid, container/media queries)
- **JavaScript Vanilla** con ES Modules
- **Google Fonts** — Space Grotesk + Inter
- **Font Awesome** — iconografía

Sin build, sin dependencias que instalar.

---

## Estructura

```
.
├── index.html                 # Landing (una sola página)
├── proyectos/                 # Páginas de detalle de cada proyecto (case studies)
├── css/                        # Capas ITCSS, enlazadas en este orden
│   ├── tokens.css              # Variables de diseño + modo oscuro
│   ├── base.css                # Reset + tipografía + elementos
│   ├── layout.css              # Contenedor, header, footer, grid
│   ├── components.css          # Botones, tarjetas, chips, timeline, formularios…
│   ├── sections.css            # Estilos específicos de cada sección del landing
│   └── case-study.css          # Estilos exclusivos de las páginas de proyectos/
├── js/
│   ├── main.js                 # Punto de entrada (type="module")
│   └── modules/
│       ├── theme.js            # Modo claro/oscuro (persistido en localStorage)
│       ├── nav.js              # Menú móvil + sombra del header + scroll-spy
│       ├── reveal.js           # Animación de entrada (IntersectionObserver)
│       ├── form.js             # Validación + envío del formulario (Formspree AJAX)
│       ├── scroll-nav.js       # Salto suave y direccional al pulsar el nav
│       ├── scroll-fx.js        # Barra de progreso de lectura + parallax del hero
│       ├── pointer.js          # Glow ambiental que sigue al puntero
│       ├── lightbox.js         # Visor de capturas en las páginas de proyecto
│       └── transition.js       # Transición de salida entre páginas
└── assets/
    ├── img/                    # Logo, foto de Hero, og-image y capturas de proyectos
    └── favicon/                # Iconos generados con escala óptica
```

---

## Cómo ejecutarlo en local

Como el sitio usa **ES Modules**, hay que servirlo por HTTP (no abrir `index.html` con `file://`).

Opciones:

```bash
# Con Python
python -m http.server 8000

# Con Node
npx serve
```

Luego abre `http://localhost:8000`.

En VS Code también puedes usar la extensión **Live Server**.

---

## Despliegue (GitHub Pages)

1. Sube el repositorio a GitHub.
2. Settings → Pages → Source: rama `main`, carpeta `/root`.
3. El archivo `.nojekyll` ya está incluido para servir correctamente las carpetas.

También funciona en Netlify o Vercel arrastrando la carpeta (sitio estático).

---

## Estado actual

- Landing completa: Hero, Sobre mí, Habilidades, Trayectoria, Proyectos, Contacto y Footer, con contenido real.
- 5 páginas de detalle en `proyectos/` (case studies de cada proyecto del portafolio).
- Modo claro/oscuro, responsive (mobile-first) y accesibilidad base (skip-link, foco visible, `prefers-reduced-motion`).
- Formulario de contacto conectado a Formspree.
- Retrato de «Sobre mí» en `assets/img/programador-foto.webp` (WebP con transparencia, 433×541, 4:5). El fondo lo pone el marco en CSS (`.about__photo img`), así que sigue al tema claro/oscuro.
