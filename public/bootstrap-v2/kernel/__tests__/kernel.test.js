// Kernel Unit Tests
// @version 1.0.0-QUALITY
// @description #19 Testes unitários para componentes do Kernel
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_MODES, KERNEL_EVENTS, CAPABILITIES, mapStateToMode from constants.js
//          createCapabilityManager from capability-manager.js
// PROVIDES: runAllTests, runConstantsTests, runCapabilityManagerTests, createMockLogger, createMockEventBus
// BROWSER-APIS: console (test output)
// @note Estes testes podem ser executados com qualquer test runner ES6 (Jest, Mocha, etc)
'use strict';

import { 
  KERNEL_MODES, 
  KERNEL_EVENTS, 
  CAPABILITIES,
  mapStateToMode 
} from '../constants.js';

import { createCapabilityManager } from '../capability-manager.js';

const VERSION = '1.1.1-CONTRACTS';
const MODULE_ID = 'bootstrap-v2.kernel.__tests__.kernel.test';

// ============================================================================
// MOCK UTILITIES
// ============================================================================

function createMockLogger() {
  var logs = { info: [], warn: [], error: [], debug: [] };
  return {
    info: function(msg, data) { logs.info.push({ msg: msg, data: data }); },
    warn: function(msg, data) { logs.warn.push({ msg: msg, data: data }); },
    error: function(msg, data) { logs.error.push({ msg: msg, data: data }); },
    debug: function(msg, data) { logs.debug.push({ msg: msg, data: data }); },
    getLogs: function() { return logs; },
    clear: function() { logs = { info: [], warn: [], error: [], debug: [] }; }
  };
}

function createMockEventBus() {
  var events = [];
  var listeners = {};
  return {
    emit: function(event, data) { 
      events.push({ event: event, data: data }); 
      if (listeners[event]) {
        for (var i = 0; i < listeners[event].length; i++) {
          try { listeners[event][i](data); } catch(e) {}
        }
      }
    },
    on: function(event, callback) { 
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return function() {
        var idx = listeners[event].indexOf(callback);
        if (idx !== -1) listeners[event].splice(idx, 1);
      };
    },
    getEvents: function() { return events; },
    clear: function() { events = []; listeners = {}; }
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

var testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name: name, status: 'PASSED' });
    console.log('✅ ' + name);
  } catch (e) {
    testResults.failed++;
    testResults.tests.push({ name: name, status: 'FAILED', error: e.message });
    console.error('❌ ' + name + ': ' + e.message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || 'Assertion failed') + ': expected ' + expected + ', got ' + actual);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Expected true but got false');
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(message || 'Expected false but got true');
  }
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(message || 'Expected value to be defined');
  }
}

