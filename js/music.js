// ------- BGM(入場・退場・待機)停止一元管理（フェードアウト対応） --------
window.stopBgm = function(fadeMs = 1200) {
    ["audio_dynamic_in", "audio_dynamic_out", "audio_dynamic_wait"].forEach(id => {
        const audio = document.getElementById(id);
        if (audio && !audio.paused && !audio._fading) {
            audio._fading = true;
            const fadeStep = 50;
            const initialVolume = audio.volume;
            let currentVolume = initialVolume;
            const steps = Math.ceil(fadeMs / fadeStep);
            const delta = initialVolume / steps;
            const fade = setInterval(() => {
                currentVolume -= delta;
                if (currentVolume <= 0) {
                    audio.volume = 0;
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = initialVolume;
                    clearInterval(fade);
                    audio._fading = false;
                } else {
                    audio.volume = Math.max(0, currentVolume);
                }
            }, fadeStep);
        } else if (audio && audio.paused) {
            // すでに停止している場合は即リセット
            audio.currentTime = 0;
        }
    });
};

// ------- Audio再生 共通関数 --------
async function playAudioByType(type) {
    let bgm = {};
    if (window.electron && window.electron.getBgmConfig) {
        bgm = await window.electron.getBgmConfig();
    }
    const fileMap = {
        hikou: bgm.hikou,
        in: bgm.in,
        out: bgm.out,
        wait: bgm.wait,
    };
    const file = fileMap[type];
    if (!file) {
        showToastAndReload("BGMが設定されていません");
        return;
    }
    let audioId = "audio_dynamic";
    if (type === "in") audioId = "audio_dynamic_in";
    if (type === "out") audioId = "audio_dynamic_out";
    if (type === "wait") audioId = "audio_dynamic_wait";
    let audio = document.getElementById(audioId);
    if (!audio) {
        audio = document.createElement("audio");
        audio.id = audioId;
        document.body.appendChild(audio);
    }
    audio.src = `music/${file}`;
    audio.currentTime = 0;
    audio.play();
}

// ------- 個別再生ボタン --------
function audio_hikou() { playAudioByType('hikou'); }
function audio_in()    { playAudioByType('in');    }
function audio_out()   { playAudioByType('out');   }
function audio_wait()  { playAudioByType('wait');  }

// ------- ミュート切り替え 共通関数 --------
function toggleMuteDynamic() {
    // 旧仕様の個別ミュートはaudio_dynamicのみ
    const audio = document.getElementById("audio_dynamic");
    if (audio) audio.muted = !audio.muted;
}

// ------- 音声排他再生処理 --------
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('play', (e) => {
        const audios = document.querySelectorAll('audio');
        audios.forEach((audio) => {
            if (audio !== e.target) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }, true);
}, false);
