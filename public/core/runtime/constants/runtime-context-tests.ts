// Migrado para TypeScript: 2026-02-25
// RuntimeContext Unit Tests - Validacao em runtime
// DEPENDENCY CONTRACT — Runtime constant module
// @version 1.1.0
// @description Suite de testes executavel via DevTools para validar RuntimeContext
// @melhoria #11 - Testes unitarios para RuntimeContext
// @changelog v1.1.0 - Fix: usar window.RuntimeContext (nao __runtimeContext), adicionar testNotifyUpdate
'use strict';

export const MODULE_ID = 'runtime-context-tests' as const;
export const VERSION = '1.1.1-P2-ENTERPRISE' as const;

interface TestResult {
  test: string;
  passed: boolean;
  detail: string;
  timestamp: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  score: string;
  results: TestResult[];
  timestamp: number;
}

interface RuntimeContextTestsInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  testsRun: number;
  passed: number;
  failed: number;
}

interface RuntimeContextAPI {
  getSnapshot?: () => Record<string, unknown>;
  getMode?: () => string;
  getPhase?: () => string;
  isReady?: () => boolean;
  isAuthenticated?: () => boolean;
  subscribe?: (cb: () => void) => () => void;
  healthCheck?: () => Record<string, unknown>;
  info?: () => Record<string, unknown>;
  notifyUpdate?: (trigger: string) => void;
  canEnableFeature?: (feature: string) => boolean;
  canAttemptRecovery?: () => boolean;
  replayReady?: () => void;
  replayLastUpdate?: () => void;
  subscribeWithReplay?: (cb: (...args: unknown[]) => void, opts: Record<string, boolean>) => () => void;
  getEventHistory?: (limit: number) => unknown[];
  hasEmittedReady?: () => boolean;
  [key: string]: unknown;
}

let _results: TestResult[] = [];

function _assert(name: string, condition: boolean, detail?: string): void {
  _results.push({
    test: name,
    passed: !!condition,
    detail: detail || (condition ? 'OK' : 'FAILED'),
    timestamp: Date.now()
  });
}

function _getRC(): RuntimeContextAPI | null {
  if (typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>)).RuntimeContext) return ((window as unknown as Record<string, unknown>)).RuntimeContext as RuntimeContextAPI;
  return null;
}

export function testSnapshotStructure(): void {
  const rc = _getRC();
  if (!rc) { _assert('snapshot-available', false, 'RuntimeContext not found on window.RuntimeContext'); return; }
  const snap = rc.getSnapshot ? rc.getSnapshot() : null;
  _assert('snapshot-exists', !!snap, snap ? 'OK' : 'null');
  if (!snap) return;
  _assert('snapshot-has-mode', snap.mode !== undefined, `mode=${snap.mode}`);
  _assert('snapshot-has-authenticated', snap.authenticated !== undefined, `auth=${snap.authenticated}`);
  _assert('snapshot-has-phase', snap.phase !== undefined, `phase=${snap.phase}`);
  _assert('snapshot-has-ready', snap.ready !== undefined, `ready=${snap.ready}`);
  _assert('snapshot-has-healthy', snap.healthy !== undefined, `healthy=${snap.healthy}`);
  _assert('snapshot-has-capabilities', snap.capabilities !== undefined, `caps=${JSON.stringify(snap.capabilities)}`);
  _assert('snapshot-has-timestamp', typeof snap.timestamp === 'number', `ts=${snap.timestamp}`);
}

export function testModeValues(): void {
  const rc = _getRC();
  if (!rc) return;
  const snap = rc.getSnapshot ? rc.getSnapshot() : null;
  if (!snap) return;
  const validModes = ['INITIALIZING', 'NORMAL', 'DEGRADED', 'MAINTENANCE', 'FAILED', 'RECOVERY'];
  _assert('mode-is-valid', validModes.indexOf(snap.mode as string) !== -1, `mode=${snap.mode}`);
  const validPhases = ['initializing', 'booting', 'ready', 'error', 'shutdown'];
  _assert('phase-is-valid', validPhases.indexOf(snap.phase as string) !== -1, `phase=${snap.phase}`);
}

export function testQueryMethods(): void {
  const rc = _getRC();
  if (!rc) return;
  _assert('has-getMode', typeof rc.getMode === 'function');
  _assert('has-getPhase', typeof rc.getPhase === 'function');
  _assert('has-isReady', typeof rc.isReady === 'function');
  _assert('has-isAuthenticated', typeof rc.isAuthenticated === 'function');
  _assert('has-getSnapshot', typeof rc.getSnapshot === 'function');
  _assert('has-subscribe', typeof rc.subscribe === 'function');
  _assert('has-healthCheck', typeof rc.healthCheck === 'function');
  _assert('has-info', typeof rc.info === 'function');
  _assert('has-notifyUpdate', typeof rc.notifyUpdate === 'function');
  _assert('has-canEnableFeature', typeof rc.canEnableFeature === 'function');
  _assert('has-canAttemptRecovery', typeof rc.canAttemptRecovery === 'function');
}

