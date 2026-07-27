const VERSION = "2.1.0-AAA-P4";
const MODULE_ID = "canvas-port";
const CanvasPortContract = { create: "function", destroy: "function", getActive: "function" };
function createNullCanvasPort() {
  return { create: () => null, destroy: () => {
  }, getActive: () => null };
}
function createCanvasPort(deps = {}) {
  let _active = null;
  let _metrics = { created: 0, destroyed: 0 };
  return {
    create(container, options = {}) {
      try {
        const canvas = document.createElement("div");
        canvas.className = "main-canvas";
        canvas.setAttribute("data-canvas-id", String(options.id || "main"));
        container?.appendChild(canvas);
        _active = canvas;
        _metrics.created++;
        return canvas;
      } catch (e) {
        return null;
      }
    },
    destroy(canvas) {
      try {
        (canvas || _active)?.remove();
        _active = null;
        _metrics.destroyed++;
        return true;
      } catch (e) {
        return false;
      }
    },
    getActive() {
      return _active;
    },
    getMetrics() {
      return { ..._metrics };
    }
  };
}
function validateCanvasPort(port) {
  return port && typeof port.create === "function";
}
function healthCheck(port) {
  return { status: typeof port?.create === "function" ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { hasCreate: typeof port?.create === "function", hasDestroy: typeof port?.destroy === "function" } };
}
var CanvasPort_default = { CanvasPortContract, createNullCanvasPort, createCanvasPort, validateCanvasPort, healthCheck, VERSION, MODULE_ID };
export {
  CanvasPortContract,
  MODULE_ID,
  VERSION,
  createCanvasPort,
  createNullCanvasPort,
  CanvasPort_default as default,
  healthCheck,
  validateCanvasPort
};
