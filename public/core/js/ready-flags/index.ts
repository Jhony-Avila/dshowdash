// ReadyFlags - Global Readiness Provider v1.1.0-P24
// DEPENDENCY CONTRACT — BARREL FILE
// @version 1.1.0-P24
// @changelog v1.1.0-P24 - Added p24Instrumented compliance
// Provider global para sincronização de readiness entre módulos
// Sem dependências externas (não depende de EventBus)
'use strict';

export const MODULE_ID = 'ready-flags';
export const VERSION = '1.1.0-P2-ENTERPRISE';

interface FlagEntry {
  ready: boolean;
  timestamp: number;
}

const _flags: Map<string, FlagEntry> = new Map();
const _waiters: Map<string, Array<(result: boolean) => void>> = new Map();
let _initTime: number | null = null;

function _notifyWaiters(flag: string) { const waiters = _waiters.get(flag); if (waiters && waiters.length > 0) { waiters.forEach(resolve => resolve(true)); _waiters.delete(flag); } }

const ReadyFlags = {
  setReady(flag: string, value = true) { if (typeof flag !== 'string' || !flag) return false; const wasReady = _flags.get(flag); _flags.set(flag, { ready: Boolean(value), timestamp: Date.now() }); if (value && !wasReady?.ready) { _notifyWaiters(flag); } return true; },
  isReady(flag: string) { if (typeof flag !== 'string' || !flag) return false; const entry = _flags.get(flag); return entry?.ready === true; },
  waitFor(flag: string, timeout = 5000): Promise<boolean> { return new Promise<boolean>((resolve) => { try { if (this.isReady(flag)) { resolve(true); return; } const timeoutId = setTimeout(() => { const waiters = _waiters.get(flag); if (waiters) { const idx = waiters.indexOf(resolveWrapper); if (idx !== -1) waiters.splice(idx, 1); } resolve(false); }, timeout); const resolveWrapper = (result: boolean) => { clearTimeout(timeoutId); resolve(result); }; if (!_waiters.has(flag)) { _waiters.set(flag, []); } _waiters.get(flag)!.push(resolveWrapper); } catch (e) { resolve(false); } }); },
  getAll(): Record<string, FlagEntry> { const result: Record<string, FlagEntry> = {}; _flags.forEach((value, key) => { result[key] = value; }); return result; },
  reset() { _flags.clear(); _waiters.clear(); },
  info() { const allFlags = this.getAll(); const readyCount = Object.values(allFlags).filter((f: { ready: boolean; timestamp: number }) => f.ready).length; return { moduleId: MODULE_ID, version: VERSION, flagsCount: _flags.size, readyCount, pendingWaiters: Array.from(_waiters.keys()), uptime: _initTime ? Date.now() - _initTime : 0, flags: allFlags, p24Instrumented: true, timestamp: Date.now() }; },
  healthCheck() { return { status: 'HEALTHY', score: 1, maxScore: 1, scoreDisplay: '1/1', moduleId: MODULE_ID, version: VERSION, flagsCount: _flags.size, p24Instrumented: true, timestamp: Date.now() }; },
  getVersion() { return VERSION; },
  getModuleId() { return MODULE_ID; },
  set(flag: string, value = true) { return this.setReady(flag, value); },
  get(flag: string) { return this.isReady(flag); },
  VERSION, MODULE_ID
};

_initTime = Date.now();

if (typeof window !== 'undefined') { if (!window.ReadyFlags) { window.ReadyFlags = ReadyFlags; } }

export { ReadyFlags };
export default ReadyFlags;
