// ===== 1. モジュール・定数宣言 =====
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require("fs");
const path = require("path");
let adminFirstLoadDone = false; // 管理画面初回ロード判定
const XLSX = require("xlsx");
const axios = require('axios');
// --- Window creators ---
/**
 * 管理画面ウィンドウを生成し、基本イベントを設定する。
 * - 既定ズームを適用（`ADMIN_BASE_ZOOM`）
 * - F5/Ctrl+R/Cmd+R を無効化
 * - 管理画面がリロードされた際に投影画面を再読込
 */
function createAdminWindow() {
  adminWindow = new BrowserWindow({
    icon: path.join(__dirname, 'img', 'icon.ico'),
    width: 1200, height: 800, title: 'Kuawase',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // ここで既定ズームを適用（後から変更しない単純な管理画面）
      zoomFactor: ADMIN_BASE_ZOOM
    }
  });
  adminWindow.loadFile('home.html');
  adminWindow.webContents.once('did-finish-load', () => {
    adminWindow.webContents.send('set-role', 'admin');
  });
  adminWindow.webContents.on('did-finish-load', () => {
    // 初回 (アプリ起動直後) は projector の二重ロードを避ける
    if (!adminFirstLoadDone) { adminFirstLoadDone = true; return; }
    // 2回目以降：管理画面がリロードされたら projector も再読込
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
}

/**
 * 投影画面ウィンドウを生成し、基本イベントを設定する。
 * - 既定ズームを適用（`PROJECTOR_BASE_ZOOM`）
 * - F5/Ctrl+R/Cmd+R を無効化
 * - `top.html` を読み込み、描画完了時に `lastKnownData` を送信
 */
function createProjectorWindow() {
  projectorWindow = new BrowserWindow({
    icon: path.join(__dirname, 'img', 'icon.ico'),
    width: 1024, height: 768, title: 'Kuawase',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // 動的スケール計算前のベース倍率
      zoomFactor: PROJECTOR_BASE_ZOOM
    }
  });
  // 自動拡縮用: サイズに応じてズームを更新
  function adjustProjectorZoom() {
    if (!projectorWindow || projectorWindow.isDestroyed()) return;
    const [w, h] = projectorWindow.getContentSize();
    // 安全のため0除算回避
    const scaleW = w / PROJECTOR_BASE_WIDTH;
    const scaleH = h / PROJECTOR_BASE_HEIGHT;
    let factor = Math.min(scaleW, scaleH);
    if (!isFinite(factor) || factor <= 0) factor = 1; // fallback
    // 過剰な極端値を制限（任意調整: 0.3〜4）
    factor = Math.max(0.3, Math.min(4, factor));
    projectorWindow.webContents.setZoomFactor(factor);
  }

  // リサイズ/最大化/復元/フルスクリーン切替時に再計算
  projectorWindow.on('resize', adjustProjectorZoom);
  projectorWindow.on('maximize', adjustProjectorZoom);
  projectorWindow.on('unmaximize', adjustProjectorZoom);
  projectorWindow.on('enter-full-screen', adjustProjectorZoom);
  projectorWindow.on('leave-full-screen', adjustProjectorZoom);
  // キーボードリロード抑制（F5, Ctrl+R, Cmd+R）
  projectorWindow.webContents.on('before-input-event', (e, input) => {
    if (
      input.type === 'keyDown' &&
      (input.key === 'F5' ||
        (input.key === 'r' && (input.control || input.meta)))
    ) e.preventDefault();
  });
  // 投影画面HTMLロード
  projectorWindow.loadFile('top.html');
  // 初回描画完了時にデータ送信
  projectorWindow.webContents.once('did-finish-load', () => {
    adjustProjectorZoom();
    // すべてのロード完了毎にテーマ & 直近データを送信
    try {
      let themeToSend = 'battle.css';
      if (fs.existsSync(configPath)) {
        try {
          const initCfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (initCfg && typeof initCfg.cssTheme === 'string' && initCfg.cssTheme.trim()) {
            themeToSend = initCfg.cssTheme.trim();
          }
        } catch { /* ignore parse */ }
      }
      projectorWindow.webContents.send('update-content', { type: 'css-theme', content: themeToSend });
    } catch {}
    if (lastKnownData) projectorWindow.webContents.send('update-content', lastKnownData);
  });
  // リロード時にもデータ送信
  projectorWindow.webContents.on('did-finish-load', () => {
    adjustProjectorZoom();
    // リロード時もCSS設定を送信
    try {
      let themeToSend = 'battle.css';
      if (fs.existsSync(configPath)) {
        try {
          const initCfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (initCfg && typeof initCfg.cssTheme === 'string' && initCfg.cssTheme.trim()) {
            themeToSend = initCfg.cssTheme.trim();
          }
        } catch { /* ignore parse */ }
      }
      projectorWindow.webContents.send('update-content', { type: 'css-theme', content: themeToSend });
    } catch {}
    if (lastKnownData) {
      projectorWindow.webContents.send('update-content', lastKnownData);
    }
  });
}

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

