import { getSituacaoById } from "../../core/constants.js";
import { formatCurrency, formatDate, escapeHtml, truncate } from "../../utils/formatters.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/formatters";
function formatSituacao(idSituacao, nome) {
  const situacao = getSituacaoById(Number(idSituacao));
  return `<span class="p01-badge" style="--badge-color: ${situacao.cor}">${escapeHtml(nome || situacao.nome)}</span>`;
}
function formatValor(valor) {
  return `<span class="p01-valor">${formatCurrency(valor)}</span>`;
}
function formatDescricao(text, maxLength = 50) {
  const truncated = truncate(text || "--", maxLength);
  return `<span class="p01-desc" title="${escapeHtml(text || "")}">${escapeHtml(truncated)}</span>`;
}
function formatDataRequisicao(data) {
  return `<span class="p01-data">${formatDate(data)}</span>`;
}
function formatCentro(centro, maxLength = 25) {
  return escapeHtml(truncate(centro || "--", maxLength));
}
function formatFornecedor(fornecedor, maxLength = 30) {
  return escapeHtml(truncate(fornecedor || "--", maxLength));
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var formatters_default = { formatSituacao, formatValor, formatDescricao, formatDataRequisicao, formatCentro, formatFornecedor };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatCentro,
  formatDataRequisicao,
  formatDescricao,
  formatFornecedor,
  formatSituacao,
  formatValor,
  healthCheck,
  info
};
