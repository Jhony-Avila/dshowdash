import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:share-manager";
const SHARE_TARGETS = Object.freeze({
  NATIVE: "native",
  CLIPBOARD: "clipboard",
  TWITTER: "twitter",
  FACEBOOK: "facebook",
  LINKEDIN: "linkedin",
  WHATSAPP: "whatsapp",
  TELEGRAM: "telegram",
  EMAIL: "email"
});
function createShareManager(options = {}) {
  const { fallbackToClipboard = true, onShare = null, onError = null } = options;
  const _logger = createLogger(MODULE_ID);
  let _metrics = { shares: 0, nativeShares: 0, fallbackShares: 0, errors: 0 };
  function _buildShareUrl(target, data) {
    const { url = window.location.href, title = document.title, text = "" } = data;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);
    switch (target) {
      case SHARE_TARGETS.TWITTER:
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      case SHARE_TARGETS.FACEBOOK:
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case SHARE_TARGETS.LINKEDIN:
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case SHARE_TARGETS.WHATSAPP:
        return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      case SHARE_TARGETS.TELEGRAM:
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      case SHARE_TARGETS.EMAIL:
        return `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
      default:
        return null;
    }
  }
  const manager = {
    isSupported() {
      return "share" in navigator;
    },
    canShareFiles() {
      return "canShare" in navigator;
    },
    canShare(data) {
      if (!navigator.canShare) return this.isSupported();
      try {
        return navigator.canShare(data);
      } catch {
        return false;
      }
    },
    async share(data = {}) {
      const { url = window.location.href, title = document.title, text = "", files = null } = data;
      _metrics.shares++;
      if (this.isSupported()) {
        try {
          const shareData = { url, title, text };
          if (files && this.canShare({ files })) shareData.files = files;
          await navigator.share(shareData);
          _metrics.nativeShares++;
          onShare?.({ target: SHARE_TARGETS.NATIVE, data: shareData });
          return { success: true, target: SHARE_TARGETS.NATIVE };
        } catch (e) {
          if (e.name === "AbortError") {
            return { success: false, target: SHARE_TARGETS.NATIVE, cancelled: true };
          }
          _logger.warn("Native share failed:", e);
        }
      }
      if (fallbackToClipboard) {
        try {
          const shareText = text ? `${text}
${url}` : url;
          await navigator.clipboard.writeText(shareText);
          _metrics.fallbackShares++;
          onShare?.({ target: SHARE_TARGETS.CLIPBOARD, data: { text: shareText } });
          return { success: true, target: SHARE_TARGETS.CLIPBOARD, copied: true };
        } catch (e) {
          _metrics.errors++;
          onError?.(e);
          return { success: false, error: e.message };
        }
      }
      _metrics.errors++;
      return { success: false, error: "Share not supported" };
    },
    shareTo(target, data = {}) {
      const { url = window.location.href, title = document.title, text = "" } = data;
      _metrics.shares++;
      if (target === SHARE_TARGETS.NATIVE) {
        return this.share(data);
      }
      if (target === SHARE_TARGETS.CLIPBOARD) {
        return navigator.clipboard.writeText(text ? `${text}
${url}` : url).then(() => {
          _metrics.fallbackShares++;
          onShare?.({ target, data });
          return { success: true, target };
        }).catch((e) => {
          _metrics.errors++;
          onError?.(e);
          return { success: false, error: e.message };
        });
      }
      const shareUrl = _buildShareUrl(target, data);
      if (shareUrl) {
        window.open(shareUrl, "_blank", "width=600,height=400,noopener,noreferrer");
        onShare?.({ target, data, url: shareUrl });
        return Promise.resolve({ success: true, target, url: shareUrl });
      }
      _metrics.errors++;
      return Promise.resolve({ success: false, error: "Unknown share target" });
    },
    async shareImage(imageBlob, data = {}) {
      if (!this.canShareFiles()) {
        return { success: false, error: "File sharing not supported" };
      }
      const file = new File([imageBlob], data.filename || "image.png", { type: imageBlob.type || "image/png" });
      return this.share({ ...data, files: [file] });
    },
    getShareUrl(target, data = {}) {
      return _buildShareUrl(target, data);
    },
    getAvailableTargets() {
      const targets = [SHARE_TARGETS.CLIPBOARD, SHARE_TARGETS.TWITTER, SHARE_TARGETS.FACEBOOK, SHARE_TARGETS.LINKEDIN, SHARE_TARGETS.WHATSAPP, SHARE_TARGETS.TELEGRAM, SHARE_TARGETS.EMAIL];
      if (this.isSupported()) targets.unshift(SHARE_TARGETS.NATIVE);
      return targets;
    },
    getMetrics() {
      return { ..._metrics, supported: this.isSupported(), canShareFiles: this.canShareFiles() };
    },
    resetMetrics() {
      _metrics = { shares: 0, nativeShares: 0, fallbackShares: 0, errors: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), canShareFiles: this.canShareFiles(), metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), targets: Object.keys(SHARE_TARGETS) };
    },
    destroy() {
    }
  };
  return manager;
}
let _instance = null;
function getShareManager(options = {}) {
  if (!_instance) _instance = createShareManager(options);
  return _instance;
}
function resetShareManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
async function share(data) {
  return getShareManager().share(data);
}
async function shareTo(target, data) {
  return getShareManager().shareTo(target, data);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, targets: Object.keys(SHARE_TARGETS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var share_manager_default = { VERSION, MODULE_ID, SHARE_TARGETS, createShareManager, getShareManager, resetShareManager, share, shareTo, info, healthCheck };
export {
  MODULE_ID,
  SHARE_TARGETS,
  VERSION,
  createShareManager,
  share_manager_default as default,
  getShareManager,
  healthCheck,
  info,
  resetShareManager,
  share,
  shareTo
};
