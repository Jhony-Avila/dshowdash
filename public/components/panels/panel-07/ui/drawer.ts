// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-07/ui/drawer
// PURPOSE: Panel-07 Drawer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   openDrawer() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export function openDrawer(container: HTMLElement, { title, content, onClose }: { title: string; content: string; onClose?: () => void }) {
    const drawer = document.createElement('div');
    drawer.className = 'p07-drawer';
    drawer.innerHTML = `
        <div class="p07-drawer-overlay"></div>
        <div class="p07-drawer-content">
            <div class="p07-drawer-header">
                <h4>${title}</h4>
                <button class="p07-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p07-drawer-body">${content}</div>
        </div>
    `;

    const close = () => {
        drawer.classList.remove('open');
        setTimeout(() => drawer.remove(), 300);
        onClose?.();
    };

    // @ts-expect-error strict migration — TS2531
    drawer.querySelector('.p07-drawer-close').addEventListener('click', close);
    // @ts-expect-error strict migration — TS2531
    drawer.querySelector('.p07-drawer-overlay').addEventListener('click', close);

    container.appendChild(drawer);
    requestAnimationFrame(() => drawer.classList.add('open'));

    return { close };
}

export default { openDrawer };

// ── Backward-compatibility aliases ──────────────────────────────
/** @deprecated Use openDrawer() directly. Alias for backward compatibility. */
export const DrawerComponent = { openDrawer };

export const MODULE_ID = 'panel-07/ui/drawer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
