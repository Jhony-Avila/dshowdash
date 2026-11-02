// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-hooks
// PURPOSE: Platform Hooks - Lifecycle helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   useCleanup
//   useLoading
//   useEvents
//   sleep
//   createInterval
//   createTimeout
//   VERSION
//   MODULE_ID
//   default
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '3.2.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-hooks';

function sleep(ms: number): Promise<void> {
  return new Promise(r => { setTimeout(r, ms); });
}

function createInterval(fn: () => void, ms: number, cleanups?: Array<() => void>): ReturnType<typeof setInterval> {
  const id = setInterval(fn, ms);
  if (cleanups) cleanups.push(() => { clearInterval(id); });
  return id;
}

function createTimeout(fn: () => void, ms: number, cleanups?: Array<() => void>): ReturnType<typeof setTimeout> {
  const id = setTimeout(fn, ms);
  if (cleanups) cleanups.push(() => { clearTimeout(id); });
  return id;
}

interface EventTargetLike {
  addEventListener(event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(event: string, handler: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

function useCleanup() {
  const cleanups: Array<() => void> = [];
  return {
    add(fn: () => void) { if (typeof fn === 'function') cleanups.push(fn); },
    addInterval(id: ReturnType<typeof setInterval>) { cleanups.push(() => { clearInterval(id); }); },
    addTimeout(id: ReturnType<typeof setTimeout>) { cleanups.push(() => { clearTimeout(id); }); },
    addListener(el: EventTargetLike | null, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      if (el && el.addEventListener) el.addEventListener(event, handler, options);
      cleanups.push(() => { if (el && el.removeEventListener) el.removeEventListener(event, handler, options); });
    },
    addAbortController() {
      const ac = new AbortController();
      cleanups.push(() => { ac.abort(); });
      return ac;
    },
    interval(fn: () => void, ms: number) {
      const id = setInterval(fn, ms);
      cleanups.push(() => { clearInterval(id); });
      return id;
    },
    timeout(fn: () => void, ms: number) {
      const id = setTimeout(fn, ms);
      cleanups.push(() => { clearTimeout(id); });
      return id;
    },
    run() {
      cleanups.forEach(fn => { try { fn(); } catch(_e: unknown) {} });
      cleanups.length = 0;
    }
  };
}

function useLoading(container: HTMLElement | null) {
  return {
    show(text?: string) {
      if (!text) text = 'Carregando...';
      if (container) { container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:rgba(255,255,255,0.5);"><span data-loading-text></span></div>'; const s = container.querySelector('[data-loading-text]'); if (s) s.textContent = text; }
    },
    hide() { if (container) container.innerHTML = ''; },
    error(msg: string) { if (container) { container.innerHTML = '<div style="padding:24px;color:#f87171;" data-error-text></div>'; const d = container.querySelector('[data-error-text]'); if (d) d.textContent = 'Erro: ' + msg; } }
  };
}

interface EventBusContext {
  eventBus?: {
    on?: (event: string, handler: (data: Record<string, unknown>) => void) => void;
    off?: (event: string, handler: (data: Record<string, unknown>) => void) => void;
    emit?: (event: string, data: Record<string, unknown>) => void;
  };
}

function useEvents(context: EventBusContext | null) {
  const subs: Array<() => void> = [];
  return {
    on(event: string, handler: (data: Record<string, unknown>) => void) {
      if (context && context.eventBus && context.eventBus.on) {
        context.eventBus.on(event, handler);
        subs.push(() => { if (context.eventBus!.off) context.eventBus!.off(event, handler); });
      }
    },
    emit(event: string, data: Record<string, unknown>) {
      if (context && context.eventBus && context.eventBus.emit) context.eventBus.emit(event, data);
    },
    cleanup() { subs.forEach(fn => { fn(); }); subs.length = 0; }
  };
}

export { useCleanup, useLoading, useEvents, sleep, createInterval, createTimeout, VERSION, MODULE_ID };
export default { useCleanup, useLoading, useEvents, sleep, createInterval, createTimeout, VERSION, MODULE_ID };
