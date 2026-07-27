function openDrawer(container, { title, content, onClose, width = "400px" }) {
  const drawer = document.createElement("div");
  drawer.className = "p02-drawer";
  drawer.innerHTML = `
        <div class="p02-drawer-overlay"></div>
        <div class="p02-drawer-content" style="width: ${width}">
            <div class="p02-drawer-header">
                <h4>${title}</h4>
                <button class="p02-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p02-drawer-body">${content}</div>
        </div>
    `;
  const close = () => {
    drawer.classList.remove("open");
    setTimeout(() => drawer.remove(), 300);
    onClose?.();
  };
  drawer.querySelector(".p02-drawer-close").addEventListener("click", close);
  drawer.querySelector(".p02-drawer-overlay").addEventListener("click", close);
  container.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add("open"));
  return { close };
}
var drawer_default = { openDrawer };
class DrawerComponent {
  _logger;
  _options;
  _currentDrawer = null;
  _container = null;
  constructor(logger, options = {}) {
    this._logger = logger;
    this._options = options;
  }
  open(job, container) {
    const target = container || this._container || document.body;
    this._currentDrawer?.close();
    const title = String(job.job_name || job.name || `Job ${job.id}`);
    const content = `<pre style="white-space:pre-wrap;font-size:0.85em">${JSON.stringify(job, null, 2)}</pre>`;
    this._currentDrawer = openDrawer(target, {
      title,
      content,
      onClose: () => {
        this._currentDrawer = null;
      }
    });
    this._logger?.debug?.("drawer.open", { jobId: job.id });
  }
  destroy() {
    this._currentDrawer?.close();
    this._currentDrawer = null;
    this._logger?.debug?.("drawer.destroy");
  }
}
const MODULE_ID = "panel-02/ui/drawer";
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
