// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: tests.kernels.main-kernel.test
// PURPOSE: MainKernel Tests
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   runMainKernelTests
//   TestRunner
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0';
var MODULE_ID = 'tests.kernels.main-kernel.test';

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
// MAIN KERNEL TESTS
// ═══════════════════════════════════════════════════════════════

function runMainKernelTests() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('   MAIN KERNEL TESTS');
  console.log('══════════════════════════════════════════════════════════════\n');
  
  TestRunner.reset();
  var mk = window.MainKernel;
  
  // Test 1: Kernel exists
  TestRunner.assertExists(mk, 'MainKernel exists on window');
  
  if (!mk) {
    console.error('MainKernel not found. Aborting tests.');
    return TestRunner.getResults();
  }
  
  // Test 2: Version
  TestRunner.assertExists(mk.VERSION, 'MainKernel has VERSION');
  
  // Test 3: Core methods exist
  TestRunner.assertFunction(mk.init, 'MainKernel.init is a function');
  TestRunner.assertFunction(mk.healthCheck, 'MainKernel.healthCheck is a function');
  TestRunner.assertFunction(mk.listFeatures, 'MainKernel.listFeatures is a function');
  TestRunner.assertFunction(mk.enableFeature, 'MainKernel.enableFeature is a function');
  TestRunner.assertFunction(mk.disableFeature, 'MainKernel.disableFeature is a function');
  TestRunner.assertFunction(mk.getFeatureStatus, 'MainKernel.getFeatureStatus is a function');
  
  // Test 4: Health check returns valid structure
  var health = mk.healthCheck();
  TestRunner.assertExists(health, 'healthCheck returns object');
  TestRunner.assertExists(health.status, 'healthCheck has status');
  TestRunner.assertExists(health.version, 'healthCheck has version');
  TestRunner.assert(['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'NOT_INITIALIZED'].indexOf(health.status) >= 0, 'healthCheck status is valid');
  
  // Test 5: List features returns valid structure
  var features = mk.listFeatures();
  TestRunner.assertExists(features, 'listFeatures returns object');
  TestRunner.assertExists(features.ok, 'listFeatures has ok property');
  if (features.ok && features.data) {
    TestRunner.assertExists(features.data.count, 'listFeatures has count');
    TestRunner.assertExists(features.data.features, 'listFeatures has features array');
  }
  
  // Test 6: Metrics
  if (mk.metrics) {
    var metrics = mk.metrics();
    TestRunner.assertExists(metrics, 'metrics returns object');
    if (metrics.ok && metrics.data) {
      TestRunner.assertExists(metrics.data.featuresEnabled, 'metrics has featuresEnabled');
    }
  }
  
  // Test 7: Info
  if (mk.info) {
    var info = mk.info();
    TestRunner.assertExists(info, 'info returns object');
  }
  
  // Test 8: Export diagnostics
  if (mk.exportDiagnostics) {
    var diag = mk.exportDiagnostics();
    TestRunner.assertExists(diag, 'exportDiagnostics returns object');
    TestRunner.assertExists(diag.exportedAt, 'exportDiagnostics has exportedAt');
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
  window.MainKernelTests = { run: runMainKernelTests, TestRunner: TestRunner };
}

export { runMainKernelTests, TestRunner };
export default { run: runMainKernelTests };
