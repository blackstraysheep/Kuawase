// --- 1つ目のタイマー ---
let countdown;
let remainingTime = 180;
let isRunning = false;
let initialTime = 180;
let soundPlayed = false;

function updateDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  document.getElementById('timer').textContent =
    String(minutes).padStart(2, '0') + "分" +
    String(seconds).padStart(2, '0') + "秒";

  if (remainingTime <= 60 && remainingTime > 0) {
    document.getElementById('one-minute-warning').textContent = "1分前";
  } else if (remainingTime === 0) {
    document.getElementById('one-minute-warning').textContent = "そこまで";
  } else {
    document.getElementById('one-minute-warning').textContent = "";
  }
}

function saveTimeSetting() {
  const minutes = parseInt(document.getElementById('minutes').value) || 0;
  const seconds = parseInt(document.getElementById('seconds').value) || 0;
  remainingTime = minutes * 60 + seconds;
  initialTime = remainingTime;
  updateDisplay();
}

function startTimer() {
  if (isRunning) return;

  if (remainingTime <= 0) {
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;
    remainingTime = minutes * 60 + seconds;
    initialTime = remainingTime;
    soundPlayed = false;
  }

  isRunning = true;
  countdown = setInterval(async () => {
    if (remainingTime > 0) {
      remainingTime--;
      updateDisplay();
    } else {
      clearInterval(countdown);
      isRunning = false;
      if (!soundPlayed) {
        let played = false;
        if (window.electron?.getBgmConfig) {
          const bgm = await window.electron.getBgmConfig();
          if (bgm.timer1) {
            const path = await window.electron.invoke("get-music-file-path", bgm.timer1);
            let audio = document.getElementById("audio_timer1");
            if (!audio) {
              audio = document.createElement("audio");
              audio.id = "audio_timer1";
              document.body.appendChild(audio);
            }
            audio.src = path;
            audio.muted = false;
            audio.currentTime = 0;
            await audio.play();
            played = true;
          }
        }
        if (!played) {
          document.getElementById('alarm-sound').play();
        }
        soundPlayed = true;
        resetTimer2();
      }
    }
  }, 1000);

  updateDisplay();
}

function pauseTimer() {
  clearInterval(countdown);
  isRunning = false;
}

function resetTimer() {
  clearInterval(countdown);
  isRunning = false;
  remainingTime = initialTime;
  updateDisplay();
  soundPlayed = false;
  let audio = document.getElementById("audio_timer1");
  if (audio) {
    audio.pause();
    audio.remove(); // ← 完全にDOMから削除（再生の不具合回避）
  }
}


// --- 2つ目のタイマー ---
let countdown2;
let remainingTime2 = 30;
let isRunning2 = false;
let initialTime2 = 30;
let soundPlayed2 = false;

function updateDisplay2() {
  document.getElementById('timer2').textContent =
    String(remainingTime2).padStart(2, '0') + "秒";
}

function saveTimeSetting2() {
  const seconds = parseInt(document.getElementById('seconds2').value) || 0;
  remainingTime2 = seconds;
  initialTime2 = remainingTime2;
  updateDisplay2();
}

function startTimer2() {
  if (isRunning2) return;

  if (remainingTime2 <= 0) {
    const seconds = parseInt(document.getElementById('seconds2').value) || 0;
    remainingTime2 = seconds;
    initialTime2 = remainingTime2;
    soundPlayed2 = false;
  }

  isRunning2 = true;
  countdown2 = setInterval(async () => {
    if (remainingTime2 > 0) {
      remainingTime2--;
      updateDisplay2();
    } else {
      clearInterval(countdown2);
      isRunning2 = false;
      if (!soundPlayed2) {
        let played = false;
        if (window.electron?.getBgmConfig) {
          const bgm = await window.electron.getBgmConfig();
          if (bgm.timer2) {
            const path = await window.electron.invoke("get-music-file-path", bgm.timer2);
            let audio = document.getElementById("audio_timer2");
            if (!audio) {
              audio = document.createElement("audio");
              audio.id = "audio_timer2";
              document.body.appendChild(audio);
            }
            audio.src = path;
            audio.muted = false;
            audio.currentTime = 0;
            await audio.play();
            played = true;
          }
        }
        if (!played) {
          document.getElementById('alarm-sound2').play();
        }
        soundPlayed2 = true;
      }
    }
  }, 1000);

  updateDisplay2();
}

function pauseTimer2() {
  clearInterval(countdown2);
  isRunning2 = false;
}

function resetTimer2() {
  clearInterval(countdown2);
  isRunning2 = false;
  remainingTime2 = initialTime2;
  updateDisplay2();
  soundPlayed2 = false;
  let audio = document.getElementById("audio_timer2");
  if (audio) {
    audio.pause();
    audio.remove();  // ← ここも同様に追加
  }
}
// 初期表示
updateDisplay();
updateDisplay2();