/**
 * 自動アップデーターのイベントハンドラを登録する。
 * - 利用可能通知 / ダウンロード完了 / エラー をログ出力
 */
function setupAutoUpdaterHandlers() {
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
}

const configPath = path.join(app.getPath('userData'), "config.json");
const musicDir = path.join(app.getPath('userData'), "music");
const userStylesDir = path.join(app.getPath('userData'), 'userStyles');
let adminWindow, projectorWindow, lastKnownData = null;
// ウィンドウ種別ごとの既定ズーム
const ADMIN_BASE_ZOOM = 1;
const PROJECTOR_BASE_ZOOM = 1;
// Projector 自動拡縮の基準解像度（設計想定サイズ）
const PROJECTOR_BASE_WIDTH = 1024;
const PROJECTOR_BASE_HEIGHT = 768;
let splashWindow;

/**
 * 設定ファイル（`config.json`）の存在を確認し、無ければデフォルトから作成する。
 * - ユーザーデータ配下に `config.json` が無い場合、`data/default_config.json` をコピー
 * - 進捗・エラーは `electron-log` に記録
 */
function ensureConfigExists() {
  const userDataPath = app.getPath('userData');
  const userConfigPath = path.join(userDataPath, 'config.json');
  const defaultConfigPath = path.join(__dirname, 'data', 'default_config.json');
  try {
    if (!fs.existsSync(userConfigPath)) {
      if (!fs.existsSync(path.dirname(userConfigPath))) {
        fs.mkdirSync(path.dirname(userConfigPath), { recursive: true });
      }
      fs.copyFileSync(defaultConfigPath, userConfigPath);
      log.info('初期設定ファイルを作成しました:', userConfigPath);
    } else {
      log.info('設定ファイルは既に存在しています:', userConfigPath);
    }
  } catch (error) {
    log.error('初期設定ファイルの作成に失敗しました:', error);
  }
}

// アプリ準備完了後の初期化（スプラッシュ表示 → 自動更新 → 設定初期化 → 画面生成）
app.whenReady().then(() => {
  splashWindow = new BrowserWindow({
        icon: path.join(__dirname, 'img', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
            },       
        width: 800,
        height: 600,
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
  setupAutoUpdaterHandlers();
  autoUpdater.checkForUpdatesAndNotify();

  // --- 初期設定ファイルの配置 ---
  ensureConfigExists();
    
  // --- 管理・投影ウィンドウ ---
  createAdminWindow();
  createProjectorWindow();

  // （createProjectorWindow内で生成・初期化済み）

  // ウィンドウ連携: どちらかが閉じたらもう一方も閉じる
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
    }, 6000);
});

// 全ウィンドウ終了時
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ===== 4. IPCハンドラ群 =====

// (1) 対戦設定の保存（bgm セクションを保持してマージ）
/**
 * IPC: update-config
 * 設定ファイルを更新して保存します。
 * @param {_event} _event - IPCイベント（未使用）
 * @param {object} newConfig - 保存する設定オブジェクト
 * @returns {Promise<object>} 保存後の設定オブジェクト
 */
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
/**
 * IPC: get-excel-data
 * 直近に読み込まれたExcelのJSONデータを返します。
 * @returns {object|null} Excel由来のデータ（未読ならnull）
 */
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

/**
 * IPC: set-excel-file
 * 指定されたExcelファイルを読み込み、問題数・チーム数を反映したJSONを保持します。
 * @param {_e} _e - IPCイベント（未使用）
 * @param {{filePath:string, numProblems:number, numTeams:number}} payload - 読み込み条件
 * @returns {Promise<object>} 解析後のJSONデータ
 */
