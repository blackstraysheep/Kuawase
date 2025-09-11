// --- 1つ目のタイマー ---
let countdown;
let remainingTime = 180;
let isRunning = false;
let initialTime = 180;
let soundPlayed = false;

function updateDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  document.getElementById('timer1min').textContent =
    String(minutes).padStart(2, '0');
  document.getElementById('timer1sec').textContent =
    String(seconds).padStart(2, '0');
  if (remainingTime <= 60 && remainingTime > 0) {
    document.getElementById('one-minute-warning').textContent = t("minwarn");
  } else if (remainingTime === 0) {
    document.getElementById('one-minute-warning').textContent = t("minfin");
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

  const audio1 = document.getElementById("audio_timer1");
  if (audio1) {
    audio1.pause();
    audio1.currentTime = 0;
    audio1.remove();
  }

  // タイマー背景の赤表示を解除
  const timerBlock4 = document.getElementById('timer')?.closest('.timer-block');
  if (timerBlock4) timerBlock4.classList.remove('timer-expired');

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
          const alarm = document.getElementById('alarm-sound');
          if (alarm) alarm.play();
        }
        soundPlayed = true;
        // 0秒到達時に背景を薄赤に
        const timerBlock2 = document.getElementById('timer')?.closest('.timer-block');
        if (timerBlock2) timerBlock2.classList.add('timer-expired');
      }
      resetTimer2();
    }
  }, 1000);

  updateDisplay();
}

function pauseTimer() {
  clearInterval(countdown);
  isRunning = false;
  // 一時停止でも背景色は元に戻す
  const timerBlock3 = document.getElementById('timer')?.closest('.timer-block');
  if (timerBlock3) timerBlock3.classList.remove('timer-expired');
  // 鳴動中のタイマーBGMを停止
  let audio = document.getElementById("audio_timer1");
  if (audio) { audio.pause(); audio.remove(); }
  const alarm = document.getElementById('alarm-sound');
  if (alarm && typeof alarm.pause === 'function') { alarm.pause(); }
}

function resetTimer() {
  clearInterval(countdown);
  isRunning = false;
  remainingTime = initialTime;
  updateDisplay();
  soundPlayed = false;
  // リセットで背景の赤表示を解除
  const timerBlockReset = document.getElementById('timer')?.closest('.timer-block');
  if (timerBlockReset) timerBlockReset.classList.remove('timer-expired');
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
  document.getElementById('timer2sec').textContent =
    String(remainingTime2).padStart(2, '0');
}

function saveTimeSetting2() {
  const seconds = parseInt(document.getElementById('seconds2').value) || 0;
  remainingTime2 = seconds;
  initialTime2 = remainingTime2;
  updateDisplay2();
}

function startTimer2() {
  if (isRunning2) return;

  const audio2 = document.getElementById("audio_timer2");
  if (audio2) {
    audio2.pause();
    audio2.currentTime = 0;
    audio2.remove();
  }

  // タイマー2の背景の赤表示を解除
  const timer2Block = document.getElementById('timer2')?.closest('.timer-block');
  if (timer2Block) timer2Block.classList.remove('timer-expired');

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
          const alarm = document.getElementById('alarm-sound2');
          if (alarm) alarm.play();
        }
        soundPlayed2 = true;
        // 0秒到達時に背景を薄赤に
        const timer2Block2 = document.getElementById('timer2')?.closest('.timer-block');
        if (timer2Block2) timer2Block2.classList.add('timer-expired');
      }
    }
  }, 1000);

  updateDisplay2();
}

function pauseTimer2() {
  clearInterval(countdown2);
  isRunning2 = false;
  // 一時停止でも背景色は元に戻す
  const timer2Block3 = document.getElementById('timer2')?.closest('.timer-block');
  if (timer2Block3) timer2Block3.classList.remove('timer-expired');
  // 鳴動中のタイマーBGMを停止
  let audio2 = document.getElementById("audio_timer2");
  if (audio2) { audio2.pause(); audio2.remove(); }
  const alarm2 = document.getElementById('alarm-sound2');
  if (alarm2 && typeof alarm2.pause === 'function') { alarm2.pause(); }
}

function resetTimer2() {
  clearInterval(countdown2);
  isRunning2 = false;
  remainingTime2 = initialTime2;
  updateDisplay2();
  soundPlayed2 = false;
  // リセットで背景の赤表示を解除
  const timer2Block4 = document.getElementById('timer2')?.closest('.timer-block');
  if (timer2Block4) timer2Block4.classList.remove('timer-expired');
  let audio = document.getElementById("audio_timer2");
  if (audio) {
    audio.pause();
    audio.remove();  // ← ここも同様に追加
  }
}
// 初期表示
updateDisplay();
updateDisplay2();
