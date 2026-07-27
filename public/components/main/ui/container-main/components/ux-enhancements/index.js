import { VERSION, MODULE_ID } from "./constants.js";
import { createScrollIndicator, createCompactScrollHeader } from "./scroll/index.js";
import { createValidationShake } from "./validation/index.js";
import { createSaveIndicator, createConnectionStatus } from "./status/index.js";
import { createParallaxBackground, enableMorphTransitions, createPiPMode } from "./effects/index.js";
import { setDepth } from "./utils/index.js";
import { createEnhancements, createAllEnhancements } from "./factory.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
function info() {
  return {
    moduleId: MODULE_ID2,
    version: VERSION2,
    features: ["scrollIndicator", "validationShake", "saveIndicator", "connectionStatus", "depthIndicator", "compactScrollHeader", "parallaxBackground", "morphTransitions", "pipMode"]
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION2, moduleId: MODULE_ID2 };
}
import { createScrollIndicator as createScrollIndicator2, createCompactScrollHeader as createCompactScrollHeader2 } from "./scroll/index.js";
import { createValidationShake as createValidationShake2 } from "./validation/index.js";
import { createSaveIndicator as createSaveIndicator2, createConnectionStatus as createConnectionStatus2 } from "./status/index.js";
import { createParallaxBackground as createParallaxBackground2, enableMorphTransitions as enableMorphTransitions2, createPiPMode as createPiPMode2 } from "./effects/index.js";
import { setDepth as setDepth2 } from "./utils/index.js";
import { createEnhancements as createEnhancements2, createAllEnhancements as createAllEnhancements2 } from "./factory.js";
var ux_enhancements_default = {
  createScrollIndicator: createScrollIndicator2,
  createCompactScrollHeader: createCompactScrollHeader2,
  createValidationShake: createValidationShake2,
  createSaveIndicator: createSaveIndicator2,
  createConnectionStatus: createConnectionStatus2,
  createParallaxBackground: createParallaxBackground2,
  enableMorphTransitions: enableMorphTransitions2,
  createPiPMode: createPiPMode2,
  createEnhancements: createEnhancements2,
  createAllEnhancements: createAllEnhancements2,
  setDepth: setDepth2,
  info,
  healthCheck,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  MODULE_ID,
  VERSION,
  createAllEnhancements,
  createCompactScrollHeader,
  createConnectionStatus,
  createEnhancements,
  createParallaxBackground,
  createPiPMode,
  createSaveIndicator,
  createScrollIndicator,
  createValidationShake,
  ux_enhancements_default as default,
  enableMorphTransitions,
  healthCheck,
  info,
  setDepth
};
