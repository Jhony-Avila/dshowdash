import { createLogger } from "./logger.js";
import { getEnv, ENV } from "../config.js";
const VERSION = "1.0.0-PHASE5";
const MODULE_ID = "container-main:console-commands";
function createConsoleCommands(options = {}) {
  const {
    prefix = "cm",
    enableInProduction = false,
    colors = true
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _bootstrap = null;
  let _eventBus = null;
  let _commands = /* @__PURE__ */ new Map();
  const COLORS = {
    title: "color: #007acc; font-weight: bold; font-size: 14px;",
    subtitle: "color: #6c757d; font-weight: bold;",
    success: "color: #28a745; font-weight: bold;",
    warning: "color: #ffc107; font-weight: bold;",
    error: "color: #dc3545; font-weight: bold;",
    info: "color: #17a2b8;",
    muted: "color: #6c757d;",
    key: "color: #9cdcfe;",
    value: "color: #ce9178;",
    reset: ""
  };
  function _log(style, ...args) {
    if (colors) {
      console.log(`%c${args[0]}`, COLORS[style] || "", ...args.slice(1));
    } else {
      console.log(...args);
    }
  }
  function _table(data, title = null) {
    if (title) _log("subtitle", `
\u{1F4CB} ${title}`);
    console.table(data);
  }
  function _json(data, title = null) {
    if (title) _log("subtitle", `
\u{1F4CB} ${title}`);
    console.dir(data, { depth: 4 });
  }
  function _register(name, description, handler) {
    _commands.set(name, { name, description, handler });
  }
  _register("help", "Lista todos os comandos dispon\xEDveis", () => {
    _log("title", "\n\u{1F6E0}\uFE0F Container-Main Console Commands\n");
    _log("muted", `Prefix: ${prefix}. Use ${prefix}.help() para esta lista.
`);
    const rows = [];
    for (const [name, cmd] of _commands) {
      rows.push({ command: `${prefix}.${name}()`, description: cmd.description });
    }
    _table(rows, "Comandos Dispon\xEDveis");
  });
  _register("status", "Mostra status geral do sistema", () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const info2 = _bootstrap.info();
    _log("title", "\n\u{1F4CA} System Status\n");
    console.group("Bootstrap");
    _log("key", "State:", info2.state);
    _log("key", "Version:", info2.version);
    _log("key", "Kernel:", info2.kernelState || "N/A");
    console.groupEnd();
    console.group("Phases");
    _log("info", "Phase 1:", info2.phase1?.loggerActive ? "\u2705" : "\u274C");
    _log("info", "Phase 2:", info2.phase2?.performanceMonitorActive ? "\u2705" : "\u274C");
    _log("info", "Phase 3:", info2.phase3?.configIntegrated ? "\u2705" : "\u274C");
    _log("info", "Phase 4:", info2.phase4?.pluginSystemActive ? "\u2705" : "\u274C");
    _log("info", "Phase 5:", info2.phase5?.sanitizerActive ? "\u2705" : "\u274C");
    console.groupEnd();
    console.group("Resources");
    _log("info", "Managers:", info2.managersActive);
    _log("info", "Plugins:", info2.pluginsActive);
    _log("info", "Snapshots:", info2.snapshotsCount);
    console.groupEnd();
  });
  _register("health", "Executa health check completo", async () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    _log("title", "\n\u{1F3E5} Health Check\n");
    _log("muted", "Executando verifica\xE7\xF5es...\n");
    const health = await _bootstrap.healthCheck();
    const statusIcon = { HEALTHY: "\u2705", WARNING: "\u26A0\uFE0F", ERROR: "\u274C", DEGRADED: "\u{1F7E1}", DISABLED: "\u2B55" };
    _log(health.status === "HEALTHY" ? "success" : "warning", `Status Geral: ${statusIcon[health.status] || "\u2753"} ${health.status}`);
    _log("info", `Vers\xE3o: ${health.version}`);
    _log("info", `Erros: ${health.errorCount}`);
    if (health.bootMetrics) {
      _log("info", `Boot Time: ${health.bootMetrics.totalTime?.toFixed(2)}ms (${health.bootMetrics.rating})`);
    }
    _json(health, "Health Check Completo");
  });
  _register("metrics", "Mostra m\xE9tricas de boot", () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const bootMetrics = _bootstrap.getBootMetrics();
    if (!bootMetrics) return _log("warning", "Boot metrics n\xE3o dispon\xEDvel");
    const report = bootMetrics.getReport();
    _log("title", "\n\u23F1\uFE0F Boot Metrics\n");
    if (report.summary) {
      const summary = report.summary;
      _log("success", `Total Time: ${summary.totalTime.toFixed(2)}ms`);
      _log("info", `Rating: ${summary.rating}`);
    }
    if (report.breakdown) {
      _table(Object.entries(report.breakdown).map(([phase, time]) => ({ phase, time: `${time.toFixed(2)}ms` })), "Breakdown por Fase");
    }
    if (report.bottlenecks?.length > 0) {
      _log("warning", "\n\u26A0\uFE0F Bottlenecks detectados:");
      report.bottlenecks.forEach((b) => _log("warning", `  - ${b.phase}: ${b.duration.toFixed(2)}ms`));
    }
  });
  _register("plugins", "Lista plugins registrados", () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const pluginSystem = _bootstrap.getPluginSystem();
    if (!pluginSystem) return _log("warning", "Plugin system n\xE3o dispon\xEDvel");
    const plugins = pluginSystem.list();
    _log("title", "\n\u{1F50C} Plugins\n");
    if (plugins.length === 0) {
      _log("muted", "Nenhum plugin registrado");
      return;
    }
    _table(plugins.map((p) => ({ id: p.id, name: p.name, state: p.state, version: p.version })));
  });
  _register("snapshots", "Lista snapshots de estado", () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const snapshots = _bootstrap.getStateSnapshots();
    if (!snapshots) return _log("warning", "State snapshots n\xE3o dispon\xEDvel");
    const list = snapshots.list();
    _log("title", "\n\u{1F4F8} State Snapshots\n");
    if (list.length === 0) {
      _log("muted", "Nenhum snapshot salvo");
      return;
    }
    _table(list.map((s) => ({ id: s.id, name: s.name, type: s.type, created: new Date(s.createdAt).toLocaleString() })));
  });
  _register("snapshot", "Cria um novo snapshot", (name = null) => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const snapshots = _bootstrap.getStateSnapshots();
    if (!snapshots) return _log("warning", "State snapshots n\xE3o dispon\xEDvel");
    const id = snapshots.create(name || `manual-${Date.now()}`, "manual");
    _log("success", `\u2705 Snapshot criado: ${id}`);
    return id;
  });
  _register("events", "Mostra eventos recentes", (count = 20) => {
    const eventBusAdapter = _bootstrap?.getEventBusAdapter();
    if (!eventBusAdapter) return _log("warning", "EventBus adapter n\xE3o dispon\xEDvel");
    const history = eventBusAdapter.getHistory?.(count) || [];
    _log("title", `
\u{1F4E1} \xDAltimos ${count} Eventos
`);
    if (history.length === 0) {
      _log("muted", "Nenhum evento no hist\xF3rico");
      return;
    }
    _table(history.map((e) => ({ event: e.event, timestamp: new Date(e.timestamp).toLocaleTimeString(), data: JSON.stringify(e.data).substring(0, 50) })));
  });
  _register("perf", "Mostra m\xE9tricas de performance", () => {
    const perfMonitor = _bootstrap?.getPerformanceMonitor();
    if (!perfMonitor) return _log("warning", "Performance monitor n\xE3o dispon\xEDvel");
    const snapshot = perfMonitor.collect?.() || {};
    _log("title", "\n\u{1F4C8} Performance\n");
    console.group("Memory");
    _log("info", `Used: ${snapshot.memory?.usedMB?.toFixed(2) || "N/A"} MB`);
    _log("info", `Limit: ${snapshot.memory?.limitMB?.toFixed(2) || "N/A"} MB`);
    _log("info", `Leak: ${snapshot.memory?.leak ? "\u26A0\uFE0F Sim" : "\u2705 N\xE3o"}`);
    console.groupEnd();
    console.group("FPS");
    _log("info", `Current: ${snapshot.fps?.current || "N/A"}`);
    _log("info", `Average: ${snapshot.fps?.average?.toFixed(1) || "N/A"}`);
    console.groupEnd();
  });
  _register("config", "Mostra configura\xE7\xE3o atual", () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const config = _bootstrap.getConfig();
    _log("title", "\n\u2699\uFE0F Configura\xE7\xE3o\n");
    _json(config);
  });
  _register("kernel", "Mostra estado do kernel", () => {
    const kernel = _bootstrap?.getKernel();
    if (!kernel) return _log("warning", "Kernel n\xE3o dispon\xEDvel");
    _log("title", "\n\u{1F9E0} Kernel\n");
    _log("info", `State: ${kernel.getState()}`);
    _log("info", `Active Slot: ${kernel.getActiveSlot() || "Nenhum"}`);
    const managers = kernel.listManagers?.() || [];
    _log("info", `Managers: ${managers.length}`);
    if (managers.length > 0) {
      _table(managers.map((m) => ({ name: m })), "Managers Registrados");
    }
  });
  _register("deps", "Mostra mapa de depend\xEAncias", () => {
    const { generateReport } = require("../core/dependency-map.js");
    const report = generateReport();
    _log("title", "\n\u{1F517} Dependency Map\n");
    _log("info", `Total Modules: ${report.totalModules}`);
    _log("success", `Loaded: ${report.loadedModules}`);
    _log("muted", `Not Loaded: ${report.notLoaded}`);
    if (report.circularDependencies?.length > 0) {
      _log("warning", "\n\u26A0\uFE0F Depend\xEAncias circulares:");
      report.circularDependencies.forEach((c) => _log("warning", `  - ${c.cycle.join(" -> ")}`));
    }
  });
  _register("reboot", "Reinicia o sistema", async (preserveState = false) => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    _log("warning", `
\u{1F504} Reiniciando... (preserveState: ${preserveState})
`);
    await _bootstrap.reboot({ preserveState });
    _log("success", "\u2705 Sistema reiniciado");
  });
  _register("clear", "Limpa o console", () => {
    console.clear();
    _log("title", "\u{1F6E0}\uFE0F Container-Main Console");
    _log("muted", `Use ${prefix}.help() para ver comandos dispon\xEDveis`);
  });
  _register("errors", "Mostra erros registrados", () => {
    if (!_bootstrap) return _log("error", "Bootstrap n\xE3o conectado");
    const errors = _bootstrap.getErrors();
    _log("title", "\n\u274C Erros Registrados\n");
    if (errors.length === 0) {
      _log("success", "Nenhum erro registrado");
      return;
    }
    _table(errors.map((e) => ({ context: e.context, message: e.message, time: new Date(e.timestamp).toLocaleString() })));
  });
  _register("ratelimit", "Mostra status do rate limiter", () => {
    const rateLimiter = _bootstrap?.getRateLimiter();
    if (!rateLimiter) return _log("warning", "Rate limiter n\xE3o dispon\xEDvel");
    const metrics = rateLimiter.getMetrics();
    _log("title", "\n\u{1F6A6} Rate Limiter\n");
    _json(metrics);
  });
  _register("sanitize", "Testa sanitiza\xE7\xE3o de input", (input) => {
    const sanitizer = _bootstrap?.getSanitizer();
    if (!sanitizer) return _log("warning", "Sanitizer n\xE3o dispon\xEDvel");
    _log("title", "\n\u{1F9F9} Sanitizer Test\n");
    _log("key", "Input:", input);
    _log("value", "Text:", sanitizer.text(input));
    _log("value", "HTML:", sanitizer.html(input));
    _log("info", "Safe:", sanitizer.isSafe(input) ? "\u2705" : "\u274C");
  });
  const commands = {
    // Injeta dependências
    inject({ bootstrap, eventBus }) {
      _bootstrap = bootstrap;
      _eventBus = eventBus;
      _logger.debug("Console commands connected to bootstrap");
    },
    // Registra comando customizado
    register(name, description, handler) {
      _register(name, description, handler);
      return this;
    },
    // Executa comando
    exec(name, ...args) {
      const cmd = _commands.get(name);
      if (!cmd) {
        _log("error", `Comando n\xE3o encontrado: ${name}`);
        return;
      }
      return cmd.handler(...args);
    },
    // Lista comandos
    list() {
      return Array.from(_commands.keys());
    },
    // Health check
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, commandsCount: _commands.size, connected: !!_bootstrap };
    },
    // Info
    info() {
      return { moduleId: MODULE_ID, version: VERSION, prefix, commands: Array.from(_commands.keys()) };
    }
  };
  if (typeof window !== "undefined") {
    if (enableInProduction || getEnv() !== ENV.PRODUCTION) {
      const globalObj = {};
      for (const [name, cmd] of _commands) {
        globalObj[name] = cmd.handler;
      }
      globalObj._commands = commands;
      window[prefix] = globalObj;
      _logger.debug(`Console commands exposed as window.${prefix}`);
    }
  }
  return commands;
}
let _instance = null;
function getConsoleCommands(options = {}) {
  if (!_instance) {
    _instance = createConsoleCommands(options);
  }
  return _instance;
}
function resetConsoleCommands() {
  _instance = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance && _instance.healthCheck) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var console_commands_default = {
  VERSION,
  MODULE_ID,
  createConsoleCommands,
  getConsoleCommands,
  resetConsoleCommands,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createConsoleCommands,
  console_commands_default as default,
  getConsoleCommands,
  healthCheck,
  info,
  resetConsoleCommands
};
