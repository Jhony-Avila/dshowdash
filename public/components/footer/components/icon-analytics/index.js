const MODULE_ID = "footer/components/icon-analytics";
const VERSION = "1.0.0-ENTERPRISE";
class IconAnalytics {
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
    this.element.className = "icon-analytics-component dsd-footer__icon-btn";
    this.element.title = "Analytics";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:analytics");
    this.element.setAttribute("aria-label", "Analytics");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
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
var icon_analytics_default = IconAnalytics;
export {
  IconAnalytics,
  MODULE_ID,
  VERSION,
  icon_analytics_default as default
};
