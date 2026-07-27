const SVGS = { warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
class RankingComponent {
  constructor(container) {
    this.container = container;
    this.element = null;
  }
  render() {
    this.element = document.createElement("div");
    this.element.className = "p17-ranking-list";
    this.container.appendChild(this.element);
    return this.element;
  }
  update(topJobs) {
    if (!this.element) return;
    if (!topJobs || topJobs.length === 0) {
      this.element.innerHTML = '<div class="p17-empty">Nenhum job encontrado</div>';
      return;
    }
    const html = topJobs.map((job, index) => this.createRankingItem(job, index + 1)).join("");
    this.element.innerHTML = html;
  }
  createRankingItem(job, rank) {
    const jobName = this.escapeHtml(job.job_name || job.name || "N/A");
    const executions = job.total_executions || job.executions || 0;
    const successRate = parseFloat(String(job.success_rate)) || 0;
    const avgDuration = job.avg_duration || job.avg_time || "--";
    const rankClass = this.getRankClass(rank);
    const rateClass = this.getRateClass(successRate);
    return `<div class="p17-ranking-item"><div class="p17-rank ${rankClass}">#${rank}</div><div class="p17-job-info"><span class="p17-job-name">${jobName}</span><div class="p17-job-stats"><span class="p17-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> ${this.formatNumber(executions)} exec.</span><span class="p17-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${avgDuration}</span></div></div><div class="p17-success-rate ${rateClass}">${successRate.toFixed(1)}%</div></div>`;
  }
  getRankClass(rank) {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "rank-default";
  }
  getRateClass(rate) {
    if (rate >= 95) return "rate-high";
    if (rate >= 80) return "rate-medium";
    return "rate-low";
  }
  formatNumber(num) {
    const n = typeof num !== "number" ? parseInt(String(num)) || 0 : num;
    return n.toLocaleString("pt-BR");
  }
  showLoading() {
    if (!this.element) return;
    this.element.innerHTML = '<div class="p17-loading">Carregando ranking...</div>';
  }
  showError(message) {
    if (!this.element) return;
    this.element.innerHTML = `<div class="p17-error">${SVGS.warning} ${message}</div>`;
  }
  escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
const MODULE_ID = "panels-panel-17-ui-ranking";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  RankingComponent,
  VERSION,
  healthCheck,
  info
};
