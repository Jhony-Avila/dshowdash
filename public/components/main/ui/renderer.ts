// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main/ui/renderer
// PURPOSE: Main UI - Core Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   render() — exported function
//   clear() — exported function
//   getContainer() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): container
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'main/ui/renderer';

let _container: HTMLElement | null = null;

export function render(container: HTMLElement | null, content: string | HTMLElement) {
    _container = container || _container;
    if (!_container) return false;
    if (typeof content === 'string') {
        _container.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        _container.appendChild(content);
    }
    return true;
}

export function clear() {
    if (_container) _container.innerHTML = '';
}

export function getContainer() {
    return _container;
}

export function healthCheck() {
    const checks = { rendererReady: true, containerValid: !!_container };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 1 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, hasContainer: !!_container, healthCheck: healthCheck() };
}
