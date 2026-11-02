// Periodic Health Starter
// @version 2.6.2-EVENTS-FORMALIZED
// @changelog v2.6.2-EVENTS-FORMALIZED: Migração string solta 'bootstrap:periodic-health' → BOOT_EVENTS.HEALTH_PERIODIC
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.2)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   PERIODIC_HEALTH_CONFIG from ../configs/index.js
//   BOOT_EVENTS from /core/runtime/events/index.js
// RECEIVES (params):
//   healthAgg, loggerAdapter, eventBusAdapter, degradationNotifier
// PROVIDES: startPeriodicHealthCheck(), stopPeriodicHealthCheck()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERIODIC_HEALTH_CONFIG } from '../configs/index.js';
import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.periodic-health.health-starter';

interface HealthAgg {
  startPeriodicCheck?: (config: Record<string, unknown>) => { success: boolean };
  stopPeriodicCheck?: () => void;
}

interface LoggerAdapter {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
}

interface EventBusAdapter {
  emit: (event: string, data: Record<string, unknown>) => void;
}

interface DegradationNotifier {
  notify?: (type: string, message: string, data: Record<string, unknown>) => void;
}

interface HealthEntry {
  status: string;
  score: number;
  [key: string]: unknown;
}

export function startPeriodicHealthCheck(healthAgg: HealthAgg | null, loggerAdapter: LoggerAdapter, eventBusAdapter: EventBusAdapter, degradationNotifier: DegradationNotifier | null) {
  if (!healthAgg || !healthAgg.startPeriodicCheck) {
    loggerAdapter.warn('Health Aggregator does not support periodic checks');
    return { success: false, reason: 'not_supported' };
  }
  
  const result = healthAgg.startPeriodicCheck({
    interval: PERIODIC_HEALTH_CONFIG.interval,
    maxChecks: PERIODIC_HEALTH_CONFIG.maxChecks,
    onCheck: function(entry: HealthEntry, fullResult: Record<string, unknown>) {
      // Notificar se saúde degradou
      if (entry.status === 'DEGRADED' || entry.status === 'UNHEALTHY') {
        if (degradationNotifier && degradationNotifier.notify) {
          degradationNotifier.notify('health-degraded', 'Saúde do sistema: ' + entry.status, {
            score: entry.score,
            status: entry.status
          });
        }
      }
      
      // Emitir evento via constante centralizada
      eventBusAdapter.emit(BOOT_EVENTS.HEALTH_PERIODIC, entry);
    }
  });
  
  if (result.success) {
    loggerAdapter.info('Periodic health check started', {
      interval: PERIODIC_HEALTH_CONFIG.interval,
      maxChecks: PERIODIC_HEALTH_CONFIG.maxChecks
    });
  }
  
  return result;
}

export function stopPeriodicHealthCheck(healthAgg: HealthAgg | null) {
  if (healthAgg && healthAgg.stopPeriodicCheck) {
    healthAgg.stopPeriodicCheck();
  }
}

export default { startPeriodicHealthCheck, stopPeriodicHealthCheck };
