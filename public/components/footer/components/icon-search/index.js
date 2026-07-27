const MODULE_ID = "footer/components/icon-search";
const VERSION = "1.0.0-ENTERPRISE";
class IconSearch {
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
    this.element.className = "icon-search-component dsd-footer__icon-btn";
    this.element.title = "Busca";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:search");
    this.element.setAttribute("aria-label", "Busca");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
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
var icon_search_default = IconSearch;
export {
  IconSearch,
  MODULE_ID,
  VERSION,
  icon_search_default as default
};
