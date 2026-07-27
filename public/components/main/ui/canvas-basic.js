const VERSION = "2.1.0-AAA-P4";
const MODULE_ID = "canvas-basic";
let _metrics = { renders: 0, updates: 0, errors: 0 };
function createCanvas(container, options = {}) {
  try {
    const canvas = document.createElement("div");
    canvas.className = "main-canvas main-canvas--basic";
    canvas.setAttribute("data-canvas-id", String(options.id || "basic"));
    container?.appendChild(canvas);
    _metrics.renders++;
    return canvas;
  } catch (error) {
    _metrics.errors++;
    return null;
  }
}
function updateCanvas(canvas, content) {
  try {
    if (canvas) {
      canvas.innerHTML = content;
      _metrics.updates++;
      return true;
    }
    return false;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function destroyCanvas(canvas) {
  try {
    canvas?.remove();
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() };
}
function createCanvasBasic(container, options = {}) {
  const canvas = createCanvas(container, options);
  return {
    VERSION,
    MODULE_ID,
    element: canvas,
    update(content) {
      return updateCanvas(canvas, content);
    },
    destroy() {
      return destroyCanvas(canvas);
    },
    getElement() {
      return canvas;
    },
    getMetrics() {
      return getMetrics();
    },
    healthCheck() {
      return healthCheck();
    }
  };
}
var canvas_basic_default = { createCanvas, updateCanvas, destroyCanvas, createCanvasBasic, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createCanvas,
  createCanvasBasic,
  canvas_basic_default as default,
  destroyCanvas,
  getMetrics,
  healthCheck,
  updateCanvas
};
