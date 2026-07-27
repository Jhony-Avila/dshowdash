// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: content-api
// PURPOSE: Content API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createContentAPI() — exported function
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.container-factory.api.content-api';

export function createContentAPI(context: Record<string, unknown>) {
  const refs = context.refs as Record<string, unknown>;
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    setContent(content: string | HTMLElement) {
      const contentEl = refs.contentEl as HTMLElement | null;
      if (!contentEl) return this;
      if (typeof content === 'string') contentEl.innerHTML = content;
      else if (content instanceof HTMLElement) {
        contentEl.innerHTML = '';
        contentEl.appendChild(content);
      }
      return this;
    },
    getContent() { return refs.contentEl as HTMLElement | null; },
    setTitle(title: string) { (getComponents().header as Record<string, (...args: unknown[]) => unknown> | undefined)?.setTitle?.(title); return this; },
    setIcon(icon: HTMLImageElement) { (getComponents().header as Record<string, (...args: unknown[]) => unknown> | undefined)?.setIcon?.(icon); return this; }
  };
}

export default { createContentAPI };
