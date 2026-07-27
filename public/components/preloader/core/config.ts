// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-config
// PURPOSE: Preloader Config Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   PreloaderPolicy from ./policy.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createConfig() — exported function
//   getDefaultConfig() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PreloaderPolicy } from './policy.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-config';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const DEFAULT_CONFIG = {
  timeoutVideo: 5000,
  timeoutGlobal: 30000,
  timeoutComponentsReady: 10000,
  timeoutComponentsReadyBackoff: 5000,
  timeoutComponentsReadyMax: 3,
  timeoutLogin: 15000,
  pollInterval: 200,
  hideDelayMs: 300,
  progressDebounceMs: 32,
  maxTraceEntries: 100,
  telemetrySchema: 'preloader-v8-aaa',
  useShadowRoot: false,
  orchestrator: { notifyOnBoot: true, trackStatus: true },
  debug: false,
  useAAAMode: true
};

export function createConfig(userConfig?: Record<string, any>) {
  if (!userConfig) userConfig = {};
  const CFG = _getPort('config') || {};
  
  if (userConfig.profile) {
    PreloaderPolicy.applyProfile(userConfig.profile);
  }
  
  const policyConfig: Record<string, any> = PreloaderPolicy.get();
  const policyTimeouts = policyConfig.timeouts || {};
  const policyRetries = policyConfig.retries || {};
  const policyProgress = policyConfig.progress || {};
  const cfgTimeouts = CFG.timeouts || {};
  const cfgFeatures = CFG.features || {};
  const cfgApp = CFG.app || {};
  
  return Object.assign({}, DEFAULT_CONFIG, {
    timeoutVideo: policyTimeouts.video || cfgTimeouts.preloaderVideoMs || DEFAULT_CONFIG.timeoutVideo,
    timeoutGlobal: policyTimeouts.global || cfgTimeouts.bootMaxMs || DEFAULT_CONFIG.timeoutGlobal,
    timeoutComponentsReady: policyTimeouts.components || cfgTimeouts.componentsReadyMs || DEFAULT_CONFIG.timeoutComponentsReady,
    timeoutComponentsReadyBackoff: policyRetries.backoffMs || cfgTimeouts.componentsReadyBackoffMs || DEFAULT_CONFIG.timeoutComponentsReadyBackoff,
    timeoutComponentsReadyMax: policyRetries.componentsMax || cfgTimeouts.componentsReadyMaxRetries || DEFAULT_CONFIG.timeoutComponentsReadyMax,
    timeoutLogin: cfgTimeouts.loginWaitMs || DEFAULT_CONFIG.timeoutLogin,
    pollInterval: policyProgress.pollInterval || cfgTimeouts.mfContainerPollMs || DEFAULT_CONFIG.pollInterval,
    hideDelayMs: policyTimeouts.hide || DEFAULT_CONFIG.hideDelayMs,
    progressDebounceMs: policyProgress.debounceMs || DEFAULT_CONFIG.progressDebounceMs,
    useShadowRoot: cfgFeatures.preloaderShadowRoot !== undefined ? cfgFeatures.preloaderShadowRoot : DEFAULT_CONFIG.useShadowRoot,
    debug: cfgApp.debug !== undefined ? cfgApp.debug : DEFAULT_CONFIG.debug,
    useAAAMode: userConfig.useAAAMode !== undefined ? userConfig.useAAAMode : DEFAULT_CONFIG.useAAAMode
  }, userConfig);
}

export function getDefaultConfig() { return Object.assign({}, DEFAULT_CONFIG); }

export function healthCheck() {
  const logger = _getPort('logger');
  const checks = { defaultsValid: Object.keys(DEFAULT_CONFIG).length > 0, portsInitialized: Ports.isInitialized(), loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, version: VERSION, moduleId: MODULE_ID, defaults: Object.keys(DEFAULT_CONFIG).length, checks, portsInitialized: Ports.isInitialized() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }

export default { VERSION, MODULE_ID, createConfig, getDefaultConfig, healthCheck, info, injectPorts, getPorts };
