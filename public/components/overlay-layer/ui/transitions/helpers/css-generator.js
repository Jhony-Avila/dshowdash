import { _transitions, getConfig } from "../state.js";
import { camelToKebab } from "./motion.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.transitions.helpers.css-generator";
function generateCSS(transitionName) {
  const transition = _transitions[transitionName];
  if (!transition || !transition.enter) return null;
  const prefix = getConfig().cssPrefix;
  return `
.${prefix}-${transitionName}-enter {
  ${Object.entries(transition.enter.from).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join("\n  ")}
}
.${prefix}-${transitionName}-enter-active {
  ${Object.entries(transition.enter.to).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join("\n  ")}
  transition: all ${transition.duration}ms ${transition.easing};
}
.${prefix}-${transitionName}-exit {
  ${Object.entries(transition.exit.from).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join("\n  ")}
}
.${prefix}-${transitionName}-exit-active {
  ${Object.entries(transition.exit.to).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join("\n  ")}
  transition: all ${transition.duration}ms ${transition.easing};
}
  `.trim();
}
export {
  MODULE_ID,
  VERSION,
  generateCSS
};
