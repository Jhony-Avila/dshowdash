const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin:modals";
const inputStyle = "width:100%;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;";
const disabledStyle = "width:100%;padding:0.5rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.25rem;color:#888;";
function getCreateFormHTML() {
  return `<form data-form="create-flag" style="display:flex;flex-direction:column;gap:1rem;"><div class="form-group"><label>Chave (slug)</label><input type="text" name="flag_key" required placeholder="minha_feature" pattern="[a-z0-9_]+" style="${inputStyle}"></div><div class="form-group"><label>Nome</label><input type="text" name="flag_name" required placeholder="Minha Feature" style="${inputStyle}"></div><div class="form-group"><label>Descri\xE7\xE3o</label><textarea name="description" rows="2" placeholder="Descri\xE7\xE3o..." style="${inputStyle}"></textarea></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="form-group"><label>Ambiente</label><select name="environment" style="${inputStyle}"><option value="all">Todos</option><option value="production">Produ\xE7\xE3o</option><option value="staging">Staging</option><option value="development">Development</option></select></div><div class="form-group"><label>Rollout %</label><input type="number" name="rollout_percentage" value="100" min="0" max="100" style="${inputStyle}"></div></div><label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;"><input type="checkbox" name="is_enabled"><span>Ativado</span></label></form>`;
}
function getEditFormHTML(flag) {
  const envOptions = ["all", "production", "staging", "development"];
  const envSelect = envOptions.map((env) => {
    const label = env === "all" ? "Todos" : env.charAt(0).toUpperCase() + env.slice(1);
    const selected = flag.environment === env ? " selected" : "";
    return `<option value="${env}"${selected}>${label}</option>`;
  }).join("");
  return `<form data-form="edit-flag" style="display:flex;flex-direction:column;gap:1rem;"><div class="form-group"><label>Chave</label><input type="text" value="${flag.flag_key}" disabled style="${disabledStyle}"></div><div class="form-group"><label>Nome</label><input type="text" name="flag_name" value="${flag.flag_name || ""}" required style="${inputStyle}"></div><div class="form-group"><label>Descri\xE7\xE3o</label><textarea name="description" rows="2" style="${inputStyle}">${flag.description || ""}</textarea></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="form-group"><label>Ambiente</label><select name="environment" style="${inputStyle}">${envSelect}</select></div><div class="form-group"><label>Rollout %</label><input type="number" name="rollout_percentage" value="${flag.rollout_percentage !== void 0 ? flag.rollout_percentage : 100}" min="0" max="100" style="${inputStyle}"></div></div><label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;"><input type="checkbox" name="is_enabled"${flag.is_enabled ? " checked" : ""}><span>Ativado</span></label></form>`;
}
function parseCreateForm(form) {
  return {
    flag_key: form.flag_key.value,
    flag_name: form.flag_name.value,
    description: form.description.value,
    environment: form.environment.value,
    rollout_percentage: parseInt(form.rollout_percentage.value),
    is_enabled: form.is_enabled.checked ? 1 : 0
  };
}
function parseEditForm(form) {
  return {
    flag_name: form.flag_name.value,
    description: form.description.value,
    environment: form.environment.value,
    rollout_percentage: parseInt(form.rollout_percentage.value),
    is_enabled: form.is_enabled.checked ? 1 : 0
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var modals_default = { getCreateFormHTML, getEditFormHTML, parseCreateForm, parseEditForm };
export {
  MODULE_ID,
  VERSION,
  modals_default as default,
  getCreateFormHTML,
  getEditFormHTML,
  info,
  parseCreateForm,
  parseEditForm
};
