import { getDeprecationManager } from "./deprecation-manager.js";
import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:compat-layer";
const logger = createLogger(MODULE_ID);
const SUPPORTED_VERSIONS = Object.freeze({
  CURRENT: "9.1.0",
  MINIMUM: "8.0.0",
  LEGACY: "7.0.0"
});
const COMPAT_STATUS = Object.freeze({
  FULL: "full",
  PARTIAL: "partial",
  LEGACY: "legacy",
  UNSUPPORTED: "unsupported"
});
const API_MIGRATIONS = {
  "7.0.0": {
    "container.init": { newName: "createContainer", adapter: (args) => args },
    "container.destroy": { newName: "destroyContainer", adapter: (args) => args },
    "panel.load": { newName: "activateSlot", adapter: ([panelId]) => [panelId] },
    "panel.unload": { newName: "deactivateSlot", adapter: ([panelId]) => [panelId] }
  },
  "8.0.0": {
    "initComponents": { newName: "initComponents", adapter: (args) => args, note: "Now returns lazy promise" },
    "resourceManager.cleanup": { newName: "resourceManager.cleanupByPriority", adapter: (args) => args },
    "slotManager.load": { newName: "slotManager.activate", adapter: (args) => args }
  }
};
const EVENT_MIGRATIONS = {
  "7.0.0": {
    "container:loaded": "container-main:ready",
    "panel:loaded": "slot:activated",
    "panel:unloaded": "slot:deactivated"
  },
  "8.0.0": {
    "component:init": "component:initialized",
    "component:destroy": "component:destroyed"
  }
};
const OPTIONS_MIGRATIONS = {
  "8.0.0": {
    "panelConfig": "slotConfig",
    "onPanelLoad": "onSlotActivate",
    "onPanelUnload": "onSlotDeactivate"
  }
};
function createCompatLayer(options = {}) {
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
  let _deprecationManager = null;
  let _sourceVersion = sourceVersion;
  let _migrationLog = [];
  let _destroyed = false;
  function _emit(event, data) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  function _logMigration(type, from, to, context = "") {
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
      logger.debug(`Migration: ${type}`, { from, to, context: context || void 0 });
    }
    onMigration?.(entry);
    _emit("compat:migration", entry);
  }
  function _compareVersions(v1, v2) {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
  function _getApplicableMigrations(fromVersion, toVersion, migrationMap) {
    const applicable = {};
    Object.entries(migrationMap).forEach(([version, migrations]) => {
      if (_compareVersions(version, fromVersion) > 0 && _compareVersions(version, toVersion) <= 0) {
        Object.assign(applicable, migrations);
      }
    });
    return applicable;
  }
  function _initDeprecationManager() {
    if (_deprecationManager) return;
    _deprecationManager = getDeprecationManager({ eventBus, logToConsole: logMigrations });
    if (_sourceVersion) {
      const apiMigrations = _getApplicableMigrations(_sourceVersion, targetVersion, API_MIGRATIONS);
      Object.entries(apiMigrations).forEach(([oldName, migration]) => {
        _deprecationManager.register(oldName, {
          message: `API "${oldName}" is deprecated`,
          replacement: migration.newName,
          level: "warning",
          since: _sourceVersion
        });
      });
    }
  }
  const layer = {
    // Define versão de origem
    setSourceVersion(version) {
      _sourceVersion = version;
      _initDeprecationManager();
      _emit("compat:source-version-set", { version });
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
    migrateAPI(oldName, ...args) {
      if (!_sourceVersion) return { name: oldName, args };
      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, API_MIGRATIONS);
      const migration = migrations[oldName];
      if (!migration) return { name: oldName, args };
      _logMigration("api", oldName, migration.newName);
      if (_deprecationManager) {
        _deprecationManager.check(oldName, "api-call");
      }
      const migratedArgs = migration.adapter ? migration.adapter(args) : args;
      return { name: migration.newName, args: migratedArgs };
    },
    // Migra nome de evento
    migrateEvent(oldEventName) {
      if (!_sourceVersion) return oldEventName;
      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, EVENT_MIGRATIONS);
      const newName = migrations[oldEventName];
      if (!newName) return oldEventName;
      _logMigration("event", oldEventName, newName);
      return newName;
    },
    // Migra opções
    migrateOptions(options2) {
      if (!_sourceVersion || !options2) return options2;
      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, OPTIONS_MIGRATIONS);
      const migrated = { ...options2 };
      Object.entries(migrations).forEach(([oldKey, newKey]) => {
        if (oldKey in migrated) {
          migrated[newKey] = migrated[oldKey];
          delete migrated[oldKey];
          _logMigration("option", oldKey, newKey);
        }
      });
      return migrated;
    },
    // Cria proxy de compatibilidade para objeto
    createProxy(target, apiMap = {}) {
      return new Proxy(target, {
        get(obj, prop) {
          const propStr = String(prop);
          const migration = apiMap[propStr];
          if (migration) {
            const newProp = migration.newName || migration;
            _logMigration("property", propStr, newProp);
            if (_deprecationManager) {
              _deprecationManager.check(propStr, "property-access");
            }
            return obj[newProp];
          }
          return obj[propStr];
        },
        set(obj, prop, value) {
          const propStr = String(prop);
          const migration = apiMap[propStr];
          if (migration) {
            const newProp = migration.newName || migration;
            _logMigration("property", propStr, newProp);
            obj[newProp] = value;
            return true;
          }
          obj[propStr] = value;
          return true;
        }
      });
    },
    // Cria wrapper de função com migração automática
    wrapFunction(fn, oldName, newName) {
      return (...args) => {
        _logMigration("function", oldName, newName);
        if (_deprecationManager) {
          _deprecationManager.check(oldName, "function-call");
        }
        return fn(...args);
      };
    },
    // Cria adaptador de eventos
    createEventAdapter(eventBusInstance) {
      if (!_sourceVersion) return eventBusInstance;
      const migrations = _getApplicableMigrations(_sourceVersion, targetVersion, EVENT_MIGRATIONS);
      const originalOn = eventBusInstance.on?.bind(eventBusInstance);
      const originalEmit = eventBusInstance.emit?.bind(eventBusInstance);
      if (originalOn) {
        eventBusInstance.on = (eventName, handler) => {
          const migratedName = migrations[eventName] || eventName;
          if (migratedName !== eventName) {
            _logMigration("event-listener", eventName, migratedName);
          }
          return originalOn(migratedName, handler);
        };
      }
      if (originalEmit) {
        eventBusInstance.emit = (eventName, data) => {
          const migratedName = migrations[eventName] || eventName;
          if (migratedName !== eventName) {
            _logMigration("event-emit", eventName, migratedName);
          }
          return originalEmit(migratedName, data);
        };
      }
      return eventBusInstance;
    },
    // Aplica todas as migrações a um objeto de configuração
    migrateConfig(config) {
      if (!config || !_sourceVersion) return config;
      let migrated = this.migrateOptions(config);
      if (migrated.callbacks) {
        const callbackMigrations = _getApplicableMigrations(_sourceVersion, targetVersion, OPTIONS_MIGRATIONS);
        Object.entries(callbackMigrations).forEach(([oldKey, newKey]) => {
          if (migrated.callbacks[oldKey]) {
            migrated.callbacks[newKey] = migrated.callbacks[oldKey];
            delete migrated.callbacks[oldKey];
            _logMigration("callback", oldKey, newKey);
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
      _emit("compat:log-cleared", {});
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
      _migrationLog.forEach((entry) => {
        const e = entry;
        const type = e.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });
      return stats;
    },
    // Health check
    healthCheck() {
      const compatStatus = this.getCompatStatus();
      let status = "HEALTHY";
      if (compatStatus === COMPAT_STATUS.UNSUPPORTED) status = "ERROR";
      else if (compatStatus === COMPAT_STATUS.LEGACY) status = "WARNING";
      else if (compatStatus === COMPAT_STATUS.PARTIAL) status = "DEGRADED";
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
      _emit("compat-layer:destroyed", {});
    }
  };
  if (_sourceVersion) {
    _initDeprecationManager();
  }
  return layer;
}
let _globalLayer = null;
function getCompatLayer(options) {
  if (!_globalLayer) {
    _globalLayer = createCompatLayer(options);
  }
  return _globalLayer;
}
function resetGlobalCompatLayer() {
  if (_globalLayer) {
    _globalLayer.destroy();
    _globalLayer = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createCompatLayer", "getCompatLayer"],
    supportedVersions: { ...SUPPORTED_VERSIONS },
    compatStatuses: Object.keys(COMPAT_STATUS)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalLayer: !!_globalLayer
  };
}
var compat_layer_default = {
  VERSION,
  MODULE_ID,
  SUPPORTED_VERSIONS,
  COMPAT_STATUS,
  createCompatLayer,
  getCompatLayer,
  resetGlobalCompatLayer,
  info,
  healthCheck
};
export {
  COMPAT_STATUS,
  MODULE_ID,
  SUPPORTED_VERSIONS,
  VERSION,
  createCompatLayer,
  compat_layer_default as default,
  getCompatLayer,
  healthCheck,
  info,
  resetGlobalCompatLayer
};
