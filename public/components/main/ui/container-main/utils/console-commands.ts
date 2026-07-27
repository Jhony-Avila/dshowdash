
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE5-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:console-commands
// PURPOSE: Console Commands - CLI de diagnóstico no console
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//   getEnv, ENV from ../config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createConsoleCommands() — exported function
//   getConsoleCommands() — exported function
//   resetConsoleCommands() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';
import { getEnv, ENV } from '../config.js';

export const VERSION = '1.0.0-PHASE5';
export const MODULE_ID = 'container-main:console-commands';

// Cria o sistema de comandos
export function createConsoleCommands(options: Record<string, unknown> = {}) {
  const {
    prefix = 'cm',
    enableInProduction = false,
    colors = true
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _bootstrap: Record<string, ((...args: unknown[]) => unknown)> | null = null;
  let _eventBus = null;
  let _commands = new Map<string, Record<string, unknown>>();

  // Cores para console
  const COLORS = {
    title: 'color: #007acc; font-weight: bold; font-size: 14px;',
    subtitle: 'color: #6c757d; font-weight: bold;',
    success: 'color: #28a745; font-weight: bold;',
    warning: 'color: #ffc107; font-weight: bold;',
    error: 'color: #dc3545; font-weight: bold;',
    info: 'color: #17a2b8;',
    muted: 'color: #6c757d;',
    key: 'color: #9cdcfe;',
    value: 'color: #ce9178;',
    reset: ''
  };

  // Log colorido
  function _log(style: string, ...args: unknown[]) {
    if (colors) {
      console.log(`%c${args[0]}`, (COLORS as Record<string, string>)[style] || '', ...args.slice(1));
    } else {
      console.log(...args);
    }
  }

  // Formata tabela
  function _table(data: unknown, title: string | null = null) {
    if (title) _log('subtitle', `\n📋 ${title}`);
    console.table(data);
  }

  // Formata JSON
  function _json(data: unknown, title: string | null = null) {
    if (title) _log('subtitle', `\n📋 ${title}`);
    console.dir(data, { depth: 4 });
  }

  // Registra comando
  function _register(name: string, description: string, handler: (...args: unknown[]) => void) {
    _commands.set(name, { name, description, handler });
  }

  // === COMANDOS PADRÃO ===

  // Help
  _register('help', 'Lista todos os comandos disponíveis', () => {
    _log('title', '\n🛠️ Container-Main Console Commands\n');
    _log('muted', `Prefix: ${prefix}. Use ${prefix}.help() para esta lista.\n`);
    
    const rows = [];
    for (const [name, cmd] of _commands) {
      rows.push({ command: `${prefix}.${name}()`, description: cmd.description });
    }
    _table(rows, 'Comandos Disponíveis');
  });

  // Status
  _register('status', 'Mostra status geral do sistema', () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    const info = _bootstrap.info() as Record<string, unknown>;
    _log('title', '\n📊 System Status\n');
    
    console.group('Bootstrap');
    _log('key', 'State:', info.state);
    _log('key', 'Version:', info.version);
    _log('key', 'Kernel:', info.kernelState || 'N/A');
    console.groupEnd();
    
    console.group('Phases');
    // @ts-expect-error TS migration - TS2339
    _log('info', 'Phase 1:', info.phase1?.loggerActive ? '✅' : '❌');
    // @ts-expect-error TS migration - TS2339
    _log('info', 'Phase 2:', info.phase2?.performanceMonitorActive ? '✅' : '❌');
    // @ts-expect-error TS migration - TS2339
    _log('info', 'Phase 3:', info.phase3?.configIntegrated ? '✅' : '❌');
    // @ts-expect-error TS migration - TS2339
    _log('info', 'Phase 4:', info.phase4?.pluginSystemActive ? '✅' : '❌');
    // @ts-expect-error TS migration - TS2339
    _log('info', 'Phase 5:', info.phase5?.sanitizerActive ? '✅' : '❌');
    console.groupEnd();
    
    console.group('Resources');
    _log('info', 'Managers:', info.managersActive);
    _log('info', 'Plugins:', info.pluginsActive);
    _log('info', 'Snapshots:', info.snapshotsCount);
    console.groupEnd();
  });

  // Health
  _register('health', 'Executa health check completo', async () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    _log('title', '\n🏥 Health Check\n');
    _log('muted', 'Executando verificações...\n');
    
    const health = await _bootstrap.healthCheck() as Record<string, unknown>;
    
    const statusIcon = { HEALTHY: '✅', WARNING: '⚠️', ERROR: '❌', DEGRADED: '🟡', DISABLED: '⭕' };
    
    // @ts-expect-error TS migration - TS2538
    _log(health.status === 'HEALTHY' ? 'success' : 'warning', `Status Geral: ${(statusIcon as Record<string, unknown>)[health.status] || '❓'} ${health.status}`);
    _log('info', `Versão: ${health.version}`);
    _log('info', `Erros: ${health.errorCount}`);
    
    if (health.bootMetrics) {
      // @ts-expect-error TS migration - TS2339
      _log('info', `Boot Time: ${(health.bootMetrics as Record<string, unknown>).totalTime?.toFixed(2)}ms (${health.bootMetrics.rating})`);
    }
    
    _json(health, 'Health Check Completo');
  });

  // Boot metrics
  _register('metrics', 'Mostra métricas de boot', () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    const bootMetrics = _bootstrap.getBootMetrics() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!bootMetrics) return _log('warning', 'Boot metrics não disponível');

    const report = bootMetrics.getReport() as Record<string, unknown>;
    _log('title', '\n⏱️ Boot Metrics\n');
    
    if (report.summary) {
      const summary = report.summary as Record<string, unknown>;
      _log('success', `Total Time: ${(summary.totalTime as number).toFixed(2)}ms`);
      _log('info', `Rating: ${summary.rating}`);
    }

    if (report.breakdown) {
      _table(Object.entries(report.breakdown as Record<string, number>).map(([phase, time]) => ({ phase, time: `${time.toFixed(2)}ms` })), 'Breakdown por Fase');
    }

    if ((report.bottlenecks as unknown[])?.length > 0) {
      _log('warning', '\n⚠️ Bottlenecks detectados:');
      (report.bottlenecks as Array<Record<string, unknown>>).forEach((b) => _log('warning', `  - ${b.phase}: ${(b.duration as number).toFixed(2)}ms`));
    }
  });

  // Plugins
  _register('plugins', 'Lista plugins registrados', () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    const pluginSystem = _bootstrap.getPluginSystem() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!pluginSystem) return _log('warning', 'Plugin system não disponível');

    const plugins = pluginSystem.list() as Array<Record<string, unknown>>;
    _log('title', '\n🔌 Plugins\n');
    
    if (plugins.length === 0) {
      _log('muted', 'Nenhum plugin registrado');
      return;
    }
    
    _table(plugins.map((p) => ({ id: p.id, name: p.name, state: p.state, version: p.version })));
  });

  // Snapshots
  _register('snapshots', 'Lista snapshots de estado', () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    const snapshots = _bootstrap.getStateSnapshots() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!snapshots) return _log('warning', 'State snapshots não disponível');

    const list = snapshots.list() as Array<Record<string, unknown>>;
    _log('title', '\n📸 State Snapshots\n');
    
    if (list.length === 0) {
      _log('muted', 'Nenhum snapshot salvo');
      return;
    }
    
    _table(list.map((s) => ({ id: s.id, name: s.name, type: s.type, created: new Date(s.createdAt as string).toLocaleString() })));
  });

  // Snapshot
  // @ts-expect-error strict migration — TS2345
  _register('snapshot', 'Cria um novo snapshot', (name: string | null = null) => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');

    const snapshots = _bootstrap.getStateSnapshots() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!snapshots) return _log('warning', 'State snapshots não disponível');

    const id = snapshots.create(name || `manual-${Date.now()}`, 'manual');
    _log('success', `✅ Snapshot criado: ${id}`);
    return id;
  });

  // Events
  _register('events', 'Mostra eventos recentes', (count = 20) => {
    const eventBusAdapter = _bootstrap?.getEventBusAdapter() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!eventBusAdapter) return _log('warning', 'EventBus adapter não disponível');

    const history = (eventBusAdapter.getHistory?.(count) || []) as Array<Record<string, unknown>>;
    _log('title', `\n📡 Últimos ${count} Eventos\n`);
    
    if (history.length === 0) {
      _log('muted', 'Nenhum evento no histórico');
      return;
    }
    
    _table(history.map((e) => ({ event: e.event, timestamp: new Date(e.timestamp as string).toLocaleTimeString(), data: JSON.stringify(e.data).substring(0, 50) })));
  });

  // Performance
  _register('perf', 'Mostra métricas de performance', () => {
    const perfMonitor = _bootstrap?.getPerformanceMonitor() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!perfMonitor) return _log('warning', 'Performance monitor não disponível');

    const snapshot = (perfMonitor.collect?.() || {}) as Record<string, Record<string, unknown>>;
    _log('title', '\n📈 Performance\n');
    
    console.group('Memory');
    // @ts-expect-error TS migration - TS2339
    _log('info', `Used: ${snapshot.memory?.usedMB?.toFixed(2) || 'N/A'} MB`);
    // @ts-expect-error TS migration - TS2339
    _log('info', `Limit: ${snapshot.memory?.limitMB?.toFixed(2) || 'N/A'} MB`);
    _log('info', `Leak: ${snapshot.memory?.leak ? '⚠️ Sim' : '✅ Não'}`);
    console.groupEnd();
    
    console.group('FPS');
    _log('info', `Current: ${snapshot.fps?.current || 'N/A'}`);
    // @ts-expect-error TS migration - TS2339
    _log('info', `Average: ${snapshot.fps?.average?.toFixed(1) || 'N/A'}`);
    console.groupEnd();
  });

  // Config
  _register('config', 'Mostra configuração atual', () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    const config = _bootstrap.getConfig() as Record<string, unknown>;
    _log('title', '\n⚙️ Configuração\n');
    _json(config);
  });

  // Kernel
  _register('kernel', 'Mostra estado do kernel', () => {
    const kernel = _bootstrap?.getKernel() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!kernel) return _log('warning', 'Kernel não disponível');

    _log('title', '\n🧠 Kernel\n');
    _log('info', `State: ${kernel.getState()}`);
    _log('info', `Active Slot: ${kernel.getActiveSlot() || 'Nenhum'}`);

    const managers = (kernel.listManagers?.() || []) as string[];
    _log('info', `Managers: ${managers.length}`);
    
    if (managers.length > 0) {
      _table(managers.map((m) => ({ name: m })), 'Managers Registrados');
    }
  });

  // Dependencies
  _register('deps', 'Mostra mapa de dependências', () => {
    const { generateReport } = require('../core/dependency-map.js');
    const report = generateReport();
    
    _log('title', '\n🔗 Dependency Map\n');
    _log('info', `Total Modules: ${report.totalModules}`);
    _log('success', `Loaded: ${report.loadedModules}`);
    _log('muted', `Not Loaded: ${report.notLoaded}`);
    
    if (report.circularDependencies?.length > 0) {
      _log('warning', '\n⚠️ Dependências circulares:');
      (report.circularDependencies as Array<Record<string, unknown>>).forEach((c) => _log('warning', `  - ${(c.cycle as string[]).join(' -> ')}`));
    }
  });

  // Reboot
  _register('reboot', 'Reinicia o sistema', async (preserveState = false) => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    _log('warning', `\n🔄 Reiniciando... (preserveState: ${preserveState})\n`);
    await (_bootstrap.reboot as (...args: unknown[]) => Promise<unknown>)({ preserveState });
    _log('success', '✅ Sistema reiniciado');
  });

  // Clear
  _register('clear', 'Limpa o console', () => {
    console.clear();
    _log('title', '🛠️ Container-Main Console');
    _log('muted', `Use ${prefix}.help() para ver comandos disponíveis`);
  });

  // Errors
  _register('errors', 'Mostra erros registrados', () => {
    if (!_bootstrap) return _log('error', 'Bootstrap não conectado');
    
    const errors = _bootstrap.getErrors() as Array<Record<string, unknown>>;
    _log('title', '\n❌ Erros Registrados\n');
    
    if (errors.length === 0) {
      _log('success', 'Nenhum erro registrado');
      return;
    }
    
    _table(errors.map((e) => ({ context: e.context, message: e.message, time: new Date(e.timestamp as string).toLocaleString() })));
  });

  // Rate limiter
  _register('ratelimit', 'Mostra status do rate limiter', () => {
    const rateLimiter = _bootstrap?.getRateLimiter() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!rateLimiter) return _log('warning', 'Rate limiter não disponível');

    const metrics = rateLimiter.getMetrics();
    _log('title', '\n🚦 Rate Limiter\n');
    _json(metrics);
  });

  // Sanitizer
  // @ts-expect-error strict migration — TS2345
  _register('sanitize', 'Testa sanitização de input', (input: string) => {
    const sanitizer = _bootstrap?.getSanitizer() as Record<string, ((...args: unknown[]) => unknown)> | null;
    if (!sanitizer) return _log('warning', 'Sanitizer não disponível');

    _log('title', '\n🧹 Sanitizer Test\n');
    _log('key', 'Input:', input);
    _log('value', 'Text:', sanitizer.text(input));
    _log('value', 'HTML:', sanitizer.html(input));
    _log('info', 'Safe:', sanitizer.isSafe(input) ? '✅' : '❌');
  });

  const commands = {
    // Injeta dependências
    inject({ bootstrap, eventBus }: Record<string, unknown>) {
      // @ts-expect-error TS migration - TS2322
      _bootstrap = bootstrap;
      _eventBus = eventBus;
      _logger.debug('Console commands connected to bootstrap');
    },

    // Registra comando customizado
    register(name: string, description: string, handler: (...args: unknown[]) => void) {
      _register(name, description, handler);
      return this;
    },

    // Executa comando
    exec(name: string, ...args: unknown[]) {
      const cmd = _commands.get(name);
      if (!cmd) {
        _log('error', `Comando não encontrado: ${name}`);
        return;
      }
      return (cmd.handler as (...args: unknown[]) => unknown)(...args);
    },

    // Lista comandos
    list() {
      return Array.from(_commands.keys());
    },

    // Health check
    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, commandsCount: _commands.size, connected: !!_bootstrap };
    },

    // Info
    info() {
      return { moduleId: MODULE_ID, version: VERSION, prefix, commands: Array.from(_commands.keys()) };
    }
  };

  // Expõe globalmente
  if (typeof window !== 'undefined') {
    if (enableInProduction || getEnv() !== ENV.PRODUCTION) {
      const globalObj = {};
      for (const [name, cmd] of _commands) {
        (globalObj as Record<string, unknown>)[name] = cmd.handler;
      }
      (globalObj as any)._commands = commands;
      (window as any)[prefix as string] = globalObj;
      _logger.debug(`Console commands exposed as window.${prefix}`);
    }
  }

  return commands;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getConsoleCommands(options = {}) {
  if (!_instance) {
    _instance = createConsoleCommands(options);
  }
  return _instance;
}

export function resetConsoleCommands() {
  _instance = null;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  if (_instance && _instance.healthCheck) return (_instance.healthCheck as () => Record<string, unknown>)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  createConsoleCommands, getConsoleCommands, resetConsoleCommands,
  info, healthCheck
};
