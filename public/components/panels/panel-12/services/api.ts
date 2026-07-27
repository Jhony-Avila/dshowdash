// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.services.api
// PURPOSE: API Service - Camada de negócio para operações de Jobs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   normalizeId() — exported function
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
import * as http from './http.js';

export const MODULE_ID = 'panel-12.services.api';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const API_BASE = '/api/modules/panels/painel-12/api.php';

export async function loadJobs(signal: AbortSignal | null = null) {
  const options = signal ? { signal } : {};
  const result = await http.get(API_BASE, options);
  if (!result.success) { return { success: false, error: result.error || 'Erro ao carregar jobs', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  if (!result.data.success || !result.data.data || !Array.isArray(result.data.data.jobs)) { return { success: false, error: 'Invalid response structure', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  return { success: true, data: { jobs: result.data.data.jobs as Record<string, unknown>[] }, duration: result.duration };
}

export async function createJob(jobName: string, signal: AbortSignal | null = null) {
  if (!jobName || typeof jobName !== 'string') { return { success: false, error: 'Nome do job é obrigatório', data: { jobs: [] as Record<string, unknown>[] } }; }
  const trimmed = jobName.trim();
  if (trimmed.length < 3) { return { success: false, error: 'Nome deve ter pelo menos 3 caracteres', data: { jobs: [] as Record<string, unknown>[] } }; }
  if (trimmed.length > 100) { return { success: false, error: 'Nome deve ter no máximo 100 caracteres', data: { jobs: [] as Record<string, unknown>[] } }; }
  const options = signal ? { signal } : {};
  const result = await http.post(API_BASE, { job_name: trimmed, is_active: 1 }, options);
  if (!result.success) { return { success: false, error: result.error || 'Erro ao criar job', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  if (!result.data.success) { return { success: false, error: result.data.error || 'Erro desconhecido ao criar job', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  const createdJob = result.data.data || null;
  return { success: true, data: { jobs: createdJob ? [createdJob as Record<string, unknown>] : [] as Record<string, unknown>[] }, duration: result.duration };
}

export async function toggleJob(jobId: string, isActive: boolean, signal: AbortSignal | null = null) {
  if (!jobId) { return { success: false, error: 'ID do job é obrigatório', data: { jobs: [] as Record<string, unknown>[] } }; }
  if (typeof isActive !== 'boolean') { return { success: false, error: 'Status (isActive) deve ser boolean', data: { jobs: [] as Record<string, unknown>[] } }; }
  const options = signal ? { signal } : {};
  const result = await http.put(`${API_BASE}?id=${jobId}`, { is_active: isActive ? 1 : 0 }, options);
  if (!result.success) { return { success: false, error: result.error || 'Erro ao atualizar job', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  if (!result.data.success) { return { success: false, error: result.data.error || 'Erro desconhecido ao atualizar job', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  return { success: true, data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration };
}

export async function deleteJob(jobId: string, signal: AbortSignal | null = null) {
  if (!jobId) { return { success: false, error: 'ID do job é obrigatório', data: { jobs: [] as Record<string, unknown>[] } }; }
  const options = signal ? { signal } : {};
  const result = await http.del(`${API_BASE}?id=${jobId}`, options);
  if (!result.success) { return { success: false, error: result.error || 'Erro ao excluir job', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  if (!result.data.success) { return { success: false, error: result.data.error || 'Erro desconhecido ao excluir job', data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration }; }
  return { success: true, data: { jobs: [] as Record<string, unknown>[] }, duration: result.duration };
}

export function normalizeId(id: string | number) { return String(id).trim(); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true, portsInitialized: Ports.isInitialized() } }; }
