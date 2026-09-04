const FLAG = "as6.mobile_shell";
const STORE = "dshow.shell.flags.v1";
function flagOn() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return false;
    const f = JSON.parse(raw);
    return !!(f && f[FLAG] === true);
  } catch {
    return false;
  }
}
let _booted = false;
async function activate() {
  if (_booted) return;
  if (!flagOn()) return;
  _booted = true;
  try {
    const mk = await import("./mobile-marker.js");
    mk.initMobileMarker();
  } catch (e) {
    _booted = false;
    try {
      console.error("[mobile-boot] init falhou:", e);
    } catch {
    }
  }
}
async function deactivate() {
  if (!_booted) return;
  _booted = false;
  try {
    const mk = await import("./mobile-marker.js");
    mk.teardownMobileMarker && mk.teardownMobileMarker();
  } catch {
  }
  try {
    const sh = await import("./mobile-shell.js");
    sh.teardownMobileShell && sh.teardownMobileShell();
  } catch {
  }
  try {
    var el = document.getElementById("app-shell");
    if (el) el.removeAttribute("data-mobile");
  } catch {
  }
}
function isActive() {
  return _booted;
}
if (typeof document !== "undefined") {
  const run = () => {
    void activate();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  try {
    window.__mobileBoot = { activate, deactivate, isActive };
  } catch {
  }
}
var mobile_boot_default = { activate, deactivate, isActive };
export {
  activate,
  deactivate,
  mobile_boot_default as default,
  isActive
};
