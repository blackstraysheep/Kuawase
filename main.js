const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");


if (!app.isPackaged) {
    const { updateElectronApp } = require('update-electron-app');
    updateElectronApp();
}

const configPath = path.join(app.getPath('userData'), "config.json");
const musicDir = path.join(app.getPath('userData'), "music");


app.whenReady().then(() => {

    function ensureConfigExists() {
        const userDataPath = app.getPath('userData');
        const userConfigPath = path.join(userDataPath, 'config.json');
        const defaultConfigPath = path.join(__dirname, 'data', 'default_config.json');
    
        if (!fs.existsSync(userConfigPath)) {
            try {
                if (!fs.existsSync(path.dirname(userConfigPath))) {
                    fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
                }
                fs.copyFileSync(defaultConfigPath, userConfigPath);
                console.log('初期設定ファイルを作成しました:', userConfigPath);
            } catch (error) {
                console.error('初期設定ファイルの作成に失敗しました:', error);
            }
        } else {
            console.log('設定ファイルは既に存在しています:', userConfigPath);
        }
    }

    ensureConfigExists();
    
    // 管理者ウィンドウを先に表示
    adminWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,  // ← 追加！
            enableRemoteModule: false,
            nodeIntegration: false,  // ← 重要！ 
            sandbox: false
        }
    });
    adminWindow.loadFile("home.html");
    adminWindow.webContents.once("did-finish-load", () => {
        adminWindow.webContents.send("set-role", "admin");
    });

    // --- 追加: adminWindowでリロード禁止 ---
    adminWindow.webContents.on("before-input-event", (event, input) => {
        if (
            (input.type === "keyDown" && input.key === "F5") ||
            (input.type === "keyDown" && input.key === "r" && (input.control || input.meta))
        ) {
            event.preventDefault();
        }
    });

    // 投影ウィンドウ（全画面ではなく通常表示）
    projectorWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        contextIsolation: true, 
        enableRemoteModule: false,
        nodeIntegration: false, 
        sandbox: false
        }
    });
    projectorWindow.loadFile("top.html");
    let lastKnownData = null;
    projectorWindow.webContents.once("did-finish-load", () => {
        if (lastKnownData) {
            projectorWindow.webContents.send("update-content", lastKnownData);
        }
    });

    // --- 追加: projectorWindowでリロード禁止 ---
    projectorWindow.webContents.on("before-input-event", (event, input) => {
        // F5, Ctrl+R, Cmd+R でのリロードを禁止
        if (
            (input.type === "keyDown" && input.key === "F5") ||
            (input.type === "keyDown" && input.key === "r" && (input.control || input.meta))
        ) {
            event.preventDefault();
        }
    });

    // --- 追加: projectorWindowが再読み込みされたときにもデータ再送 ---
    projectorWindow.webContents.on("did-finish-load", () => {
        if (lastKnownData) {
            projectorWindow.webContents.send("update-content", lastKnownData);
        }
    });

    adminWindow.on('closed', () => {
        if (projectorWindow && !projectorWindow.isDestroyed()) {
          projectorWindow.close();
        }
      });
    
      // サブウィンドウが閉じたらメインウィンドウも閉じる
      projectorWindow.on('closed', () => {
        if (adminWindow && !adminWindow.isDestroyed()) {
          adminWindow.close();
        }
      });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

ipcMain.handle("update-config", async (_event, newConfig) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");
        console.log("設定を保存しました:", newConfig);
        return true;
    } catch (error) {
        console.error("設定の保存に失敗:", error);
        return false;
    }
});

ipcMain.handle("get-excel-data", () => {
    try {
        const userDataPath = app.getPath('userData');
        const jsonPath = path.join(userDataPath, 'excelData.json'); // ← userData側
        if (!fs.existsSync(jsonPath)) {
            console.error("保存されたExcelデータが見つかりません:", jsonPath);
            return {};
        }
        const fileContent = fs.readFileSync(jsonPath, "utf8");
        const data = JSON.parse(fileContent);
        console.log("取得したデータ:", data);
        return data;
    } catch (error) {
        console.error("Excelデータの読み込みエラー:", error);
        return {};
    }
});
ipcMain.handle("set-excel-file", async (_, { filePath, numProblems, numTeams }) => {
    if (!filePath || !fs.existsSync(filePath)) {
        console.error("ファイルが存在しません:", filePath);
        return false;
    }
    console.log("Excelファイル読み込み:", filePath);
    return saveExcelData(filePath, numProblems, numTeams);
});

