document.addEventListener("DOMContentLoaded", async () => {
    const fileList = document.getElementById("music-file-list");
    const uploadInput = document.getElementById("music-upload-input");
    const saveBtn = document.getElementById("save-bgm-config");
    const selects = {
        hikou: document.getElementById("bgm-hikou"),
        in: document.getElementById("bgm-in"),
        out: document.getElementById("bgm-out"),
        wait: document.getElementById("bgm-wait"),
        timer1: document.getElementById("bgm-timer1"),
        timer2: document.getElementById("bgm-timer2"),
    };

    // --- 追加: BGMプリロード用 ---
    window.bgmAudioElements = {}; // グローバルで参照できるように

    async function preloadBgmAudios() {
        if (!window.electron?.getBgmConfig) return;
        const bgm = await window.electron.getBgmConfig();
        const types = ["hikou", "in", "out", "wait", "timer1", "timer2"];
        for (const type of types) {
            const file = bgm[type];
            if (!file) continue;
            const path = await window.electron.invoke('get-music-file-path', file);
            let audio = document.getElementById("audio_dynamic_" + type);
            if (!audio) {
                audio = document.createElement("audio");
                audio.id = "audio_dynamic_" + type;
                audio.preload = "auto";
                document.body.appendChild(audio);
            }
            audio.src = path;
            window.bgmAudioElements[type] = audio;
        }
    }

    async function refreshListAndSelects() {
        const files = await window.electron.listMusicFiles();
        fileList.innerHTML = "";
        files.forEach(f => {
            const li = document.createElement("li");
            const nameSpan = document.createElement("span");
            nameSpan.className = "music-file-name";
            nameSpan.textContent = f;
            li.appendChild(nameSpan);
            const del = document.createElement("button");
            del.setAttribute("data-lang", "bgm-delete");
            del.textContent = t ? t("bgm-delete") : "削除";
            del.onclick = async () => {
                let ok = true;
                if (window.showConfirm) {
                    ok = await window.showConfirm('bgm-delete-one-confirm', { name: f });
                } else {
                    const fallbackMsg = (window.t ? window.t('bgm-delete-one-confirm') : `${f} を削除しますか？`).replace('{name}', f);
                    ok = confirm(fallbackMsg);
                }
                if (!ok) return;
                await window.electron.deleteMusicFile(f);
                refreshListAndSelects();
                await preloadBgmAudios();
            };
            li.appendChild(del);
            fileList.appendChild(li);
        });
        Object.values(selects).forEach(sel => {
            sel.innerHTML = "";
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "（未設定）";
            sel.appendChild(defaultOption);
            
            files.forEach(f => {
                const opt = document.createElement("option");
                opt.value = f;
                opt.textContent = f;
                sel.appendChild(opt);
            });
        });
        // 設定反映
        const bgm = await window.electron.getBgmConfig();
        selects.hikou.value = bgm.hikou || "";
        selects.in.value = bgm.in || "";
        selects.out.value = bgm.out || "";
        selects.wait.value = bgm.wait || "";
        selects.timer1.value = bgm.timer1 || "";
        selects.timer2.value = bgm.timer2 || "";
        await preloadBgmAudios(); // リスト更新時もプリロード
    }

    // アップロード処理を直接changeイベントで定義
    uploadInput.addEventListener("change", async () => {
        const files = uploadInput.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            await window.electron.uploadMusicFile(file.name, new Uint8Array(arrayBuffer));
        }
        uploadInput.value = "";
        await refreshListAndSelects();
    });

    saveBtn.onclick = async () => {
        const bgmConfig = {
            hikou: selects.hikou.value,
            in: selects.in.value,
            out: selects.out.value,
            wait: selects.wait.value,
            timer1: selects.timer1.value,
            timer2: selects.timer2.value,
        };
        await window.electron.setBgmConfig(bgmConfig);
        showToast(t("bgm-save-success"));
        await preloadBgmAudios(); // 設定保存時もプリロード
    };

    const deleteAllBtn = document.getElementById("delete-all-music-btn");
    if (deleteAllBtn) {
        deleteAllBtn.onclick = async () => {
            let ok = true;
            if (window.showConfirm) {
                ok = await window.showConfirm('bgm-delete-all-confirm');
            } else {
                ok = confirm(window.t ? window.t('bgm-delete-all-confirm') : 'すべてのBGMファイルを削除しますか？');
            }
            if (!ok) {
                if (window.showToast && window.t) window.showToast(window.t('bgm-delete-all-cancel'), true);
                return;
            }
            const files = await window.electron.listMusicFiles();
            for (const f of files) { await window.electron.deleteMusicFile(f); }
            await refreshListAndSelects();
            await preloadBgmAudios();
            if (window.showToast && window.t) window.showToast(window.t('bgm-delete-all-success'));
        };
    }

    await refreshListAndSelects();
});