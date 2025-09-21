function changeIframeSrc(src) {
    document.getElementById('slide-frame').src = src;
    if (window.electron) {
        window.electron.changeIframeSrc(src);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    await window.setLanguage(localStorage.getItem("lang") || "en");
    setupEventHandlers();
    initHomeDarkMode();
    function setupEventHandlers() {
    const btn = document.getElementById("stop-bgm-btn");
    if (btn) {
        btn.onclick = function() {
            window.stopBgm && window.stopBgm();
        };
    }
}
    function initHomeDarkMode(){
        const toggle = document.getElementById('home-darkmode-toggle');
        if(!toggle) return;
        const saved = localStorage.getItem('home-dark-mode') === 'true';
        if(saved){
            document.body.classList.add('home-dark');
            document.documentElement.setAttribute('data-home-dark','true');
        }
        toggle.checked = saved;
        toggle.addEventListener('change', ()=>{
            const enabled = toggle.checked;
            if(enabled){
                document.body.classList.add('home-dark');
                document.documentElement.setAttribute('data-home-dark','true');
            } else {
                document.body.classList.remove('home-dark');
                document.documentElement.removeAttribute('data-home-dark');
            }
            localStorage.setItem('home-dark-mode', enabled);
        });
    }
});