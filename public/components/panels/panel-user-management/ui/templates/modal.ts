// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: modal
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createUserModalTemplate() — exported function
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

export const MODULE_ID = 'panel-user-management.ui.templates.modal';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel User Management - Modal Templates
 * @module panel-user-management/ui/templates/modal
 * @version 1.1.0-AAA
 */

export function createUserModalTemplate(user: Record<string, unknown> | null = null) {
    const isEdit = !!user;
    return `
        <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h5>
            <button type="button" class="close" data-dismiss="modal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="user-form">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" name="name" class="form-control" value="${user?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" class="form-control" value="${user?.email || ''}" required>
                </div>
                <div class="form-group">
                    <label>Perfil</label>
                    <select name="role" class="form-control">
                        <option value="user" ${user?.role === 'user' ? 'selected' : ''}>Usuário</option>
                        <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="save-user">${isEdit ? 'Salvar' : 'Criar'}</button>
        </div>
    `;
}

export default { createUserModalTemplate };

// Alias para backward compatibility com template.ts
export function renderEditModal(container: HTMLElement, user: Record<string, unknown> | null = null, avatars: unknown[] = [], avatarSelectorOpen: boolean = false) {
    container.innerHTML = createUserModalTemplate(user);
}
