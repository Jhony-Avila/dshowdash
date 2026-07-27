const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.aria.helpers";
function setAriaLabel(element, label) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (el) el.setAttribute("aria-label", label);
}
function setAriaDescribedBy(element, describedById) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (el) el.setAttribute("aria-describedby", describedById);
}
function setAriaLive(element, value) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (el) el.setAttribute("aria-live", value);
}
function setRole(element, role) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (el) el.setAttribute("role", role);
}
function markAsLandmark(element, landmark, label = null) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return;
  el.setAttribute("role", landmark);
  if (label) el.setAttribute("aria-label", label);
}
export {
  MODULE_ID,
  VERSION,
  markAsLandmark,
  setAriaDescribedBy,
  setAriaLabel,
  setAriaLive,
  setRole
};
