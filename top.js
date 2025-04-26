// グローバル変数としてappConfigを保持
window.appConfig = window.appConfig || {};
let lastTitleData = null; // 直近のtitleデータを保持

function renderTitle(data) {
    if (!window.appConfig || !data) return;
    document.getElementById("Compe-name").textContent = data.B1 || "";
    // 対戦名（matchTitle）があればgameidに反映
}

window.addEventListener("message", (event) => {
    console.log("[index.js] message received", event.data);
    if (!event.data) return;
    const data = event.data;
    // config情報が含まれていたらセット
    if (data.type === "config" && data.content) {
        window.appConfig = data.content;
        // config受信後にtitleデータがあれば再描画
        if (lastTitleData) renderTitle(lastTitleData);
        return;
    }
    if (data.type === "title" && data.content) { 
        lastTitleData = data.content;
        if (window.appConfig && Object.keys(window.appConfig).length > 0) {
            renderTitle(data.content);
        }
    }   
});

// window.electron が存在する場合のみ処理を実行
if (window.electron) {
    console.log("[index.js] window.electron is available, setting up IPC listener.");

    window.electron.receive("update-content", (data) => {
        console.log("[index.js] Received data via IPC:", data);

        // config情報が含まれていたらセット
        if (data.type === "config" && data.content) {
            window.appConfig = data.content;
            if (lastTitleData) renderTitle(lastTitleData);
            return;
        }

        if (data.type === "title" && data.content) { 
            lastTitleData = data.content;
            if (window.appConfig && Object.keys(window.appConfig).length > 0) {
                renderTitle(data.content);
            }
        } 
    });
} else {
    console.warn("[index.js] window.electron is undefined. Skipping IPC listener setup.");
}

// 準備完了を親ウィンドウに通知
window.parent.postMessage({ type: "ready" }, "*");
