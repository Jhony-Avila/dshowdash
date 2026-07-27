// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:quick-actions
// PURPOSE: Quick Actions Manager - Botão flutuante com ações rápidas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FAB_POSITIONS — exported value
//   MENU_DIRECTIONS — exported value
//   ACTION_TYPES — exported value
//   createQuickActionsManager() — exported function
//   getQuickActionsManager() — exported function
//   init() — exported function
//   destroy() — exported function
//   open() — exported function
//   close() — exported function
//   toggle() — exported function
//   show() — exported function
//   hide() — exported function
//   addAction() — exported function
//   removeAction() — exported function
//   updateAction() — exported function
//   getAction() — exported function
//   getAllActions() — exported function
//   clearActions() — exported function
//   ... and 6 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'scroll'
// WINDOW ACCESS:
//   window.addEventListener
//   window.requestAnimationFrame
//   window.scrollY
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:quick-actions';

const logger = createLogger(MODULE_ID);

export const FAB_POSITIONS = Object.freeze({
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left'
});

export const MENU_DIRECTIONS = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
});

export const ACTION_TYPES = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success'
});

const DEFAULT_CONFIG = Object.freeze({
  position: FAB_POSITIONS.BOTTOM_RIGHT,
  menuDirection: MENU_DIRECTIONS.UP,
  mainIcon: '+',
  mainLabel: 'Ações',
  showLabels: true,
  showTooltips: true,
  closeOnAction: true,
  closeOnClickOutside: true,
  animationDuration: 200,
  offset: { x: 24, y: 24 },
  size: 56,
  miniSize: 40,
  hideOnScroll: false,
  scrollThreshold: 100
});

let _instance: Record<string, unknown> | null = null;
let _config: { [key: string]: any } = { ...DEFAULT_CONFIG };
let _isOpen = false;
let _isVisible = true;
let _isInitialized = false;
let _actions: unknown[] = [];
let _fabContainer: HTMLElement | null = null;
let _listeners: Array<(...args: unknown[]) => void> = [];
let _lastScrollY = 0;

const _metrics = { opens: 0, actionsExecuted: 0, errors: 0 };

function _emit(event: string, data: Record<string, unknown>) {
  _listeners.forEach(listener => { try { listener({ type: event, data, timestamp: Date.now() }); } catch (e) { _metrics.errors++; } });
}

function _getPositionStyles() {
  const { offset, position } = _config;
  const styles: Record<string, unknown> = {};
  switch (position) {
    case FAB_POSITIONS.BOTTOM_RIGHT: styles.bottom = `${offset.y}px`; styles.right = `${offset.x}px`; break;
    case FAB_POSITIONS.BOTTOM_LEFT: styles.bottom = `${offset.y}px`; styles.left = `${offset.x}px`; break;
    case FAB_POSITIONS.BOTTOM_CENTER: styles.bottom = `${offset.y}px`; styles.left = '50%'; styles.transform = 'translateX(-50%)'; break;
    case FAB_POSITIONS.TOP_RIGHT: styles.top = `${offset.y}px`; styles.right = `${offset.x}px`; break;
    case FAB_POSITIONS.TOP_LEFT: styles.top = `${offset.y}px`; styles.left = `${offset.x}px`; break;
  }
  return styles;
}

