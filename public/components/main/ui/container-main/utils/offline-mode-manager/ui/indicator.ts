// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: indicator
// PURPOSE: Offline Mode Manager - Offline Indicator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   OFFLINE_STATES from ../constants.js
//   getConfig, getState from ../state.js
//
// PROVIDES:
//   _updateOfflineIndicator() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { OFFLINE_STATES } from '../constants.js';
import { getConfig, getState } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.ui.indicator';

export function _updateOfflineIndicator() {
  const config = getConfig();
  if (!config.offlineIndicator) return;
  
  const state = getState();
  let indicator = document.getElementById('dsd-offline-indicator');
  
  if ((state as string) === OFFLINE_STATES.OFFLINE) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'dsd-offline-indicator';
      indicator.innerHTML = `
        <style>
          #dsd-offline-indicator {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideUp 0.3s ease;
          }
          #dsd-offline-indicator .icon {
            width: 16px;
            height: 16px;
          }
          @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
        </style>
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"/>
        </svg>
        <span>Você está offline</span>
      `;
      document.body.appendChild(indicator);
    }
  } else if (indicator) {
    indicator.remove();
  }
}
