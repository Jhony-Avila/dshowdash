const MODULE_ID = "header/config/eslint-rules";
const VERSION = "1.1.0-ES6";
const headerRules = {
  // @ts-expect-error TS migration - TS2339
  "header/module-id-required": { description: "Every module must have MODULE_ID", severity: "error", check(code) {
    return code.indexOf("MODULE_ID") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/version-required": { description: "Every module must have VERSION", severity: "error", check(code) {
    return code.indexOf("VERSION") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/healthcheck-required": { description: "Components must implement healthCheck", severity: "warn", check(code) {
    return code.indexOf("healthCheck") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/info-required": { description: "Components should implement info", severity: "warn", check(code) {
    return code.indexOf("info") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/use-strict-required": { description: "Files must have use strict", severity: "error", check(code) {
    return code.indexOf("use strict") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/ports-pattern": { description: "Use Ports pattern for dependencies", severity: "warn", check(code) {
    return code.indexOf("Ports") !== -1 || code.indexOf("createCorePorts") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/cleanup-required": { description: "Components with listeners must have cleanup", severity: "warn", check(code) {
    if (code.indexOf("addEventListener") === -1) return true;
    return code.indexOf("cleanup") !== -1 || code.indexOf("AbortController") !== -1;
  } },
  // @ts-expect-error TS migration - TS2339
  "header/try-catch-async": { description: "Async functions should have try-catch", severity: "warn", check(code) {
    const asyncCount = (code.match(/async/g) || []).length;
    const catchCount = (code.match(/catch/g) || []).length;
    return asyncCount === 0 || catchCount > 0;
  } }
};
function HeaderLinter() {
  this.rules = Object.assign({}, headerRules);
  this.results = [];
}
HeaderLinter.prototype.lint = function(code, filename) {
  const self = this;
  this.results = [];
  Object.keys(this.rules).forEach((ruleName) => {
    const rule = self.rules[ruleName];
    let passed = true;
    try {
      passed = rule.check(code, filename);
    } catch (e) {
      passed = false;
    }
    if (!passed) {
      self.results.push({ rule: ruleName, severity: rule.severity, description: rule.description });
    }
  });
  return this.results;
};
HeaderLinter.prototype.getReport = function() {
  const errors = this.results.filter((r) => r.severity === "error");
  const warnings = this.results.filter((r) => r.severity === "warn");
  return { total: this.results.length, errors: errors.length, warnings: warnings.length, passed: errors.length === 0, results: this.results };
};
HeaderLinter.prototype.printReport = function() {
  const report = this.getReport();
  console.log("\n======== HEADER LINT REPORT ========");
  console.log(`Errors: ${report.errors}, Warnings: ${report.warnings}`);
  this.results.forEach((r) => {
    const icon = r.severity === "error" ? "X" : "!";
    console.log(`  [${icon}] ${r.rule}: ${r.description}`);
  });
  console.log(`======== ${report.passed ? "PASSED" : "FAILED"} ========
`);
  return report;
};
function createLinter() {
  return new HeaderLinter();
}
function quickLint(code) {
  const linter = new HeaderLinter();
  linter.lint(code);
  return linter.getReport();
}
function getRules() {
  return Object.keys(headerRules).map((name) => ({
    name,
    // @ts-expect-error TS migration - TS2339
    severity: headerRules[name].severity,
    // @ts-expect-error TS migration - TS2339
    description: headerRules[name].description
  }));
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, rulesCount: Object.keys(headerRules).length, rules: getRules() };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { createLinter, quickLint, getRules, info };
}
if (typeof window !== "undefined") {
  window.HeaderLinter = { createLinter, quickLint, getRules, info };
}
console.log("Header Linter loaded. Use: HeaderLinter.createLinter().lint(code)");
export {
  MODULE_ID,
  VERSION
};