function _createFabUI() {
  if (_fabContainer) return;
  const posStyles = _getPositionStyles();
  const posStyleStr = Object.entries(posStyles).map(([k, v]) => `${k}: ${v}`).join('; ');
  _fabContainer = document.createElement('div');
  _fabContainer.id = 'dsd-quick-actions';
  _fabContainer.className = 'dsd-quick-actions';
  _fabContainer.innerHTML = `<style>.dsd-quick-actions{position:fixed;${posStyleStr};z-index:9999;display:flex;flex-direction:column;align-items:center;transition:opacity .2s ease,transform .2s ease}.dsd-quick-actions--hidden{opacity:0;pointer-events:none;transform:scale(.8)}.dsd-qa-menu{display:flex;flex-direction:column-reverse;align-items:center;gap:12px;margin-bottom:16px;opacity:0;pointer-events:none;transform:translateY(20px);transition:opacity ${_config.animationDuration}ms ease,transform ${_config.animationDuration}ms ease}.dsd-quick-actions--open .dsd-qa-menu{opacity:1;pointer-events:auto;transform:translateY(0)}.dsd-qa-action{display:flex;align-items:center;gap:12px;opacity:0;transform:scale(.5);transition:opacity ${_config.animationDuration}ms ease,transform ${_config.animationDuration}ms ease}.dsd-quick-actions--open .dsd-qa-action{opacity:1;transform:scale(1)}.dsd-qa-action:nth-child(1){transition-delay:0ms}.dsd-qa-action:nth-child(2){transition-delay:30ms}.dsd-qa-action:nth-child(3){transition-delay:60ms}.dsd-qa-action:nth-child(4){transition-delay:90ms}.dsd-qa-action:nth-child(5){transition-delay:120ms}.dsd-qa-action-btn{width:${_config.miniSize}px;height:${_config.miniSize}px;display:flex;align-items:center;justify-content:center;background:var(--cm-bg-elevated,#1e293b);border:1px solid var(--cm-border-default,rgba(139,92,246,.2));border-radius:50%;color:var(--cm-text-primary,white);font-size:18px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,.3);transition:transform .15s ease,box-shadow .15s ease,background .15s ease}.dsd-qa-action-btn:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,.4)}.dsd-qa-action-btn--primary{background:var(--cm-accent-primary,#8b5cf6);border-color:var(--cm-accent-primary,#8b5cf6)}.dsd-qa-action-btn--success{background:#22c55e;border-color:#22c55e}.dsd-qa-action-btn--danger{background:#ef4444;border-color:#ef4444}.dsd-qa-action-label{padding:6px 12px;background:var(--cm-bg-elevated,#1e293b);border:1px solid var(--cm-border-default,rgba(139,92,246,.2));border-radius:6px;color:var(--cm-text-primary,white);font-size:13px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.2);order:-1}.dsd-qa-main{width:${_config.size}px;height:${_config.size}px;display:flex;align-items:center;justify-content:center;background:var(--cm-accent-primary,#8b5cf6);border:none;border-radius:50%;color:white;font-size:24px;cursor:pointer;box-shadow:0 6px 20px rgba(139,92,246,.4);transition:transform .2s ease,box-shadow .2s ease,background .2s ease;position:relative;z-index:1}.dsd-qa-main:hover{transform:scale(1.05);box-shadow:0 8px 25px rgba(139,92,246,.5)}.dsd-qa-main:active{transform:scale(.95)}.dsd-quick-actions--open .dsd-qa-main{transform:rotate(45deg);background:var(--cm-bg-tertiary,#374151)}.dsd-qa-main-icon{transition:transform .2s ease}.dsd-qa-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:#ef4444;border-radius:10px;color:white;font-size:11px;font-weight:600;padding:0 6px}.dsd-qa-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;z-index:-1;opacity:0;pointer-events:none;transition:opacity ${_config.animationDuration}ms ease}.dsd-quick-actions--open .dsd-qa-backdrop{opacity:1;pointer-events:auto}</style><div class="dsd-qa-backdrop"></div><div class="dsd-qa-menu"></div><button class="dsd-qa-main" title="${_config.mainLabel}"><span class="dsd-qa-main-icon">${_config.mainIcon}</span></button>`;
  document.body.appendChild(_fabContainer);
  const mainBtn = _fabContainer.querySelector('.dsd-qa-main');
  const backdrop = _fabContainer.querySelector('.dsd-qa-backdrop');
  mainBtn!.addEventListener('click', () => toggle());
  if (_config.closeOnClickOutside) backdrop!.addEventListener('click', () => close());
  if (_config.hideOnScroll) _setupScrollListener();
}