ipcMain.handle('set-excel-file', async (_e, { filePath, numProblems, numTeams }) => {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("ファイルが存在しません:", filePath);
    return { success: false, error: "ファイルが存在しません" };
  }
  const ok = saveExcelData(filePath, numProblems, numTeams);
  if (ok) {
    return { success: true };
  } else {
    return { success: false, error: "Excelデータ保存に失敗しました" };
  }
});

// (3) プロジェクタ表示切替
/**
 * IPC: change-projector-src
 * 投影ウィンドウに表示するHTMLを切り替えます。
 * @param {_e} _e - IPCイベント（未使用）
 * @param {string} src - 例: 'top.html', '1.html' など
 * @returns {Promise<void>} なし
 */
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
/**
 * IPC: send-data-to-projector
 * 管理画面から投影ウィンドウへ任意データを送信します。
 * @param {_e} _e - IPCイベント（未使用）
 * @param {any} data - 送信するシリアライズ可能なデータ
 * @returns {void}
 */
ipcMain.handle('send-data-to-projector', (_e, data) => {
    lastKnownData = data;
    if (projectorWindow) {
      projectorWindow.webContents.send('update-content', data);
    }
  });

// ---(5)音楽ファイル関連 ---
  const SUPPORTED_AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
  /**
   * IPC: list-music-files
   * BGMディレクトリ内のファイル一覧を返します。
   * @returns {Promise<string[]>} ファイル名の配列
   */
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
  /**
   * IPC: upload-music-file
   * 新しいBGMファイルを保存します（同名は上書き）。
   * @param {_e} _e - IPCイベント（未使用）
   * @param {{name:string, buffer:Buffer|ArrayBuffer}} payload - 保存するファイル情報
   * @returns {Promise<void>}
   */
  ipcMain.handle('upload-music-file', async (_e, { name, buffer }) => {
    try {
      fs.mkdirSync(musicDir, { recursive: true });
      fs.writeFileSync(path.join(musicDir, name), Buffer.from(buffer));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  /**
   * IPC: delete-music-file
   * 指定したBGMファイルを削除します。
   * @param {_e} _e - IPCイベント（未使用）
   * @param {string} name - 削除するファイル名
   * @returns {Promise<void>}
   */
  ipcMain.handle('delete-music-file', async (_e, name) => {
    try {
      fs.unlinkSync(path.join(musicDir, name));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  // BGM設定のリセット（config.json の bgm セクションを空に）
  /**
   * IPC: reset-bgm-settings
   * BGM再生に関する設定を初期化します（ファイルは保持）。
   * @returns {Promise<void>}
   */
  ipcMain.handle('reset-bgm-settings', async () => {
    try {
      let cfg = {};
      if (fs.existsSync(configPath)) {
        cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      cfg.bgm = {};
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // BGMファイル一括削除（music ディレクトリ内の対応拡張子を全削除）
  /**
   * IPC: delete-all-bgm-files
   * BGMディレクトリ内のすべてのファイルを削除します。
   * @returns {Promise<void>}
   */
  ipcMain.handle('delete-all-bgm-files', async () => {
    try {
      if (!fs.existsSync(musicDir)) {
        return { success: true };
      }
      const SUPPORTED_AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
      const files = fs.readdirSync(musicDir);
      let failed = [];
      for (const f of files) {
        const ext = path.extname(f).toLowerCase();
        if (!SUPPORTED_AUDIO_EXTS.includes(ext)) continue;
        try {
          fs.unlinkSync(path.join(musicDir, f));
        } catch (e) {
          failed.push(`${f}: ${e.message}`);
        }
      }
      if (failed.length > 0) {
        return { success: false, error: failed.join('\n') };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // (6) BGM 設定の取得／保存
  /**
   * IPC: get-bgm-config
   * BGM関連の設定（音量やループなど）を取得します。
   * @returns {Promise<object>} BGM設定オブジェクト
   */
  ipcMain.handle('get-bgm-config', async () => {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return cfg.bgm || {};
    } catch { return {}; }
  });
  /**
   * IPC: set-bgm-config
   * BGM設定を保存します。
   * @param {_e} _e - IPCイベント（未使用）
   * @param {object} bgmConfig - 保存する設定
   * @returns {Promise<object>} 保存後の設定
   */
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
  /**
   * IPC: get-config
   * アプリ全体の設定を取得します。
   * @returns {Promise<object>} 設定オブジェクト
   */
  ipcMain.handle('get-config', async () => {
      try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
      return {};
      }
  });
  // (追加) カスタムCSS一覧取得
  ipcMain.handle('list-user-styles', async () => {
    try {
      if (!fs.existsSync(userStylesDir)) return [];
      return fs.readdirSync(userStylesDir).filter(f => f.toLowerCase().endsWith('.css'));
    } catch (e) { return []; }
  });
  // (追加) カスタムCSS保存
  ipcMain.handle('save-user-style', async (_e, { name, content }) => {
    try {
      if (!name) return { success: false, error: 'name is required' };
      name = name.replace(/[^A-Za-z0-9._-]/g, '_');
      if (!name.toLowerCase().endsWith('.css')) name += '.css';
      fs.mkdirSync(userStylesDir, { recursive: true });
      fs.writeFileSync(path.join(userStylesDir, name), content, 'utf-8');
      return { success: true, file: name };
    } catch (e) { return { success: false, error: e.message }; }
  });
  // (追加) カスタムCSS絶対パス取得
  ipcMain.handle('get-user-style-path', async (_e, name) => {
    try {
      if (!name) return null;
      const filePath = path.join(userStylesDir, name);
      if (!fs.existsSync(filePath)) return null;
      return `file://${filePath.replace(/\\/g, '/')}`;
    } catch { return null; }
  });
  // (追加) カスタムCSS削除
  ipcMain.handle('delete-user-style', async (_e, name) => {
    try {
      if (!name) return { success: false, error: 'name required' };
      const filePath = path.join(userStylesDir, name);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  });
  /**
   * IPC: get-music-file-path
   * 指定したBGMファイルの絶対パスを返します。
   * @param {_event} _event - IPCイベント（未使用）
   * @param {string} filename - ファイル名
   * @returns {Promise<string>} 絶対パス
   */
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

/**
 * IPC: reset-data
 * 設定とデータを初期状態に戻します（BGMファイルはオプションに依存）。
 * @returns {Promise<void>}
 */
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

/**
 * IPC: load-from-google-sheet
 * Googleスプレッドシートの公開URL（xlsxエクスポート）からデータを取得・解析します。
 * @param {_e} _e - IPCイベント（未使用）
 * @param {string} url - 公開シートのURL
 * @returns {Promise<object>} 解析結果のJSON
 */
ipcMain.handle('load-from-google-sheet', async (_e, url) => {
  try {
    // Google Sheet URLをCSVエクスポート用のURLに変換
    const sheetId = url.match(/\/d\/(.+?)\//)[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    const response = await axios.get(exportUrl, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // saveExcelDataと同様のロジックでJSONを生成
    const excelData = {};
    const cellB1 = "B1"; //大会名取得
    excelData[cellB1] = sheet[cellB1] ? sheet[cellB1].v : "";
    const cellD1 = "D1"; //チーム数取得
    const numTeams = sheet[cellD1] ? sheet[cellD1].v : 0;
    const cellF1 = "F1"; //兼題数取得
    const numProblems = sheet[cellF1] ? sheet[cellF1].v : 0;

    for (let k = 8; k <= numProblems * 2 + 6; k = k + 2) {
        const cell = getColumnLetter(k) + "1"; //兼題名取得
        excelData[cell] = sheet[cell] ? sheet[cell].v : "";
    }
    for (let i = 3; i <= numTeams + 2; i++) {
        const cell = "B" + i; //チーム名取得
        excelData[cell] = sheet[cell] ? sheet[cell].v : "";
        for (let j = 3; j <= numProblems * 10 + 2; j = j + 2) {
            const cellKey = getColumnLetter(j) + i;
            excelData[cellKey] = sheet[cellKey] ? sheet[cellKey].v : "";
        }
    }

    const jsonPath = path.join(app.getPath('userData'), "excelData.json");
    fs.writeFileSync(jsonPath, JSON.stringify(excelData, null, 4), "utf8");
    
    return { success: true, sheetName: sheetName };
  } catch (error) {
    console.error("Google Sheetの読み込み・解析エラー:", error);
    return { success: false, error: error.message };
  }
});

// ===== 5. その他イベント =====
/**
 * IPC: get-app-version
 * アプリのバージョン文字列を返します。
 * @returns {string}
 */
ipcMain.handle('get-app-version', () => app.getVersion());