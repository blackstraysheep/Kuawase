document.getElementById("excel-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (file) {
        try {
            const success = await window.electron.invoke("set-excel-file", { filePath: file.path });
            if (success) {
                console.log("Excelファイルを読み込みました！");
                await updateExcelData();
                showToastAndReload("Excelデータを読み込みました！");
            }
        } catch (error) {
            console.error("Excelファイルの読み込みに失敗しました:", error);
            showToastAndReload("Excelデータの読み込みに失敗しました");
        }
    }
});

function changeIframeSrc(src) {
    const iframe = document.getElementById('slide-frame');
    iframe.src = src;
    // projectorWindow の内容も変更
    window.electron.invoke("change-projector-src", src).catch(error => {
        console.error("Failed to change projector src:", error);
    });
    // --- 追加: ファイル切り替え時に空データでリセット ---
    sendContent("red", {});
    sendContent("white", {});
}

function sendContent(type, content) {
    const data = { type, content };
    console.log("[sendContent] Sending data:", data);

    const iframe = document.getElementById("slide-frame"); 

    if (iframe && iframe.contentWindow) {
        if (iframe.contentDocument?.readyState === "complete") {
            // まずconfigを送信
            if (window.appConfig && type !== "config") {
                iframe.contentWindow.postMessage({ type: "config", content: window.appConfig }, "*");
            }
            // その後title/red/whiteなどを送信
            iframe.contentWindow.postMessage(data, "*");
        } else {
            iframe.onload = () => {
                // まずconfigを送信
                if (window.appConfig && type !== "config") {
                    iframe.contentWindow.postMessage({ type: "config", content: window.appConfig }, "*");
                }
                // その後title/red/whiteなどを送信
                iframe.contentWindow.postMessage(data, "*");
            };
        }
    }
    
    // projectorWindow にも送信（config/titleはリトライ付き）
    function sendToProjectorWithRetry(data, retries = 5, delay = 200) {
        let attempt = 0;
        function trySend() {
            window.electron.invoke("send-data-to-projector", data).catch(error => {
                console.error("Failed to send data to projector:", error);
            });
            attempt++;
            if ((data.type === "config" || data.type === "title") && attempt < retries) {
                setTimeout(trySend, delay);
            }
        }
        trySend();
    }
    sendToProjectorWithRetry(data);
}

let excelData = {}; // グローバル変数として定義

// チーム名・兼題名リストを抽出してセレクトボックスに反映
function populateMatchSelectors(excelData) {
    // チーム名: B3, B4, B5, ...
    const teamKeys = Object.keys(excelData).filter(k => /^B\d+$/.test(k) && k !== "B1");
    const teamNames = teamKeys.map(k => ({ key: k, name: excelData[k] })).filter(t => t.name);

    // 兼題名: H1, J1, L1, ...
    const kendaiKeys = Object.keys(excelData).filter(k => /^[A-Z]+1$/.test(k) && k !== "B1" && k !== "D1" && k !== "F1");
    const kendaiNames = kendaiKeys.map(k => ({ key: k, name: excelData[k] })).filter(k => k.name);

    // セレクトボックス取得
    const redTeamSelect = document.getElementById("redTeamSelect");
    const whiteTeamSelect = document.getElementById("whiteTeamSelect");
    const kendaiSelect = document.getElementById("kendaiSelect");

    // セレクトボックス初期化
    if (redTeamSelect && whiteTeamSelect && kendaiSelect) {
        redTeamSelect.innerHTML = "";
        whiteTeamSelect.innerHTML = "";
        kendaiSelect.innerHTML = "";

        teamNames.forEach(t => {
            const opt1 = document.createElement("option");
            opt1.value = t.key;
            opt1.textContent = t.name;
            redTeamSelect.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = t.key;
            opt2.textContent = t.name;
            whiteTeamSelect.appendChild(opt2);
        });

        kendaiNames.forEach(k => {
            const opt = document.createElement("option");
            opt.value = k.key;
            opt.textContent = k.name;
            kendaiSelect.appendChild(opt);
        });
    }
}

// iframeのonloadでデータ送信
function setupIframeSync() {
    const iframe = document.getElementById("slide-frame");
    if (!iframe) return;

    iframe.onload = () => {
        // window.appConfigやexcelDataがまだ未取得の場合は何もしない
        if (!window.appConfig || Object.keys(excelData).length === 0) return;
        // まずconfigを送信
        sendContent("config", window.appConfig);
        // その後titleを送信
        const Compename = excelData["B1"] || "データなし";
        const kendai = excelData[window.appConfig.kendai] || "データなし";
        const redteam = excelData[window.appConfig.redTeam] || "データなし";
        const whiteteam = excelData[window.appConfig.whiteTeam] || "データなし";
        sendContent("title", { 
            B1: Compename, 
            [window.appConfig.kendai]: kendai, 
            [window.appConfig.redTeam]: redteam, 
            [window.appConfig.whiteTeam]: whiteteam 
        });
    };
}

