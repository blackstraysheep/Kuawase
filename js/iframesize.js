function adjustIframeScale() {
    const iframe = document.getElementById("slide-frame");
    if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) {
        console.error("iframe のコンテンツがロードされていません");
        return;
    }
    const iframeDoc = iframe.contentWindow.document;

    // 投影ウィンドウのサイズを取得
    const projectWindow = window.opener || window.parent; // projectWindow を指す
    const projectionWidth = projectWindow.innerWidth;
    const projectionHeight = projectWindow.innerHeight;
    console.log("投影ウィンドウのサイズ:", projectionWidth, projectionHeight);

    // iframe の表示領域サイズを取得
    const iframeContainer = iframe.parentElement; 
    const iframeWidth = iframeContainer.clientWidth;
    const iframeHeight = iframeContainer.clientHeight;
    console.log("iframe の表示領域サイズ:", iframeWidth, iframeHeight);

    // 縮小率を計算（アスペクト比を維持）
    const scaleFactor = Math.min(iframeWidth / projectionWidth, iframeHeight / projectionHeight);

    // CSSで縮小適用
    iframeDoc.body.style.transform = `scale(${scaleFactor})`;
    iframeDoc.body.style.transformOrigin = "top left";
}

// iframe の読み込み完了時に実行
document.getElementById("slide-frame").onload = adjustIframeScale;

// ウィンドウのリサイズ時にも調整
window.addEventListener("resize", adjustIframeScale);

document.addEventListener("DOMContentLoaded", function () {
    const iframe = document.getElementById("slide-frame");
    
    if (iframe) {
        iframe.onload = function () {
            adjustIframeScale();  // iframe のロード完了後に縮小処理を実行
            window.addEventListener("resize", adjustIframeScale);  // その後、リサイズ時にも適用
        };
    } else {
        console.error("iframe が見つかりませんでした。IDを確認してください。");
    }
});
