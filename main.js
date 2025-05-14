const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

require('@electron/remote/main').initialize();

// ──────────── 自動アップデート設定 ────────────
// ログを electron-log に出力
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// GitHub Releases をフィードに設定
autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'blackstraysheep',
    repo: 'Kuawase',
    private: false
  });

const configPath = path.join(app.getPath('userData'), "config.json");
const musicDir = path.join(app.getPath('userData'), "music");
let adminWindow, projectorWindow, lastKnownData = null;
let splashWindow;

app.whenReady().then(() => {
  splashWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
            },       
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: false,
        resizable: false,
        show: true,
    });
    require('@electron/remote/main').enable(splashWindow.webContents);
    splashWindow.loadFile('splash.html');
    setTimeout(() => {
    // --- 自動アップデートの起動 ---
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', info => {
        log.info('Update available:', info);
        // 必要なら adminWindow.webContents.send('update-available', info);
    });
    autoUpdater.on('update-downloaded', info => {
        log.info('Update downloaded:', info);
        // ダウンロード完了後、自動で再起動する場合:
        // autoUpdater.quitAndInstall();
    });
    autoUpdater.on('error', err => {
        log.error('AutoUpdater error:', err);
    });

  // --- 初期設定ファイルの配置 ---
  (function ensureConfigExists() {
    const defaultConfig = path.join(__dirname, 'data', 'default_config.json');
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.copyFileSync(defaultConfig, configPath);
      log.info('初期設定ファイルをユーザーデータにコピーしました:', configPath);
    }
  })();

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
    
  // --- 管理者ウィンドウ ---
  adminWindow = new BrowserWindow({
    width: 1200, height: 800, title: 'Kuawase',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  adminWindow.loadFile('home.html');
  adminWindow.webContents.once('did-finish-load', () => {
    adminWindow.webContents.send('set-role', 'admin');
  });
  adminWindow.webContents.on('did-finish-load', () => {
    // adminWindowがリロードされたらprojectorWindowもリロード
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.loadFile('top.html');
    }
  });
  adminWindow.webContents.on('before-input-event', (e, input) => {
    if (
      input.type === 'keyDown' &&
      (input.key === 'F5' ||
        (input.key === 'r' && (input.control || input.meta)))
    ) e.preventDefault();
  });

  // --- 投影ウィンドウ ---
  projectorWindow = new BrowserWindow({
    width: 1024, height: 768, title: 'Kuawase',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  projectorWindow.webContents.on('before-input-event', (e, input) => {
    if (
      input.type === 'keyDown' &&
      (input.key === 'F5' ||
        (input.key === 'r' && (input.control || input.meta)))
    ) e.preventDefault();
  });
  projectorWindow.loadFile('top.html');
  projectorWindow.webContents.once('did-finish-load', () => {
    if (lastKnownData) {
      projectorWindow.webContents.send('update-content', lastKnownData);
    }
  });
  projectorWindow.webContents.on('did-finish-load', () => {
    if (lastKnownData) {
      projectorWindow.webContents.send('update-content', lastKnownData);
    }
  });

  // ウィンドウ閉じる連携
  adminWindow.on('closed', () => {
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.close();
    }
  });
  projectorWindow.on('closed', () => {
    if (adminWindow && !adminWindow.isDestroyed()) {
      adminWindow.close();
    }
  });
  if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
    }, 1800);
});

// 全ウィンドウ終了時
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ──────────── IPC ハンドラ ────────────

// (1) 対戦設定の保存（bgm セクションを保持してマージ）
ipcMain.handle("update-config", async (_event, newConfig) => {
    try {
      // 1) 既存ファイルを読み込む
      let existing = {};
      if (fs.existsSync(configPath)) {
        existing = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
      // 2) bgm セクションを保持
      const bgm = existing.bgm || {};
      // 3) 対戦設定だけ上書き
      const merged = { ...existing, ...newConfig, bgm };
      // 4) 書き戻し
      fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), "utf-8");
      console.log("設定を保存しました:", merged);
      return true;
    } catch (error) {
      console.error("設定の保存に失敗:", error);
      return false;
    }
  });
  
// (2) Excel データ取得／保存
ipcMain.handle('get-excel-data', () => {
    try {
      const jsonPath = path.join(app.getPath('userData'), 'excelData.json');
      if (!fs.existsSync(jsonPath)) return {};
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (err) {
      console.error('Excelデータ読み込みエラー:', err);
      return {};
    }
  });

ipcMain.handle('set-excel-file', async (_e, { filePath, numProblems, numTeams }) => {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("ファイルが存在しません:", filePath);
    return false;
  }
  return saveExcelData(filePath, numProblems, numTeams);
});

// (3) プロジェクタ表示切替
ipcMain.handle('change-projector-src', async (_e, src) => {
    if (!projectorWindow) return;
    const full = path.join(__dirname, src);
    const url  = `file://${full.replace(/\\/g, '/')}`;
    await projectorWindow.loadURL(url);
    if (lastKnownData) {
      projectorWindow.webContents.send('update-content', lastKnownData);
    }
    // admin 側にも通知
    adminWindow?.webContents.send('change-iframe-src', src);
  });

// (4) 管理画面 → 投影画面 データ転送
ipcMain.handle('send-data-to-projector', (_e, data) => {
    lastKnownData = data;
    if (projectorWindow) {
      projectorWindow.webContents.send('update-content', data);
    }
  });

// ---(5)音楽ファイル関連 ---
  const SUPPORTED_AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
  ipcMain.handle('list-music-files', async () => {
  try {
      return fs
      .readdirSync(musicDir)
      .filter(f => SUPPORTED_AUDIO_EXTS.includes(path.extname(f).toLowerCase()));
  } catch (e) {
      console.error('音楽ファイル一覧取得エラー:', e);
      return [];
  }
  });
  ipcMain.handle('upload-music-file', async (_e, { name, buffer }) => {
    try {
      fs.mkdirSync(musicDir, { recursive: true });
      fs.writeFileSync(path.join(musicDir, name), Buffer.from(buffer));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  ipcMain.handle('delete-music-file', async (_e, name) => {
    try {
      fs.unlinkSync(path.join(musicDir, name));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  // (6) BGM 設定の取得／保存
  ipcMain.handle('get-bgm-config', async () => {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return cfg.bgm || {};
    } catch { return {}; }
  });
  ipcMain.handle('set-bgm-config', async (_e, bgmConfig) => {
    try {
      let cfg = {};
      if (fs.existsSync(configPath)) {
        cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      cfg.bgm = bgmConfig;
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  // (7) 設定全体の取得（renderer 側で get-config を呼べるように）
  ipcMain.handle('get-config', async () => {
      try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
      return {};
      }
  });
  ipcMain.handle("get-music-file-path", async (_event, filename) => {
      const userDataPath = app.getPath("userData");
      const filePath = path.join(userDataPath, "music", filename);
      return `file://${filePath.replace(/\\/g, "/")}`;
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

ipcMain.handle('reset-data', async () => {
  try {
    // config.jsonを空オブジェクトで上書き
    fs.writeFileSync(configPath, '{}', 'utf-8');
    // excelData.jsonも空オブジェクトで上書き
    const excelPath = path.join(app.getPath('userData'), 'excelData.json');
    fs.writeFileSync(excelPath, '{}', 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

//version取得
ipcMain.handle('get-app-version', () => app.getVersion());