// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences-ui-template-modals
// PURPOSE: Panel User Preferences - Modals Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderModals() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { ICONS } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences-ui-template-modals';

export const renderModals = () => renderConfirmModal() + renderImportModal() + renderResetModal();

const renderConfirmModal = () => `<div class="pup-modal-overlay" data-modal="confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="pup-modal"><div class="pup-modal-header"><h3 id="confirm-title" class="pup-modal-title">${ICONS.alertTriangle} Confirmar Exclusão</h3><button type="button" class="pup-modal-close" data-action="close-modal" aria-label="Fechar">${ICONS.x}</button></div><div class="pup-modal-body"><p class="pup-confirm-text">Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p><div class="pup-preview-warning">${ICONS.alertTriangle}<span class="pup-preview-warning-text">Todos os dados associados serão permanentemente removidos.</span></div></div><div class="pup-modal-footer"><button type="button" class="pup-btn ghost" data-action="close-modal">Cancelar</button><button type="button" class="pup-btn danger" data-action="confirm-delete">${ICONS.trash} Excluir</button></div></div></div>`;

const renderImportModal = () => `<div class="pup-modal-overlay" data-modal="import" role="dialog" aria-modal="true" aria-labelledby="import-title"><div class="pup-modal"><div class="pup-modal-header"><h3 id="import-title" class="pup-modal-title">${ICONS.upload} Importar Preferências</h3><button type="button" class="pup-modal-close" data-action="close-modal" aria-label="Fechar">${ICONS.x}</button></div><div class="pup-modal-body"><div class="pup-preview-section"><p class="pup-preview-label">Arquivo Selecionado</p><div class="pup-preview-value" data-preview="filename">Nenhum arquivo selecionado</div></div><div class="pup-preview-section"><p class="pup-preview-label">Itens a Importar</p><div class="pup-preview-value" data-preview="items">--</div></div><div class="pup-preview-warning">${ICONS.alertTriangle}<span class="pup-preview-warning-text">A importação irá substituir suas preferências atuais. Recomendamos fazer um backup antes de continuar.</span></div></div><div class="pup-modal-footer"><button type="button" class="pup-btn ghost" data-action="close-modal">Cancelar</button><button type="button" class="pup-btn primary" data-action="confirm-import" disabled>${ICONS.upload} Importar</button></div></div></div>`;

const renderResetModal = () => `<div class="pup-modal-overlay" data-modal="reset" role="dialog" aria-modal="true" aria-labelledby="reset-title"><div class="pup-modal"><div class="pup-modal-header"><h3 id="reset-title" class="pup-modal-title">${ICONS.rotateCcw} Restaurar Padrões</h3><button type="button" class="pup-modal-close" data-action="close-modal" aria-label="Fechar">${ICONS.x}</button></div><div class="pup-modal-body"><p class="pup-confirm-text">Deseja restaurar todas as preferências para os valores padrão do sistema?</p><div class="pup-preview-section"><p class="pup-preview-label">Será Resetado</p><div class="pup-preview-value">Tema, densidade, notificações, cores personalizadas</div></div><div class="pup-preview-section"><p class="pup-preview-label">Será Mantido</p><div class="pup-preview-value">Layouts salvos, views, histórico</div></div><div class="pup-preview-warning">${ICONS.alertTriangle}<span class="pup-preview-warning-text">Esta ação não pode ser desfeita. Considere exportar suas preferências antes.</span></div></div><div class="pup-modal-footer"><button type="button" class="pup-btn ghost" data-action="close-modal">Cancelar</button><button type="button" class="pup-btn danger" data-action="confirm-reset">${ICONS.rotateCcw} Restaurar</button></div></div></div>`;

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, p25Compliant: true });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateModalsReady: true }, p25Compliant: true });

export default { renderModals, info, healthCheck };
