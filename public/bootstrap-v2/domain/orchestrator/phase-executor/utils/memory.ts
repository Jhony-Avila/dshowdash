// Memory Capture Utility
// @version 3.1.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: captureMemory(), calculateMemoryDelta(start, end)
// BROWSER-APIS: ((window as any).performance as any).memory
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.utils.memory';

export function captureMemory() {
  if (typeof window !== 'undefined' && window.performance && ((window as any).performance as any).memory) {
    return {
      usedJSHeapSize: ((window as any).performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: ((window as any).performance as any).memory.totalJSHeapSize,
      timestamp: Date.now()
    };
  }
  return null;
}

interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  timestamp: number;
}

export function calculateMemoryDelta(memoryStart: MemorySnapshot | null, memoryEnd: MemorySnapshot | null) {
  if (!memoryStart || !memoryEnd) return null;
  return {
    start: memoryStart.usedJSHeapSize,
    end: memoryEnd.usedJSHeapSize,
    delta: memoryEnd.usedJSHeapSize - memoryStart.usedJSHeapSize
  };
}

export default { captureMemory, calculateMemoryDelta };
