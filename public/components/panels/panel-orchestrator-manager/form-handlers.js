const MODULE_ID = "panel-orchestrator-manager.form-handlers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function handleFormSubmit(form, onSubmit) {
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  });
}
function validateForm(data, rules = {}) {
  const errors = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const r = rule;
    const value = data[field];
    if (r["required"] && !value) {
      errors[field] = `${field} \xE9 obrigat\xF3rio`;
    }
    if (r["minLength"] && typeof value === "string" && value.length < r["minLength"]) {
      errors[field] = `${field} deve ter pelo menos ${r["minLength"]} caracteres`;
    }
    if (r["pattern"] && typeof r["pattern"].test === "function" && !r["pattern"].test(String(value))) {
      errors[field] = r["message"] || `${field} inv\xE1lido`;
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}
function resetForm(form) {
  form?.reset();
}
var form_handlers_default = { handleFormSubmit, validateForm, resetForm };
export {
  MODULE_ID,
  VERSION,
  form_handlers_default as default,
  handleFormSubmit,
  resetForm,
  validateForm
};
