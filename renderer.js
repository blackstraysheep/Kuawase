// 1) 披講パネルの表示/非表示を切り替える関数
function updateHikouPanelVisibility(src) {
      const panel = document.getElementById("hikou-panel");
      if (!panel) return;
      // src が "1.html" ～ "5.html" なら表示、それ以外は非表示
      // iframe.src がフルURLの場合も考慮してファイル名だけ抽出
      const filename = src.split("/").pop().split("\\").pop();
      const isMatchPage = /^[1-5]\.html$/.test(filename);
      panel.style.display = isMatchPage ? "" : "none";
    }

document.getElementById("excel-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const success = await window.electron.invoke("set-excel-file", { filePath: file.path });
            if (success) {
                await updateExcelData();
                showToastAndReload("Excelデータを読み込みました！");
            }
        } catch (error) {
            console.error("Excelファイルの読み込みに失敗しました:", error);
            showToastAndReload("Excelデータの読み込みに失敗しました", true);
        }
    }
});

function sendContent(type, content) {
    const data = { type, content };
    const iframe = document.getElementById("slide-frame");

    if (iframe && iframe.contentWindow && iframe.contentDocument?.readyState === "complete") {
        iframe.contentWindow.postMessage({ type: "config", content: window.appConfig }, "*");
        iframe.contentWindow.postMessage(data, "*");
    }

    window.electron.invoke("send-data-to-projector", data).catch(console.error);
}

function changeIframeSrc(src) {
       // 2) iframe切り替え前に披講パネルの表示/非表示を更新
   updateHikouPanelVisibility(src);

   const iframe = document.getElementById('slide-frame');
   iframe.onload = () => {
       console.log("[changeIframeSrc] iframeが読み込まれたのでデータを送信します");
       sendInitialData();
   };
   iframe.src = src;

   window.electron.invoke("change-projector-src", src)
       .then(() => {
           console.log("[renderer.js] projectorWindowの切り替えを指示しました:", src);
       })
       .catch((error) => {
           console.error("[renderer.js] projectorWindow切り替えエラー:", error);
       });
 }

async function restoreMatchConfig() {
    try {
        const config = await window.electron.invoke("get-config");
        document.getElementById("redTeamSelect").value = config.redTeam || "";
        document.getElementById("whiteTeamSelect").value = config.whiteTeam || "";
        document.getElementById("kendaiSelect").value = config.kendai || "";
        document.getElementById("matchTitleInput").value = config.matchTitle || "";
    } catch {}
}

document.getElementById("saveMatchConfig").addEventListener("click", async () => {
    const newConfig = {
        ...window.appConfig,
        redTeam: document.getElementById("redTeamSelect").value,
        whiteTeam: document.getElementById("whiteTeamSelect").value,
        kendai: document.getElementById("kendaiSelect").value,
        matchTitle: document.getElementById("matchTitleInput").value
    };
    const success = await window.electron.invoke("update-config", newConfig);
    if (success) {
        window.appConfig = newConfig;
        showToastAndReload("設定を保存しました！");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        window.excelData = await window.electron.invoke("get-excel-data");
        populateMatchSelectors(window.excelData);
        await restoreMatchConfig();
        setupIframeSync();

                const iframe = document.getElementById("slide-frame");
        if (iframe) {
            // 初回ロード時にも披講パネルを隠す／出す
            const filename = iframe.src.split("/").pop().split("\\").pop();
            updateHikouPanelVisibility(filename);
            if (iframe.contentDocument?.readyState === "complete") {
                sendInitialData();
            }
        }
     } catch (error) {
         console.error("初期データの読み込みに失敗:", error);
     }
 });

function setupIframeSync() {
    const iframe = document.getElementById("slide-frame");
    if (iframe) {
        iframe.onload = sendInitialData;
    }
}

function sendInitialData() {
    if (!window.appConfig || !window.excelData) return;
    sendContent("config", window.appConfig);
    sendContent("title", {
        compename: window.excelData["B1"] || "データなし",
        kendaiName: window.excelData[window.appConfig.kendai] || "データなし",
        redTeamName: window.excelData[window.appConfig.redTeam] || "データなし",
        whiteTeamName: window.excelData[window.appConfig.whiteTeam] || "データなし",
        matchTitle: window.appConfig.matchTitle || "試合未設定"
    });
}

function populateMatchSelectors(excelData) {
    const teams = Object.entries(excelData).filter(([k]) => /^B\d+$/.test(k) && k !== "B1");
    const kendais = Object.entries(excelData)
       .filter(([k]) => /^[A-Z]+1$/.test(k))
       .filter(([k]) => k !== "B1" && k !== "D1" && k !== "F1");

    const redSel = document.getElementById("redTeamSelect");
    const whiteSel = document.getElementById("whiteTeamSelect");
    const kendaiSel = document.getElementById("kendaiSelect");

    teams.forEach(([key, name]) => {
        redSel.innerHTML += `<option value='${key}'>${name}</option>`;
        whiteSel.innerHTML += `<option value='${key}'>${name}</option>`;
    });

    kendais.forEach(([key, name]) => {
        kendaiSel.innerHTML += `<option value='${key}'>${name}</option>`;
    });
}

