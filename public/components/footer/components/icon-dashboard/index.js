const MODULE_ID = "footer/components/icon-dashboard";
const VERSION = "1.0.0-ENTERPRISE";
class IconDashboard {
  constructor(container, options = {}) {
    this.container = container;
    this.element = null;
    this.mounted = false;
    this._metrics = { mountCount: 0, lastMountAt: null };
  }
  async mount() {
    if (this.mounted) return;
    this.render();
    this.mounted = true;
    this._metrics.mountCount++;
    this._metrics.lastMountAt = Date.now();
  }
  render() {
    this.element = document.createElement("button");
    this.element.className = "icon-dashboard-component dsd-footer__icon-btn";
    this.element.title = "Dashboard";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:dashboard");
    this.element.setAttribute("aria-label", "Dashboard");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
    this.container.appendChild(this.element);
  }
  async unmount() {
    if (!this.mounted) return;
    this.element?.remove();
    this.mounted = false;
  }
  healthCheck() {
    return { status: "healthy", mounted: this.mounted, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, metrics: this._metrics };
  }
}
var icon_dashboard_default = IconDashboard;
export {
  IconDashboard,
  MODULE_ID,
  VERSION,
  icon_dashboard_default as default
};
