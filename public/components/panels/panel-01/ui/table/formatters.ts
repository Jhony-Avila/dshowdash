// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/formatters
// PURPOSE: Panel-01 Table Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getSituacaoById from ../../core/constants.js
//   formatCurrency, formatDate, escapeHtml, truncate from ../../utils/formatters.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatSituacao() — exported function
//   formatValor() — exported function
//   formatDescricao() — exported function
//   formatDataRequisicao() — exported function
//   formatCentro() — exported function
//   formatFornecedor() — exported function
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

import { getSituacaoById } from '../../core/constants.js';
import { formatCurrency, formatDate, escapeHtml, truncate } from '../../utils/formatters.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/formatters';

export function formatSituacao(idSituacao: string | number, nome: string) {
  const situacao = getSituacaoById(Number(idSituacao));
  return `<span class="p01-badge" style="--badge-color: ${situacao.cor}">${escapeHtml(nome || situacao.nome)}</span>`;
}

export function formatValor(valor: unknown) {
  return `<span class="p01-valor">${formatCurrency(valor)}</span>`;
}

export function formatDescricao(text: string | null | undefined, maxLength = 50) {
  const truncated = truncate(text || '--', maxLength);
  return `<span class="p01-desc" title="${escapeHtml(text || '')}">${escapeHtml(truncated)}</span>`;
}

export function formatDataRequisicao(data: string | number | null | undefined) {
  return `<span class="p01-data">${formatDate(data)}</span>`;
}

export function formatCentro(centro: string | null | undefined, maxLength = 25) {
  return escapeHtml(truncate(centro || '--', maxLength));
}

export function formatFornecedor(fornecedor: string | null | undefined, maxLength = 30) {
  return escapeHtml(truncate(fornecedor || '--', maxLength));
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { formatSituacao, formatValor, formatDescricao, formatDataRequisicao, formatCentro, formatFornecedor };
