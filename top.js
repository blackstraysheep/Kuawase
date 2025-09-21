window.appConfig = window.appConfig || {};
let lastTitleData = null;


/**
 * CSSファイル名を安全に検証・サニタイズする
 * @param {string} name
 * @returns {string} サニタイズ後ファイル名 or "battle.css" fallback
 */
function sanitizeCssFileName(name) {
    if (!name) return "battle.css";
    // Only allow built-in themes: alphanumerics, -, _, ending with .css
    if (/^[\w\-]+\.css$/.test(name)) return name;
    // fallback
    return "battle.css";
}
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
    if (!compename) compename = "Kuawase";
    renderTitle({ compename });
    window.parent.postMessage({ type: "ready" }, "*");
    // cssTheme 初期適用は main.js からの初回 'update-content' (css-theme) 送信に一本化
});

window.addEventListener("message", (event) => {
    if (event.data?.type === "theme" && window.applyTheme) {
        window.applyTheme(event.data.theme);
    }
    if (event.data?.type === "css-theme") {
        const link = document.getElementById("active-style");
        if (link && event.data.content) {
            const val = event.data.content;
            if (val.startsWith('user:')) {
                const fname = val.slice(5);
                window.electron?.invoke('get-user-style-path', fname).then(p => {
                    if (p) link.setAttribute('href', p); else link.setAttribute('href','css/battle.css');
                }).catch(()=>link.setAttribute('href','css/battle.css'));
            } else {
                // Sanitize val before using
                const safeTheme = sanitizeCssFileName(val);
                link.setAttribute("href", `css/${safeTheme}`);
            }
        }
    }
});
if (window.electron) {
    window.electron.receive("update-content", (data) => {
        if (data.type === "theme" && window.applyTheme) {
            window.applyTheme(data.content);
        }
        if (data.type === "css-theme") {
            const link = document.getElementById("active-style");
            if (link && data.content) {
                const val = data.content;
                if (val.startsWith('user:')) {
                    const fname = val.slice(5);
                    window.electron?.invoke('get-user-style-path', fname).then(p => {
                        if (p) link.setAttribute('href', p); else link.setAttribute('href','css/battle.css');
                    }).catch(()=>link.setAttribute('href','css/battle.css'));
                } else {
                    link.setAttribute("href", `css/${val}`);
                }
            }
        }
    });
}
// 初回ロード時にlocalStorageからテーマ適用
document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme") || "yellow";
    if (window.applyTheme) window.applyTheme(theme);
});