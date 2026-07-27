// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-account-security.events
// PURPOSE: Panel Account Security - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   calculatePasswordStrength, getPasswordStrengthLabel from ./helpers.js
//
// PROVIDES:
//   setupEventHandlers() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   intent
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';

// @ts-expect-error TS migration - TS2305
import { calculatePasswordStrength, getPasswordStrengthLabel } from './helpers.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-account-security.events';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function _emitIntent(intent: string, data: Record<string, unknown>) {
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}

interface EventHandlers {
  onTogglePasswordForm: () => void;
  onSavePassword: (current: string, newPwd: string) => void;
  onToggle2FA: (enabled: boolean) => void;
  onRevokeSession: (sessionId: number) => void;
  onRevokeAllSessions: () => void;
  onTogglePasswordVisibility: (field: string | undefined) => void;
  render: () => void;
  signal?: AbortSignal;
}

interface PanelState {
  passwordStrength: number;
  [key: string]: unknown;
}

export function setupEventHandlers(container: HTMLElement, state: PanelState, handlers: EventHandlers) {
  const onTogglePasswordForm = handlers.onTogglePasswordForm;
  const onSavePassword = handlers.onSavePassword;
  const onToggle2FA = handlers.onToggle2FA;
  const onRevokeSession = handlers.onRevokeSession;
  const onRevokeAllSessions = handlers.onRevokeAllSessions;
  const onTogglePasswordVisibility = handlers.onTogglePasswordVisibility;
  const signal = handlers.signal;

  const newPwdInput = container.querySelector('#new-password');
  if (newPwdInput) {
    newPwdInput.addEventListener('input', (e: Event) => {
      state.passwordStrength = calculatePasswordStrength((e.target as HTMLInputElement).value).score;
      updatePasswordStrengthUI(container, state.passwordStrength);
    }, { signal });
  }

  container.addEventListener('click', (e: Event) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    const toggle = (e.target as HTMLElement).closest('[data-toggle]') as HTMLElement | null;

    if (toggle) {
      const field = toggle.dataset.toggle;
      onTogglePasswordVisibility(field);
      return;
    }

    if (!btn) return;

    const action = btn.dataset.action;
    switch (action) {
      case 'toggle-password-form':
        onTogglePasswordForm();
        break;

      case 'save-password':
        handleSavePassword(container, onSavePassword);
        break;

      case 'toggle-2fa':
        onToggle2FA((btn as HTMLInputElement).checked);
        break;

      case 'revoke-session':
        const sessionId = parseInt(btn.dataset.sessionId ?? '0');
        onRevokeSession(sessionId);
        break;

      case 'revoke-all-sessions':
        onRevokeAllSessions();
        break;

      case 'export-activity':
        _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'Log de atividade exportado', type: 'success' });
        break;

      case 'close-modal':
        const modalOverlay = container.querySelector('.pas-modal-overlay');
        if (modalOverlay) modalOverlay.classList.remove('visible');
        break;
    }
  }, { signal });

  const tfaToggle = container.querySelector('[data-action="toggle-2fa"]');
  if (tfaToggle) {
    tfaToggle.addEventListener('change', (e: Event) => {
      onToggle2FA((e.target as HTMLInputElement).checked);
    }, { signal });
  }
}

function handleSavePassword(container: HTMLElement, onSavePassword: (current: string, newPwd: string) => void) {
  const currentEl = container.querySelector('#current-password') as HTMLInputElement | null;
  const newPwdEl = container.querySelector('#new-password') as HTMLInputElement | null;
  const confirmEl = container.querySelector('#confirm-password') as HTMLInputElement | null;
  const current = currentEl ? currentEl.value : '';
  const newPwd = newPwdEl ? newPwdEl.value : '';
  const confirm = confirmEl ? confirmEl.value : '';

  if (!current || !newPwd) {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'Preencha todos os campos', type: 'warning' });
    return;
  }
  if (newPwd !== confirm) {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'As senhas não coincidem', type: 'error' });
    return;
  }
  if (newPwd.length < 8) {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'Mínimo 8 caracteres', type: 'error' });
    return;
  }
  onSavePassword(current, newPwd);
}

function updatePasswordStrengthUI(container: HTMLElement, strength: number) {
  const strengthBar = container.querySelector('.pas-pwd-strength');
  if (!strengthBar) return;

  const segs = strengthBar.querySelectorAll('.pas-pwd-strength-seg');
  const info = getPasswordStrengthLabel(strength);

  segs.forEach((seg: Element, i: number) => {
    seg.className = `pas-pwd-strength-seg ${i < strength ? `active ${info.class}` : ''}`;
  });

  const valueEl = strengthBar.querySelector('.pas-pwd-strength-value');
  if (valueEl) {
    valueEl.textContent = info.label;
    valueEl.className = `pas-pwd-strength-value ${info.class}`;
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, usingP18Intents: true, p22Compliant: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, p18IntentsAvailable: true }, p22Compliant: true }; }

export { VERSION, MODULE_ID };
export default { setupEventHandlers, info, healthCheck, VERSION, MODULE_ID };
