const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.phases";
import { initPhase1 } from "./phase1-foundation.js";
import { initPhase2 } from "./phase2-performance.js";
import { initPhase3 } from "./phase3-core.js";
import { initPhase4 } from "./phase4-plugins.js";
import { initPhase5 } from "./phase5-utils.js";
import { initPhase6 } from "./phase6-ui.js";
import { initPhase7 } from "./phase7-device.js";
export {
  MODULE_ID,
  VERSION,
  initPhase1,
  initPhase2,
  initPhase3,
  initPhase4,
  initPhase5,
  initPhase6,
  initPhase7
};
