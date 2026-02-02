window.appConfig = window.appConfig || {};
let lastTitleData = null;

// CSSファイル名を検証して安全なもののみ許可
function sanitizeCssFilename(name) {
    // 許可されたファイル名のみ: 英数字, -, _, .css, 拡張子のみ
    if (typeof name !== "string") return "battle.css";
    const allowed = /^[\w\-]+\.css$/;
    if (allowed.test(name)) return name;
    // 不正な場合はデフォルトへ
    return "battle.css";
}

function renderTitle(data) {
    if (!data) return;
    document.getElementById("Compe-name").textContent = data.compename || "";
    // 言語設定に応じて兼題名に括弧を付与
    let kendai = data.kendaiName || "";
    let lang = (window.getCurrentLang ? window.getCurrentLang() : (localStorage.getItem("lang") || "ja"));
    if (kendai) {
        if (lang === "ja") {
            kendai = `「${kendai}」`;
        } else if (lang === "en") {
            kendai = `\"${kendai}\"`;
        }
    }
    document.getElementById("kendai").textContent = kendai;
    document.getElementById("redTeam").textContent = data.redTeamName || "";
    document.getElementById("whiteTeam").textContent = data.whiteTeamName || "";

    const gameid = document.getElementById("gameid");
    if (gameid && data.matchTitle) safeSetHTML(gameid, data.matchTitle);
}


window.addEventListener("message", (event) => {
    if (!event.data) return;
    const { type, content } = event.data;

    if (type === "config") {
        window.appConfig = content;
        if (lastTitleData) renderTitle(lastTitleData);
    } else if (type === "title") {
        lastTitleData = content;
        renderTitle(content);
    } else if (type === "red") {
        safeSetHTML(document.getElementById("redHaiku"), Object.values(content)[0] || "");
    } else if (type === "white") {
        safeSetHTML(document.getElementById("whiteHaiku"), Object.values(content)[0] || "");
    }
});

if (window.electron) {
    window.electron.receive("update-content", (data) => {
        const { type, content } = data;
        if (type === "config") {
            window.appConfig = content;
            if (lastTitleData) renderTitle(lastTitleData);
        } else if (type === "title") {
            lastTitleData = content;
            renderTitle(content);
        } else if (type === "red") {
            safeSetHTML(document.getElementById("redHaiku"), Object.values(content)[0] || "");
        } else if (type === "white") {
            safeSetHTML(document.getElementById("whiteHaiku"), Object.values(content)[0] || "");
        }
    });
}

safeSetHTML(document.getElementById("gameid"), "Undefined");
window.parent.postMessage({ type: "ready" }, "*");

function sanitizeCssFilename(file) {
    // Accept only known patterns: user:filename or filename.css with strict rules
    if (file.startsWith('user:')) {
        // Allow only safe filenames (letters, digits, underscores, dashes, dot)
        const fname = file.slice(5);
        if (/^[\w\-\.]+\.css$/.test(fname)) {
            return fname;
        }
    } else if (/^[\w\-\.]+\.css$/.test(file)) {
        return file;
    }
    // If invalid, fallback to known safe css
    return 'battle.css';
}

function isDirectCssHref(val) {
    return typeof val === 'string' && (val.startsWith('file://') || val.startsWith('css/'));
}

window.addEventListener("message", (event) => {
    if (event.data?.type === "theme" && window.applyTheme) {
        window.applyTheme(event.data.theme);
    }
    if (event.data?.type === "css-theme") {
        const link = document.getElementById("active-style");
        if (link && event.data.content) {
            const val = event.data.content;
            if (isDirectCssHref(val)) {
                link.setAttribute('href', val);
                return;
            }
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
if (window.electron) {
    window.electron.receive("update-content", (data) => {
        if (data.type === "theme" && window.applyTheme) {
            window.applyTheme(data.content);
        }
        if (data.type === "css-theme") {
            const link = document.getElementById("active-style");
            if (link && data.content) {
                const val = data.content;
                if (isDirectCssHref(val)) {
                    link.setAttribute('href', val);
                    return;
                }
                if (val.startsWith('user:')) {
                    const fname = val.slice(5);
                    window.electron?.invoke('get-user-style-path', fname).then(p => {
                        if (p) link.setAttribute('href', p); else link.setAttribute('href','css/battle.css');
                    }).catch(()=>link.setAttribute('href','css/battle.css'));
                } else {
                    const safeVal = sanitizeCssFilename(val);
                    link.setAttribute("href", `css/${safeVal}`);
                }
            }
        }
    });
}
// 初回ロード時にlocalStorageからテーマ適用
document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme") || "yellow";
    if (window.applyTheme) window.applyTheme(theme);
    (async () => {
        try {
            let cssTheme = localStorage.getItem("battle-css-file") || "battle.css";
            if (window.electron?.invoke) {
                const cfg = await window.electron.invoke("get-config");
                if (cfg?.cssTheme) cssTheme = cfg.cssTheme;
            }
            const link = document.getElementById("active-style");
            if (link) {
                if (cssTheme.startsWith('user:')) {
                    const fname = cssTheme.slice(5);
                    window.electron?.invoke('get-user-style-path', fname).then(p => {
                        if (p) link.setAttribute('href', p); else link.setAttribute('href','css/battle.css');
                    }).catch(()=>link.setAttribute('href','css/battle.css'));
                } else {
                    const safeCssTheme = sanitizeCssFilename(cssTheme);
                    link.setAttribute("href", `css/${safeCssTheme}`);
                }
            }
        } catch {}
    })();
});