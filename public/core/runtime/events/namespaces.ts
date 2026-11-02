// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.namespaces
// PURPOSE: Namespaces Registry para eventos
// ───────────────────────────────────────────────────────────────
// PROVIDES: NAMESPACES, VALID_NAMESPACES, isValidNamespace, extractNamespace
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.namespaces';

export const NAMESPACES = { AUTH: 'auth', SESSION: 'session', ROUTER: 'router', PANEL: 'panel', PERMISSIONS: 'permissions', SECURITY: 'security', UI: 'ui', TELEMETRY: 'telemetry', ORCHESTRATOR: 'orchestrator', SYSTEM: 'system', APP: 'app', ASSET: 'asset', BOOT: 'boot', COMMAND: 'command', MANIFEST: 'manifest', NAV: 'nav', EXTERNAL: 'external' } as const;

/** Derived type: union of all namespace string values */
export type Namespace = typeof NAMESPACES[keyof typeof NAMESPACES];

export const VALID_NAMESPACES: readonly Namespace[] = Object.values(NAMESPACES) as readonly Namespace[];

export interface EventNameValidationResult {
  valid: boolean;
  error: string | null;
}

export const isValidNamespace = (namespace: string): boolean => VALID_NAMESPACES.includes(namespace as Namespace);

export const extractNamespace = (eventName: string): string | null => { if (!eventName || typeof eventName !== 'string') return null; const parts: string[] = eventName.split('.'); return parts[0] || null; };

export const validateEventName = (eventName: string): EventNameValidationResult => { const namespace: string | null = extractNamespace(eventName); if (!namespace) { return { valid: false, error: 'Event name is empty or invalid' }; } if (!isValidNamespace(namespace)) { return { valid: false, error: `Invalid namespace: ${namespace}. Valid: ${VALID_NAMESPACES.join(', ')}` }; } if (eventName.includes(':')) { return { valid: false, error: 'Event name must use dot-notation, not colons' }; } return { valid: true, error: null }; };
