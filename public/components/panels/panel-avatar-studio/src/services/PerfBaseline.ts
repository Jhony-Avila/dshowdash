// services/PerfBaseline.ts — BASELINE DE RUNTIME local (AS6 Parte 9,
// lote 1171–1180, decisão #119, flag as6.perf_baseline).
// @version 1.0.0  @created 2026-08-09
//
// Mede as interações-chave do estúdio com performance.mark/measure e
// double-rAF (a medida fecha DEPOIS do paint — é o que o usuário
// sente): init do shell, troca de categoria, equipar. Long tasks da
// main thread entram via PerformanceObserver. Tudo LOCAL (nunca sai da
// aba; sem PII — só nomes de interação e milissegundos), exposto em
// window.__avstPerf p/ a suíte e o viewer dev. Flag off = todos os
// pontos viram no-op (zero marks, zero observers).
import { flag } from '../nucleo/flags';

interface Amostras { n: number; totalMs: number; maxMs: number; ultimas: number[] }

export interface RelatorioPerf {
  medidas: Record<string, { n: number; mediaMs: number; p95Ms: number; maxMs: number }>;
  longtasks: { n: number; totalMs: number };
}

const amostras = new Map<string, Amostras>();
let longtasks = { n: 0, totalMs: 0 };
let ligado = false;
let observer: PerformanceObserver | null = null;

/** Orçamento de referência (ms) — generoso o bastante p/ hardware
 *  fraco/headless; estourar É sinal de regressão real de runtime. */
export const ORCAMENTO_MS: Record<string, number> = {
  'troca-categoria': 1200,
  equipar: 1500,
};

function registrar(nome: string, ms: number): void {
  const a = amostras.get(nome) ?? { n: 0, totalMs: 0, maxMs: 0, ultimas: [] };
  a.n += 1;
  a.totalMs += ms;
  a.maxMs = Math.max(a.maxMs, ms);
  a.ultimas.push(ms);
  if (a.ultimas.length > 50) a.ultimas.shift();
  amostras.set(nome, a);
}

/** Liga a baseline (idempotente). Chamado no mount do shell. */
export function iniciarBaseline(): void {
  if (ligado || !flag('as6.perf_baseline')) return;
  ligado = true;
  try {
    observer = new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) {
        longtasks = { n: longtasks.n + 1, totalMs: longtasks.totalMs + e.duration };
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch { observer = null; /* navegador sem longtask — segue sem */ }
  (window as unknown as { __avstPerf?: () => RelatorioPerf }).__avstPerf = relatorioBaseline;
}

/** Mede uma interação: marca AGORA e fecha depois do paint (double-rAF). */
export function medirInteracao(nome: string): void {
  if (!ligado) return;
  const t0 = performance.now();
  try { performance.mark(`avst:${nome}:inicio`); } catch { /* sem marks */ }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const ms = performance.now() - t0;
    try { performance.measure(`avst:${nome}`, { start: t0, duration: ms }); } catch { /* idem */ }
    registrar(nome, ms);
  }));
}

/** Fotografia atual — médias, p95 e long tasks. */
export function relatorioBaseline(): RelatorioPerf {
  const medidas: RelatorioPerf['medidas'] = {};
  for (const [nome, a] of amostras) {
    const ordenadas = [...a.ultimas].sort((x, y) => x - y);
    const p95 = ordenadas[Math.min(ordenadas.length - 1, Math.floor(ordenadas.length * 0.95))] ?? 0;
    medidas[nome] = { n: a.n, mediaMs: a.totalMs / a.n, p95Ms: p95, maxMs: a.maxMs };
  }
  return { medidas, longtasks: { ...longtasks } };
}
