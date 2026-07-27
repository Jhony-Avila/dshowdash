// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils
// PURPOSE: Offline Mode Manager - Cache Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//
// PROVIDES:
//   _isExpired() — exported function
//   _createCacheKey() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getConfig } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.cache.utils';

export function _isExpired(metadata: Record<string, unknown>) {
  const config = getConfig();
  if (!metadata || !metadata.timestamp) return true;
  return Date.now() - (metadata.timestamp as number) > config.maxAge;
}

export function _createCacheKey(url: string) {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.href;
  } catch (e) {
    return url;
  }
}
