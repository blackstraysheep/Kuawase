window.appConfig = window.appConfig || {};
let lastTitleData = null;

/**
 * 大会名を描画する
 * @param {{ compename?: string }} data
 */
function renderTitle(data) {
    if (!data) return;
    const el = document.getElementById("Compe-name");
    if (el) {
        el.textContent = data.compename || "";
    }
}

// ────────────────────────────────────
// 1) 管理画面（adminWindow）からの postMessage を受け取って描画
window.addEventListener("message", event => {
    if (!event.data) return;
    const { type, content } = event.data;
    if (type === "title" && content) {
        lastTitleData = content;
        renderTitle(content);
    }
});

// ────────────────────────────────────
// 2) Electron IPC（send-data-to-projector）で飛んでくる update-content イベントにも対応
if (window.electron?.receive) {
    window.electron.receive("update-content", data => {
        const { type, content } = data;
        if (type === "title" && content) {
            lastTitleData = content;
            renderTitle(content);
        }
    });
}

// ────────────────────────────────────
// 3) 初回ロード時に直接 Excel データから大会名を取得して描画
//    これで admin 側からのメッセージがなくても必ず表示されます
document.addEventListener("DOMContentLoaded", async () => {
        let compename = "";
        try {
            if (window.electron?.invoke) {
                const excelData = await window.electron.invoke("get-excel-data");
                compename = excelData["B1"] || "";
            }
        } catch (e) {
            console.error("[top.js] 初回 Excel データ取得エラー:", e);
        }
        // 取得できなかった／空文字ならデフォルトを表示
        if (!compename) compename = "Kuawase";
        renderTitle({ compename });

    // 管理画面起動時に ready を通知
    window.parent.postMessage({ type: "ready" }, "*");
});
