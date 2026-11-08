/**
 * form.js — Formulario de contacto: validación en cliente + envío a Formspree.
 *
 * Envío AJAX (fetch) para no abandonar la página. Mejora progresiva: el <form>
 * tiene `action`/`method` reales, así que sin JS haría un POST normal a Formspree.
 *
 * Modo demo: mientras el `action` conserve el placeholder "TU_FORM_ID", no se
 * envía nada; solo se valida y se confirma. Al pegar tu ID real, se activa el
 * envío automáticamente sin tocar más código.
 */
export function initForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const submitBtn = form.querySelector('[type="submit"]');
  const endpoint = form.getAttribute("action") || "";
  const isConfigured =
    endpoint.startsWith("https://formspree.io/") && !endpoint.includes("TU_FORM_ID");

  const validators = {
    nombre: (v) => (v.trim() ? "" : "Por favor, indica tu nombre."),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Introduce un correo electrónico válido.",
    mensaje: (v) =>
      v.trim().length >= 10 ? "" : "Cuéntame un poco más (mínimo 10 caracteres).",
  };

  const setError = (field, message) => {
    const wrap = field.closest(".field");
    if (!wrap) return;
    wrap.classList.toggle("is-invalid", Boolean(message));
    const errorEl = wrap.querySelector(".field__error");
    if (errorEl) errorEl.textContent = message || "";
  };

  const setStatus = (message, kind = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = kind; // "", "ok", "error" — para estilar si se desea
  };

  const validate = () => {
    let valid = true;
    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      if (!field) return;
      const message = validators[name](field.value);
      setError(field, message);
      if (message) valid = false;
    });
    return valid;
  };

  const sendToFormspree = async () => {
    setStatus("Enviando…");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setStatus("¡Gracias! Tu mensaje se ha enviado correctamente.", "ok");
        form.reset();
      } else {
        const data = await response.json().catch(() => null);
        const detail = data?.errors?.map((e) => e.message).join(" ");
        setStatus(
          detail || "No se pudo enviar el mensaje. Inténtalo de nuevo o escríbeme por correo.",
          "error"
        );
      }
    } catch {
      setStatus(
        "Hubo un problema de conexión. Inténtalo de nuevo o escríbeme por correo.",
        "error"
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      setStatus("");
      return;
    }

    if (isConfigured) {
      sendToFormspree();
    } else {
      // Modo demo: aún no hay ID de Formspree configurado.
      setStatus("¡Gracias! (modo demo: configura Formspree para recibir el mensaje).", "ok");
      form.reset();
    }
  });

  form.querySelectorAll(".field__control").forEach((input) => {
    input.addEventListener("input", () => setError(input, ""));
  });
}
