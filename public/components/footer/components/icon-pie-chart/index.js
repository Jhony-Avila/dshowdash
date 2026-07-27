const MODULE_ID = "footer/components/icon-pie-chart";
const VERSION = "1.0.0-ENTERPRISE";
class IconPieChart {
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
    this.element.className = "icon-pie-chart-component dsd-footer__icon-btn";
    this.element.title = "Gr\xE1ficos";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:pie-chart");
    this.element.setAttribute("aria-label", "Gr\xE1ficos");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>`;
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
var icon_pie_chart_default = IconPieChart;
export {
  IconPieChart,
  MODULE_ID,
  VERSION,
  icon_pie_chart_default as default
};