function _setupScrollListener() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - _lastScrollY;
        if (Math.abs(delta) > _config.scrollThreshold) {
          if (delta > 0 && _isVisible) hide();
          else if (delta < 0 && !_isVisible) show();
          _lastScrollY = currentScrollY;
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

function _renderActions() {
  const menu = _fabContainer!.querySelector('.dsd-qa-menu');
  menu!.innerHTML = _actions.map((action, index) => {
    // @ts-expect-error TS migration - TS2339
    const typeClass = (action as Record<string, unknown>).type ? `dsd-qa-action-btn--${action.type}` : '';
    // @ts-expect-error TS migration - TS2339
    const label = _config.showLabels && (action as Record<string, unknown>).label ? `<span class="dsd-qa-action-label">${action.label}</span>` : '';
    // @ts-expect-error TS migration - TS2339
    return `<div class="dsd-qa-action" data-action-index="${index}"><button class="dsd-qa-action-btn ${typeClass}" title="${(action as Record<string, unknown>).label || ''}" data-action-id="${action.id}">${action.icon || '⚡'}</button>${label}</div>`;
  }).join('');
  // @ts-expect-error strict migration — TS2345
  menu!.querySelectorAll('.dsd-qa-action-btn').forEach((btn: HTMLButtonElement) => {
    // @ts-expect-error TS migration - TS2339
    btn.addEventListener('click', (e: MouseEvent) => { _executeAction(e.currentTarget.dataset.actionId); });
  });
}

function _executeAction(actionId: unknown) {
  const action = _actions.find(a => (a as Record<string, unknown>).id === actionId);
  if (!action) return;
  _metrics.actionsExecuted++;
  _emit('actionExecuted', { action });
  // @ts-expect-error TS migration - TS2339
  logger.info('Executing action', { label: (action as Record<string, unknown>).label || action.id });
  if (_config.closeOnAction) close();
  // @ts-expect-error TS migration - TS2339
  if (typeof (action as Record<string, unknown>).handler === 'function') { try { (action.handler as (...args: unknown[]) => unknown)(action); } catch (error) { _metrics.errors++; logger.error('Action execution failed', { error: error.message }); } }
}

export function createQuickActionsManager(options: Record<string, unknown> = {}) {
  _config = { ...DEFAULT_CONFIG, ...options };
  logger.info('Quick Actions Manager created');
  return { init, destroy, open, close, toggle, isOpen: () => _isOpen, show, hide, isVisible: () => _isVisible, addAction, removeAction, updateAction, getAction, getAllActions, clearActions, setPosition, setBadge, setMainIcon, subscribe, healthCheck, info };
}

export function getQuickActionsManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createQuickActionsManager(options); return _instance; }

export function init() { if (_isInitialized) return true; _createFabUI(); _renderActions(); _isInitialized = true; _emit('initialized', {}); logger.info('Initialized'); return true; }
export function destroy() { if (!_isInitialized) return true; if (_fabContainer) { _fabContainer.remove(); _fabContainer = null; } _actions = []; _isInitialized = false; logger.info('Destroyed'); return true; }
export function open() { if (!_isInitialized) init(); if (_isOpen) return; _isOpen = true; _metrics.opens++; _fabContainer!.classList.add('dsd-quick-actions--open'); _emit('opened', {}); }
export function close() { if (!_isOpen) return; _isOpen = false; _fabContainer!.classList.remove('dsd-quick-actions--open'); _emit('closed', {}); }
export function toggle() { if (_isOpen) close(); else open(); }
export function show() { if (!_fabContainer) return; _isVisible = true; _fabContainer.classList.remove('dsd-quick-actions--hidden'); _emit('shown', {}); }
export function hide() { if (!_fabContainer) return; _isVisible = false; close(); _fabContainer.classList.add('dsd-quick-actions--hidden'); _emit('hidden', {}); }

