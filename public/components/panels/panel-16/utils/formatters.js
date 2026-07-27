const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16/utils/formatters";
function formatCurrency(value) {
  if (value === null || value === void 0) return "R$ 0,00";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatNumber(value) {
  if (value === null || value === void 0) return "0";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0";
  return num.toLocaleString("pt-BR");
}
function formatCompact(value) {
  if (value === null || value === void 0) return "0";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0";
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString("pt-BR");
}
function formatDate(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "--";
  }
}
function formatDateTime(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "--";
  }
}
function formatPercent(value, decimals = 1) {
  if (value === null || value === void 0) return "0%";
  const num = parseFloat(String(value));
  if (isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}
function formatCNPJ(cnpj) {
  if (!cnpj) return "--";
  const clean = String(cnpj).replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
function formatPhone(phone) {
  if (!phone) return "--";
  const clean = String(phone).replace(/\D/g, "");
  if (clean.length === 11) return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (clean.length === 10) return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return phone;
}
function formatUF(uf) {
  if (!uf) return "--";
  return String(uf).toUpperCase().slice(0, 2);
}
function formatRiscoNivel(nivel) {
  const niveis = { baixo: "\u{1F7E2} Baixo", medio: "\u{1F7E1} M\xE9dio", alto: "\u{1F7E0} Alto", critico: "\u{1F534} Cr\xEDtico" };
  return niveis[String(nivel).toLowerCase()] || nivel || "--";
}
function formatStatus(status) {
  const map = { ativo: "\u2713 Ativo", inativo: "\u2717 Inativo", pendente: "\u23F3 Pendente", bloqueado: "\u{1F6AB} Bloqueado" };
  return map[String(status).toLowerCase()] || status || "--";
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function truncate(text, maxLength = 50) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
function debounce(fn, delay = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer ?? void 0);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var formatters_default = { formatCurrency, formatNumber, formatCompact, formatDate, formatDateTime, formatPercent, formatCNPJ, formatPhone, formatUF, formatRiscoNivel, formatStatus, escapeHtml, truncate, debounce };
export {
  MODULE_ID,
  VERSION,
  debounce,
  formatters_default as default,
  escapeHtml,
  formatCNPJ,
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPhone,
  formatRiscoNivel,
  formatStatus,
  formatUF,
  healthCheck,
  info,
  truncate
};
