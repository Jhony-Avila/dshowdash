const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.operations.page-breaks";
function addPageBreak(element) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return false;
  el.classList.add("dsd-print-page-break");
  return true;
}
function removePageBreaks(container = null) {
  const scope = container ? typeof container === "string" ? document.querySelector(container) : container : document;
  if (!scope) return;
  scope.querySelectorAll(".dsd-print-page-break").forEach((el) => {
    el.classList.remove("dsd-print-page-break");
  });
}
function markAvoidBreak(element) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return false;
  el.classList.add("dsd-print-avoid-break");
  return true;
}
function markKeepTogether(element) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return false;
  el.classList.add("dsd-print-keep-together");
  return true;
}
export {
  MODULE_ID,
  VERSION,
  addPageBreak,
  markAvoidBreak,
  markKeepTogether,
  removePageBreaks
};
