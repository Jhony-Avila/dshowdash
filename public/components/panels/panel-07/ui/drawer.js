function openDrawer(container, { title, content, onClose }) {
  const drawer = document.createElement("div");
  drawer.className = "p07-drawer";
  drawer.innerHTML = `
        <div class="p07-drawer-overlay"></div>
        <div class="p07-drawer-content">
            <div class="p07-drawer-header">
                <h4>${title}</h4>
                <button class="p07-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p07-drawer-body">${content}</div>
        </div>
    `;
  const close = () => {
    drawer.classList.remove("open");
    setTimeout(() => drawer.remove(), 300);
    onClose?.();
  };
  drawer.querySelector(".p07-drawer-close").addEventListener("click", close);
  drawer.querySelector(".p07-drawer-overlay").addEventListener("click", close);
  container.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add("open"));
  return { close };
}
var drawer_default = { openDrawer };
const DrawerComponent = { openDrawer };
const MODULE_ID = "panel-07/ui/drawer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  DrawerComponent,
  MODULE_ID,
  VERSION,
  drawer_default as default,
  healthCheck,
  info,
  openDrawer
};
