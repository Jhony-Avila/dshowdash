import { SEVERITY } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.state";
const state = {
  active: false,
  type: null,
  severity: SEVERITY.INFO,
  message: null,
  startTime: null,
  endTime: null,
  affectedRegions: [],
  affectedFeatures: [],
  allowedRoles: [],
  bypassToken: null
};
const config = {
  showBanner: true,
  bannerPosition: "top",
  blockInteraction: true,
  allowDismiss: false,
  persistState: true
};
const subscribers = [];
const bannerElement = { value: null };
const scheduledMaintenance = { value: null };
const metrics = {
  activations: 0,
  deactivations: 0,
  bypasses: 0
};
export {
  MODULE_ID,
  VERSION,
  bannerElement,
  config,
  metrics,
  scheduledMaintenance,
  state,
  subscribers
};
