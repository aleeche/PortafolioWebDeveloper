# CLAUDE.md — Contexto del proyecto

Portafolio web personal y profesional de **Alejandro Echeverría Garrido**, desarrollador Full Stack (título oficial: Perito en Computación, graduado en 2026; la carrera se llama Perito en Informática).

Objetivo: portafolio profesional para buscar empleo como desarrollador, reutilizable durante varios años. El sitio es público: no incluir datos personales sensibles ni referirse al autor como estudiante. Debe transmitir profesionalismo y sentirse premium, limpio y atemporal.

---

## 🤝 Cómo trabajar en este proyecto (importante)

Alejandro quiere que actúes como un **equipo de desarrollo senior** (Product/UI/UX Designer, Frontend Architect/Engineer, Design System Specialist), **no como un simple generador de código**.

- **Cuestiona sus decisiones** cuando convenga y **propón mejores alternativas**, justificándolas desde lo técnico y la experiencia de usuario.
- Prioriza la **calidad sobre la rapidez**. No es un proyecto escolar; es un producto real.
- Trabaja de forma **iterativa** y valida los cambios con él.
- Idioma de trabajo: **español**.

---

## 🚫 Stack y restricciones (no negociable)

**Permitido:** HTML5, CSS3, JavaScript Vanilla (ES Modules), Google Fonts, Font Awesome.

**Prohibido:** Bootstrap, Tailwind, React, cualquier framework o librería de componentes, y cualquier paso de *build*. Todo se construye a mano.

---

## 🎨 Sistema de diseño — "Soft UI de precisión"

Base limpia y disciplinada (estilo Linear/Figma) + calidez táctil como acento. **NO** claymorphism exagerado. Fondo claro por defecto.

- **Acento:** índigo `#4B4EBD` (hover `#3D3FA3`, tint `#EAEAF7`).
- **Neutros cálidos:** canvas `#EFEEEC`, surface `#F8F7F5`, sunken `#E7E6E3`; tinta `#22201E` / `#3C3A37` / `#79766F`.
- **Tipografía:** **Space Grotesk** (títulos) + **Inter** (texto). Solo Google Fonts.
- **Sombras:** suaves y multicapa + brillo superior sutil (nada de sombras duras).
- **Radios** 10–36px · **espaciado** base 4px · **movimiento** 140/240/420ms con `prefers-reduced-motion`.
- **Modo oscuro:** claro es el tema por defecto; oscuro es opt-in (toggle ☀/☾, persistido en `localStorage`). Paleta oscura específica (no inversión): canvas `#191816`, surface `#221F1D`, acento aclarado `#9A9CF2`.

**Todos los tokens viven en `css/tokens.css`** (`:root` y `[data-theme="dark"]`). No hardcodees colores: usa variables.

---

## 🏛️ Arquitectura

```
index.html                 # Landing (scroll único)
proyectos/*.html           # Páginas de detalle (case studies)
css/
  tokens.css               # Variables + modo oscuro  (Settings)
  base.css                 # Reset + tipografía + elementos
  layout.css               # Contenedor, header, footer, grid
  components.css           # Botones, tarjetas, chips, timeline, formularios…
  sections.css             # Estilos por sección (hero, about, skills…)
  case-study.css           # Estilos de las páginas de detalle
js/
  main.js                  # Punto de entrada (type="module")
  modules/theme.js         # Modo claro/oscuro
  modules/nav.js           # Menú móvil + sombra header + scroll-spy
  modules/reveal.js        # Animación de entrada (IntersectionObserver)
  modules/form.js          # Validación + envío del formulario (Formspree AJAX)
  modules/scroll-nav.js    # Salto suave y direccional al pulsar el nav
  modules/scroll-fx.js     # Barra de progreso de lectura + parallax del hero
  modules/pointer.js       # Glow ambiental que sigue al puntero
assets/
  img/logo-ae.svg          # Monograma AE vectorizado (fuente de la marca)
  img/ · favicon/
```

### La marca (monograma AE)
El logotipo es un **único contorno cerrado** (28 vértices, sin huecos): se dibuja
sin levantar el lápiz. El hero aprovecha esa propiedad para trazarlo al cargar.

- El trazado vive en dos sitios que hay que mantener sincronizados:
  `assets/img/logo-ae.svg` (asset suelto) y el token `--logo-ae` de `tokens.css`,
  que lo lleva como **máscara** en data-URI. Se usa máscara y no `<img>` para que
  el color lo ponga el componente y siga al tema (claro/oscuro) sin duplicar archivos.
- Los iconos (`assets/favicon/`) se generan con **escala óptica**: cuanto más
  pequeño se pinta el icono, más grande va la marca dentro de la placa
  (32 px → 400/512 · 180 px → 360/512 · 512 px → 350/512). Si se regeneran a
  ojo con un solo tamaño, a 16 px se empasta.

### Convenciones
- **CSS por capas ITCSS**, enlazadas en paralelo en orden: tokens → base → layout → components → sections (→ case-study).
- **Nomenclatura BEM-lite** (`.card`, `.card__title`, `.card--featured`). Baja especificidad; evita `!important`.
  - ⚠️ Ojo con la cascada: `.btn` define `display`. Para ocultar botones usa selectores de doble clase (p.ej. `.nav .mi-boton`) que ganen a `.btn`.
- **Mobile-first** (media/container queries de menor a mayor). El diseño se piensa desde desktop, pero el CSS crece de móvil hacia arriba.
- **JS modular** (ES Modules), una responsabilidad por módulo; `main.js` orquesta. Mejora progresiva: el sitio funciona sin JS.
- **Anti-FOUC:** un script inline en `<head>` fija el tema antes del primer pintado.
- **Accesibilidad:** HTML semántico, `skip-link`, foco visible, `aria-*`, contraste AA, `prefers-reduced-motion`.

---

## ▶️ Ejecutar en local

Usa **ES Modules** → sírvelo por HTTP (no `file://`):

```bash
python -m http.server 8000   # luego http://localhost:8000
```
O la extensión **Live Server** de VS Code.

## 🚀 Despliegue

GitHub Pages desde la rama `main`, carpeta raíz (el `.nojekyll` ya está incluido). También válido en Netlify/Vercel.

---

## 📌 Estado actual

- ✅ Landing completa (Hero, Sobre mí, Habilidades, Trayectoria, Proyectos, Contacto, Footer).
- ✅ 4 páginas de detalle en `proyectos/`.
- ✅ Modo claro/oscuro, responsive, accesibilidad base, validación de formulario.

## 🔜 Pendiente (contenido real — buscar comentarios `TODO`)

- (Opcional) Foto profesional para el Hero.
- Conectar el formulario de contacto a un servicio (Formspree / Netlify Forms).
