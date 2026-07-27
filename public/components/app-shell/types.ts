
/**
 * @file App Shell — Type Definitions
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/types
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone type definitions)
 * 
 * @provides JSDoc type definitions for App-Shell APIs
 * 
 * @description
 * JSDoc type definitions for all App-Shell public APIs.
 * Provides IntelliSense support and documentation.
 * 
 * @example
 * // Import types for IDE support
 * /** @type {import('./types.js').ShellState} *\/
 * const state = AppShell.getState();
 * ============================================================================
 */
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.types';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @typedef {'idle'|'initializing'|'mounted'|'ready'|'degraded'|'failed'|'unmounting'} ShellPhase
 */

/**
 * @typedef {Object} ShellState
 * @property {ShellPhase} phase - Current lifecycle phase
 * @property {boolean} mounted - Whether shell is mounted
 * @property {boolean} ready - Whether shell is ready
 * @property {Object|null} error - Current error, if any
 */

/**
 * @typedef {Object} RegionConfig
 * @property {string} id - Region element ID
 * @property {string} [legacyId] - Legacy fallback ID
 * @property {string} tag - HTML tag name
 * @property {string} [role] - ARIA role
 * @property {string} [ariaLabel] - ARIA label
 * @property {boolean} [defaultVisible] - Default visibility
 */

/**
 * @typedef {Object} RegionHealth
 * @property {boolean} exists - Whether region exists in DOM
 * @property {boolean} usingLegacy - Whether using legacy ID
 * @property {string} mode - 'enterprise' or 'legacy'
 * @property {number} childrenCount - Number of child elements
 * @property {boolean} hasChildren - Whether has children
 * @property {boolean} isVisible - Whether currently visible
 */

/**
 * @typedef {Object} HealthCheckResult
 * @property {'HEALTHY'|'DEGRADED'|'UNHEALTHY'} status - Overall status
 * @property {string} score - Score as "passed/total"
 * @property {Object<string, boolean>} checks - Individual check results
 * @property {string} version - Module version
 * @property {string} moduleId - Module identifier
 * @property {number} timestamp - Check timestamp
 */

/**
 * @typedef {Object} ShellInfo
 * @property {string} moduleId - Module identifier
 * @property {string} version - Module version
 * @property {ShellPhase} phase - Current phase
 * @property {boolean} mounted - Mounted state
 * @property {boolean} ready - Ready state
 * @property {Object} metrics - Performance metrics
 * @property {number} timestamp - Info timestamp
 */

// ============================================================================
// REGION TYPES
// ============================================================================

/**
 * @typedef {'preloader'|'login'|'header'|'ticker'|'nav-rail'|'sidebar'|'main'|'footer'|'toast'} RegionName
 */

/**
 * @typedef {Object} RegionOptions
 * @property {boolean} [create] - Create if not exists
 * @property {boolean} [strict] - Throw on not found
 */

// ============================================================================
// ADAPTER TYPES
// ============================================================================

/**
 * @typedef {Object} AdapterConfig
 * @property {boolean} enabled - Whether adapter is enabled
 * @property {boolean} lazy - Whether to lazy load
 * @property {Object|null} instance - Adapter instance
 */

/**
 * @typedef {'globalState'|'auth'|'layout'|'theme'|'notification'|'router'|'ticker'|'responsive'} AdapterName
 */

// ============================================================================
// API DOCUMENTATION
// ============================================================================

/**
 * App Shell Public API
 * @namespace AppShell
 */

/**
 * Initialize the shell
 * @function AppShell.init
 * @param {Object} [options] - Initialization options
 * @returns {Promise<{ok: boolean, error?: string}>}
 */

/**
 * Shutdown the shell
 * @function AppShell.shutdown
 * @returns {Promise<{ok: boolean}>}
 */

/**
 * Get a region element
 * @function AppShell.region
 * @param {RegionName} name - Region name
 * @param {RegionOptions} [options] - Options
 * @returns {HTMLElement|null}
 */

/**
 * Request layout change
 * @function AppShell.requestLayout
 * @param {string} preset - Layout preset name
 * @returns {{ok: boolean, preset: string}}
 */

/**
 * Run health check
 * @function AppShell.healthCheck
 * @returns {HealthCheckResult}
 */

/**
 * Get shell info
 * @function AppShell.info
 * @returns {ShellInfo}
 */

/**
 * Check if shell is ready
 * @function AppShell.ready
 * @returns {boolean}
 */

/**
 * Wait for shell to be ready
 * @function AppShell.waitReady
 * @param {number} [timeout=5000] - Timeout in ms
 * @returns {Promise<boolean>}
 */

/**
 * Check if initialized
 * @function AppShell.isInitialized
 * @returns {boolean}
 */

/**
 * Check if ready
 * @function AppShell.isReady
 * @returns {boolean}
 */

/**
 * Check if mounted
 * @function AppShell.isMounted
 * @returns {boolean}
 */

/**
 * Get current phase
 * @function AppShell.getPhase
 * @returns {ShellPhase}
 */

/**
 * Subscribe to shell events
 * @function AppShell.subscribe
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 * @returns {Function} Unsubscribe function
 */

/**
 * Fade out preloader
 * @function AppShell.fadeOutPreloader
 * @param {number} [duration=500] - Duration in ms
 * @returns {Promise<void>}
 */

/**
 * Set loading state for region
 * @function AppShell.setLoading
 * @param {RegionName} region - Region name
 * @param {boolean} loading - Loading state
 * @param {Object} [options] - Options
 * @returns {boolean}
 */

/**
 * Set error state for region
 * @function AppShell.setError
 * @param {RegionName} region - Region name
 * @param {string|Error} error - Error
 * @returns {boolean}
 */

/**
 * Connect an adapter
 * @function AppShell.connectAdapter
 * @param {AdapterName} name - Adapter name
 * @param {Object} [module] - Adapter module
 * @returns {Promise<{ok: boolean, adapter: string}>}
 */

/**
 * Finalize shell ready state
 * @function AppShell.finalize
 * @returns {{ok: boolean}}
 */

// ============================================================================
// FOCUS API TYPES
// ============================================================================

/**
 * Focus management API
 * @namespace AppShell.focus
 */

/**
 * Save current focus
 * @function AppShell.focus.save
 * @returns {void}
 */

/**
 * Restore saved focus
 * @function AppShell.focus.restore
 * @returns {boolean}
 */

/**
 * Focus main content
 * @function AppShell.focus.main
 * @returns {boolean}
 */

/**
 * Focus a region
 * @function AppShell.focus.region
 * @param {RegionName} name - Region name
 * @returns {boolean}
 */

/**
 * Announce message to screen readers
 * @function AppShell.focus.announce
 * @param {string} message - Message to announce
 * @param {'polite'|'assertive'} [priority='polite'] - Announcement priority
 * @returns {void}
 */

// ============================================================================
// DEBUG API TYPES
// ============================================================================

/**
 * Debug API
 * @namespace AppShell.debug
 */

/**
 * Get store state
 * @function AppShell.debug.store
 * @returns {Object}
 */

/**
 * Get lifecycle info
 * @function AppShell.debug.lifecycle
 * @returns {Object}
 */

/**
 * Get readiness info
 * @function AppShell.debug.readiness
 * @returns {Object}
 */

/**
 * Get regions health
 * @function AppShell.debug.regions
 * @returns {Object}
 */

/**
 * Get metrics
 * @function AppShell.debug.metrics
 * @returns {Object}
 */

// ============================================================================
// EXPORTS (empty - type definitions only)
// ============================================================================

export default {};
