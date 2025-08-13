function changeIframeSrc(src) {
    document.getElementById('slide-frame').src = src;
    if (window.electron) {
        window.electron.changeIframeSrc(src);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    await window.setLanguage(localStorage.getItem("lang") || "en");
    setupEventHandlers();
    function setupEventHandlers() {
    const btn = document.getElementById("stop-bgm-btn");
    if (btn) {
        btn.onclick = function() {
            window.stopBgm && window.stopBgm();
        };
    }
}
});