// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/config/lint-config
// PURPOSE: Lint configuration and rules for Header modules
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   HEADER_LINT_RULES — lint rule definitions
//   lintFile(content, filename) — lint a single file
//   lintFiles(files) — lint multiple files
//   info() — module info
// ═══════════════════════════════════════════════════════════════
// Header - Lint Configuration
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B05: var → const/let
// Configuracao para linting do Header
// Melhoria #19: Lint automatizado
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/config/lint-config';

export const HEADER_LINT_RULES = {
  requiredExports: ['VERSION', 'MODULE_ID', 'healthCheck', 'info'],
  
  forbiddenGlobals: ['window.', 'document.write', 'eval'],
  
  requiredPatterns: {
    portsInit: /_initPorts\(\)/,
    errorHandling: /try\s*\{/,
    moduleId: /MODULE_ID\s*=/
  },
  
  forbiddenPatterns: {
    consoleLog: /console\.log\(/,
    alertCall: /\balert\(/,
    debuggerStatement: /\bdebugger\b/,
    todoComments: /\/\/\s*TODO[^:]/
  },
  
  limits: {
    maxLineLength: 200,
    maxFileLines: 1500,
    maxFunctionLength: 100,
    maxParameters: 5
  }
};

export function lintFile(content: string, filename: unknown) {
  // @ts-expect-error strict migration — TS7034
  const errors = [];
  const warnings = [];
  const lines = content.split('\n');
  
  HEADER_LINT_RULES.requiredExports.forEach(exp => {
    const pattern = new RegExp(`export\\s+(var|const|function)\\s+${exp}\\b`);
    if (!pattern.test(content)) {
      errors.push({
        rule: 'required-export',
        message: `Export obrigatorio ausente: ${exp}`,
        severity: 'error'
      });
    }
  });
  
  Object.keys(HEADER_LINT_RULES.requiredPatterns).forEach(name => {
    const pattern = (HEADER_LINT_RULES.requiredPatterns as Record<string,unknown>)[name];
    // @ts-expect-error TS migration - TS2339
    if (!pattern.test(content)) {
      warnings.push({
        rule: 'required-pattern',
        message: `Pattern recomendado ausente: ${name}`,
        severity: 'warning'
      });
    }
  });
  
  Object.keys(HEADER_LINT_RULES.forbiddenPatterns).forEach(name => {
    const pattern = (HEADER_LINT_RULES.forbiddenPatterns as Record<string,unknown>)[name];
    // @ts-expect-error TS migration - TS2769
    const match = content.match(pattern);
    if (match) {
      errors.push({
        rule: 'forbidden-pattern',
        message: `Pattern proibido encontrado: ${name}`,
        severity: 'error'
      });
    }
  });
  
  if (lines.length > HEADER_LINT_RULES.limits.maxFileLines) {
    warnings.push({
      rule: 'max-file-lines',
      message: `Arquivo muito grande: ${lines.length} linhas (max: ${HEADER_LINT_RULES.limits.maxFileLines})`,
      severity: 'warning'
    });
  }
  
  lines.forEach((line: unknown, index: number) => {
    // @ts-expect-error TS migration - TS2339
    if (line.length > HEADER_LINT_RULES.limits.maxLineLength) {
      warnings.push({
        rule: 'max-line-length',
        // @ts-expect-error TS migration - TS2339
        message: `Linha ${index + 1} muito longa: ${line.length} chars`,
        severity: 'warning',
        line: index + 1
      });
    }
  });
  
  return {
    filename,
    // @ts-expect-error strict migration — TS7005
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
    passed: errors.length === 0
  };
}

export function lintFiles(files: unknown) {
  // @ts-expect-error TS migration - TS2339
  const results = files.map((file: unknown) => lintFile(file.content, file.name));
  
  // @ts-expect-error TS migration - TS2339
  const totalErrors = results.reduce((sum: unknown, r: unknown) => sum + r.errorCount, 0);
  // @ts-expect-error TS migration - TS2339
  const totalWarnings = results.reduce((sum: unknown, r: unknown) => sum + r.warningCount, 0);
  // @ts-expect-error TS migration - TS2339
  const allPassed = results.every((r: unknown) => r.passed);
  
  return {
    results,
    totalErrors,
    totalWarnings,
    allPassed,
    // @ts-expect-error TS migration - TS2339
    summary: `${totalErrors} erros, ${totalWarnings} warnings em ${files.length} arquivos`
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    rules: HEADER_LINT_RULES
  };
}

export default {
  VERSION,
  MODULE_ID,
  HEADER_LINT_RULES,
  lintFile,
  lintFiles,
  info
};
