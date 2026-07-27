// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.analytics.visual-dashboard
// PURPOSE: Route Analytics Visual Dashboard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   CONFIG from ./dashboard-config.js
//   createDataCollector from ./data-collector.js
//   createChartRenderer from ./chart-renderer.js
//   containerStyle, dashboardHTML, recentEntryHTML, alertHTML, noAlertsHTML, noDataHTML from ./dashboard-templates.js
//
// PROVIDES:
//   RouterVisualDashboard() — exported function
//   createDashboard() — exported function
//   getDashboard() — exported function
//   showDashboard() — exported function
//   hideDashboard() — exported function
//   toggleDashboard() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CONFIG } from './dashboard-config.js';
import { createDataCollector } from './data-collector.js';
import { createChartRenderer } from './chart-renderer.js';
import { containerStyle, dashboardHTML, recentEntryHTML, alertHTML, noAlertsHTML, noDataHTML } from './dashboard-templates.js';

const VERSION = '1.3.0-P17WI';
const MODULE_ID = 'router.analytics.visual-dashboard';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) {
  if (!ctx) ctx = {};
  const logger = _getPort('logger');
  if (!logger || typeof logger[level] !== 'function') return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}

function RouterVisualDashboard(this: any, containerId?: string) {
  if (!containerId) containerId = 'router-dashboard';
  this.containerId = containerId;
  this.container = null;
  this.charts = {};

  // @ts-expect-error TS migration - TS2554
  this.dataCollector = createDataCollector();
  this.refreshTimer = null;
  this.mounted = false;
  this.metricsSource = null;
  this.auditSource = null;
  this.deadRoutesSource = null;
  this.realtimeSource = null;
}

RouterVisualDashboard.prototype.setDataSources = function(sources: Record<string, unknown>) {
  if (!sources) sources = {};
  this.metricsSource = sources.metrics || null;
  this.auditSource = sources.audit || null;
  this.deadRoutesSource = sources.deadRoutes || null;
  this.realtimeSource = sources.realtime || null;
};

RouterVisualDashboard.prototype.mount = function(targetElement: HTMLElement | null) {
  const self = this;
  if (this.mounted) return;
  this.container = targetElement || document.getElementById(this.containerId);
  if (!this.container) {
    this.container = document.createElement('div');
    this.container.id = this.containerId;
    this.container.style.cssText = containerStyle();
    document.body.appendChild(this.container);
  }
  this.container.innerHTML = dashboardHTML();
  this._initCharts();
  this._bindEvents();
  this.mounted = true;
  _log('info', 'Dashboard mounted', { containerId: this.containerId });
};

RouterVisualDashboard.prototype._initCharts = function() {
  this.charts.navigations = createChartRenderer(this.container.querySelector('#chart-navigations'));
  this.charts.resolveTime = createChartRenderer(this.container.querySelector('#chart-resolve-time'));
  this.charts.topRoutes = createChartRenderer(this.container.querySelector('#chart-top-routes'));
};

RouterVisualDashboard.prototype._bindEvents = function() {
  const self = this;
  const refreshBtn = this.container.querySelector('#dash-refresh');
  const closeBtn = this.container.querySelector('#dash-close');
  if (refreshBtn) refreshBtn.addEventListener('click', () => { self.refresh(); });
  if (closeBtn) closeBtn.addEventListener('click', () => { self.unmount(); });
};

RouterVisualDashboard.prototype.refresh = function() {
  const metrics = this._collectMetrics();
  this.dataCollector.addDataPoint(metrics);
  this._updateStats(metrics);
  this._updateCharts();
  this._updateRecentList();
  this._updateAlerts();
};

RouterVisualDashboard.prototype._collectMetrics = function() {
  const metrics = { totalNavigations: 0, avgResolveTime: 0, successRate: 100, activeUsers: 0, navigationsPerMinute: 0, errorRate: 0, topRoutes: [] as Record<string, unknown>[] };
  if (this.metricsSource && this.metricsSource.getStats) { const stats = this.metricsSource.getStats(); metrics.totalNavigations = stats.totalResolves || 0; metrics.avgResolveTime = stats.avgTime || 0; }
  if (this.auditSource && this.auditSource.getStats) { const auditStats = this.auditSource.getStats(); metrics.successRate = auditStats.successRate || 100; metrics.topRoutes = auditStats.topPaths ? auditStats.topPaths.slice(0, 5) : []; }
  if (this.realtimeSource && this.realtimeSource.getMetrics) { const realtime = this.realtimeSource.getMetrics(); metrics.activeUsers = realtime.activeUsers || 0; metrics.navigationsPerMinute = realtime.navigationsPerMinute || 0; }
  return metrics;
};

RouterVisualDashboard.prototype._updateStats = function(metrics: Record<string, number>) {
  const statTotal = this.container.querySelector('#stat-total');
  const statAvg = this.container.querySelector('#stat-avgtime');
  const statSuccess = this.container.querySelector('#stat-success');
  const statActive = this.container.querySelector('#stat-active');
  if (statTotal) statTotal.textContent = metrics.totalNavigations;
  if (statAvg) statAvg.textContent = `${metrics.avgResolveTime.toFixed(0)}ms`;
  if (statSuccess) statSuccess.textContent = `${metrics.successRate.toFixed(0)}%`;
  if (statActive) statActive.textContent = metrics.activeUsers;
};

