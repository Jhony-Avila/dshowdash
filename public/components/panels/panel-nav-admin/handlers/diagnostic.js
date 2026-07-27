const MODULE_ID = "panel-nav-admin.handlers.diagnostic";
const VERSION = "9.3.0-P2-ENTERPRISE";
function runDiagnostics(state) {
  const results = {
    itemCount: state.getItems().length,
    hasErrors: false,
    errors: [],
    warnings: []
  };
  const items = state.getItems();
  items.forEach((item) => {
    if (!item.id) results.errors.push(`Item sem ID: ${JSON.stringify(item)}`);
    if (!item.label) results.warnings.push(`Item ${item.id} sem label`);
    if (!item.route && !item.action) results.warnings.push(`Item ${item.id} sem route ou action`);
  });
  results.hasErrors = results.errors.length > 0;
  return results;
}
function logDiagnostics(results) {
  if (results.errors.length) console.error("[panel-nav-admin] Diagn\xF3stico \u2014 Erros:", results.errors);
}
var diagnostic_default = { runDiagnostics, logDiagnostics };
export {
  MODULE_ID,
  VERSION,
  diagnostic_default as default,
  logDiagnostics,
  runDiagnostics
};
