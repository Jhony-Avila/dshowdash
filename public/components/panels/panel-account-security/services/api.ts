// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-account-security.services.api
// PURPOSE: Panel Account Security - API Service
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   MODULE_ID as API_ENDPOINTS from ../core/constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID as API_ENDPOINTS } from '../core/constants.js';

export const MODULE_ID = 'panel-account-security.services.api';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const DEFAULT_TIMEOUT = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT) { const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), timeout); try { const response = await fetch(url, { ...options, signal: controller.signal, credentials: 'include' }); clearTimeout(timeoutId); return response; } catch (error) { clearTimeout(timeoutId); throw error; } }


// @ts-expect-error TS migration - TS2339
export async function loadSecurityInfo() { try { const response = await fetchWithTimeout(API_ENDPOINTS.GET_SECURITY_INFO); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (!(data.ok ?? data.success)) throw new Error(data.error || 'Erro ao carregar informações'); return data.data || data; } catch (error) { _getPort('logger')?.error(`[${MODULE_ID}] loadSecurityInfo error:`, error); throw error; } }


// @ts-expect-error TS migration - TS2339
export async function changePassword(currentPassword, newPassword) { try { const response = await fetchWithTimeout(API_ENDPOINTS.CHANGE_PASSWORD, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (!(data.ok ?? data.success)) throw new Error(data.error || 'Erro ao alterar senha'); return data; } catch (error) { _getPort('logger')?.error(`[${MODULE_ID}] changePassword error:`, error); throw error; } }

export default { loadSecurityInfo, changePassword };
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { apiReady: true } }; }
