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
    const resetBtn = document.getElementById("reset-data-btn");
    if (resetBtn) {
        resetBtn.onclick = async function() {
            if (!confirm(t("reset-confirm"))) return;
            const res = await window.electron.invoke("reset-data");
            if (res.success) {
                localStorage.removeItem("theme");
                if (window.applyTheme) window.applyTheme("Gray");
                showToastAndReload(t("save-success"));
                location.reload();
            } else {
                showToastAndReload(t("save-fail"));
            }
        };
    }
}
});