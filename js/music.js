// ------- BGM(入場・退場・待機)停止一元管理（フェードアウト対応） --------
window.stopBgm = function(fadeMs = 1200) {
    ["hikou", "in", "out", "wait"].forEach(type => {
        const audio = window.bgmAudioElements?.[type];
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
            audio.currentTime = 0;
        }
    });
};

// ループ状態管理
let waitLoopEnabled = false;

// ------- Audio再生 共通関数 --------
function playAudioByType(type) {
    const audio = window.bgmAudioElements?.[type];
    if (!audio) {
        showToast("BGMが設定されていません");
        return;
    }
    audio.currentTime = 0;
    if (type === "wait") audio.loop = waitLoopEnabled;
    audio.play();
}

// ------- 個別再生ボタン --------
function audio_hikou() { playAudioByType('hikou'); }
function audio_in()    { playAudioByType('in');    }
function audio_out()   { playAudioByType('out');   }
function audio_wait()  { playAudioByType('wait');  }

// ------- ミュート切り替え 共通関数 --------
function toggleMuteDynamic() {
    // 旧仕様の個別ミュートはhikouのみ
    const audio = window.bgmAudioElements?.hikou;
    if (audio) audio.muted = !audio.muted;
}

// ------- 音声排他再生処理 --------
document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('toggle-wait-loop-checkbox');
    if (checkbox) {
        checkbox.checked = waitLoopEnabled;
        checkbox.onchange = () => {
            waitLoopEnabled = checkbox.checked;
            // すでに再生中の待機BGMにも反映
            const audio = window.bgmAudioElements?.wait;
            if (audio) audio.loop = waitLoopEnabled;
        };
    }
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