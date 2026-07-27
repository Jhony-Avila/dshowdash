function openDrawer(container, { title, content, onClose, size = "medium" }) {
  const sizeClass = { small: "p18-w-300", medium: "p18-w-400", large: "p18-w-600" }[size] || "p18-w-400";
  const drawer = document.createElement("div");
  drawer.className = "p18-drawer";
  drawer.innerHTML = `
        <div class="p18-drawer-overlay"></div>
        <div class="p18-drawer-content ${sizeClass}">
            <div class="p18-drawer-header">
                <h4>${title}</h4>
                <button class="p18-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p18-drawer-body">${content}</div>
        </div>
    `;
  const close = () => {
    drawer.classList.remove("open");
    setTimeout(() => drawer.remove(), 300);
    onClose?.();
  };
  drawer.querySelector(".p18-drawer-close").addEventListener("click", close);
  drawer.querySelector(".p18-drawer-overlay").addEventListener("click", close);
  container.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add("open"));
  return { close };
}
var drawer_default = { openDrawer };
const MODULE_ID = "panel-18/ui/drawer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  openDrawer as DrawerComponent,
  MODULE_ID,
  VERSION,
  drawer_default as default,
  healthCheck,
  info,
  openDrawer
};
