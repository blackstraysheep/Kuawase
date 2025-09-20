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
            const result = await window.electron.invoke("set-excel-file", { filePath: file.path });
            if (result.success) {
                const config = await window.electron.invoke("get-config");
                config.lastExcelFile = file.name;
                await window.electron.invoke("update-config", config);

                const lastExcelFileSpan = document.getElementById("last-excel-file");
                lastExcelFileSpan.textContent = config.lastExcelFile;
                lastExcelFileSpan.removeAttribute("data-lang"); // 翻訳されないように属性を削除

                await updateExcelData();
                showToastAndReload(t("excel-success"));
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Excelファイルの読み込みに失敗しました:", error);
            showToastAndReload(t("excel-fail") + `\n${error.message}`, true);
        }
    }
});

document.getElementById("reset-data-btn").addEventListener("click", async () => {
    const ok = await showConfirm("reset-confirm");
    if (!ok) { showToast(t("reset-cancel"), true); return; }
    // 句データ・対戦設定・テーマカラー・BGM設定・BGMファイル一括削除
    const result = await window.electron.invoke("reset-data");
    let allSuccess = result.success;
    // テーマカラー初期化
    try { localStorage.removeItem("theme"); if (window.applyTheme) window.applyTheme("Gray"); } catch {}
    // BGM設定・BGMファイル一括削除
    try { if (window.electron) { await window.electron.invoke("reset-bgm-settings"); await window.electron.invoke("delete-all-bgm-files"); } } catch {}
    // 対戦設定・UIリセット
    try {
        const config = await window.electron.invoke("get-config");
        config.lastExcelFile = "";
        await window.electron.invoke("update-config", config);
        const lastExcelFileSpan = document.getElementById("last-excel-file");
        lastExcelFileSpan.setAttribute("data-lang", "not-selected");
        setLanguage(localStorage.getItem("lang") || "ja");
        await updateExcelData();
    } catch {}
    if (allSuccess) { showToastAndReload(t("reset-success")); } else { showToast(t("reset-fail"), true); }
});

