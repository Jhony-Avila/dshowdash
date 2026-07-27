const MODULE_ID = "panel-user-management.ui.templates.modal";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createUserModalTemplate(user = null) {
  const isEdit = !!user;
  return `
        <div class="modal-header">
            <h5 class="modal-title">${isEdit ? "Editar Usu\xE1rio" : "Novo Usu\xE1rio"}</h5>
            <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="user-form">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" name="name" class="form-control" value="${user?.name || ""}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" class="form-control" value="${user?.email || ""}" required>
                </div>
                <div class="form-group">
                    <label>Perfil</label>
                    <select name="role" class="form-control">
                        <option value="user" ${user?.role === "user" ? "selected" : ""}>Usu\xE1rio</option>
                        <option value="admin" ${user?.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="save-user">${isEdit ? "Salvar" : "Criar"}</button>
        </div>
    `;
}
var modal_default = { createUserModalTemplate };
function renderEditModal(container, user = null, avatars = [], avatarSelectorOpen = false) {
  container.innerHTML = createUserModalTemplate(user);
}
export {
  MODULE_ID,
  VERSION,
  createUserModalTemplate,
  modal_default as default,
  renderEditModal
};
