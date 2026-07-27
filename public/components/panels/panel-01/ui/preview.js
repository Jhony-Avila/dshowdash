const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/preview";
class PreviewManager {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onClose = options.onClose || (() => {
    });
    this._overlay = null;
    this._content = null;
    this._abortController = null;
  }
  _escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  _sanitizeUrl(url) {
    try {
      const u = new URL(url, window.location.origin);
      if (["http:", "https:", "blob:"].includes(u.protocol)) return u.href;
      return "";
    } catch (_) {
      return "";
    }
  }
  canPreview(file) {
    const fileStr = typeof file === "string" ? file : file.name || "";
    const ext = fileStr.split(".").pop()?.toLowerCase() || "";
    return ["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  }
  getFileType(file) {
    const fileStr = typeof file === "string" ? file : file.name || "";
    const ext = fileStr.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "unknown";
  }
  show(fileUrl, fileName) {
    this.close();
    const type = this.getFileType(fileName || fileUrl);
    const safeName = this._escapeHtml(fileName || "Visualizacao");
    const safeUrl = this._sanitizeUrl(fileUrl);
    this._overlay = document.createElement("div");
    this._overlay.className = "p01-preview-overlay";
    this._overlay.innerHTML = `<div class="p01-preview-header"><span class="p01-preview-title">${safeName}</span><div class="p01-preview-actions"><a href="${safeUrl}" download class="p01-btn p01-btn--secondary p01-btn--sm">Download</a><button class="p01-btn p01-btn--ghost p01-btn--sm" data-action="close">&times;</button></div></div><div class="p01-preview-content"></div>`;
    this._content = this._overlay.querySelector(".p01-preview-content");
    if (type === "image") {
      this._content.innerHTML = `<img src="${safeUrl}" alt="${safeName}" class="p01-preview-image">`;
    } else if (type === "pdf") {
      this._content.innerHTML = `<iframe src="${safeUrl}" class="p01-preview-pdf"></iframe>`;
    } else {
      this._content.innerHTML = `<div class="p01-preview-unsupported"><p>Preview nao disponivel</p><a href="${safeUrl}" download class="p01-btn p01-btn--primary">Baixar arquivo</a></div>`;
    }
    this._overlay.querySelector('[data-action="close"]').addEventListener("click", () => this.close());
    this._overlay.addEventListener("click", (e) => {
      if (e.target === this._overlay) this.close();
    });
    this._abortController = new AbortController();
    this._onKeyDown = (e) => {
      if (e.key === "Escape") this.close();
    };
    document.addEventListener("keydown", this._onKeyDown, { signal: this._abortController.signal });
    this.container.appendChild(this._overlay);
    requestAnimationFrame(() => this._overlay.classList.add("open"));
  }
  close() {
    if (this._overlay) {
      this._overlay.classList.remove("open");
      setTimeout(() => {
        this._overlay.remove();
        this._overlay = null;
      }, 200);
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
      this._onKeyDown = null;
    }
    this.onClose();
  }
  isOpen() {
    return this._overlay !== null;
  }
}
function createPreviewManager(options = {}) {
  return new PreviewManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var preview_default = { PreviewManager, createPreviewManager };
export {
  MODULE_ID,
  PreviewManager,
  VERSION,
  createPreviewManager,
  preview_default as default,
  healthCheck,
  info
};