document.getElementById("load-gs-btn").addEventListener("click", async () => {
    const urlInput = document.getElementById("gs-url-input");
    const url = urlInput.value;
    if (!url || !url.startsWith("https://docs.google.com/spreadsheets/")) {
        showToast(t("gs-invalid-url"), true);
        return;
    }

    try {
        const result = await window.electron.invoke("load-from-google-sheet", url);
        if (result.success) {
            const config = await window.electron.invoke("get-config");
            config.lastExcelFile = url; // ファイル名ではなくURLを保存
            await window.electron.invoke("update-config", config);
            
            const lastExcelFileSpan = document.getElementById("last-excel-file");
            lastExcelFileSpan.textContent = url;
            lastExcelFileSpan.removeAttribute("data-lang"); // 翻訳されないように属性を削除

            await updateExcelData();
            gsModal.style.display = "none"; // 成功したらモーダルを閉じる
            urlInput.value = ""; // 入力欄をクリア
            showToastAndReload(t("gs-success"));
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Google Sheetの読み込みに失敗しました:", error);
        showToast(t("gs-fail") + `\n${error.message}`, true);
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
        showToastAndReload(t("save-success"));
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        window.excelData = await window.electron.invoke("get-excel-data");
        populateMatchSelectors(window.excelData);
        await restoreMatchConfig();
        setupIframeSync();

        // lastExcelFileの表示
        const config = await window.electron.invoke("get-config");
        const lastExcelFileSpan = document.getElementById("last-excel-file");
        if (config && config.lastExcelFile) {
            lastExcelFileSpan.textContent = config.lastExcelFile;
            lastExcelFileSpan.removeAttribute("data-lang"); // 翻訳されないように属性を削除
        } else {
            lastExcelFileSpan.setAttribute("data-lang", "not-selected");
        }

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
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect && window.THEMES) {
        themeSelect.innerHTML = "";
        Object.keys(window.THEMES).forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            themeSelect.appendChild(opt);
        });
        // 保存済みテーマを適用
        const savedTheme = localStorage.getItem("theme") || "Gray";
        themeSelect.value = savedTheme;
        window.applyTheme(savedTheme);

        // 変更時
        themeSelect.onchange = () => {
            const theme = themeSelect.value;
            window.applyTheme(theme);
            // iframeにも伝える
            const iframe = document.getElementById("slide-frame");
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: "theme", theme }, "*");
            }
            // projectorWindowにも伝える
            if (window.electron) {
                window.electron.invoke("send-data-to-projector", { type: "theme", content: theme });
            }
        };
    }
    // CSS テーマ切替 UI 初期化
    const cssSelect = document.getElementById("css-select");
    if (cssSelect) {
        const userListEl = document.getElementById('user-css-file-list');
        async function refreshUserCssList() {
            if (!userListEl) return;
            userListEl.innerHTML = '';
            let files = [];
            try { files = await window.electron.invoke('list-user-styles'); } catch {}
            // セレクトの user: を一旦全部削除して再生成
            Array.from(cssSelect.querySelectorAll('option')).forEach(o => { if (o.value.startsWith('user:')) o.remove(); });
            files.forEach(f => {
                if (!cssSelect.querySelector(`option[value="user:${f}"]`)) {
                    const o = document.createElement('option');
                    o.value = `user:${f}`;
                    o.textContent = f;
                    cssSelect.appendChild(o);
                }
                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                nameSpan.className = 'user-css-file-name';
                nameSpan.textContent = f;
                const delBtn = document.createElement('button');
                delBtn.textContent = t ? t('bgm-delete') : 'Delete';
                delBtn.className = 'delete-user-css-btn';
                delBtn.onclick = async () => {
                    const ok = await showConfirm('confirm-delete-css', { name: f });
                    if (!ok) return;
                    const res = await window.electron.invoke('delete-user-style', f);
                    if (res?.success) {
                        if (cssSelect.value === `user:${f}`) {
                            cssSelect.value = 'battle.css';
                            applyCssToIframe('battle.css');
                            try { const cfg = await window.electron.invoke('get-config'); cfg.cssTheme = 'battle.css'; await window.electron.invoke('update-config', cfg); } catch {}
                            window.electron?.invoke('send-data-to-projector', { type: 'css-theme', content: 'battle.css' });
                        }
                        refreshUserCssList();
                        showToast(t('user-css-delete-success'));
                    } else {
                        showToast(t('user-css-delete-fail'), true);
                    }
                };
                li.appendChild(nameSpan);
                li.appendChild(delBtn);
                userListEl.appendChild(li);
            });
        }
        window.refreshUserCssList = refreshUserCssList;
        // ユーザーCSS一覧を取得して既存選択肢の後に追加
        await refreshUserCssList();
        // config から読み込み（なければ localStorage fallback）
        try {
            const cfg = await window.electron.invoke("get-config");
            const savedCss = (cfg && cfg.cssTheme) || localStorage.getItem("battle-css-file") || "battle.css";
            cssSelect.value = savedCss;
            applyCssToIframe(savedCss);
            // projector にも初期送信
            window.electron?.invoke("send-data-to-projector", { type: "css-theme", content: savedCss });
        } catch { /* ignore */ }
        cssSelect.addEventListener("change", async () => {
            const file = cssSelect.value;
            localStorage.setItem("battle-css-file", file); // 一応残す（後方互換）
            applyCssToIframe(file);
            // config 保存
            try {
                const cfg = await window.electron.invoke("get-config");
                cfg.cssTheme = file;
                await window.electron.invoke("update-config", cfg);
            } catch (e) { console.warn("cssTheme 保存失敗", e); }
            // projector 同期
            window.electron?.invoke("send-data-to-projector", { type: "css-theme", content: file });
        });
        // アップロードボタン処理
        const addBtn = document.getElementById('add-custom-css-btn');
        const fileInput = document.getElementById('custom-css-input');
        if (addBtn && fileInput) {
            addBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async () => {
                if (!fileInput.files || !fileInput.files[0]) return;
                const file = fileInput.files[0];
                try {
                    const text = await file.text();
                    const saveRes = await window.electron.invoke('save-user-style', { name: file.name, content: text });
                    if (saveRes?.success) {
                        const fname = saveRes.file;
                        // まだ無ければ option を追加
                        if (!cssSelect.querySelector(`option[value="user:${fname}"]`)) {
                            const o = document.createElement('option');
                            o.value = `user:${fname}`;
                            o.textContent = fname;
                            cssSelect.appendChild(o);
                        }
                        cssSelect.value = `user:${fname}`;
                        applyCssToIframe(`user:${fname}`);
                        // config 更新
                        try {
                            const cfg = await window.electron.invoke('get-config');
                            cfg.cssTheme = `user:${fname}`;
                            await window.electron.invoke('update-config', cfg);
                        } catch {}
                        window.electron?.invoke('send-data-to-projector', { type: 'css-theme', content: `user:${fname}` });
                        refreshUserCssList();
                    }
                } catch (e) {
                    console.error('カスタムCSS保存失敗', e);
                } finally {
                    fileInput.value = '';
                }
            });
        }
    }
 });

