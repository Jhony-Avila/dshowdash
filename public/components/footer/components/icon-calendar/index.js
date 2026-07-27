const MODULE_ID = "footer/components/icon-calendar";
const VERSION = "1.0.0-ENTERPRISE";
class IconCalendar {
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
    this.element.className = "icon-calendar-component dsd-footer__icon-btn";
    this.element.title = "Calendar";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:calendar");
    this.element.setAttribute("aria-label", "Calendar");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
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
var icon_calendar_default = IconCalendar;
export {
  IconCalendar,
  MODULE_ID,
  VERSION,
  icon_calendar_default as default
};
