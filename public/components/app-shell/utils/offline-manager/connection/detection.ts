// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/connection/detection
// PURPOSE: Detecção de estado de conexão e qualidade de rede
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONNECTION_STATUS from ../constants.js
//   state, config from ../state.js
// EXPORTS:
//   updateConnectionInfo — Atualiza informações de conexão
// BROWSER APIs: navigator.onLine, (navigator as any).connection
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerConnectionDetection
 * @description Detecção de conexão e Network Information API
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { CONNECTION_STATUS } from '../constants.js';
import { state, config } from '../state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.connection.detection';

/**
 * Atualiza informações de conexão baseado nas APIs do navegador
 * Detecta: online/offline, tipo efetivo (4g, 3g, etc), latência
 */
export function updateConnectionInfo() {
    if (typeof navigator === 'undefined') return;
    
    state.isOnline = navigator.onLine;
    
    // Network Information API (quando disponível)
    if ((navigator as any).connection) {
        state.effectiveType = (navigator as any).connection.effectiveType;
        state.downlink = (navigator as any).connection.downlink;
        state.rtt = (navigator as any).connection.rtt;
        
        // Detecta conexão lenta baseado em RTT
        if (state.isOnline && state.rtt && state.rtt > config.slowThreshold) {
            (state as any).connectionStatus = CONNECTION_STATUS.SLOW;
        } else {
            (state as any).connectionStatus = state.isOnline
                ? CONNECTION_STATUS.ONLINE
                : CONNECTION_STATUS.OFFLINE;
        }
    } else {
        (state as any).connectionStatus = state.isOnline
            ? CONNECTION_STATUS.ONLINE
            : CONNECTION_STATUS.OFFLINE;
    }
}
