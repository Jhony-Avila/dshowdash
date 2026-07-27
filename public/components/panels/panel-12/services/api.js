import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import * as http from "./http.js";
const MODULE_ID = "panel-12.services.api";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const API_BASE = "/api/modules/panels/painel-12/api.php";
async function loadJobs(signal = null) {
  const options = signal ? { signal } : {};
  const result = await http.get(API_BASE, options);
  if (!result.success) {
    return { success: false, error: result.error || "Erro ao carregar jobs", data: { jobs: [] }, duration: result.duration };
  }
  if (!result.data.success || !result.data.data || !Array.isArray(result.data.data.jobs)) {
    return { success: false, error: "Invalid response structure", data: { jobs: [] }, duration: result.duration };
  }
  return { success: true, data: { jobs: result.data.data.jobs }, duration: result.duration };
}
async function createJob(jobName, signal = null) {
  if (!jobName || typeof jobName !== "string") {
    return { success: false, error: "Nome do job \xE9 obrigat\xF3rio", data: { jobs: [] } };
  }
  const trimmed = jobName.trim();
  if (trimmed.length < 3) {
    return { success: false, error: "Nome deve ter pelo menos 3 caracteres", data: { jobs: [] } };
  }
  if (trimmed.length > 100) {
    return { success: false, error: "Nome deve ter no m\xE1ximo 100 caracteres", data: { jobs: [] } };
  }
  const options = signal ? { signal } : {};
  const result = await http.post(API_BASE, { job_name: trimmed, is_active: 1 }, options);
  if (!result.success) {
    return { success: false, error: result.error || "Erro ao criar job", data: { jobs: [] }, duration: result.duration };
  }
  if (!result.data.success) {
    return { success: false, error: result.data.error || "Erro desconhecido ao criar job", data: { jobs: [] }, duration: result.duration };
  }
  const createdJob = result.data.data || null;
  return { success: true, data: { jobs: createdJob ? [createdJob] : [] }, duration: result.duration };
}
async function toggleJob(jobId, isActive, signal = null) {
  if (!jobId) {
    return { success: false, error: "ID do job \xE9 obrigat\xF3rio", data: { jobs: [] } };
  }
  if (typeof isActive !== "boolean") {
    return { success: false, error: "Status (isActive) deve ser boolean", data: { jobs: [] } };
  }
  const options = signal ? { signal } : {};
  const result = await http.put(`${API_BASE}?id=${jobId}`, { is_active: isActive ? 1 : 0 }, options);
  if (!result.success) {
    return { success: false, error: result.error || "Erro ao atualizar job", data: { jobs: [] }, duration: result.duration };
  }
  if (!result.data.success) {
    return { success: false, error: result.data.error || "Erro desconhecido ao atualizar job", data: { jobs: [] }, duration: result.duration };
  }
  return { success: true, data: { jobs: [] }, duration: result.duration };
}
async function deleteJob(jobId, signal = null) {
  if (!jobId) {
    return { success: false, error: "ID do job \xE9 obrigat\xF3rio", data: { jobs: [] } };
  }
  const options = signal ? { signal } : {};
  const result = await http.del(`${API_BASE}?id=${jobId}`, options);
  if (!result.success) {
    return { success: false, error: result.error || "Erro ao excluir job", data: { jobs: [] }, duration: result.duration };
  }
  if (!result.data.success) {
    return { success: false, error: result.data.error || "Erro desconhecido ao excluir job", data: { jobs: [] }, duration: result.duration };
  }
  return { success: true, data: { jobs: [] }, duration: result.duration };
}
function normalizeId(id) {
  return String(id).trim();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true, portsInitialized: Ports.isInitialized() } };
}
export {
  MODULE_ID,
  VERSION,
  createJob,
  deleteJob,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  loadJobs,
  normalizeId,
  toggleJob
};
