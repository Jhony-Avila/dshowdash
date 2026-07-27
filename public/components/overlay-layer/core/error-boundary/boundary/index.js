const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.boundary";
import { capture } from "./capture.js";
import { boundary, boundarySync } from "./wrappers.js";
export {
  MODULE_ID,
  VERSION,
  boundary,
  boundarySync,
  capture
};
