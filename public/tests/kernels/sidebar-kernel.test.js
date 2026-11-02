// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: tests.kernels.sidebar-kernel.test
// PURPOSE: SidebarKernel Tests
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   runSidebarKernelTests
//   TestRunner
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0';
var MODULE_ID = 'tests.kernels.sidebar-kernel.test';

var TestRunner = (function() {
  var results = { passed: 0, failed: 0, total: 0, tests: [] };
  
  function assert(condition, message) {
    results.total++;
    if (condition) {
      results.passed++;
      results.tests.push({ name: message, status: 'PASSED' });
      console.log('✅ PASSED:', message);
    } else {
      results.failed++;
      results.tests.push({ name: message, status: 'FAILED' });
      console.error('❌ FAILED:', message);
    }
  }
  
  function assertEqual(actual, expected, message) {
    assert(actual === expected, message + ' (expected: ' + expected + ', actual: ' + actual + ')');
  }
  
  function assertExists(obj, message) {
    assert(obj !== null && obj !== undefined, message);
  }
  
  function assertFunction(fn, message) {
    assert(typeof fn === 'function', message);
  }
  
  function getResults() {
    return {
      passed: results.passed,
      failed: results.failed,
      total: results.total,
      percentage: results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0,
      tests: results.tests
    };
  }
  
  function reset() {
    results = { passed: 0, failed: 0, total: 0, tests: [] };
  }
  
  return { assert: assert, assertEqual: assertEqual, assertExists: assertExists, assertFunction: assertFunction, getResults: getResults, reset: reset };
})();

// ═══════════════════════════════════════════════════════════════
// SIDEBAR KERNEL TESTS
// ═══════════════════════════════════════════════════════════════

function runSidebarKernelTests() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('   SIDEBAR KERNEL TESTS');
  console.log('══════════════════════════════════════════════════════════════\n');
  
  TestRunner.reset();
  var sk = window.SidebarKernel;
  
  // Test 1: Kernel exists
  TestRunner.assertExists(sk, 'SidebarKernel exists on window');
  
  if (!sk) {
    console.error('SidebarKernel not found. Aborting tests.');
    return TestRunner.getResults();
  }
  
  // Test 2: Version
  TestRunner.assertExists(sk.VERSION, 'SidebarKernel has VERSION');
  TestRunner.assert(sk.VERSION.indexOf('ENTERPRISE') >= 0, 'SidebarKernel version is ENTERPRISE');
  
  // Test 3: Core methods exist
  TestRunner.assertFunction(sk.init, 'SidebarKernel.init is a function');
  TestRunner.assertFunction(sk.healthCheck, 'SidebarKernel.healthCheck is a function');
  TestRunner.assertFunction(sk.listFeatures, 'SidebarKernel.listFeatures is a function');
  TestRunner.assertFunction(sk.enableFeature, 'SidebarKernel.enableFeature is a function');
  TestRunner.assertFunction(sk.disableFeature, 'SidebarKernel.disableFeature is a function');
  TestRunner.assertFunction(sk.getFeatureStatus, 'SidebarKernel.getFeatureStatus is a function');
  
  // Test 4: Enterprise methods exist
  TestRunner.assertFunction(sk.getFeaturesByStatus, 'SidebarKernel.getFeaturesByStatus is a function');
  TestRunner.assertFunction(sk.getFeatureMetrics, 'SidebarKernel.getFeatureMetrics is a function');
  TestRunner.assertFunction(sk.exportDiagnostics, 'SidebarKernel.exportDiagnostics is a function');
  TestRunner.assertFunction(sk.canDisable, 'SidebarKernel.canDisable is a function');
  TestRunner.assertFunction(sk.getDependents, 'SidebarKernel.getDependents is a function');
  
  // Test 5: Health check returns valid structure
  var health = sk.healthCheck();
  TestRunner.assertExists(health, 'healthCheck returns object');
  TestRunner.assertExists(health.status, 'healthCheck has status');
  TestRunner.assertExists(health.version, 'healthCheck has version');
  TestRunner.assert(['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'NOT_INITIALIZED'].indexOf(health.status) >= 0, 'healthCheck status is valid');
  TestRunner.assertExists(health.features, 'healthCheck has features');
  
  // Test 6: List features returns valid structure
  var features = sk.listFeatures();
  TestRunner.assertExists(features, 'listFeatures returns object');
  TestRunner.assertExists(features.ok, 'listFeatures has ok property');
  if (features.ok && features.data) {
    TestRunner.assertExists(features.data.count, 'listFeatures has count');
    TestRunner.assertExists(features.data.features, 'listFeatures has features array');
    TestRunner.assert(features.data.count > 0, 'listFeatures count > 0');
  }
  
  // Test 7: Get features by status
  var enabledFeatures = sk.getFeaturesByStatus('enabled');
  TestRunner.assertExists(enabledFeatures, 'getFeaturesByStatus returns object');
  
  // Test 8: Metrics
  if (sk.metrics) {
    var metrics = sk.metrics();
    TestRunner.assertExists(metrics, 'metrics returns object');
  }
  
  // Test 9: Export diagnostics
  var diag = sk.exportDiagnostics();
  TestRunner.assertExists(diag, 'exportDiagnostics returns object');
  TestRunner.assertExists(diag.exportedAt, 'exportDiagnostics has exportedAt');
  TestRunner.assertExists(diag.kernel, 'exportDiagnostics has kernel');
  
  // Test 10: Console commands exist
  TestRunner.assertExists(window.sk, 'Console commands (sk.*) registered');
  if (window.sk) {
    TestRunner.assertFunction(window.sk.status, 'sk.status is a function');
    TestRunner.assertFunction(window.sk.list, 'sk.list is a function');
    TestRunner.assertFunction(window.sk.health, 'sk.health is a function');
  }
  
  // Results
  var results = TestRunner.getResults();
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('   RESULTS: ' + results.passed + '/' + results.total + ' passed (' + results.percentage + '%)');
  console.log('══════════════════════════════════════════════════════════════\n');
  
  return results;
}

// Export
if (typeof window !== 'undefined') {
  window.SidebarKernelTests = { run: runSidebarKernelTests, TestRunner: TestRunner };
}

export { runSidebarKernelTests, TestRunner };
export default { run: runSidebarKernelTests };