// セレクトボックス・入力欄の初期値をconfig.jsonから復元
async function restoreMatchConfig() {
    try {
        const response = await fetch('data/config.json');
        const config = await response.json();
        document.getElementById("redTeamSelect").value = config.redTeam || "";
        document.getElementById("whiteTeamSelect").value = config.whiteTeam || "";
        document.getElementById("kendaiSelect").value = config.kendai || "";
        // ここを修正
        const input = document.getElementById("matchTitleInput");
        if (input.value !== (config.matchTitle || "")) {
            input.value = config.matchTitle || "";
        }
    } catch (e) {
        // 初回はconfig.jsonにmatchTitleがない場合もある
    }
}

// 保存ボタンのイベント
document.getElementById("saveMatchConfig").addEventListener("click", async () => {
    const redTeamKey = document.getElementById("redTeamSelect").value;
    const whiteTeamKey = document.getElementById("whiteTeamSelect").value;
    const kendaiKey = document.getElementById("kendaiSelect").value;
    const matchTitle = document.getElementById("matchTitleInput").value || "";

    // 俳句セルは既存のロジックで決定
    const redHaiku = window.appConfig.redHaiku;
    const whiteHaiku = window.appConfig.whiteHaiku;

    // 新しい設定
    let newConfig = {
        ...window.appConfig,
        redTeam: redTeamKey,
        whiteTeam: whiteTeamKey,
        kendai: kendaiKey,
        matchTitle: matchTitle,
        redHaiku: redHaiku,
        whiteHaiku: whiteHaiku
    };

    // 設定を保存
    const success = await window.electron.invoke("update-config", newConfig);
    if (success) {
        window.appConfig = newConfig;
        showToastAndReload("設定を保存しました！");
        console.log("設定を保存しました！");
    } else {
        showToastAndReload("設定の保存に失敗しました", true);
        console.log("設定の保存に失敗しました");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("[renderer.js] 読み込まれました");

    try {
        const response = await fetch('data/excelData.json'); // JSONを取得
        excelData = await response.json(); // JSONをオブジェクトに変換

        // チーム・兼題セレクタ初期化
        populateMatchSelectors(excelData);

        // セレクトボックス・入力欄の初期値をconfig.jsonから復元
        await restoreMatchConfig();

        // iframe同期セットアップ
        setupIframeSync();

        // すでにiframeが読み込み済みなら即送信
        const iframe = document.getElementById("slide-frame");
        if (iframe && iframe.contentDocument?.readyState === "complete") {
            iframe.onload(); // 明示的に呼ぶ
        }

    } catch (error) {
        console.error("[renderer.js] Excelデータの取得に失敗:", error);
    }
});

// 対戦種別ごとのセル列マッピング
const SENSHU_CELL_MAP = [
    null, // 0番目は未使用
    { label: "先鋒戦", cell: "C" },
    { label: "次鋒戦", cell: "O" },
    { label: "中堅戦", cell: "AA" },
    { label: "副将戦", cell: "AC" },
    { label: "大将戦", cell: "AE" }
];

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

document.getElementById("showRed").addEventListener("click", async () => {
    console.log("[renderer.js] '紅 表示' ボタンがクリックされました");

    try {
        const data = await window.electron.invoke("get-excel-data");
        const matchIndex = getMatchIndexFromIframe();
        const redTeamKey = window.appConfig.redTeam;
        const kendaiKey = window.appConfig.kendai;
        const haikuCellKey = getHaikuCellKey(redTeamKey, kendaiKey, matchIndex);

        const redHaikuData = data[haikuCellKey] || "データなし";
        console.log("[renderer.js] 送信する紅チームデータ:", redHaikuData, "セル:", haikuCellKey);
        sendContent("red", { [haikuCellKey]: redHaikuData });
    } catch (error) {
        console.error("[renderer.js] Excelデータの取得に失敗:", error);
    }
});

document.getElementById("showWhite").addEventListener("click", async () => {
    console.log("[renderer.js] '白 表示' ボタンがクリックされました");

    try {
        const data = await window.electron.invoke("get-excel-data");
        const matchIndex = getMatchIndexFromIframe();
        const whiteTeamKey = window.appConfig.whiteTeam;
        const kendaiKey = window.appConfig.kendai;
        const haikuCellKey = getHaikuCellKey(whiteTeamKey, kendaiKey, matchIndex);

        const whiteHaikuData = data[haikuCellKey] || "データなし";
        console.log("[renderer.js] 送信する白チームデータ:", whiteHaikuData, "セル:", haikuCellKey);
        sendContent("white", { [haikuCellKey]: whiteHaikuData });
    } catch (error) {
        console.error("[renderer.js] Excelデータの取得に失敗:", error);
    }
});

async function updateExcelData() {
    try {
        const response = await fetch('data/excelData.json'); // JSONを取得
        excelData = await response.json(); // JSONをオブジェクトに変換
        // 大会名を表示
    } catch (error) {
        console.error("[renderer.js] Excelデータの更新に失敗:", error);
    }
}

function showToastAndReload(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = isError ? "#b22" : "#222";
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
        location.reload();
    }, 1500); // 1.5秒後にリロード
}

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = isError ? "#b22" : "#222";
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, 1500); 
}