function assertContains(array, item, message) {
  if (array.indexOf(item) === -1) {
    throw new Error((message || 'Array does not contain item') + ': ' + item);
  }
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

function runConstantsTests() {
  console.log('\n=== KERNEL CONSTANTS TESTS ===\n');
  
  test('KERNEL_MODES should have all required modes', function() {
    assertDefined(KERNEL_MODES.INITIALIZING, 'INITIALIZING mode');
    assertDefined(KERNEL_MODES.NORMAL, 'NORMAL mode');
    assertDefined(KERNEL_MODES.DEGRADED, 'DEGRADED mode');
    assertDefined(KERNEL_MODES.RECOVERY, 'RECOVERY mode');
    assertDefined(KERNEL_MODES.FAILED, 'FAILED mode');
  });
  
  test('KERNEL_EVENTS should have all required events', function() {
    assertDefined(KERNEL_EVENTS.MODE_CHANGE, 'MODE_CHANGE event');
    assertDefined(KERNEL_EVENTS.READY, 'READY event');
    assertDefined(KERNEL_EVENTS.CAPABILITY_CHANGE, 'CAPABILITY_CHANGE event');
    assertDefined(KERNEL_EVENTS.HEALTH_UPDATE, 'HEALTH_UPDATE event');
  });
  
  test('CAPABILITIES should have all required capabilities', function() {
    assertDefined(CAPABILITIES.FULL_UI, 'FULL_UI capability');
    assertDefined(CAPABILITIES.AUTH, 'AUTH capability');
    assertDefined(CAPABILITIES.NAVIGATION, 'NAVIGATION capability');
    assertDefined(CAPABILITIES.TELEMETRY, 'TELEMETRY capability');
  });
  
  test('mapStateToMode should map boot states to kernel modes', function() {
    assertEqual(mapStateToMode('cold'), KERNEL_MODES.INITIALIZING, 'cold → INITIALIZING');
    assertEqual(mapStateToMode('initializing'), KERNEL_MODES.INITIALIZING, 'initializing → INITIALIZING');
    assertEqual(mapStateToMode('ready'), KERNEL_MODES.NORMAL, 'ready → NORMAL');
    assertEqual(mapStateToMode('error'), KERNEL_MODES.FAILED, 'error → FAILED');
    assertEqual(mapStateToMode('recovering'), KERNEL_MODES.RECOVERY, 'recovering → RECOVERY');
  });
  
  test('mapStateToMode should return DEGRADED when isDegraded flag is true', function() {
    assertEqual(mapStateToMode('ready', true), KERNEL_MODES.DEGRADED, 'ready + degraded → DEGRADED');
  });
  
  test('mapStateToMode should return INITIALIZING for unknown states', function() {
    assertEqual(mapStateToMode('unknown-state'), KERNEL_MODES.INITIALIZING, 'unknown → INITIALIZING');
  });
}

// ============================================================================
// CAPABILITY MANAGER TESTS
// ============================================================================

function runCapabilityManagerTests() {
  console.log('\n=== CAPABILITY MANAGER TESTS ===\n');
  
  test('createCapabilityManager should create manager with default capabilities', function() {
    var manager = createCapabilityManager();
    assertDefined(manager, 'manager should be defined');
    assertDefined(manager.enable, 'enable method');
    assertDefined(manager.disable, 'disable method');
    assertDefined(manager.isEnabled, 'isEnabled method');
  });
  
  test('manager should start with all capabilities enabled by default', function() {
    var manager = createCapabilityManager();
    assertTrue(manager.isEnabled(CAPABILITIES.FULL_UI), 'FULL_UI should be enabled');
    assertTrue(manager.isEnabled(CAPABILITIES.AUTH), 'AUTH should be enabled');
    assertTrue(manager.isEnabled(CAPABILITIES.NAVIGATION), 'NAVIGATION should be enabled');
  });
  
  test('manager should be able to disable capabilities', function() {
    var manager = createCapabilityManager();
    manager.disable(CAPABILITIES.TELEMETRY);
    assertFalse(manager.isEnabled(CAPABILITIES.TELEMETRY), 'TELEMETRY should be disabled');
  });
  
  test('manager should be able to re-enable capabilities', function() {
    var manager = createCapabilityManager();
    manager.disable(CAPABILITIES.TELEMETRY);
    manager.enable(CAPABILITIES.TELEMETRY);
    assertTrue(manager.isEnabled(CAPABILITIES.TELEMETRY), 'TELEMETRY should be re-enabled');
  });
  
  test('manager should return list of enabled capabilities', function() {
    var manager = createCapabilityManager();
    var enabled = manager.getEnabled();
    assertTrue(Array.isArray(enabled), 'getEnabled should return array');
    assertTrue(enabled.length > 0, 'should have enabled capabilities');
  });
  
  test('manager should return list of disabled capabilities', function() {
    var manager = createCapabilityManager();
    manager.disable(CAPABILITIES.TELEMETRY);
    var disabled = manager.getDisabled();
    assertTrue(Array.isArray(disabled), 'getDisabled should return array');
    assertContains(disabled, CAPABILITIES.TELEMETRY, 'TELEMETRY should be in disabled list');
  });
  
  test('manager should apply mode presets correctly', function() {
    var manager = createCapabilityManager();
    manager.applyModePreset(KERNEL_MODES.DEGRADED);
    // Em modo degradado, algumas capabilities devem estar desabilitadas
    var disabled = manager.getDisabled();
    assertTrue(disabled.length > 0 || manager.getEnabled().length < Object.keys(CAPABILITIES).length, 
      'DEGRADED mode should affect capabilities');
  });
  
  test('manager should apply FAILED mode preset (disable all)', function() {
    var manager = createCapabilityManager();
    manager.applyModePreset(KERNEL_MODES.FAILED);
    var enabled = manager.getEnabled();
    assertEqual(enabled.length, 0, 'FAILED mode should disable all capabilities');
  });
  
  test('manager reset should restore all capabilities', function() {
    var manager = createCapabilityManager();
    manager.disable(CAPABILITIES.AUTH);
    manager.disable(CAPABILITIES.NAVIGATION);
    manager.reset();
    assertTrue(manager.isEnabled(CAPABILITIES.AUTH), 'AUTH should be restored');
    assertTrue(manager.isEnabled(CAPABILITIES.NAVIGATION), 'NAVIGATION should be restored');
  });
  
  test('manager info should return complete status', function() {
    var manager = createCapabilityManager();
    var info = manager.info();
    assertDefined(info.enabledCount, 'enabledCount');
    assertDefined(info.disabledCount, 'disabledCount');
    assertDefined(info.enabled, 'enabled array');
    assertDefined(info.disabled, 'disabled array');
  });
  
  test('manager healthCheck should return valid status', function() {
    var manager = createCapabilityManager();
    var health = manager.healthCheck();
    assertDefined(health.status, 'status');
    assertDefined(health.enabledCount, 'enabledCount');
    assertEqual(health.status, 'HEALTHY', 'should be HEALTHY with all enabled');
  });
  
  test('manager healthCheck should return DEGRADED when capabilities disabled', function() {
    var manager = createCapabilityManager();
    manager.disable(CAPABILITIES.FULL_UI);
    var health = manager.healthCheck();
    assertEqual(health.status, 'DEGRADED', 'should be DEGRADED with disabled capabilities');
  });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           KERNEL UNIT TESTS - Sprint 4 #19                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  testResults = { passed: 0, failed: 0, tests: [] };
  
  runConstantsTests();
  runCapabilityManagerTests();
  
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('RESULTS: ' + testResults.passed + ' passed, ' + testResults.failed + ' failed');
  console.log('════════════════════════════════════════════════════════════\n');
  
  return testResults;
}

// Export para uso externo
export {
  runAllTests,
  runConstantsTests,
  runCapabilityManagerTests,
  createMockLogger,
  createMockEventBus,
  testResults
};

export default { 
  runAllTests: runAllTests,
  runConstantsTests: runConstantsTests,
  runCapabilityManagerTests: runCapabilityManagerTests,
  createMockLogger: createMockLogger,
  createMockEventBus: createMockEventBus
};
