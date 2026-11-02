// Health Getters
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.6.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory context):
//   context.orchestrator — orchestrator instance
// PROVIDES: createHealthGetters() factory returning:
//   getHealthAggregator(), getHealthStatus(),
//   getPeriodicHealthStatus(), getMemoryMetrics()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.getters.health-getters';

export function createHealthGetters(context: { orchestrator: Record<string, Function> }) {
  const orchestrator = context.orchestrator;
  
  return {
    getHealthAggregator: function() {
      return orchestrator.getHealthAggregator();
    },
    
    getHealthStatus: function() {
      const agg = orchestrator.getHealthAggregator();
      return agg ? agg.calculate() : null;
    },
    
    getPeriodicHealthStatus: function() {
      const healthAgg = orchestrator.getHealthAggregator();
      if (healthAgg && healthAgg.getPeriodicHistory) {
        return healthAgg.getPeriodicHistory();
      }
      return { running: false, checkCount: 0, history: [] };
    },
    
    getMemoryMetrics: function() {
      const healthAgg = orchestrator.getHealthAggregator();
      if (healthAgg && healthAgg.getMemoryMetrics) {
        return healthAgg.getMemoryMetrics();
      }
      return null;
    }
  };
}

export default { createHealthGetters };
