import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:clipboard-manager";
function createClipboardManager(options = {}) {
  const { onCopy = null, onPaste = null, onError = null, showNotification = true } = options;
  const _logger = createLogger(MODULE_ID);
  let _metrics = { copies: 0, pastes: 0, errors: 0 };
  let _history = [];
  const _maxHistory = 50;
  function _fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch (e) {
      document.body.removeChild(textarea);
      throw e;
    }
  }
  const manager = {
    // Copia texto
    async copy(text, options2 = {}) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          _fallbackCopy(text);
        }
        _metrics.copies++;
        _history.unshift({ type: "text", content: text.substring(0, 100), timestamp: Date.now() });
        if (_history.length > _maxHistory) _history.pop();
        onCopy?.(text);
        if (showNotification && options2.notify !== false) {
          _logger.debug("Copied to clipboard");
        }
        return true;
      } catch (e) {
        _metrics.errors++;
        _logger.error("Copy failed:", e);
        onError?.(e, "copy");
        return false;
      }
    },
    // Copia HTML
    async copyHtml(html, plainText = "") {
      try {
        if (navigator.clipboard?.write) {
          const blob = new Blob([html], { type: "text/html" });
          const textBlob = new Blob([plainText || html.replace(/<[^>]*>/g, "")], { type: "text/plain" });
          await navigator.clipboard.write([new ClipboardItem({ "text/html": blob, "text/plain": textBlob })]);
        } else {
          return this.copy(plainText || html.replace(/<[^>]*>/g, ""));
        }
        _metrics.copies++;
        return true;
      } catch (e) {
        _metrics.errors++;
        onError?.(e, "copyHtml");
        return false;
      }
    },
    // Copia imagem
    async copyImage(imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        if (navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          _metrics.copies++;
          return true;
        }
        throw new Error("Clipboard API not supported");
      } catch (e) {
        _metrics.errors++;
        onError?.(e, "copyImage");
        return false;
      }
    },
    // Cola texto
    async paste() {
      try {
        let text;
        if (navigator.clipboard?.readText) {
          text = await navigator.clipboard.readText();
        } else {
          throw new Error("Paste not supported");
        }
        _metrics.pastes++;
        onPaste?.(text);
        return text;
      } catch (e) {
        _metrics.errors++;
        onError?.(e, "paste");
        return null;
      }
    },
    // Lê conteúdo misto
    async read() {
      try {
        if (navigator.clipboard?.read) {
          const items = await navigator.clipboard.read();
          const result = { text: null, html: null, image: null };
          for (const item of items) {
            if (item.types.includes("text/plain")) {
              result.text = await (await item.getType("text/plain")).text();
            }
            if (item.types.includes("text/html")) {
              result.html = await (await item.getType("text/html")).text();
            }
            for (const type of item.types) {
              if (type.startsWith("image/")) {
                result.image = await item.getType(type);
                break;
              }
            }
          }
          return result;
        }
        return { text: await this.paste(), html: null, image: null };
      } catch (e) {
        _metrics.errors++;
        return { text: null, html: null, image: null };
      }
    },
    // Copia de elemento
    async copyFromElement(element, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return false;
      const text = options2.html ? element.innerHTML : element.textContent || element.value;
      return options2.html ? this.copyHtml(element.innerHTML, element.textContent) : this.copy(text, options2);
    },
    // Histórico
    getHistory() {
      return [..._history];
    },
    clearHistory() {
      _history = [];
    },
    // Verifica suporte
    isSupported() {
      return !!(navigator.clipboard || document.execCommand);
    },
    hasWritePermission: async () => {
      try {
        const permission = await navigator.permissions?.query({ name: "clipboard-write" });
        return permission?.state === "granted";
      } catch {
        return true;
      }
    },
    hasReadPermission: async () => {
      try {
        const permission = await navigator.permissions?.query({ name: "clipboard-read" });
        return permission?.state === "granted";
      } catch {
        return false;
      }
    },
    getMetrics() {
      return { ..._metrics };
    },
    resetMetrics() {
      _metrics = { copies: 0, pastes: 0, errors: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), historySize: _history.length };
    }
  };
  return manager;
}
let _instance = null;
function getClipboardManager(options = {}) {
  if (!_instance) _instance = createClipboardManager(options);
  return _instance;
}
function resetClipboardManager() {
  _instance = null;
}
async function copyText(text) {
  return getClipboardManager().copy(text);
}
async function pasteText() {
  return getClipboardManager().paste();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var clipboard_manager_default = { VERSION, MODULE_ID, createClipboardManager, getClipboardManager, resetClipboardManager, copyText, pasteText, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  copyText,
  createClipboardManager,
  clipboard_manager_default as default,
  getClipboardManager,
  healthCheck,
  info,
  pasteText,
  resetClipboardManager
};
