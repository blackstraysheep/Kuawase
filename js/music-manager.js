document.addEventListener("DOMContentLoaded", async () => {
    const fileList = document.getElementById("music-file-list");
    const uploadInput = document.getElementById("music-upload-input");
    const uploadBtn = document.getElementById("music-upload-btn");
    const saveBtn = document.getElementById("save-bgm-config");
    const selects = {
        hikou: document.getElementById("bgm-hikou"),
        in: document.getElementById("bgm-in"),
        out: document.getElementById("bgm-out"),
        wait: document.getElementById("bgm-wait"),
        timer1: document.getElementById("bgm-timer1"),
        timer2: document.getElementById("bgm-timer2"),
    };

    async function refreshListAndSelects() {
        const files = await window.electron.listMusicFiles();
        fileList.innerHTML = "";
        files.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            const del = document.createElement("button");
            del.textContent = "削除";
            del.onclick = async () => {
                if (confirm(`${f} を削除しますか？`)) {
                    await window.electron.deleteMusicFile(f);
                    refreshListAndSelects();
                }
            };
            li.appendChild(del);
            fileList.appendChild(li);
        });
        Object.values(selects).forEach(sel => {
            sel.innerHTML = "<option value=''>（未設定）</option>";
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
    }

    uploadBtn.onclick = async () => {
        const files = uploadInput.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            await window.electron.uploadMusicFile(file.name, new Uint8Array(arrayBuffer));
        }
        uploadInput.value = "";
        refreshListAndSelects();
    };

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
        showToast("BGM設定を保存しました！");
    };

    refreshListAndSelects();
});
