// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: network-monitor-helpers
// PURPOSE: Network Monitor - Helpers v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isOnline() — exported function
//   getConnectionInfo() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'network-monitor-helpers';
export function isOnline() { return navigator.onLine ?? true; }
export function getConnectionInfo() { const nav = navigator as any; const conn = nav.connection || nav.mozConnection || nav.webkitConnection; if (!conn) return null; return { type: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt }; }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, helpers: ['isOnline', 'getConnectionInfo'], online: isOnline(), timestamp: Date.now() }; }
export function formatSpeed(bps: number) { if (bps > 1000000) return (bps / 1000000).toFixed(2) + " Mbps"; if (bps > 1000) return (bps / 1000).toFixed(2) + " Kbps"; return bps + " bps"; }
export function calculateLatency() { return getConnectionInfo()?.rtt || 0; }
export function getConnectionType() { return getConnectionInfo()?.type || "unknown"; }
export default { isOnline, getConnectionInfo, healthCheck, info, VERSION, MODULE_ID };