ipcMain.handle("change-projector-src", async (_, src) => {
    if (projectorWindow) {
        const fullPath = path.join(__dirname, src);

        // 正しくファイルパスを組み立ててfile://で開く
        const fileUrl = `file://${fullPath.replace(/\\/g, '/')}`;

        console.log("[main.js] projectorWindow switching to:", fileUrl);

        await projectorWindow.loadURL(fileUrl); // ← loadURLを使う！！！

        console.log("[main.js] projectorWindow loaded:", fileUrl);

        if (lastKnownData) {
            projectorWindow.webContents.send("update-content", lastKnownData);
        }
    }
});


ipcMain.handle("send-data-to-projector", (_, data) => {
    lastKnownData = data;
    console.log("[main.js] Received data via IPC:", data);
    if (projectorWindow) {
        console.log("[main.js] Sending data to projectorWindow:", data);
        projectorWindow.webContents.send("update-content", data);
    } else {
        console.warn("[main.js] projectorWindow is not available!");
    }
});

//Excelデータ関連
function getColumnLetter(colIndex) {
    let letter = '';
    while (colIndex > 0) {
        let mod = (colIndex - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        colIndex = Math.floor((colIndex - mod) / 26);
    }
    return letter;
}

function saveExcelData(filePath, numProblems = 0, numTeams = 0) {
    if (!filePath || !fs.existsSync(filePath)) {
        return false;
    }

    console.log("Excelデータ保存:", filePath);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const excelData = {};
    const cellB1 = "B1"; //大会名取得
    excelData[cellB1] = sheet[cellB1] ? sheet[cellB1].v : "";
    const cellD1 = "D1"; //チーム数取得
    numTeams = sheet[cellD1] ? sheet[cellD1].v : numTeams;
    const cellF1 = "F1"; //兼題数取得
    numProblems = sheet[cellF1] ? sheet[cellF1].v : numProblems;
    for (let k = 8; k <= numProblems*2 + 6; k = k + 2) {
        const cell = getColumnLetter(k) + "1"; //兼題名取得
        excelData[cell] = sheet[cell] ? sheet[cell].v : "";
    }
    for (let i = 3; i <= numTeams + 2; i++) {
        const cell = "B" + i; //チーム名取得
        excelData[cell] = sheet[cell] ? sheet[cell].v : "";
        for (let j = 3; j <= numProblems*10 + 2; j = j + 2) {
            const cell = getColumnLetter(j) + i; // A1, B1, C1, etc.
            excelData[cell] = sheet[cell] ? sheet[cell].v : "";
        }
    }

    const jsonPath = path.join(app.getPath('userData'), "excelData.json");
    const jsonContent = JSON.stringify(excelData, null, 4);

    if (!fs.existsSync(path.dirname(jsonPath))) {
        fs.mkdirSync(path.dirname(jsonPath));
    }

    fs.writeFileSync(jsonPath, jsonContent, "utf8");
    console.log("Excelデータ保存完了:", jsonPath);
    return true;
}

// --- 追加: 音楽ファイル関連 ---
ipcMain.handle("list-music-files", async () => {
    try {
        const files = fs.readdirSync(musicDir)
            .filter(f => f.endsWith(".mp3"));
        return files;
    } catch (e) {
        return [];
    }
});

ipcMain.handle("upload-music-file", async (_event, { name, buffer }) => {
    try {
        const userDataPath = app.getPath('userData');
        const musicDir = path.join(userDataPath, 'music');

        if (!fs.existsSync(musicDir)) {
            fs.mkdirSync(musicDir, { recursive: true });
        }

        const filePath = path.join(musicDir, name);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return { success: true };
    } catch (e) {
        console.error('音楽ファイルのアップロード失敗:', e);
        return { success: false, error: e.message };
    }
});

ipcMain.handle("delete-music-file", async (_event, name) => {
    try {
        const filePath = path.join(musicDir, name);
        fs.unlinkSync(filePath);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle("get-bgm-config", async () => {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        return config.bgm || {};
    } catch {
        return {};
    }
});

ipcMain.handle("set-bgm-config", async (_event, bgmConfig) => {
    try {
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        }
        config.bgm = bgmConfig;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle("get-config", async () => {
    try {
        const userDataPath = app.getPath('userData');
        const userConfigPath = path.join(userDataPath, 'config.json');
        const config = JSON.parse(fs.readFileSync(userConfigPath, "utf-8"));
        return config;
    } catch (error) {
        console.error("設定ファイルの読み込みエラー:", error);
        return {}; // エラー時は空オブジェクト返す
    }
});

ipcMain.handle("get-music-file-path", async (_event, filename) => {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'music', filename);
    return filePath;
});