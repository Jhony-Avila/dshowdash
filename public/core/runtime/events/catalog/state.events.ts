// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const STATE_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  CREATE_SLICE: "state.slice.create.request",
  DESTROY_SLICE: "state.slice.destroy.request",
  DISPATCH_ACTION: "state.dispatch.request"
});

export const GLOBAL_STATE_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  SYNC_SESSION: "globalState:session:sync.request",
  CLEAR_SESSION: "globalState:session:clear.request"
});

export const CONTEXT_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  UPDATE_CONTEXT: "context.update.request",
  REQUEST_CONTEXT: "context.request.request",
  RESET_CONTEXT: "context.reset.request",
  SUBSCRIBE_CONTEXT: "context.subscribe.request",
  UNSUBSCRIBE_CONTEXT: "context.unsubscribe.request"
});

export const PANEL_16_STATE_EVENTS: Readonly<Record<string, string>> = Object.freeze({
  HYDRATED: "panel-16:state-controller:hydrated",
  MUTATION: "panel-16:state-controller:mutation",
  BATCH_MUTATION: "panel-16:state-controller:batch-mutation",
  RESTORED: "panel-16:state-controller:restored",
  RESET: "panel-16:state-controller:reset"
});
