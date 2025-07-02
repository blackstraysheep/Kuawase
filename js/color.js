const THEMES = {
  Pink:   { primary: '#ffb6d5', 'primary-dark': '#ff7fb2', 'primary-light': '#ffe3ef' },
  Red:    { primary: '#ff8a8a', 'primary-dark': '#ff4d4d', 'primary-light': '#ffc1c1' },
  Orange: { primary: '#ffd180', 'primary-dark': '#ffb300', 'primary-light': '#ffe7c2' },
  Yellow: { primary: '#fffc2e', 'primary-dark': '#ffec00', 'primary-light': '#fff78e' }, // 変更なし
  Lime:   { primary: '#e6ff8f', 'primary-dark': '#c4dd00', 'primary-light': '#f0ffb3' }, // 変更なし
  Limegreen:{ primary: '#c6ff8f', 'primary-dark': '#a3d600', 'primary-light': '#e6ffb3' }, // 変更なし
  Green:   { primary: '#7fdca0', 'primary-dark': '#4fc47a', 'primary-light': '#b2f2cc' },
  Emerald: { primary: '#7dd4e0', 'primary-dark': '#5bb3c5', 'primary-light': '#a8e6f0' }, 
  Skyblue: { primary: '#7fdcff', 'primary-dark': '#00b8f4', 'primary-light': '#bfeaff' },
  Blue:    { primary: '#7fbfff', 'primary-dark': '#338be6', 'primary-light': '#d0e8ff' },
  Indigo:  { primary: '#a0b3ff', 'primary-dark': '#5c6bc0', 'primary-light': '#dde3ff' },
  Purple:  { primary: '#c6b3e6', 'primary-dark': '#9575cd', 'primary-light': '#ede7f6' },
  Brown:   { primary: '#d2bfa0', 'primary-dark': '#a1887f', 'primary-light': '#f3e5c9' },
  Gray:    { primary: '#e0e0e0', 'primary-dark': '#bdbdbd', 'primary-light': '#f5f5f5' }, // 変更なし
};
// グローバル化
window.THEMES = THEMES;

// テーマ適用関数
window.applyTheme = function(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;
  Object.entries(theme).forEach(([k, v]) => {
      document.documentElement.style.setProperty(`--${k}`, v);
  });
  localStorage.setItem("theme", themeName);
};