const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "ticker:core:css-injector";
const CSS_PATH = "/components/ticker/component-enterprise.css";
const CSS_ID = "ticker-enterprise-css";
let _injected = false;
function injectTickerCSS() {
  if (typeof document === "undefined") return false;
  if (_injected) return true;
  if (document.getElementById(CSS_ID)) {
    _injected = true;
    return true;
  }
  const existing = document.querySelector(`link[href="${CSS_PATH}"]`);
  if (existing) {
    _injected = true;
    return true;
  }
  const link = document.createElement("link");
  link.id = CSS_ID;
  link.rel = "stylesheet";
  link.href = CSS_PATH;
  document.head.appendChild(link);
  _injected = true;
  return true;
}
function isInjected() {
  return _injected;
}
var css_injector_default = { injectTickerCSS, isInjected, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  css_injector_default as default,
  injectTickerCSS,
  isInjected
};
