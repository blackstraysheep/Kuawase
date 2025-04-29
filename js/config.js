window.appConfig = {}; // 設定用のオブジェクト

async function loadConfig() {
    try {
        const config = await window.electron.invoke('get-config'); // IPC経由で取得
        window.appConfig = config; // グローバル変数にセット
        console.log("[config.js] 設定をロードしました:", window.appConfig);
        window.electron.send('send-data-to-projector', window.appConfig);
    } catch (error) {
        console.error("[config.js] 設定の読み込みに失敗:", error);
    }
}

loadConfig();
