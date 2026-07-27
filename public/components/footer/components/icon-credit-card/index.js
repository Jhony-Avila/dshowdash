const MODULE_ID = "footer/components/icon-credit-card";
const VERSION = "1.0.0-ENTERPRISE";
class IconCreditCard {
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
    this.element.className = "icon-credit-card-component dsd-footer__icon-btn";
    this.element.title = "Credit Card";
    this.element.setAttribute("data-uarps-trigger", "trigger:footer:credit-card");
    this.element.setAttribute("aria-label", "Credit Card");
    this.element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
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
var icon_credit_card_default = IconCreditCard;
export {
  IconCreditCard,
  MODULE_ID,
  VERSION,
  icon_credit_card_default as default
};
