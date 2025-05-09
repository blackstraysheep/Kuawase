function changeIframeSrc(src) {
    document.getElementById('slide-frame').src = src;
    if (window.electron) {
        window.electron.changeIframeSrc(src);
    }
}
// ▼BGM停止ボタン初期化
document.addEventListener("DOMContentLoaded", function() {
    const btn = document.getElementById("stop-bgm-btn");
    if (btn) {
        btn.onclick = function() {
            window.stopBgm && window.stopBgm();
        };
    }
    const resetBtn = document.getElementById("reset-data-btn");
    if (resetBtn) {
        resetBtn.onclick = async function() {
            if (!confirm("読み込みデータを初期化しますか？")) return;
            const res = await window.electron.invoke("reset-data");
            if (res.success) {
                // テーマカラーリセット
                localStorage.removeItem("theme");
                if (window.applyTheme) window.applyTheme("Gray");
                showToastAndReload("初期化しました");
                location.reload();
            } else {
                showToastAndReload("初期化に失敗");
            }
        };
    }
});