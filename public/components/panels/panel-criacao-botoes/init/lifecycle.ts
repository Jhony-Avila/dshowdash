/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/init/lifecycle.ts
 * @version 1.0.0
 * Setup/teardown: carga de CSS, healthCheck, info.
 * ═══════════════════════════════════════════════════════════════ */

import { MODULE_ID, VERSION, PANEL_ID, CSS_PREFIX } from '../core/constants.js';

const CSS_URLS = ['/components/panels/panel-criacao-botoes/styles/index.css'];

export function loadCSS(): void {
  for (const url of CSS_URLS) {
    const id = `css-${CSS_PREFIX}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}

export function healthCheck(): {
  status: string;
  checks: Record<string, boolean>;
  moduleId: string;
  version: string;
  timestamp: number;
} {
  return {
    status: 'HEALTHY',
    checks: { moduleReady: true },
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now(),
  };
}

export function info(): {
  version: string;
  moduleId: string;
  panelId: string;
  description: string;
} {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: PANEL_ID,
    description:
      'Visão especializada da sidebar: criação/edição dos botões em ui_nav_items via adapter compartilhado.',
  };
}
