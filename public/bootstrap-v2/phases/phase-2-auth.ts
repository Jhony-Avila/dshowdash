
// Phase 2 - Authentication Enterprise
// @version 3.11.0-AUTHCONTEXT-FIX
// @changelog v3.11.0-AUTHCONTEXT-FIX: Added getAuthContext to sessionManagerAdapter — CRITICAL: orchestrator._buildAuthContext() requires this to populate roles/level/userId in auth context. Without it, all admin panels get ACCESS_DENIED
// @changelog v3.10.0-POST-LOGIN-RELOAD: Reload automático após login interativo — phases 3-5 já rodaram sem shell, reload garante boot completo com sessão válida
// @changelog v3.9.0-AUTH-REDIRECT: Integração com AuthRedirectController — redireciona usuário autenticado para fora de /login
// @changelog v3.8.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0. Fix: module → moduleId (bug de contrato)
// @changelog v3.7.0-DOMAIN-PURE - AppContext registrado via windowAdapter.expose() + window.AppContext (dual). healthCheck usa windowAdapter.get() primeiro. Dependency contract documentado
// @changelog v3.6.0-PORTSFACTORY - _log migrado para PortsFactory (elimina window.Logger)
// @changelog v3.5.0-P18EC: Migração AUTH_EVENTS.AUTH_READY → AUTH_EVENTS.READY (completar migração P18EC)
// @changelog v3.4.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.11.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via execute(ports)):
//   ports.logger           — Logger instance
//   ports.telemetry        — Telemetry tracker
//   ports.eventBusAdapter  — EventBus for auth events (AUTH_EVENTS.*)
//   ports.readyFlagsAdapter — Ready flags for 'auth' signal
//   ports.windowAdapter    — For exposing/getting globals safely
//
// CREATES (via windowAdapter.expose + window fallback):
//   AppContext.getAuth     — Auth context getter
//   AppContext.auth        — AuthAdapter reference
//
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
//   createAuthRedirectController from /core/auth/bridges/auth-redirect-controller.js
//
// BROWSER APIs (legítimo):
//   window.location.pathname/hash — Route detection for isPublicPath()
//   window.location.reload() — Post-login reload (v3.10.0)
//
// DEBUG (legítimo):
//   window.__dev.phase2 — Dev inspection
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import createPermissionsGuard from '/core/auth/permissions/permissions-guard-enterprise.js';
import createSecurityPoliciesManager from '/core/auth/policies/security-policies-enterprise.js';
import createAuthOrchestrator from '/core/auth/auth-orchestrator/auth-orchestrator.js';
import AuthAdapter, { setOrchestrator } from '/core/auth/adapters/auth-adapter-enterprise.js';
import { SessionManager } from '/components/session-manager/index.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
import { createAuthRedirectController } from '/core/auth/bridges/auth-redirect-controller.js';

var MODULE_ID = 'phase-2-auth';
var VERSION = '3.11.0-AUTHCONTEXT-FIX';

var _Ports = createCorePorts({ moduleId: MODULE_ID });

var PUBLIC_PATHS = ['/login', '/login.html', '/logout', '/logout.html', '/forgot-password', '/reset-password', '/public'];

// v3.7.0: cached windowAdapter reference for rollback/healthCheck
var _windowAdapter: Record<string, Function> | null = null;

// v3.9.0: Auth redirect controller instance
var _authRedirectController: Record<string, Function> | null = null;

function _log(level: string, ...rest: unknown[]) {
  var args = Array.prototype.slice.call(arguments, 1);
  var prefix = '[' + MODULE_ID + ']';
  var logger = _Ports.get('logger');
  if (logger) {
    if (level === 'error' && logger.error) logger.error.apply(logger, [prefix].concat(args));
    else if (level === 'warn' && logger.warn) logger.warn.apply(logger, [prefix].concat(args));
    else if (level === 'info' && logger.info) logger.info.apply(logger, [prefix].concat(args));
    else if (logger.debug) logger.debug.apply(logger, [prefix].concat(args));
  } else if (level === 'error' || level === 'warn') {
    if (level === 'error') console.error.apply(console, [prefix].concat(args));
    else if (level === 'warn') console.warn.apply(console, [prefix].concat(args));
  }
}

