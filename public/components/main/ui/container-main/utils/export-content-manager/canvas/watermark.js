const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.canvas.watermark";
function addWatermark(canvas, watermark) {
  if (!watermark || !watermark.text) return canvas;
  const ctx = canvas.getContext("2d");
  const { text, position = "bottom-right", opacity = 0.5, fontSize = 14 } = watermark;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#666666";
  const metrics = ctx.measureText(text);
  const padding = 10;
  let x, y;
  switch (position) {
    case "top-left":
      x = padding;
      y = fontSize + padding;
      break;
    case "top-right":
      x = canvas.width - metrics.width - padding;
      y = fontSize + padding;
      break;
    case "bottom-left":
      x = padding;
      y = canvas.height - padding;
      break;
    case "bottom-right":
    default:
      x = canvas.width - metrics.width - padding;
      y = canvas.height - padding;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
  return canvas;
}
export {
  MODULE_ID,
  VERSION,
  addWatermark
};
