// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: memory-leak-detector/detection
// PURPOSE: Engine de detecção de memory leaks
// ───────────────────────────────────────────────────────────────
// IMPORTS: none (recebe state como parâmetro)
// EXPORTS:
//   checkForLeaks — Executa verificação de leaks no state
// ═══════════════════════════════════════════════════════════════
/**
 * @module MemoryLeakDetectorDetection
 * @description Engine de detecção de memory leaks
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.memory-leak-detector.detection';

/**
 * Verifica leaks no state fornecido
 * @param {Object} state - Estado do detector
 * @returns {Object|null} Relatório de leaks ou null
 */
export function checkForLeaks(state: DynObj) {
    const leaks: DynObj[] = [];
    const now = Date.now();
    
    // Detached DOM listeners
    state.trackedListeners.forEach((entry: DynObj, id: DynObj) => {
        const target = entry.target;
        if (target && target.nodeType === 1) {
            if (!document.contains(target)) {
                leaks.push({
                    type: 'detached-listener',
                    id,
                    targetName: entry.targetName,
                    eventType: entry.type,
                    age: now - entry.addedAt,
                    stack: entry.stack
                });
            }
        }
    });
    
    // Long-running intervals (>5min)
    state.trackedIntervals.forEach((entry: DynObj, id: DynObj) => {
        const age = now - entry.createdAt;
        if (age > 300000) {
            leaks.push({
                type: 'long-interval',
                id,
                delay: entry.delay,
                age,
                stack: entry.stack
            });
        }
    });
    
    // Orphan timeouts
    state.trackedTimeouts.forEach((entry: DynObj, id: DynObj) => {
        const age = now - entry.createdAt;
        const expectedDuration = entry.delay + 10000;
        if (age > expectedDuration && age > 60000) {
            leaks.push({
                type: 'orphan-timeout',
                id,
                delay: entry.delay,
                age,
                stack: entry.stack
            });
        }
    });
    
    state.metrics.checksPerformed++;
    state.metrics.lastCheck = now;
    
    if (leaks.length > 0) {
        state.metrics.leaksDetected += leaks.length;
        
        const report = {
            timestamp: now,
            leakCount: leaks.length,
            leaks,
            summary: {
                detachedListeners: leaks.filter(l => l.type === 'detached-listener').length,
                longIntervals: leaks.filter(l => l.type === 'long-interval').length,
                orphanTimeouts: leaks.filter(l => l.type === 'orphan-timeout').length
            }
        };
        
        state.leakReports.push(report);
        
        while (state.leakReports.length > state.config.maxReports) {
            state.leakReports.shift();
        }
        
        return report;
    }
    
    return null;
}
