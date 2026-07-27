function formatCurrency(v) {
  return `R$ ${(parseFloat(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatNumber(v) {
  return (parseInt(v) || 0).toLocaleString("pt-BR");
}
function formatPercent(v) {
  return `${(parseFloat(v) || 0).toFixed(1)}%`;
}
function formatDoc(d) {
  if (!d) return "\u2014";
  const c = d.replace(/\D/g, "");
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d;
}
function formatDate(d) {
  if (!d) return "\u2014";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}
function truncate(s, l) {
  if (!s) return "\u2014";
  return s.length > l ? `${s.substring(0, l)}...` : s;
}
function download(content, filename, type) {
  const blob = new Blob([`\uFEFF${content}`], { type: `${type};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
var helpers_default = { formatCurrency, formatNumber, formatPercent, formatDoc, formatDate, truncate, download };
const MODULE_ID = "panels-panel-16-ui-helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  download,
  formatCurrency,
  formatDate,
  formatDoc,
  formatNumber,
  formatPercent,
  healthCheck,
  info,
  truncate
};
