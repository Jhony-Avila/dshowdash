// toolbar-wiring/wire-accessibility.js
// @version 1.1.0-PAB-ES6
// @description Wiring de a11y dropdown + font-increase/decrease, high-contrast, focus-mode
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS (dynamic): ../accessibility-manager/index.js
// PROVIDES: wireAccessibility(toolbar, wired, failed, logger)
// ACTIONS: a11y, a11y-font-increase, a11y-font-decrease, a11y-high-contrast, a11y-focus-mode
// BROWSER-APIS: document.documentElement.style.fontSize, document.documentElement.classList,
//               getComputedStyle
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-accessibility';

// ── FALLBACKS (usados quando o manager não está disponível) ─────────────
function _fontIncreaseFallback() {
  const root = document.documentElement;
  const current = parseFloat(getComputedStyle(root).fontSize) || 16;
  root.style.fontSize = `${Math.min(current + 2, 24)}px`;
}

function _fontDecreaseFallback() {
  const root = document.documentElement;
  const current = parseFloat(getComputedStyle(root).fontSize) || 16;
  root.style.fontSize = `${Math.max(current - 2, 10)}px`;
}

function _highContrastFallback() {
  document.documentElement.classList.toggle('high-contrast');
}

function _focusModeFallback() {
  document.documentElement.classList.toggle('focus-mode');
}

/**
 * Conecta acessibilidade — dropdown + sub-ações com fallback nativo
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireAccessibility(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  try {
    const a11yModule = await import('../accessibility-manager/index.js');
    const a11y = (a11yModule.getAccessibilityManager?.() || a11yModule) as Record<string, ((...args: unknown[]) => unknown) | null | undefined>;

    const announceA11y = a11y.announce || a11yModule.announce;

    toolbar.registerAction('a11y', () => {
      logger.debug('A11y dropdown opened');
    });
    wired.push('a11y');

    // ── Font increase ───────────────────────────────────────────────────
    const fontIncreaseFn = a11y.increaseFontSize || a11y.fontIncrease;
    if (fontIncreaseFn) {
      toolbar.registerAction('a11y-font-increase', () => {
        fontIncreaseFn();
        if (announceA11y) announceA11y('Fonte aumentada');
      });
    } else {
      toolbar.registerAction('a11y-font-increase', () => {
        _fontIncreaseFallback();
        logger.debug('A11y: font increased to', { size: document.documentElement.style.fontSize });
        if (announceA11y) announceA11y('Fonte aumentada');
      });
    }
    wired.push('a11y-font-increase');

    // ── Font decrease ───────────────────────────────────────────────────
    const fontDecreaseFn = a11y.decreaseFontSize || a11y.fontDecrease;
    if (fontDecreaseFn) {
      toolbar.registerAction('a11y-font-decrease', () => {
        fontDecreaseFn();
        if (announceA11y) announceA11y('Fonte diminuída');
      });
    } else {
      toolbar.registerAction('a11y-font-decrease', () => {
        _fontDecreaseFallback();
        logger.debug('A11y: font decreased to', { size: document.documentElement.style.fontSize });
        if (announceA11y) announceA11y('Fonte diminuída');
      });
    }
    wired.push('a11y-font-decrease');

    // ── High contrast ───────────────────────────────────────────────────
    const highContrastFn = a11y.toggleHighContrast || a11y.highContrast;
    if (highContrastFn) {
      toolbar.registerAction('a11y-high-contrast', () => {
        highContrastFn();
        if (announceA11y) announceA11y('Alto contraste alternado');
      });
    } else {
      toolbar.registerAction('a11y-high-contrast', () => {
        _highContrastFallback();
        const isOn = document.documentElement.classList.contains('high-contrast');
        logger.debug('A11y: high contrast', { enabled: isOn });
        if (announceA11y) announceA11y(isOn ? 'Alto contraste ativado' : 'Alto contraste desativado');
      });
    }
    wired.push('a11y-high-contrast');

    // ── Focus mode ──────────────────────────────────────────────────────
    const focusModeFn = a11y.toggleFocusMode || a11y.focusMode;
    if (focusModeFn) {
      toolbar.registerAction('a11y-focus-mode', () => {
        focusModeFn();
        if (announceA11y) announceA11y('Modo foco alternado');
      });
    } else {
      toolbar.registerAction('a11y-focus-mode', () => {
        _focusModeFallback();
        const isOn = document.documentElement.classList.contains('focus-mode');
        logger.debug('A11y: focus mode', { enabled: isOn });
        if (announceA11y) announceA11y(isOn ? 'Modo foco ativado' : 'Modo foco desativado');
      });
    }
    wired.push('a11y-focus-mode');
  } catch (e) {
    logger.warn('Accessibility Manager indisponível', { error: (e as Error).message });
    toolbar.registerAction('a11y', () => { logger.debug('A11y dropdown opened (sem manager)'); });
    wired.push('a11y');
    toolbar.registerAction('a11y-font-increase', _fontIncreaseFallback);
    wired.push('a11y-font-increase');
    toolbar.registerAction('a11y-font-decrease', _fontDecreaseFallback);
    wired.push('a11y-font-decrease');
    toolbar.registerAction('a11y-high-contrast', _highContrastFallback);
    wired.push('a11y-high-contrast');
    toolbar.registerAction('a11y-focus-mode', _focusModeFallback);
    wired.push('a11y-focus-mode');
  }
}
