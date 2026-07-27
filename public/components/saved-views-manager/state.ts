// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components-saved-views-manager-state
// PURPOSE: SavedViewsManager - State Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getViews() — exported function
//   setViews() — exported function
//   getViewTypes() — exported function
//   setViewTypes() — exported function
//   isInitialized() — exported function
//   setInitialized() — exported function
//   reset() — exported function
//   getByType() — exported function
//   getDefault() — exported function
//   getShared() — exported function
//   getOwned() — exported function
//   getViewById() — exported function
//   getViewByKey() — exported function
//   updateViewDefault() — exported function
//   removeView() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export interface SavedView {
  id: number;
  view_key: string;
  view_label: string;
  view_type: string;
  config: Record<string, unknown>;
  is_default: boolean;
  is_shared: boolean;
  is_owner: boolean;
  [key: string]: unknown;
}

export interface ViewType {
  key: string;
  label: string;
  [key: string]: unknown;
}

const MODULE_ID = 'components-saved-views-manager-state';
const VERSION = '1.1.0-ENTERPRISE';

let _views: SavedView[] = [];
let _viewTypes: ViewType[] = [];
let _isInitialized = false;

export function getViews(): SavedView[] { return _views.slice(); }
export function setViews(views: SavedView[]): void { _views = views; }

export function getViewTypes(): ViewType[] { return _viewTypes.slice(); }
export function setViewTypes(types: ViewType[]): void { _viewTypes = types; }

export function isInitialized(): boolean { return _isInitialized; }
export function setInitialized(val: boolean): void { _isInitialized = val; }

export function reset(): void { _views = []; _viewTypes = []; _isInitialized = false; }

export function getByType(type: string): SavedView[] { return _views.filter(v => v.view_type === type); }
export function getDefault(type?: string): SavedView | undefined { if (type) return _views.find(v => v.view_type === type && v.is_default); return _views.find(v => v.is_default); }
export function getShared(): SavedView[] { return _views.filter(v => v.is_shared && !v.is_owner); }
export function getOwned(): SavedView[] { return _views.filter(v => v.is_owner); }
export function getViewById(viewId: number | string): SavedView | null { return _views.find(v => v.id == viewId) || null; }
export function getViewByKey(viewKey: string): SavedView | null { return _views.find(v => v.view_key === viewKey) || null; }
export function updateViewDefault(viewId: number | string): void { _views.forEach(v => { v.is_default = (v.id == viewId); }); }
export function removeView(viewId: number | string): void { _views = _views.filter(v => v.id != viewId); }

export { MODULE_ID, VERSION };
export function info(): Record<string, string> { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck(): Record<string, unknown> { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
