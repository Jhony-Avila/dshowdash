// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin:handlers:crud
// PURPOSE: Panel Header Admin - CRUD Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   openNewComponentModal() — exported function
//   openEditComponentModal() — exported function
//   closeModal() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger — via strict-mode compliant fallback
// ───────────────────────────────────────────────────────────────
// @changelog v4.1.0-STRICT-MODE - NR-FULL: Migração para strict mode
//            - Adicionado import de isStrict, recordViolation
//            - _getLogger() resolve via Ports > windowAdapter > fallback com recordViolation
//            - Em strict mode, não usa window.* fallback
// @changelog v4.0.0-PORTSFACTORY-ES6 - Versão anterior
// ═══════════════════════════════════════════════════════════════

'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import * as state from '../state/index.js';
import * as api from '../api/client.js';

const MODULE_ID = 'panel-header-admin:handlers:crud';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getLogger() {
  const logger = _getPort('logger');
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get('Logger');
    if (wl) return wl;
  }
  return null;
}

function log(level: string, msg: string, data?: unknown) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](`[${MODULE_ID}]`, msg, data);
}

export function openNewComponentModal() {
  state.setEditingComponent({ component_type: 'indicator', order_index: 0, show_on_mobile: 1, show_on_tablet: 1, show_on_desktop: 1, is_active: 1, uarps_trigger_id: null });
  state.setModalOpen(true);

  log('debug', 'New component modal opened');
}

export function openEditComponentModal(componentId: string | number) {
  const components = state.getComponents();
  const component = components.find(c => c.id == componentId);
  if (!component) { log('warn', 'Component not found', { componentId }); return; }
  state.setEditingComponent(component);
  state.setModalOpen(true);
  log('debug', 'Edit component modal opened', { componentId });
}


export function closeModal() { state.setEditingComponent(null); state.setModalOpen(false); log('debug', 'Modal closed'); }

export async function saveComponent(formData: FormData) {
  const editingComponent = state.getEditingComponent();
  const isNew = !editingComponent || !editingComponent.id;
  const payload = {
    component_key: formData.get('component_key'), label: formData.get('label'), component_type: formData.get('component_type'),
    group_id: formData.get('group_id') || null, icon_name: formData.get('icon_name') || null, tooltip: formData.get('tooltip') || null,
    description: formData.get('description') || null, order_index: parseInt(formData.get('order_index') as string) || 0,
    show_on_mobile: formData.get('show_on_mobile') ? 1 : 0, show_on_tablet: formData.get('show_on_tablet') ? 1 : 0,
    show_on_desktop: formData.get('show_on_desktop') ? 1 : 0, is_active: formData.get('is_active') ? 1 : 0,
    uarps_trigger_id: formData.get('uarps_trigger_id') || null
  };
  state.setLoading(true);
  try {
    let result;
    if (isNew) { result = await api.createComponent(payload); log('info', 'Component created', { key: payload.component_key }); }

    // @ts-expect-error TS migration - TS2339
    else { payload.id = editingComponent.id; result = await api.updateComponent(payload); log('info', 'Component updated', { id: payload.id }); }
    if (result.success) { closeModal(); await refreshComponents(); }
    return result;
  } catch (err: any) { log('error', 'Failed to save component', { error: err.message }); return { success: false, error: err.message }; }
  finally { state.setLoading(false); }
}

export async function deleteComponent(componentId: string | number) {
  state.setLoading(true);
  try {
    const result = await api.deleteComponent(componentId);
    if (result.success) { log('info', 'Component deleted', { componentId }); await refreshComponents(); }
    return result;
  } catch (err: any) { log('error', 'Failed to delete component', { error: err.message }); return { success: false, error: err.message }; }
  finally { state.setLoading(false); }
}

export async function toggleComponent(componentId: string | number) {
  const components = state.getComponents();
  const component = components.find(c => c.id == componentId);
  if (!component) return { success: false, error: 'Component not found' };
  const newStatus = component.is_active ? 0 : 1;
  return await api.updateComponent({ id: componentId, is_active: newStatus });
}

export async function refreshComponents() {
  state.setLoading(true);
  try {
    const result = await api.fetchComponents(true);
    if (result.success) { state.setComponents(result.data || []); }
    return result;
  } catch (err: any) { log('error', 'Failed to refresh components', { error: err.message }); return { success: false, error: err.message }; }
  finally { state.setLoading(false); }
}

export { VERSION, MODULE_ID };
