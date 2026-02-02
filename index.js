window.appConfig = window.appConfig || {};
let lastTitleData = null;

if (window.CommonTheme) {
    window.CommonTheme.setupThemeHandlers();
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

if (window.CommonTheme) {
    window.CommonTheme.initThemeFromStorage({ defaultTheme: "yellow", applyCssFromConfig: true });
}