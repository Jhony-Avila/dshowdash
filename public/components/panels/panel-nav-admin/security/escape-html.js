const VERSION = "10.2.0-MIGRATION-PHASE5";
const MODULE_ID = "panel-nav-admin.security.escape-html";
const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;"
};
const HTML_ESCAPE_RE = /[&<>"'`]/g;
const ATTR_ESCAPE_RE = /[&<>"'`\n\r\t]/g;
const ATTR_ENTITIES = {
  ...HTML_ENTITIES,
  "\n": "&#10;",
  "\r": "&#13;",
  "	": "&#9;"
};
function escapeHtml(input) {
  if (input == null) return "";
  const str = String(input);
  if (str.length === 0) return "";
  return str.replace(HTML_ESCAPE_RE, (ch) => HTML_ENTITIES[ch] || ch);
}
function escapeAttr(input) {
  if (input == null) return "";
  const str = String(input);
  if (str.length === 0) return "";
  return str.replace(ATTR_ESCAPE_RE, (ch) => ATTR_ENTITIES[ch] || ch);
}
function sanitizeInput(input, options = {}) {
  const { maxLength = 500, trim = true } = options;
  if (input == null) return "";
  let str = String(input);
  str = str.replace(/<[^>]*>/g, "");
  if (trim) str = str.trim();
  if (str.length > Number(maxLength)) str = str.substring(0, Number(maxLength));
  return escapeHtml(str);
}
function escapeForRegex(str) {
  if (!str) return "";
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function containsHtml(str) {
  if (!str) return false;
  return /<[a-z/!][^>]*>/i.test(String(str));
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, functions: ["escapeHtml", "escapeAttr", "sanitizeInput", "escapeForRegex", "containsHtml"] };
}
function healthCheck() {
  const testResult = escapeHtml("<script>") === "&lt;script&gt;";
  return { status: testResult ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, selfTestPassed: testResult };
}
var escape_html_default = { escapeHtml, escapeAttr, sanitizeInput, escapeForRegex, containsHtml, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  containsHtml,
  escape_html_default as default,
  escapeAttr,
  escapeForRegex,
  escapeHtml,
  healthCheck,
  info,
  sanitizeInput
};