RouterVisualDashboard.prototype._updateCharts = function() {
  const data = this.dataCollector.getData();
  this.charts.navigations.drawLineChart(data.navigations, { label: 'Navigations/min', color: CONFIG.colors.primary });
  this.charts.resolveTime.drawLineChart(data.resolveTime, { label: 'Resolve Time (ms)', color: CONFIG.colors.success });
  const metrics = this._collectMetrics();
  if (metrics.topRoutes.length > 0) {
    this.charts.topRoutes.drawBarChart(metrics.topRoutes.map((r: Record<string, unknown>) => r.count || 0), { labels: metrics.topRoutes.map((r: Record<string, unknown>) => r.path || ''), color: CONFIG.colors.warning, title: 'Top Routes' });
  }
};

RouterVisualDashboard.prototype._updateRecentList = function() {
  const list = this.container.querySelector('#recent-list');
  if (this.auditSource && this.auditSource.getLast) { const recent = this.auditSource.getLast(5); list.innerHTML = recent.map((entry: Record<string, unknown>) => recentEntryHTML(entry)).join(''); }
  else { list.innerHTML = noDataHTML(); }
};

RouterVisualDashboard.prototype._updateAlerts = function() {
  const alertsList = this.container.querySelector('#alerts-list');
  const alerts = [];
  if (this.deadRoutesSource && this.deadRoutesSource.getDeadRoutes) { const deadRoutes = this.deadRoutesSource.getDeadRoutes(); if (deadRoutes.length > 0) { alerts.push({ type: 'warning', message: `${deadRoutes.length} rotas mortas detectadas` }); } }
  const metrics = this._collectMetrics();
  if (metrics.avgResolveTime > 100) { alerts.push({ type: 'warning', message: `Tempo médio alto: ${metrics.avgResolveTime.toFixed(0)}ms` }); }
  if (metrics.successRate < 95) { alerts.push({ type: 'danger', message: `Taxa de sucesso baixa: ${metrics.successRate.toFixed(0)}%` }); }
  alertsList.innerHTML = alerts.length === 0 ? noAlertsHTML() : alerts.map(alert => alertHTML(alert)).join('');
};

RouterVisualDashboard.prototype.startAutoRefresh = function(interval: number) {
  const self = this;
  if (!interval) interval = CONFIG.refreshInterval;
  this.stopAutoRefresh();
  this.refresh();
  this.refreshTimer = setInterval(() => { if (document.hidden) return; self.refresh(); }, interval);
  _log('info', 'Auto-refresh started', { interval });
};

RouterVisualDashboard.prototype.stopAutoRefresh = function() { if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; } };

RouterVisualDashboard.prototype.unmount = function() {
  this.stopAutoRefresh();
  if (this.container && this.container.parentNode) { this.container.parentNode.removeChild(this.container); }
  this.container = null;
  this.charts = {};
  this.mounted = false;
  _log('info', 'Dashboard unmounted');
};

RouterVisualDashboard.prototype.toggle = function() { if (this.mounted) { this.unmount(); } else { this.mount(); this.startAutoRefresh(); } };
RouterVisualDashboard.prototype.getStatus = function() { return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, hasMetricsSource: !!this.metricsSource, hasAuditSource: !!this.auditSource, hasDeadRoutesSource: !!this.deadRoutesSource, hasRealtimeSource: !!this.realtimeSource, dataPoints: this.dataCollector.getDataPointCount(), autoRefresh: !!this.refreshTimer, portsInitialized: Ports.isInitialized() }; };
RouterVisualDashboard.prototype.healthCheck = function() { return { status: this.mounted ? 'HEALTHY' : 'INACTIVE', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { mounted: this.mounted, hasDataSources: !!(this.metricsSource || this.auditSource) }, timestamp: Date.now() }; };
RouterVisualDashboard.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, features: ['real-time-charts', 'stats-cards', 'alerts', 'recent-navigations'], status: this.getStatus() }; };

let _dashboardInstance: Record<string, unknown> | null = null;
function createDashboard(containerId: string) { return (new (RouterVisualDashboard as unknown as new (id?: string) => Record<string, unknown>)(containerId)); }
function getDashboard() { if (!_dashboardInstance) { _dashboardInstance = (new (RouterVisualDashboard as unknown as new (id?: string) => Record<string, unknown>)()); } return _dashboardInstance; }
function showDashboard() { const dashboard = getDashboard(); if (!dashboard.mounted) { (dashboard as Record<string, (...args: unknown[]) => unknown>).mount(); (dashboard as Record<string, (...args: unknown[]) => unknown>).startAutoRefresh(); } return dashboard; }
function hideDashboard() { if (_dashboardInstance) { (_dashboardInstance as Record<string, (...args: unknown[]) => void>).unmount(); } }
function toggleDashboard() { const dashboard = getDashboard(); (dashboard as Record<string, (...args: unknown[]) => unknown>).toggle(); return (dashboard as Record<string, unknown>).mounted; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), description: 'Visual dashboard with real-time charts for router analytics' }; }

export { RouterVisualDashboard, createDashboard, getDashboard, showDashboard, hideDashboard, toggleDashboard, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export default RouterVisualDashboard;