function isPublicPath() {
  var currentPath = (window.location && window.location.pathname ? window.location.pathname.toLowerCase() : '/');
  var currentHash = (window.location && window.location.hash ? window.location.hash.replace('#', '').toLowerCase() : '/');
  for (var i = 0; i < PUBLIC_PATHS.length; i++) {
    var p = PUBLIC_PATHS[i];
    if (currentPath === p || currentPath.indexOf(p + '/') === 0 || currentHash === p || currentHash.indexOf(p + '/') === 0) {
      return true;
    }
  }
  return false;
}

// P0-B (decisao #48): rotas cujo proposito E o proprio login. Diferente de
// isPublicPath (que inclui /logout, /forgot-password, /reset-password), estas
// DEVEM exibir o modal de login para usuario NAO autenticado — nao existe
// pagina de login dedicada; o login e sempre o modal em index.html. Sem isto,
// abrir /login ou /login.html direto pula o gate do modal e as fases 3-5 do
// shell autenticado carregam e travam o preloader. Ver INCIDENTE-P0-tela-preta.
var LOGIN_PATHS = ['/login', '/login.html', '/login/'];
function isLoginPath() {
  var currentPath = (window.location && window.location.pathname ? window.location.pathname.toLowerCase() : '/');
  for (var i = 0; i < LOGIN_PATHS.length; i++) {
    var p = LOGIN_PATHS[i];
    if (currentPath === p || currentPath.indexOf(p + '/') === 0) return true;
  }
  return false;
}

function _loadAuthReadyDOMBridge() {
  return import('/core/auth/bridges/auth-ready-dom-bridge.js').then(function() {
    _log('debug', 'auth-ready-dom-bridge loaded successfully');
  }).catch(function(error) {
    _log('warn', 'auth-ready-dom-bridge failed to load (non-critical)', { error: error.message });
  });
}

// v3.7.0: helper to get from windowAdapter with fallback
function _getGlobal(name: string) {
  if (_windowAdapter && _windowAdapter.get) {
    var val = _windowAdapter.get(name);
    if (val) return val;
  }
  return (typeof window !== 'undefined') ? (window as unknown as Record<string, unknown>)[name] : null;
}