export function testReplayAPI(): void {
  const rc = _getRC();
  if (!rc) return;
  _assert('has-replayReady', typeof rc.replayReady === 'function');
  _assert('has-replayLastUpdate', typeof rc.replayLastUpdate === 'function');
  _assert('has-subscribeWithReplay', typeof rc.subscribeWithReplay === 'function');
  _assert('has-getEventHistory', typeof rc.getEventHistory === 'function');
  _assert('has-hasEmittedReady', typeof rc.hasEmittedReady === 'function');

  // Testar hasEmittedReady retorna boolean
  const readyResult = rc.hasEmittedReady!();
  _assert('hasEmittedReady-returns-boolean', typeof readyResult === 'boolean', `value=${readyResult}`);

  // Testar getEventHistory retorna array
  const history = rc.getEventHistory!(3);
  _assert('getEventHistory-returns-array', Array.isArray(history), `length=${history ? history.length : 'null'}`);
}

export function testHealthCheck(): void {
  const rc = _getRC();
  if (!rc) return;
  const health = rc.healthCheck!();
  _assert('healthCheck-returns-object', typeof health === 'object');
  _assert('healthCheck-has-status', !!health.status, `status=${health.status}`);
  _assert('healthCheck-has-checks', typeof health.checks === 'object', health.checks ? 'OK' : 'missing');
  _assert('healthCheck-has-version', !!health.version, `version=${health.version}`);
}

export function testSubscribe(): void {
  const rc = _getRC();
  if (!rc) return;
  let called: boolean = false;
  const unsub = rc.subscribe!(() => { called = true; });
  _assert('subscribe-returns-function', typeof unsub === 'function');
  if (typeof unsub === 'function') unsub();
  _assert('unsubscribe-executes', true);
}

export function testNotifyUpdate(): void {
  const rc = _getRC();
  if (!rc) return;

  // Testar que notifyUpdate pode ser chamado sem erro
  let notifyOk: boolean = false;
  try {
    rc.notifyUpdate!('test-from-tests');
    notifyOk = true;
  } catch (e: unknown) {
    notifyOk = false;
  }
  _assert('notifyUpdate-no-error', notifyOk, notifyOk ? 'OK' : 'threw error');
}

export function testVersionInfo(): void {
  const rc = _getRC();
  if (!rc) return;
  const rcInfo = rc.info!();
  _assert('info-returns-object', typeof rcInfo === 'object');
  _assert('info-has-version', !!rcInfo.version, `version=${rcInfo.version}`);
  _assert('info-has-moduleId', !!rcInfo.moduleId, `moduleId=${rcInfo.moduleId}`);
  _assert('info-has-subscriberCount', typeof rcInfo.subscriberCount === 'number', `subs=${rcInfo.subscriberCount}`);
  _assert('info-has-replayInfo', rcInfo.hasEmittedReady !== undefined, `emittedReady=${rcInfo.hasEmittedReady}`);
}

export function runAll(): TestSummary {
  _results = [];
  testSnapshotStructure();
  testModeValues();
  testQueryMethods();
  testReplayAPI();
  testHealthCheck();
  testSubscribe();
  testNotifyUpdate();
  testVersionInfo();

  let passed: number = 0;
  let failed: number = 0;
  for (let i = 0; i < _results.length; i++) {
    if (_results[i].passed) passed++;
    else failed++;
  }

  const summary: TestSummary = {
    total: _results.length,
    passed,
    failed,
    score: _results.length > 0 ? `${Math.round((passed / _results.length) * 100)}%` : '0%',
    results: _results,
    timestamp: Date.now()
  };

  console.log(`=== RuntimeContext Tests: ${passed}/${_results.length} passed (${summary.score}) ===`);
  for (let j = 0; j < _results.length; j++) {
    const r = _results[j];
    console.log(`${r.passed ? '  PASS' : '  FAIL'} ${r.test}${r.detail ? ` (${r.detail})` : ''}`);
  }

  return summary;
}

export function getLastResults(): TestResult[] {
  return _results.slice();
}

export function info(): RuntimeContextTestsInfo {
  let passed: number = 0;
  for (let i = 0; i < _results.length; i++) {
    if (_results[i].passed) passed++;
  }
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    testsRun: _results.length,
    passed,
    failed: _results.length - passed
  };
}

export default {
  MODULE_ID,
  VERSION,
  runAll,
  testSnapshotStructure,
  testModeValues,
  testQueryMethods,
  testReplayAPI,
  testHealthCheck,
  testSubscribe,
  testNotifyUpdate,
  testVersionInfo,
  getLastResults,
  info
};
