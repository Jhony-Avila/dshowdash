// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-confirmation-modal
// PURPOSE: Orchestrator Confirmation Modal
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   showConfirmModal from /components/overlay-layer/adapters/modal-adapter.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   getVersion() — exported function
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

import { showConfirmModal } from '/components/overlay-layer/adapters/modal-adapter.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'orchestrator-confirmation-modal';

export function show(options: { title?: string; message?: string; icon?: string; details?: string | null; confirmText?: string; cancelText?: string; danger?: boolean } = {}) {
  const { title = 'Confirmar Acao', message = 'Deseja continuar?', icon = '', details = null, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = options;
  return showConfirmModal({ title, message, icon, details, confirmText, cancelText, danger, owner: MODULE_ID });
}

export async function confirmApplyPreset(presetId: string, context: { environment?: string } = {}) {
  return showConfirmModal({
    title: 'Aplicar Preset',
    message: `Deseja aplicar o preset "${presetId}"? Isso ira reorganizar todos os paineis do dashboard.`,
    icon: '',
    details: `<p><strong>Preset:</strong> ${presetId}</p><p><strong>Ambiente:</strong> ${context.environment || 'Producao'}</p><p><strong>Acao:</strong> Reorganizar layout dos paineis</p>`,
    confirmText: 'Aplicar Preset',
    owner: MODULE_ID
  });
}

export async function confirmResetLayout() {
  return showConfirmModal({
    title: 'Resetar Layout',
    message: 'Deseja resetar o layout para o padrao? Todas as customizacoes serao perdidas.',
    icon: '',
    details: `<p><strong>Acao:</strong> Restaurar layout padrao</p><p><strong>Efeito:</strong> Remove customizacoes de posicao e tamanho</p>`,
    confirmText: 'Resetar',
    danger: true,
    owner: MODULE_ID
  });
}

export async function confirmRefreshAll() {
  return showConfirmModal({
    title: 'Atualizar Todos',
    message: 'Deseja atualizar todos os paineis? Isso pode causar um breve carregamento.',
    icon: '',
    confirmText: 'Atualizar Todos',
    owner: MODULE_ID
  });
}

export async function confirmPause(isPaused: boolean) {
  const action = isPaused ? 'Retomar' : 'Pausar';
  return showConfirmModal({
    title: `${action} Scheduler`,
    message: isPaused ? 'Deseja retomar as atualizacoes automaticas?' : 'Deseja pausar as atualizacoes automaticas? Os dados nao serao atualizados ate retomar.',
    icon: isPaused ? '' : '',
    confirmText: action,
    owner: MODULE_ID
  });
}

export function getVersion() { return VERSION; }
export default { VERSION, MODULE_ID, show, confirmApplyPreset, confirmResetLayout, confirmRefreshAll, confirmPause, getVersion };

