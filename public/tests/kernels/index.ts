// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: tests.kernels.index
// PURPOSE: Kernel Tests Runner
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ./main-kernel.test.js
//   from ./sidebar-kernel.test.js
//
// PROVIDES:
//   VERSION
//   runAllTests
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { runMainKernelTests } from './main-kernel.test.js';
import { runSidebarKernelTests } from './sidebar-kernel.test.js';

var MODULE_ID = 'tests.kernels';

export var VERSION = '1.0.0';

export function runAllTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           KERNEL TESTS SUITE v' + VERSION + '                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  var results = { main: null as unknown, sidebar: null as unknown, summary: { passed: 0, failed: 0, total: 0 } };

  // Run MainKernel tests
  results.main = runMainKernelTests();
  var main = results.main as { passed: number; failed: number; total: number; percentage: number };
  results.summary.passed += main.passed;
  results.summary.failed += main.failed;
  results.summary.total += main.total;

  // Run SidebarKernel tests
  results.sidebar = runSidebarKernelTests();
  var sidebar = results.sidebar as { passed: number; failed: number; total: number; percentage: number };
  results.summary.passed += sidebar.passed;
  results.summary.failed += sidebar.failed;
  results.summary.total += sidebar.total;

  // Summary
  var percentage = results.summary.total > 0 ? Math.round((results.summary.passed / results.summary.total) * 100) : 0;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  MainKernel:    ' + padRight(main.passed + '/' + main.total + ' (' + main.percentage + '%)', 42) + '║');
  console.log('║  SidebarKernel: ' + padRight(sidebar.passed + '/' + sidebar.total + ' (' + sidebar.percentage + '%)', 42) + '║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  TOTAL:         ' + padRight(results.summary.passed + '/' + results.summary.total + ' (' + percentage + '%)', 42) + '║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  return results;
}

function padRight(str: unknown, len: number) {
  str = String(str);
  while ((str as string).length < len) str = (str as string) + ' ';
  return str as string;
}

// Auto-register on window
if (typeof window !== 'undefined') {

  // @ts-expect-error TS migration - TS2339
  window.KernelTests = {
    runAll: runAllTests,
    runMain: runMainKernelTests,
    runSidebar: runSidebarKernelTests,
    VERSION: VERSION
  };
  
  console.log('[KernelTests] Registered. Use KernelTests.runAll() to execute.');
}

export default { runAll: runAllTests, runMain: runMainKernelTests, runSidebar: runSidebarKernelTests, VERSION: VERSION };
