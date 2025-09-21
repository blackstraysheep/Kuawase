// HTMLサニタイズ用のユーティリティ関数
// DOMPurifyを使用してHTMLを安全にサニタイズします

// DOMPurifyインスタンスを取得
function getDOMPurifyInstance() {
    // グローバルなDOMPurifyが既に存在する場合はそれを使用
    if (typeof window !== 'undefined' && window.DOMPurify) {
        return window.DOMPurify;
    } else if (typeof require !== 'undefined') {
        // Node.js環境またはElectron環境では動的ロード
        try {
            let purifyModule = require('dompurify');
            // jsdomがない場合は作成
            if (typeof window === 'undefined') {
                const { JSDOM } = require('jsdom');
                const window = new JSDOM('').window;
                purifyModule = require('dompurify')(window);
            }
            return purifyModule;
        } catch (e) {
            console.warn('DOMPurify could not be loaded:', e);
            return null;
        }
    }
    return null;
}

/**
 * HTMLコンテンツを安全にサニタイズします
 * @param {string} content - サニタイズするHTMLコンテンツ
 * @param {Object} options - DOMPurifyのオプション
 * @returns {string} - サニタイズされたHTMLコンテンツ
 */
function sanitizeHTML(content, options = {}) {
    if (!content || typeof content !== 'string') {
        return '';
    }

    // DOMPurifyインスタンスを取得
    const purifyInstance = getDOMPurifyInstance();

    // DOMPurifyが利用可能な場合は使用
    if (purifyInstance && purifyInstance.sanitize) {
        const defaultOptions = {
            // 俳句・短歌で使用される可能性のあるタグを許可
            ALLOWED_TAGS: [
                'ruby', 'rt', 'rp',        // ルビ用
                'span', 'div', 'p',        // 基本的なテキスト要素
                'strong', 'em', 'b', 'i',  // 強調
                'br',                      // 改行
                'small', 'sup', 'sub'      // 縦中横、上付き、下付き
            ],
            ALLOWED_ATTR: [
                'class', 'id', 'style'     // 基本的な属性のみ
            ],
            // scriptタグと危険な属性を完全に除去
            FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
            FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
        };

        const mergedOptions = { ...defaultOptions, ...options };
        return purifyInstance.sanitize(content, mergedOptions);
    }

    // フォールバック: 基本的なサニタイズ処理
    return fallbackSanitize(content);
}

/**
 * DOMPurifyが利用できない場合のフォールバック関数
 * @param {string} content - サニタイズするHTMLコンテンツ
 * @returns {string} - サニタイズされたHTMLコンテンツ
 */
function fallbackSanitize(content) {
    // scriptタグを完全に除去
    // <script> タグを完全に除去するため、繰り返し適用
    let sanitized = content;
    let previous;
    do {
        previous = sanitized;
        sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, '');
    } while (sanitized !== previous);
    
    // 危険なjavascript:プロトコルを除去
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // 危険なイベントハンドラーを除去
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // 許可されたタグのみを保持
    const allowedTags = /^<\/?(?:ruby|rt|rp|span|div|p|strong|em|b|i|br|small|sup|sub)(?:\s[^>]*)?>$/i;
    
    sanitized = sanitized.replace(/<[^>]+>/g, (match) => {
        return allowedTags.test(match) ? match : '';
    });
    
    return sanitized;
}

/**
 * 要素のinnerHTMLを安全に設定します
 * @param {HTMLElement} element - 対象の要素
 * @param {string} content - 設定するHTMLコンテンツ
 * @param {Object} options - サニタイズオプション
 */
function safeSetHTML(element, content, options = {}) {
    if (!element) {
        console.warn('safeSetHTML: element is null or undefined');
        return;
    }
    
    const sanitizedContent = sanitizeHTML(content, options);
    element.innerHTML = sanitizedContent;
}

// グローバルに公開（ブラウザ環境）
if (typeof window !== 'undefined') {
    window.sanitizeHTML = sanitizeHTML;
    window.safeSetHTML = safeSetHTML;
}

// モジュールとして公開（Node.js環境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        safeSetHTML
    };
}
