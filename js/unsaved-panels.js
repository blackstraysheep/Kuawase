document.addEventListener('DOMContentLoaded', () => {
  // 対戦指定パネル
  const matchPanel = document.getElementById('match-setup-panel');
  const matchFields = {
    red: document.getElementById('redTeamSelect'),
    white: document.getElementById('whiteTeamSelect'),
    kendai: document.getElementById('kendaiSelect'),
    title: document.getElementById('matchTitleInput'),
  };
  const matchSaveBtn = document.getElementById('saveMatchConfig');

  // BGM設定パネル（details全体を対象）
  const bgmSaveBtn = document.getElementById('save-bgm-config');
  const bgmSelects = {
    hikou: document.getElementById('bgm-hikou'),
    in: document.getElementById('bgm-in'),
    out: document.getElementById('bgm-out'),
    wait: document.getElementById('bgm-wait'),
    timer1: document.getElementById('bgm-timer1'),
    timer2: document.getElementById('bgm-timer2'),
  };
  const bgmDetails = bgmSaveBtn ? bgmSaveBtn.closest('details') : null;

  // ベースライン（保存済み状態の値）
  let matchBaseline = null;
  let bgmBaseline = null;
  let matchDirty = false;
  let bgmDirty = false;

  // 他処理の初期化後に基準値を取得
  setTimeout(() => {
    if (matchPanel) {
      matchBaseline = {
        red: matchFields.red?.value ?? '',
        white: matchFields.white?.value ?? '',
        kendai: matchFields.kendai?.value ?? '',
        title: matchFields.title?.value ?? '',
      };
    }
    if (bgmSaveBtn) {
      bgmBaseline = {
        hikou: bgmSelects.hikou?.value ?? '',
        in: bgmSelects.in?.value ?? '',
        out: bgmSelects.out?.value ?? '',
        wait: bgmSelects.wait?.value ?? '',
        timer1: bgmSelects.timer1?.value ?? '',
        timer2: bgmSelects.timer2?.value ?? '',
      };
    }
  }, 0);

  function isMatchDirty() {
    if (!matchBaseline) return false;
    return (
      (matchFields.red?.value ?? '') !== matchBaseline.red ||
      (matchFields.white?.value ?? '') !== matchBaseline.white ||
      (matchFields.kendai?.value ?? '') !== matchBaseline.kendai ||
      (matchFields.title?.value ?? '') !== matchBaseline.title
    );
  }

  function isBgmDirty() {
    if (!bgmBaseline) return false;
    return (
      (bgmSelects.hikou?.value ?? '') !== bgmBaseline.hikou ||
      (bgmSelects.in?.value ?? '') !== bgmBaseline.in ||
      (bgmSelects.out?.value ?? '') !== bgmBaseline.out ||
      (bgmSelects.wait?.value ?? '') !== bgmBaseline.wait ||
      (bgmSelects.timer1?.value ?? '') !== bgmBaseline.timer1 ||
      (bgmSelects.timer2?.value ?? '') !== bgmBaseline.timer2
    );
  }

  // 変更検知
  ['change', 'input'].forEach(evt => {
    Object.values(matchFields).forEach(el => el && el.addEventListener(evt, () => {
      matchDirty = isMatchDirty();
      if (!matchDirty) matchPanel?.classList.remove('panel-unsaved');
    }));
    Object.values(bgmSelects).forEach(el => el && el.addEventListener(evt, () => {
      bgmDirty = isBgmDirty();
      if (!bgmDirty) bgmDetails?.classList.remove('panel-unsaved');
    }));
  });

  // 保存時にベースライン更新＆ハイライト解除
  if (matchSaveBtn) {
    matchSaveBtn.addEventListener('click', () => {
      matchBaseline = {
        red: matchFields.red?.value ?? '',
        white: matchFields.white?.value ?? '',
        kendai: matchFields.kendai?.value ?? '',
        title: matchFields.title?.value ?? '',
      };
      matchDirty = false;
      matchPanel?.classList.remove('panel-unsaved');
    });
  }
  if (bgmSaveBtn) {
    bgmSaveBtn.addEventListener('click', () => {
      bgmBaseline = {
        hikou: bgmSelects.hikou?.value ?? '',
        in: bgmSelects.in?.value ?? '',
        out: bgmSelects.out?.value ?? '',
        wait: bgmSelects.wait?.value ?? '',
        timer1: bgmSelects.timer1?.value ?? '',
        timer2: bgmSelects.timer2?.value ?? '',
      };
      bgmDirty = false;
      bgmDetails?.classList.remove('panel-unsaved');
    });
  }

  // 別操作へ移ろうとしたら薄赤＋赤トースト
  let lastToastAt = { bgm: 0, match: 0 };
  const TOAST_COOLDOWN_MS = 1200;

  document.addEventListener('click', (e) => {
    const target = e.target;
    // BGM
    if (bgmDetails && bgmDirty) {
      const insideBgm = bgmDetails.contains(target);
      const isSave = target === bgmSaveBtn;
      if (!insideBgm && !isSave) {
        bgmDetails.classList.add('panel-unsaved');
        const now = Date.now();
        if (window.showToast && now - lastToastAt.bgm > TOAST_COOLDOWN_MS) {
          lastToastAt.bgm = now;
          const msg = (typeof t === 'function') ? t('unsaved-bgm') : 'unsaved-bgm';
          window.showToast(msg, true);
        }
      }
    }
    // 対戦指定
    if (matchPanel && matchDirty) {
      const insideMatch = matchPanel.contains(target);
      const isSave = target === matchSaveBtn;
      if (!insideMatch && !isSave) {
        matchPanel.classList.add('panel-unsaved');
        const now2 = Date.now();
        if (window.showToast && now2 - lastToastAt.match > TOAST_COOLDOWN_MS) {
          lastToastAt.match = now2;
          const msg = (typeof t === 'function') ? t('unsaved-match') : 'unsaved-match';
          window.showToast(msg, true);
        }
      }
    }
  }, true);
});

