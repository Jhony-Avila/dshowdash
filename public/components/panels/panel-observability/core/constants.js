const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-observability.core.constants";
const PANEL_ID = "panel-observability";
const REFRESH_INTERVAL = 3e4;
const REFRESH_INTERVAL_DEGRADED = 6e4;
const HEALTH_STATUS = Object.freeze({ HEALTHY: "HEALTHY", DEGRADED: "DEGRADED", UNHEALTHY: "UNHEALTHY", UNKNOWN: "unknown" });
const ICONS = Object.freeze({
  barChart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
});
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var constants_default = { VERSION, MODULE_ID, PANEL_ID, REFRESH_INTERVAL, HEALTH_STATUS, ICONS };
export {
  HEALTH_STATUS,
  ICONS,
  MODULE_ID,
  PANEL_ID,
  REFRESH_INTERVAL,
  REFRESH_INTERVAL_DEGRADED,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
