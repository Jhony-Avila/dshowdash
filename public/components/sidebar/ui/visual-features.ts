// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-NCS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-visual-features
// PURPOSE: Sidebar UI - Visual Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_CLASSES as C from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   showSkeleton() — exported function
//   hideSkeleton() — exported function
//   setupRippleEffect() — exported function
//   refreshRippleEffect() — exported function
//   setLoading() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'animationend'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CSS_CLASSES as C } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.0.0-NCS';
export const MODULE_ID = 'sidebar-visual-features';

let _metrics = { skeletonShows: 0, skeletonHides: 0, rippleSetups: 0, loadingChanges: 0, errors: 0 };

function createSkeletonItem(hasShortText = false) { const item = document.createElement('div'); item.className = C.SKELETON_ITEM; item.innerHTML = `<div class="${C.SKELETON_ICON}"></div><div class="${C.SKELETON_TEXT}${hasShortText ? ` ${C.SKELETON_TEXT_SHORT}` : ''}"></div>`; return item; }
function createSkeletonGroup() { const group = document.createElement('div'); group.className = C.SKELETON_GROUP; group.innerHTML = `<div class="${C.SKELETON_ICON}"></div><div class="${C.SKELETON_TEXT}"></div>`; return group; }

export function showSkeleton(sidebar: DynObj, itemCount = 8) {
  try {
    if (!sidebar) return false;
    const navContent = sidebar.querySelector(`.${C.NAV_CONTENT}, [data-slot="nav-items"]`);
    if (!navContent) return false;
    navContent.dataset.originalContent = navContent.innerHTML;
    const skeleton = document.createElement('div');
    skeleton.className = C.SKELETON;
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.setAttribute('role', 'presentation');
    skeleton.appendChild(createSkeletonGroup());
    for (let i = 0; i < 3; i++) skeleton.appendChild(createSkeletonItem(i === 2));
    skeleton.appendChild(createSkeletonGroup());
    for (let i = 0; i < Math.min(itemCount - 3, 5); i++) skeleton.appendChild(createSkeletonItem(i === 4));
    navContent.innerHTML = '';
    navContent.appendChild(skeleton);
    sidebar.classList.add(C.MOD_LOADING_SKELETON);
    _metrics.skeletonShows++;
    return true;
  } catch (error) { _metrics.errors++; return false; }
}

export function hideSkeleton(sidebar: DynObj) {
  try {
    if (!sidebar) return false;
    const navContent = sidebar.querySelector(`.${C.NAV_CONTENT}, [data-slot="nav-items"]`);
    if (!navContent) return false;
    if (navContent.dataset.originalContent) { navContent.innerHTML = navContent.dataset.originalContent; delete navContent.dataset.originalContent; }
    const skeleton = navContent.querySelector(`.${C.SKELETON}`);
    if (skeleton) skeleton.remove();
    sidebar.classList.remove(C.MOD_LOADING_SKELETON);
    _metrics.skeletonHides++;
    return true;
  } catch (error) { _metrics.errors++; return false; }
}

function createRipple(event: DynObj) {
  const element = event.currentTarget;
  element.querySelectorAll(`.${C.RIPPLE}`).forEach((r: DynObj) => r.remove());
  const ripple = document.createElement('span');
  ripple.className = C.RIPPLE;
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  element.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

export function setupRippleEffect(sidebar: DynObj) {
  try {
    if (!sidebar) return null;
    const links = sidebar.querySelectorAll(`.${C.LINK}`);
    links.forEach((link: DynObj) => link.addEventListener('click', createRipple));
    _metrics.rippleSetups++;
    return () => { links.forEach((link: DynObj) => link.removeEventListener('click', createRipple)); };
  } catch (error) { _metrics.errors++; return null; }
}

export function refreshRippleEffect(sidebar: DynObj) {
  try { if (!sidebar) return null; sidebar.querySelectorAll(`.${C.LINK}`).forEach((link: DynObj) => link.removeEventListener('click', createRipple)); return setupRippleEffect(sidebar); }
  catch (error) { _metrics.errors++; return null; }
}

export function setLoading(sidebar: DynObj, loading: boolean) { try { if (!sidebar) return false; sidebar.classList.toggle(C.MOD_LOADING, loading); _metrics.loadingChanges++; return true; } catch (error) { _metrics.errors++; return false; } }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, features: ['skeleton', 'ripple', 'loading'], metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, features: ['skeleton', 'ripple', 'loading'], metrics: getMetrics() }; }

export default { VERSION, MODULE_ID, showSkeleton, hideSkeleton, setupRippleEffect, refreshRippleEffect, setLoading, getMetrics, info, healthCheck };
