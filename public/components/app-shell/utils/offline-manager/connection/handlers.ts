// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/connection/handlers
// PURPOSE: Handlers para eventos de conexão
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONNECTION_STATUS from ../constants.js
//   state, config, incrementMetric, notifySubscribers from ../state.js
//   showBanner from ../ui/banner.js
//   updateConnectionInfo from ./detection.js
//   syncPending from ../sync/manager.js
// EXPORTS:
//   handleOnline — Handler para evento online
//   handleOffline — Handler para evento offline
//   handleConnectionChange — Handler para mudança de conexão
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerConnectionHandlers
 * @description Handlers de eventos de rede
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { CONNECTION_STATUS } from '../constants.js';
import { state, config, incrementMetric, notifySubscribers } from '../state.js';
import { showBanner } from '../ui/banner.js';
import { updateConnectionInfo } from './detection.js';
import { syncPending } from '../sync/manager.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.connection.handlers';

/**
 * Handler para evento online
 */
export function handleOnline() {
    state.isOnline = true;
    state.lastOnline = Date.now();
    incrementMetric('onlineEvents', 1 as any);
    
    updateConnectionInfo();
    showBanner('Conexao restaurada', 'online');
    
    notifySubscribers({
        type: 'online',
        connectionStatus: state.connectionStatus,
        timestamp: Date.now()
    });
    
    if (config.syncOnReconnect && state.pendingActions.length > 0) {
        syncPending(undefined as any);
    }
}

/**
 * Handler para evento offline
 */
export function handleOffline() {
    state.isOnline = false;
    state.lastOffline = Date.now();
    (state as any).connectionStatus = CONNECTION_STATUS.OFFLINE;
    incrementMetric('offlineEvents', 1 as any);
    
    showBanner('Voce esta offline. Alteracoes serao sincronizadas ao reconectar.', 'offline');
    
    notifySubscribers({
        type: 'offline',
        timestamp: Date.now()
    });
}

/**
 * Handler para mudança de qualidade de conexão
 */
export function handleConnectionChange() {
    updateConnectionInfo();
    
    if ((state as any).connectionStatus === CONNECTION_STATUS.SLOW) {
        showBanner('Conexao lenta detectada', 'slow');
    }
    
    notifySubscribers({
        type: 'connection-change',
        connectionStatus: state.connectionStatus,
        effectiveType: state.effectiveType,
        rtt: state.rtt,
        timestamp: Date.now()
    });
}
