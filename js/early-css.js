(() => {
  const params = new URLSearchParams(location.search);
  const css = params.get("css");
  const link = document.getElementById("active-style");
  const ALLOWED_CSS = {
    battle: "css/battle.css"
    // Add other allowed themes here, for example:
    // dark: "css/dark.css",
    // light: "css/light.css"
  };
  const safeCss = css && Object.prototype.hasOwnProperty.call(ALLOWED_CSS, css)
    ? ALLOWED_CSS[css]
    : "css/battle.css";
  if (link) link.href = safeCss;
})();
