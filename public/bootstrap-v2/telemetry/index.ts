// Telemetry - Barrel Export
// DEPENDENCY CONTRACT (1.0.0) — BARREL FILE
// @version 1.0.0
// @description Sprint 7B #13 - Módulo de telemetria
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.telemetry';

export * from './otel-exporter.js';
export { default as OTelExporter } from './otel-exporter.js';
