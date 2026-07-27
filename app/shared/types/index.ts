// App Shared: Types
// Constantes e enums compartilhados
// Versão: 1.0.0-ENTERPRISE
// Migrado para TypeScript: 2026-02-25

// Status
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending'
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];

// User Levels
export const USER_LEVELS = {
  GUEST: 'guest',
  USER: 'user',
  EDITOR: 'editor',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
} as const;

export type UserLevel = typeof USER_LEVELS[keyof typeof USER_LEVELS];

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const;

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

// Layout Modes
export const LAYOUT_MODES = {
  DEFAULT: 'default',
  FULLSCREEN: 'fullscreen',
  COMPACT: 'compact',
  CANVAS: 'canvas'
} as const;

export type LayoutMode = typeof LAYOUT_MODES[keyof typeof LAYOUT_MODES];

// Theme
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system'
} as const;

export type Theme = typeof THEMES[keyof typeof THEMES];

// Breakpoints
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Z-Index layers
export const Z_LAYERS = {
  BASE: 0,
  MAIN: 1,
  FOOTER: 800,
  SIDEBAR: 950,
  HEADER: 1000,
  TOOLTIP: 6000,
  DROPDOWN: 7000,
  MODAL: 8000,
  TOAST: 8500,
  LOGIN: 9000,
  PRELOADER: 9999
} as const;

export type ZLayerKey = keyof typeof Z_LAYERS;

// Event types
export const EVENT_TYPES = {
  CLICK: 'click',
  CHANGE: 'change',
  SUBMIT: 'submit',
  FOCUS: 'focus',
  BLUR: 'blur',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',
  RESIZE: 'resize',
  SCROLL: 'scroll'
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Component states
export const COMPONENT_STATES = {
  UNMOUNTED: 'unmounted',
  MOUNTING: 'mounting',
  MOUNTED: 'mounted',
  UPDATING: 'updating',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed',
  ERROR: 'error'
} as const;

export type ComponentState = typeof COMPONENT_STATES[keyof typeof COMPONENT_STATES];

export default {
  STATUS, USER_LEVELS, HTTP_METHODS, LAYOUT_MODES,
  THEMES, BREAKPOINTS, Z_LAYERS, EVENT_TYPES, COMPONENT_STATES
};
