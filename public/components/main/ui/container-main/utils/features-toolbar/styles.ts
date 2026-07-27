// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-SPRINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: styles
// PURPOSE: Features Toolbar - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _updateTooltipDelay() — exported function
//   _injectStyles() — exported function
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

export const VERSION = '15.3.0-SHELL-CSS';
export const MODULE_ID = 'main.ui.container-main.utils.features-toolbar.styles';

// ============================================================================
// #21-J — CSS EXTERNO
// Resolve o path do toolbar.css relativo ao módulo atual.
// Fallback: tenta caminho absoluto se import.meta.url não disponível.
// ============================================================================

function _getCssPath() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const moduleUrl = new URL(import.meta.url);
      const basePath = moduleUrl.pathname.substring(0, moduleUrl.pathname.lastIndexOf('/'));
      return `${basePath}/styles/toolbar.css`;
    }
  } catch (e) {}
  // Fallback: caminho absoluto conhecido
  return '/components/main/ui/container-main/utils/features-toolbar/styles/toolbar.css';
}

const _CSS_HREF = _getCssPath();

// ============================================================================
// #24: Atualiza CSS custom property do tooltip delay
// ============================================================================

export function _updateTooltipDelay(ms: number) {
  const toolbar = document.getElementById('features-toolbar');
  if (toolbar) {
    toolbar.style.setProperty('--ft-tooltip-delay', `${ms / 1000}s`);
  }
}

// ============================================================================
// #3-I: Guard contra múltiplas injeções simultâneas
// #21-J: Agora injeta <link> em vez de <style> inline
// ============================================================================

let _injecting = false;

export function _injectStyles() {
  if (_injecting) return;
  _injecting = true;
  try {
    // Limpa <style> legado inline se ainda existir
    const existingStyle = document.getElementById('features-toolbar-styles');
    if (existingStyle) existingStyle.remove();

    // #SHELL-CSS: Verifica se o <link> já existe no <head> (injetado pelo index.html)
    const existingLink = document.getElementById('features-toolbar-css');
    if (existingLink) {
      // Já presente (via index.html ou chamada anterior) — nada a fazer
      // Normalizar href para comparação correta (absoluto vs relativo)
      const currentHref = existingLink.getAttribute('href') || '';
      if (currentHref.endsWith('/styles/toolbar.css')) {
        return;
      }
      // href diferente: substituir
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.id = 'features-toolbar-css';
    link.rel = 'stylesheet';
    link.href = _CSS_HREF;
    document.head.appendChild(link);
  } finally {
    _injecting = false;
  }
}
