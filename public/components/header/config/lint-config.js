const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/config/lint-config";
const HEADER_LINT_RULES = {
  requiredExports: ["VERSION", "MODULE_ID", "healthCheck", "info"],
  forbiddenGlobals: ["window.", "document.write", "eval"],
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
function lintFile(content, filename) {
  const errors = [];
  const warnings = [];
  const lines = content.split("\n");
  HEADER_LINT_RULES.requiredExports.forEach((exp) => {
    const pattern = new RegExp(`export\\s+(var|const|function)\\s+${exp}\\b`);
    if (!pattern.test(content)) {
      errors.push({
        rule: "required-export",
        message: `Export obrigatorio ausente: ${exp}`,
        severity: "error"
      });
    }
  });
  Object.keys(HEADER_LINT_RULES.requiredPatterns).forEach((name) => {
    const pattern = HEADER_LINT_RULES.requiredPatterns[name];
    if (!pattern.test(content)) {
      warnings.push({
        rule: "required-pattern",
        message: `Pattern recomendado ausente: ${name}`,
        severity: "warning"
      });
    }
  });
  Object.keys(HEADER_LINT_RULES.forbiddenPatterns).forEach((name) => {
    const pattern = HEADER_LINT_RULES.forbiddenPatterns[name];
    const match = content.match(pattern);
    if (match) {
      errors.push({
        rule: "forbidden-pattern",
        message: `Pattern proibido encontrado: ${name}`,
        severity: "error"
      });
    }
  });
  if (lines.length > HEADER_LINT_RULES.limits.maxFileLines) {
    warnings.push({
      rule: "max-file-lines",
      message: `Arquivo muito grande: ${lines.length} linhas (max: ${HEADER_LINT_RULES.limits.maxFileLines})`,
      severity: "warning"
    });
  }
  lines.forEach((line, index) => {
    if (line.length > HEADER_LINT_RULES.limits.maxLineLength) {
      warnings.push({
        rule: "max-line-length",
        // @ts-expect-error TS migration - TS2339
        message: `Linha ${index + 1} muito longa: ${line.length} chars`,
        severity: "warning",
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
function lintFiles(files) {
  const results = files.map((file) => lintFile(file.content, file.name));
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const allPassed = results.every((r) => r.passed);
  return {
    results,
    totalErrors,
    totalWarnings,
    allPassed,
    // @ts-expect-error TS migration - TS2339
    summary: `${totalErrors} erros, ${totalWarnings} warnings em ${files.length} arquivos`
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    rules: HEADER_LINT_RULES
  };
}
var lint_config_default = {
  VERSION,
  MODULE_ID,
  HEADER_LINT_RULES,
  lintFile,
  lintFiles,
  info
};
export {
  HEADER_LINT_RULES,
  MODULE_ID,
  VERSION,
  lint_config_default as default,
  info,
  lintFile,
  lintFiles
};
