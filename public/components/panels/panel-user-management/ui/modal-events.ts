// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management/ui/modal-events
// PURPOSE: Panel User Management - Modal Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   bindModalEvents() — exported function
//   unbindModalEvents() — exported function
//   showDetails() — exported function
//   hideDetails() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup + unbindModalEvents() (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';


export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-management/ui/modal-events';

let _abortController: AbortController | null = null;
let _listenerCount = 0;

export function bindModalEvents(container: HTMLElement, user: Record<string, unknown>, onAvatarToggle: () => void) {
  // Cleanup previous if any (idempotent re-bind)
  unbindModalEvents();

  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;

  const modalRoot = container.querySelector('[data-modal-root]');
  if (!modalRoot) return;
  // @ts-expect-error strict migration — TS2769
  modalRoot.addEventListener('click', (e: MouseEvent) => {
    const action = ((e.target as HTMLElement).closest('[data-action]') as HTMLElement | null)?.dataset?.action;
    if (action === 'toggle-avatars') {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onAvatarToggle === 'function') {
        onAvatarToggle();
      }
    }
  }, { signal });
  _listenerCount++;

  _bindAvatarGrid(container, user, signal);
  _bindFormEvents(container, signal);
}

function _bindAvatarGrid(container: HTMLElement, user: Record<string, unknown>, signal: AbortSignal) {
  const avatarGrid = container.querySelector('.avatar-grid');
  if (!avatarGrid) return;
  // @ts-expect-error strict migration — TS2769
  avatarGrid.addEventListener('click', (e: MouseEvent) => {
    const option = (e.target as HTMLElement).closest('[data-avatar-url]') as HTMLElement | null;
    if (!option) return;
    e.preventDefault();
    e.stopPropagation();
    avatarGrid.querySelectorAll('.avatar-option').forEach((el: Element) => el.classList.remove('selected'));
    option.classList.add('selected');
    const url = option.dataset.avatarUrl;
    const preview = container.querySelector('[data-avatar-preview]');
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="" class="avatar-img"><div class="avatar-overlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span class="avatar-cta">Alterar</span></div>`;
    }
    const input = container.querySelector('[data-avatar-input]') as HTMLInputElement | null;
    if (input) { input.value = url || ''; }
    user.avatar_url = url;
    user.avatar = url;
  }, { signal });
  _listenerCount++;
}

function _bindFormEvents(container: HTMLElement, signal: AbortSignal) {
  const form = container.querySelector('[data-form="edit-user"]');
  if (!form) return;
  form.addEventListener('input', (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.dataset.original) return;
    const isDirty = input.value !== input.dataset.original;
    input.closest('.form-group')?.classList.toggle('is-dirty', isDirty);
  }, { signal });
  _listenerCount++;
  form.addEventListener('change', (e: Event) => {
    const select = e.target as HTMLSelectElement;
    if (select.name === 'status') { select.className = `status-select status-${select.value}`; }
    if (!select.dataset.original) return;
    const isDirty = select.value !== select.dataset.original;
    select.closest('.form-group')?.classList.toggle('is-dirty', isDirty);
  }, { signal });
  _listenerCount++;
}

export function unbindModalEvents() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}

export function showDetails(detailsElement: HTMLElement | null) { if (detailsElement) { detailsElement.style.display = 'block'; } }

export function hideDetails(detailsElement: HTMLElement | null) { if (detailsElement) { detailsElement.style.display = 'none'; detailsElement.innerHTML = ''; } }

export default { bindModalEvents, unbindModalEvents, showDetails, hideDetails };
