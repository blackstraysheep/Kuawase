const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    env: {
        NODE_ENV: process.env.NODE_ENV || "production" // 環境変数を取得
    },
    targetOrigin: process.env.NODE_ENV === "development" ? "*" : "file://",
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, (_, data) => callback(data)),
    changeIframeSrc: (src) => ipcRenderer.send("change-iframe-src", src),
    receive: (channel, callback) => {
        console.log("[preload.js] Listening for:", channel);  // 追加
        ipcRenderer.on(channel, (_, data) => {
            console.log("[preload.js] Received data:", data);  // 追加
            callback(data);
        });
    },
    listMusicFiles: () => ipcRenderer.invoke("list-music-files"),
    uploadMusicFile: (name, buffer) => ipcRenderer.invoke("upload-music-file", { name, buffer }),
    deleteMusicFile: (name) => ipcRenderer.invoke("delete-music-file", name),
    getBgmConfig: () => ipcRenderer.invoke("get-bgm-config"),
    setBgmConfig: (bgmConfig) => ipcRenderer.invoke("set-bgm-config", bgmConfig),
});