/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/init/lifecycle.ts
 * @version 1.0.0
 * Lifecycle setup and teardown
 * ═══════════════════════════════════════════════════════════════ */

import { MODULE_ID, VERSION, CSS_PREFIX } from '../core/constants.js';

const CSS_URLS = [
  '/components/panels/panel-gestao-paineis/styles/panel-gestao.css',
];

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

export function healthCheck(): { status: string; module: string; version: string; timestamp: string } {
  return {
    status: 'HEALTHY',
    module: MODULE_ID,
    version: VERSION,
    timestamp: new Date().toISOString(),
  };
}

export function info(): { version: string; moduleId: string; panelId: string; description: string } {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: 'panel-gestao-paineis',
    description: 'Painel administrativo para gerenciamento visual de todos os painéis do sistema',
  };
}
