const VERSION = "0.1.0-TRACK-D";
const MODULE_ID = "app-shell.responsive-adapter.mobile-marker";
const FLAG = "as6.mobile_shell";
const LS_KEY = "dshow.shell.flags.v1";
const W_MOBILE_MAX = 768;
const H_LANDSCAPE_MAX = 520;
function isMobileShellEnabled() {
  try {
    if (typeof localStorage !== "undefined") {
      const local = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (FLAG in local) return local[FLAG] === true;
    }
    const g = globalThis;
    const snap = g.__DSHOW_FLAGS__ || g.DshowFlags?.snapshot;
    if (snap && typeof snap === "object" && FLAG in snap) return snap[FLAG] === true;
  } catch {
  }
  return false;
}
function computeViewport(w, h) {
  const orientation = h >= w ? "portrait" : "landscape";
  let viewport = "xxl";
  if (w <= 575) viewport = "xs";
  else if (w <= 767) viewport = "sm";
  else if (w <= 991) viewport = "md";
  else if (w <= 1199) viewport = "lg";
  else if (w <= 1399) viewport = "xl";
  const mobile = w <= W_MOBILE_MAX || orientation === "landscape" && h <= H_LANDSCAPE_MAX;
  return { mobile, viewport, orientation, w, h };
}
function shellRoot() {
  try {
    return document.getElementById("app-shell");
  } catch {
    return null;
  }
}
function applyMobileMarker() {
  const root = shellRoot();
  if (!root) return;
  if (!isMobileShellEnabled()) {
    root.removeAttribute("data-mobile");
    root.removeAttribute("data-viewport");
    root.removeAttribute("data-orientation");
    return;
  }
  const w = window.innerWidth || document.documentElement.clientWidth || 0;
  const h = window.innerHeight || document.documentElement.clientHeight || 0;
  const info = computeViewport(w, h);
  if (info.mobile) root.setAttribute("data-mobile", "1");
  else root.removeAttribute("data-mobile");
  root.setAttribute("data-viewport", info.viewport);
  root.setAttribute("data-orientation", info.orientation);
  try {
    void import("./mobile-shell.js").then((m) => {
      if (info.mobile) m.enhanceMobileShell();
      else m.teardownMobileShell();
    }).catch(() => {
    });
  } catch {
  }
}
let _wired = false;
let _handler = null;
let _mo = null;
let _timers = [];
let _pending = false;
let _hardStop = null;
function estaMontado() {
  try {
    const root = shellRoot();
    if (!root || root.getAttribute("data-mobile") == null) return false;
    return !!document.querySelector(".avst6-hdr-menu") && !!document.querySelector(".avst6-bottomnav");
  } catch {
    return false;
  }
}
function pararCuradores() {
  if (_mo) {
    try {
      _mo.disconnect();
    } catch {
    }
    _mo = null;
  }
  _timers.forEach((t) => clearTimeout(t));
  _timers = [];
  if (_hardStop) {
    clearTimeout(_hardStop);
    _hardStop = null;
  }
}
function curar() {
  applyMobileMarker();
  if (!isMobileShellEnabled()) pararCuradores();
}
function initMobileMarker() {
  if (_wired) return;
  applyMobileMarker();
  if (!isMobileShellEnabled()) return;
  _wired = true;
  _handler = () => applyMobileMarker();
  window.addEventListener("resize", _handler, { passive: true });
  window.addEventListener("orientationchange", _handler, { passive: true });
  const agenda = () => {
    if (_pending) return;
    _pending = true;
    setTimeout(() => {
      _pending = false;
      curar();
    }, 120);
  };
  try {
    _mo = new MutationObserver(agenda);
    _mo.observe(document.documentElement || document, { childList: true, subtree: true });
  } catch {
  }
  [0, 150, 400, 900, 1800, 3500].forEach((ms) => _timers.push(setTimeout(curar, ms)));
  try {
    window.addEventListener("load", curar, { once: true });
  } catch {
  }
  try {
    document.addEventListener("shell:ready", curar, { once: true });
  } catch {
  }
  _hardStop = setTimeout(pararCuradores, 16e3);
}
function teardownMobileMarker() {
  pararCuradores();
  if (_handler) {
    window.removeEventListener("resize", _handler);
    window.removeEventListener("orientationchange", _handler);
    _handler = null;
  }
  _wired = false;
}
var mobile_marker_default = { isMobileShellEnabled, computeViewport, applyMobileMarker, initMobileMarker, teardownMobileMarker };
export {
  MODULE_ID,
  VERSION,
  applyMobileMarker,
  computeViewport,
  mobile_marker_default as default,
  initMobileMarker,
  isMobileShellEnabled,
  teardownMobileMarker
};
