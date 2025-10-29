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
                    // 一時的な音量変更がある場合は元の音量を優先して復元
                    audio.volume = (typeof audio._originalVolume === 'number') ? audio._originalVolume : initialVolume;
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
// 次回の披講再生だけ一時音量を強制するためのフラグ（nullなら通常）
window.hikouNextPlayVolumeOverride = null;

function playAudioByType(type) {
    const audio = window.bgmAudioElements?.[type];
    if (!audio) {
        showToast(t("audio-empty"));
        return;
    }
    // 披講のみ、次回一時音量指定があればそれを適用
    if (type === 'hikou') {
        if (typeof window.hikouNextPlayVolumeOverride === 'number') {
            if (typeof audio._originalVolume !== 'number') {
                audio._originalVolume = audio.volume;
            }
            const target = Math.max(0, Math.min(1, window.hikouNextPlayVolumeOverride));
            audio.volume = target;
            audio._tempVolApplied = true;
            // 再生終了/停止で元音量に戻す
            const restoreOnce = () => {
                if (!audio._tempVolApplied) return;
                audio._tempVolApplied = false;
                if (typeof audio._originalVolume === 'number') {
                    audio.volume = audio._originalVolume;
                }
                audio.removeEventListener('ended', restoreOnce);
                audio.removeEventListener('pause', restoreOnce);
            };
            audio.addEventListener('ended', restoreOnce);
            audio.addEventListener('pause', restoreOnce);
            // 一度使ったら消費
            window.hikouNextPlayVolumeOverride = null;
        } else if (audio._tempVolApplied && typeof audio._originalVolume === 'number') {
            // 以前の一時音量が残っていたら通常再生前に復元
            audio._tempVolApplied = false;
            audio.volume = audio._originalVolume;
        }
    } else {
        // 披講以外は、誤って一時状態が残っていたら復元しておく
        if (audio._tempVolApplied && typeof audio._originalVolume === 'number') {
            audio._tempVolApplied = false;
            audio.volume = audio._originalVolume;
        }
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

// ------- 披講を一時的な音量で再生（ステージ切替用） --------
// 仕様:
// - 対戦切り替えボタン押下時のみ使用。
// - 将来的には「音量0」で再生するための機構だが、デバッグ中は既存音量の半分で再生。
// - 再生終了（または停止）時に元の音量へ確実に戻す。
window.playHikouWithTemporaryVolume = function(multiplier = 0.5) {
    try {
        const audio = window.bgmAudioElements?.hikou;
        if (!audio) {
            // 披講ファイル未設定時は何も表示せず静かにスキップ
            return;
        }
        // 既にフェード中はスキップ
        if (audio._fading) return;

        // 元音量の保持（未保持時のみ）
        if (typeof audio._originalVolume !== 'number') {
            audio._originalVolume = audio.volume;
        }

        // デバッグ用: 半分の音量で再生（本番は 0.0 に置換可能）
        const targetVolume = Math.max(0, Math.min(1, audio._originalVolume * multiplier));

        // 一時音量を適用して再生
        audio._tempVolApplied = true;
        audio.volume = targetVolume;
        audio.currentTime = 0;
        audio.loop = false; // 披講はループしない想定
        const p = audio.play();

        // ログ（デバッグ確認用）
        try { console.log(`[music.js] 披講(一時音量)再生: original=${audio._originalVolume}, applied=${targetVolume}`); } catch {}

        // 終了/停止時に音量を戻すためのハンドラ
        const restoreOnce = () => {
            if (!audio._tempVolApplied) return;
            audio._tempVolApplied = false;
            // stopBgm 側でも _originalVolume を考慮するが、ここでも積極的に復元
            if (typeof audio._originalVolume === 'number') {
                audio.volume = audio._originalVolume;
            }
            audio.removeEventListener('ended', restoreOnce);
            audio.removeEventListener('pause', restoreOnce);
        };
        audio.addEventListener('ended', restoreOnce);
        audio.addEventListener('pause', restoreOnce);

        return p;
    } catch (e) {
        try { console.error('[music.js] playHikouWithTemporaryVolume error', e); } catch {}
    }
};

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