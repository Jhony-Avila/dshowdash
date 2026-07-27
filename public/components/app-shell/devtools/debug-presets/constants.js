const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-debug-presets";
const PRESETS = Object.freeze({
  MINIMAL: "minimal",
  STANDARD: "standard",
  VERBOSE: "verbose",
  PERFORMANCE: "performance",
  NETWORK: "network",
  MEMORY: "memory",
  EVENTS: "events",
  REGIONS: "regions",
  CUSTOM: "custom"
});
const PRESET_CONFIGS = {
  minimal: {
    name: "Minimal",
    description: "Apenas erros cr\xEDticos",
    logLevel: "error",
    enabledModules: [],
    features: {
      consoleOutput: true,
      timestamps: false,
      stackTraces: false,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: false,
      networkTracking: false
    }
  },
  standard: {
    name: "Standard",
    description: "Logs padr\xE3o para desenvolvimento",
    logLevel: "info",
    enabledModules: ["app-shell", "bootstrap"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: true,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: false,
      networkTracking: false
    }
  },
  verbose: {
    name: "Verbose",
    description: "Todos os logs detalhados",
    logLevel: "debug",
    enabledModules: ["*"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: true,
      performanceMarks: true,
      eventTracking: true,
      memoryTracking: true,
      networkTracking: true
    }
  },
  performance: {
    name: "Performance",
    description: "Foco em m\xE9tricas de performance",
    logLevel: "warn",
    enabledModules: ["performance", "app-shell"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: true,
      eventTracking: false,
      memoryTracking: true,
      networkTracking: true
    }
  },
  network: {
    name: "Network",
    description: "Monitoramento de requisi\xE7\xF5es",
    logLevel: "info",
    enabledModules: ["api", "fetch", "xhr"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: false,
      networkTracking: true
    }
  },
  memory: {
    name: "Memory",
    description: "Detec\xE7\xE3o de memory leaks",
    logLevel: "warn",
    enabledModules: ["memory", "gc"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: true,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: true,
      networkTracking: false
    }
  },
  events: {
    name: "Events",
    description: "Rastreamento de eventos",
    logLevel: "debug",
    enabledModules: ["eventbus", "events"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: false,
      eventTracking: true,
      memoryTracking: false,
      networkTracking: false
    }
  },
  regions: {
    name: "Regions",
    description: "Debug de regi\xF5es do App Shell",
    logLevel: "debug",
    enabledModules: ["app-shell", "regions", "dom-regions"],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: true,
      eventTracking: true,
      memoryTracking: false,
      networkTracking: false
    }
  }
};
const LOG_LEVEL_MAP = { debug: 0, info: 1, warn: 2, error: 3 };
export {
  LOG_LEVEL_MAP,
  MODULE_ID,
  PRESETS,
  PRESET_CONFIGS,
  VERSION
};
