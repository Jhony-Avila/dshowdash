const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.effects.pip";
function createPiPMode(container) {
  let _isPiP = false;
  let _position = "bottom-right";
  let _originalStyles = null;
  const POSITIONS = ["top-left", "top-right", "bottom-left", "bottom-right"];
  function _saveDimensions() {
    if (!container) return;
    _originalStyles = {
      position: container.style.position,
      top: container.style.top,
      left: container.style.left,
      right: container.style.right,
      bottom: container.style.bottom,
      width: container.style.width,
      height: container.style.height,
      zIndex: container.style.zIndex
    };
  }
  function _restoreDimensions() {
    if (!container || !_originalStyles) return;
    Object.entries(_originalStyles).forEach(([key, value]) => {
      container.style[key] = value || "";
    });
  }
  function _setPosition(pos) {
    POSITIONS.forEach((p) => container?.classList?.remove(`dsd-container--pip-${p}`));
    container?.classList?.add(`dsd-container--pip-${pos}`);
    _position = pos;
  }
  return {
    enter(options = {}) {
      if (_isPiP || !container) return this;
      _saveDimensions();
      container.classList.add("dsd-container--pip", "dsd-container--pip-enter");
      _setPosition(options.position || "bottom-right");
      setTimeout(() => {
        container.classList.remove("dsd-container--pip-enter");
      }, 300);
      _isPiP = true;
      return this;
    },
    exit() {
      if (!_isPiP || !container) return this;
      container.classList.remove("dsd-container--pip");
      POSITIONS.forEach((p) => container.classList.remove(`dsd-container--pip-${p}`));
      _restoreDimensions();
      _isPiP = false;
      return this;
    },
    toggle() {
      return _isPiP ? this.exit() : this.enter();
    },
    setPosition(pos) {
      if (POSITIONS.includes(pos)) {
        _setPosition(pos);
      }
      return this;
    },
    minimize() {
      container?.classList?.add("dsd-container--pip-minimized");
      return this;
    },
    restore() {
      container?.classList?.remove("dsd-container--pip-minimized");
      return this;
    },
    isPiP() {
      return _isPiP;
    },
    getPosition() {
      return _position;
    },
    destroy() {
      this.exit();
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  createPiPMode
};
