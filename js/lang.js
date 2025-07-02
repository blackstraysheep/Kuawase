// lang.js
 let currentLang = localStorage.getItem("lang") || "ja";
 let translations = {};

 async function loadLocale(lang) {
     const res = await fetch(`locales/${lang}.json`);
     translations = await res.json();
     currentLang = lang;
     localStorage.setItem("lang", lang);
     applyTranslations();
     if (window.setupEventHandlers) window.setupEventHandlers(); 
 }

 function t(key) {
     return translations[key] || key;
 }

 function applyTranslations() {
     document.querySelectorAll("[data-lang]").forEach(el => {
         const key = el.getAttribute("data-lang");
         el.textContent = t(key);
     });
 }

 function getCurrentLang() {
    return (window.currentLang || localStorage.getItem("lang") || "ja");
}

 window.setLanguage = loadLocale;
 window.t = t;
 window.getCurrentLang = getCurrentLang;

document.addEventListener('DOMContentLoaded', () => {
  loadLocale(currentLang);
});
