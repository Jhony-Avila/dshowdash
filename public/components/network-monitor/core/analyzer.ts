// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: network-monitor-analyzer
// PURPOSE: Network Monitor - Analyzer v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getConnectionInfo() — exported function
//   isSlowConnection() — exported function
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
export const MODULE_ID = 'network-monitor-analyzer';
export function getConnectionInfo() { const nav = navigator as any; const conn = nav.connection || nav.mozConnection || nav.webkitConnection; if (!conn) return null; return { type: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt, saveData: conn.saveData }; }
// @ts-expect-error strict migration — TS18048
export function isSlowConnection() { const info: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } | null = getConnectionInfo(); if (!info) return false; return info.effectiveType === 'slow-2g' || info.effectiveType === '2g' || info.rtt > 500; }
export function healthCheck() { const nav = navigator as any; const checks = { connectionApiSupported: !!(nav.connection || nav.mozConnection || nav.webkitConnection) }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, connectionInfo: getConnectionInfo(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, connectionInfo: getConnectionInfo(), isSlow: isSlowConnection(), timestamp: Date.now() }; }
export const QualityAnalyzer = { getConnectionInfo, isSlowConnection, healthCheck, info };
export default { getConnectionInfo, isSlowConnection, healthCheck, info, VERSION, MODULE_ID };