function applyCssToIframe(file) {
    const iframe = document.getElementById("slide-frame");
    if (!iframe) return;
    const swap = () => {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;
            const link = doc.getElementById("active-style") || doc.querySelector('link[rel="stylesheet"]');
            const setHref = (href) => {
                if (link) {
                    link.href = href;
                } else {
                    const l = doc.createElement('link');
                    l.rel = 'stylesheet'; l.id = 'active-style'; l.href = href; doc.head.appendChild(l);
                }
            };
            if (file.startsWith('user:')) {
                const fname = file.slice(5);
                window.electron.invoke('get-user-style-path', fname).then(p => {
                    if (p) setHref(p); else setHref('css/battle.css');
                }).catch(() => setHref('css/battle.css'));
            } else {
                setHref(`css/${file}`);
            }
        } catch (e) { console.error("CSS切替失敗", e); }
    };
    if (iframe.contentDocument?.readyState === "complete") {
        swap();
    } else {
        iframe.addEventListener("load", swap, { once: true });
    }
}

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
        const redOption = document.createElement("option");
        redOption.value = key;
        redOption.textContent = name;
        redSel.appendChild(redOption);

        const whiteOption = document.createElement("option");
        whiteOption.value = key;
        whiteOption.textContent = name;
        whiteSel.appendChild(whiteOption);
    });

    kendais.forEach(([key, name]) => {
        const kendaiOption = document.createElement("option");
        kendaiOption.value = key;
        kendaiOption.textContent = name;
        kendaiSel.appendChild(kendaiOption);
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

window.addEventListener("message", (event) => {
    if (event.data?.type === "theme" && window.applyTheme) {
        window.applyTheme(event.data.theme);
    }
});

// --- スプレッドシート関連 ---
const gsModal = document.getElementById("gs-modal");
const openGsModalBtn = document.getElementById("open-gs-modal-btn");
const closeBtn = document.querySelector(".modal .close-btn");

openGsModalBtn.onclick = () => {
    gsModal.style.display = "block";
};
closeBtn.onclick = () => {
    gsModal.style.display = "none";
};
window.onclick = (event) => {
    if (event.target == gsModal) {
        gsModal.style.display = "none";
    }
};

document.getElementById("load-gs-btn").addEventListener("click", async () => {
    const urlInput = document.getElementById("gs-url-input");
    const url = urlInput.value;
    if (!url || !url.startsWith("https://docs.google.com/spreadsheets/")) {
        showToast(t("gs-invalid-url"), true);
        return;
    }

    try {
        const result = await window.electron.invoke("load-from-google-sheet", url);
        if (result.success) {
            const config = await window.electron.invoke("get-config");
            config.lastExcelFile = url; // ファイル名ではなくURLを保存
            await window.electron.invoke("update-config", config);
            document.getElementById("last-excel-file").textContent = url;
            await updateExcelData();
            gsModal.style.display = "none"; // 成功したらモーダルを閉じる
            urlInput.value = ""; // 入力欄をクリア
            showToastAndReload(t("gs-success"));
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Google Sheetの読み込みに失敗しました:", error);
        showToast(t("gs-fail") + `\n${error.message}`, true);
    }
});

// Documented change: add excel-only reset logic
const excelOnlyBtn = document.getElementById("reset-excel-only-btn");
if (excelOnlyBtn) {
  excelOnlyBtn.addEventListener("click", async () => {
    const ok = await showConfirm("excel-only-reset-confirm");
    if (!ok) { showToast(t("excel-only-reset-cancel"), true); return; }
    try {
      const reset = await window.electron.invoke("reset-data");
      if (!reset.success) throw new Error(reset.error || "reset-data failed");
      let cfg = await window.electron.invoke("get-config");
      const bgm = cfg.bgm || {};
      cfg = { bgm };
      await window.electron.invoke("update-config", cfg);
      const lastExcelFileSpan = document.getElementById("last-excel-file");
      if (lastExcelFileSpan) lastExcelFileSpan.setAttribute("data-lang", "not-selected");
      setLanguage(localStorage.getItem("lang") || "ja");
      await updateExcelData();
      showToastAndReload(t("excel-only-reset-success"));
    } catch (e) {
      console.error("Excel-only reset failed", e);
      showToast(t("excel-only-reset-fail"), true);
    }
  });
}

// --- 汎用確認モーダル ---
function showConfirm(messageKey, paramsOrRaw) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        const content = modal.querySelector('.confirm-modal-content');
        const msgEl = document.getElementById('confirm-modal-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        let text = '';
        if (typeof paramsOrRaw === 'string') {
            text = paramsOrRaw; // 旧 rawTextOverride 互換
        } else if (messageKey) {
            try { text = t(messageKey); } catch { text = messageKey; }
        }
        if (paramsOrRaw && typeof paramsOrRaw === 'object' && !Array.isArray(paramsOrRaw)) {
            for (const [k, v] of Object.entries(paramsOrRaw)) {
                text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
            }
        }
        if (!text) text = '';
        msgEl.textContent = text;
        modal.style.display = 'block';
        function cleanup(result){
            okBtn.onclick = null; cancelBtn.onclick = null; modal.onclick = null; document.onkeydown = null;
            modal.style.display = 'none';
            resolve(result);
        }
        okBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
        modal.onclick = (e) => { if (!content.contains(e.target)) cleanup(false); };
        document.onkeydown = (e) => { if (e.key === 'Escape') cleanup(false); };
    });
}
window.showConfirm = showConfirm;