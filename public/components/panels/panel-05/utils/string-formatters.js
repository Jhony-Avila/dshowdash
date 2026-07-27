function truncate(str, length = 50, suffix = "...") {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function titleCase(str) {
  if (!str) return "";
  return str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
function slugify(str) {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function formatCNPJ(cnpj) {
  if (!cnpj) return "\u2014";
  const clean = String(cnpj).replace(/\D/g, "");
  if (clean.length !== 14) return String(cnpj);
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
function formatPhone(phone) {
  if (!phone) return "\u2014";
  const clean = String(phone).replace(/\D/g, "");
  if (clean.length === 11) return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (clean.length === 10) return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return String(phone);
}
var string_formatters_default = { truncate, capitalize, titleCase, slugify, formatCNPJ, formatPhone };
const MODULE_ID = "panel-05:utils:string-formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stringFormattersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  capitalize,
  string_formatters_default as default,
  formatCNPJ,
  formatPhone,
  healthCheck,
  info,
  slugify,
  titleCase,
  truncate
};
