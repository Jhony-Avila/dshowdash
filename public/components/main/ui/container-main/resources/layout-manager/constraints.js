import { DEFAULT_CONSTRAINTS } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.constraints";
function createConstraintsManager(options = {}) {
  const { defaultConstraints: constraintsOpt = {} } = options;
  const _baseConstraints = { ...DEFAULT_CONSTRAINTS, ...constraintsOpt };
  return {
    // Merge constraints
    merge(panelConstraints = {}) {
      return { ..._baseConstraints, ...panelConstraints };
    },
    // Aplica constraints ao tamanho
    apply(width, height, constraints) {
      let w = Math.max(constraints.minWidth, Math.min(width, constraints.maxWidth));
      let h = Math.max(constraints.minHeight, Math.min(height, constraints.maxHeight));
      if (constraints.aspectRatio) {
        const targetHeight = w / constraints.aspectRatio;
        if (targetHeight <= constraints.maxHeight && targetHeight >= constraints.minHeight) {
          h = targetHeight;
        } else {
          w = h * constraints.aspectRatio;
        }
      }
      return { width: Math.round(w), height: Math.round(h) };
    },
    // Valida se tamanho está dentro dos constraints
    validate(width, height, constraints) {
      const applied = this.apply(width, height, constraints);
      return applied.width === Math.round(width) && applied.height === Math.round(height);
    },
    getDefaults() {
      return { ..._baseConstraints };
    }
  };
}
var constraints_default = { createConstraintsManager };
export {
  MODULE_ID,
  VERSION,
  createConstraintsManager,
  constraints_default as default
};
