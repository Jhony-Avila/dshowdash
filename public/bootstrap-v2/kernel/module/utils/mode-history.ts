// Mode History Manager
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: createModeHistoryManager() factory returning:
//   record(), getHistory(), getLength(), reset()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.utils.mode-history';

interface ModeHistoryEntry {
  from: string;
  to: string;
  reason: string | null;
  timestamp: number;
}

export function createModeHistoryManager(maxEntries: number) {
  if (maxEntries === undefined) maxEntries = 50;

  let history: ModeHistoryEntry[] = [];

  return {
    record: function(fromMode: string, toMode: string, reason: string) {
      const entry = {
        from: fromMode,
        to: toMode,
        reason: reason || null,
        timestamp: Date.now()
      };
      history.push(entry);
      if (history.length > maxEntries) {
        history.shift();
      }
    },

    getHistory: function() {
      return history.slice();
    },

    getLength: function() {
      return history.length;
    },

    reset: function() {
      history = [];
    }
  };
}

export default { createModeHistoryManager };
