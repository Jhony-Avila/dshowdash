const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui";
import { CustomizationOverlay } from "./customization-overlay.js";
import { EnvChip } from "./env-chip.js";
import { default as default2 } from "./ripple.js";
import { RippleManager } from "./ripple.js";
import { ScrollDetector } from "./scroll-detector.js";
import { headerTemplate } from "./template.js";
import { TooltipManager } from "./tooltips.js";
const modules = ["customization-overlay", "env-chip", "ripple", "scroll-detector", "template", "tooltips"];
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}
var ui_default = { VERSION, MODULE_ID, modules, info };
export {
  CustomizationOverlay,
  EnvChip,
  MODULE_ID,
  default2 as RippleEffect,
  ScrollDetector,
  TooltipManager,
  VERSION,
  RippleManager as createRipple,
  ui_default as default,
  headerTemplate,
  info,
  modules
};
