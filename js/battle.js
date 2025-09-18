window.appConfig = window.appConfig || {};
let lastTitleData = null;

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
        const el = document.getElementById("redHaiku");
        if (el) {
            el.classList.remove("fade-in");
            void el.offsetWidth;
            el.classList.add("fade-in");
        }
        safeSetHTML(document.getElementById("redHaiku"), Object.values(content)[0] || "");
        queueHaikuRelayout();
    } else if (type === "white") {
        const er = document.getElementById("whiteHaiku");
        if (er) {
            er.classList.remove("fade-in");
            void er.offsetWidth;
            er.classList.add("fade-in");
        }
        safeSetHTML(document.getElementById("whiteHaiku"), Object.values(content)[0] || "");
        queueHaikuRelayout();
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
            const el = document.getElementById("redHaiku");
            if (el) {
            el.classList.remove("fade-in");
            void el.offsetWidth;
            el.classList.add("fade-in");
        }
            safeSetHTML(document.getElementById("redHaiku"), Object.values(content)[0] || "");
            queueHaikuRelayout();
        } else if (type === "white") {
            const er = document.getElementById("whiteHaiku");
            if (er) {
            er.classList.remove("fade-in");
            void er.offsetWidth;
            er.classList.add("fade-in");
        }
            safeSetHTML(document.getElementById("whiteHaiku"), Object.values(content)[0] || "");
            queueHaikuRelayout();
        }
    });
}

safeSetHTML(document.getElementById("gameid"), "Undefined");
window.parent.postMessage({ type: "ready" }, "*");

window.addEventListener("message", (event) => {
    if (event.data?.type === "theme" && window.applyTheme) {
        window.applyTheme(event.data.theme);
    }
});
if (window.electron) {
    window.electron.receive("update-content", (data) => {
        if (data.type === "theme" && window.applyTheme) {
            window.applyTheme(data.content);
        }
    });
}
// 初回ロード時にlocalStorageからテーマ適用
document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme") || "gray";
    if (window.applyTheme) window.applyTheme(theme);
    // 初回にレイアウト調整
    setTimeout(applyHaikuLayout, 150);
});

// --- Vertical auto layout (confirm 相当) ---
function applyVerticalLayout(elementId, containerHeight) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.classList.add('auto-vertical');

    const availableHeight = containerHeight || getAvailableHeight(element);

    const text = element.textContent.replace(/\r?\n/g, '').trim();

    element.style.letterSpacing = '0px';
    element.style.transform = 'none';

    const charCount = Array.from(text).length;

    const naturalHeight = element.getBoundingClientRect().height;

    if (naturalHeight > availableHeight + 0.5) {
        const scale = availableHeight / naturalHeight;
        element.style.transform = `scaleY(${scale})`;
    } else {
        if (charCount > 1) {
            const gaps = charCount - 1;
            let spacing = (availableHeight - naturalHeight) / gaps;
            element.style.letterSpacing = `${spacing}px`;
            const adjustedHeight = element.getBoundingClientRect().height;
            if (Math.abs(adjustedHeight - availableHeight) > 0.5 && adjustedHeight > 0) {
                const adjust = availableHeight / adjustedHeight;
                spacing = spacing * adjust;
                element.style.letterSpacing = `${spacing}px`;
            }
        }
    }
}

function getAvailableHeight(element) {
    // red/white の俳句はそれぞれ #left2 .left / #right2 .ku に入っている
    const parent = element.closest('#left2, #right2');
    if (parent) {
        const parentHeight = parent.clientHeight;
        const h3 = parent.querySelector('h3');
        const h3Height = h3 ? h3.offsetHeight : 0;
        // battle.css では header 高さは wrapper の計算に含まれているので余白分だけ控えめに
        return parentHeight - h3Height - 40; // マージン分
    }
    return 200;
}

function applyHaikuLayout() {
    const ids = ['redHaiku', 'whiteHaiku'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.textContent.trim()) {
            const available = getAvailableHeight(el);
            applyVerticalLayout(id, available);
        }
    });
}

let relayoutTimer = null;
function queueHaikuRelayout() {
    if (relayoutTimer) {
        clearTimeout(relayoutTimer);
    }
    relayoutTimer = setTimeout(() => {
        applyHaikuLayout();
        relayoutTimer = null;
    }, 80);
}

// リサイズでも再調整
window.addEventListener('resize', () => queueHaikuRelayout());