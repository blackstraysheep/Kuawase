const THEMES = {
  Pink:   { primary: '#ffe4f0', 'primary-dark': '#ffb6d5', 'primary-light': '#fff6fa' },
  Red:    { primary: '#ff9e9e', 'primary-dark': '#ff6e6e', 'primary-light': '#ffd4d4' },
  Orange: { primary: '#ffd9a3', 'primary-dark': '#ffb84d', 'primary-light': '#ffeecc' },
  Yellow: { primary: '#fffc2e', 'primary-dark': '#ffec00', 'primary-light': '#fff78e' },
  Lime:   { primary: '#e6ff8f', 'primary-dark': '#c4dd00', 'primary-light': '#f0ffb3' },
  Limegreen:{ primary: '#c6ff8f', 'primary-dark': '#a3d600', 'primary-light': '#e6ffb3' },
  Green:   { primary: '#b2f2bb', 'primary-dark': '#8ce99a', 'primary-light': '#e2fcec' },
  Skyblue: { primary: '#b3e5fc', 'primary-dark': '#4fc3f7', 'primary-light': '#e1f5fe' }, 
  Blue:    { primary: '#90caf9', 'primary-dark': '#1976d2', 'primary-light': '#e3f2fd' }, 
  Indigo: { primary: '#8c9eff', 'primary-dark': '#536dfe', 'primary-light': '#b2cfff' },
  Purple: { primary: '#d1c4e9', 'primary-dark': '#b39ddb', 'primary-light': '#e8dffb' },
  Brown:  { primary: '#e7d3b5', 'primary-dark': '#b89b7a', 'primary-light': '#f9f3ea' },
  Gray:   { primary: '#e0e0e0', 'primary-dark': '#bdbdbd', 'primary-light': '#f5f5f5' },
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