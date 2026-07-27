// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-user-menu-ui-renderer
// PURPOSE: User Menu - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getInitials, getAvatarColor from ./icons.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   updateDropdownPosition() — exported function
//   updateUI() — exported function
//   getMetrics() — exported function
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

import { getInitials, getAvatarColor } from './icons.js';

export const MODULE_ID = 'header-user-menu-ui-renderer';
export const VERSION = '1.4.0-P18EC';

let _metrics = { positionUpdates: 0, uiUpdates: 0 };

export function updateDropdownPosition(element: HTMLElement|null, dropdown: unknown) {
  if (!element || !dropdown) return;
  _metrics.positionUpdates++;
  const trigger = element.querySelector('.user-menu-trigger');
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  // @ts-expect-error TS migration - TS2339
  dropdown.style.position = 'fixed';
  // @ts-expect-error TS migration - TS2339
  dropdown.style.top = `${rect.bottom + 8}px`;
  // @ts-expect-error TS migration - TS2339
  dropdown.style.left = '8px';
  // @ts-expect-error TS migration - TS2339
  dropdown.style.right = 'auto';
}

export function updateUI(element: HTMLElement|null, dropdown: unknown, state: Record<string,unknown>) {
  if (!element || !dropdown) return;
  _metrics.uiUpdates++;
  const avatarContainer = element.querySelector('.user-avatar');
  const avatarImg = element.querySelector('.avatar-img');
  const avatarInitials = element.querySelector('.avatar-initials');
  // @ts-expect-error TS migration - TS2339
  const avatarLargeContainer = dropdown.querySelector('.user-avatar-large');
  // @ts-expect-error TS migration - TS2339
  const avatarLargeImg = dropdown.querySelector('.avatar-img');
  // @ts-expect-error TS migration - TS2339
  const avatarLargeInitials = dropdown.querySelector('.avatar-initials');
  const nameEl = element.querySelector('.user-name');
  // @ts-expect-error TS migration - TS2339
  const nameFullEl = dropdown.querySelector('.user-name-full');
  // @ts-expect-error TS migration - TS2339
  const roleEl = dropdown.querySelector('.user-role');
  const trigger = element.querySelector('.user-menu-trigger');
  
  if (state.user) {
    // @ts-expect-error TS migration - TS2339
    const initials = getInitials(state.user.name || state.user.fullName);
    // @ts-expect-error TS migration - TS2339
    const avatarUrl = state.user.avatar_url || state.user.avatar;
    const hasAvatar = avatarUrl && avatarUrl.length > 0 && !avatarUrl.includes('default');
    // @ts-expect-error TS migration - TS2339
    const bgColor = getAvatarColor(state.user.id);
    // @ts-expect-error TS migration - TS2339
    if (hasAvatar) { avatarImg.src = avatarUrl; avatarImg.style.display = 'block'; avatarInitials.style.display = 'none'; } 
    // @ts-expect-error TS migration - TS2339
    else { avatarImg.style.display = 'none'; avatarInitials.style.display = 'flex'; avatarInitials.textContent = initials; avatarContainer.style.background = bgColor; }
    if (hasAvatar) { avatarLargeImg.src = avatarUrl; avatarLargeImg.style.display = 'block'; avatarLargeInitials.style.display = 'none'; } 
    else { avatarLargeImg.style.display = 'none'; avatarLargeInitials.style.display = 'flex'; avatarLargeInitials.textContent = initials; avatarLargeContainer.style.background = bgColor; }
    // @ts-expect-error TS migration - TS2339
    const displayName = state.user.name || state.user.fullName || 'Usuário';
    nameEl!.textContent = displayName;
    // @ts-expect-error TS migration - TS2339
    nameFullEl.textContent = state.user.fullName || displayName;
    // @ts-expect-error TS migration - TS2339
    roleEl.textContent = state.user.funcao || state.user.role || 'user';
    element.dataset.status = 'ok';
    // @ts-expect-error TS migration - TS2339
    element.dataset.role = state.user.role || 'user';
  } else { 
    // @ts-expect-error TS migration - TS2339
    avatarImg.style.display = 'none'; avatarInitials.style.display = 'flex'; avatarInitials.textContent = '?';
    avatarLargeImg.style.display = 'none'; avatarLargeInitials.style.display = 'flex'; avatarLargeInitials.textContent = '?';
    nameEl!.textContent = 'Visitante'; nameFullEl.textContent = 'Visitante'; element.dataset.status = 'guest'; 
  }
  
  if (state.isOpen) {
    updateDropdownPosition(element, dropdown);
    // @ts-expect-error TS migration - TS2339
    dropdown.setAttribute('aria-hidden', 'false');
    // @ts-expect-error TS migration - TS2339
    dropdown.classList.add('is-open');
  } else {
    // P18EC: Remove focus from dropdown items BEFORE setting aria-hidden to avoid a11y warning
    const activeElement = document.activeElement;
    // @ts-expect-error TS migration - TS2339
    if (activeElement && dropdown.contains(activeElement)) {
      (activeElement as HTMLElement).blur();
    }
    // @ts-expect-error TS migration - TS2339
    dropdown.classList.remove('is-open');
    // @ts-expect-error TS migration - TS2339
    dropdown.setAttribute('aria-hidden', 'true');
  }
  
  trigger!.setAttribute('aria-expanded', String(state.isOpen));
  // @ts-expect-error TS migration - TS2345
  element.classList.toggle('is-open', state.isOpen);
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { rendererReady: true }, metrics: getMetrics() }; }