var phase2 = {
  id: 'phase-2-auth',
  name: 'Authentication Enterprise',
  order: 2,
  critical: true,
  recoverable: true,
  dependsOn: ['phase-1-core'],
  parallel: false,

  modules: [
    { id: 'auth-orchestrator', name: 'Auth Orchestrator Enterprise', critical: true, timeout: 10000 },
    { id: 'login-modal', name: 'Login Modal', critical: true, timeout: 5000 },
    { id: 'auth-ready-dom-bridge', name: 'Auth Ready DOM Bridge', critical: false, timeout: 2000 }
  ],

  execute: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var eventBusAdapter = ports.eventBusAdapter as Record<string, Function> | null;
    var readyFlagsAdapter = ports.readyFlagsAdapter as Record<string, Function> | null;
    var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
    var results: { initialized: string[]; failed: Array<{ module: string; error: string }>; authState: Record<string, unknown> | null } = { initialized: [], failed: [], authState: null };
    var startTime = performance.now();

    // v3.7.0: cache windowAdapter for rollback/healthCheck
    _windowAdapter = windowAdapter;

    // v3.9.0: Create auth redirect controller
    _authRedirectController = createAuthRedirectController({
      logger: logger as unknown,
      telemetry: telemetry as unknown,
      eventBusAdapter: eventBusAdapter as unknown,
      windowAdapter: windowAdapter as unknown
    } as Parameters<typeof createAuthRedirectController>[0]) as unknown as Record<string, Function>;

    if (logger) logger.info('[' + MODULE_ID + '] Phase 2 starting: Authentication Enterprise v' + VERSION);
    if (telemetry) telemetry.track('phase-2-start', { version: VERSION });

    var eventBus = windowAdapter && windowAdapter.get ? windowAdapter.get('EventBus') : null;
    var LoginModalRef: Record<string, Function> | null = null;

    return Promise.resolve().then(function() {
      if (logger) logger.info('[' + MODULE_ID + '] Initializing SessionManager singleton...');
      return SessionManager.init({ checkOnInit: false, trackActivity: true, autoRefresh: true });
    }).then(function() {
      if (logger) logger.info('[' + MODULE_ID + '] Creating enterprise auth modules...');

      var permissionsGuard = createPermissionsGuard({ eventBus: eventBus });
      var policiesManager = createSecurityPoliciesManager({ eventBus: eventBus });

      // v3.11.0-AUTHCONTEXT-FIX: sessionManagerAdapter
      // CRITICAL: getAuthContext() is required by auth-orchestrator._buildAuthContext()
      // Without it, orchestrator falls back to createEmptyAuthContext() which returns
      // roles=[], level=0, isAuthenticated=false — causing ACCESS_DENIED on all admin panels
      var sessionManagerAdapter = {
        isAuthenticated: function() { return SessionManager.isAuthenticated(); },
        getUser: function() { return SessionManager.getUser(); },
        getRoles: function() { return SessionManager.getRoles(); },
        getLevel: function() { var user = SessionManager.getUser(); return user ? user.level || 0 : 0; },
        getAuthContext: function() { return SessionManager.getAuthContext(); },
        checkSession: function() { return SessionManager.checkSession(); },
        subscribe: function(cb: Function) { return SessionManager.subscribe ? SessionManager.subscribe(cb) : function() {}; },
        refreshSession: function() { return SessionManager.refresh ? SessionManager.refresh() : Promise.resolve(); },
        healthCheck: function() { return SessionManager.healthCheck ? SessionManager.healthCheck() : { status: 'UNKNOWN' }; },
        info: function() { return SessionManager.info ? SessionManager.info() : { moduleId: 'session-manager-adapter' }; },
        _injectSession: function(data: Record<string, unknown>) { return SessionManager.checkSession(); },
        _clearSession: function() { return SessionManager.logout(); },
        _isLiveProxy: false,
        _isSingletonAdapter: true,
        _version: SessionManager.version
      };

      var authOrchestrator = createAuthOrchestrator({
        eventBus: eventBus,
        sessionManager: sessionManagerAdapter,
        permissionsGuard: permissionsGuard,
        policiesManager: policiesManager
      });

      setOrchestrator(authOrchestrator);

      if (logger) logger.info('[' + MODULE_ID + '] Initializing Auth Orchestrator...');
      authOrchestrator.init({
        session: {},
        permissions: {
          routePermissions: {
            '/admin': { minLevel: 4, allowedRoles: ['admin', 'super_admin'] },
            '/settings': { minLevel: 3, allowedRoles: ['manager', 'admin', 'super_admin'] }
          },
          panelPermissions: {
            'panel-user-management': { minLevel: 4, requiredCapability: 'users:view' },
            'panel-audit-trail': { minLevel: 4, requiredCapability: 'admin:audit' }
          }
        },
        policies: { policies: [] }
      });

      if (logger) logger.info('[' + MODULE_ID + '] Checking existing session via SessionManager...');
      return SessionManager.checkSession().then(function() {
        return authOrchestrator;
      });
    }).then(function(authOrchestrator) {
      var isAuthenticated = SessionManager.isAuthenticated();
      var userData = SessionManager.getUser();

      // ═══════════════════════════════════════════════════════════════
      // v3.9.0: POST-AUTH REDIRECT — Enterprise AAA
      // If user is authenticated but on a public route like /login,
      // redirect to their intended destination BEFORE continuing boot.
      // This ensures phase-3 sees the correct route and mounts AppShell.
      // ═══════════════════════════════════════════════════════════════
      if (isAuthenticated && _authRedirectController) {
        var redirectResult = _authRedirectController.execute(isAuthenticated);
        if (redirectResult.executed) {
          if (logger) logger.info('[' + MODULE_ID + '] Post-auth redirect executed', {
            from: '/login',
            to: redirectResult.target.path,
            source: redirectResult.target.source
          });
        }
      }

      if (logger) logger.info('[' + MODULE_ID + '] Loading login-modal module...');
      return import('/components/login-modal/index.js').then(function(LoginModalModule) {
        LoginModalRef = (LoginModalModule.default || LoginModalModule) as unknown as Record<string, Function>;
        if (LoginModalRef && LoginModalRef.mount) {
          return Promise.resolve(LoginModalRef.mount({ integrateWithGlobalEventBus: true })).then(function() {
            results.initialized.push('login-modal');
            if (logger) logger.info('[' + MODULE_ID + '] Login modal mounted successfully');
          });
        } else {
          if (logger) logger.warn('[' + MODULE_ID + '] Login modal mount function not found');
        }
      }).catch(function(loginModalError) {
        if (logger) logger.error('[' + MODULE_ID + '] Failed to load login-modal', { error: loginModalError.message });
        results.failed.push({ module: 'login-modal', error: loginModalError.message });
      }).then(function() {
        return { authOrchestrator: authOrchestrator, isAuthenticated: isAuthenticated, userData: userData };
      });
    }).then(function(ctx) {
      var authOrchestrator = ctx.authOrchestrator;
      var isAuthenticated = ctx.isAuthenticated;
      var userData = ctx.userData;

      if (!isAuthenticated && (!isPublicPath() || isLoginPath())) {
        if (logger) logger.warn('[' + MODULE_ID + '] NOT AUTHENTICATED - Opening login modal and waiting...');
        if (telemetry) telemetry.track('auth-login-required', { reason: 'unauthenticated' });

        if (document.body) {
          document.body.setAttribute('data-auth-ready', 'true');
          document.body.setAttribute('data-state', 'unauthenticated');
        }

        if (eventBusAdapter && eventBusAdapter.emit) {
          eventBusAdapter.emit(AUTH_EVENTS.LOGIN_REQUIRED, {
            reason: 'unauthenticated',
            attemptedPath: window.location.pathname + window.location.hash,
            source: MODULE_ID
          });
        }

        if (LoginModalRef && LoginModalRef.show) {
          LoginModalRef.show('phase-2-auth-unauthenticated');
        } else {
          var LoginModalGlobal = _getGlobal('LoginModal');
          if (LoginModalGlobal && LoginModalGlobal.show) LoginModalGlobal.show('phase-2-auth-unauthenticated');
        }

        if (logger) logger.info('[' + MODULE_ID + '] Waiting for LOGIN_SUCCESS event...');

        return new Promise(function(resolve) {
          var timeout = setTimeout(function() {
            if (logger) logger.warn('[' + MODULE_ID + '] Login timeout after 5 minutes');
            resolve({ timeout: true });
          }, 300000);

          var cleanup = eventBusAdapter && eventBusAdapter.on ? eventBusAdapter.on(AUTH_EVENTS.LOGIN_SUCCESS, function(data: Record<string, unknown>) {
            clearTimeout(timeout);
            if (typeof cleanup === 'function') cleanup();
            if (logger) logger.info('[' + MODULE_ID + '] LOGIN_SUCCESS received', { userId: data && data.user ? (data.user as Record<string, unknown>).id : null });

            // v3.9.0: Post-login redirect — redireciona após login interativo
            if (_authRedirectController) {
              var postLoginRedirect = _authRedirectController.execute(true);
              if (postLoginRedirect.executed && logger) {
                logger.info('[' + MODULE_ID + '] Post-login redirect executed', {
                  to: postLoginRedirect.target.path,
                  source: postLoginRedirect.target.source
                });
              }
            }

            resolve({ success: true, user: data ? data.user : null });
          }) : null;
        }).then(function(loginResult) {
          if ((loginResult as any).success) {
            var newUser = SessionManager.getUser();
            results.authState = { authenticated: true, user: newUser, checked: true, loginWasRequired: true };

            if (document.body) document.body.setAttribute('data-state', 'authenticated');

            if (eventBusAdapter && eventBusAdapter.emit) {
              eventBusAdapter.emit(AUTH_EVENTS.READY, { authenticated: true, user: newUser, source: 'bootstrap-v2-post-login' });
            }
            if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('auth', true);

            // ═══════════════════════════════════════════════════════════════
            // v3.10.0-POST-LOGIN-RELOAD: Reload após login interativo
            // ═══════════════════════════════════════════════════════════════
            if (logger) logger.info('[' + MODULE_ID + '] Post-login reload scheduled - re-executing full boot with valid session');
            if (telemetry) telemetry.track('auth-post-login-reload', { userId: newUser ? newUser.id : null });
            setTimeout(function() {
              window.location.reload();
            }, 500);

            return _loadAuthReadyDOMBridge().then(function() {
              results.initialized.push('auth-ready-dom-bridge');
              if (logger) logger.info('[' + MODULE_ID + '] Auth complete after interactive login', { userId: newUser ? newUser.id : null });
              return { authOrchestrator: authOrchestrator };
            });
          } else {
            results.authState = { authenticated: false, user: null, checked: true, loginWasRequired: true, loginTimedOut: true };
            if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('auth', true);
            return _loadAuthReadyDOMBridge().then(function() {
              results.initialized.push('auth-ready-dom-bridge');
              return { authOrchestrator: authOrchestrator };
            });
          }
        });
      }

      if (isAuthenticated && userData) {
        if (logger) logger.info('[' + MODULE_ID + '] Session restored from API', { userId: userData.id });
      } else {
        if (logger) logger.info('[' + MODULE_ID + '] Public path, continuing without auth');
      }

      results.authState = { authenticated: isAuthenticated, user: userData, checked: true };

      if (document.body) {
        document.body.setAttribute('data-auth-ready', 'true');
        document.body.setAttribute('data-state', isAuthenticated ? 'authenticated' : 'unauthenticated');
      }

      if (isAuthenticated) {
        if (eventBusAdapter && eventBusAdapter.emit) {
          eventBusAdapter.emit(AUTH_EVENTS.READY, { authenticated: true, user: userData, source: 'bootstrap-v2' });
          eventBusAdapter.emit(AUTH_EVENTS.LOGIN_SUCCESS, { user: userData, source: 'bootstrap-v2-restore' });
        }
      } else {
        if (eventBusAdapter && eventBusAdapter.emit) {
          eventBusAdapter.emit(AUTH_EVENTS.READY, { authenticated: false, source: 'bootstrap-v2' });
        }
      }

      if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('auth', true);

      return _loadAuthReadyDOMBridge().then(function() {
        results.initialized.push('auth-ready-dom-bridge');
        return { authOrchestrator: authOrchestrator };
      });
    }).then(function(ctx) {
      var authOrchestrator = ctx.authOrchestrator;

      // v3.7.0: register AppContext via windowAdapter + window fallback (dual)
      var appContext = _getGlobal('AppContext') || {};
      appContext.getAuth = function() { return authOrchestrator.getAuthContext(); };
      appContext.auth = AuthAdapter;
      if (_windowAdapter && _windowAdapter.expose) _windowAdapter.expose('AppContext', appContext);
      (window as any).AppContext = appContext;

      results.initialized.push('auth-orchestrator');
      results.initialized.push('session-manager-singleton');

      var duration = performance.now() - startTime;
      if (logger) logger.info('[' + MODULE_ID + '] Phase 2 complete', {
        duration: duration.toFixed(0) + 'ms',
        authenticated: results.authState ? results.authState.authenticated : false,
        sessionManagerVersion: SessionManager.version,
        redirectControllerActive: !!_authRedirectController
      });

      return { success: true, results: results, duration: duration };
    }).catch(function(error) {
      if (logger) logger.error('[' + MODULE_ID + '] Phase 2 failed', { error: error.message });
      results.failed.push({ module: 'auth-orchestrator', error: error.message });

      if (document.body) {
        document.body.setAttribute('data-auth-ready', 'true');
        document.body.setAttribute('data-state', 'error');
      }

      if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('auth', true);
      return _loadAuthReadyDOMBridge().then(function() {
        return { success: false, results: results, error: error.message };
      });
    });
  },

  rollback: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    if (logger) logger.warn('[' + MODULE_ID + '] Rolling back phase 2');
    // v3.7.0: cleanup AppContext via reference
    var appContext = _getGlobal('AppContext');
    if (appContext) {
      delete appContext.getAuth;
      delete appContext.auth;
    }
    if (SessionManager.shutdown) SessionManager.shutdown();
    _authRedirectController = null;
    return Promise.resolve({ success: true });
  },

  healthCheck: function() {
    // v3.8.0: HEALTH CONTRACT — padronizado com createHealthResult
    var appContext = _getGlobal('AppContext');
    var authAdapter = appContext ? appContext.auth : null;
    var sessionManagerHealthy = SessionManager.isInitialized ? SessionManager.isInitialized() : false;
    var LoginModal = _getGlobal('LoginModal');
    var loginModalHealthy = LoginModal && LoginModal.isInitialized ? LoginModal.isInitialized() : false;
    var isReady = authAdapter && authAdapter.isReady ? authAdapter.isReady() : false;

    return createHealthResult({
      status: (isReady && sessionManagerHealthy) ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        authReady: isReady,
        sessionManagerHealthy: sessionManagerHealthy,
        loginModalLoaded: loginModalHealthy,
        portsInitialized: _Ports.isInitialized(),
        redirectControllerActive: !!_authRedirectController
      },
      details: {
        portsInitialized: _Ports.isInitialized(),
        sessionManagerVersion: SessionManager.version,
        loginModalLoaded: loginModalHealthy,
        redirectController: _authRedirectController ? _authRedirectController.info() : null
      }
    });
  },

  info: function() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      redirectController: _authRedirectController ? _authRedirectController.info() : null
    };
  }
};

export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.phase2 = {
    version: VERSION,
    getRedirectController: function() { return _authRedirectController; }
  };
}

export { phase2, MODULE_ID, VERSION };
export default phase2;
