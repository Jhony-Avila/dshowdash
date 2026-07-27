// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-api-mocks
// PURPOSE: Login Modal - Auth Mocks
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   AUTH_ERROR_CODES, createResponse from ./constants.js
//   sleep from ./helpers.js
//
// PROVIDES:
//   mockLogin() — exported function
//   mockCheckSession() — exported function
//   mockLogout() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

const MODULE_ID = 'login-modal-api-mocks';
const VERSION = '5.5.0-ENTERPRISE';

import { AUTH_ERROR_CODES, createResponse } from './constants.js';
import { sleep } from './helpers.js';

export async function mockLogin(username: string, password: string, opts: Record<string, any>) { await sleep(500); if (username === 'admin' && password === 'admin') { return createResponse(true, { code: 'LOGIN_SUCCESS', message: 'Mock login success', data: { user: { id: 1, username: 'admin' }, csrf: 'mock-csrf-token' }, latency: 500, traceId: opts.traceId }); } return createResponse(false, { status: 401, code: AUTH_ERROR_CODES.INVALID_CREDENTIALS, message: 'Mock login failed', latency: 500, traceId: opts.traceId, error: AUTH_ERROR_CODES.INVALID_CREDENTIALS }); }
export async function mockCheckSession(opts: Record<string, any>) { await sleep(200); return createResponse(true, { code: 'SESSION_VALID', message: 'Mock session valid', data: { authenticated: true, user: { id: 1, username: 'mock' } }, latency: 200, traceId: opts.traceId }); }
export async function mockLogout(opts: Record<string, any>) { await sleep(200); return createResponse(true, { code: 'LOGOUT_SUCCESS', message: 'Mock logout success', latency: 200, traceId: opts.traceId }); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, availableMocks: ['mockLogin', 'mockCheckSession', 'mockLogout'], timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, mockLoginAvailable: typeof mockLogin === 'function', mockCheckSessionAvailable: typeof mockCheckSession === 'function', mockLogoutAvailable: typeof mockLogout === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export { VERSION, MODULE_ID };
