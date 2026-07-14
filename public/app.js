(() => {
  const STORAGE_KEY = "user-service:lastCreatedId";

  /** Keep in sync with CreateUserDto / ParseUUIDPipe on the API. */
  const RULES = {
    username: {
      min: 3,
      max: 32,
      pattern: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      max: 254,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      min: 8,
      max: 128,
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}]).+$/,
    },
    userId: {
      pattern:
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    },
  };

  const createForm = document.getElementById("create-form");
  const lookupForm = document.getElementById("lookup-form");
  const createResult = document.getElementById("create-result");
  const lookupResult = document.getElementById("lookup-result");
  const listResult = document.getElementById("list-result");
  const createSubmit = document.getElementById("create-submit");
  const lookupSubmit = document.getElementById("lookup-submit");
  const listAllButton = document.getElementById("list-all");
  const userIdInput = document.getElementById("user-id");
  const useLastId = document.getElementById("use-last-id");

  const createFields = {
    username: document.getElementById("username"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
  };

  function getLastCreatedId() {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  function setLastCreatedId(id) {
    sessionStorage.setItem(STORAGE_KEY, id);
    refreshUseLastId();
  }

  function refreshUseLastId() {
    const id = getLastCreatedId();
    if (id) {
      useLastId.hidden = false;
      useLastId.dataset.id = id;
    } else {
      useLastId.hidden = true;
      delete useLastId.dataset.id;
    }
  }

  function formatPayload(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function setFieldError(name, message) {
    const field = document.querySelector(`[data-field="${name}"]`);
    const input =
      name === "userId" ? userIdInput : createFields[name];
    const errorEl = document.getElementById(`${name}-error`);
    if (!field || !errorEl) return;

    if (message) {
      field.classList.add("is-invalid");
      errorEl.hidden = false;
      errorEl.textContent = message;
      if (input) input.setAttribute("aria-invalid", "true");
    } else {
      field.classList.remove("is-invalid");
      errorEl.hidden = true;
      errorEl.textContent = "";
      if (input) input.removeAttribute("aria-invalid");
    }
  }

  function clearFieldErrors(names) {
    for (const name of names) setFieldError(name, null);
  }

  function validateUsername(value) {
    const username = value.trim();
    if (!username) return "El usuario es obligatorio.";
    if (username.length < RULES.username.min) {
      return `El usuario debe tener al menos ${RULES.username.min} caracteres.`;
    }
    if (username.length > RULES.username.max) {
      return `El usuario debe tener como máximo ${RULES.username.max} caracteres.`;
    }
    if (!RULES.username.pattern.test(username)) {
      return "El usuario solo puede contener letras, números y guion bajo.";
    }
    return null;
  }

  function validateEmail(value) {
    const email = value.trim();
    if (!email) return "El correo es obligatorio.";
    if (email.length > RULES.email.max) {
      return `El correo debe tener como máximo ${RULES.email.max} caracteres.`;
    }
    if (!RULES.email.pattern.test(email)) {
      return "Ingresa un correo válido.";
    }
    return null;
  }

  function validatePassword(value) {
    if (!value) return null;
    if (value.length < RULES.password.min) {
      return `La contraseña debe tener al menos ${RULES.password.min} caracteres.`;
    }
    if (value.length > RULES.password.max) {
      return `La contraseña debe tener como máximo ${RULES.password.max} caracteres.`;
    }
    if (!RULES.password.pattern.test(value)) {
      return "La contraseña necesita mayúscula, minúscula, un dígito y un símbolo (!@#$%^&*()_+-=[]{}).";
    }
    return null;
  }

  function validateUserId(value) {
    const id = value.trim();
    if (!id) return "El id de usuario es obligatorio.";
    if (!RULES.userId.pattern.test(id)) {
      return "El id debe ser un UUID v4 (el de crear).";
    }
    return null;
  }

  function validateCreateForm({ showAll = false } = {}) {
    const values = {
      username: createFields.username.value,
      email: createFields.email.value,
      password: createFields.password.value,
    };
    const errors = {
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };

    if (showAll) {
      for (const [name, message] of Object.entries(errors)) {
        setFieldError(name, message);
      }
    }

    return {
      values: {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      errors,
      valid: !errors.username && !errors.email && !errors.password,
    };
  }

  function validateLookupForm({ show = true } = {}) {
    const value = userIdInput.value;
    const error = validateUserId(value);
    if (show) setFieldError("userId", error);
    return {
      id: value.trim(),
      error,
      valid: !error,
    };
  }

  function summarizeCreate(data) {
    if (data.passwordGenerated) {
      return `Añadido ${data.username}. La prensa generó una contraseña segura y guardó solo su hash.`;
    }
    return `Añadido ${data.username} con la contraseña que definiste. Guardada como hash.`;
  }

  function summarizeLookup(data) {
    const passwordNote = data.hasPassword
      ? "Contraseña en el registro."
      : "Aún sin contraseña en el registro.";
    return `${data.username} · ${data.email}. ${passwordNote}`;
  }

  function summarizeList(data) {
    const count = Array.isArray(data) ? data.length : 0;
    if (count === 0) return "La prensa está vacía - aún no hay registros.";
    if (count === 1) return "Un registro en la tirada.";
    return `${count} registros en la tirada.`;
  }

  function listCountMeta(data, status) {
    const count = Array.isArray(data) ? data.length : 0;
    return `HTTP ${status} · GET /users · ${count} ${count === 1 ? "registro" : "registros"}`;
  }

  function setBusy(button, busyText) {
    const label = button.querySelector(".btn-label");
    button.disabled = true;
    button.classList.add("is-busy");
    if (label) {
      button.dataset.idle = label.textContent;
      label.textContent = busyText;
    }
  }

  function clearBusy(button) {
    const label = button.querySelector(".btn-label");
    button.disabled = false;
    button.classList.remove("is-busy");
    if (label && button.dataset.idle) {
      label.textContent = button.dataset.idle;
    }
  }

  function renderResult(el, { ok, title, meta, body }) {
    el.hidden = false;
    el.classList.toggle("is-ok", ok);
    el.classList.toggle("is-error", !ok);
    el.innerHTML = `
      <p class="result-status">${escapeHtml(title)}</p>
      ${meta ? `<p class="result-meta">${escapeHtml(meta)}</p>` : ""}
      <pre>${escapeHtml(formatPayload(body))}</pre>
    `;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }

  async function parseBody(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  function validationMessages(payload) {
    if (!payload || typeof payload !== "object") {
      return ["La solicitud falló."];
    }
    if (Array.isArray(payload.message)) {
      return payload.message.map(String);
    }
    if (typeof payload.message === "string") {
      return [payload.message];
    }
    return ["La solicitud falló."];
  }

  function applyApiFieldErrors(messages, fieldNames) {
    const lower = messages.map((m) => m.toLowerCase());
    let mapped = false;
    for (const name of fieldNames) {
      const hit = messages.find((m) => m.toLowerCase().includes(name.toLowerCase()));
      if (hit) {
        setFieldError(name === "id" ? "userId" : name, hit);
        mapped = true;
      }
    }
    if (fieldNames.includes("userId")) {
      const uuidHit = lower.find(
        (m) => m.includes("uuid") || m.includes("validation failed"),
      );
      if (uuidHit) {
        const original = messages[lower.indexOf(uuidHit)];
        setFieldError("userId", original);
        mapped = true;
      }
    }
    return mapped;
  }

  async function request(path, options) {
    const response = await fetch(path, {
      headers: {
        Accept: "application/json",
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
      ...options,
    });
    const body = await parseBody(response);
    return { response, body };
  }

  for (const [name, input] of Object.entries(createFields)) {
    input.addEventListener("blur", () => {
      const value = input.value;
      let error = null;
      if (name === "username") error = validateUsername(value);
      if (name === "email") error = validateEmail(value);
      if (name === "password") error = validatePassword(value);
      setFieldError(name, error);
    });

    input.addEventListener("input", () => {
      if (document.querySelector(`[data-field="${name}"]`)?.classList.contains("is-invalid")) {
        let error = null;
        if (name === "username") error = validateUsername(input.value);
        if (name === "email") error = validateEmail(input.value);
        if (name === "password") error = validatePassword(input.value);
        setFieldError(name, error);
      }
    });
  }

  userIdInput.addEventListener("blur", () => {
    setFieldError("userId", validateUserId(userIdInput.value));
  });

  userIdInput.addEventListener("input", () => {
    if (
      document
        .querySelector('[data-field="userId"]')
        ?.classList.contains("is-invalid")
    ) {
      setFieldError("userId", validateUserId(userIdInput.value));
    }
  });

  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { values, errors, valid } = validateCreateForm({ showAll: true });
    if (!valid) {
      const first = ["username", "email", "password"].find((n) => errors[n]);
      if (first) createFields[first].focus();
      renderResult(createResult, {
        ok: false,
        title: "Corrige los campos marcados antes de añadir.",
        meta: "Validación en cliente · mismas reglas que la API",
        body: {
          statusCode: 400,
          message: Object.values(errors).filter(Boolean),
        },
      });
      return;
    }

    const payload = {
      username: values.username,
      email: values.email,
    };
    if (values.password.length > 0) {
      payload.password = values.password;
    }

    setBusy(createSubmit, "Añadiendo…");

    try {
      const { response, body } = await request("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const messages = validationMessages(body);
        applyApiFieldErrors(messages, ["username", "email", "password"]);
        renderResult(createResult, {
          ok: false,
          title: messages.join(" "),
          meta: `HTTP ${response.status}`,
          body,
        });
        return;
      }

      clearFieldErrors(["username", "email", "password"]);
      createForm.reset();

      if (body?.id) {
        setLastCreatedId(body.id);
        userIdInput.value = body.id;
        setFieldError("userId", null);
      }

      renderResult(createResult, {
        ok: true,
        title: summarizeCreate(body),
        meta: `HTTP ${response.status} · id listo para consultar`,
        body,
      });
    } catch {
      renderResult(createResult, {
        ok: false,
        title: "No se pudo contactar la API.",
        meta: "Confirma que el servidor Nest está en marcha e inténtalo de nuevo.",
        body: { error: "NetworkError" },
      });
    } finally {
      clearBusy(createSubmit);
    }
  });

  lookupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { id, valid } = validateLookupForm({ show: true });
    if (!valid) {
      userIdInput.focus();
      renderResult(lookupResult, {
        ok: false,
        title: "Ingresa un serial UUID v4 válido antes de consultar.",
        meta: "Validación en cliente · igual que ParseUUIDPipe",
        body: { statusCode: 400, message: "user id must be a UUID v4" },
      });
      return;
    }

    setBusy(lookupSubmit, "Consultando…");

    try {
      const { response, body } = await request(`/users/${encodeURIComponent(id)}`);

      if (!response.ok) {
        const messages = validationMessages(body);
        applyApiFieldErrors(messages, ["userId", "id"]);
        renderResult(lookupResult, {
          ok: false,
          title: messages.join(" "),
          meta: `HTTP ${response.status}`,
          body,
        });
        return;
      }

      setFieldError("userId", null);
      renderResult(lookupResult, {
        ok: true,
        title: summarizeLookup(body),
        meta: `HTTP ${response.status}`,
        body,
      });
    } catch {
      renderResult(lookupResult, {
        ok: false,
        title: "No se pudo contactar la API.",
        meta: "Confirma que el servidor Nest está en marcha e inténtalo de nuevo.",
        body: { error: "NetworkError" },
      });
    } finally {
      clearBusy(lookupSubmit);
    }
  });

  useLastId.addEventListener("click", () => {
    const id = useLastId.dataset.id || getLastCreatedId();
    if (!id) return;
    userIdInput.value = id;
    setFieldError("userId", validateUserId(id));
    userIdInput.focus();
  });

  listAllButton.addEventListener("click", async () => {
    setBusy(listAllButton, "Listando…");

    try {
      const { response, body } = await request("/users");

      if (!response.ok) {
        const messages = validationMessages(body);
        renderResult(listResult, {
          ok: false,
          title: messages.join(" "),
          meta: `HTTP ${response.status}`,
          body,
        });
        return;
      }

      const users = Array.isArray(body) ? body : [];
      renderResult(listResult, {
        ok: true,
        title: summarizeList(users),
        meta: listCountMeta(users, response.status),
        body: users,
      });
    } catch {
      renderResult(listResult, {
        ok: false,
        title: "No se pudo contactar la API.",
        meta: "Confirma que el servidor Nest está en marcha e inténtalo de nuevo.",
        body: { error: "NetworkError" },
      });
    } finally {
      clearBusy(listAllButton);
    }
  });

  refreshUseLastId();

  const copyConfigBtn = document.getElementById("copy-config-commands");
  const configCommands = document.getElementById("config-commands");

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  if (copyConfigBtn && configCommands) {
    let copyResetTimer = 0;
    copyConfigBtn.addEventListener("click", async () => {
      const text = configCommands.textContent.replace(/\n$/, "");
      try {
        await copyText(text);
        copyConfigBtn.textContent = "Copiado";
        copyConfigBtn.classList.add("is-copied");
        window.clearTimeout(copyResetTimer);
        copyResetTimer = window.setTimeout(() => {
          copyConfigBtn.textContent = "Copiar";
          copyConfigBtn.classList.remove("is-copied");
        }, 1600);
      } catch {
        copyConfigBtn.textContent = "Error";
        window.clearTimeout(copyResetTimer);
        copyResetTimer = window.setTimeout(() => {
          copyConfigBtn.textContent = "Copiar";
        }, 1600);
      }
    });
  }
})();