function showToastAndReload(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#b22" : "#222";
    toast.style.display = "block";
    setTimeout(() => location.reload(), 1500);
}

async function updateExcelData() {
    window.excelData = await window.electron.invoke("get-excel-data");
}

function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#b22" : "#222";
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, 1500);
}

document.getElementById("showRed").addEventListener("click", async () => {
    console.log("[renderer.js] '紅 表示' ボタンがクリックされました");
    try {
        await audio_hikou();
        await showRedHaiku(); 
    } catch (e) {
        console.error("[renderer.js] 紅の処理に失敗:", e);
    }
});

document.getElementById("showWhite").addEventListener("click", async () => {
    console.log("[renderer.js] '白 表示' ボタンがクリックされました");
    try {
        await audio_hikou(); 
        await showWhiteHaiku(); 
    } catch (e) {
        console.error("[renderer.js] 白の処理に失敗:", e);
    }
});

async function showRedHaiku() {
    const data = await window.electron.invoke("get-excel-data");
    const matchIndex = getMatchIndexFromIframe();
    const redTeamKey = window.appConfig.redTeam;
    const kendaiKey = window.appConfig.kendai;
    const haikuCellKey = getHaikuCellKey(redTeamKey, kendaiKey, matchIndex);

    const redHaikuData = data[haikuCellKey] || "データなし";
    console.log("[renderer.js] 送信する紅チームデータ:", redHaikuData, "セル:", haikuCellKey);
    sendContent("red", { [haikuCellKey]: redHaikuData });
}

async function showWhiteHaiku() {
    const data = await window.electron.invoke("get-excel-data");
    const matchIndex = getMatchIndexFromIframe();
    const whiteTeamKey = window.appConfig.whiteTeam;
    const kendaiKey = window.appConfig.kendai;
    const haikuCellKey = getHaikuCellKey(whiteTeamKey, kendaiKey, matchIndex);

    const whiteHaikuData = data[haikuCellKey] || "データなし";
    console.log("[renderer.js] 送信する白チームデータ:", whiteHaikuData, "セル:", haikuCellKey);
    sendContent("white", { [haikuCellKey]: whiteHaikuData });
}

function getMatchIndexFromIframe() {
    const iframe = document.getElementById("slide-frame");
    if (!iframe || !iframe.src) return null;
    const match = iframe.src.match(/(\d+)\.html$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// 兼題名から兼題番号を取得（例: H1→1, J1→2, L1→3, ...）
// H=8, J=10, L=12, N=14, P=16, ... 2ずつ増加
function getKendaiNumber(kendaiKey) {
    const m = kendaiKey.match(/^([A-Z]+)1$/);
    if (!m) return 1;
    let col = m[1];
    // 列名を番号に変換（A=1, B=2, ..., Z=26, AA=27, ...）
    let colNum = 0;
    for (let i = 0; i < col.length; i++) {
        colNum = colNum * 26 + (col.charCodeAt(i) - 65 + 1);
    }
    // H列が1番目、以降2列ごとに兼題番号が増える
    return Math.floor((colNum - 8) / 2) + 1;
}

// チーム名から行番号を取得（例: B3→3, B4→4, ...）
function getTeamRow(teamKey) {
    const m = teamKey.match(/^B(\d+)$/);
    return m ? m[1] : null;
}

// 対戦種別番号をiframeのsrcから取得（例: 1.html→1, 2.html→2, ...）
function getMatchIndexFromIframe() {
    const iframe = document.getElementById("slide-frame");
    if (!iframe || !iframe.src) return null;
    const match = iframe.src.match(/(\d+)\.html$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// 兼題番号から開始列名を計算（1兼題あたり10列消費、兼題1はC列から）
function getKendaiStartCol(kendaiNum) {
    // C列は3番目（A=1, B=2, C=3）
    const startColIndex = 3 + (kendaiNum - 1) * 10;
    // 列番号からアルファベット列名へ変換
    let col = "";
    let n = startColIndex;
    while (n > 0) {
        let rem = (n - 1) % 26;
        col = String.fromCharCode(65 + rem) + col;
        n = Math.floor((n - 1) / 26);
    }
    return col;
}

function getHaikuCellKey(teamKey, kendaiKey, matchIndex) {
    const teamRow = getTeamRow(teamKey);
    const kendaiNum = getKendaiNumber(kendaiKey);
    if (!teamRow || !kendaiNum || !matchIndex) return null;

    // 1兼題あたり10列消費、2列ごとに進む（先鋒:0, 次鋒:2, ...）
    const offset = (matchIndex - 1) * 2;
    const col = getKendaiStartCol(kendaiNum);
    if (!col) return null;

    // 列名をアルファベットで進める
    function nextCol(col, offset) {
        let code = 0;
        for (let i = 0; i < col.length; i++) {
            code = code * 26 + (col.charCodeAt(i) - 65 + 1);
        }
        code += offset;
        let res = "";
        while (code > 0) {
            let rem = (code - 1) % 26;
            res = String.fromCharCode(65 + rem) + res;
            code = Math.floor((code - 1) / 26);
        }
        return res;
    }

    const cellCol = nextCol(col, offset);
    return cellCol + teamRow;
}