// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.utils.a11y-audit
// PURPOSE: utils   a11y audit
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   WCAG_LEVELS — exported value
//   SEVERITY — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   audit() — exported function
//   quickAudit() — exported function
//   getFixSuggestions() — exported function
//   autoFix() — exported function
//   generateReport() — exported function
//   getRules() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Preloader A11y Audit v1.2.0-P17WI
// @version 1.2.0-P17WI
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
// Auditoria de acessibilidade

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader.utils.a11y-audit';

const hasWindow = typeof window !== 'undefined';

// P17WI PORTS PATTERN
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown> = {}) {
  const logger = _getPort('logger');
  if (!logger) return;
  if (typeof logger[level] === 'function') {
    logger[level](msg, { component: MODULE_ID, ...ctx });
  }
}

// WCAG Levels
export const WCAG_LEVELS = Object.freeze({
  A: 'A',
  AA: 'AA',
  AAA: 'AAA'
});

// Issue severities
export const SEVERITY = Object.freeze({
  CRITICAL: 'critical',
  SERIOUS: 'serious',
  MODERATE: 'moderate',
  MINOR: 'minor'
});

// AUDIT RULES
const RULES = [
  {
    id: 'aria-live-region',
    name: 'ARIA Live Region',
    description: 'Preloader should have aria-live for screen readers',
    wcag: '4.1.3',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.CRITICAL,
    test: (element: Element) => {
      const hasAriaLive = element.getAttribute('aria-live') !== null;
      const hasRole = element.getAttribute('role') === 'status' || element.getAttribute('role') === 'alert';
      return hasAriaLive || hasRole;
    },
    fix: 'Add aria-live="polite" or role="status" to the preloader container'
  },
  {
    id: 'aria-busy',
    name: 'ARIA Busy State',
    description: 'Loading state should use aria-busy',
    wcag: '4.1.2',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.SERIOUS,
    test: (element: Element) => element.getAttribute('aria-busy') !== null,
    fix: 'Add aria-busy="true" while loading, remove when complete'
  },
  {
    id: 'progress-role',
    name: 'Progress Bar Role',
    description: 'Progress bar should have role="progressbar"',
    wcag: '4.1.2',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.SERIOUS,
    test: (element: Element) => {
      const progressBar = element.querySelector('[data-preloader-progress], .progress-bar, [class*="progress"]');
      if (!progressBar) return true;
      return progressBar.getAttribute('role') === 'progressbar';
    },
    fix: 'Add role="progressbar" to the progress element'
  },
  {
    id: 'progress-value',
    name: 'Progress Value Attributes',
    description: 'Progress bar should have aria-valuenow, aria-valuemin, aria-valuemax',
    wcag: '4.1.2',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.SERIOUS,
    test: (element: Element) => {
      const progressBar = element.querySelector('[role="progressbar"]');
      if (!progressBar) return true;
      return progressBar.hasAttribute('aria-valuenow') &&
             progressBar.hasAttribute('aria-valuemin') &&
             progressBar.hasAttribute('aria-valuemax');
    },
    fix: 'Add aria-valuenow, aria-valuemin="0", aria-valuemax="100" to progressbar'
  },
  {
    id: 'color-contrast',
    name: 'Color Contrast',
    description: 'Text should have sufficient contrast (4.5:1 for normal, 3:1 for large)',
    wcag: '1.4.3',
    level: WCAG_LEVELS.AA,
    severity: SEVERITY.SERIOUS,
    test: (element: Element) => {
      const textElements = element.querySelectorAll('*');
      for (const el of textElements) {
        const style = getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          const ratio = _getContrastRatio(color, bgColor);
          if (ratio < 4.5) return false;
        }
      }
      return true;
    },
    fix: 'Ensure text color has at least 4.5:1 contrast ratio with background'
  },
  {
    id: 'focus-visible',
    name: 'Focus Visibility',
    description: 'Interactive elements should have visible focus indicator',
    wcag: '2.4.7',
    level: WCAG_LEVELS.AA,
    severity: SEVERITY.MODERATE,
    test: (element: Element) => {
      const interactives = element.querySelectorAll('button, a, [tabindex]');
      for (const el of interactives) {
        const style = getComputedStyle(el);
        if (style.outlineStyle === 'none' && !el.classList.contains('focus-visible')) {
          return false;
        }
      }
      return true;
    },
    fix: 'Add visible focus styles (outline, box-shadow) to interactive elements'
  },
  {
    id: 'reduced-motion',
    name: 'Reduced Motion Support',
    description: 'Animations should respect prefers-reduced-motion',
    wcag: '2.3.3',
    level: WCAG_LEVELS.AAA,
    severity: SEVERITY.MODERATE,
    test: (element: Element) => {
      const styles = document.styleSheets;
      for (const sheet of styles) {
        try {
          for (const rule of sheet.cssRules) {
            if ((rule as any).media?.mediaText?.includes('prefers-reduced-motion')) {
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    },
    fix: 'Add @media (prefers-reduced-motion: reduce) rules to disable animations'
  },
  {
    id: 'text-alternative',
    name: 'Text Alternative for Loading',
    description: 'Visual loading indicator should have text alternative',
    wcag: '1.1.1',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.CRITICAL,
    test: (element: Element) => {
      const hasVisibleText = element.textContent.trim().length > 0;
      const hasAriaLabel = element.getAttribute('aria-label') !== null;
      const hasAriaLabelledBy = element.getAttribute('aria-labelledby') !== null;
      return hasVisibleText || hasAriaLabel || hasAriaLabelledBy;
    },
    fix: 'Add visible loading text or aria-label describing the loading state'
  },
  {
    id: 'keyboard-trap',
    name: 'No Keyboard Trap',
    description: 'Focus should not be trapped in preloader',
    wcag: '2.1.2',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.CRITICAL,
    test: (element: Element) => {
      const focusableElements = element.querySelectorAll('button, a, input, [tabindex]');
      for (const el of focusableElements) {
        if (el.getAttribute('tabindex') === '-1') continue;
        const onKeyDown = el.getAttribute('onkeydown');
        if (onKeyDown?.includes('preventDefault')) return false;
      }
      return true;
    },
    fix: 'Ensure users can tab out of the preloader area'
  },
  {
    id: 'timing-adjustable',
    name: 'Timing Adjustable',
    description: 'Loading timeout should be adjustable or extendable',
    wcag: '2.2.1',
    level: WCAG_LEVELS.A,
    severity: SEVERITY.MODERATE,
    test: () => true,
    fix: 'Provide option to extend loading timeout'
  }
];

// AUDIT EXECUTION
export function audit(element: Element | null = null, options: Record<string, any> = {}) {
  _initPorts();
  if (!element && typeof document !== 'undefined') {
    element = document.querySelector('[data-preloader-root]') || document.getElementById('preloader');
  }
  
  if (!element) {
    _log('warn', 'No preloader element found for audit');
    return { success: false, error: 'No element found' };
  }

  const targetLevel = options.level || WCAG_LEVELS.AA;
  const levelPriority: Record<string, number> = { [WCAG_LEVELS.A]: 1, [WCAG_LEVELS.AA]: 2, [WCAG_LEVELS.AAA]: 3 };
  const targetPriority = levelPriority[targetLevel];

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    targetLevel,
    element: element.tagName + (element.id ? `#${element.id}` : ''),
    passed: [],
    failed: [],
    warnings: [],
    score: 0
  };

  for (const rule of RULES) {
    const rulePriority = levelPriority[rule.level];
    if (rulePriority > targetPriority) continue;

    try {
      const passed = rule.test(element);
      const result = {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        wcag: rule.wcag,
        level: rule.level,
        severity: rule.severity,
        fix: rule.fix
      };

      if (passed) {
        results.passed.push(result);
      } else {
        results.failed.push(result);
      }
    } catch (error) {
      results.warnings.push({
        id: rule.id,
        name: rule.name,
        error: (error as Error).message
      });
    }
  }

  const total = results.passed.length + results.failed.length;
  results.score = total > 0 ? Math.round((results.passed.length / total) * 100) : 0;
  results.summary = {
    total,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    criticalFailed: results.failed.filter((r: Record<string, string>) => r.severity === SEVERITY.CRITICAL).length
  };

  _log('info', 'A11y audit completed', { score: results.score, passed: results.passed.length, failed: results.failed.length });
  return results;
}

export function quickAudit(element: Element | null = null) {
  const results: Record<string, any> = audit(element as Element | null, { level: WCAG_LEVELS.A });
  return {
    score: results.score,
    passed: results.summary.passed,
    failed: results.summary.failed,
    criticalIssues: results.failed.filter((r: Record<string, string>) => r.severity === SEVERITY.CRITICAL).map((r: Record<string, string>) => r.name)
  };
}

// FIX SUGGESTIONS
export function getFixSuggestions(auditResults: Record<string, any>) {
  if (!auditResults?.failed) return [];
  
  return auditResults.failed.map((issue: Record<string, string>) => ({
    issue: issue.name,
    severity: issue.severity,
    wcag: issue.wcag,
    fix: issue.fix,
    code: _generateFixCode(issue.id)
  }));
}

function _generateFixCode(ruleId: string) {
  const fixes: Record<string, string> = {
    'aria-live-region': `element.setAttribute('aria-live', 'polite');\nelement.setAttribute('role', 'status');`,
    'aria-busy': `element.setAttribute('aria-busy', 'true');\n// When loading complete:\nelement.setAttribute('aria-busy', 'false');`,
    'progress-role': `progressBar.setAttribute('role', 'progressbar');`,
    'progress-value': `progressBar.setAttribute('aria-valuemin', '0');\nprogressBar.setAttribute('aria-valuemax', '100');\nprogressBar.setAttribute('aria-valuenow', currentProgress);`,
    'text-alternative': `element.setAttribute('aria-label', 'Loading application...');`,
    'reduced-motion': `@media (prefers-reduced-motion: reduce) {\n  .preloader * { animation: none !important; transition: none !important; }\n}`
  };
  return fixes[ruleId] || '// Manual fix required';
}

// AUTO-FIX
export function autoFix(element: Element | null = null) {
  if (!element && typeof document !== 'undefined') {
    element = document.querySelector('[data-preloader-root]') || document.getElementById('preloader');
  }
  
  if (!element) return { success: false, error: 'No element' };

  const fixes = [];

  if (!element.getAttribute('aria-live')) {
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('role', 'status');
    fixes.push('aria-live-region');
  }

  if (!element.hasAttribute('aria-busy')) {
    element.setAttribute('aria-busy', 'true');
    fixes.push('aria-busy');
  }

  const progressBar = element.querySelector('[data-preloader-progress], .progress-bar');
  if (progressBar) {
    if (!progressBar.getAttribute('role')) {
      progressBar.setAttribute('role', 'progressbar');
      fixes.push('progress-role');
    }
    if (!progressBar.hasAttribute('aria-valuemin')) {
      progressBar.setAttribute('aria-valuemin', '0');
      progressBar.setAttribute('aria-valuemax', '100');
      progressBar.setAttribute('aria-valuenow', '0');
      fixes.push('progress-value');
    }
  }

  if (!element.textContent.trim() && !element.getAttribute('aria-label')) {
    element.setAttribute('aria-label', 'Loading application');
    fixes.push('text-alternative');
  }

  _log('info', 'Auto-fix applied', { fixes });
  return { success: true, fixes };
}

// HELPERS
function _getContrastRatio(color1: string, color2: string) {
  const rgb1 = _parseColor(color1);
  const rgb2 = _parseColor(color2);
  
  if (!rgb1 || !rgb2) return 21;
  
  const l1 = _getLuminance(rgb1);
  const l2 = _getLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function _parseColor(color: string) {
  if (!color) return null;
  
  const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) {
    return { r: parseInt(rgb[1]), g: parseInt(rgb[2]), b: parseInt(rgb[3]) };
  }
  return null;
}

function _getLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// REPORT GENERATION
export function generateReport(auditResults: Record<string, any>, format = 'text') {
  if (format === 'json') return JSON.stringify(auditResults, null, 2);
  
  const lines = [];
  lines.push('═'.repeat(60));
  lines.push('PRELOADER ACCESSIBILITY AUDIT REPORT');
  lines.push('═'.repeat(60));
  lines.push(`Date: ${auditResults.timestamp}`);
  lines.push(`Target Level: WCAG ${auditResults.targetLevel}`);
  lines.push(`Score: ${auditResults.score}%`);
  lines.push('─'.repeat(60));
  lines.push(`✅ Passed: ${auditResults.summary.passed}`);
  lines.push(`❌ Failed: ${auditResults.summary.failed}`);
  lines.push(`⚠️  Warnings: ${auditResults.summary.warnings}`);
  lines.push(`🚨 Critical: ${auditResults.summary.criticalFailed}`);
  lines.push('─'.repeat(60));
  
  if (auditResults.failed.length > 0) {
    lines.push('\nFAILED CHECKS:');
    auditResults.failed.forEach((issue: Record<string, string>) => {
      const icon = issue.severity === SEVERITY.CRITICAL ? '🚨' : issue.severity === SEVERITY.SERIOUS ? '❗' : '⚠️';
      lines.push(`${icon} [${issue.wcag}] ${issue.name}`);
      lines.push(`   Fix: ${issue.fix}`);
    });
  }
  
  lines.push('═'.repeat(60));
  return lines.join('\n');
}

// STATUS
export function getRules() {
  return RULES.map(r => ({ id: r.id, name: r.name, level: r.level, severity: r.severity }));
}

export function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, rulesCount: RULES.length, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    features: ['wcag-audit', 'auto-fix', 'report-generation', 'contrast-check', 'aria-validation'],
    rules: RULES.length,
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION, MODULE_ID, WCAG_LEVELS, SEVERITY,
  audit, quickAudit, getFixSuggestions, autoFix,
  generateReport, getRules, getStatus, healthCheck, info,
  injectPorts, getPorts
};
