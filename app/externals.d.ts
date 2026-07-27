// Declarações de módulos externos (public/components)
// Estes módulos são carregados via browser como ES modules
// servidos pelo nginx a partir de public/
// Migrado para TypeScript: 2026-02-25

declare module '/app/router/contracts.js' {
  export const PUBLIC_ROUTES: string[];
  export function getPublicRoutes(): string[];
  const _default: unknown;
  export default _default;
}

declare module '/components/router/state/store.js' {
  export const routerStore: {
    getState: () => Record<string, unknown>;
    getCurrentRoute: () => Record<string, unknown> | null;
    getVirtualRoute: () => Record<string, unknown> | null;
    getAttemptedRoute: () => Record<string, unknown> | null;
    clearAttemptedRoute: () => void;
    setState: (state: Record<string, unknown>) => void;
    dispatch: (action: string, payload?: unknown) => void;
    subscribe: (fn: (state: Record<string, unknown>) => void) => () => void;
    [key: string]: unknown;
  };
  export function createVirtualRoute(data?: Record<string, unknown>): Record<string, unknown>;

  const _default: unknown;
  export default _default;
}

declare module '/components/router/telemetry/tracker.js' {
  export const routerTelemetry: {
    track: (event: string, data?: Record<string, unknown>) => void;
    startSpan: (name: string) => { end: () => void };
    getMetrics: () => Record<string, unknown>;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/router/core/parser.js' {
  export const URLParser: {
    parse: (url: string) => Record<string, unknown>;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/router/core/resolver.js' {
  export const RouteResolver: {
    resolve: (path: string) => Record<string, unknown> | null;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/router/core/history.js' {
  export const HistoryManager: {
    push: (path: string, state?: Record<string, unknown>) => void;
    replace: (path: string, state?: Record<string, unknown>) => void;
    back: () => void;
    getState: () => Record<string, unknown>;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/router/core/guard.js' {
  export const RouteGuard: {
    check: (route: Record<string, unknown>) => boolean | Promise<boolean>;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/router/core/transitions.js' {
  export const RouteTransitions: {
    apply: (from: string, to: string) => Promise<void>;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/router/registry/routes.js' {
  export function getRoutes(): Array<Record<string, unknown>>;
  export function getRouteByIdOrPath(idOrPath: string): Record<string, unknown> | null;
  const _default: unknown;
  export default _default;
}

declare module '/components/router/registry/validation.js' {
  export function validateRoute(route: Record<string, unknown>): boolean;
  const _default: unknown;
  export default _default;
}

declare module '/components/router/validator/router-validation.js' {
  export const routerValidation: {
    validate: () => Record<string, unknown>;
    [key: string]: unknown;
  };
  const _default: unknown;
  export default _default;
}

declare module '/components/app-shell/index.js' {
  const _default: {
    mount?: (container: HTMLElement) => void;
    unmount?: () => void;
    getStatus?: () => Record<string, unknown>;
    adapter?: unknown;
    layoutManager?: unknown;
    [key: string]: unknown;
  };
  export default _default;
}

declare module '/components/login-modal/index.js' {
  const _default: {
    open?: () => void;
    close?: () => void;
    toggle?: () => void;
    getStatus?: () => Record<string, unknown>;
    [key: string]: unknown;
  };
  export default _default;
}

declare module '/components/preloader/index.js' {
  const _default: {
    show?: () => void;
    hide?: () => void;
    updateProgress?: (percent: number, message?: string) => void;
    getStatus?: () => Record<string, unknown>;
    [key: string]: unknown;
  };
  export default _default;
}
