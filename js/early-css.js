(() => {
  const params = new URLSearchParams(location.search);
  const css = params.get("css");
  const link = document.getElementById("active-style");
  if (link) link.href = css || "css/battle.css";
})();
