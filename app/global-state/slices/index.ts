// Migrado para TypeScript: 2026-02-25
// Global State Slices - Central Export
// Versão: 1.0.0-ENTERPRISE

export { default as AppSlice } from './app.ts';
export { default as SessionSlice } from './session.ts';
export { default as PermissionsSlice } from './permissions.ts';
export { default as LayoutsSlice } from './layouts.ts';
export { default as FlagsSlice } from './flags.ts';

export const SLICES = ['app', 'session', 'permissions', 'layouts', 'flags'] as const;
