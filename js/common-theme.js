(() => {
  const DEFAULT_CSS = "css/battle.css";

  function isDirectCssHref(val) {
    // Only allow css/ paths with a safe filename; never allow arbitrary file:// URLs
    if (typeof val !== "string") return false;
    if (!val.startsWith("css/")) return false;
    const name = val.slice(4);
    return /^[\w.-]+\.css$/.test(name);
  }

  function sanitizeCssThemeValue(val) {
    if (typeof val !== "string") return null;
    // Direct hrefs must be css/ + safe filename
    if (isDirectCssHref(val)) return { type: "direct", href: val };
    if (val.startsWith("user:")) {
      const name = val.slice(5);
      if (/^[\w.-]+\.css$/.test(name)) return { type: "user", name };
      return null;
    }
    if (/^[\w.-]+\.css$/.test(val)) return { type: "builtin", name: val };
    return null;
  }

  async function resolveCssHref(val) {
    const parsed = sanitizeCssThemeValue(val);
    if (!parsed) return DEFAULT_CSS;
    if (parsed.type === "direct") return parsed.href;
    if (parsed.type === "builtin") return `css/${parsed.name}`;
    if (parsed.type === "user") {
      try {
        if (window.electron?.invoke) {
          const p = await window.electron.invoke("get-user-style-path", parsed.name);
          if (p) return p;
        }
      } catch {}
      return DEFAULT_CSS;
    }
    return DEFAULT_CSS;
  }

  async function applyCssTheme(val) {
    const link = document.getElementById("active-style");
    if (!link) return;
    const href = await resolveCssHref(val);
    link.setAttribute("href", href || DEFAULT_CSS);
  }

  function applyTheme(val) {
    if (window.applyTheme && val) window.applyTheme(val);
  }

  function setupThemeHandlers() {
    window.addEventListener("message", (event) => {
      if (event.data?.type === "theme") applyTheme(event.data.theme);
      if (event.data?.type === "css-theme") applyCssTheme(event.data.content);
    });
    if (window.electron?.receive) {
      window.electron.receive("update-content", (data) => {
        if (data?.type === "theme") applyTheme(data.content);
        if (data?.type === "css-theme") applyCssTheme(data.content);
      });
    }
  }

  async function initThemeFromStorage(options = {}) {
    const { defaultTheme = "yellow", applyCssFromConfig = true } = options;
    const theme = localStorage.getItem("theme") || defaultTheme;
    applyTheme(theme);
    if (!applyCssFromConfig) return;
    let cssTheme = localStorage.getItem("battle-css-file") || "battle.css";
    try {
      if (window.electron?.invoke) {
        const cfg = await window.electron.invoke("get-config");
        if (cfg?.cssTheme) cssTheme = cfg.cssTheme;
      }
    } catch {}
    await applyCssTheme(cssTheme);
  }

  window.CommonTheme = {
    setupThemeHandlers,
    initThemeFromStorage,
    applyCssTheme,
    applyTheme
  };
})();
