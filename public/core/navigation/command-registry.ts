// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.navigation.command-registry
// PURPOSE: Enterprise Intent-Based Commands
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts, navigation-intent, COMMAND_EVENTS
// PROVIDES: registerCommand, executeCommand, getCommands, healthCheck
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.4.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { createRouteIntent, createBackIntent, createForwardIntent, createHomeIntent, createPanelIntent } from './navigation-intent.js';
import type { NavigationIntent, NavigationIntentMeta } from './navigation-intent.js';
import { COMMAND_EVENTS } from '/core/runtime/events/catalog/command.events.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';

const MODULE_ID = 'core.navigation.command-registry';
const VERSION = '1.5.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = (): void => { Ports.init(); };
const _getPort = (name: string): unknown => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>): boolean => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

interface CommandInput {
  path?: string;
  route?: string;
  state?: Record<string, unknown>;
  panelId?: string;
  panel?: string;
  [key: string]: unknown;
}

interface CommandDef {
  id: string;
  title?: string;
  category?: string;
  shortcuts?: string[];
  permissions?: string[];
  telemetryEvent?: string;
  createIntent?: (input: CommandInput, meta: NavigationIntentMeta) => NavigationIntent;
  execute?: (input: CommandInput, meta: NavigationIntentMeta) => { ok: boolean; [key: string]: unknown };
}

interface CommandRegistry {
  [id: string]: CommandDef;
}

const _state: { initialized: boolean; commands: CommandRegistry; history: { commandId: string; input: CommandInput; result: unknown; timestamp: number; latency: number }[]; maxHistory: number } = { initialized: false, commands: {}, history: [], maxHistory: 100 };
const _metrics = { registered: 0, executed: 0, blocked: 0, errors: 0 };

const _track = (eventName: string, payload: Record<string, unknown>): void => { try { const tk = _getPort('telemetry') as { track?: (event: string, data: unknown) => void } | null; tk?.track?.(eventName, { moduleId: MODULE_ID, ...payload }); } catch (e) { } };
const _emit = (eventName: string, data: Record<string, unknown> = {}): void => { const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null; eb?.emit?.(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data }); };

const DEFAULT_COMMANDS: CommandRegistry = {
  'nav:home': { id: 'nav:home', title: 'Ir para Home', category: 'navigation', shortcuts: ['Alt+H', 'g h'], permissions: [], telemetryEvent: 'command:nav:home', createIntent: (input: CommandInput, meta: NavigationIntentMeta) => createHomeIntent({ meta }) },
  'nav:back': { id: 'nav:back', title: 'Voltar', category: 'navigation', shortcuts: ['Alt+Left', 'Backspace'], permissions: [], telemetryEvent: 'command:nav:back', createIntent: (input: CommandInput, meta: NavigationIntentMeta) => createBackIntent({ meta }) },
  'nav:forward': { id: 'nav:forward', title: 'Avançar', category: 'navigation', shortcuts: ['Alt+Right'], permissions: [], telemetryEvent: 'command:nav:forward', createIntent: (input: CommandInput, meta: NavigationIntentMeta) => createForwardIntent({ meta }) },
  'nav:goto': { id: 'nav:goto', title: 'Ir para rota', category: 'navigation', shortcuts: ['Ctrl+G'], permissions: [], telemetryEvent: 'command:nav:goto', createIntent: (input: CommandInput, meta: NavigationIntentMeta) => createRouteIntent(input.path || input.route || '#/', { meta, state: input.state }) },
  'nav:panel': { id: 'nav:panel', title: 'Abrir painel', category: 'navigation', shortcuts: ['Ctrl+P'], permissions: [], telemetryEvent: 'command:nav:panel', createIntent: (input: CommandInput, meta: NavigationIntentMeta) => createPanelIntent(input.panelId || input.panel || '', { meta, state: input.state }) },
  'nav:refresh': { id: 'nav:refresh', title: 'Recarregar', category: 'navigation', shortcuts: ['F5', 'Ctrl+R'], permissions: [], telemetryEvent: 'command:nav:refresh', execute: (input: CommandInput, meta: NavigationIntentMeta) => { if (typeof window !== 'undefined') window.location.reload(); return { ok: true }; } }
};

const registerCommand = (commandDef: CommandDef): { ok: boolean; error?: string; commandId?: string } => { if (!commandDef?.id) return { ok: false, error: 'Command must have id' }; _state.commands[commandDef.id] = { permissions: [], category: 'general', ...commandDef }; _metrics.registered++; _track('command:registered', { commandId: commandDef.id, category: commandDef.category || 'general' }); return { ok: true, commandId: commandDef.id }; };
const getCommand = (commandId: string): CommandDef | null => _state.commands[commandId] || null;
const listCommands = (filter: { category?: string } | null | undefined): { id: string; title?: string; category?: string; shortcuts: string[] }[] => { const list: { id: string; title?: string; category?: string; shortcuts: string[] }[] = []; for (const id in _state.commands) { if (_state.commands.hasOwnProperty(id)) { const cmd = _state.commands[id]; if (!filter?.category || cmd.category === filter.category) list.push({ id: cmd.id, title: cmd.title, category: cmd.category, shortcuts: cmd.shortcuts || [] }); } } return list; };

const _checkPermissions = (command: CommandDef): { allowed: boolean; reason?: string } => { if (!command.permissions?.length) return { allowed: true }; const pg = _getPort('permissionsGuard') as { hasPermission?: (perm: string) => boolean } | null; if (!pg?.hasPermission) return { allowed: true }; for (const perm of command.permissions) { if (!pg.hasPermission(perm)) return { allowed: false, reason: `Missing permission: ${perm}` }; } return { allowed: true }; };

