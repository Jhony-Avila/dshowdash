// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: version
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UPDATE_TYPES from ./constants.js
//
// PROVIDES:
//   compareVersions() — exported function
//   getUpdateType() — exported function
//   getCurrentVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).DSD_VERSION
//   (window as any).__APP_VERSION__
// ═══════════════════════════════════════════════════════════════
/**
 * Update Notifier - Version Utilities
 * @module update-notifier/version
 */
'use strict';

import { UPDATE_TYPES } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.update-notifier.version';

export function compareVersions(v1: Record<string, unknown>, v2: Record<string, unknown>) {
  if (!v1 || !v2) return 0;
  
  // @ts-expect-error TS migration - TS2339
  const parts1 = (v1.replace as (...args: unknown[]) => unknown)(/^v/, '').split('.').map(Number);
  // @ts-expect-error TS migration - TS2339
  const parts2 = (v2.replace as (...args: unknown[]) => unknown)(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}

export function getUpdateType(currentVer: Record<string, unknown>, newVer: Record<string, unknown>) {
  if (!currentVer || !newVer) return UPDATE_TYPES.PATCH;
  
  // @ts-expect-error TS migration - TS2339
  const current = (currentVer.replace as (...args: unknown[]) => unknown)(/^v/, '').split('.').map(Number);
  // @ts-expect-error TS migration - TS2339
  const latest = (newVer.replace as (...args: unknown[]) => unknown)(/^v/, '').split('.').map(Number);
  
  if (latest[0] > current[0]) return UPDATE_TYPES.MAJOR;
  if (latest[1] > current[1]) return UPDATE_TYPES.MINOR;
  return UPDATE_TYPES.PATCH;
}

export function getCurrentVersion() {
  const metaVersion = (document.querySelector('meta[name="app-version"]') as HTMLMetaElement)?.content;
  if (metaVersion) return metaVersion;

  if ((window as any).__APP_VERSION__) return (window as any).__APP_VERSION__;
  if ((window as any).DSD_VERSION) return (window as any).DSD_VERSION;
  
  const bodyVersion = document.body.dataset.version;
  if (bodyVersion) return bodyVersion;
  
  return null;
}
