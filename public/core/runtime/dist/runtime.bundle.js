import { createHealthResult as Dt, HEALTH_STATUS as q } from "/bootstrap-v2/contracts/health-contract.js";
import "/core/auth/contracts/auth-contracts.js";
const po = Object.freeze({ VISIBLE: "app.visible", HIDDEN: "app.hidden", ONLINE: "app.online", OFFLINE: "app.offline", REFRESH: "app.refresh", REFRESH_REQUEST: "app.refresh.request", REFRESHED: "app.refreshed" }), mo = Object.freeze({ REFRESH: "app.refresh.request" }), go = Object.freeze({ LOADER_INITIALIZED: "asset.loader.initialized", CSS_LOADED: "asset.css.loaded", CSS_FAILED: "asset.css.failed", JS_LOADED: "asset.js.loaded", JS_FAILED: "asset.js.failed", ANIMATION_READY: "asset.animation.ready", LAZY_LOADED: "asset.lazy.loaded", LAZY_FAILED: "asset.lazy.failed" }), Lo = Object.freeze({ LOAD_CSS: "asset.css.load.request", LOAD_JS: "asset.js.load.request", LAZY_LOAD: "asset.lazy.load.request" }), ho = Object.freeze({ SESSION_START_REQUEST: "auth.session.start.request", SESSION_STARTED: "auth.session.started", SESSION_END_REQUEST: "auth.session.end.request", SESSION_ENDED: "auth.session.ended", SESSION_EXPIRED: "auth.session.expired", SESSION_CHECKED: "auth.session.checked", SESSION_RENEWED: "auth.session.renewed", SESSION_INVALID: "auth.session.invalid", SESSION_VALIDATED: "auth.session.validated", LOGIN_REQUEST: "auth.login.request", LOGIN_START: "auth.login.start", LOGIN_SUCCEEDED: "auth.login.succeeded", LOGIN_SUCCESS: "auth.login.success", LOGIN_FAILED: "auth.login.failed", LOGIN_FAILURE: "auth.login.failure", LOGIN_REQUIRED: "auth.login.required", LOGIN_ATTEMPT: "auth.login.attempt", LOGIN_TIMEOUT: "auth.login.timeout", LOGIN_DETECTED: "auth.login.detected", LOGIN_RECEIVED: "auth.login.received", LOGOUT_REQUEST: "auth.logout.request", LOGOUT: "auth.logout", LOGOUT_START: "auth.logout.start", LOGOUT_COMPLETED: "auth.logout.completed", LOGOUT_SUCCESS: "auth.logout.success", LOGOUT_DETECTED: "auth.logout.detected", LOGOUT_RECEIVED: "auth.logout.received", MODAL_OPEN: "login-modal.open", MODAL_CLOSE: "login-modal.close", PERMISSIONS_LOADED: "auth.permissions.loaded", PERMISSIONS_CHANGED: "auth.permissions.changed", PERMISSIONS_DENIED: "auth.permissions.denied", TOKEN_REFRESHED: "auth.token.refreshed", TOKEN_EXPIRED: "auth.token.expired", TOKEN_INVALID: "auth.token.invalid", USER_LOADED: "auth.user.loaded", USER_UPDATED: "auth.user.updated", READY: "auth.ready", CHANGED: "auth.changed", STATE_CHANGED: "auth.state.changed", STATE_CHANGE_RECEIVED: "auth.state.change.received", SESSION_CHECKED_RECEIVED: "auth.session.checked.received", INTEGRATION_RETRY_SCHEDULED: "auth.integration.retry.scheduled", INTEGRATION_MAX_RETRIES: "auth.integration.max.retries", INTEGRATION_ALREADY_CONNECTED: "auth.integration.already.connected", INTEGRATION_CONNECTED: "auth.integration.connected", INTEGRATION_ERROR: "auth.integration.error", ERROR: "auth.error", NETWORK_ERROR: "auth.network.error", ADAPTER_NOT_READY: "auth.adapter.not.ready", HEALTH_DEGRADED: "auth.health.degraded", SESSION_REFRESH: "auth.session.refresh" }), fo = Object.freeze({ START_SESSION: "auth.session.start.request", END_SESSION: "auth.session.end.request", LOGIN: "auth.login.request", LOGOUT: "auth.logout.request", OPEN_MODAL: "login-modal.open", CLOSE_MODAL: "login-modal.close" }), Co = Object.freeze({ UNKNOWN: "unknown", CHECKING: "checking", AUTHENTICATED: "authenticated", UNAUTHENTICATED: "unauthenticated", ERROR: "error", EXPIRED: "expired" }), bo = Object.freeze({ AUTH_READY: "data-auth-ready", AUTH_STATE: "data-state", USER_LEVEL: "data-user-level", USER_ID: "data-user-id" }), vo = Object.freeze({ OPEN: "login-modal.open", CLOSE: "login-modal.close", MOUNTED: "login-modal.mounted", UNMOUNTED: "login-modal.unmounted", READY: "login-modal.ready", SUBMIT: "login-modal.submit", CANCEL: "login-modal.cancel", ERROR: "login-modal.error", SUCCESS: "login-modal.success" }), yo = Object.freeze({ OPEN: "login-modal.open", CLOSE: "login-modal.close", SUBMIT: "login-modal.submit", CANCEL: "login-modal.cancel" }), g = Object.freeze({
  ORCHESTRATOR_READY: "boot.orchestrator.ready",
  ENTERPRISE_READY: "boot.enterprise.ready",
  STARTED: "boot.started",
  READY: "boot.ready",
  COMPLETED: "boot.completed",
  FAILED: "boot.failed",
  COMPONENTS_READY: "boot.components.ready",
  AUTH_READY: "boot.auth.ready",
  ENHANCEMENTS_READY: "boot.enhancements.ready",
  PRELOADER_PHASE_CHANGE: "preloader.phase:change",
  PRELOADER_ORCHESTRATOR_READY: "preloader.orchestrator:boot-ready",
  BOOTSTRAP_V2_COMPLETE: "boot.bootstrap-v2.complete",
  BOOTSTRAP_V2_ERROR: "boot.bootstrap-v2.error",
  TIMEOUT: "bootstrap:timeout",
  TIMEOUT_WARNING: "bootstrap:timeout-warning",
  BOOT_LOOP_DETECTED: "bootstrap:boot-loop-detected",
  HEALTH_PERIODIC: "boot:health:periodic",
  CANCELLED: "bootstrap:cancelled",
  CONTEXT_READY: "bootstrap:context-ready",
  APPSHELL_READY: "boot.appshell.ready"
}), Uo = Object.freeze({
  START: "boot.start.request",
  RESTART: "boot.restart.request"
}), Mo = Object.freeze({ CONFIG_READY: "core.config.ready", ENVIRONMENT_READY: "core.environment.ready", EVENTBUS_READY: "core.eventbus.ready", LOGGER_READY: "core.logger.ready", SECURITY_CSRF_READY: "core.security.csrf.ready", ERROR_BOUNDARY_READY: "core.error.boundary.ready", PRELOADER_READY: "core.preloader.ready", PHASE0_COMPLETE: "core.phase0.complete", PHASE1_COMPLETE: "core.phase1.complete", PHASE2_COMPLETE: "core.phase2.complete", PHASE3_COMPLETE: "core.phase3.complete", PHASE4_COMPLETE: "core.phase4.complete" }), Po = Object.freeze({ INIT_CONFIG: "core.config.init.request", INIT_ENVIRONMENT: "core.environment.init.request" }), Ho = Object.freeze({ TOAST: "degradation:toast", BANNER: "degradation:banner", NOTIFY: "degradation:notify", DISMISSED: "degradation:dismissed", DISMISSED_ALL: "degradation:dismissed-all" }), Go = Object.freeze({ CAPTURED: "error.captured", HANDLED: "error.handled", CATCH: "error.catch", FATAL: "error.fatal", CIRCUIT_BREAKER_TRIPPED: "error.circuit.breaker.tripped", CIRCUIT_BREAKER_RESET: "error.circuit.breaker.reset", RETRY_REQUESTED: "error.retry.requested", RELOAD_PANEL_REQUESTED: "error.reload.panel.requested", RELOAD_ENGINE_REQUESTED: "error.reload.engine.requested", RECOVER: "error.recover", USER_NOTIFICATION: "error.user.notification", ESCALATED: "error.escalated", LOGGED: "error.logged", REPORTED: "error.reported", RETRY_SCHEDULED: "error.retry.scheduled" }), Vo = Object.freeze({ RETRY: "error.retry.request", RELOAD_PANEL: "error.reload.panel.request", RELOAD_ENGINE: "error.reload.engine.request", DISMISS: "error.dismiss.request", RECOVER: "error.recover.request" }), wo = Object.freeze({ SERVER_UPDATED: "feature-flags.server:updated", FLAG_CHANGED: "feature.flag:changed", READY: "feature-flags.ready", ERROR: "feature-flags.error" }), ko = Object.freeze({ INIT: "lifecycle.init", INITIALIZING: "lifecycle.initializing", INITIALIZED: "lifecycle.initialized", MOUNTING: "lifecycle.mounting", MOUNTED: "lifecycle.mounted", MOUNT_FAILED: "lifecycle.mount.failed", UPDATING: "lifecycle.updating", UPDATED: "lifecycle.updated", UNMOUNTING: "lifecycle.unmounting", UNMOUNTED: "lifecycle.unmounted", DESTROYING: "lifecycle.destroying", DESTROYED: "lifecycle.destroyed", READY: "lifecycle.ready", ERROR: "lifecycle.error", DEGRADED: "lifecycle.degraded", DATA_LOADED: "lifecycle.data.loaded", DATA_ERROR: "lifecycle.data.error", MODE_DEGRADED: "lifecycle.mode.degraded", WARNING: "lifecycle.warning", VISIBILITY: "lifecycle.visibility", INTERACTION: "lifecycle.interaction", STATE_CHANGED: "lifecycle.state.changed", REFRESH: "lifecycle.refresh", PHASE: "lifecycle.phase" }), Bo = Object.freeze({ MOUNT: "lifecycle.mount.request", UNMOUNT: "lifecycle.unmount.request", DESTROY: "lifecycle.destroy.request" }), qo = Object.freeze({ ENTRY: "log.entry", DEBUG: "log.debug", INFO: "log.info", WARN: "log.warn", ERROR: "log.error", CRITICAL: "log.critical", FLUSH: "log.flush", CLEAR: "log.clear", ANOMALY: "log.anomaly" }), Fo = Object.freeze({ LOG_ENTRY: "log.entry.request", FLUSH_LOGS: "log.flush.request", CLEAR_LOGS: "log.clear.request" }), Yo = Object.freeze({ READY: "orchestrator.ready", INITIALIZED: "orchestrator.initialized", ERROR: "orchestrator.error", METRICS_FLUSH: "orchestrator.metrics.flush", MODULE_REGISTERED: "orchestrator.module.registered", MODULE_UNREGISTERED: "orchestrator.module.unregistered", CHANGED: "orchestrator.changed", ROUTE_CHANGED: "orchestrator.route.changed", PRESET_APPLIED: "orchestrator.preset.applied", LAYOUT_REQUEST: "orchestrator.layout.request", INIT: "ui-orchestrator.init", INTENT_EMITTED: "ui-orchestrator.intent-emitted", INTENT_RESOLVED: "ui-orchestrator.intent-resolved", INTENT_DENIED: "ui-orchestrator.intent-denied", INTENT_FAILED: "ui-orchestrator.intent-failed", PERMISSIONS_ENFORCEMENT: "ui-orchestrator.permissions-enforcement", OVERRIDE_SET: "ui-orchestrator.override-set", LOADING: "orchestrator.loading", METRICS_BATCH: "orchestrator.metrics.batch" }), zo = Object.freeze({ EMIT_INTENT: "Emitir intent para resolução", RESOLVE_INTENT: "Resolver intent com regras", DENY_INTENT: "Negar intent por permissão", FAIL_INTENT: "Falha na resolução de intent", REGISTER_MODULE: "Registrar módulo no orchestrator", UNREGISTER_MODULE: "Desregistrar módulo do orchestrator", APPLY_PRESET: "Aplicar preset de layout", REQUEST_LAYOUT: "Solicitar mudança de layout" }), Wo = Object.freeze({ READY: "permissions.ready", LOAD_REQUEST: "permissions.load.request", LOADED: "permissions.loaded", LOAD_FAILED: "permissions.load.failed", CHECK_REQUEST: "permissions.check.request", CHECK_PASSED: "permissions.check.passed", CHECK_DENIED: "permissions.check.denied", ACCESS_DENIED: "permissions.access.denied", ACCESS_GRANTED: "permissions.access.granted", CHANGED: "permissions.changed", UPDATED: "permissions.updated", REVOKED: "permissions.revoked", GRANTED: "permissions.granted", MODE_CHANGED: "permissions.mode.changed", ENFORCEMENT_CHANGED: "permissions.enforcement.changed", ENFORCEMENT_ALERT: "permissions.enforcement.alert", ENFORCEMENT_DECISION: "permissions.enforcement.decision", CACHE_INVALIDATED: "permissions.cache.invalidated", CACHE_REFRESHED: "permissions.cache.refreshed", ROUTE_CHECK: "permissions.route.check", ROUTE_ALLOWED: "permissions.route.allowed", ROUTE_DENIED: "permissions.route.denied", MODULE_CHECK: "permissions.module.check", MODULE_ALLOWED: "permissions.module.allowed", MODULE_DENIED: "permissions.module.denied", GLOBAL_STATE_SESSION_LOADED: "permissions.globalstate.session.loaded", GLOBAL_STATE_SESSION_CLEARED: "permissions.globalstate.session.cleared", GLOBAL_STATE_CONNECTED: "permissions.globalstate.connected", ORCHESTRATOR_USER_LOADED: "permissions.orchestrator.user.loaded", ORCHESTRATOR_USER_CLEARED: "permissions.orchestrator.user.cleared", ORCHESTRATOR_CONNECTED: "permissions.orchestrator.connected" }), jo = Object.freeze({ LOAD: "permissions.load.request", CHECK: "permissions.check.request" }), Ko = Object.freeze({
  PHASE_CHANGE: "preloader.phase:change",
  SHOW: "preloader.show",
  HIDE: "preloader.hide",
  PROGRESS: "preloader.progress",
  READY: "preloader.ready",
  BOOT_READY: "preloader.orchestrator:boot-ready",
  // v1.1.0: Evento explícito para modo degradado
  DEGRADED: "preloader.degraded",
  DEGRADED_EXIT: "preloader.degraded:exit",
  // Eventos de vídeo (já usados no boot-manager)
  VIDEO_LOADED: "preloader.video:loaded",
  VIDEO_ERROR: "preloader.video:error",
  PHASE: "preloader.phase"
}), xo = Object.freeze({ NAVIGATE_REQUEST: "router.navigate.request", NAVIGATE: "router.navigate", NAVIGATE_START: "router.navigate.start", NAVIGATE_END: "router.navigate.end", NAVIGATED: "router.navigated", NAVIGATION_FAILED: "router.navigation.failed", NAVIGATION_CANCELLED: "router.navigation.cancelled", NAVIGATE_ERROR: "router.navigate.error", NAVIGATE_CANCEL: "router.navigate.cancel", ROUTE_CHANGED: "router.route.changed", ROUTE_NOT_FOUND: "router.route.not.found", ROUTE_FORBIDDEN: "router.route.forbidden", LAYOUT_CHANGED: "router.layout.changed", STATE_CHANGED: "router.state.changed", STATE_NAVIGATING: "router.state.navigating", READY: "router.ready", INITIALIZED: "router.initialized", HISTORY_BACK_REQUEST: "router.history.back.request", HISTORY_FORWARD_REQUEST: "router.history.forward.request", HISTORY_UPDATED: "router.history.updated", HISTORY_PUSH: "router.history.push", HISTORY_REPLACE: "router.history.replace", HISTORY_POP: "router.history.pop", GUARD_CHECK_REQUEST: "router.guard.check.request", GUARD_CHECK: "router.guard.check", GUARD_PASSED: "router.guard.passed", GUARD_BLOCKED: "router.guard.blocked", GUARD_BLOCK: "router.guard.block", GUARD_PASS: "router.guard.pass", CANVAS_NAVIGATE: "router.canvas.navigate", CANVAS_UPDATE: "router.canvas.update", ERROR: "router.error", ERROR_TRACKED: "router.error.tracked", BREADCRUMB_UPDATE: "router.breadcrumb.update", BREADCRUMB_UPDATED: "router.breadcrumb.updated", DEEPLINK_HANDLED: "router.deeplink.handled", HEALTH_CHECK: "router.health.check", HEALTH_CHECKED: "router.health.checked", OFFLINE_ONLINE: "router.offline.online", OFFLINE_OFFLINE: "router.offline.offline", OFFLINE_PROCESS: "router.offline.process", OFFLINE_PROCESSED: "router.offline.processed", REALTIME_NAVIGATION: "router.realtime.navigation", DESTROYED: "router.destroyed", VIRTUAL_ROUTE_CHANGED: "router.virtual.route.changed", CHANGED: "router.changed" }), $o = Object.freeze({ NAVIGATE: "router.navigate.request", GO_BACK: "router.history.back.request", GO_FORWARD: "router.history.forward.request" }), Qo = Object.freeze({ READY: "security.ready", ERROR: "security.error", LIST: "security.list", STATS: "security.stats", LOGGED: "security.logged", FLUSHED: "security.flushed", SESSION_CHANGED: "security.session.changed" }), Zo = Object.freeze({ READY: "SecurityEventsClient inicializado", ERROR: "Erro em operação de segurança", LIST: "Lista de eventos carregada", STATS: "Estatísticas carregadas", LOGGED: "Evento de segurança registrado", FLUSHED: "Buffer de eventos enviado" }), Xo = Object.freeze({ INIT_REQUEST: "session.init.request", INITIALIZED: "session.initialized", DESTROY_REQUEST: "session.destroy.request", DESTROYED: "session.destroyed", STATE_CHANGED: "session.state.changed", STATE_RESTORED: "session.state.restored", STATE_PERSISTED: "session.state.persisted", LIFECYCLE_STATE_CHANGED: "session.lifecycle.state.changed", TIMEOUT_WARNING: "session.timeout.warning", TIMEOUT_EXPIRED: "session.timeout.expired", TIMEOUT_EXTENDED: "session.timeout.extended", ACTIVITY_DETECTED: "session.activity.detected", IDLE_DETECTED: "session.idle.detected", STARTED: "session.started", ENDED: "session.ended", ACTIVITY: "session.activity", EXPIRING_SOON: "session.expiring-soon", EXPIRED: "session.expired", REFRESHED: "session.refreshed", SYNCED: "session.synced", ERROR: "session.error" }), Jo = Object.freeze({ INIT: "session.init.request", DESTROY: "session.destroy.request", REFRESH: "session.refresh.request", EXTEND: "session.extend.request" }), Ye = Object.freeze({ READY: "appshell.ready", DEGRADED: "appshell.degraded", HEADER_MOUNTED: "shell.header.mounted", HEADER_UNMOUNTED: "shell.header.unmounted", HEADER_READY: "shell.header.ready", HEADER_ERROR: "shell.header.error", SIDEBAR_MOUNTED: "shell.sidebar.mounted", SIDEBAR_UNMOUNTED: "shell.sidebar.unmounted", SIDEBAR_TOGGLE: "shell.sidebar.toggle", SIDEBAR_READY: "shell.sidebar.ready", SIDEBAR_ERROR: "shell.sidebar.error", FOOTER_MOUNTED: "shell.footer.mounted", FOOTER_UNMOUNTED: "shell.footer.unmounted", FOOTER_READY: "shell.footer.ready", FOOTER_ERROR: "shell.footer.error", MAIN_MOUNTED: "shell.main.mounted", MAIN_UNMOUNTED: "shell.main.unmounted", MAIN_READY: "shell.main.ready", HEALTH_REPORT: "appshell.health.report" }), ea = Object.freeze({ MOUNT_HEADER: "shell.header.mount.request", MOUNT_SIDEBAR: "shell.sidebar.mount.request", MOUNT_FOOTER: "shell.footer.mount.request", TOGGLE_SIDEBAR: "shell.sidebar.toggle.request" }), Nt = Object.freeze({ CHANGED: "state.changed", ERROR: "state.error", PERFORMANCE: "state.performance", RESET: "state.reset", HYDRATED: "state.hydrated", ENGINE_INIT: "state.engine.init", ENGINE_READY: "state.engine.ready", ENGINE_ERROR: "state.engine.error", DISPATCH: "state.dispatch", DISPATCHED: "state.dispatched", SLICE_CREATED: "state.slice.created", SLICE_DESTROYED: "state.slice.destroyed", SLICE_UPDATED: "state.slice.updated", SUBSCRIBED: "state.subscribed", UNSUBSCRIBED: "state.unsubscribed", STORE_INITIALIZED: "state.store.initialized", ACTION_BLOCKED: "state.action.blocked", SUBSCRIBER_ADDED: "state.subscriber.added", SUBSCRIBER_REMOVED: "state.subscriber.removed" }), ta = Object.freeze({ CREATE_SLICE: "state.slice.create.request", DESTROY_SLICE: "state.slice.destroy.request", DISPATCH_ACTION: "state.dispatch.request" }), St = Object.freeze({ INIT_COMPLETE: "globalState:init:complete", DESTROYED: "globalState:destroyed", SESSION_SYNCED: "globalState:session:synced", SESSION_CLEARED: "globalState:session:cleared", STATE_CHANGED: "globalState:state:changed", ERROR: "globalState:error" }), ra = Object.freeze({ SYNC_SESSION: "globalState:session:sync.request", CLEAR_SESSION: "globalState:session:clear.request" }), pt = Object.freeze({ READY: "context.ready", INITIALIZED: "context.initialized", DESTROYED: "context.destroyed", ERROR: "context.error", UPDATE: "context.update", REQUEST: "context.request", RESET: "context.reset", SET: "context.set", GET: "context.get", SUBSCRIBED: "context.subscribed", UNSUBSCRIBED: "context.unsubscribed", SYNCED: "context.synced", HYDRATED: "context.hydrated" }), oa = Object.freeze({ UPDATE_CONTEXT: "context.update.request", REQUEST_CONTEXT: "context.request.request", RESET_CONTEXT: "context.reset.request", SUBSCRIBE_CONTEXT: "context.subscribe.request", UNSUBSCRIBE_CONTEXT: "context.unsubscribe.request" }), mt = Object.freeze({ HYDRATED: "panel-16:state-controller:hydrated", MUTATION: "panel-16:state-controller:mutation", BATCH_MUTATION: "panel-16:state-controller:batch-mutation", RESTORED: "panel-16:state-controller:restored", RESET: "panel-16:state-controller:reset" }), aa = () => {
  const e = Object.values(Nt), t = Object.values(St), o = Object.values(pt), r = Object.values(mt);
  return { valid: e.concat(t, o, r).every((n) => typeof n == "string" && n.length > 0), stateEventsCount: e.length, globalStateEventsCount: t.length, contextEventsCount: o.length, panel16StateEventsCount: r.length, version: "1.4.0-P24" };
}, na = Object.freeze({ BOOT_START: "system.boot.start", BOOT_PROGRESS: "system.boot.progress", BOOT_READY: "system.boot.ready", BOOT_FAILED: "system.boot.failed", CONFIG_LOAD_REQUEST: "system.config.load.request", CONFIG_LOADED: "system.config.loaded", CONFIG_LOAD_FAILED: "system.config.load.failed", CONFIG_CHANGED: "system.config.changed", FEATURE_ENABLED: "system.feature.enabled", FEATURE_DISABLED: "system.feature.disabled", FEATURE_FLAG_CHANGED: "system.feature.flag.changed", HEALTH_OK: "system.health.ok", HEALTH_DEGRADED: "system.health.degraded", HEALTH_CRITICAL: "system.health.critical", HEALTH_REGISTRY_READY: "health-registry.ready", HEALTH_COLLECTED: "health-registry.collected", ERROR_OCCURRED: "system.error.occurred", ERROR_RECOVERED: "system.error.recovered", FATAL_ERROR: "system.fatal.error", SHUTDOWN_REQUEST: "system.shutdown.request", SHUTDOWN_COMPLETED: "system.shutdown.completed", TENANT_CHANGED: "system.tenant.changed", ROUTE_STATE_SYNC: "system.route.state.sync", QUALITY_CHANGE: "system.quality.change" }), sa = Object.freeze({ LOAD_CONFIG: "system.config.load.request", SHUTDOWN: "system.shutdown.request" }), ia = Object.freeze({ "auth:login:success": "auth.login.success", "auth:login:failure": "auth.login.failure", "auth:login:required": "auth.login.required", "auth:login:start": "auth.login.start", "auth:logout": "auth.logout", "auth:logout:success": "auth.logout.success", "auth:logout:start": "auth.logout.start", "auth:session:checked": "auth.session.checked", "auth:session:expired": "auth.session.expired", "auth:session:renewed": "auth.session.renewed", "auth:session:invalid": "auth.session.invalid", "auth:ready": "auth.ready", "auth:state:changed": "auth.state.changed", "auth:token:refreshed": "auth.token.refreshed", "auth:token:expired": "auth.token.expired", "auth:user:loaded": "auth.user.loaded", "auth:user:updated": "auth.user.updated", "auth:permissions:loaded": "auth.permissions.loaded", "auth:permissions:changed": "auth.permissions.changed", "auth:error": "auth.error", "auth:network:error": "auth.network.error", "auth.login": "auth.login.request", "auth.logout": "auth.logout.request", "router:navigate": "router.navigate", "router:navigate:start": "router.navigate.start", "router:navigate:end": "router.navigate.end", "router:navigate:error": "router.navigate.error", "router:navigate:cancel": "router.navigate.cancel", "router:route:changed": "router.route.changed", "router:route:not-found": "router.route.not.found", "router:route:forbidden": "router.route.forbidden", "router:guard:check": "router.guard.check", "router:guard:block": "router.guard.block", "router:guard:pass": "router.guard.pass", "router:history:push": "router.history.push", "router:history:replace": "router.history.replace", "router:history:pop": "router.history.pop", "router:ready": "router.ready", "router:initialized": "router.initialized", "router:error": "router.error", "router:canvas:navigate": "router.canvas.navigate", "router:canvas:update": "router.canvas.update", "router:layout:changed": "router.layout.changed", "router.navigate": "router.navigate.request", "router.navigated": "router.navigated", "panel.mounted": "panel.mounted", "panel.unmounted": "panel.unmounted", "panel.loaded": "panel.loaded", "panel.ready": "panel.ready", "panel.error": "panel.error", "panel.open": "panel.open", "panel.close": "panel.close", "panel:open": "panel.open", "panel:close": "panel.close", "panel:loaded": "panel.loaded", "panel:error": "panel.error", "panel-registry.complete": "panel.registry.complete", "ui.action": "ui.action", "toast.show": "ui.toast.show.request", "toast:show": "ui.toast.show.request", "telemetry.track": "telemetry.track.request", "telemetry.event": "telemetry.tracked", "telemetry:track": "telemetry.track.request", "layout.request": "orchestrator.layout.request", "layout:request": "orchestrator.layout.request", "sidebar.resize": "ui.sidebar.resize", "sidebar.toggle": "ui.sidebar.toggle", "sidebar:resize": "sidebar.resize", "sidebar:toggle": "sidebar.toggle", "sidebar:collapse": "sidebar.collapse", "sidebar:expand": "sidebar.expand", "tenant.changed": "system.tenant.changed", "route-state.sync": "system.route.state.sync", "header:refresh": "header.refresh", "header:ready": "header.ready", "header:mounted": "header.mounted", "header:error": "header.error", "session:expired": "session.expired", "session:renewed": "session.renewed", "component:mounted": "component.mounted", "component:ready": "component.ready", "component:error": "component.error" }), Ea = Object.freeze({ INITIALIZED: "telemetry.initialized", ENABLED: "telemetry.enabled", DISABLED: "telemetry.disabled", CLEARED: "telemetry.cleared", TRACK: "telemetry.track", EVENT: "telemetry.event", CACHE_EVENT: "telemetry.cache-event", KERNEL_READY: "telemetry-kernel.ready", TRACK_REQUEST: "telemetry.track.request", TRACKED: "telemetry.tracked", TRACK_FAILED: "telemetry.track.failed", DROPPED: "telemetry.dropped", BATCH_SEND_REQUEST: "telemetry.batch.send.request", BATCH_SENT: "telemetry.batch.sent", BATCH_FAILED: "telemetry.batch.failed", HEALTH_SNAPSHOT_REQUEST: "telemetry.health.snapshot.request", HEALTH_SNAPSHOT_CREATED: "telemetry.health.snapshot.created", HEALTH_CHECK_REQUEST: "telemetry.health.check.request", HEALTH_CHECK_COMPLETED: "telemetry.health.check.completed", ERROR: "telemetry.error", ERROR_CAPTURED: "telemetry.error.captured", ERROR_REPORTED: "telemetry.error.reported", PERFORMANCE_MARK: "telemetry.performance.mark", PERFORMANCE_MEASURE: "telemetry.performance.measure", SESSION_STARTED: "telemetry.session.started", SESSION_ENDED: "telemetry.session.ended", METRICS_RECORD: "telemetry.metrics.record", METRICS_FLUSH: "telemetry.metrics.flush", COMPONENT_MOUNT: "telemetry.component.mount", COMPONENT_UNMOUNT: "telemetry.component.unmount", COMPONENT_RENDER: "telemetry.component.render", COMPONENT_INTERACTION: "telemetry.component.interaction" }), la = Object.freeze({ TRACK: "telemetry.track.request", SEND_BATCH: "telemetry.batch.send.request", HEALTH_SNAPSHOT: "telemetry.health.snapshot.request", HEALTH_CHECK: "telemetry.health.check.request", RECORD_METRICS: "telemetry.metrics.record.request", FLUSH_METRICS: "telemetry.metrics.flush.request" }), da = Object.freeze({ COMPONENT_READY: "component.ready", TOAST_SHOW_REQUEST: "ui.toast.show.request", TOAST_SHOWN: "ui.toast.shown", TOAST_HIDE_REQUEST: "ui.toast.hide.request", TOAST_HIDDEN: "ui.toast.hidden", TOAST: "ui.toast", TOAST_UPDATE: "toast.update", TOAST_SHOW: "toast.show", MODAL_OPEN_REQUEST: "ui.modal.open.request", MODAL_OPENED: "ui.modal.opened", MODAL_CLOSE_REQUEST: "ui.modal.close.request", MODAL_CLOSED: "ui.modal.closed", MODAL: "ui.modal", MODAL_ESCAPE: "modal.escape", MODAL_LIFECYCLE_PHASE: "modal.lifecycle.phase", MODAL_OPENING: "modal.opening", MODAL_CLOSING: "modal.closing", PRELOADER_SHOW_REQUEST: "ui.preloader.show.request", PRELOADER_SHOWN: "ui.preloader.shown", PRELOADER_HIDE_REQUEST: "ui.preloader.hide.request", PRELOADER_HIDDEN: "ui.preloader.hidden", OVERLAY_OPEN_REQUEST: "ui.overlay.open.request", OVERLAY_OPENED: "ui.overlay.opened", OVERLAY_CLOSE_REQUEST: "ui.overlay.close.request", OVERLAY_CLOSED: "ui.overlay.closed", DRAWER_OPEN_REQUEST: "ui.drawer.open.request", DRAWER_OPENED: "ui.drawer.opened", DRAWER_CLOSE_REQUEST: "ui.drawer.close.request", DRAWER_CLOSED: "ui.drawer.closed", DRAWER_UPDATE_CONTENT: "drawer.update-content", COMMAND_PALETTE_OPEN_REQUEST: "ui.command.palette.open.request", COMMAND_PALETTE_OPENED: "ui.command.palette.opened", COMMAND_PALETTE_CLOSE_REQUEST: "ui.command.palette.close.request", COMMAND_PALETTE_CLOSED: "ui.command.palette.closed", SEARCH_OPEN_REQUEST: "ui.search.open.request", SEARCH_OPENED: "ui.search.opened", SEARCH_CLOSE_REQUEST: "ui.search.close.request", SEARCH_CLOSED: "ui.search.closed", HELP_OPEN_REQUEST: "ui.help.open.request", HELP_OPENED: "ui.help.opened", HELP_CLOSE_REQUEST: "ui.help.close.request", HELP_CLOSED: "ui.help.closed", PREVIEW_SHOW_REQUEST: "ui.preview.show.request", PREVIEW_SHOWN: "ui.preview.shown", PREVIEW_HIDE_REQUEST: "ui.preview.hide.request", PREVIEW_HIDDEN: "ui.preview.hidden", SIDEBAR_TOGGLE_REQUEST: "ui.sidebar.toggle.request", SIDEBAR_TOGGLED: "ui.sidebar.toggled", SIDEBAR_TOGGLE: "ui.sidebar.toggle", SIDEBAR_MINI_TOGGLED: "ui.sidebar.mini.toggled", SIDEBAR_EXPAND_REQUEST: "ui.sidebar.expand.request", SIDEBAR_EXPANDED: "ui.sidebar.expanded", SIDEBAR_COLLAPSE_REQUEST: "ui.sidebar.collapse.request", SIDEBAR_COLLAPSED: "ui.sidebar.collapsed", SIDEBAR_RESIZE: "ui.sidebar.resize", FOOTER_ACTION: "ui.footer.action", FOOTER_BUTTON_CLICK: "ui.footer.button.click", HEADER_ACTION: "ui.header.action", HEADER_REFRESH_REQUEST: "ui.header.refresh.request", HEADER_REFRESHED: "ui.header.refreshed", HARD_NAV: "ui.hard.nav", LAYOUT_REQUEST: "layout.request", LAYOUT_CHANGED: "ui.layout.changed", VIDEO_PLAYING: "playing", VIDEO_PAUSED: "paused", VIDEO_LOADED: "loaded", VIDEO_ERROR_AUTOPLAY: "video.error:autoplay", VIDEO_ERROR_NETWORK: "video.error:network", VIDEO_ERROR_PLAYBACK: "video.error:playback", VIDEO_ERROR_MISSING_ELEMENT: "video.error:missing_element", VIDEO_LITE_MODE: "video.lite_mode", ACTION: "ui.action", ACTION_DOT: "ui.action", FOCUS_CHANGED: "ui.focus.changed", THEME_CHANGED: "ui.theme.changed" }), ca = Object.freeze({ UI_ACTION: "ui.action", TOAST_SHOW: "toast.show", LAYOUT_REQUEST: "layout.request" }), ua = Object.freeze({ SHOW_TOAST: "ui.toast.show.request", HIDE_TOAST: "ui.toast.hide.request", OPEN_MODAL: "ui.modal.open.request", CLOSE_MODAL: "ui.modal.close.request", SHOW_PRELOADER: "ui.preloader.show.request", HIDE_PRELOADER: "ui.preloader.hide.request", TOGGLE_SIDEBAR: "ui.sidebar.toggle.request", REQUEST_LAYOUT: "layout.request", OPEN_SEARCH: "ui.search.open.request", CLOSE_SEARCH: "ui.search.close.request", OPEN_HELP: "ui.help.open.request", CLOSE_HELP: "ui.help.close.request", SHOW_PREVIEW: "ui.preview.show.request", HIDE_PREVIEW: "ui.preview.hide.request" }), I = Object.freeze({
  // ─────────────────────────────────────────────────────────────
  // Lifecycle Events
  // ─────────────────────────────────────────────────────────────
  STRICT_MODE_ENABLED: "governance.strict-mode:enabled",
  STRICT_MODE_DISABLED: "governance.strict-mode:disabled",
  STRICT_MODE_INITIALIZED: "governance.strict-mode:initialized",
  // ─────────────────────────────────────────────────────────────
  // Violation Events by Severity
  // ─────────────────────────────────────────────────────────────
  VIOLATION_CRITICAL: "governance.violation:critical",
  VIOLATION_HIGH: "governance.violation:high",
  VIOLATION_MEDIUM: "governance.violation:medium",
  VIOLATION_LOW: "governance.violation:low",
  VIOLATION_INFO: "governance.violation:info",
  VIOLATION_RECORDED: "governance.violation:recorded",
  // ─────────────────────────────────────────────────────────────
  // Alert Events
  // ─────────────────────────────────────────────────────────────
  VIOLATION_SPIKE: "governance.alert:violation-spike",
  CRITICAL_THRESHOLD_EXCEEDED: "governance.alert:critical-threshold",
  MODULE_NON_COMPLIANT: "governance.alert:module-non-compliant",
  COMPLIANCE_DEGRADED: "governance.alert:compliance-degraded",
  UNKNOWN_SEVERITY: "governance.alert:unknown-severity",
  // ─────────────────────────────────────────────────────────────
  // Report Events
  // ─────────────────────────────────────────────────────────────
  COMPLIANCE_REPORT: "governance.report:compliance",
  VIOLATION_SUMMARY: "governance.report:violation-summary",
  MODULE_METRICS: "governance.report:module-metrics",
  // ─────────────────────────────────────────────────────────────
  // Health Events
  // ─────────────────────────────────────────────────────────────
  HEALTH_CHECK: "governance.health:check",
  HEALTH_DEGRADED: "governance.health:degraded",
  HEALTH_RESTORED: "governance.health:restored"
}), gt = Object.freeze({
  CRITICAL: I.VIOLATION_CRITICAL,
  HIGH: I.VIOLATION_HIGH,
  MEDIUM: I.VIOLATION_MEDIUM,
  LOW: I.VIOLATION_LOW,
  INFO: I.VIOLATION_INFO,
  UNKNOWN: I.VIOLATION_RECORDED
}), ee = "2.5.0-P03-BOOT-SAFE", $ = "enterprise-strict-mode";
let X = null, be = !1;
const J = [], Lt = 50;
function Je(e) {
  X = e;
}
function et() {
  be = !0, ht();
}
function ht() {
  if (!X) return;
  const e = X();
  if (!(!e || !e.emit))
    for (; J.length > 0; ) {
      const { eventName: t, payload: o } = J.shift();
      try {
        e.emit(t, o);
      } catch {
      }
    }
}
function F(e, t) {
  if (!be)
    return J.length < Lt && J.push({ eventName: e, payload: t }), !1;
  try {
    if (X) {
      const o = X();
      if (o && o.emit)
        return o.emit(e, t), !0;
    }
  } catch {
  }
  return !1;
}
const te = Object.freeze({
  // CRITICAL — Ports obrigatórias ausentes
  PORT_MISSING: "CRITICAL",
  PORT_REQUIRED_MISSING: "CRITICAL",
  // HIGH — Bloqueios de exposição críticos em strict mode
  WINDOW_FALLBACK_DENIED: "HIGH",
  WINDOW_EXPOSE_NOT_ALLOWED: "HIGH",
  CORE_STRICT_MODE_BLOCK: "HIGH",
  // MEDIUM — Bloqueios de módulo em strict mode
  WINDOW_ACCESS: "MEDIUM",
  MODULE_STRICT_BLOCK: "MEDIUM",
  FEATURE_FLAGS_STRICT_MODE_BLOCK: "MEDIUM",
  THEME_MANAGER_STRICT_MODE_BLOCK: "MEDIUM",
  // LOW — Fallbacks window.* (migrar para Ports)
  WINDOW_EVENTBUS_FALLBACK: "LOW",
  WINDOW_GLOBALSTATE_FALLBACK: "LOW",
  WINDOW_LOGGER_FALLBACK: "LOW",
  WINDOW_TOAST_FALLBACK: "LOW",
  WINDOW_SESSIONMANAGER_FALLBACK: "LOW",
  WINDOW_FALLBACK: "LOW",
  WINDOW_FALLBACK_USED: "LOW",
  WINDOW_CONTEXTPROVIDER_FALLBACK: "LOW",
  WINDOW_TELEMETRY_FALLBACK: "LOW",
  WINDOW_STORE_FALLBACK: "LOW",
  WINDOW_APP_CONFIG_FALLBACK: "LOW",
  WINDOW_APPSTATE_FALLBACK: "LOW",
  WINDOW_ROUTERGLOBAL_FALLBACK: "LOW",
  WINDOW_SECURITYCSRF_FALLBACK: "LOW",
  WINDOW_SIDEBARKERNEL_FALLBACK: "LOW",
  WINDOW_EVENTBUS_CHECK: "LOW",
  // MEDIUM — Lifecycle & AbortController compliance
  FETCH_WITHOUT_SIGNAL: "MEDIUM",
  MISSING_ABORT_SUPPORT: "MEDIUM",
  API_CLIENT_NO_TIMEOUT: "MEDIUM",
  LISTENER_LEAK_DETECTED: "MEDIUM",
  LIFECYCLE_DESTROY_MISSING: "MEDIUM",
  // INFO — Acessos controlados e bloqueios informativos
  GLOBAL_EXPOSURE_BLOCKED: "INFO",
  DIAGNOSTIC_WINDOW_ACCESS: "INFO",
  WINDOW_DIRECT_ACCESS: "INFO",
  WINDOW_GLOBAL_BLOCKED: "INFO",
  WINDOW_GLOBAL_ACCESS: "INFO",
  WINDOW_GLOBAL_FALLBACK: "INFO",
  WINDOW_LOGGER_EXPOSURE: "INFO",
  WINDOW_SIDEBAR_EXPOSURE_BLOCKED: "INFO"
}), A = {
  buckets: [],
  // Array de { timestamp, count, types: {} }
  bucketDuration: 6e4,
  // 1 minuto por bucket
  maxBuckets: 60,
  // 1 hora de histórico
  lastBucketTime: 0
};
function ft(e) {
  const t = Date.now(), o = Math.floor(t / A.bucketDuration) * A.bucketDuration;
  if (o > A.lastBucketTime)
    for (A.buckets.push({
      timestamp: o,
      count: 0,
      types: {}
    }), A.lastBucketTime = o; A.buckets.length > A.maxBuckets; )
      A.buckets.shift();
  const r = A.buckets[A.buckets.length - 1];
  r && (r.count++, r.types[e] = (r.types[e] || 0) + 1);
}
const Y = /* @__PURE__ */ new Map(), S = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, UNKNOWN: 0 };
let Le = 0, le = 0;
const Ct = 5e3, bt = 10;
class v extends Error {
  constructor(t, o = {}) {
    super(t), this.name = "EnterpriseViolationError", this.code = "ENTERPRISE_VIOLATION", this.meta = o, this.timestamp = Date.now(), Error.captureStackTrace && Error.captureStackTrace(this, v);
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      meta: this.meta,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}
function u() {
  return typeof window > "u" ? !0 : window.__DSHOW_ENTERPRISE_STRICT__ !== !1;
}
function ve(e) {
  typeof window < "u" && (window.__DSHOW_ENTERPRISE_STRICT__ = e === !0);
}
function _e(e, t, o = {}) {
  if (!e && u()) {
    const r = new v(t, {
      ...o,
      strictMode: !0,
      assertedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      if (typeof window < "u" && window.Core && window.Core.windowAdapter) {
        const a = window.Core.windowAdapter.get("Telemetry");
        a && a.track && a.track("enterprise:strict:violation", {
          message: t,
          meta: o,
          stack: r.stack
        });
      }
    } catch {
    }
    throw r;
  }
  if (!e && !u())
    try {
      console.warn(`[${$}] STRICT_WARN:`, t, o);
    } catch {
    }
  return e;
}
function tt(e, t, o) {
  return _e(
    e != null,
    `Port obrigatória "${t}" não disponível`,
    {
      type: "PORT_MISSING",
      portName: t,
      moduleId: o,
      portValue: e
    }
  );
}
function rt(e, t) {
  if (u())
    throw new v(
      `Acesso direto a window.${e} proibido em modo strict. Use _getPort() ou windowAdapter.get()`,
      {
        type: "WINDOW_FALLBACK_DENIED",
        globalName: e,
        moduleId: t
      }
    );
  try {
    console.warn(`[${$}] COMPAT_WARN: window.${e} usado por ${t}. Migre para Ports.`);
  } catch {
  }
}
function G(e, t = {}) {
  const o = te[e] || "UNKNOWN", r = t.module || t.moduleId || "unknown", a = {
    type: e,
    severity: o,
    details: t,
    moduleId: r,
    timestamp: Date.now(),
    strictMode: u()
  };
  if (typeof window < "u")
    for (window.__DSHOW_ENTERPRISE_VIOLATIONS__ = window.__DSHOW_ENTERPRISE_VIOLATIONS__ || [], window.__DSHOW_ENTERPRISE_VIOLATIONS__.push(a); window.__DSHOW_ENTERPRISE_VIOLATIONS__.length > 200; )
      window.__DSHOW_ENTERPRISE_VIOLATIONS__.shift();
  ft(e), Y.has(r) || Y.set(r, { count: 0, types: {}, lastViolation: null });
  const s = Y.get(r);
  return s.count++, s.types[e] = (s.types[e] || 0) + 1, s.lastViolation = a.timestamp, S.hasOwnProperty(o) ? S[o]++ : S.UNKNOWN++, vt(a), yt(o, r), a;
}
function vt(e) {
  const t = gt[e.severity] || I.VIOLATION_RECORDED;
  F(t, {
    type: e.type,
    severity: e.severity,
    moduleId: e.moduleId,
    details: e.details,
    timestamp: e.timestamp,
    strictMode: e.strictMode
  }), F(I.VIOLATION_RECORDED, e);
}
function yt(e, t) {
  le++;
  const o = Date.now();
  o - Le < Ct && le < bt || (Le = o, le = 0, Ut(e, t));
}
function Ut(e, t) {
  S.CRITICAL >= 5 && F(I.CRITICAL_THRESHOLD_EXCEEDED, {
    criticalCount: S.CRITICAL,
    timestamp: Date.now()
  });
  const o = Mt();
  o > 10 && F(I.VIOLATION_SPIKE, {
    rate: o,
    timestamp: Date.now()
  });
  const r = Y.get(t);
  r && r.count === 3 && F(I.MODULE_NON_COMPLIANT, {
    moduleId: t,
    violationCount: r.count,
    types: r.types,
    timestamp: Date.now()
  }), e === "UNKNOWN" && F(I.UNKNOWN_SEVERITY, {
    moduleId: t,
    unknownCount: S.UNKNOWN,
    timestamp: Date.now()
  });
}
function Mt() {
  const e = Date.now() - 3e5;
  let t = 0;
  for (let o = A.buckets.length - 1; o >= 0 && !(A.buckets[o].timestamp < e); o--)
    t += A.buckets[o].count;
  return t / 5;
}
function V() {
  return typeof window < "u" && window.__DSHOW_ENTERPRISE_VIOLATIONS__ ? [...window.__DSHOW_ENTERPRISE_VIOLATIONS__] : [];
}
function ye() {
  typeof window < "u" && (window.__DSHOW_ENTERPRISE_VIOLATIONS__ = []), Y.clear(), A.buckets = [], A.lastBucketTime = 0, S.CRITICAL = 0, S.HIGH = 0, S.MEDIUM = 0, S.LOW = 0, S.INFO = 0, S.UNKNOWN = 0, Le = 0, le = 0;
}
function P() {
  const e = V(), t = Date.now(), o = {
    total: e.length,
    byType: {},
    bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, UNKNOWN: 0 },
    byModule: {},
    recentCount: 0,
    last5Minutes: 0,
    last15Minutes: 0,
    last1Hour: 0
  };
  return e.forEach((r) => {
    var a;
    o.byType[r.type] = (o.byType[r.type] || 0) + 1;
    const s = r.severity || te[r.type] || "UNKNOWN";
    o.bySeverity[s] = (o.bySeverity[s] || 0) + 1;
    const n = r.moduleId || ((a = r.details) == null ? void 0 : a.module) || "unknown";
    o.byModule[n] = (o.byModule[n] || 0) + 1;
    const l = t - r.timestamp;
    l < 6e4 && o.recentCount++, l < 3e5 && o.last5Minutes++, l < 9e5 && o.last15Minutes++, l < 36e5 && o.last1Hour++;
  }), o;
}
function W() {
  const e = Date.now(), t = A.buckets, o = t.filter((_) => e - _.timestamp < 3e5), r = t.filter((_) => e - _.timestamp < 9e5), a = t.filter((_) => e - _.timestamp < 36e5), s = (_) => _.reduce((p, Q) => p + Q.count, 0), n = s(o), l = s(r), c = s(a);
  let O = "stable";
  if (r.length >= 4) {
    const _ = Math.floor(r.length / 2), p = s(r.slice(0, _)), Q = s(r.slice(_));
    Q > p * 1.5 ? O = "increasing" : Q < p * 0.5 && (O = "decreasing");
  }
  return {
    last5Minutes: n,
    last15Minutes: l,
    last1Hour: c,
    perMinute: n / 5,
    trend: O,
    isIncreasing: O === "increasing",
    bucketsCount: t.length
  };
}
function j(e = 10) {
  const t = [];
  return Y.forEach((o, r) => {
    t.push({
      moduleId: r,
      count: o.count,
      types: { ...o.types },
      lastViolation: o.lastViolation
    });
  }), t.sort((o, r) => r.count - o.count).slice(0, e);
}
function U() {
  const e = P(), t = W(), o = [];
  e.bySeverity.CRITICAL > 0 && o.push(`CRÍTICO: ${e.bySeverity.CRITICAL} violações de PORT_MISSING. Verifique injeção de dependências.`), t.perMinute > 5 && o.push(`ALERTA: Taxa alta de violações (${t.perMinute.toFixed(1)}/min). Investigue módulos problemáticos.`), t.isIncreasing && o.push("ATENÇÃO: Tendência crescente de violações. Possível degradação em andamento.");
  const r = j(3);
  r.length > 0 && r[0].count > 10 && o.push(`FOCO: Módulo "${r[0].moduleId}" lidera com ${r[0].count} violações.`);
  const s = ["WINDOW_EVENTBUS_FALLBACK", "WINDOW_GLOBALSTATE_FALLBACK", "WINDOW_LOGGER_FALLBACK"].reduce((n, l) => n + (e.byType[l] || 0), 0);
  if (s > 20 && o.push(`MIGRAÇÃO: ${s} fallbacks window.* em uso. Migre para Ports pattern.`), e.bySeverity.UNKNOWN > 0) {
    const n = Object.keys(e.byType).filter((l) => !te[l]);
    o.push(`REMAPEAMENTO: ${e.bySeverity.UNKNOWN} violações com severidade UNKNOWN. Tipos: ${n.join(", ")}. Adicione ao VIOLATION_SEVERITY.`);
  }
  return o.length === 0 && o.push("OK: Nenhuma recomendação. Sistema em conformidade."), o;
}
function Ue() {
  return {
    moduleId: $,
    version: ee,
    strictMode: u(),
    violationsCount: V().length,
    bootPhaseReady: be,
    emitBufferSize: J.length,
    timestamp: Date.now()
  };
}
function K() {
  const e = V(), t = P(), o = W(), r = {
    strictModeConfigured: typeof window < "u" && "__DSHOW_ENTERPRISE_STRICT__" in window,
    noCriticalViolations: t.bySeverity.CRITICAL === 0,
    noHighViolations: t.bySeverity.HIGH === 0,
    noUnknownSeverity: t.bySeverity.UNKNOWN === 0,
    lowViolationRate: o.perMinute < 2,
    noRecentViolations: t.recentCount === 0,
    violationsUnderLimit: e.length < 100,
    stableTrend: !o.isIncreasing
  }, a = {
    strictModeConfigured: 10,
    noCriticalViolations: 30,
    noHighViolations: 20,
    noUnknownSeverity: 10,
    lowViolationRate: 15,
    noRecentViolations: 10,
    violationsUnderLimit: 10,
    stableTrend: 5
  };
  let s = 0, n = 0;
  for (const [O, _] of Object.entries(a))
    n += _, r[O] && (s += _);
  const l = Math.round(s / n * 100);
  let c = "HEALTHY";
  return r.noCriticalViolations ? l < 50 ? c = "UNHEALTHY" : l < 80 && (c = "DEGRADED") : c = "CRITICAL", {
    status: c,
    score: `${s}/${n}`,
    scorePercentage: l,
    checks: r,
    strictMode: u(),
    summary: {
      total: t.total,
      bySeverity: t.bySeverity,
      recentCount: t.recentCount
    },
    rate: {
      perMinute: o.perMinute,
      trend: o.trend
    },
    topOffenders: j(3).map((O) => ({ moduleId: O.moduleId, count: O.count })),
    recommendations: U().slice(0, 3),
    moduleId: $,
    version: ee,
    timestamp: Date.now()
  };
}
function ot() {
  typeof window > "u" || (window.__dev = window.__dev || {}, window.__dev.strictMode = {
    // Core
    getVersion: () => ee,
    isStrict: u,
    setStrict: ve,
    // Violations
    getViolations: V,
    clearViolations: ye,
    getRecentViolations: (e = 10) => V().slice(-e),
    // Analytics
    getViolationsSummary: P,
    getViolationRate: W,
    getTopViolatingModules: j,
    getRecommendations: U,
    // Observability
    healthCheck: K,
    info: Ue,
    // Dashboard
    getDashboard: () => {
      const e = K(), t = P(), o = W(), r = j(5);
      return console.group("📊 Enterprise Strict Mode Dashboard"), console.log(`%cStatus: ${e.status}`, `color: ${e.status === "HEALTHY" ? "green" : e.status === "DEGRADED" ? "orange" : "red"}; font-weight: bold`), console.log(`Score: ${e.scorePercentage}%`), console.log(`Strict Mode: ${u() ? "ACTIVE" : "INACTIVE"}`), console.log(""), console.log("📈 Violações:", t.total), console.table(t.bySeverity), console.log(""), console.log("⏱️ Taxa:", o.perMinute.toFixed(2), "/min", `(${o.trend})`), console.log(""), r.length > 0 && (console.log("🎯 Top Offenders:"), console.table(r.map((a) => ({ Módulo: a.moduleId, Violações: a.count })))), console.log(""), console.log("💡 Recomendações:"), U().forEach((a) => console.log("  •", a)), console.groupEnd(), { status: e.status, scorePercentage: e.scorePercentage, strictMode: u(), violations: t, rate: o, topModules: r, recommendations: U() };
    },
    // Compliance Report
    getComplianceReport: () => {
      const e = P(), t = Object.keys(e.byModule).length;
      return {
        compliant: e.bySeverity.CRITICAL === 0 && e.bySeverity.HIGH === 0,
        strictModeActive: u(),
        totalViolations: e.total,
        criticalCount: e.bySeverity.CRITICAL,
        highCount: e.bySeverity.HIGH,
        modulesAffected: t,
        fallbackUsage: (e.byType.WINDOW_FALLBACK || 0) + (e.byType.WINDOW_EVENTBUS_FALLBACK || 0) + (e.byType.WINDOW_GLOBALSTATE_FALLBACK || 0) + (e.byType.WINDOW_LOGGER_FALLBACK || 0),
        recommendations: U(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  });
}
const Pt = {
  VERSION: ee,
  MODULE_ID: $,
  VIOLATION_SEVERITY: te,
  EnterpriseViolationError: v,
  isStrict: u,
  setStrict: ve,
  assertStrict: _e,
  requirePort: tt,
  denyWindowFallback: rt,
  recordViolation: G,
  getViolations: V,
  clearViolations: ye,
  getViolationsSummary: P,
  getViolationRate: W,
  getTopViolatingModules: j,
  getRecommendations: U,
  setEventBusGetter: Je,
  setBootReady: et,
  exposeDevTools: ot,
  info: Ue,
  healthCheck: K
}, Ht = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EnterpriseViolationError: v,
  MODULE_ID: $,
  VERSION: ee,
  VIOLATION_SEVERITY: te,
  assertStrict: _e,
  clearViolations: ye,
  default: Pt,
  denyWindowFallback: rt,
  exposeDevTools: ot,
  getRecommendations: U,
  getTopViolatingModules: j,
  getViolationRate: W,
  getViolations: V,
  getViolationsSummary: P,
  healthCheck: K,
  info: Ue,
  isStrict: u,
  recordViolation: G,
  requirePort: tt,
  setBootReady: et,
  setEventBusGetter: Je,
  setStrict: ve
}, Symbol.toStringTag, { value: "Module" })), Gt = "core.runtime.ports-factory", ze = "1.6.0-REQUIRED-PORTS", re = (e = {}) => {
  const t = e.moduleId || "unknown-module", o = e.spec || {}, r = e.defaults || {}, a = e.allowWindowFallback === !0, s = Array.isArray(e.required) ? e.required : [], n = {
    _initialized: !1,
    _ports: {},
    _initTimestamp: null,
    _injectCount: 0,
    _resolveCount: 0,
    _missingRequired: []
  };
  for (const E of Object.keys(r))
    n._ports[E] = r[E];
  const l = () => typeof window < "u" && !!window, c = (E) => {
    if (!l()) return null;
    const d = o[E];
    if (!d) return null;
    if (typeof d == "string") return window[d] || null;
    if (typeof d == "function")
      try {
        return d(window) || null;
      } catch {
        return null;
      }
    return null;
  }, O = () => {
    if (n._initialized) return !0;
    const E = {};
    for (const d of Object.keys(n._ports))
      E[d] = n._ports[d];
    for (const d of Object.keys(o))
      E[d] == null && (E[d] = c(d), E[d] != null && n._resolveCount++);
    if (n._ports = E, n._initialized = !0, n._initTimestamp = Date.now(), s.length > 0 && (n._missingRequired = s.filter((d) => E[d] == null), n._missingRequired.length > 0 && u()))
      for (const d of n._missingRequired)
        G("PORT_MISSING", {
          moduleId: t,
          portName: d,
          phase: "init",
          source: "ports-factory.init()"
        });
    return !0;
  }, _ = (E) => {
    if (E && typeof E == "object")
      for (const d of Object.keys(E))
        E[d] !== void 0 && (n._ports[d] = E[d], n._injectCount++);
    return n._initialized = !0, n._initTimestamp || (n._initTimestamp = Date.now()), !0;
  }, p = (E, d = {}) => {
    n._initialized || O();
    let R = n._ports[E] != null ? n._ports[E] : null;
    const ie = a && !u();
    return R == null && ie && (R = c(E), R != null && (n._ports[E] = R, n._resolveCount++, G("WINDOW_FALLBACK_USED", {
      moduleId: t,
      portName: E,
      source: "ports-factory.get()"
    }))), R == null && d.required === !0 && _e(
      !1,
      `Port obrigatória "${E}" não disponível para módulo "${t}"`,
      { type: "PORT_REQUIRED_MISSING", portName: E, moduleId: t }
    ), R;
  };
  return { init: O, inject: _, get: p, getStrict: (E) => {
    const d = p(E);
    if (d == null && u())
      throw new v(
        `Port "${E}" é obrigatória mas não está disponível`,
        { type: "PORT_STRICT_MISSING", portName: E, moduleId: t }
      );
    return d;
  }, has: (E) => !!p(E), validateRequired: () => {
    n._initialized || O();
    const E = s.filter((R) => n._ports[R] == null), d = s.filter((R) => n._ports[R] != null);
    if (E.length > 0 && u())
      throw new v(
        `Ports obrigatórias faltando para "${t}": [${E.join(", ")}]`,
        { type: "PORT_REQUIRED_MISSING", moduleId: t, missing: E, resolved: d, total: s.length }
      );
    return { valid: E.length === 0, missing: E, resolved: d };
  }, snapshot: () => {
    n._initialized || O();
    const E = { _initialized: n._initialized, _moduleId: t };
    for (const d of Object.keys(n._ports))
      E[d] = n._ports[d];
    return E;
  }, isInitialized: () => n._initialized, reset: () => {
    n._ports = {};
    for (const E of Object.keys(r))
      n._ports[E] = r[E];
    return n._initialized = !1, n._initTimestamp = null, n._injectCount = 0, n._resolveCount = 0, n._missingRequired = [], !0;
  }, info: () => {
    const E = Object.keys(o), d = E.filter((R) => n._ports[R] != null);
    return { moduleId: t, factoryVersion: ze, factoryModuleId: Gt, initialized: n._initialized, initTimestamp: n._initTimestamp, specPorts: E, resolvedPorts: d, resolvedCount: d.length, totalPorts: E.length, requiredPorts: [...s], missingRequired: [...n._missingRequired], injectCount: n._injectCount, resolveCount: n._resolveCount, allowWindowFallback: a, strictMode: u(), p24Instrumented: !0, timestamp: Date.now() };
  }, healthCheck: () => {
    const E = Object.keys(o), d = E.filter((me) => n._ports[me] != null), R = E.length > 0 ? d.length / E.length : 1, ie = u(), qe = s.filter((me) => n._ports[me] != null), Fe = s.length === 0 || qe.length === s.length, Se = {
      initialized: n._initialized,
      hasSpec: E.length > 0,
      portsResolved: R >= 0.5,
      requiredPortsMet: Fe,
      noErrors: !0,
      strictModeCompliant: !ie || R >= 0.8 && Fe
    }, Ee = Object.values(Se).filter(Boolean).length, pe = Object.keys(Se).length;
    return { status: Ee === pe ? "HEALTHY" : Ee >= 3 ? "DEGRADED" : "UNHEALTHY", score: Ee, maxScore: pe, scoreDisplay: `${Ee}/${pe}`, checks: Se, moduleId: t, factoryVersion: ze, resolvedPorts: d.length, totalPorts: E.length, requiredPorts: s.length, requiredResolved: qe.length, missingRequired: n._missingRequired, strictMode: ie, p24Instrumented: !0, timestamp: Date.now() };
  }, moduleId: t };
}, Re = (e) => e.EventBusGlobal || e.EventBus || null, oe = (e) => e.Telemetry || e.TelemetryCore || e.TelemetryKernel || null, ae = (e) => e.Logger || e.LoggerGlobal || null, Vt = (e) => e.Orchestrator || e.UIOrchestrator || null, wt = (e) => e.MetricsPollingManager || e.MetricsManager || null, Me = (e) => {
  var t;
  if ((t = e.AppContext) != null && t.auth) return e.AppContext.auth;
  if (e.AuthManager) return e.AuthManager;
  if (e.AuthAdapter) return e.AuthAdapter;
  const o = e.GlobalState;
  if (!o) return null;
  const r = () => {
    var a;
    const s = (a = o.getState) == null ? void 0 : a.call(o);
    return s == null ? void 0 : s.session;
  };
  return {
    isAuthenticated: () => {
      const a = r();
      return (a == null ? void 0 : a.isAuthenticated) === !0;
    },
    getUser: () => {
      var a;
      return ((a = r()) == null ? void 0 : a.user) || null;
    },
    getUserId: () => {
      var a;
      return ((a = r()) == null ? void 0 : a.userId) || null;
    },
    getToken: () => {
      var a;
      return ((a = r()) == null ? void 0 : a.token) || null;
    },
    getRoles: () => {
      const a = r(), s = a == null ? void 0 : a.user;
      return (s == null ? void 0 : s.roles) || (a == null ? void 0 : a.roles) || [];
    },
    getPermissions: () => {
      const a = r(), s = a == null ? void 0 : a.user;
      return (s == null ? void 0 : s.permissions) || (a == null ? void 0 : a.permissions) || [];
    },
    getCapabilities: () => {
      var a;
      const s = r();
      return ((a = s == null ? void 0 : s.user) == null ? void 0 : a.capabilities) || [];
    },
    hasRole(a) {
      return this.getRoles().indexOf(a) !== -1;
    },
    hasPermission(a) {
      return this.getPermissions().indexOf(a) !== -1;
    },
    hasCapability(a) {
      return this.getCapabilities().indexOf(a) !== -1;
    },
    getLevel: () => {
      var a, s;
      return ((s = (a = r()) == null ? void 0 : a.user) == null ? void 0 : s.level) || 0;
    },
    _source: "GlobalState-adapter"
  };
}, Ta = (e = {}) => {
  const t = e.moduleId || "unknown-module", o = e.allowWindowFallback === !0, r = re({
    moduleId: t,
    spec: { config: "APP_CONFIG", logger: (a) => ae(a), telemetry: (a) => oe(a) },
    defaults: { config: null, logger: null, telemetry: null },
    required: ["config", "logger"],
    allowWindowFallback: o
  });
  return r.getLogger = () => r.get("logger"), r.getConfig = () => r.get("config"), r.getTelemetry = () => r.get("telemetry"), r.profileType = "base", r;
}, Oa = (e = {}) => {
  const t = e.moduleId || "unknown-ui-module", o = e.allowWindowFallback === !0, r = re({
    moduleId: t,
    spec: {
      config: "APP_CONFIG",
      eventBus: (a) => Re(a),
      globalState: "GlobalState",
      router: "RouterGlobal",
      appShell: "AppShell",
      layoutManager: "LayoutManager",
      orchestrator: (a) => Vt(a),
      logger: (a) => ae(a),
      telemetry: (a) => oe(a),
      auth: (a) => Me(a),
      metricsManager: (a) => wt(a)
    },
    defaults: { config: null, eventBus: null, globalState: null, router: null, appShell: null, layoutManager: null, orchestrator: null, logger: null, telemetry: null, auth: null, metricsManager: null },
    required: ["config", "eventBus", "logger"],
    allowWindowFallback: o
  });
  return r.getEventBus = () => r.get("eventBus"), r.getGlobalState = () => r.get("globalState"), r.getRouter = () => r.get("router"), r.getAppShell = () => r.get("appShell"), r.getLayoutManager = () => r.get("layoutManager"), r.getOrchestrator = () => r.get("orchestrator"), r.getLogger = () => r.get("logger"), r.getTelemetry = () => r.get("telemetry"), r.getConfig = () => r.get("config"), r.getAuth = () => r.get("auth"), r.getMetricsManager = () => r.get("metricsManager"), r.profileType = "ui", r;
}, ne = (e = {}) => {
  const t = e.moduleId || "unknown-core-module", o = e.allowWindowFallback === !0, r = re({
    moduleId: t,
    spec: {
      config: "APP_CONFIG",
      eventBus: (a) => Re(a),
      navigation: (a) => a.NavigationBroker || a.NavigationPort || null,
      runtime: (a) => a.Runtime || a.BootOrchestrator || null,
      environment: (a) => a.Environment || a.__ENV_MANAGER__ || null,
      readyFlags: "ReadyFlags",
      logger: (a) => ae(a),
      telemetry: (a) => oe(a),
      auth: (a) => Me(a)
    },
    defaults: { config: null, eventBus: null, navigation: null, runtime: null, environment: null, readyFlags: null, logger: null, telemetry: null, auth: null },
    required: ["config", "eventBus", "logger"],
    allowWindowFallback: o
  });
  return r.getEventBus = () => r.get("eventBus"), r.getNavigation = () => r.get("navigation"), r.getRuntime = () => r.get("runtime"), r.getEnvironment = () => r.get("environment"), r.getReadyFlags = () => r.get("readyFlags"), r.getLogger = () => r.get("logger"), r.getTelemetry = () => r.get("telemetry"), r.getConfig = () => r.get("config"), r.getAuth = () => r.get("auth"), r.profileType = "core", r;
}, _a = (e = {}) => {
  const t = e.moduleId || "unknown-panel-module", o = e.allowWindowFallback === !0, r = re({
    moduleId: t,
    spec: {
      config: "APP_CONFIG",
      eventBus: (a) => Re(a),
      globalState: "GlobalState",
      router: "RouterGlobal",
      permissions: (a) => a.PermissionsGuard || a.Permissions || null,
      auth: (a) => Me(a),
      api: (a) => a.API || a.ApiClient || null,
      logger: (a) => ae(a),
      telemetry: (a) => oe(a)
    },
    defaults: { config: null, eventBus: null, globalState: null, router: null, permissions: null, auth: null, api: null, logger: null, telemetry: null },
    required: ["config", "eventBus", "logger"],
    allowWindowFallback: o
  });
  return r.getEventBus = () => r.get("eventBus"), r.getGlobalState = () => r.get("globalState"), r.getRouter = () => r.get("router"), r.getPermissions = () => r.get("permissions"), r.getAuth = () => r.get("auth"), r.getApi = () => r.get("api"), r.getLogger = () => r.get("logger"), r.getTelemetry = () => r.get("telemetry"), r.getConfig = () => r.get("config"), r.profileType = "panel", r;
}, Ra = (e = {}) => {
  const t = ne(e);
  return t.profileType = "state", t;
}, Aa = (e = {}) => {
  const t = e.moduleId || "unknown-telemetry-module", o = e.allowWindowFallback === !0, r = re({
    moduleId: t,
    spec: { logger: (a) => ae(a), telemetry: (a) => oe(a), eventBus: (a) => Re(a) },
    defaults: { logger: null, telemetry: null, eventBus: null },
    required: ["logger"],
    allowWindowFallback: o
  });
  return r.getLogger = () => r.get("logger"), r.getTelemetry = () => r.get("telemetry"), r.getEventBus = () => r.get("eventBus"), r.profileType = "telemetry", r;
}, Pe = "1.2.0-STRICT-MODE", at = "core.runtime.early-boot-logger";
let h = [], f = !1, w = !1, b = null;
const Z = {}, kt = 200, Bt = 3e4;
let z = null;
const C = {
  buffered: 0,
  // Total de logs buffered
  replayed: 0,
  // Total de logs replayed para Logger Enterprise
  proxied: 0,
  // Total de logs enviados direto via proxy
  fallbackConsole: 0,
  // Total de logs que foram para console como fallback
  drainedOnTimeout: 0
  // Logs drenados por safety timeout
};
function nt() {
  return b || (typeof window < "u" && window.Logger && typeof window.Logger.info == "function" ? (b = window.Logger, w = !0, Ft(), b) : null);
}
function qt(e, t, o, r) {
  h.length >= kt && (h.shift(), C.fallbackConsole++), h.push({
    timestamp: Date.now(),
    level: e,
    component: t,
    message: o,
    context: r || {},
    phase: "early-boot"
  }), C.buffered++;
}
function Ft() {
  if (f || !b || typeof b.info != "function") return;
  f = !0, z && (clearTimeout(z), z = null);
  const e = h.slice();
  h = [];
  for (let t = 0; t < e.length; t++) {
    const o = e[t], r = b[o.level];
    typeof r == "function" && (r.call(b, o.message, {
      component: o.component,
      earlyBoot: !0,
      originalTimestamp: o.timestamp,
      phase: o.phase
    }), C.replayed++);
  }
}
function st(e, t, o, r) {
  const s = `[${(/* @__PURE__ */ new Date()).toISOString()}] [EARLY-BOOT] [${t}]`, n = console[e] || console.log;
  r && Object.keys(r).length > 0 ? n.call(console, s, o, r) : n.call(console, s, o), C.fallbackConsole++;
}
function Yt() {
  z || typeof setTimeout > "u" || (z = setTimeout(() => {
    if (f || w) return;
    const e = h.slice();
    h = [];
    for (let t = 0; t < e.length; t++) {
      const o = e[t];
      st(o.level, o.component, `[DRAIN] ${o.message}`, o.context), C.drainedOnTimeout++;
    }
  }, Bt));
}
function Ia(e) {
  if (Z[e]) return Z[e];
  function t(r, a, s) {
    const n = nt();
    if (n) {
      const l = n[r];
      if (typeof l == "function") {
        l.call(n, a, Object.assign({ component: e }, s || {})), C.proxied++;
        return;
      }
    }
    qt(r, e, a, s), st(r, e, a, s), !z && !f && Yt();
  }
  const o = {
    trace(r, a) {
      t("trace", r, a);
    },
    debug(r, a) {
      t("debug", r, a);
    },
    info(r, a) {
      t("info", r, a);
    },
    warn(r, a) {
      t("warn", r, a);
    },
    error(r, a) {
      t("error", r, a);
    },
    critical(r, a) {
      t("critical", r, a);
    },
    log(r, a, s) {
      t(r, a, s);
    }
  };
  return Z[e] = o, o;
}
function He() {
  return Object.assign({}, C, {
    bufferSize: h.length,
    loggerReady: w,
    replayed: f,
    loggersCreated: Object.keys(Z).length,
    loggerNames: Object.keys(Z)
  });
}
function zt() {
  return w;
}
function Wt() {
  return f;
}
function jt() {
  return f ? { ok: !0, reason: "already-replayed" } : nt() ? { ok: !0, replayed: C.replayed } : { ok: !1, reason: "logger-not-available" };
}
function Ge() {
  let e = "HEALTHY";
  return !w && h.length > 100 && (e = "WARNING"), C.drainedOnTimeout > 0 && (e = "DEGRADED"), {
    status: e,
    version: Pe,
    moduleId: at,
    strictMode: u(),
    loggerReady: w,
    replayed: f,
    stats: He(),
    timestamp: Date.now()
  };
}
function Kt() {
  return {
    moduleId: at,
    version: Pe,
    strictMode: u(),
    description: "Early boot log adapter - buffers logs until Logger Enterprise is ready, then replays",
    loggerReady: w,
    replayed: f,
    stats: He(),
    healthCheck: Ge()
  };
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.earlyBootLogger = {
  getStats: He,
  isLoggerReady: zt,
  isReplayed: Wt,
  forceReplay: jt,
  healthCheck: Ge,
  info: Kt,
  VERSION: Pe
});
const Ae = "1.8.0-STRICT-MODE", m = "core.runtime.boot-ready-dom-bridge", se = ne({ moduleId: m }), it = (e) => se.get(e), xt = (e) => se.inject(e), $t = () => se.snapshot(), i = {
  initialized: !1,
  authReady: !1,
  appShellReady: !1,
  componentsReady: !1,
  bootstrapV2Complete: !1,
  bootstrapV2Error: !1,
  callbacks: { auth: [], appshell: [], components: [], bootstrapComplete: [], bootstrapError: [] },
  cleanups: [],
  domEmissions: { authReady: !1, appShellReady: !1, componentsReady: !1, bootstrapV2Complete: !1, bootstrapV2Error: !1 }
}, T = (e, t, o = {}) => {
  const r = `[${m}]`, a = it("logger");
  a != null && a[e] && a[e](r, t, o);
}, L = (e) => {
  const t = i.callbacks[e] || [];
  for (const o of t)
    try {
      o();
    } catch (r) {
      T("error", `Callback error for ${e}`, { error: r.message });
    }
  i.callbacks[e] = [];
}, Qt = (e) => {
  if (i.domEmissions.authReady) return !1;
  try {
    const t = { timestamp: Date.now(), source: m, ...e };
    return document.dispatchEvent(new CustomEvent("auth:ready", { detail: t })), i.domEmissions.authReady = !0, T("debug", "auth:ready DOM emitted (bridge official)"), !0;
  } catch (t) {
    return T("error", "Failed to emit auth:ready DOM", { error: t.message }), !1;
  }
}, We = (e) => {
  if (i.domEmissions.appShellReady) return !1;
  try {
    const t = { timestamp: Date.now(), status: "ready", source: m, ...e };
    return document.dispatchEvent(new CustomEvent("appshell:ready", { detail: t })), i.domEmissions.appShellReady = !0, T("debug", "appshell:ready DOM emitted (bridge official)"), !0;
  } catch (t) {
    return T("error", "Failed to emit appshell:ready DOM", { error: t.message }), !1;
  }
}, Zt = (e) => {
  if (i.domEmissions.componentsReady) return !1;
  try {
    const t = { timestamp: Date.now(), source: m, ...e };
    return document.dispatchEvent(new CustomEvent("components:ready", { detail: t })), i.domEmissions.componentsReady = !0, T("debug", "components:ready DOM emitted (bridge official)"), !0;
  } catch (t) {
    return T("error", "Failed to emit components:ready DOM", { error: t.message }), !1;
  }
}, Xt = (e) => {
  if (i.domEmissions.bootstrapV2Complete) return !1;
  try {
    const t = { timestamp: Date.now(), source: m, ...e };
    return document.dispatchEvent(new CustomEvent("bootstrap-v2:complete", { detail: t })), i.domEmissions.bootstrapV2Complete = !0, T("debug", "bootstrap-v2:complete DOM emitted (bridge official P18B)"), !0;
  } catch (t) {
    return T("error", "Failed to emit bootstrap-v2:complete DOM", { error: t.message }), !1;
  }
}, Jt = (e) => {
  if (i.domEmissions.bootstrapV2Error) return !1;
  try {
    const t = { timestamp: Date.now(), source: m, ...e };
    return document.dispatchEvent(new CustomEvent("bootstrap-v2:error", { detail: t })), i.domEmissions.bootstrapV2Error = !0, T("debug", "bootstrap-v2:error DOM emitted (bridge official P18B)"), !0;
  } catch (t) {
    return T("error", "Failed to emit bootstrap-v2:error DOM", { error: t.message }), !1;
  }
}, je = () => {
  i.authReady || (i.authReady = !0, T("debug", "auth:ready DOM received"), L("auth"));
}, Ke = () => {
  i.appShellReady || (i.appShellReady = !0, T("debug", "appshell:ready DOM received"), L("appshell"));
}, xe = (e) => {
  i.componentsReady || (i.componentsReady = !0, T("debug", "components:ready DOM received", { detail: e == null ? void 0 : e.detail }), L("components"));
}, er = () => {
  document.addEventListener("auth:ready", je), i.cleanups.push(() => {
    document.removeEventListener("auth:ready", je);
  }), document.addEventListener("appshell:ready", Ke), i.cleanups.push(() => {
    document.removeEventListener("appshell:ready", Ke);
  }), document.addEventListener("components:ready", xe), i.cleanups.push(() => {
    document.removeEventListener("components:ready", xe);
  }), T("debug", "DOM listeners registered (bridge official)");
}, B = (e, t, o) => {
  if (!t || typeof t != "string")
    return T("warn", "Skipping EventBus.on - invalid eventName", { eventName: t }), null;
  try {
    return e.on(t, o);
  } catch (r) {
    return T("warn", "EventBus.on failed", { eventName: t, error: r.message }), null;
  }
}, tr = () => {
  let e = null;
  if (typeof window < "u" && (e = it("eventBus"), !e && window.EventBus && (u() ? T("warn", "window.EventBus blocked in strict mode - relying on DOM only") : (G("WINDOW_EVENTBUS_FALLBACK", { module: m, context: "setupEventBusListeners" }), e = window.EventBus))), !(e != null && e.on)) {
    T("debug", "EventBus not available - relying on DOM only");
    return;
  }
  const t = g == null ? void 0 : g.AUTH_READY, o = g == null ? void 0 : g.APPSHELL_READY, r = Ye == null ? void 0 : Ye.READY, a = g == null ? void 0 : g.COMPONENTS_READY, s = g == null ? void 0 : g.BOOTSTRAP_V2_COMPLETE, n = g == null ? void 0 : g.BOOTSTRAP_V2_ERROR;
  if (t) {
    const l = B(e, t, (c) => {
      i.authReady || (i.authReady = !0, T("debug", "BOOT_EVENTS.AUTH_READY received via EventBus"), L("auth"), Qt(c));
    });
    typeof l == "function" && i.cleanups.push(l);
  }
  if (o) {
    const l = B(e, o, (c) => {
      i.appShellReady || (i.appShellReady = !0, T("debug", "BOOT_EVENTS.APPSHELL_READY received via EventBus"), L("appshell"), We(c));
    });
    typeof l == "function" && i.cleanups.push(l);
  }
  if (r) {
    const l = B(e, r, (c) => {
      i.appShellReady || (i.appShellReady = !0, T("debug", "SHELL_EVENTS.READY received via EventBus (P20)"), L("appshell"), We(c));
    });
    typeof l == "function" && i.cleanups.push(l);
  }
  if (a) {
    const l = B(e, a, (c) => {
      i.componentsReady || (i.componentsReady = !0, T("debug", "BOOT_EVENTS.COMPONENTS_READY received via EventBus"), L("components"), Zt(c));
    });
    typeof l == "function" && i.cleanups.push(l);
  }
  if (s) {
    const l = B(e, s, (c) => {
      i.bootstrapV2Complete || (i.bootstrapV2Complete = !0, T("debug", "BOOT_EVENTS.BOOTSTRAP_V2_COMPLETE received via EventBus (P18B)"), L("bootstrapComplete"), Xt(c));
    });
    typeof l == "function" && i.cleanups.push(l);
  }
  if (n) {
    const l = B(e, n, (c) => {
      i.bootstrapV2Error || (i.bootstrapV2Error = !0, T("debug", "BOOT_EVENTS.BOOTSTRAP_V2_ERROR received via EventBus (P18B)"), L("bootstrapError"), Jt(c));
    });
    typeof l == "function" && i.cleanups.push(l);
  }
  T("debug", "EventBus listeners registered (P18/P20 compliant)", { authReadyEvent: !!t, appShellReadyEvent: !!o, shellReadyEvent: !!r, componentsReadyEvent: !!a, bootstrapV2CompleteEvent: !!s, bootstrapV2ErrorEvent: !!n });
}, rr = (e = 1e4) => {
  var t, o, r;
  if (i.authReady) return Promise.resolve(!0);
  const a = typeof window < "u" && window.ReadyFlags;
  return (t = a == null ? void 0 : a.isReady) != null && t.call(a, "auth") || typeof document < "u" && ((r = (o = document.body) == null ? void 0 : o.dataset) == null ? void 0 : r.authReady) === "true" ? (i.authReady = !0, Promise.resolve(!0)) : new Promise((s) => {
    let n = !1;
    const l = setTimeout(() => {
      n || (n = !0, s(!0));
    }, e);
    i.callbacks.auth.push(() => {
      n || (n = !0, clearTimeout(l), s(!0));
    });
  });
}, or = (e = 1e4) => {
  var t, o, r, a;
  if (i.appShellReady) return Promise.resolve(!0);
  const s = typeof window < "u" && window.ReadyFlags;
  if ((t = s == null ? void 0 : s.isReady) != null && t.call(s, "appshell"))
    return i.appShellReady = !0, Promise.resolve(!0);
  const n = typeof window < "u" && window.AppShell;
  return (o = n == null ? void 0 : n.isReady) != null && o.call(n) || typeof document < "u" && ((a = (r = document.body) == null ? void 0 : r.dataset) == null ? void 0 : a.appReady) === "true" || typeof window < "u" && window.AppShellReady === !0 ? (i.appShellReady = !0, Promise.resolve(!0)) : new Promise((l) => {
    let c = !1;
    const O = setTimeout(() => {
      c || (c = !0, l(!0));
    }, e);
    i.callbacks.appshell.push(() => {
      c || (c = !0, clearTimeout(O), l(!0));
    });
  });
}, ar = (e = 1e4) => i.componentsReady ? Promise.resolve(!0) : new Promise((t) => {
  let o = !1;
  const r = setTimeout(() => {
    o || (o = !0, t(!0));
  }, e);
  i.callbacks.components.push(() => {
    o || (o = !0, clearTimeout(r), t(!0));
  });
}), nr = (e = 15e3) => i.bootstrapV2Complete ? Promise.resolve(!0) : new Promise((t) => {
  let o = !1;
  const r = setTimeout(() => {
    o || (o = !0, t(!1));
  }, e);
  i.callbacks.bootstrapComplete.push(() => {
    o || (o = !0, clearTimeout(r), t(!0));
  });
}), sr = () => i.authReady, ir = () => i.appShellReady, Er = () => i.componentsReady, lr = () => i.bootstrapV2Complete, dr = () => i.bootstrapV2Error, he = () => i.initialized ? { ok: !0, alreadyInitialized: !0 } : (T("info", "Initializing boot-ready-dom-bridge...", { version: Ae }), er(), tr(), i.initialized = !0, T("info", "Bridge initialized (P18EC compliant)"), { ok: !0 }), cr = () => {
  for (const e of i.cleanups)
    try {
      e();
    } catch {
    }
  i.cleanups = [], i.initialized = !1, i.authReady = !1, i.appShellReady = !1, i.componentsReady = !1, i.bootstrapV2Complete = !1, i.bootstrapV2Error = !1, i.callbacks = { auth: [], appshell: [], components: [], bootstrapComplete: [], bootstrapError: [] }, i.domEmissions = { authReady: !1, appShellReady: !1, componentsReady: !1, bootstrapV2Complete: !1, bootstrapV2Error: !1 };
}, ur = () => {
  const e = { ...i.domEmissions };
  return { status: i.initialized ? "HEALTHY" : "NOT_INITIALIZED", version: Ae, moduleId: m, strictMode: u(), portsInitialized: se.isInitialized(), p18Compliant: !0, p18ECReviewed: !0, p20Compliant: !0, p24Instrumented: !0, authReady: i.authReady, appShellReady: i.appShellReady, componentsReady: i.componentsReady, bootstrapV2Complete: i.bootstrapV2Complete, bootstrapV2Error: i.bootstrapV2Error, domEmissions: e, pendingCallbacks: { auth: i.callbacks.auth.length, appshell: i.callbacks.appshell.length, components: i.callbacks.components.length, bootstrapComplete: i.callbacks.bootstrapComplete.length, bootstrapError: i.callbacks.bootstrapError.length }, timestamp: Date.now() };
}, Tr = () => {
  const e = { ...i.domEmissions };
  return { moduleId: m, version: Ae, strictMode: u(), portsInitialized: se.isInitialized(), purpose: "Centralizar addEventListener/dispatchEvent de boot events para P18/P20 compliance", p18Compliant: !0, p18ECReviewed: !0, p20Compliant: !0, p24Instrumented: !0, eventsHandled: ["auth:ready", "appshell:ready", "components:ready", "bootstrap-v2:complete", "bootstrap-v2:error"], eventBusListeners: ["BOOT_EVENTS.AUTH_READY", "BOOT_EVENTS.APPSHELL_READY", "SHELL_EVENTS.READY", "BOOT_EVENTS.COMPONENTS_READY", "BOOT_EVENTS.BOOTSTRAP_V2_COMPLETE", "BOOT_EVENTS.BOOTSTRAP_V2_ERROR"], state: { initialized: i.initialized, authReady: i.authReady, appShellReady: i.appShellReady, componentsReady: i.componentsReady, bootstrapV2Complete: i.bootstrapV2Complete, bootstrapV2Error: i.bootstrapV2Error }, domEmissions: e };
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", he) : Promise.resolve().then(he));
typeof window < "u" && (window.BootReadyBridge = { VERSION: Ae, MODULE_ID: m, init: he, destroy: cr, waitForAuth: rr, waitForAppShell: or, waitForComponentsReady: ar, waitForBootstrapComplete: nr, isAuthReady: sr, isAppShellReady: ir, isComponentsReady: Er, isBootstrapV2Complete: lr, isBootstrapV2Error: dr, healthCheck: ur, info: Tr, injectPorts: xt, getPorts: $t });
const Et = "2.0.0", lt = Object.freeze({
  MIN_SUPPORTED: "1.0.0",
  CURRENT: "2.0.0"
}), $e = ["INITIALIZING", "NORMAL", "DEGRADED", "MAINTENANCE", "FAILED", "RECOVERY"], Or = ["initializing", "booting", "ready", "error", "shutdown"];
function Da() {
  return {
    mode: "INITIALIZING",
    phase: "initializing",
    authenticated: !1,
    authLevel: 0,
    healthy: !0,
    healthScore: 100,
    ready: !1,
    maintenance: !1,
    failed: !1,
    capabilities: {}
  };
}
function _r(e) {
  if (!e || typeof e != "object") return !1;
  const t = ["mode", "authenticated"];
  for (let o = 0; o < t.length; o++)
    if (e[t[o]] === void 0) return !1;
  return !0;
}
function Rr(e) {
  const t = [], o = [];
  return !e || typeof e != "object" ? (t.push("snapshot e null ou nao e um objeto"), { valid: !1, errors: t, warnings: o }) : (e.mode === void 0 ? t.push("campo mode ausente") : $e.indexOf(e.mode) === -1 && t.push(`mode invalido: ${e.mode} (esperado: ${$e.join(", ")})`), e.authenticated === void 0 ? t.push("campo authenticated ausente") : typeof e.authenticated != "boolean" && o.push(`authenticated deveria ser boolean, recebido: ${typeof e.authenticated}`), e.phase !== void 0 && Or.indexOf(e.phase) === -1 && o.push(`phase desconhecido: ${e.phase}`), e.authLevel !== void 0 && (typeof e.authLevel != "number" || e.authLevel < 0 || e.authLevel > 3) && o.push(`authLevel fora do range 0-3: ${e.authLevel}`), e.healthScore !== void 0 && (typeof e.healthScore != "number" || e.healthScore < 0 || e.healthScore > 100) && o.push(`healthScore fora do range 0-100: ${e.healthScore}`), {
    valid: t.length === 0,
    errors: t,
    warnings: o
  });
}
function Na(e, t, o) {
  return {
    payloadVersion: Et,
    snapshot: e,
    trigger: t || "unknown",
    timestamp: Date.now(),
    extraData: o || null
  };
}
function Ar(e) {
  const t = [], o = [];
  if (!e)
    return t.push("Payload e null ou undefined"), { valid: !1, errors: t, warnings: o };
  if (e.payloadVersion && (Dr(e.payloadVersion) || o.push(`payloadVersion ${e.payloadVersion} pode nao ser compativel (min: ${lt.MIN_SUPPORTED})`)), !e.snapshot)
    t.push("snapshot ausente");
  else {
    const r = Rr(e.snapshot);
    if (!r.valid)
      for (let a = 0; a < r.errors.length; a++)
        t.push(`snapshot: ${r.errors[a]}`);
    for (let a = 0; a < r.warnings.length; a++)
      o.push(`snapshot: ${r.warnings[a]}`);
  }
  return e.trigger ? Object.keys(Qe).map((a) => Qe[a]).indexOf(e.trigger) === -1 && o.push(`trigger desconhecido: ${e.trigger}`) : t.push("trigger ausente"), e.timestamp ? typeof e.timestamp != "number" && t.push("timestamp deveria ser number") : t.push("timestamp ausente"), {
    valid: t.length === 0,
    errors: t,
    warnings: o
  };
}
function Sa(e, t) {
  return {
    payloadVersion: Et,
    snapshot: e,
    version: t || "1.0.0",
    timestamp: Date.now()
  };
}
function Ir(e) {
  const t = [], o = [];
  return e ? (e.snapshot ? _r(e.snapshot) || t.push("snapshot invalido") : t.push("snapshot ausente"), e.version || o.push("version ausente no payload ready"), e.timestamp || t.push("timestamp ausente"), {
    valid: t.length === 0,
    errors: t,
    warnings: o
  }) : (t.push("Payload e null ou undefined"), { valid: !1, errors: t, warnings: o });
}
const Qe = Object.freeze({
  MODE_CHANGE: "mode-change",
  AUTH_CHANGE: "auth-change",
  CAPABILITY_CHANGE: "capability-change",
  HEALTH_CHANGE: "health-change",
  MANUAL: "manual",
  INITIAL: "initial",
  REPLAY_READY: "replay-ready",
  REPLAY_UPDATE: "replay-update",
  SUBSCRIPTION: "subscription",
  UNKNOWN: "unknown"
});
function Dr(e) {
  if (!e) return !0;
  const t = e.split("."), o = lt.MIN_SUPPORTED.split("."), r = parseInt(t[0], 10) || 0, a = parseInt(o[0], 10) || 0;
  return r >= a;
}
function pa(e, t) {
  if (!e)
    return { ok: !1, snapshot: null, errors: ["data e null"] };
  let o;
  return t === "ready" ? o = Ir(e) : o = Ar(e), o.valid ? {
    ok: !0,
    snapshot: e.snapshot,
    errors: []
  } : { ok: !1, snapshot: null, errors: o.errors };
}
const dt = "1.0.0-ENTERPRISE", Ie = "core.runtime.contracts.runtime-governance-rules", x = Object.freeze({
  // ── GlobalState ──────────────────────────────────────────────
  GLOBALSTATE_RULE_01: Object.freeze({
    id: "GLOBALSTATE_RULE_01",
    description: 'Todo acesso a GlobalState deve usar _getPort("globalState"). window.GlobalState é fallback LEGADO, nunca primário.',
    severity: "CRITICAL",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "access-channel",
    authorizedChannels: ["ports", "core.windowAdapter", "facade", "adapter"],
    forbiddenChannels: ["window.GlobalState", "window.appState", "window.store"]
  }),
  GLOBALSTATE_RULE_02: Object.freeze({
    id: "GLOBALSTATE_RULE_02",
    description: "GlobalState deve estar disponível após Phase-1. Falha do GlobalState em strict mode = hard stop.",
    severity: "CRITICAL",
    enforcement: "MANDATORY",
    phase: "phase-1",
    validates: "availability"
  }),
  // ── ContextProvider ──────────────────────────────────────────
  CONTEXTPROVIDER_RULE_01: Object.freeze({
    id: "CONTEXTPROVIDER_RULE_01",
    description: "ContextProvider é leitura eventual, não fonte imediata. Consumidores devem tolerar ausência de contexto.",
    severity: "HIGH",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "usage-pattern",
    requiredGuards: ["isInitialized", "isHydrated", "nullCheck"]
  }),
  CONTEXTPROVIDER_RULE_02: Object.freeze({
    id: "CONTEXTPROVIDER_RULE_02",
    description: "ContextProvider NÃO é fonte primária. É espelho derivado de GlobalState e Orchestrator.",
    severity: "HIGH",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "architecture"
  }),
  // ── FeatureFlags ─────────────────────────────────────────────
  FEATUREFLAGS_RULE_01: Object.freeze({
    id: "FEATUREFLAGS_RULE_01",
    description: "FeatureFlags é parte da infraestrutura de decisão. Sua inicialização é determinística e observável.",
    severity: "HIGH",
    enforcement: "MANDATORY",
    phase: "phase-1",
    validates: "lifecycle",
    requiredStates: ["NOT_INITIALIZED", "INITIALIZING", "READY", "DEGRADED"]
  }),
  FEATUREFLAGS_RULE_02: Object.freeze({
    id: "FEATUREFLAGS_RULE_02",
    description: "FeatureFlags não pode alterar estrutura base ou desbloquear dependência crítica. Apenas ajusta comportamento.",
    severity: "MEDIUM",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "scope"
  }),
  // ── EventBus ─────────────────────────────────────────────────
  EVENTBUS_RULE_01: Object.freeze({
    id: "EVENTBUS_RULE_01",
    description: "Toda inscrição (on/subscribe) precisa ter cleanup registrado. Cleanup deve usar .off(event, handler).",
    severity: "HIGH",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "cleanup-pattern"
  }),
  // ── Boot ─────────────────────────────────────────────────────
  BOOT_RULE_01: Object.freeze({
    id: "BOOT_RULE_01",
    description: "Bootstrap é o único responsável por expor globais públicos via windowAdapter.expose().",
    severity: "CRITICAL",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "exposure-authority"
  }),
  // ── Auth ─────────────────────────────────────────────────────
  AUTH_RULE_01: Object.freeze({
    id: "AUTH_RULE_01",
    description: "Cadeia auth: SessionManager → GlobalState → DOM. Máximo 3 fontes, nesta ordem.",
    severity: "HIGH",
    enforcement: "MANDATORY",
    phase: "all",
    validates: "auth-chain",
    authorizedSources: ["sessionManager", "globalState", "dom"]
  })
}), Ve = Object.freeze({
  "phase-0": Object.freeze({
    allowed: ["logger", "config", "securityCSRF", "environmentManager"],
    forbidden: ["globalState", "contextProvider", "featureFlags"]
  }),
  "phase-1": Object.freeze({
    allowed: ["logger", "config", "eventBus", "globalState", "contextProvider", "readyFlags", "telemetry"],
    forbidden: ["featureFlags"]
  }),
  "phase-2": Object.freeze({
    allowed: ["logger", "config", "eventBus", "globalState", "contextProvider", "sessionManager", "appContext"],
    forbidden: ["featureFlags"]
  }),
  "phase-3": Object.freeze({
    allowed: ["logger", "config", "eventBus", "globalState", "contextProvider", "router", "layoutManager"],
    forbidden: []
  }),
  "phase-4": Object.freeze({
    allowed: ["logger", "config", "eventBus", "globalState", "contextProvider", "router", "containerMain"],
    forbidden: []
  }),
  "phase-5": Object.freeze({
    allowed: ["logger", "config", "eventBus", "globalState", "contextProvider", "overlayLayer", "uiOrchestrator"],
    forbidden: []
  })
}), D = {
  validations: 0,
  violations: 0,
  enforcements: 0,
  lastValidationAt: null,
  byRule: {}
};
function ma(e, t) {
  D.validations++, D.lastValidationAt = Date.now();
  const o = Ve[e];
  if (!o) return { allowed: !0, rule: null };
  if (o.forbidden.indexOf(t) !== -1) {
    const r = "PHASE_ACCESS_DENIED";
    return D.violations++, G("PHASE_DEPENDENCY_VIOLATION", {
      module: Ie,
      phase: e,
      dependency: t,
      rule: r
    }), { allowed: !1, rule: r, phase: e, dependency: t };
  }
  return { allowed: !0, rule: null };
}
function Nr(e, t) {
  t || (t = {}), D.enforcements++;
  const o = x[e];
  if (!o)
    return { passed: !1, rule: null, message: "Rule not found: " + e };
  D.byRule[e] || (D.byRule[e] = { checks: 0, violations: 0 }), D.byRule[e].checks++;
  let r = !0, a = null;
  if (o.validates === "access-channel" && t.channel && o.forbiddenChannels && o.forbiddenChannels.indexOf(t.channel) !== -1 && (r = !1, a = "Canal proibido: " + t.channel + " — use " + o.authorizedChannels.join(" ou ")), o.validates === "auth-chain" && t.sources) {
    const n = o.authorizedSources;
    for (var s = 0; s < t.sources.length; s++)
      if (n.indexOf(t.sources[s]) === -1) {
        r = !1, a = "Fonte auth não autorizada: " + t.sources[s] + " — permitidas: " + n.join(", ");
        break;
      }
  }
  return r || (D.violations++, D.byRule[e].violations++, G("GOVERNANCE_RULE_VIOLATION", {
    module: t.module || Ie,
    rule: e,
    severity: o.severity,
    message: a,
    context: t
  })), { passed: r, rule: o, message: a };
}
function ga(e) {
  e || (e = {});
  const t = [];
  let o = 0, r = 0;
  const a = Object.keys(x);
  for (var s = 0; s < a.length; s++) {
    const n = a[s];
    let l = x[n];
    if (e.phase && l.phase !== "all" && l.phase !== e.phase) continue;
    r++;
    const c = Nr(n, e);
    c.passed && o++, t.push({ ruleId: n, passed: c.passed, message: c.message });
  }
  return {
    passed: o === r,
    score: o + "/" + r,
    results: t
  };
}
function Sr() {
  return Object.keys(x).map(function(e) {
    const t = x[e];
    return {
      id: t.id,
      severity: t.severity,
      enforcement: t.enforcement,
      phase: t.phase,
      validates: t.validates
    };
  });
}
function pr() {
  const e = u(), t = Object.keys(x).length, o = Object.keys(Ve).length, r = {
    rulesLoaded: t > 0,
    matrixLoaded: o > 0,
    strictModeActive: e,
    noViolations: D.violations === 0,
    metricsTracking: D.validations >= 0
  };
  let a = 0, s = 0;
  for (var n in r)
    s++, r[n] && a++;
  return {
    status: a === s ? "HEALTHY" : a >= s - 1 ? "DEGRADED" : "UNHEALTHY",
    score: a + "/" + s,
    checks: r,
    ruleCount: t,
    phaseCount: o,
    strictMode: e,
    version: dt,
    moduleId: Ie,
    metrics: Object.assign({}, D),
    timestamp: Date.now()
  };
}
function mr() {
  return {
    version: dt,
    moduleId: Ie,
    strictMode: u(),
    rules: Sr(),
    phases: Object.keys(Ve),
    metrics: Object.assign({}, D),
    timestamp: Date.now()
  };
}
const we = "1.1.0-SEVERITY-COMPLETE", De = "governance-telemetry-bridge", ue = ne({ moduleId: De });
function k(e) {
  return ue.get(e);
}
let ke = !1, Te = [], ct = null;
const Oe = (e, t, o) => {
  const r = `[${De}]`, a = k("logger");
  a && a[e] && a[e](`${r} ${t}`, o || {});
};
function gr() {
  const e = k("eventBus"), t = k("telemetry");
  try {
    const o = K(), r = {
      compliant: o.status === "HEALTHY",
      strictModeActive: u(),
      status: o.status,
      scorePercentage: o.scorePercentage,
      summary: o.summary,
      topOffenders: o.topOffenders,
      recommendations: o.recommendations,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return e && e.emit && e.emit(I.COMPLIANCE_REPORT, r), t && t.track && t.track("governance:compliance:report", r), Oe("info", "Compliance report emitted", { status: o.status }), r;
  } catch (o) {
    return Oe("error", "Failed to emit compliance report", { error: o.message }), null;
  }
}
function Lr() {
  const e = k("eventBus"), t = k("telemetry");
  try {
    Promise.resolve().then(() => Ht).then((o) => {
      const r = o.getViolationsSummary();
      e && e.emit && e.emit(I.VIOLATION_SUMMARY, r), t && t.track && t.track("governance:violation:summary", r), Oe("info", "Violation summary emitted", { total: r.total });
    });
  } catch (o) {
    Oe("error", "Failed to emit violation summary", { error: o.message });
  }
}
function ut() {
  const e = {
    initialized: ke,
    eventBusConnected: !!k("eventBus"),
    telemetryAvailable: !!k("telemetry"),
    subscriptionsActive: Te.length > 0,
    healthMonitorActive: !1,
    portsInitialized: ue.isInitialized()
  }, t = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
  return {
    status: "UNHEALTHY",
    score: `${t}/${o}`,
    checks: e,
    strictMode: u(),
    lastHealthStatus: ct,
    subscriptionsCount: Te.length,
    moduleId: De,
    version: we,
    portsInitialized: ue.isInitialized(),
    timestamp: Date.now()
  };
}
function hr() {
  return {
    moduleId: De,
    version: we,
    initialized: ke,
    strictMode: u(),
    subscriptionsCount: Te.length,
    lastHealthStatus: ct,
    healthMonitorActive: !1,
    portsInitialized: ue.isInitialized(),
    timestamp: Date.now()
  };
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.governanceBridge = {
  getVersion: () => we,
  info: hr,
  healthCheck: ut,
  emitComplianceReport: gr,
  emitViolationSummary: Lr,
  getSubscriptionsCount: () => Te.length,
  isInitialized: () => ke
});
const fr = "1.3.0-CLEANUP-FIX", Tt = "core.runtime.permissions.permission-resolver", fe = ne({ moduleId: Tt });
function Ot(e) {
  return fe.get(e);
}
let Cr = !1, br = !1;
const ge = {
  resolveCount: 0,
  resolveErrors: 0,
  emitCount: 0,
  subscriptionCount: 0,
  lastResolvedAt: null,
  lastEmittedAt: null,
  authEventsReceived: 0,
  cacheHits: 0
};
function vr() {
  const e = Ot("auth");
  if (e && typeof e.getLevel == "function")
    return e;
  if (typeof window < "u") {
    if (window.AuthAdapter && typeof window.AuthAdapter.getLevel == "function")
      return window.AuthAdapter;
    if (window.CoreAuthAdapter && typeof window.CoreAuthAdapter.getLevel == "function")
      return window.CoreAuthAdapter;
  }
  return null;
}
function yr() {
  const e = {
    initialized: Cr,
    resolved: br,
    hasModel: !1,
    modelValid: !1,
    authAdapterAvailable: !!vr(),
    eventBusAvailable: !!Ot("eventBus"),
    noResolveErrors: ge.resolveErrors === 0,
    portsInitialized: fe.isInitialized()
  };
  let t = 0, o = 0;
  for (const a in e)
    o++, e[a] && t++;
  let r = "HEALTHY";
  return !e.initialized || !e.resolved ? r = "UNHEALTHY" : (ge.resolveErrors > 0 || !e.authAdapterAvailable) && (r = "DEGRADED"), {
    status: r,
    score: t,
    maxScore: o,
    scoreDisplay: `${t}/${o}`,
    checks: e,
    moduleId: Tt,
    version: fr,
    strictMode: u(),
    portsInitialized: fe.isInitialized(),
    metrics: Object.assign({}, ge),
    timestamp: Date.now()
  };
}
const _t = "core-events-listeners-registry", Ur = "1.0.0-P1-ENTERPRISE";
ne({ moduleId: _t });
let Ze = !1;
const Rt = /* @__PURE__ */ new Map(), Mr = /* @__PURE__ */ new Map(), M = {
  totalRegistrations: 0,
  totalUnregistrations: 0,
  activeListeners: 0,
  peakListeners: 0
};
function Pr(e) {
  const o = (e || {}).activeOnly !== !1, r = [];
  for (const [a, s] of Rt.entries())
    for (const n of s)
      (!o || n.active) && r.push({
        id: n.id,
        event: n.event,
        moduleId: n.moduleId,
        handler: n.handler,
        purpose: n.purpose,
        longLived: n.longLived,
        active: n.active,
        registeredAt: n.registeredAt,
        unregisteredAt: n.unregisteredAt
      });
  return r;
}
function Hr() {
  const e = {}, t = {};
  let o = 0;
  for (const [r, a] of Rt.entries()) {
    let s = 0;
    for (const n of a)
      n.active && (s++, n.longLived && o++);
    s > 0 && (e[r] = s);
  }
  for (const [r, a] of Mr.entries()) {
    let s = 0;
    for (const n of a)
      n.active && s++;
    s > 0 && (t[r] = s);
  }
  return {
    activeListeners: M.activeListeners,
    totalRegistrations: M.totalRegistrations,
    totalUnregistrations: M.totalUnregistrations,
    peakListeners: M.peakListeners,
    longLivedListeners: o,
    eventCount: Object.keys(e).length,
    moduleCount: Object.keys(t).length,
    byEvent: e,
    byModule: t
  };
}
function Gr() {
  const e = [], t = [], o = Hr();
  for (const [s, n] of Object.entries(o.byEvent))
    n > 10 && t.push({
      type: "high-listener-count",
      event: s,
      count: n,
      message: `Event "${s}" has ${n} listeners - consider consolidation`
    });
  const r = Date.now(), a = 5 * 60 * 1e3;
  for (const s of Pr({ activeOnly: !0 }))
    !s.longLived && r - s.registeredAt > a && t.push({
      type: "potentially-leaked-listener",
      id: s.id,
      event: s.event,
      moduleId: s.moduleId,
      age: Math.round((r - s.registeredAt) / 1e3),
      message: `Listener for "${s.event}" from "${s.moduleId}" has been active for ${Math.round((r - s.registeredAt) / 1e3)}s but is not marked longLived`
    });
  for (const [s, n] of Object.entries(o.byModule))
    n > 20 && t.push({
      type: "module-high-listener-count",
      moduleId: s,
      count: n,
      message: `Module "${s}" has ${n} active listeners`
    });
  return {
    timestamp: Date.now(),
    stats: o,
    issues: e,
    warnings: t,
    healthy: e.length === 0 && t.length < 5
  };
}
function Vr() {
  const e = Gr(), t = {
    portsInitialized: Ze,
    noIssues: e.issues.length === 0,
    fewWarnings: e.warnings.length < 5,
    reasonableListenerCount: M.activeListeners < 200
  }, o = Object.values(t).filter(Boolean).length, r = Object.keys(t).length;
  let a = "HEALTHY";
  return e.issues.length > 0 && (a = "DEGRADED"), M.activeListeners > 500 && (a = "DEGRADED"), a = "NOT_INITIALIZED", {
    status: a,
    score: { passed: o, total: r, percentage: Math.round(o / r * 100) },
    moduleId: _t,
    version: Ur,
    p1Enterprise: !0,
    portsInitialized: Ze,
    checks: t,
    metrics: M,
    auditWarnings: e.warnings.length,
    timestamp: Date.now()
  };
}
const wr = "1.0.0-HTTP-GOVERNANCE", kr = "enterprise/http-governance", de = {
  totalRequests: 0,
  withSignal: 0,
  withoutSignal: 0,
  withTimeout: 0,
  withoutTimeout: 0,
  violations: 0
};
function Br() {
  return Object.assign({}, de);
}
function qr() {
  const e = de.totalRequests > 0 ? (de.withSignal / de.totalRequests * 100).toFixed(1) : 100;
  return {
    status: parseFloat(e) >= 80 ? "HEALTHY" : parseFloat(e) >= 50 ? "DEGRADED" : "UNHEALTHY",
    complianceRate: `${e}%`,
    metrics: Br(),
    version: wr,
    moduleId: kr,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
const Fr = "1.0.0-POLLING-GOVERNANCE", Yr = "enterprise/polling-governance", Ce = /* @__PURE__ */ new Map();
let zr = !1;
const ce = {
  totalCreated: 0,
  totalDestroyed: 0,
  totalPaused: 0,
  totalResumed: 0,
  totalTicks: 0,
  totalErrors: 0,
  visibilityPauses: 0,
  visibilityResumes: 0
};
function Wr() {
  let e = 0, t = 0;
  return Ce.forEach((o) => {
    o.isRunning() ? e++ : o.isPaused() && t++;
  }), { total: Ce.size, running: e, paused: t };
}
function jr() {
  return Object.assign({}, ce, {
    activeInstances: Ce.size
  });
}
function Kr() {
  const e = Wr(), t = {
    noOrphans: e.total < 50,
    lowErrorRate: ce.totalErrors < ce.totalTicks * 0.3 || ce.totalTicks === 0,
    visibilityGatingActive: zr
  }, o = Object.values(t).filter(Boolean).length, r = Object.keys(t).length;
  return {
    status: o === r ? "HEALTHY" : o >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: o,
    maxScore: r,
    scoreDisplay: `${o}/${r}`,
    checks: t,
    activeInstances: e,
    metrics: jr(),
    version: Fr,
    moduleId: Yr,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
const xr = "core.runtime.constants.runtime-guard", $r = "1.2.0-STRICT-MODE";
let Qr = !1, Zr = [];
const Xr = 50, Xe = {
  blockedCalls: 0,
  queuedCalls: 0,
  processedFromQueue: 0,
  directCalls: 0
};
function Jr() {
  const e = {
    ready: Qr,
    queueNotFull: Zr.length < Xr,
    lowBlockedCalls: Xe.blockedCalls < 100
  }, t = Object.values(e).filter(Boolean).length, o = Object.keys(e).length;
  return {
    status: t === o ? "HEALTHY" : "UNHEALTHY",
    score: `${t}/${o}`,
    checks: e,
    moduleId: xr,
    version: $r,
    strictMode: u(),
    metrics: Object.assign({}, Xe),
    timestamp: Date.now()
  };
}
const Be = "runtime-health-aggregator", Ne = "1.1.0-GOVERNANCE-MODULES", H = [
  { id: "strict-mode", fn: K, category: "governance" },
  { id: "governance-telemetry-bridge", fn: ut, category: "governance" },
  { id: "permission-resolver", fn: yr, category: "permissions" },
  { id: "early-boot-logger", fn: Ge, category: "logging" },
  { id: "listeners-registry", fn: Vr, category: "events" },
  { id: "http-governance", fn: qr, category: "governance" },
  { id: "polling-governance", fn: Kr, category: "governance" },
  { id: "runtime-governance-rules", fn: pr, category: "governance" },
  { id: "runtime-guard", fn: Jr, category: "runtime" }
], N = [];
function eo(e, t, o) {
  if (!e || typeof t != "function") return !1;
  for (var r = 0; r < N.length; r++)
    if (N[r].id === e)
      return N[r].fn = t, !0;
  return N.push({ id: e, fn: t, category: o || "component" }), !0;
}
function to(e) {
  for (var t = 0; t < N.length; t++)
    if (N[t].id === e)
      return N.splice(t, 1), !0;
  return !1;
}
function ro(e) {
  try {
    const t = e.fn();
    return { id: e.id, category: e.category, result: t, error: null };
  } catch (t) {
    return {
      id: e.id,
      category: e.category,
      result: { status: "FAILED", moduleId: e.id, error: t.message, timestamp: Date.now() },
      error: t.message
    };
  }
}
function oo() {
  const e = H.concat(N), t = [], o = {}, r = { HEALTHY: 0, DEGRADED: 0, UNHEALTHY: 0, FAILED: 0 };
  for (var a = 0; a < e.length; a++) {
    const O = ro(e[a]);
    t.push(O);
    const _ = O.category || "other";
    o[_] || (o[_] = []), o[_].push(O);
    const p = O.result && O.result.status ? O.result.status : "FAILED";
    r[p] !== void 0 ? r[p]++ : r.DEGRADED++;
  }
  let s = null;
  try {
    s = mr();
  } catch (O) {
    s = { error: O.message };
  }
  let n = q.HEALTHY;
  r.FAILED > 0 ? n = q.FAILED : r.UNHEALTHY > 0 ? n = q.UNHEALTHY : r.DEGRADED > 0 && (n = q.DEGRADED);
  let l = e.length;
  const c = r.HEALTHY;
  return {
    status: n,
    score: c + "/" + l,
    scorePercent: l > 0 ? Math.round(c / l * 100) : 0,
    modules: t,
    byCategory: o,
    statusCounts: r,
    governanceRules: s,
    totalModules: l,
    builtIn: H.length,
    dynamic: N.length,
    moduleId: Be,
    version: Ne,
    timestamp: Date.now()
  };
}
function ao() {
  const e = H.length + N.length;
  return Dt({
    status: e > 0 ? q.HEALTHY : q.DEGRADED,
    moduleId: Be,
    version: Ne,
    checks: {
      builtInModulesRegistered: H.length > 0,
      aggregationReady: !0,
      totalModules: e > 0
    },
    details: {
      builtIn: H.length,
      dynamic: N.length,
      total: e
    }
  });
}
function no() {
  return {
    moduleId: Be,
    version: Ne,
    builtInModules: H.map(function(e) {
      return e.id;
    }),
    dynamicModules: N.map(function(e) {
      return e.id;
    }),
    totalModules: H.length + N.length,
    timestamp: Date.now()
  };
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.runtimeHealth = {
  aggregate: oo,
  healthCheck: ao,
  info: no,
  register: eo,
  unregister: to,
  version: Ne
});
const La = Object.freeze({ MOUNTED: "component.mounted", UNMOUNTED: "component.unmounted", READY: "component.ready", ERROR: "component.error", DEGRADED: "component.degraded", LOADING: "component.loading", LOADED: "component.loaded", LOAD_FAILED: "component.load.failed", STATUS_CHANGED: "component.status.changed", DATA_UPDATED: "component.data.updated", ALL_READY: "component.all.ready" }), ha = Object.freeze({ MOUNT: "component.mount.request", UNMOUNT: "component.unmount.request", REFRESH: "component.refresh.request" }), so = "1.1.0-SEVERITY-COMPLETE", io = "events.catalog.governance", y = Object.freeze({
  // ─────────────────────────────────────────────────────────────
  // Lifecycle Events
  // ─────────────────────────────────────────────────────────────
  STRICT_MODE_ENABLED: "governance.strict-mode:enabled",
  STRICT_MODE_DISABLED: "governance.strict-mode:disabled",
  STRICT_MODE_INITIALIZED: "governance.strict-mode:initialized",
  // ─────────────────────────────────────────────────────────────
  // Violation Events by Severity
  // ─────────────────────────────────────────────────────────────
  VIOLATION_CRITICAL: "governance.violation:critical",
  VIOLATION_HIGH: "governance.violation:high",
  VIOLATION_MEDIUM: "governance.violation:medium",
  VIOLATION_LOW: "governance.violation:low",
  VIOLATION_INFO: "governance.violation:info",
  VIOLATION_RECORDED: "governance.violation:recorded",
  // ─────────────────────────────────────────────────────────────
  // Alert Events
  // ─────────────────────────────────────────────────────────────
  VIOLATION_SPIKE: "governance.alert:violation-spike",
  CRITICAL_THRESHOLD_EXCEEDED: "governance.alert:critical-threshold",
  MODULE_NON_COMPLIANT: "governance.alert:module-non-compliant",
  COMPLIANCE_DEGRADED: "governance.alert:compliance-degraded",
  UNKNOWN_SEVERITY: "governance.alert:unknown-severity",
  // ─────────────────────────────────────────────────────────────
  // Report Events
  // ─────────────────────────────────────────────────────────────
  COMPLIANCE_REPORT: "governance.report:compliance",
  VIOLATION_SUMMARY: "governance.report:violation-summary",
  MODULE_METRICS: "governance.report:module-metrics",
  // ─────────────────────────────────────────────────────────────
  // Health Events
  // ─────────────────────────────────────────────────────────────
  HEALTH_CHECK: "governance.health:check",
  HEALTH_DEGRADED: "governance.health:degraded",
  HEALTH_RESTORED: "governance.health:restored"
}), fa = Object.freeze({
  // Lifecycle
  STRICT_MODE_ENABLED: "Enterprise Strict Mode ativado",
  STRICT_MODE_DISABLED: "Enterprise Strict Mode desativado",
  STRICT_MODE_INITIALIZED: "Enterprise Strict Mode inicializado",
  // Violations
  VIOLATION_CRITICAL: "Violação crítica detectada - ação imediata necessária",
  VIOLATION_HIGH: "Violação alta detectada - requer atenção",
  VIOLATION_MEDIUM: "Violação média detectada",
  VIOLATION_LOW: "Violação baixa detectada",
  VIOLATION_INFO: "Violação informativa registrada",
  VIOLATION_RECORDED: "Violação registrada no audit trail",
  // Alerts
  VIOLATION_SPIKE: "Pico de violações detectado",
  CRITICAL_THRESHOLD_EXCEEDED: "Limite crítico de violações excedido",
  MODULE_NON_COMPLIANT: "Módulo não-compliance detectado",
  COMPLIANCE_DEGRADED: "Compliance do sistema degradado",
  UNKNOWN_SEVERITY: "Violação com severidade desconhecida — tipo não mapeado em VIOLATION_SEVERITY",
  // Reports
  COMPLIANCE_REPORT: "Relatório de compliance gerado",
  VIOLATION_SUMMARY: "Sumário de violações gerado",
  MODULE_METRICS: "Métricas de módulo geradas",
  // Health
  HEALTH_CHECK: "Health check de governança executado",
  HEALTH_DEGRADED: "Health de governança degradado",
  HEALTH_RESTORED: "Health de governança restaurado"
}), Eo = Object.freeze({
  CRITICAL: y.VIOLATION_CRITICAL,
  HIGH: y.VIOLATION_HIGH,
  MEDIUM: y.VIOLATION_MEDIUM,
  LOW: y.VIOLATION_LOW,
  INFO: y.VIOLATION_INFO,
  UNKNOWN: y.VIOLATION_RECORDED
}), Ca = Object.freeze({
  CRITICAL_VIOLATIONS_MAX: 5,
  HIGH_VIOLATIONS_MAX: 20,
  VIOLATION_SPIKE_RATE: 10,
  // violations per minute
  MODULE_NON_COMPLIANT_THRESHOLD: 3
  // violations per module
}), ba = () => so, va = () => io;
function ya(e) {
  return Eo[e] || y.VIOLATION_INFO;
}
function Ua(e) {
  return e === "CRITICAL" || e === "HIGH";
}
const Ma = Object.freeze({ TRANSITION_REQUESTED: "layout.transition.requested", TRANSITION_ACCEPTED: "layout.transition.accepted", TRANSITION_REJECTED: "layout.transition.rejected", BREAKPOINT_CHANGED: "layout.breakpoint.changed", STATE_CHANGED: "layout.state.changed", MODE_CHANGED: "layout.mode.changed", APPLIED: "layout.applied", REQUEST: "layout.request", SIDEBAR_CHANGED: "layout.sidebar.changed" }), Pa = Object.freeze({ CHANGE_MODE: "layout.mode.change.request", FORCE_RESET: "layout.reset.request" }), lo = Object.freeze({
  // Lifecycle
  READY: "navigation.ready",
  INITIALIZED: "navigation.initialized",
  DESTROYED: "navigation.destroyed",
  DEGRADED: "navigation.degraded",
  // Section Events
  SECTION_TOGGLE: "navigation.section.toggle",
  SECTION_EXPANDED: "navigation.section.expanded",
  SECTION_COLLAPSED: "navigation.section.collapsed",
  // Item Events
  ITEM_SELECTED: "navigation.item.selected",
  ITEM_BLOCKED: "navigation.item.blocked",
  ITEM_HOVER: "navigation.item.hover",
  // State Events
  STATE_CHANGED: "navigation.state.changed",
  STATE_SYNC: "navigation.state.sync",
  STATE_RESTORED: "navigation.state.restored",
  STATE_PERSISTED: "navigation.state.persisted",
  // Model Events (from NavigationModelLoader)
  MODEL_LOAD_START: "navigation.model.load.start",
  MODEL_LOAD_SUCCESS: "navigation.model.load.success",
  MODEL_LOAD_FALLBACK: "navigation.model.load.fallback",
  MODEL_LOAD_FAIL: "navigation.model.load.fail",
  MODEL_CACHE_HIT: "navigation.model.cache.hit",
  MODEL_CACHE_STALE: "navigation.model.cache.stale",
  MODEL_UPDATED: "navigation.model.updated",
  // Error Events
  ERROR: "navigation.error"
}), co = Object.freeze({ READY: "sidebar.accordion.ready", STATE_CHANGED: "sidebar.accordion.state.changed", SECTION_TOGGLED: "sidebar.accordion.section.toggled", ITEM_SELECTED: "sidebar.accordion.item.selected", ITEM_BLOCKED: "sidebar.accordion.item.blocked", PERSIST_OK: "sidebar.accordion.persist.ok", PERSIST_FAIL: "sidebar.accordion.persist.fail", RESTORE_OK: "sidebar.accordion.restore.ok", RESTORE_FAIL: "sidebar.accordion.restore.fail", ERROR: "sidebar.accordion.error" });
new Set(Object.values(lo));
new Set(Object.values(co));
const Ha = Object.freeze({ ANNOUNCED: "accessibility.announced", SETTING_APPLIED: "accessibility.setting.applied", SETTING_CHANGED: "accessibility.setting.changed", ERROR: "accessibility.error", READY: "accessibility.ready" }), Ga = Object.freeze({ ANNOUNCE: "accessibility.announce.request", SET_REDUCED_MOTION: "accessibility.reduced-motion.set.request", SET_HIGH_CONTRAST: "accessibility.high-contrast.set.request", SET_FONT_SIZE: "accessibility.font-size.set.request", SET_FOCUS_VISIBLE: "accessibility.focus-visible.set.request" }), Va = Object.freeze({ POLITE: "polite", ASSERTIVE: "assertive", OFF: "off" }), wa = Object.freeze({ ACCEPTED: "action.accepted", REJECTED: "action.rejected", COMPLETED: "action.completed", ERROR: "action.error", DISPATCHING: "action.dispatching", DISPATCHED: "action.dispatched", QUEUED: "action.queued", DEQUEUED: "action.dequeued", VALIDATED: "action.validated", VALIDATION_FAILED: "action.validation.failed" }), ka = Object.freeze({ DISPATCH: "action.dispatch.request", CANCEL: "action.cancel.request", RETRY: "action.retry.request" }), Ba = Object.freeze({ EVENT: "analytics.event", PAGE_VIEW: "analytics.pageview", CLICK: "analytics.click", SEARCH: "analytics.search", ERROR: "analytics.error", CONVERSION: "analytics.conversion", SESSION_START: "analytics.session.start", SESSION_END: "analytics.session.end" }), qa = Object.freeze({ TRACK: "analytics.track.request", FLUSH: "analytics.flush.request" }), Fa = Object.freeze({ CIRCUIT_OPEN: "api.circuit.open", CIRCUIT_CLOSED: "api.circuit.closed", RETRY: "api.retry", TIMEOUT: "api.timeout", ERROR: "api.error", FETCH_ERROR: "api.fetch.error" }), Ya = Object.freeze({ LIFECYCLE_STATE_CHANGED: "audit-trail.lifecycle:state-changed", READY: "audit-trail.ready", ERROR: "audit-trail.error", DUMP_REQUEST: "audit-trail.dump.request", DUMP: "audit-trail.dump", LOGGED: "audit-trail.logged" }), za = Object.freeze({ HIT: "cache.hit", MISS: "cache.miss", SET: "cache.set", DELETE: "cache.delete", CLEAR: "cache.clear", INIT: "cache.init", SHUTDOWN: "cache.shutdown", RESET: "cache.reset", EVICTED: "cache.evicted", EXPIRED: "cache.expired", ERROR: "cache.error" }), Wa = Object.freeze({ CLEAR: "cache.clear.request", EVICT: "cache.evict.request" }), ja = Object.freeze({ READY: "card.ready", ERROR: "card.error", LOADED: "card.loaded", TELEMETRY: "card.telemetry", REFRESH: "card.refresh", REFRESH_START: "cards.refresh.start", REFRESH_END: "cards.refresh.end", REFRESH_ALL_REQUEST: "cards.refresh-all.request", BOOT_COMPLETE: "cards.boot.complete", COMPONENT_READY: "component.ready" }), Ka = Object.freeze({ REFRESH: "card.refresh", REFRESH_ALL: "cards.refresh-all.request", LOAD: "card.load.request" }), xa = Object.freeze({ READY: "carousel.ready", SLIDE_CHANGED: "carousel.slide:changed", MOUNTED: "carousel.mounted", DESTROYED: "carousel.destroyed" }), $a = Object.freeze({ READY: "charts.ready", LOADED: "charts.loaded", DESTROYED: "charts.destroyed", ERROR: "charts.error" }), Qa = Object.freeze({ REGISTRY_READY: "command.registry.ready", EXECUTE_START: "command.execute.start", EXECUTE_SUCCESS: "command.execute.success", EXECUTE_ERROR: "command.execute.error", BLOCKED: "command.blocked", SAVE_REQUEST: "command.save.request", SAVE_ALL_REQUEST: "command.save-all.request", UNDO_REQUEST: "command.undo.request", REDO_REQUEST: "command.redo.request" }), Za = Object.freeze({ EXECUTE: "command.execute.request", REGISTER: "command.register.request", SAVE: "command.save.request", SAVE_ALL: "command.save-all.request", UNDO: "command.undo.request", REDO: "command.redo.request" }), Xa = Object.freeze({ CREATING: "container.creating", CREATED: "container.created", READY: "container.ready", MOUNTING: "container.mounting", MOUNTED: "container.mounted", UNMOUNTING: "container.unmounting", UNMOUNTED: "container.unmounted", DESTROYING: "container.destroying", DESTROYED: "container.destroyed", STATE_CHANGED: "container.state.changed", ACTIVATED: "container.activated", COLLAPSED: "container.collapsed", EXPANDED: "container.expanded", FULLSCREEN: "container.fullscreen", ERROR: "container.error", OPENING: "container.opening", OPENED: "container.opened", CLOSED: "container.closed", REUSED: "container.reused", STACKED: "container.stacked", FOCUS_CHANGED: "container.focus.changed", LAYOUT_CHANGED: "container.layout.changed", LAYOUT_UPDATED: "container.layout.updated", TITLE_UPDATED: "container.title.updated", SNAPSHOT_SAVED: "container.snapshot.saved", SNAPSHOT_RESTORED: "container.snapshot.restored", SNAPSHOT_CLEARED: "container.snapshot.cleared", REPAIRED: "container.repaired", RECOVERY_COMPLETE: "container.recovery.complete", TRANSACTION_COMMITTED: "container.transaction.committed", TRANSACTION_ROLLED_BACK: "container.transaction.rolledback", DRAG_START: "container.drag.start", DRAG_END: "container.drag.end", RESIZE_END: "container.resize.end", KEYBOARD_ACTION: "container.keyboard.action", CONTEXTMENU_ACTION: "container.contextmenu.action", PRESET_CHANGED: "container.preset.changed", DRAG_MOVE: "container.drag.move", RESIZE: "container.resize", RESIZE_START: "container.resize.start" }), Ja = Object.freeze({ CREATE: "container.create.request", DESTROY: "container.destroy.request", ACTIVATE: "container.activate.request", COLLAPSE: "container.collapse.request", EXPAND: "container.expand.request", OPEN: "container.open.request", CLOSE: "container.close.request", FOCUS: "container.focus.request", RESIZE: "container.resize.request", DRAG: "container.drag.request", APPLY_PRESET: "container.preset.apply.request" }), en = Object.freeze({ GRANTED: "device.granted", DENIED: "device.denied", RELEASED: "device.released", REGISTERED: "device.registered", REMOVED: "device.removed", RENAMED: "device.renamed", TRUST_UPDATED: "device.trust-updated", CURRENT: "device.current", LIST: "device.list", READY: "device.ready", ERROR: "device.error" }), tn = Object.freeze({ REQUEST_PERMISSION: "device.permission.request", RELEASE: "device.release.request", REGISTER: "device.register.request" }), rn = Object.freeze({ INIT: "error.boundary.init", READY: "error.boundary.ready", CAPTURED: "error.boundary.captured", HANDLED: "error.boundary.handled", UNHANDLED: "error.boundary.unhandled", RECOVERY_STARTED: "error.boundary.recovery.started", RECOVERY_COMPLETED: "error.boundary.recovery.completed", RECOVERY_FAILED: "error.boundary.recovery.failed", REPORTED: "error.boundary.reported" }), on = Object.freeze({ CAPTURE: "error.boundary.capture.request", RECOVER: "error.boundary.recover.request", REPORT: "error.boundary.report.request" }), an = Object.freeze({ OPEN: "external.open", OPEN_REQUEST: "external.open.request", OPENED: "external.opened", OPEN_FAILED: "external.open.failed" }), nn = Object.freeze({ OPEN: "external.open.request" }), sn = Object.freeze({ READY: "footer.ready", MOUNTED: "footer.mounted", UNMOUNTED: "footer.unmounted", ICON_MOUNTED: "footer.icon.mounted", ICON_UNMOUNTED: "footer.icon.unmounted", ICON_CLICKED: "footer.icon.clicked", BUTTON_MOUNTED: "footer.button.mounted", BUTTON_UNMOUNTED: "footer.button.unmounted", BUTTON_CLICKED: "footer.button.clicked", STATUS_UPDATED: "footer.status.updated", USER_CHANGED: "footer.user.changed", WIFI_MOUNTED: "footer.wifi.mounted", WIFI_UNMOUNTED: "footer.wifi.unmounted", SUPPORT_MOUNTED: "footer.support.mounted", SUPPORT_UNMOUNTED: "footer.support.unmounted", CLOCK_MOUNTED: "footer.clock.mounted", CLOCK_UNMOUNTED: "footer.clock.unmounted", CPU_MOUNTED: "footer.cpu.mounted", CPU_UNMOUNTED: "footer.cpu.unmounted", MEMORY_MOUNTED: "footer.memory.mounted", MEMORY_UNMOUNTED: "footer.memory.unmounted", SERVER_MOUNTED: "footer.server.mounted", SERVER_UNMOUNTED: "footer.server.unmounted", DATABASE_MOUNTED: "footer.database.mounted", DATABASE_UNMOUNTED: "footer.database.unmounted", DISK_MOUNTED: "footer.disk.mounted", DISK_UNMOUNTED: "footer.disk.unmounted", API_MOUNTED: "footer.api.mounted", API_UNMOUNTED: "footer.api.unmounted", SHIELD_MOUNTED: "footer.shield.mounted", SHIELD_UNMOUNTED: "footer.shield.unmounted", GLOBE_MOUNTED: "footer.globe.mounted", GLOBE_UNMOUNTED: "footer.globe.unmounted", SETTINGS_MOUNTED: "footer.settings.mounted", SETTINGS_UNMOUNTED: "footer.settings.unmounted", DOCS_MOUNTED: "footer.docs.mounted", DOCS_UNMOUNTED: "footer.docs.unmounted", FILE_MOUNTED: "footer.file.mounted", FILE_UNMOUNTED: "footer.file.unmounted", CHECK_MOUNTED: "footer.check.mounted", CHECK_UNMOUNTED: "footer.check.unmounted", STATUS_MOUNTED: "footer.status.mounted", STATUS_UNMOUNTED: "footer.status.unmounted", LOGO_MOUNTED: "footer.logo.mounted", LOGO_UNMOUNTED: "footer.logo.unmounted", ACTIVITY_MOUNTED: "footer.activity.mounted", ACTIVITY_UNMOUNTED: "footer.activity.unmounted", PIPEDRIVE_MOUNTED: "footer.pipedrive.mounted", PIPEDRIVE_UNMOUNTED: "footer.pipedrive.unmounted", MAP_PIN_MOUNTED: "footer.map.pin.mounted", MAP_PIN_UNMOUNTED: "footer.map.pin.unmounted", COPYRIGHT_MOUNTED: "footer.copyright.mounted", COPYRIGHT_UNMOUNTED: "footer.copyright.unmounted", STATUS_MODE_MOUNTED: "footer.status.mode.mounted", STATUS_MODE_UNMOUNTED: "footer.status.mode.unmounted", FINANCIAL_MOUNTED: "footer.financial.mounted", FINANCIAL_UNMOUNTED: "footer.financial.unmounted", DEVICE_MIC_MOUNTED: "footer.device.mic.mounted", DEVICE_MIC_UNMOUNTED: "footer.device.mic.unmounted", DEVICE_WEBCAM_MOUNTED: "footer.device.webcam.mounted", DEVICE_WEBCAM_UNMOUNTED: "footer.device.webcam.unmounted", ICONS_READY: "footer.icons.ready" }), En = Object.freeze({ SHOW: "footer.show.request", HIDE: "footer.hide.request", REFRESH: "footer.refresh.request" }), ln = Object.freeze({ READY: "header.ready", MOUNTED: "header.mounted", UNMOUNTED: "header.unmounted", MOUNT_FAILED: "header.mount.failed", COMPONENT_LOADED: "header.component.loaded", COMPONENT_ERROR: "header.component.error", DATA_UPDATED: "header.data.updated", REFRESH: "header.refresh", REFRESH_TRIGGERED: "header.refresh.triggered", CONFIG_LOAD_FAILED: "header.config.load.failed", AUTH_LOGIN_UPDATED: "auth.login.header-updated", AUTH_LOGOUT_UPDATED: "auth.logout.header-updated", NETWORK_QUALITY_CHANGE: "network.quality.change", ROUTE_UPDATED: "header.route.updated", ANNOUNCER_CREATED: "header.announcer.created", ORCHESTRATOR_STATUS_CHANGED: "header.orchestrator.status.changed", CLOCK_MOUNTED: "header.clock.mounted", CLOCK_UNMOUNTED: "header.clock.unmounted", WEATHER_MOUNTED: "header.weather.mounted", WEATHER_UNMOUNTED: "header.weather.unmounted", WEATHER_UPDATED: "header.weather.updated", NOTIFICATIONS_MOUNTED: "header.notifications.mounted", NOTIFICATIONS_UNMOUNTED: "header.notifications.unmounted", NOTIFICATIONS_UPDATED: "header.notifications.updated", USER_MENU_MOUNTED: "header.user.menu.mounted", USER_MENU_UNMOUNTED: "header.user.menu.unmounted", USER_LOADED: "header.user.loaded", LOGOUT_REQUESTED: "header.logout.requested", INTEGRATION_MOUNTED: "header.integration.mounted", INTEGRATION_UNMOUNTED: "header.integration.unmounted", INTEGRATION_STATUS_UPDATED: "header.integration.status.updated", QUALITY_CHANGE: "header.quality.change" }), dn = Object.freeze({ REFRESH: "header.refresh.request", SHOW: "header.show.request", HIDE: "header.hide.request" }), cn = Object.freeze({
  // Lifecycle
  KERNEL_INITIALIZED: "kernel.initialized",
  KERNEL_READY: "kernel.ready",
  KERNEL_SHUTDOWN: "kernel.shutdown",
  // Mode changes (fonte única de verdade)
  MODE_CHANGE: "kernel.mode.change",
  MODE_DEGRADED: "kernel.mode.degraded",
  MODE_RECOVERY: "kernel.mode.recovery",
  MODE_NORMAL: "kernel.mode.normal",
  MODE_MAINTENANCE: "kernel.mode.maintenance",
  MODE_FAILED: "kernel.mode.failed",
  // RuntimeContext (P2)
  RUNTIME_CONTEXT_READY: "kernel.runtime-context.ready",
  RUNTIME_CONTEXT_UPDATED: "kernel.runtime-context.updated",
  // Capabilities
  CAPABILITY_ENABLED: "kernel.capability.enabled",
  CAPABILITY_DISABLED: "kernel.capability.disabled",
  CAPABILITY_CHANGE: "kernel.capability.change",
  // Health
  HEALTH_UPDATE: "kernel.health.update",
  HEALTH_DEGRADED: "kernel.health.degraded",
  HEALTH_RECOVERED: "kernel.health.recovered",
  // State
  STATE_CHANGE: "kernel.state.change",
  CONTEXT_UPDATE: "kernel.context.update"
}), un = Object.freeze({
  REQUEST_MODE_CHANGE: "kernel.mode.change.request",
  REQUEST_RECOVERY: "kernel.recovery.request",
  REQUEST_SHUTDOWN: "kernel.shutdown.request"
}), Tn = Object.freeze({ ASSIGNED: "lotties.assigned", UNASSIGNED: "lotties.unassigned", PREVIEW: "lotties.preview", READY: "lotties.ready" }), On = Object.freeze({ READY: "main.ready", INITIALIZED: "main.initialized", INIT_ERROR: "main.init.error", DESTROYED: "main.destroyed", LIFECYCLE_PHASE: "main.lifecycle.phase", NAVIGATION_START: "main.navigation.start", NAVIGATION_COMPLETE: "main.navigation.complete", NAVIGATION_ERROR: "main.navigation.error", CIRCUIT_BREAKER_RESET: "main.circuit.breaker.reset", CIRCUIT_BREAKER_TRIP: "main.circuit.breaker.trip", GLOBALSTATE_SLICE_CREATED: "main.globalstate.slice.created", GLOBALSTATE_DISPATCH: "main.globalstate.dispatch", CANVAS_INITIALIZED: "main.canvas.initialized", CANVAS_CREATED: "main.canvas.created", CANVAS_ATTACHED: "main.canvas.attached", CANVAS_RESIZED: "main.canvas.resized", CANVAS_DESTROYED: "main.canvas.destroyed", CANVAS_MODE_CHANGED: "main.canvas.mode.changed", TAB_CREATED: "main.tab.created", TAB_CLOSED: "main.tab.closed", TAB_CHANGED: "main.tab.changed", SEARCH_QUERY: "main.search.query", SEARCH_CLEAR: "main.search.clear", TOOLBAR_ACTION: "main.toolbar.action", STATE_SAVE: "main.state.save", STATE_RESTORE: "main.state.restore", SPLIT_RESIZE: "main.split.resize", SNAP_CHANGE: "main.snap.change", SNAP_UNSNAP: "main.snap.unsnap", PROGRESS_COMPLETE: "main.progress.complete", BREADCRUMB_NAVIGATE: "main.breadcrumb.navigate", BADGE_CHANGE: "main.badge.change", ZOOM_CHANGE: "main.zoom.change", MULTIWINDOW_MESSAGE: "main.multiwindow.message", PANEL_MOUNTED: "main.panel.mounted", MOUNTED: "main.mounted", PRESET_CHANGE: "main.preset.change", STATE_SYNC: "main.state.sync" }), _n = Object.freeze({ INIT: "main.init.request", NAVIGATE: "main.navigate.request", DESTROY: "main.destroy.request", RESET_CIRCUIT: "main.circuit.reset.request", CREATE_TAB: "main.tab.create.request", CLOSE_TAB: "main.tab.close.request", SEARCH: "main.search.request" }), Rn = Object.freeze({ LOADED: "manifest.loaded", MODULE_REGISTERED: "manifest.module.registered", MODULE_UNREGISTERED: "manifest.module.unregistered", MODULE_LOADING: "manifest.module.loading", MODULE_LOADED: "manifest.module.loaded", MODULE_INITIALIZING: "manifest.module.initializing", MODULE_READY: "manifest.module.ready", MODULE_ERROR: "manifest.module.error", MODULE_ENABLED: "manifest.module.enabled", MODULE_DISABLED: "manifest.module.disabled" }), An = Object.freeze({ LOAD: "manifest.load.request", ENABLE_MODULE: "manifest.module.enable.request", DISABLE_MODULE: "manifest.module.disable.request" }), In = Object.freeze({ ROUTE_CHANGE_REQUESTED: "mf.route.change.requested", INIT: "mf.init", MOUNTED: "mf.mounted", UNMOUNTED: "mf.unmounted", PLATFORM_HEALTH_OK: "platform.maintenance.health.ok" }), Dn = Object.freeze({ REQUEST_ROUTE_CHANGE: "mf.route.change.requested" }), Nn = Object.freeze({ INTENT: "nav.intent", INTENT_RECEIVED: "nav.intent.received", INTENT_RESOLVED: "nav.intent.resolved", INTENT_BLOCKED: "nav.intent.blocked", INTENT_ERROR: "nav.intent.error", NAVIGATE_START: "nav.navigate.start", NAVIGATE_SUCCESS: "nav.navigate.success", NAVIGATE_BLOCKED: "nav.navigate.blocked", NAVIGATE_ERROR: "nav.navigate.error", NAVIGATE_PATH: "nav.navigate.path", NAVRAIL_EDIT: "nav.navrail.edit", BROKER_READY: "nav.broker.ready" }), Sn = Object.freeze({ NAVIGATE: "nav.intent", GO_TO_PATH: "nav.navigate.path", EDIT_NAVRAIL: "nav.navrail.edit" }), At = Object.freeze({
  // Lifecycle
  READY: "navigation.ready",
  INITIALIZED: "navigation.initialized",
  DESTROYED: "navigation.destroyed",
  DEGRADED: "navigation.degraded",
  // Section Events
  SECTION_TOGGLE: "navigation.section.toggle",
  SECTION_EXPANDED: "navigation.section.expanded",
  SECTION_COLLAPSED: "navigation.section.collapsed",
  // Item Events
  ITEM_SELECTED: "navigation.item.selected",
  ITEM_BLOCKED: "navigation.item.blocked",
  ITEM_HOVER: "navigation.item.hover",
  // State Events
  STATE_CHANGED: "navigation.state.changed",
  STATE_SYNC: "navigation.state.sync",
  STATE_RESTORED: "navigation.state.restored",
  STATE_PERSISTED: "navigation.state.persisted",
  // Model Events (from NavigationModelLoader)
  MODEL_LOAD_START: "navigation.model.load.start",
  MODEL_LOAD_SUCCESS: "navigation.model.load.success",
  MODEL_LOAD_FALLBACK: "navigation.model.load.fallback",
  MODEL_LOAD_FAIL: "navigation.model.load.fail",
  MODEL_CACHE_HIT: "navigation.model.cache.hit",
  MODEL_CACHE_STALE: "navigation.model.cache.stale",
  MODEL_UPDATED: "navigation.model.updated",
  // Error Events
  ERROR: "navigation.error"
}), pn = Object.freeze({
  // Section Intents
  TOGGLE_SECTION: "navigation.section.toggle.request",
  EXPAND_SECTION: "navigation.section.expand.request",
  COLLAPSE_SECTION: "navigation.section.collapse.request",
  // Item Intents
  SELECT_ITEM: "navigation.item.select.request",
  NAVIGATE_TO: "navigation.navigate.request",
  // State Intents
  RESTORE_STATE: "navigation.state.restore.request",
  PERSIST_STATE: "navigation.state.persist.request",
  RESET_STATE: "navigation.state.reset.request",
  // Mode Intents
  SET_MODE: "navigation.mode.set.request"
}), mn = Object.freeze({
  // Events
  "navigation.ready": "sidebar.accordion.ready",
  "navigation.section.toggle": "sidebar.accordion.section.toggled",
  "navigation.item.selected": "sidebar.accordion.item.selected",
  "navigation.item.blocked": "sidebar.accordion.item.blocked",
  "navigation.state.changed": "sidebar.accordion.state.changed",
  "navigation.state.persisted": "sidebar.accordion.persist.ok",
  "navigation.state.restored": "sidebar.accordion.restore.ok",
  "navigation.error": "sidebar.accordion.error",
  // Intents
  "navigation.section.toggle.request": "sidebar.accordion.toggle_section.request",
  "navigation.section.expand.request": "sidebar.accordion.expand_section.request",
  "navigation.section.collapse.request": "sidebar.accordion.collapse_section.request",
  "navigation.item.select.request": "sidebar.accordion.select_item.request",
  "navigation.state.restore.request": "sidebar.accordion.restore_state.request",
  "navigation.state.persist.request": "sidebar.accordion.persist_state.request",
  "navigation.mode.set.request": "sidebar.accordion.set_mode.request"
}), gn = Object.freeze({
  // Reverse mapping
  "sidebar.accordion.ready": "navigation.ready",
  "sidebar.accordion.section.toggled": "navigation.section.toggle",
  "sidebar.accordion.item.selected": "navigation.item.selected",
  "sidebar.accordion.item.blocked": "navigation.item.blocked",
  "sidebar.accordion.state.changed": "navigation.state.changed",
  "sidebar.accordion.persist.ok": "navigation.state.persisted",
  "sidebar.accordion.restore.ok": "navigation.state.restored",
  "sidebar.accordion.error": "navigation.error"
}), Ln = Object.freeze({ READY: "navrail.ready", MOUNTED: "navrail.mounted", UNMOUNTED: "navrail.unmounted", COMPONENTS_MOUNTED: "navrail.components.mounted", BUTTON_MOUNTED: "navrail.button.mounted", BUTTON_UNMOUNTED: "navrail.button.unmounted", BUTTON_CLICKED: "navrail.button.clicked", NAVIGATION_REQUESTED: "navrail.navigation.requested", REORDER: "navrail.admin.reorder" }), hn = Object.freeze({ SHOW: "navrail.show.request", HIDE: "navrail.hide.request", TOGGLE: "navrail.toggle.request", REORDER: "navrail.reorder.request" }), fn = Object.freeze({ STATUS_CHANGED: "network.status:changed", ONLINE: "network.online", OFFLINE: "network.offline", QUALITY_CHANGED: "network.quality:changed", LATENCY_MEASURED: "network.latency:measured", BANDWIDTH_MEASURED: "network.bandwidth:measured", INIT: "network.init", READY: "network.ready", SHUTDOWN: "network.shutdown", ERROR: "network.error" }), Cn = Object.freeze({ MEASURE_LATENCY: "network.latency.measure.request", MEASURE_BANDWIDTH: "network.bandwidth.measure.request", RUN_DIAGNOSTICS: "network.diagnostics.request" }), bn = Object.freeze({ KERNEL_READY: "overlay-kernel.ready", KERNEL_SHUTDOWN: "overlay-kernel.shutdown", KERNEL_OPENED: "overlay-kernel.opened", KERNEL_CLOSED: "overlay-kernel.closed", ADAPTER_REGISTERED: "overlay-kernel.adapter-registered", ADAPTER_ENABLED: "overlay-kernel.adapter-enabled", ADAPTER_DISABLED: "overlay-kernel.adapter-disabled", QUEUE_SHOW: "overlay.queue-show", QUEUE_CLOSE: "overlay.queue-close", QUEUE_CLEARED: "overlay.queue-cleared", PERFORMANCE: "overlay.performance", RECOVERY: "overlay.recovery", VIOLATION: "overlay.violation", CSP_VIOLATION: "overlay.csp-violation", REDUCED_MOTION_CHANGE: "overlay.reduced-motion-change", OPENED: "overlay.opened", CLOSED: "overlay.closed", ERROR: "overlay.error" }), vn = Object.freeze({ OPEN: "overlay.open.request", CLOSE: "overlay.close.request", CLEAR_QUEUE: "overlay.queue.clear.request" }), yn = Object.freeze({ LOADING: "panel.loader.loading", LOADED: "panel.loader.loaded", UNLOADED: "panel.loader.unloaded", ERROR: "panel.loader.error", CACHE_HIT: "panel.loader.cache.hit" }), Un = Object.freeze({ LOAD: "panel.loader.load.request", UNLOAD: "panel.loader.unload.request", RELOAD: "panel.loader.reload.request" }), Mn = Object.freeze({ MOUNT_REQUEST: "panel.mount.request", MOUNTED: "panel.mounted", UNMOUNT_REQUEST: "panel.unmount.request", UNMOUNTED: "panel.unmounted", INIT: "panel.init", LOAD_REQUEST: "panel.load.request", LOADED: "panel.loaded", LOAD_FAILED: "panel.load.failed", REFRESH_REQUEST: "panel.refresh.request", REFRESHED: "panel.refreshed", FILTER_CHANGE: "panel.filter.change", READY: "panel.ready", ERROR: "panel.error", DEGRADED: "panel.degraded", REQUEST: "panel.request", UPDATED: "panel.updated", DATA_LOADED: "panel.data.loaded", DATA_ERROR: "panel.data.error", DATA_UPDATED: "panel.data.updated", DATA_CLEARED: "panel.data.cleared", AUTH_REQUIRED: "panel.auth-required", OPEN_REQUEST: "panel.open.request", OPENED: "panel.opened", OPEN: "panel.open", CLOSE_REQUEST: "panel.close.request", CLOSED: "panel.closed", CLOSE: "panel.close", REGISTRY_COMPLETE: "panel.registry.complete", RENDERED: "panel.rendered", ACTION: "panel.action", PANEL_05_TELEMETRY: "panel-05.telemetry", LOTTIE_PREVIEW: "lottie.preview", LOTTIE_ASSIGNED: "lottie.assigned", LOADING: "panel.loading", MOUNTING: "panel.mounting", UNMOUNTING: "panel.unmounting", VIEW_CHANGED: "panel.view.changed", TELEMETRY: "panel.telemetry", FAVORITO_CHANGED: "panel.favorito.changed", FILTER_CHANGED: "panel.filter.changed", REFRESH_START: "panel.refresh.start", REFRESH_DONE: "panel.refresh.done", REFRESH_ERROR: "panel.refresh.error", METRIC_CPU_WARNING: "panel.metric.cpu.warning", METRIC_CPU_CRITICAL: "panel.metric.cpu.critical", METRIC_RAM_WARNING: "panel.metric.ram.warning", METRIC_RAM_CRITICAL: "panel.metric.ram.critical", METRIC_DISK_WARNING: "panel.metric.disk.warning", METRIC_DISK_CRITICAL: "panel.metric.disk.critical", DATA_REFRESH: "panel.data.refresh", REFRESH: "panel.refresh" }), Pn = Object.freeze({ MOUNT: "panel.mount.request", UNMOUNT: "panel.unmount.request", LOAD: "panel.load.request", REFRESH: "panel.refresh.request", FILTER_CHANGE: "panel.filter.change", OPEN: "panel.open.request", CLOSE: "panel.close.request" }), Hn = Object.freeze({ INIT: "performance.init", READY: "performance.ready", CLS: "performance.cls", FID: "performance.fid", LCP: "performance.lcp", FCP: "performance.fcp", TTFB: "performance.ttfb", VIOLATION: "performance.violation", WARNING: "performance.warning", UPDATE: "performance.update", DEGRADE_MODE: "performance.degrade.mode", NORMAL_MODE: "performance.normal.mode", BUDGET_EXCEEDED: "performance.budget.exceeded", BUDGET_OK: "performance.budget.ok", METRIC_RECORDED: "performance.metric.recorded", THRESHOLD_EXCEEDED: "performance.threshold.exceeded", FPS_DROP: "performance.fps.drop", MEMORY_WARNING: "performance.memory.warning" }), Gn = Object.freeze({ RECORD_METRIC: "performance.metric.record.request", ENABLE_DEGRADE_MODE: "performance.degrade.enable.request", DISABLE_DEGRADE_MODE: "performance.degrade.disable.request" }), Vn = Object.freeze({ SAVED: "persistence.saved", LOADED: "persistence.loaded", CLEARED: "persistence.cleared", ERROR: "persistence.error", REHYDRATION_STARTED: "persistence.rehydration.started", REHYDRATION_COMPLETED: "persistence.rehydration.completed", REHYDRATION_ERROR: "persistence.rehydration.error", REHYDRATION_SKIPPED: "persistence.rehydration.skipped", SNAPSHOT_CREATED: "persistence.snapshot.created", SNAPSHOT_SAVED: "persistence.snapshot.saved", SNAPSHOT_LOADED: "persistence.snapshot.loaded", SNAPSHOT_ERROR: "persistence.snapshot.error", SNAPSHOT_EXPIRED: "persistence.snapshot.expired", SNAPSHOT_INVALID: "persistence.snapshot.invalid", SNAPSHOT_INTEGRITY_FAILED: "persistence.snapshot.integrity.failed", EXPORT_STARTED: "persistence.export.started", EXPORT_COMPLETED: "persistence.export.completed", EXPORT_ERROR: "persistence.export.error", IMPORT_STARTED: "persistence.import.started", IMPORT_COMPLETED: "persistence.import.completed", IMPORT_ERROR: "persistence.import.error", IMPORT_REJECTED: "persistence.import.rejected", IMPORT_DRYRUN_COMPLETED: "persistence.import.dryrun.completed", VERSION_CREATED: "persistence.version.created", VERSION_RESTORED: "persistence.version.restored", VERSION_MISMATCH: "persistence.version.mismatch", MIGRATION_STARTED: "persistence.migration.started", MIGRATION_COMPLETED: "persistence.migration.completed", MIGRATION_ERROR: "persistence.migration.error", TIMELINE_CLEARED: "persistence.timeline.cleared", TIMELINE_UPDATED: "persistence.timeline.updated", REPLAY_STARTED: "persistence.replay.started", REPLAY_COMPLETED: "persistence.replay.completed", REPLAY_ERROR: "persistence.replay.error", AUDIT_RECORDED: "persistence.audit.recorded", AUDIT_CLEARED: "persistence.audit.cleared", ACTION_HUB_EXECUTING: "persistence.action.hub.executing", ACTION_HUB_EXECUTED: "persistence.action.hub.executed", ACTION_HUB_ERROR: "persistence.action.hub.error" }), wn = Object.freeze({ SAVE: "persistence.save.request", LOAD: "persistence.load.request", CLEAR: "persistence.clear.request", CREATE_SNAPSHOT: "persistence.snapshot.create.request", RESTORE_SNAPSHOT: "persistence.snapshot.restore.request", EXPORT: "persistence.export.request", IMPORT: "persistence.import.request", REPLAY: "persistence.replay.request" }), kn = Object.freeze({ AUDIT: "plugin.audit", REGISTER: "plugin.register", UNREGISTER: "plugin.unregister", INIT: "plugin.init", SUSPEND: "plugin.suspend", RESUME: "plugin.resume", ERROR: "plugin.error", HOOK_TRIGGERED: "plugin.hook.triggered" }), Bn = Object.freeze({ REGISTER: "plugin.register.request", UNREGISTER: "plugin.unregister.request", SUSPEND: "plugin.suspend.request", RESUME: "plugin.resume.request" }), qn = Object.freeze({ SAVED: "preferences.saved", RESET: "preferences.reset", CHANGED: "preferences.changed", CUSTOM_COLOR_PREVIEW: "preferences.custom-color.preview", CUSTOM_THEME_SET: "preferences.custom-theme.set", DENSITY_APPLIED: "preferences.density.applied", DENSITY_ERROR: "preferences.density.error" }), Fn = Object.freeze({ SAVE: "preferences.save.request", RESET: "preferences.reset.request", SET_DENSITY: "preferences.density.set.request", PREVIEW_DENSITY: "preferences.density.preview.request", CANCEL_DENSITY_PREVIEW: "preferences.density.preview.cancel.request" }), Yn = Object.freeze({ COMPACT: "compact", COMFORTABLE: "comfortable", SPACIOUS: "spacious" }), zn = Object.freeze({ READY: "saved-views.ready", ERROR: "saved-views.error", LIST: "saved-views.list", LOADED: "saved-views.loaded", CREATED: "saved-views.created", UPDATED: "saved-views.updated", REMOVED: "saved-views.removed", APPLY: "saved-views.apply", DEFAULT_CHANGED: "saved-views.default-changed" }), Wn = Object.freeze({ READY: "SavedViewsManager inicializado", ERROR: "Erro em operação", LIST: "Lista de views atualizada", LOADED: "View carregada", CREATED: "Nova view criada", UPDATED: "View atualizada", REMOVED: "View removida", APPLY: "View aplicada", DEFAULT_CHANGED: "View padrão alterada" }), jn = Object.freeze({ SESSION_TERMINATED: "session-admin.session:terminated", SESSION_TERMINATE_ALL: "session-admin.session:terminate-all" }), Kn = Object.freeze({ UPDATED: "setting_updated", CREATED: "setting_created", DELETED: "setting_deleted", BULK_UPDATED: "settings_bulk_updated", MOUNTED: "mounted" }), xn = Object.freeze({ READY: "sidebar.ready", INITIALIZED: "sidebar.initialized", DESTROYED: "sidebar.destroyed", DEGRADED: "sidebar.degraded", NAV_DATA_CHANGED: "sidebar.nav:data-changed", NAV_RELOAD: "sidebar.nav:reload", REGISTRY_RELOAD: "sidebar.registry:reload", REGISTRY_LOADED: "sidebar.registry.loaded", REGISTRY_UPDATED: "sidebar.registry.updated", REGISTRY_ERROR: "sidebar.registry.error", ITEM_CLICK: "sidebar.item.click", ITEM_HOVER: "sidebar.item.hover", NAVIGATE: "sidebar.navigate", TOGGLE: "sidebar.toggle", ITEMS_LOADED: "sidebar.items.loaded", SEARCH_RESULTS: "sidebar.search.results", SEARCH: "sidebar.search", SEARCH_CLEAR: "sidebar.search.clear", NOTIFICATION_CLEAR: "sidebar.notification.clear", BADGES_INITIALIZED: "sidebar.badges.initialized", BADGE_UPDATED: "sidebar.badge.updated", BADGE_REMOVED: "sidebar.badge.removed", BADGE_INCREMENTED: "sidebar.badge.incremented", MINI_INITIALIZED: "sidebar.mini.initialized", MINI_ENABLED: "sidebar.mini.enabled", MINI_DISABLED: "sidebar.mini.disabled", RESIZE_INITIALIZED: "sidebar.resize.initialized", RESIZE: "sidebar.resize", RESIZE_RESET: "sidebar.resize.reset", RESIZE_END: "sidebar.resize.end", QUICK_SWITCHER_INITIALIZED: "sidebar.quickswitcher.initialized", GLASSMORPHISM_INITIALIZED: "sidebar.glassmorphism.initialized", REALTIME_INITIALIZED: "sidebar.realtime.initialized", REALTIME_CONNECTED: "sidebar.realtime.connected", REALTIME_DISCONNECTED: "sidebar.realtime.disconnected", REALTIME_ERROR: "sidebar.realtime.error", REALTIME_RECONNECTING: "sidebar.realtime.reconnecting", REALTIME_MAX_RECONNECTS: "sidebar.realtime.maxreconnects", NOTIFICATION: "sidebar.notification", UPDATE_BADGE: "sidebar.updatebadge", CONFETTI_INITIALIZED: "sidebar.confetti.initialized", VOICE_INITIALIZED: "sidebar.voice.initialized", VOICE_STARTED: "sidebar.voice.started", VOICE_ENDED: "sidebar.voice.ended", VOICE_RESULT: "sidebar.voice.result", VOICE_ERROR: "sidebar.voice.error", VOICE_UNKNOWN: "sidebar.voice.unknown", VOICE_NAVIGATED: "sidebar.voice.navigated", VOICE_NOT_FOUND: "sidebar.voice.notfound", CONFIG_INITIALIZED: "sidebar.config.initialized", SUBMENU_INITIALIZED: "sidebar.submenu.initialized", SUBMENU_TOGGLED: "sidebar.submenu.toggled", DOTS_INITIALIZED: "sidebar.dots.initialized", DOT_SHOWN: "sidebar.dot.shown", DOT_HIDDEN: "sidebar.dot.hidden", HISTORY_INITIALIZED: "sidebar.history.initialized", FUZZY_INITIALIZED: "sidebar.fuzzy.initialized", KEYBOARD_INITIALIZED: "sidebar.keyboard.initialized", HIGHLIGHT_INITIALIZED: "sidebar.highlight.initialized", HIGHLIGHTS_APPLIED: "sidebar.highlights.applied", STORYBOOK_INITIALIZED: "sidebar.storybook.initialized", CONTEXT_INITIALIZED: "sidebar.context.initialized", A11Y_INITIALIZED: "sidebar.a11y.initialized", VIRTUAL_INITIALIZED: "sidebar.virtual.initialized", VIRTUAL_ENABLED: "sidebar.virtual.enabled", VIRTUAL_DISABLED: "sidebar.virtual.disabled", VIRTUAL_UPDATED: "sidebar.virtual.updated", PINNED_INITIALIZED: "sidebar.pinned.initialized", ITEM_PINNED: "sidebar.item.pinned", ITEM_UNPINNED: "sidebar.item.unpinned", PINNED_CLEARED: "sidebar.pinned.cleared", FLAGS_INITIALIZED: "sidebar.flags.initialized", FEATURE_ENABLED: "sidebar.feature.enabled", FEATURE_DISABLED: "sidebar.feature.disabled", FEATURE_TOGGLED: "sidebar.feature.toggled", FEATURES_RESET: "sidebar.features.reset", FEATURES_BULK_UPDATED: "sidebar.features.bulkupdated", I18N_INITIALIZED: "sidebar.i18n.initialized", LOCALE_CHANGED: "sidebar.locale.changed", EVENT_SETUP_INITIALIZED: "sidebar.eventsetup.initialized", MEMORY_INITIALIZED: "sidebar.memory.initialized", MEMORY_GC: "sidebar.memory.gc", SEARCH_INITIALIZED: "sidebar.search.initialized", KERNEL_READY: "sidebar.kernel.ready", KERNEL_SHUTDOWN: "sidebar.kernel.shutdown", KERNEL_FEATURE_REGISTERED: "sidebar.kernel.feature.registered", KERNEL_FEATURE_ENABLED: "sidebar.kernel.feature.enabled", KERNEL_FEATURE_DISABLED: "sidebar.kernel.feature.disabled", KERNEL_FEATURE_UNREGISTERED: "sidebar.kernel.feature.unregistered", OFFLINE_INITIALIZED: "sidebar.offline.initialized", ONLINE: "sidebar.online", OFFLINE: "sidebar.offline", SYNC_START: "sidebar.sync.start", SYNC_COMPLETE: "sidebar.sync.complete", SYNC_ERROR: "sidebar.sync.error", QUICK_ACTIONS_INITIALIZED: "sidebar.quickactions.initialized", QUICK_ACTION: "sidebar.quickaction", COMPACT_INITIALIZED: "sidebar.compact.initialized", COMPACT_ENABLED: "sidebar.compact.enabled", COMPACT_DISABLED: "sidebar.compact.disabled", FILTERS_INITIALIZED: "sidebar.filters.initialized", FILTERS_CHANGED: "sidebar.filters.changed", FILTERS_CLEARED: "sidebar.filters.cleared", ROUTER_SYNCED: "sidebar.router.synced", ROUTER_SYNC_INITIALIZED: "sidebar.routersync.initialized", RELOAD_NAVIGATION: "sidebar.reload.navigation", NAVIGATION_RELOADED: "sidebar.navigation.reloaded", NAV_CACHE_INITIALIZED: "sidebar.navcache.initialized", NAV_CACHED: "sidebar.nav.cached", SHORTCUTS_INITIALIZED: "sidebar.shortcuts.initialized", SHORTCUT_TRIGGERED: "sidebar.shortcut.triggered", PREFETCH_INITIALIZED: "sidebar.prefetch.initialized", PREFETCH_PANEL: "sidebar.prefetch.panel", FAVORITES_INITIALIZED: "sidebar.favorites.initialized", FAVORITE_ADDED: "sidebar.favorite.added", FAVORITE_REMOVED: "sidebar.favorite.removed", FAVORITES_CLEARED: "sidebar.favorites.cleared", TIME_TRACKING_INITIALIZED: "sidebar.timetracking.initialized", TIME_TRACKED: "sidebar.time.tracked", DEBUG_PANEL_INITIALIZED: "sidebar.debugpanel.initialized", MOST_VISITED_INITIALIZED: "sidebar.mostvisited.initialized", CRITICAL_CSS_INJECTED: "sidebar.criticalcss.injected", PRELOAD_CSS_INITIALIZED: "sidebar.preloadcss.initialized", ANIMATED_TRANSITIONS_INITIALIZED: "sidebar.animatedtransitions.initialized", PARALLAX_INITIALIZED: "sidebar.parallax.initialized", THEME_HANDLER_INITIALIZED: "sidebar.themehandler.initialized", THEME_CHANGED: "sidebar.theme.changed", CUSTOM_CURSORS_INITIALIZED: "sidebar.customcursors.initialized", MOBILE_HANDLER_INITIALIZED: "sidebar.mobilehandler.initialized", MOBILE_CHANGED: "sidebar.mobile.changed", MOBILE_OPENED: "sidebar.mobile.opened", MOBILE_CLOSED: "sidebar.mobile.closed", BREADCRUMB_INITIALIZED: "sidebar.breadcrumb.initialized", AUTO_THEME_INITIALIZED: "sidebar.autotheme.initialized", DRAG_DROP_INITIALIZED: "sidebar.dragdrop.initialized", REORDERED: "sidebar.reordered", ORDER_RESET: "sidebar.order.reset", CUSTOM_ICONS_INITIALIZED: "sidebar.customicons.initialized", PROGRESS_INITIALIZED: "sidebar.progress.initialized", USAGE_ANALYTICS_INITIALIZED: "sidebar.usageanalytics.initialized", HISTORY_NAVIGATION_INITIALIZED: "sidebar.historynavigation.initialized", HISTORY_CHANGED: "sidebar.history.changed", HISTORY_BACK: "sidebar.history.back", HISTORY_FORWARD: "sidebar.history.forward", HISTORY_CLEARED: "sidebar.history.cleared", COMMAND_PALETTE_INITIALIZED: "sidebar.commandpalette.initialized", COMMAND_PALETTE_OPENED: "sidebar.commandpalette.opened", COMMAND_PALETTE_CLOSED: "sidebar.commandpalette.closed", COMMAND_PALETTE_EXECUTED: "sidebar.commandpalette.executed", SCREEN_READER_INITIALIZED: "sidebar.screenreader.initialized", ERROR: "sidebar.error" }), $n = Object.freeze({ NAVIGATE: "sidebar.navigate.request", TOGGLE: "sidebar.toggle.request", COLLAPSE: "sidebar.collapse.request", EXPAND: "sidebar.expand.request", MINI_ENABLE: "sidebar.mini.enable.request", MINI_DISABLE: "sidebar.mini.disable.request", RESIZE: "sidebar.resize.request", SEARCH: "sidebar.search.request", TOGGLE_SECTION: "sidebar.accordion.toggle_section.request", EXPAND_SECTION: "sidebar.accordion.expand_section.request", COLLAPSE_SECTION: "sidebar.accordion.collapse_section.request", SELECT_ITEM: "sidebar.accordion.select_item.request", ATTEMPT_BLOCKED: "sidebar.accordion.attempt_blocked", SET_MODE: "sidebar.accordion.set_mode.request", RESTORE_STATE: "sidebar.accordion.restore_state.request", PERSIST_STATE: "sidebar.accordion.persist_state.request" }), It = Object.freeze({ READY: "sidebar.accordion.ready", STATE_CHANGED: "sidebar.accordion.state.changed", SECTION_TOGGLED: "sidebar.accordion.section.toggled", ITEM_SELECTED: "sidebar.accordion.item.selected", ITEM_BLOCKED: "sidebar.accordion.item.blocked", PERSIST_OK: "sidebar.accordion.persist.ok", PERSIST_FAIL: "sidebar.accordion.persist.fail", RESTORE_OK: "sidebar.accordion.restore.ok", RESTORE_FAIL: "sidebar.accordion.restore.fail", ERROR: "sidebar.accordion.error" }), Qn = Object.freeze({ TOGGLE_SECTION: "sidebar.accordion.toggle_section.request", EXPAND_SECTION: "sidebar.accordion.expand_section.request", COLLAPSE_SECTION: "sidebar.accordion.collapse_section.request", SELECT_ITEM: "sidebar.accordion.select_item.request", ATTEMPT_BLOCKED: "sidebar.accordion.attempt_blocked", SET_MODE: "sidebar.accordion.set_mode.request", RESTORE_STATE: "sidebar.accordion.restore_state.request", PERSIST_STATE: "sidebar.accordion.persist_state.request" }), Zn = Object.freeze({ REGISTERED: "sw.registered", UNREGISTERED: "sw.unregistered", UPDATE_AVAILABLE: "sw.update:available", UPDATE_APPLIED: "sw.update:applied", UPDATE_FAILED: "sw.update:failed", INIT: "sw.init", READY: "sw.ready", SHUTDOWN: "sw.shutdown", CACHE_CLEARED: "sw.cache:cleared", ERROR: "sw.error" }), Xn = Object.freeze({ REGISTER: "sw.register.request", UPDATE: "sw.update.request", CLEAR_CACHE: "sw.cache.clear.request" }), Jn = Object.freeze({ SELECTION_CHANGED: "table.selection.changed", ROW_SELECTED: "table.row.selected", ROW_DESELECTED: "table.row.deselected", ALL_SELECTED: "table.all.selected", ALL_DESELECTED: "table.all.deselected", VIEW: "table.view", VIEW_CHANGE: "table.view.change", RENDER: "table.render", RENDERED: "table.rendered", DATA_LOADED: "table.data.loaded", DATA_UPDATED: "table.data.updated", LOAD_MORE: "table.load.more", INFINITE_LOADED: "table.infinite.loaded", FILTERED: "table.filtered", FILTERS_CHANGE: "table.filters.change", QUICKFILTERS_CHANGE: "table.quickfilters.change", ROW_EDIT: "table.row.edit", ROW_SAVE: "table.row.save", ROW_DELETE: "table.row.delete", ROW_VIEW: "table.row.view", DELETE: "table.delete", BULK_DELETE: "table.bulk.delete", SAVE_ALL: "table.save.all", TOGGLE_FAVORITE: "table.toggle.favorite", CELL_EDIT: "table.cell.edit", CELL_SAVE: "table.cell.save", CELL_CANCEL: "table.cell.cancel", CELL_COPY: "table.cell.copy", DIRTY_CHANGE: "table.dirty.change", EDIT: "table.edit", COLUMN_REORDER: "table.column.reorder", COLUMN_RESIZE: "table.column.resize", COLUMN_SORT: "table.column.sort", COLUMN_VISIBILITY: "table.column.visibility", SCROLL: "table.scroll", SCROLL_END: "table.scroll.end", SCROLL_MODE_CHANGE: "table.scroll.mode.change", PAGE: "table.page", PAGE_CHANGE: "table.page.change", EXPORT: "table.export", EXPORTED: "table.exported", EXPORT_ERROR: "table.export.error", SEARCH: "table.search", SEARCH_CHANGE: "table.search.change", CONTEXT_MENU: "table.context.menu", CONTEXT_ACTION: "table.context.action", SWIPE: "table.swipe", SWIPE_LEFT: "table.swipe.left", SWIPE_RIGHT: "table.swipe.right", BREAKPOINT_CHANGE: "table.breakpoint.change", HISTORY_CHANGE: "table.history.change", UNDO: "table.undo", REDO: "table.redo", TOAST: "table.toast" }), es = Object.freeze({ SELECT_ROW: "table.row.select.request", VIEW_ROW: "table.row.view.request", EDIT_ROW: "table.row.edit.request", DELETE_ROW: "table.row.delete.request", TOGGLE_FAVORITE: "table.row.favorite.toggle.request", BULK_DELETE: "table.bulk.delete.request", BULK_SELECT: "table.bulk.select.request", EXPORT: "table.export.request", FILTER: "table.filter.request", SORT: "table.sort.request", SEARCH: "table.search.request", LOAD_MORE: "table.load.more.request", COPY_CELL: "table.cell.copy.request", REORDER_COLUMNS: "table.columns.reorder.request", RESIZE_COLUMN: "table.column.resize.request" }), ts = Object.freeze({ CHANGED: "theme.changed", APPLIED: "theme.applied", REQUEST: "theme.request", PREVIEW_ACTIVE: "theme.preview.active", PREVIEW_CANCELLED: "theme.preview.cancelled", ERROR: "theme.error" }), rs = Object.freeze({ SET_THEME: "theme.set.request", SET_ACCENT: "theme.accent.set.request", TOGGLE_THEME: "theme.toggle.request", PREVIEW_THEME: "theme.preview.request", CANCEL_PREVIEW: "theme.preview.cancel.request" }), os = Object.freeze({ MOUNTED: "ticker.mounted", UNMOUNTED: "ticker.unmounted", AUTH_PAUSED: "ticker.auth.paused", AUTH_RESUMED: "ticker.auth.resumed", VISIBILITY_PAUSED: "ticker.visibility.paused", VISIBILITY_RESUMED: "ticker.visibility.resumed", NEWS_LOADED: "ticker.news.loaded", NEWS_ERROR: "ticker.news.error", CONFIG_SAVE: "ticker.config.save", CONFIG_SAVED: "ticker.config.saved", CONFIG_RESET: "ticker.config.reset", CONFIG_CANCEL: "ticker.config.cancel", CONFIG_APPLY_SESSION: "ticker.config.apply-session", CONFIG_APPLIED_SESSION: "ticker.config.applied-session", CONFIG_PRESET_APPLY: "ticker.config.preset.apply", CONFIG_PRESET_APPLIED: "ticker.config.preset.applied", CONFIG_APPLIED: "ticker.config.applied", REFRESH_MANUAL: "ticker.refresh.manual", REFRESH_AUTO: "ticker.refresh.auto", SETTINGS_OPEN: "ticker.settings.open", SETTINGS_CLOSE: "ticker.settings.close", SETTINGS_REQUEST_CONFIG: "ticker.settings.request-config", CONFIG_DATA: "ticker.config.data", BEHAVIOR_UPDATED: "ticker.behavior.updated", CONTENT_UPDATED: "ticker.content.updated", VISUAL_UPDATED: "ticker.visual.updated" }), as = Object.freeze({ SAVE_CONFIG: "Persistir configurações do ticker", RESET_CONFIG: "Restaurar configurações padrão", CANCEL_CONFIG: "Cancelar alterações de configuração", APPLY_SESSION: "Aplicar configuração apenas na sessão", APPLY_PRESET: "Aplicar preset de configuração", MANUAL_REFRESH: "Atualização manual pelo usuário", AUTO_REFRESH: "Atualização automática por polling", OPEN_SETTINGS: "Abrir painel de configurações", CLOSE_SETTINGS: "Fechar painel de configurações", UPDATE_BEHAVIOR: "Notificar mudança de comportamento", UPDATE_CONTENT: "Notificar mudança de conteúdo", UPDATE_VISUAL: "Notificar mudança visual" }), ns = Object.freeze({ UNDO: "uarps.undo", REDO: "uarps.redo", MODAL_SHOW: "uarps.modal:show", MODAL_HIDE: "uarps.modal:hide", USER_SELECTED: "uarps.user:selected", PERMISSIONS_CHANGED: "permissions.changed" });
new Set(Object.values(At));
new Set(Object.values(It));
new Set(Object.values(At));
new Set(Object.values(It));
const ss = "2.5.0-P03-BOOT-SAFE", is = "enterprise-strict-mode";
export {
  Ha as ACCESSIBILITY_EVENTS,
  Ga as ACCESSIBILITY_INTENTS,
  It as ACCORDION_EVENTS,
  Qn as ACCORDION_INTENTS,
  wa as ACTION_EVENTS,
  ka as ACTION_INTENTS,
  Ba as ANALYTICS_EVENTS,
  qa as ANALYTICS_INTENTS,
  Va as ANNOUNCE_PRIORITY,
  Fa as API_EVENTS,
  po as APP_EVENTS,
  mo as APP_INTENTS,
  go as ASSET_EVENTS,
  Lo as ASSET_INTENTS,
  Ya as AUDIT_TRAIL_EVENTS,
  bo as AUTH_DATA_ATTRIBUTES,
  ho as AUTH_EVENTS,
  fo as AUTH_INTENTS,
  Co as AUTH_STATES,
  g as BOOT_EVENTS,
  Uo as BOOT_INTENTS,
  gn as BRIDGE_FROM_ACCORDION,
  mn as BRIDGE_TO_ACCORDION,
  za as CACHE_EVENTS,
  Wa as CACHE_INTENTS,
  ja as CARD_EVENTS,
  Ka as CARD_INTENTS,
  xa as CAROUSEL_EVENTS,
  $a as CHARTS_EVENTS,
  Qa as COMMAND_EVENTS,
  Za as COMMAND_INTENTS,
  La as COMPONENT_EVENTS,
  ha as COMPONENT_INTENTS,
  Xa as CONTAINER_EVENTS,
  Ja as CONTAINER_INTENTS,
  pt as CONTEXT_EVENTS,
  oa as CONTEXT_INTENTS,
  Mo as CORE_EVENTS,
  Po as CORE_INTENTS,
  Ho as DEGRADATION_EVENTS,
  Yn as DENSITY_VALUES,
  en as DEVICE_EVENTS,
  tn as DEVICE_INTENTS,
  rn as ERROR_BOUNDARY_EVENTS,
  on as ERROR_BOUNDARY_INTENTS,
  Go as ERROR_EVENTS,
  Vo as ERROR_INTENTS,
  an as EXTERNAL_EVENTS,
  nn as EXTERNAL_INTENTS,
  v as EnterpriseViolationError,
  wo as FEATURE_FLAGS_EVENTS,
  sn as FOOTER_EVENTS,
  En as FOOTER_INTENTS,
  St as GLOBAL_STATE_EVENTS,
  ra as GLOBAL_STATE_INTENTS,
  y as GOVERNANCE_EVENTS,
  fa as GOVERNANCE_INTENTS,
  x as GOVERNANCE_RULES,
  Ca as GOVERNANCE_THRESHOLDS,
  ln as HEADER_EVENTS,
  dn as HEADER_INTENTS,
  cn as KERNEL_RUNTIME_EVENTS,
  un as KERNEL_RUNTIME_INTENTS,
  Ma as LAYOUT_EVENTS,
  Pa as LAYOUT_INTENTS,
  ia as LEGACY_ALIASES,
  ca as LEGACY_UI_EVENTS,
  ko as LIFECYCLE_EVENTS,
  Bo as LIFECYCLE_INTENTS,
  vo as LOGIN_MODAL_EVENTS,
  yo as LOGIN_MODAL_INTENTS,
  qo as LOG_EVENTS,
  Fo as LOG_INTENTS,
  Tn as LOTTIE_EVENTS,
  On as MAIN_EVENTS,
  _n as MAIN_INTENTS,
  Rn as MANIFEST_EVENTS,
  An as MANIFEST_INTENTS,
  In as MF_EVENTS,
  Dn as MF_INTENTS,
  is as MODULE_ID,
  At as NAVIGATION_EVENTS,
  pn as NAVIGATION_INTENTS,
  Ln as NAVRAIL_EVENTS,
  hn as NAVRAIL_INTENTS,
  Nn as NAV_EVENTS,
  Sn as NAV_INTENTS,
  fn as NETWORK_EVENTS,
  Cn as NETWORK_INTENTS,
  Yo as ORCHESTRATOR_EVENTS,
  zo as ORCHESTRATOR_INTENTS,
  bn as OVERLAY_EVENTS,
  vn as OVERLAY_INTENTS,
  mt as PANEL_16_STATE_EVENTS,
  Mn as PANEL_EVENTS,
  Pn as PANEL_INTENTS,
  yn as PANEL_LOADER_EVENTS,
  Un as PANEL_LOADER_INTENTS,
  lt as PAYLOAD_COMPAT,
  Et as PAYLOAD_VERSION,
  Hn as PERFORMANCE_EVENTS,
  Gn as PERFORMANCE_INTENTS,
  Wo as PERMISSIONS_EVENTS,
  jo as PERMISSIONS_INTENTS,
  Vn as PERSISTENCE_EVENTS,
  wn as PERSISTENCE_INTENTS,
  Ve as PHASE_DEPENDENCY_MATRIX,
  kn as PLUGIN_EVENTS,
  Bn as PLUGIN_INTENTS,
  qn as PREFERENCES_EVENTS,
  Fn as PREFERENCES_INTENTS,
  Ko as PRELOADER_EVENTS,
  xo as ROUTER_EVENTS,
  $o as ROUTER_INTENTS,
  zn as SAVED_VIEWS_EVENTS,
  Wn as SAVED_VIEWS_INTENTS,
  Qo as SECURITY_EVENTS,
  Zo as SECURITY_INTENTS,
  jn as SESSION_ADMIN_EVENTS,
  Xo as SESSION_EVENTS,
  Jo as SESSION_INTENTS,
  Kn as SETTINGS_EVENTS,
  Ye as SHELL_EVENTS,
  ea as SHELL_INTENTS,
  xn as SIDEBAR_EVENTS,
  $n as SIDEBAR_INTENTS,
  Nt as STATE_EVENTS,
  ta as STATE_INTENTS,
  Zn as SW_EVENTS,
  Xn as SW_INTENTS,
  na as SYSTEM_EVENTS,
  sa as SYSTEM_INTENTS,
  Jn as TABLE_EVENTS,
  es as TABLE_INTENTS,
  Ea as TELEMETRY_EVENTS,
  la as TELEMETRY_INTENTS,
  ts as THEME_EVENTS,
  rs as THEME_INTENTS,
  os as TICKER_EVENTS,
  as as TICKER_INTENTS,
  Qe as TRIGGER_TYPES,
  ns as UARPS_EVENTS,
  da as UI_EVENTS,
  ua as UI_INTENTS,
  ss as VERSION,
  te as VIOLATION_SEVERITY,
  Eo as VIOLATION_TO_EVENT,
  oo as aggregateHealth,
  _e as assertStrict,
  ye as clearViolations,
  Ta as createBasePorts,
  ne as createCorePorts,
  Ia as createEarlyLogger,
  Da as createEmptySnapshot,
  _a as createPanelPorts,
  Sa as createReadyPayload,
  Ra as createStatePorts,
  Aa as createTelemetryPorts,
  Oa as createUiPorts,
  Na as createUpdatedPayload,
  rt as denyWindowFallback,
  cr as destroy,
  Nr as enforceRule,
  ot as exposeDevTools,
  jt as forceReplay,
  Sr as getActiveRules,
  va as getModuleId,
  $t as getPortsSnapshot,
  U as getRecommendations,
  He as getStats,
  j as getTopViolatingModules,
  ba as getVersion,
  ya as getViolationEvent,
  W as getViolationRate,
  V as getViolations,
  P as getViolationsSummary,
  K as healthCheck,
  he as init,
  xt as injectPorts,
  ir as isAppShellReady,
  sr as isAuthReady,
  lr as isBootstrapV2Complete,
  dr as isBootstrapV2Error,
  Dr as isCompatibleVersion,
  Er as isComponentsReady,
  zt as isLoggerReady,
  Wt as isReplayed,
  Ua as isSeverityCritical,
  u as isStrict,
  _r as isValidSnapshot,
  G as recordViolation,
  eo as registerModule,
  tt as requirePort,
  pa as safeValidate,
  et as setBootReady,
  Je as setEventBusGetter,
  ve as setStrict,
  to as unregisterModule,
  ga as validateAll,
  aa as validateEventContracts,
  ma as validatePhaseAccess,
  Ir as validateReadyPayload,
  Rr as validateSnapshot,
  Ar as validateUpdatedPayload,
  or as waitForAppShell,
  rr as waitForAuth,
  nr as waitForBootstrapComplete,
  ar as waitForComponentsReady
};
