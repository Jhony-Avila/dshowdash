const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.image-virtualizer.core.format-detector";
const _formatSupport = {
  webp: false,
  avif: false
};
let _detected = false;
function detectFormatSupport() {
  if (_detected) return { ..._formatSupport };
  try {
    const webpCanvas = document.createElement("canvas");
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    _formatSupport.webp = webpCanvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch (e) {
    _formatSupport.webp = false;
  }
  try {
    if (typeof createImageBitmap !== "undefined") {
      _formatSupport.avif = CSS.supports("background-image", 'url("data:image/avif,")') || navigator.userAgent.includes("Chrome/") && parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || "0") >= 85;
    }
  } catch (e) {
    _formatSupport.avif = false;
  }
  _detected = true;
  return { ..._formatSupport };
}
function getFormatSupport() {
  return { ..._formatSupport };
}
function supportsWebP() {
  return _formatSupport.webp;
}
function supportsAvif() {
  return _formatSupport.avif;
}
var format_detector_default = { detectFormatSupport, getFormatSupport, supportsWebP, supportsAvif };
export {
  MODULE_ID,
  VERSION,
  format_detector_default as default,
  detectFormatSupport,
  getFormatSupport,
  supportsAvif,
  supportsWebP
};
