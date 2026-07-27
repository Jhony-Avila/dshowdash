
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:compat-layer
// PURPOSE: Compat Layer - Camada de compatibilidade retroativa
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getDeprecationManager from ./deprecation-manager.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SUPPORTED_VERSIONS — exported value
//   COMPAT_STATUS — exported value
//   createCompatLayer() — exported function
//   getCompatLayer() — exported function
//   resetGlobalCompatLayer() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getDeprecationManager } from './deprecation-manager.js';
import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:compat-layer';

const logger = createLogger(MODULE_ID);

// Versões suportadas
export const SUPPORTED_VERSIONS = Object.freeze({
  CURRENT: '9.1.0',
  MINIMUM: '8.0.0',
  LEGACY: '7.0.0'
});

// Status de compatibilidade
export const COMPAT_STATUS = Object.freeze({
  FULL: 'full',
  PARTIAL: 'partial',
  LEGACY: 'legacy',
  UNSUPPORTED: 'unsupported'
});

// Mapas de migração de APIs
const API_MIGRATIONS = {
  '7.0.0': {
    'container.init': { newName: 'createContainer', adapter: (args: unknown) => args },
    'container.destroy': { newName: 'destroyContainer', adapter: (args: unknown) => args },
    'panel.load': { newName: 'activateSlot', adapter: ([panelId]: string[]) => [panelId] },
    'panel.unload': { newName: 'deactivateSlot', adapter: ([panelId]: string[]) => [panelId] }
  },
  '8.0.0': {
    'initComponents': { newName: 'initComponents', adapter: (args: unknown) => args, note: 'Now returns lazy promise' },
    'resourceManager.cleanup': { newName: 'resourceManager.cleanupByPriority', adapter: (args: unknown) => args },
    'slotManager.load': { newName: 'slotManager.activate', adapter: (args: unknown) => args }
  }
};

// Mapas de eventos renomeados
const EVENT_MIGRATIONS = {
  '7.0.0': {
    'container:loaded': 'container-main:ready',
    'panel:loaded': 'slot:activated',
    'panel:unloaded': 'slot:deactivated'
  },
  '8.0.0': {
    'component:init': 'component:initialized',
    'component:destroy': 'component:destroyed'
  }
};

// Mapas de opções renomeadas
const OPTIONS_MIGRATIONS = {
  '8.0.0': {
    'panelConfig': 'slotConfig',
    'onPanelLoad': 'onSlotActivate',
    'onPanelUnload': 'onSlotDeactivate'
  }
};

