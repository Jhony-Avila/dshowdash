const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.announce";
function announce(message, priority) {
  priority = priority || "polite";
  let announcer = document.getElementById("shell-announcer");
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "shell-announcer";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.style.cssText = "position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;";
    document.body.appendChild(announcer);
  }
  announcer.setAttribute("aria-live", priority);
  announcer.textContent = "";
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
  return { ok: true };
}
export {
  MODULE_ID,
  VERSION,
  announce
};
