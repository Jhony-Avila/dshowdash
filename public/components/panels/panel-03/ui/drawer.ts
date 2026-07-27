// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03/ui/drawer
// PURPOSE: Panel-03 Drawer
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

export function openDrawer(container: HTMLElement, { title, content, onClose, position = 'right' }: { title: string; content: string; onClose?: () => void; position?: string }) {
    const drawer = document.createElement('div');
    drawer.className = `p03-drawer p03-drawer-${position}`;
    drawer.innerHTML = `
        <div class="p03-drawer-overlay"></div>
        <div class="p03-drawer-content">
            <div class="p03-drawer-header">
                <h4>${title}</h4>
                <button class="p03-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p03-drawer-body">${content}</div>
        </div>
    `;

    const close = () => {
        drawer.classList.remove('open');
        setTimeout(() => drawer.remove(), 300);
        onClose?.();
    };

    // @ts-expect-error strict migration — TS2531
    drawer.querySelector('.p03-drawer-close').addEventListener('click', close);
    // @ts-expect-error strict migration — TS2531
    drawer.querySelector('.p03-drawer-overlay').addEventListener('click', close);

    container.appendChild(drawer);
    requestAnimationFrame(() => drawer.classList.add('open'));

    return { close };
}

export default { openDrawer };

export const MODULE_ID = 'panel-03/ui/drawer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
