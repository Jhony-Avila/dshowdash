const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "sw-controller-registration";
let _registration = null;
async function register(swPath = "/sw.js") {
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "not-supported" };
  try {
    _registration = await navigator.serviceWorker.register(swPath);
    return { ok: true, registration: _registration };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
function unregister() {
  if (!_registration) return Promise.resolve(false);
  return _registration.unregister();
}
function getRegistration() {
  return _registration;
}
function healthCheck() {
  const checks = { swSupported: "serviceWorker" in navigator, hasRegistration: !!_registration };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasRegistration: !!_registration, timestamp: Date.now() };
}
var registration_default = { register, unregister, getRegistration, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  registration_default as default,
  getRegistration,
  healthCheck,
  info,
  register,
  unregister
};
