// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01.utils.performance.worker
// PURPOSE: Panel-01 - Web Worker para KPIs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getWorkerManager() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01.utils.performance.worker';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') logger.error?.(prefix, ...args); else if (level === 'warn') logger.warn?.(prefix, ...args); else if (level === 'info') logger.info?.(prefix, ...args); else logger.debug?.(prefix, ...args); };

const workerCode = () => {
  (self as unknown as Worker).onmessage = (e: MessageEvent) => { const { type, data } = e.data; if (type === 'calculateKPIs') { const result = calculateKPIs(data); (self as unknown as Worker).postMessage({ type: 'kpis', result }); } if (type === 'formatRows') { const result = formatRows(data); (self as unknown as Worker).postMessage({ type: 'rows', result }); } };
  function calculateKPIs(items: Record<string, unknown>[]) { let total = 0, valorTotal = 0; let pendenteLancamento = { qtd: 0, valor: 0 }; let pendentePagamento = { qtd: 0, valor: 0 }; let pago = { qtd: 0, valor: 0 }; for (let i = 0; i < items.length; i++) { const item = items[i]; const valor = parseFloat(String(item.total || item.Total || 0)); const situacao = item.id_situacao || item.Id_Situacao; total++; valorTotal += valor; if (situacao === 1304) { pendenteLancamento.qtd++; pendenteLancamento.valor += valor; } else if (situacao === 1305) { pendentePagamento.qtd++; pendentePagamento.valor += valor; } else if (situacao === 1306) { pago.qtd++; pago.valor += valor; } } return { total, valorTotal, pendenteLancamento, pendentePagamento, pago }; }
  function formatRows(items: Record<string, unknown>[]) { return items.map((item: Record<string, unknown>) => ({
    id: item.id || item.Id_Requisicao,
    descricao: (String(item.descricao || item.Descricao_Requisicao || '')).substring(0, 100),
    total: formatCurrency(item.total || item.Total),
    situacao: item.id_situacao || item.Id_Situacao,
    data: formatDate(item.data_requisicao || item.Data_Requisicao)
  })); }
  function formatCurrency(value: unknown) { const num = parseFloat(String(value)) || 0; return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`; }
  function formatDate(dateStr: unknown) { if (!dateStr) return '-'; const d = new Date(String(dateStr)); if (isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-BR'); }
};

export class WorkerManager {
  [key: string]: any;
  constructor() { this.worker = null; this.pending = new Map(); this.requestId = 0; }
  init() { if (this.worker) return; try { const code = `(${workerCode.toString()})()`; const blob = new Blob([code], { type: 'application/javascript' }); this.worker = new Worker(URL.createObjectURL(blob)); this.worker.onmessage = (e: MessageEvent) => this._onMessage(e); this.worker.onerror = (e: ErrorEvent) => _log('error', 'Error:', e.message); } catch (error) { _log('info', 'Fallback to main thread:', (error as Error).message); } }
  _onMessage(e: MessageEvent) { const { type, result, requestId } = e.data; if (this.pending.has(requestId)) { const { resolve } = this.pending.get(requestId); this.pending.delete(requestId); resolve(result); } }
  async calculateKPIs(items: Record<string, unknown>[]) { if (!this.worker) return this._fallbackKPIs(items); return this._postMessage('calculateKPIs', items); }
  async formatRows(items: Record<string, unknown>[]) { if (!this.worker) return items; return this._postMessage('formatRows', items); }
  _postMessage(type: string, data: unknown) { return new Promise((resolve) => { const requestId = ++this.requestId; this.pending.set(requestId, { resolve }); this.worker.postMessage({ type, data, requestId }); setTimeout(() => { if (this.pending.has(requestId)) { this.pending.delete(requestId); resolve(type === 'calculateKPIs' ? this._fallbackKPIs(data as Record<string, unknown>[]) : data); } }, 5000); }); }
  _fallbackKPIs(items: Record<string, unknown>[]) { let total = 0, valorTotal = 0; let pendenteLancamento = { qtd: 0, valor: 0 }; let pendentePagamento = { qtd: 0, valor: 0 }; let pago = { qtd: 0, valor: 0 }; for (const item of items) { const valor = parseFloat(String(item.total || item.Total || 0)); const situacao = item.id_situacao || item.Id_Situacao; total++; valorTotal += valor; if (situacao === 1304) { pendenteLancamento.qtd++; pendenteLancamento.valor += valor; } else if (situacao === 1305) { pendentePagamento.qtd++; pendentePagamento.valor += valor; } else if (situacao === 1306) { pago.qtd++; pago.valor += valor; } } return { total, valorTotal, pendenteLancamento, pendentePagamento, pago }; }
  terminate() { if (this.worker) { this.worker.terminate(); this.worker = null; } this.pending.clear(); }
}

let instance: InstanceType<typeof WorkerManager> | null = null;
export const getWorkerManager = () => { if (!instance) { instance = new WorkerManager(); instance.init(); } return instance; };
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() });
export const healthCheck = () => ({ status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() });
export default { WorkerManager, getWorkerManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
