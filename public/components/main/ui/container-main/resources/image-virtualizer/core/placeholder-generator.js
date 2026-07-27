import { DEFAULT_CONFIG } from "../config/constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.image-virtualizer.core.placeholder-generator";
function generatePlaceholder(width, height, color = DEFAULT_CONFIG.placeholderColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${color}" width="100%" height="100%"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
function generateBlurPlaceholder(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(width, 20);
  canvas.height = Math.min(height, 20);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#e0e0e0");
  gradient.addColorStop(1, "#f5f5f5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.1);
}
function generateColorPlaceholder(width, height, color) {
  return generatePlaceholder(width, height, color);
}
var placeholder_generator_default = { generatePlaceholder, generateBlurPlaceholder, generateColorPlaceholder };
export {
  MODULE_ID,
  VERSION,
  placeholder_generator_default as default,
  generateBlurPlaceholder,
  generateColorPlaceholder,
  generatePlaceholder
};
