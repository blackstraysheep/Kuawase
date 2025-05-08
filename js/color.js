const THEMES = {
  yellow: { primary: '#fffc2e', 'primary-dark': '#ffec00', 'primary-light': '#fff78e' },
  blue:   { primary: '#a3d5ff', 'primary-dark': '#61b2ff', 'primary-light': '#d8eeff' },
  green:  { primary: '#a8e6cf', 'primary-dark': '#81c784', 'primary-light': '#cfffd3' },
  red:    { primary: '#ff9e9e', 'primary-dark': '#ff6e6e', 'primary-light': '#ffd4d4' },
  purple: { primary: '#d1c4e9', 'primary-dark': '#b39ddb', 'primary-light': '#e8dffb' },
  orange: { primary: '#ffd9a3', 'primary-dark': '#ffb84d', 'primary-light': '#ffeecc' },
  teal:   { primary: '#a2d5c6', 'primary-dark': '#67bdb3', 'primary-light': '#d6f1ef' },
  pink:   { primary: '#ffb3c1', 'primary-dark': '#ff7b91', 'primary-light': '#ffdbea' },
  mint:   { primary: '#b2f2bb', 'primary-dark': '#8ce99a', 'primary-light': '#e2fcec' }
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