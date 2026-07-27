// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-adapter-port
// PURPOSE: UIAdapterPort - Contrato de UI Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UIAdapterPortContract — exported value
//   createNullUIAdapterPort() — exported function
//   createUIAdapterPort() — exported function
//   validateUIAdapterPort() — exported function
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

export const VERSION = '2.1.0-AAA-P4';
export const MODULE_ID = 'ui-adapter-port';

export const UIAdapterPortContract = { render: 'function', update: 'function', destroy: 'function' };

export function createNullUIAdapterPort() {
  return { render: (): null => null, update: (): boolean => false, destroy: (): void => {} };
}

export function createUIAdapterPort(deps: Record<string, unknown> = {}) {
  let _rendered = new Map();
  let _metrics = { rendered: 0, updated: 0, destroyed: 0 };
  return {
    render(id: string, container: HTMLElement | null, template: string | HTMLElement) {
      try {
        if (!container) return null;
        const el = document.createElement('div');
        el.id = id;
        if (typeof template === 'string') el.innerHTML = template;
        else if (template instanceof HTMLElement) el.appendChild(template);
        container.appendChild(el);
        _rendered.set(id, el);
        _metrics.rendered++;
        return el;
      } catch (e) { return null; }
    },
    update(id: string, content: string) {
      try {
        const el = _rendered.get(id);
        if (!el) return false;
        if (typeof content === 'string') el.innerHTML = content;
        _metrics.updated++;
        return true;
      } catch (e) { return false; }
    },
    destroy(id: string) {
      try {
        const el = _rendered.get(id);
        if (el) { el.remove(); _rendered.delete(id); _metrics.destroyed++; }
        return true;
      } catch (e) { return false; }
    },
    getElement(id: string) { return _rendered.get(id) || null; },
    getMetrics() { return { ..._metrics, count: _rendered.size }; }
  };
}

export function validateUIAdapterPort(port: Record<string, unknown> | null | undefined) { return port && typeof port.render === 'function'; }

export function healthCheck(port: Record<string, unknown> | null | undefined) {
  return { status: typeof port?.render === 'function' ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { hasRender: typeof port?.render === 'function', hasUpdate: typeof port?.update === 'function', hasDestroy: typeof port?.destroy === 'function' } };
}

export default { UIAdapterPortContract, createNullUIAdapterPort, createUIAdapterPort, validateUIAdapterPort, healthCheck, VERSION, MODULE_ID };
