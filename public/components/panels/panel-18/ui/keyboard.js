const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-18/ui/keyboard";
function KeyboardNavigation(container, options) {
  options = options || {};
  this.container = container;
  this.onRowSelect = options.onRowSelect || (() => {
  });
  this.onRowActivate = options.onRowActivate || (() => {
  });
  this.currentIndex = -1;
  this._keyHandler = null;
  this.enabled = true;
}
KeyboardNavigation.prototype.init = function() {
  const self = this;
  self._keyHandler = (e) => {
    if (!self.enabled) return;
    const tbody = self.container.querySelector(".p18-tbody");
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll("tr[data-job-id]"));
    if (!rows.length) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        self.navigate(rows, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        self.navigate(rows, -1);
        break;
      case "Enter":
        e.preventDefault();
        if (self.currentIndex >= 0 && rows[self.currentIndex]) self.onRowActivate(rows[self.currentIndex]);
        break;
      case "Escape":
        self.clearSelection(rows);
        break;
      case "Home":
        e.preventDefault();
        self.goTo(rows, 0);
        break;
      case "End":
        e.preventDefault();
        self.goTo(rows, rows.length - 1);
        break;
    }
  };
  self.container.setAttribute("tabindex", "0");
  self.container.addEventListener("keydown", self._keyHandler);
};
KeyboardNavigation.prototype.navigate = function(rows, direction) {
  const newIndex = this.currentIndex + direction;
  if (newIndex >= 0 && newIndex < rows.length) this.goTo(rows, newIndex);
};
KeyboardNavigation.prototype.goTo = function(rows, index) {
  rows.forEach((r) => r.classList.remove("p18-row-selected"));
  this.currentIndex = index;
  const row = rows[index];
  if (row) {
    row.classList.add("p18-row-selected");
    row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    this.onRowSelect(row);
  }
};
KeyboardNavigation.prototype.clearSelection = function(rows) {
  rows.forEach((r) => r.classList.remove("p18-row-selected"));
  this.currentIndex = -1;
};
KeyboardNavigation.prototype.reset = function() {
  this.currentIndex = -1;
};
KeyboardNavigation.prototype.destroy = function() {
  if (this._keyHandler) this.container.removeEventListener("keydown", this._keyHandler);
  this.container.removeAttribute("tabindex");
};
KeyboardNavigation.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
KeyboardNavigation.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { enabled: this.enabled, currentIndex: this.currentIndex } };
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var keyboard_default = KeyboardNavigation;
export {
  KeyboardNavigation,
  MODULE_ID,
  VERSION,
  keyboard_default as default,
  healthCheck,
  info
};
