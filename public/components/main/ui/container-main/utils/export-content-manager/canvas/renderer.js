import { getConfig } from "../state.js";
import { log } from "../helpers/logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.canvas.renderer";
async function elementToCanvasFallback(element, canvas, ctx, width, height) {
  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${element.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render element to canvas"));
    };
    img.src = url;
  });
}
async function elementToCanvas(element, options = {}) {
  const config = getConfig();
  const scale = options.scale || config.scale;
  const backgroundColor = options.backgroundColor ?? config.backgroundColor;
  const rect = element.getBoundingClientRect();
  const width = options.maxWidth ? Math.min(rect.width, options.maxWidth) : rect.width;
  const height = options.maxHeight ? Math.min(rect.height, options.maxHeight) : rect.height;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }
  if (typeof html2canvas !== "undefined") {
    try {
      const renderedCanvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width,
        height,
        onclone: (doc, clonedElement) => {
          config.excludeSelectors.forEach((selector) => {
            clonedElement.querySelectorAll(selector).forEach((el) => el.remove());
          });
        }
      });
      return renderedCanvas;
    } catch (e) {
      log("warn", "html2canvas failed, using fallback:", e.message);
    }
  }
  return elementToCanvasFallback(element, canvas, ctx, width, height);
}
export {
  MODULE_ID,
  VERSION,
  elementToCanvas,
  elementToCanvasFallback
};
