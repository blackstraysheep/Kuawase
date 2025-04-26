window.appConfig = {}; // 設定用のオブジェクト

async function loadConfig() {
    try {
        const response = await fetch('data/config.json'); // JSONを取得
        const config = await response.json(); // JSONをオブジェクトに変換
        window.appConfig = config; // グローバル変数にセット
        console.log("[config.js] 設定をロードしました:", window.appConfig);
    } catch (error) {
        console.error("[config.js] 設定の読み込みに失敗:", error);
    }
}

loadConfig();