// Cria instância do Compat Layer
export function createCompatLayer(options: Record<string, any> = {}) {
  const {
    eventBus,
    targetVersion = SUPPORTED_VERSIONS.CURRENT,
    sourceVersion = null,
    enableLegacyMode = false,
    logMigrations = true,
    autoMigrate = true,
    onMigration,
    onIncompatible
  } = options;

  let _deprecationManager: ReturnType<typeof getDeprecationManager> | null = null;
  let _sourceVersion = sourceVersion;
  let _migrationLog: unknown[] = [];
  let _destroyed = false;

  // Emite evento
  function _emit(event: string, data: Record<string, unknown>) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  // Log de migração
  function _logMigration(type: string, from: unknown, to: unknown, context = '') {
    const entry = {
      type,
      from,
      to,
      context,
      timestamp: Date.now()
    };
    
    _migrationLog.push(entry);
    if (_migrationLog.length > 500) _migrationLog.shift();

    if (logMigrations) {
      logger.debug(`Migration: ${type}`, { from, to, context: context || undefined });
    }

    onMigration?.(entry);
    _emit('compat:migration', entry);
  }

  // Compara versões semânticas
  function _compareVersions(v1: string, v2: string) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  // Obtém migrações aplicáveis
  function _getApplicableMigrations(fromVersion: string, toVersion: string, migrationMap: Record<string, Record<string, unknown>>) {
    const applicable: Record<string, Record<string, unknown>> = {};

    Object.entries(migrationMap).forEach(([version, migrations]) => {
      if (_compareVersions(version, fromVersion) > 0 && _compareVersions(version, toVersion) <= 0) {
        Object.assign(applicable, migrations);
      }
    });

    return applicable;
  }

  // Inicializa deprecation manager
  function _initDeprecationManager() {
    if (_deprecationManager) return;
    
    _deprecationManager = getDeprecationManager({ eventBus, logToConsole: logMigrations });

    // Registra deprecações baseadas nas migrações
    if (_sourceVersion) {
      const apiMigrations = _getApplicableMigrations(_sourceVersion, targetVersion, API_MIGRATIONS);
      
      Object.entries(apiMigrations).forEach(([oldName, migration]: [string, any]) => {
        _deprecationManager!.register(oldName, {
          message: `API "${oldName}" is deprecated`,
          replacement: migration.newName,
          level: 'warning',
          since: _sourceVersion
        });
      });
    }
  }

  const layer = {
    // Define versão de origem
    setSourceVersion(version: string) {
      _sourceVersion = version;
      _initDeprecationManager();
      _emit('compat:source-version-set', { version });
      return this;
    },

    // Obtém status de compatibilidade
    getCompatStatus(version = _sourceVersion) {
      if (!version) return COMPAT_STATUS.FULL;

      const cmp = _compareVersions(version, SUPPORTED_VERSIONS.MINIMUM);
      const cmpLegacy = _compareVersions(version, SUPPORTED_VERSIONS.LEGACY);

      if (cmp >= 0) return COMPAT_STATUS.FULL;
      if (cmpLegacy >= 0) return COMPAT_STATUS.PARTIAL;
      if (enableLegacyMode) return COMPAT_STATUS.LEGACY;
      
      return COMPAT_STATUS.UNSUPPORTED;
    },

    // Verifica se versão é suportada
    isSupported(version = _sourceVersion) {
      const status = this.getCompatStatus(version);
      return status !== COMPAT_STATUS.UNSUPPORTED;
    },

    // Migra nome de API
    migrateAPI(oldName: string, ...args: unknown[]) {
      if (!_sourceVersion) return { name: oldName, args };

      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, API_MIGRATIONS);
      const migration = migrations[oldName];

      if (!migration) return { name: oldName, args };

      _logMigration('api', oldName, migration.newName);
      
      if (_deprecationManager) {
        _deprecationManager.check(oldName, 'api-call');
      }

      const migratedArgs = migration.adapter ? (migration.adapter as (...a: unknown[]) => unknown)(args) : args;
      return { name: migration.newName, args: migratedArgs };
    },

    // Migra nome de evento
    migrateEvent(oldEventName: string) {
      if (!_sourceVersion) return oldEventName;

      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, EVENT_MIGRATIONS);
      const newName = migrations[oldEventName];

      if (!newName) return oldEventName;

      _logMigration('event', oldEventName, newName);
      return newName;
    },

    // Migra opções
    migrateOptions(options: Record<string, unknown>) {
      if (!_sourceVersion || !options) return options;

      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, OPTIONS_MIGRATIONS);
      const migrated = { ...options };

      Object.entries(migrations).forEach(([oldKey, newKey]: [string, any]) => {
        if (oldKey in migrated) {
          migrated[newKey as string] = migrated[oldKey];
          delete migrated[oldKey];
          _logMigration('option', oldKey, newKey);
        }
      });

      return migrated;
    },

    // Cria proxy de compatibilidade para objeto
    createProxy(target: HTMLElement, apiMap = {}) {
      return new Proxy(target, {
        get(obj, prop) {
          const propStr = String(prop);
          const migration = (apiMap as Record<string, Record<string, unknown>>)[propStr];
          if (migration) {
            const newProp = (migration.newName || migration) as string;
            _logMigration('property', propStr, newProp);

            if (_deprecationManager) {
              _deprecationManager.check(propStr, 'property-access');
            }

            return (obj as unknown as Record<string, unknown>)[newProp];
          }

          return (obj as unknown as Record<string, unknown>)[propStr];
        },

        set(obj, prop, value) {
          const propStr = String(prop);
          const migration = (apiMap as Record<string, Record<string, unknown>>)[propStr];
          if (migration) {
            const newProp = (migration.newName || migration) as string;
            _logMigration('property', propStr, newProp);
            (obj as unknown as Record<string, unknown>)[newProp] = value;
            return true;
          }

          (obj as unknown as Record<string, unknown>)[propStr] = value;
          return true;
        }
      });
    },

    // Cria wrapper de função com migração automática
    wrapFunction(fn: (...args: unknown[]) => void, oldName: string, newName: string) {
      return (...args: unknown[]) => {
        _logMigration('function', oldName, newName);

        if (_deprecationManager) {
          _deprecationManager.check(oldName, 'function-call');
        }

        return fn(...args);
      };
    },

    // Cria adaptador de eventos
    createEventAdapter(eventBusInstance: Record<string, (...args: unknown[]) => unknown>) {
      if (!_sourceVersion) return eventBusInstance;

      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, EVENT_MIGRATIONS);
      
      const originalOn = eventBusInstance.on?.bind(eventBusInstance);
      const originalEmit = eventBusInstance.emit?.bind(eventBusInstance);

      if (originalOn) {
        // @ts-expect-error strict migration — TS2322
        eventBusInstance.on = (eventName: string, handler: (...args: unknown[]) => void) => {
          const migratedName = (migrations as Record<string, unknown>)[eventName] || eventName;
          if (migratedName !== eventName) {
            _logMigration('event-listener', eventName, migratedName);
          }
          return originalOn(migratedName, handler);
        };
      }

      if (originalEmit) {
        // @ts-expect-error strict migration — TS2322
        eventBusInstance.emit = (eventName: string, data: Record<string, unknown>) => {
          const migratedName = (migrations as Record<string, unknown>)[eventName] || eventName;
          if (migratedName !== eventName) {
            _logMigration('event-emit', eventName, migratedName);
          }
          return originalEmit(migratedName, data);
        };
      }

      return eventBusInstance;
    },

    // Aplica todas as migrações a um objeto de configuração
    migrateConfig(config: Record<string, unknown>) {
      if (!config || !_sourceVersion) return config;

      let migrated = this.migrateOptions(config);

      if (migrated.callbacks) {
        const callbackMigrations = _getApplicableMigrations(_sourceVersion, targetVersion, OPTIONS_MIGRATIONS);
        Object.entries(callbackMigrations).forEach(([oldKey, newKey]: [string, any]) => {
          // @ts-expect-error strict migration — TS18046
          if (migrated.callbacks[oldKey]) {
            // @ts-expect-error strict migration — TS18046
            migrated.callbacks[newKey as string] = migrated.callbacks[oldKey];
            // @ts-expect-error strict migration — TS18046
            delete migrated.callbacks[oldKey];
            _logMigration('callback', oldKey, newKey);
          }
        });
      }

      return migrated;
    },

    // Obtém log de migrações
    getMigrationLog(limit = 100) {
      return _migrationLog.slice(-limit);
    },

    // Limpa log de migrações
    clearMigrationLog() {
      _migrationLog = [];
      _emit('compat:log-cleared', {});
    },

    // Obtém estatísticas
    getStats() {
      const stats = {
        sourceVersion: _sourceVersion,
        targetVersion,
        compatStatus: this.getCompatStatus(),
        totalMigrations: _migrationLog.length,
        byType: {}
      };

      _migrationLog.forEach(entry => {
        const e = entry as Record<string, unknown>;
        const type = e.type as string;
        (stats.byType as Record<string, number>)[type] = ((stats.byType as Record<string, number>)[type] || 0) + 1;
      });

      return stats;
    },

    // Health check
    healthCheck() {
      const compatStatus = this.getCompatStatus();
      
      let status = 'HEALTHY';
      if (compatStatus === COMPAT_STATUS.UNSUPPORTED) status = 'ERROR';
      else if (compatStatus === COMPAT_STATUS.LEGACY) status = 'WARNING';
      else if (compatStatus === COMPAT_STATUS.PARTIAL) status = 'DEGRADED';

      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        sourceVersion: _sourceVersion,
        targetVersion,
        compatStatus,
        totalMigrations: _migrationLog.length,
        supportedVersions: { ...SUPPORTED_VERSIONS }
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        sourceVersion: _sourceVersion,
        targetVersion,
        compatStatus: this.getCompatStatus(),
        supportedVersions: { ...SUPPORTED_VERSIONS },
        enableLegacyMode
      };
    },

    // Destroy
    destroy() {
      _destroyed = true;
      _migrationLog = [];
      _deprecationManager = null;
      _emit('compat-layer:destroyed', {});
    }
  };

  if (_sourceVersion) {
    _initDeprecationManager();
  }

  return layer;
}

// Singleton global
let _globalLayer: ReturnType<typeof createCompatLayer> | null = null;

export function getCompatLayer(options: Record<string, unknown>) {
  if (!_globalLayer) {
    _globalLayer = createCompatLayer(options);
  }
  return _globalLayer;
}

export function resetGlobalCompatLayer() {
  if (_globalLayer) {
    _globalLayer.destroy();
    _globalLayer = null;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createCompatLayer', 'getCompatLayer'],
    supportedVersions: { ...SUPPORTED_VERSIONS },
    compatStatuses: Object.keys(COMPAT_STATUS)
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalLayer: !!_globalLayer
  };
}

export default {
  VERSION, MODULE_ID,
  SUPPORTED_VERSIONS, COMPAT_STATUS,
  createCompatLayer, getCompatLayer, resetGlobalCompatLayer,
  info, healthCheck
};
