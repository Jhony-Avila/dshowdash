// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-ABSOLUTE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ports-factory
// PURPOSE: Initializer - Ports Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createNavigationPort from /components/main/ports/NavigationPort.js
//   createAuthPort from /components/main/ports/AuthPort.js
//   createStatePort from /components/main/ports/StatePort.js
//   createPanelPort from /components/main/ports/PanelPort.js
//   createCanvasPort from /components/main/ports/CanvasPort.js
//   createTelemetryPort from /components/main/ports/TelemetryPort.js
//   createUIAdapterPort from /components/main/ports/UIAdapterPort.js
//   createContainerPort from /components/main/ports/ContainerPort.js
//
// PROVIDES:
//   createPorts() — exported function
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
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.core.initializer.core.ports-factory';

import { createNavigationPort } from '/components/main/ports/NavigationPort.js';
import { createAuthPort } from '/components/main/ports/AuthPort.js';
import { createStatePort } from '/components/main/ports/StatePort.js';
import { createPanelPort } from '/components/main/ports/PanelPort.js';
import { createCanvasPort } from '/components/main/ports/CanvasPort.js';
import { createTelemetryPort } from '/components/main/ports/TelemetryPort.js';
import { createUIAdapterPort } from '/components/main/ports/UIAdapterPort.js';
import { createContainerPort } from '/components/main/ports/ContainerPort.js';

// ============================================================================
// PORTS FACTORY
// ============================================================================

/**
 * Cria todos os ports necessários
 * @param {Object} adapters - Adapters já criados
 * @param {Object} deps - Dependências adicionais
 * @returns {Object} ports
 */
export function createPorts(adapters: Record<string, Record<string, unknown>>, deps: { eventBusAdapter: unknown; containerAdapter: unknown }) {
  const eventBusAdapter = deps.eventBusAdapter;
  const containerAdapter = deps.containerAdapter;
  
  const containerPort = createContainerPort(containerAdapter as Record<string, unknown>);
  
  const telemetryPort = createTelemetryPort({
    track(event: string, data: unknown) { (adapters.telemetry.track as (e: string, d: unknown) => void)(event, data); },
    error(err: unknown, ctx: unknown) { (adapters.telemetry.error as (e: unknown, c: unknown) => void)(err, ctx); },
    timeline(event: string, data: unknown) {
      if (adapters.telemetry.timeline) (adapters.telemetry.timeline as (e: string, d: unknown) => void)(event, data);
    }
  });
  
  const navigationPort = createNavigationPort({
    onNavigate(route: string) { (adapters.router.navigate as (r: string) => void)(route); },
    onRouteChange(handler: (...args: unknown[]) => void) { (adapters.router.onRouteChange as (h: (...args: unknown[]) => void) => void)(handler); },
    prefetch(route: string) {
      if (adapters.router.prefetch) (adapters.router.prefetch as (r: string) => void)(route);
    },
    resolveMetadata(route: string) {
      if (adapters.router.resolveMetadata) return (adapters.router.resolveMetadata as (r: string) => unknown)(route);
    }
  });
  
  const authPort = createAuthPort({
    getUser() { return (adapters.auth.getUser as () => unknown)(); },
    isAuthenticated() { return (adapters.auth.isAuthenticated as () => boolean)(); },
    hasRole(role: string) {
      return adapters.auth.hasRole ? (adapters.auth.hasRole as (r: string) => boolean)(role) : false;
    },
    hasCapability(cap: string) {
      return adapters.auth.hasCapability ? (adapters.auth.hasCapability as (c: string) => boolean)(cap) : false;
    },
    getLevel() {
      return adapters.auth.getLevel ? (adapters.auth.getLevel as () => unknown)() : null;
    },
    onAuthChange(handler: (...args: unknown[]) => void) { (adapters.auth.onAuthChange as (h: (...args: unknown[]) => void) => void)(handler); },
    onRoleChange(handler: (...args: unknown[]) => void) {
      if (adapters.auth.onRoleChange) (adapters.auth.onRoleChange as (h: (...args: unknown[]) => void) => void)(handler);
    },
    evaluatePolicy(resource: string, action: string) {
      return adapters.auth.evaluatePolicy ? (adapters.auth.evaluatePolicy as (r: string, a: string) => unknown)(resource, action) : null;
    }
  });
  
  const statePort = createStatePort({
    get(key: string) { return (adapters.state.get as (k: string) => unknown)(key); },
    set(key: string, value: unknown) { (adapters.state.set as (k: string, v: unknown) => void)(key, value); },
    subscribe(key: string, handler: (...args: unknown[]) => void) { (adapters.state.subscribe as (k: string, h: (...args: unknown[]) => void) => void)(key, handler); },
    getState() {
      return adapters.state.getState ? (adapters.state.getState as () => unknown)() : null;
    },
    createSlice(name: string, initial: unknown, reducers: unknown) {
      return adapters.state.createSlice ? (adapters.state.createSlice as (n: string, i: unknown, r: unknown) => unknown)(name, initial, reducers) : null;
    },
    select(fn: unknown) {
      return adapters.state.select ? (adapters.state.select as (f: unknown) => unknown)(fn) : null;
    }
  });
  
  const panelPort = createPanelPort({
    load(panelId: string) { return (adapters.panelLoader.load as (id: string) => unknown)(panelId); },
    mount(module: unknown, container: unknown, config: unknown) {
      return (adapters.panelLoader.mount as (m: unknown, c: unknown, cfg: unknown) => unknown)(module, container, config);
    },
    unmount(module: unknown) { return (adapters.panelLoader.unmount as (m: unknown) => unknown)(module); },
    resolvePanelFromManifest(manifest: unknown, route: string) {
      return adapters.panelLoader.resolvePanelFromManifest
        ? (adapters.panelLoader.resolvePanelFromManifest as (m: unknown, r: string) => unknown)(manifest, route)
        : null;
    }
  });
  
  const canvasPort = createCanvasPort({
    init(container: unknown) { return (adapters.canvas.init as (c: unknown) => unknown)(container); },
    clear() { return (adapters.canvas.clear as () => unknown)(); }
  });
  
  const uiLegacyPort = createUIAdapterPort({
    selectMainContainer() { return (adapters.dom.selectMainContainer as () => unknown)(); },
    render(html: string) { return (adapters.dom.render as (h: string) => unknown)(html); },
    clear() { return (adapters.dom.clear as () => unknown)(); }
  });
  
  return {
    events: eventBusAdapter,
    ui: adapters.ui,
    container: containerPort,
    navigation: navigationPort,
    timer: adapters.timer,
    globals: adapters.globals,
    auth: authPort,
    state: statePort,
    panel: panelPort,
    canvas: canvasPort,
    telemetry: telemetryPort,
    uiLegacy: uiLegacyPort
  };
}

export default {
  createPorts
};
