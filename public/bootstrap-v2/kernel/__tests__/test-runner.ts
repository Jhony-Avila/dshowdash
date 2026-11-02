// Kernel Test Runner
// @version 1.0.0-QUALITY
// @description Runner de testes para execução no navegador
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: runAllTests from kernel.test.js
// PROVIDES: run(), getResults(), getSummary()
// BROWSER-APIS: (window as any).__KERNEL_TEST_RESULTS__, console
'use strict';

import { runAllTests } from './kernel.test.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.__tests__.test-runner';

// Executar testes automaticamente quando importado
interface TestResults {
  passed: number;
  failed: number;
  [key: string]: unknown;
}

let results: TestResults | null = null;

function run() {
  console.log('\n🧪 Starting Kernel Tests...\n');
  results = runAllTests();
  
  // Expor resultados globalmente
  if (typeof window !== 'undefined') {
    (window as any).__KERNEL_TEST_RESULTS__ = results;
  }
  
  return results;
}

function getResults() {
  return results;
}

function getSummary() {
  if (!results) {
    return { status: 'NOT_RUN', message: 'Tests have not been executed yet' };
  }
  
  return {
    status: results.failed === 0 ? 'ALL_PASSED' : 'SOME_FAILED',
    passed: results.passed,
    failed: results.failed,
    total: results.passed + results.failed,
    passRate: Math.round((results.passed / (results.passed + results.failed)) * 100) + '%'
  };
}

export { run, getResults, getSummary };
export default { run: run, getResults: getResults, getSummary: getSummary };
