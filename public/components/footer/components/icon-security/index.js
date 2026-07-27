const MODULE_ID = "footer/components/icon-security";
const VERSION = "1.0.0-ENTERPRISE";
class IconSecurity {
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
    this.element.className = "icon-security-component dsd-footer__icon-btn";
    this.element.title = "Seguran\xE7a";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:security");
    this.element.setAttribute("aria-label", "Seguran\xE7a");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
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
var icon_security_default = IconSecurity;
export {
  IconSecurity,
  MODULE_ID,
  VERSION,
  icon_security_default as default
};