export function addAction(action: string) {
  // @ts-expect-error TS migration - TS2339
  if (!action.id) action.id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  // @ts-expect-error TS migration - TS2339
  _actions = _actions.filter(a => (a as Record<string, unknown>).id !== action.id);
  _actions.push({ type: ACTION_TYPES.SECONDARY, ...(action as unknown as Record<string, unknown>) });
  if (_isInitialized) _renderActions();
  _emit('actionAdded', { action });
  return action;
}

export function removeAction(actionId: unknown) { const index = _actions.findIndex(a => (a as Record<string, unknown>).id === actionId); if (index === -1) return false; const [removed] = _actions.splice(index, 1); if (_isInitialized) _renderActions(); _emit('actionRemoved', { action: removed }); return true; }
export function updateAction(actionId: unknown, updates: Record<string, unknown>) { const action = _actions.find(a => (a as Record<string, unknown>).id === actionId); if (!action) return null; Object.assign(action, updates); if (_isInitialized) _renderActions(); _emit('actionUpdated', { action }); return action; }
export function getAction(actionId: unknown) { return _actions.find(a => (a as Record<string, unknown>).id === actionId) || null; }
export function getAllActions() { return [..._actions]; }
export function clearActions() { const count = _actions.length; _actions = []; if (_isInitialized) _renderActions(); return count; }
// @ts-expect-error TS migration - TS2345, TS7015
export function setPosition(position: string) { if (!Object.values(FAB_POSITIONS).includes(position)) return false; _config.position = position; if (_fabContainer) { const posStyles = _getPositionStyles(); Object.entries(posStyles).forEach(([key, value]) => { _fabContainer.style[key] = value; }); } return true; }
// @ts-expect-error TS migration - TS2352, TS2339
export function setBadge(count: number) { if (!_fabContainer) return; const mainBtn = (_fabContainer.querySelector('.dsd-qa-main')) as string; let badge = mainBtn.querySelector('.dsd-qa-badge'); if (count > 0) { if (!badge) { badge = document.createElement('span'); badge.className = 'dsd-qa-badge'; mainBtn.appendChild(badge); } badge.textContent = count > 99 ? '99+' : count; } else if (badge) badge.remove(); }
// @ts-expect-error TS migration - TS2352, TS2339
export function setMainIcon(icon: HTMLImageElement) { if (!_fabContainer) return; const iconEl = (_fabContainer.querySelector('.dsd-qa-main-icon')) as string; if (iconEl) iconEl.innerHTML = icon; }
export function subscribe(callback: (...args: unknown[]) => void) { if (typeof callback !== 'function') return () => {}; _listeners.push(callback); return () => { const idx = _listeners.indexOf(callback); if (idx >= 0) _listeners.splice(idx, 1); }; }
export function healthCheck() { const checks = { initialized: _isInitialized, hasContainer: !!_fabContainer, hasActions: _actions.length > 0, noErrors: _metrics.errors === 0 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed >= 3 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, checks, actionCount: _actions.length, metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, fabPositions: Object.values(FAB_POSITIONS), menuDirections: Object.values(MENU_DIRECTIONS), actionTypes: Object.values(ACTION_TYPES), config: { position: _config.position, menuDirection: _config.menuDirection, showLabels: _config.showLabels }, isInitialized: _isInitialized, isOpen: _isOpen, isVisible: _isVisible, actionCount: _actions.length }; }

export default { VERSION, MODULE_ID, FAB_POSITIONS, MENU_DIRECTIONS, ACTION_TYPES, createQuickActionsManager, getQuickActionsManager, init, destroy, open, close, toggle, show, hide, addAction, removeAction, updateAction, getAction, getAllActions, clearActions, setPosition, setBadge, setMainIcon, subscribe, healthCheck, info };
