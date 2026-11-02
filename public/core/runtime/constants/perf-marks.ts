// Migrado para TypeScript: 2026-02-25
// Performance Marks - Marcadores de performance do RuntimeContext
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Medir tempos criticos: boot, READY, transicoes de modo
// @melhoria #20 - Metricas de performance para diagnostico
'use strict';

export const MODULE_ID = 'perf-marks' as const;
export const VERSION = '1.0.0' as const;

interface MeasureEntry {
  name: string;
  start: number;
  end: number;
  duration: number;
  startMark: string;
  endMark: string;
}

interface MeasureSummaryEntry {
  count: number;
  total: number;
  min: number;
  max: number;
  avg?: number;
}

interface PerfMarksInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  marksCount: number;
  measuresCount: number;
  hasPerformanceAPI: boolean;
  summary: Record<string, MeasureSummaryEntry>;
}

let _marks: Record<string, number> = {};
let _measures: MeasureEntry[] = [];
const _maxMeasures: number = 100;
const _hasPerformanceAPI: boolean = typeof performance !== 'undefined' && typeof performance.mark === 'function';

export function mark(name: string): number {
  const timestamp = Date.now();
  _marks[name] = timestamp;
  if (_hasPerformanceAPI) {
    try { performance.mark(`dsd:${name}`); } catch (e: unknown) {}
  }
  return timestamp;
}

export function measure(name: string, startMark: string, endMark?: string): MeasureEntry | null {
  const start = _marks[startMark];
  const end = endMark ? _marks[endMark] : Date.now();
  if (!start) return null;
  const duration = end - start;
  const entry: MeasureEntry = {
    name,
    start,
    end,
    duration,
    startMark,
    endMark: endMark || 'now'
  };
  _measures.push(entry);
  if (_measures.length > _maxMeasures) _measures.shift();
  if (_hasPerformanceAPI) {
    try { performance.measure(`dsd:${name}`, `dsd:${startMark}`); } catch (e: unknown) {}
  }
  return entry;
}

export function getMark(name: string): number | null {
  return _marks[name] || null;
}

export function getMeasures(filter?: string): MeasureEntry[] {
  if (!filter) return _measures.slice();
  return _measures.filter((m: MeasureEntry) => m.name.indexOf(filter) !== -1);
}

export function getTimeSince(markName: string): number | null {
  const start = _marks[markName];
  if (!start) return null;
  return Date.now() - start;
}

export function getSummary(): Record<string, MeasureSummaryEntry> {
  const summary: Record<string, MeasureSummaryEntry> = {};
  for (let i = 0; i < _measures.length; i++) {
    const m = _measures[i];
    if (!summary[m.name]) {
      summary[m.name] = { count: 0, total: 0, min: Infinity, max: 0 };
    }
    summary[m.name].count++;
    summary[m.name].total += m.duration;
    if (m.duration < summary[m.name].min) summary[m.name].min = m.duration;
    if (m.duration > summary[m.name].max) summary[m.name].max = m.duration;
  }
  const names = Object.keys(summary);
  for (let j = 0; j < names.length; j++) {
    summary[names[j]].avg = Math.round(summary[names[j]].total / summary[names[j]].count);
  }
  return summary;
}

export function reset(): void {
  _marks = {};
  _measures = [];
}

export function info(): PerfMarksInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    marksCount: Object.keys(_marks).length,
    measuresCount: _measures.length,
    hasPerformanceAPI: _hasPerformanceAPI,
    summary: getSummary()
  };
}

export default {
  MODULE_ID,
  VERSION,
  mark,
  measure,
  getMark,
  getMeasures,
  getTimeSince,
  getSummary,
  reset,
  info
};
