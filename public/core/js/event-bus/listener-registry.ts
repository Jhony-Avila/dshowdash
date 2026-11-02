// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.listener-registry
// PURPOSE: EventBus Listener Registry - Dedupe & Management
// ───────────────────────────────────────────────────────────────
// PROVIDES: ListenerRegistry class, isDuplicate, register, unregister
// @changelog v8.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'core.js.event-bus.listener-registry';
export const VERSION = '8.3.0-P2-ENTERPRISE';

interface RegistryStats {
  prevented: number;
}

export class ListenerRegistry {
  private _registry: Map<string, string>;
  private _stats: RegistryStats;

  constructor() { this._registry = new Map<string, string>(); this._stats = { prevented: 0 }; }

  generateKey(eventName: string, handler: (...args: unknown[]) => unknown, priority: number): string { const handlerStr: string = handler.toString().slice(0, 200); return `${eventName}|${handlerStr}|${priority}`; }
  isDuplicate(eventName: string, handler: (...args: unknown[]) => unknown, priority: number): boolean { const key: string = this.generateKey(eventName, handler, priority); return this._registry.has(key); }
  register(eventName: string, handler: (...args: unknown[]) => unknown, priority: number, listenerId: string): void { const key: string = this.generateKey(eventName, handler, priority); this._registry.set(key, listenerId); }
  unregister(eventName: string, handler: (...args: unknown[]) => unknown, priority: number): void { const key: string = this.generateKey(eventName, handler, priority); this._registry.delete(key); }
  preventDuplicate(): void { this._stats.prevented++; }
  clear(): void { this._registry.clear(); }
  get size(): number { return this._registry.size; }
  get preventedCount(): number { return this._stats.prevented; }
  getStats(): { registrySize: number; prevented: number } { return { registrySize: this._registry.size, prevented: this._stats.prevented }; }
}

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default ListenerRegistry;
