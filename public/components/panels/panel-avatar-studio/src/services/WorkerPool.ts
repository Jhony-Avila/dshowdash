// services/WorkerPool.ts — POOL de workers p/ tarefas pesadas (AS6
// Parte 9, lote 1091–1100, decisão #111, flag as6.workers).
// @version 1.0.0  @created 2026-08-09
//
// Regra de ouro: o worker é ACELERAÇÃO, nunca dependência — toda
// chamada tem timeout e devolve null em qualquer falha (worker
// indisponível, erro, demora); o CALLER mantém o caminho síncrono de
// sempre como fallback. Pool preguiçoso de até 2 workers reutilizados;
// ambiente sem Worker (SSR/teste node) = null imediato.
import { flag } from '../nucleo/flags';

interface Pendente { res: (v: string | null) => void; timer: number }

const TAMANHO_POOL = 2;
let workers: Worker[] | null = null;
let proximoWorker = 0;
let proximoId = 1;
const pendentes = new Map<number, Pendente>();

function obterPool(): Worker[] | null {
  if (workers) return workers;
  try {
    if (typeof Worker === 'undefined') return null;
    workers = Array.from({ length: TAMANHO_POOL }, () => {
      const w = new Worker(new URL('./foto.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<{ id: number; ok: boolean; dataUri?: string }>) => {
        const p = pendentes.get(e.data.id);
        if (!p) return;
        pendentes.delete(e.data.id);
        window.clearTimeout(p.timer);
        p.res(e.data.ok && e.data.dataUri ? e.data.dataUri : null);
      };
      w.onerror = () => { /* falhas individuais respondem via timeout */ };
      return w;
    });
    return workers;
  } catch { return null; }
}

/** Redimensiona/re-encoda no worker; null = use o fallback síncrono. */
export function redimensionarNoWorker(
  dataUri: string, lado: number,
  tipo: 'image/jpeg' | 'image/png' = 'image/jpeg',
  opcoes: { qualidade?: number; fundo?: string; timeoutMs?: number } = {},
): Promise<string | null> {
  if (!flag('as6.workers')) return Promise.resolve(null);
  const pool = obterPool();
  if (!pool) return Promise.resolve(null);
  const id = proximoId++;
  const w = pool[proximoWorker];
  proximoWorker = (proximoWorker + 1) % pool.length;
  return new Promise((res) => {
    const timer = window.setTimeout(() => {
      pendentes.delete(id);
      res(null); // demorou → fallback síncrono do caller
    }, opcoes.timeoutMs ?? 4000);
    pendentes.set(id, { res, timer });
    try {
      w.postMessage({ id, tarefa: 'redimensionar', dataUri, lado, tipo, qualidade: opcoes.qualidade, fundo: opcoes.fundo });
    } catch {
      pendentes.delete(id);
      window.clearTimeout(timer);
      res(null);
    }
  });
}
