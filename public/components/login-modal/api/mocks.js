const MODULE_ID = "login-modal-api-mocks";
const VERSION = "5.5.0-ENTERPRISE";
import { AUTH_ERROR_CODES, createResponse } from "./constants.js";
import { sleep } from "./helpers.js";
async function mockLogin(username, password, opts) {
  await sleep(500);
  if (username === "admin" && password === "admin") {
    return createResponse(true, { code: "LOGIN_SUCCESS", message: "Mock login success", data: { user: { id: 1, username: "admin" }, csrf: "mock-csrf-token" }, latency: 500, traceId: opts.traceId });
  }
  return createResponse(false, { status: 401, code: AUTH_ERROR_CODES.INVALID_CREDENTIALS, message: "Mock login failed", latency: 500, traceId: opts.traceId, error: AUTH_ERROR_CODES.INVALID_CREDENTIALS });
}
async function mockCheckSession(opts) {
  await sleep(200);
  return createResponse(true, { code: "SESSION_VALID", message: "Mock session valid", data: { authenticated: true, user: { id: 1, username: "mock" } }, latency: 200, traceId: opts.traceId });
}
async function mockLogout(opts) {
  await sleep(200);
  return createResponse(true, { code: "LOGOUT_SUCCESS", message: "Mock logout success", latency: 200, traceId: opts.traceId });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, availableMocks: ["mockLogin", "mockCheckSession", "mockLogout"], timestamp: Date.now() };
}
function healthCheck() {
  const checks = { moduleLoaded: true, mockLoginAvailable: typeof mockLogin === "function", mockCheckSessionAvailable: typeof mockCheckSession === "function", mockLogoutAvailable: typeof mockLogout === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  mockCheckSession,
  mockLogin,
  mockLogout
};
