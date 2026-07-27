// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-button-factory
// PURPOSE: Factory centralizada para criação de botões NavRail
//          a partir do Registry (API SSOT)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NavRailButtonBase from ./button-base.js
//   NavRailRegistry from ../../registry/index.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   createButton(buttonId) — cria instância de botão
//   getInstance(buttonId) — singleton por buttonId
//   clearInstance(buttonId) — remove instância
//   clearAllInstances() — limpa todas as instâncias
//   createButtonExports(buttonId) — gera módulo exportável
//   buildConfigFromRegistry(buttonId) — config do registry
//   buildActionPayload(buttonId) — payload de ação
//   healthCheck() — diagnóstico de saúde
//   info() — metadata do módulo
//   VERSION — versão do módulo
//   MODULE_ID — identificador do módulo
//
// RECEIVES (via init/options):
//   buttonId — identificador do botão a criar
//
// EMITS (eventos): (none — delegado para NavRailButtonBase)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// NavRail Shared - Button Factory Enterprise
// @version 2.1.0-AAA
// @changelog v2.1.0-AAA - Added AAA Dependency Contract
'use strict';

import { NavRailButtonBase } from './button-base.js';
import { NavRailRegistry } from '../../registry/index.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const VERSION = '2.1.0-ES6';
const MODULE_ID = 'navrail-button-factory';

const _instances = new Map();

function buildConfigFromRegistry(buttonId: string) {
  const item = NavRailRegistry.getItem(buttonId);
  if (!item) {
    return { id: buttonId, label: buttonId, icon: 'default', area: 'navrail', group: 'unknown', meta: {} };
  }
  return {
    id: item.id,
    label: item.label,
    icon: item.icon,
    area: 'navrail',
    group: item.group,
    meta: {
      route: item.route,
      panelId: item.panelId,
      intentId: item.intentId,
      order: item.order
    }
  };
}

function buildActionPayload(buttonId: string) {
  const item = NavRailRegistry.getItem(buttonId);
  if (!item) {
    return { actionId: `navrail:${buttonId}`, meta: { route: `#/${buttonId}`, panelId: `panel-${buttonId}` } };
  }
  return {
    actionId: `navrail:${item.id}`,
    meta: {
      route: item.route || `#/${item.id}`,
      panelId: item.panelId || `panel-${item.id}`,
      intentId: item.intentId
    }
  };
}

function createButton(buttonId: string) {
  const config = buildConfigFromRegistry(buttonId);
  return new (NavRailButtonBase as unknown as new (c: Record<string, unknown>) => unknown)(config);
}

function getInstance(buttonId: string) {
  if (!_instances.has(buttonId)) {
    _instances.set(buttonId, createButton(buttonId));
  }
  return _instances.get(buttonId);
}

function clearInstance(buttonId: string) {
  if (_instances.has(buttonId)) {
    const inst = _instances.get(buttonId);
    if (inst && typeof inst.unmount === 'function') inst.unmount();
    _instances.delete(buttonId);
  }
}

function clearAllInstances() {
  _instances.forEach((inst, id) => {
    if (inst && typeof inst.unmount === 'function') inst.unmount();
  });
  _instances.clear();
}

function createButtonExports(buttonId: string) {
  const moduleId = `navrail/components/${buttonId}`;
  const version = '3.1.0-ES6';
  
  return {
    VERSION: version,
    MODULE_ID: moduleId,
    getInstance() { return getInstance(buttonId); },
    createButton() { return createButton(buttonId); },
    init(ctx: unknown) { return (getInstance(buttonId) as Record<string, unknown> & { init: (c: unknown) => unknown }).init(ctx); },
    mount(hostEl: HTMLElement, props: Record<string, unknown>) { return (getInstance(buttonId) as Record<string, unknown> & { mount: (h: HTMLElement, p: Record<string, unknown>) => unknown }).mount(hostEl, props); },
    unmount() { return getInstance(buttonId).unmount(); },
    healthCheck() { return getInstance(buttonId).healthCheck(); },
    info() {
      const baseInfo = getInstance(buttonId).info();
      return Object.assign({}, baseInfo, {
        actionPayload: buildActionPayload(buttonId),
        emits: [UI_EVENTS.ACTION],
        factoryGenerated: true
      });
    },
    getElement() { return getInstance(buttonId).getElement(); },
    isMounted() { return getInstance(buttonId).isMounted(); },
    getId() { return buttonId; },
    BUTTON_CONFIG: buildConfigFromRegistry(buttonId),
    ACTION_PAYLOAD: buildActionPayload(buttonId),
    EMITTED_EVENTS: [UI_EVENTS.ACTION]
  };
}

function healthCheck() {
  const instanceCount = _instances.size;
  let mountedCount = 0;
  _instances.forEach(inst => {
    if (inst && inst.isMounted && inst.isMounted()) mountedCount++;
  });
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    instanceCount,
    mountedCount,
    instances: Array.from(_instances.keys()),
    registrySource: NavRailRegistry.getSource ? NavRailRegistry.getSource() : 'unknown'
  };
}

function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    purpose: 'Centralized button creation from NavRailRegistry (API SSOT)',
    instanceCount: _instances.size,
    instances: Array.from(_instances.keys()),
    registryLoaded: NavRailRegistry.isLoaded ? NavRailRegistry.isLoaded() : false,
    registrySource: NavRailRegistry.getSource ? NavRailRegistry.getSource() : 'unknown',
    capabilities: ['createButton', 'getInstance', 'createButtonExports', 'clearInstance', 'clearAllInstances']
  };
}

export {
  createButton,
  getInstance,
  clearInstance,
  clearAllInstances,
  createButtonExports,
  buildConfigFromRegistry,
  buildActionPayload,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};

export default {
  createButton,
  getInstance,
  clearInstance,
  clearAllInstances,
  createButtonExports,
  buildConfigFromRegistry,
  buildActionPayload,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
