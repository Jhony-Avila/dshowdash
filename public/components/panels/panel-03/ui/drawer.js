function openDrawer(container, { title, content, onClose, position = "right" }) {
  const drawer = document.createElement("div");
  drawer.className = `p03-drawer p03-drawer-${position}`;
  drawer.innerHTML = `
        <div class="p03-drawer-overlay"></div>
        <div class="p03-drawer-content">
            <div class="p03-drawer-header">
                <h4>${title}</h4>
                <button class="p03-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p03-drawer-body">${content}</div>
        </div>
    `;
  const close = () => {
    drawer.classList.remove("open");
    setTimeout(() => drawer.remove(), 300);
    onClose?.();
  };
  drawer.querySelector(".p03-drawer-close").addEventListener("click", close);
  drawer.querySelector(".p03-drawer-overlay").addEventListener("click", close);
  container.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add("open"));
  return { close };
}
var drawer_default = { openDrawer };
const MODULE_ID = "panel-03/ui/drawer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  drawer_default as default,
  healthCheck,
  info,
  openDrawer
};