const execute = (commandId: string, input: CommandInput = {}, meta?: Partial<NavigationIntentMeta>): { ok: boolean; latency?: number; error?: string; blocked?: boolean; reason?: string } => {
  const startTime = Date.now(); const resolvedMeta: NavigationIntentMeta = { source: 'command-registry', ...meta };
  const command = _state.commands[commandId]; if (!command) { _metrics.errors++; return { ok: false, error: `Command not found: ${commandId}` }; }
  const permCheck = _checkPermissions(command); if (!permCheck.allowed) { _metrics.blocked++; _emit(COMMAND_EVENTS.BLOCKED, { commandId, reason: permCheck.reason }); _track('command:blocked', { commandId, reason: permCheck.reason || '' }); return { ok: false, blocked: true, reason: permCheck.reason }; }
  _emit(COMMAND_EVENTS.EXECUTE_START, { commandId, input: input as unknown as Record<string, unknown> });
  try {
    let result: { ok: boolean; [key: string]: unknown } | undefined;
    if (command.createIntent) { const intent = command.createIntent(input, resolvedMeta); const broker = _getPort('navigationBroker') as { processIntent?: (intent: NavigationIntent) => { ok: boolean; [key: string]: unknown } } | null; if (broker?.processIntent) result = broker.processIntent(intent); else { const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null; if (eb?.emit) { eb.emit(NAV_INTENTS.NAVIGATE, intent); result = { ok: true, via: 'eventBus', intentId: intent.intentId }; } else result = { ok: false, error: 'No NavigationBroker or EventBus' }; } }
    else if (command.execute) result = command.execute(input, resolvedMeta);
    else result = { ok: false, error: 'Command has no execute or createIntent' };
    const latency = Date.now() - startTime;
    _state.history.unshift({ commandId, input, result, timestamp: startTime, latency }); if (_state.history.length > _state.maxHistory) _state.history.pop();
    if (result && result.ok) { _metrics.executed++; _emit(COMMAND_EVENTS.EXECUTE_SUCCESS, { commandId, latency }); _track(command.telemetryEvent || 'command:executed', { commandId, latency }); }
    else { _metrics.errors++; _emit(COMMAND_EVENTS.EXECUTE_ERROR, { commandId, error: result?.error }); _track('command:error', { commandId, error: result?.error as string || '' }); }
    return { latency, ...(result || { ok: false }) };
  } catch (e) { _metrics.errors++; _emit(COMMAND_EVENTS.EXECUTE_ERROR, { commandId, error: (e as Error).message }); _track('command:error', { commandId, error: (e as Error).message }); return { ok: false, error: (e as Error).message }; }
};

// @ts-expect-error strict migration — TS2532
const executeByShortcut = (shortcut: string, input: CommandInput, meta?: Partial<NavigationIntentMeta>): { ok: boolean; error?: string } => { for (const id in _state.commands) { const cmd = _state.commands[id]; if (cmd.shortcuts?.indexOf(shortcut) >= 0) return execute(id, input, meta); } return { ok: false, error: `No command for shortcut: ${shortcut}` }; };
const getHistory = (limit: number): { commandId: string; input: CommandInput; result: unknown; timestamp: number; latency: number }[] => _state.history.slice(0, limit || 20);

const init = (ctx: { ports?: Record<string, unknown> } | null): { ok: boolean; alreadyInitialized?: boolean; version?: string; commandsCount?: number } => { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx?.ports) injectPorts(ctx.ports); for (const id in DEFAULT_COMMANDS) { if (DEFAULT_COMMANDS.hasOwnProperty(id)) registerCommand(DEFAULT_COMMANDS[id]); } const tk = _getPort('telemetry') as { register?: (info: Record<string, unknown>) => void } | null; tk?.register?.({ id: MODULE_ID, version: VERSION, healthCheck, info }); _state.initialized = true; _emit(COMMAND_EVENTS.REGISTRY_READY, { version: VERSION, commandsCount: Object.keys(_state.commands).length }); _track('command-registry:init', { version: VERSION }); return { ok: true, version: VERSION, commandsCount: Object.keys(_state.commands).length }; };
const cleanup = (): { ok: boolean } => { _state.commands = {}; _state.history = []; _state.initialized = false; return { ok: true }; };
const healthCheck = () => { let score = _state.initialized ? 100 : 50; const issues: { code: string; severity: string; message: string }[] = []; if (!_state.initialized) issues.push({ code: 'NOT_INIT', severity: 'warn', message: 'Not initialized' }); if (!_getPort('navigationBroker')) { issues.push({ code: 'NO_BROKER', severity: 'warn', message: 'NavigationBroker not available' }); score -= 15; } const errorRate = _metrics.executed > 0 ? _metrics.errors / _metrics.executed : 0; if (errorRate > 0.1) { issues.push({ code: 'HIGH_ERROR_RATE', severity: 'warn', message: `${Math.round(errorRate * 100)}% errors` }); score -= 10; } const status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY'; return { status, score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'warn' }, hasBroker: { ok: !!_getPort('navigationBroker'), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, issues, metrics: _metrics }; };
const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, commandsCount: Object.keys(_state.commands).length, historySize: _state.history.length, metrics: _metrics, portsInitialized: Ports.isInitialized() });

export { MODULE_ID, VERSION, init, cleanup, registerCommand, getCommand, listCommands, execute, executeByShortcut, getHistory, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, registerCommand, getCommand, listCommands, execute, executeByShortcut, getHistory, healthCheck, info, injectPorts, getPorts };
