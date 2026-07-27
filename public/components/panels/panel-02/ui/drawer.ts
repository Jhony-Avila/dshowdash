// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/drawer
// PURPOSE: Panel-02 Drawer
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

export function openDrawer(container: HTMLElement, { title, content, onClose, width = '400px' }: { title: string; content: string; onClose?: () => void; width?: string }) {
    const drawer = document.createElement('div');
    drawer.className = 'p02-drawer';
    drawer.innerHTML = `
        <div class="p02-drawer-overlay"></div>
        <div class="p02-drawer-content" style="width: ${width}">
            <div class="p02-drawer-header">
                <h4>${title}</h4>
                <button class="p02-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="p02-drawer-body">${content}</div>
        </div>
    `;

    const close = () => {
        drawer.classList.remove('open');
        setTimeout(() => drawer.remove(), 300);
        onClose?.();
    };

    // @ts-expect-error strict migration — TS2531
    drawer.querySelector('.p02-drawer-close').addEventListener('click', close);
    // @ts-expect-error strict migration — TS2531
    drawer.querySelector('.p02-drawer-overlay').addEventListener('click', close);

    container.appendChild(drawer);
    requestAnimationFrame(() => drawer.classList.add('open'));

    return { close };
}

export default { openDrawer };

// ── Backward-compatibility alias ──────────────────────────────────────────────
// component.ts imports DrawerComponent as a class with:
//   new DrawerComponent(logger, { onAction })
//   .open(job)
//   .destroy()
// This class wraps the openDrawer() function to satisfy that contract.
export class DrawerComponent {
    private _logger: Record<string, unknown> | null;
    private _options: { onAction?: (action: string, job: Record<string, unknown>) => void };
    private _currentDrawer: { close: () => void } | null = null;
    private _container: HTMLElement | null = null;

    constructor(logger: Record<string, unknown> | null, options: { onAction?: (action: string, job: Record<string, unknown>) => void } = {}) {
        this._logger = logger;
        this._options = options;
    }

    open(job: Record<string, unknown>, container?: HTMLElement) {
        const target = container || this._container || document.body;
        this._currentDrawer?.close();
        const title = String(job.job_name || job.name || `Job ${job.id}`);
        const content = `<pre style="white-space:pre-wrap;font-size:0.85em">${JSON.stringify(job, null, 2)}</pre>`;
        this._currentDrawer = openDrawer(target, {
            title,
            content,
            onClose: () => { this._currentDrawer = null; }
        });
        this._logger?.debug?.('drawer.open', { jobId: job.id });
    }

    destroy() {
        this._currentDrawer?.close();
        this._currentDrawer = null;
        this._logger?.debug?.('drawer.destroy');
    }
}
// ─────────────────────────────────────────────────────────────────────────────

export const MODULE_ID = 'panel-02/ui/drawer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
