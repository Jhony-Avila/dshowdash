// Migrado para TypeScript: 2026-02-25
// App Adapters - Central Export
// Versão: 1.0.0-ENTERPRISE

export * as Http from './http/index.ts';
export * as Telemetry from './telemetry/index.ts';
export * as Backend from './backend/index.ts';

export { default as HttpAdapter } from './http/index.ts';
export { default as TelemetryAdapter } from './telemetry/index.ts';
export { default as BackendAdapter } from './backend/index.ts';
