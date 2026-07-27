// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui
// PURPOSE: Panel-04 UIComponent - Tabela de Incidentes MEGA Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderStructure, updateCountdown, setAutoRefreshState, updateFooterStats, upd...
//   bindEvents, updatePeriodUI, updateViewModeUI, updateFilterUI, updateSortIndic...
//   updateCards, renderSparklines, pulseCard from ./cards.js
//   renderTimeline, renderTopJobs from ./timeline.js
//   renderTable, showLoading as tableShowLoading, showError as tableShowError fro...
//   renderGrouped from ./grouped.js
//   renderPagination from ./pagination.js
//   exportCSV, exportJSON from ./export.js
//   hashData from ./helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { renderStructure, updateCountdown, setAutoRefreshState, updateFooterStats, updateLastSync } from './template.js';

// @ts-expect-error TS migration - TS2614
import { bindEvents, updatePeriodUI, updateViewModeUI, updateFilterUI, updateSortIndicators, updateSoundToggle } from './events.js';
import { updateCards, renderSparklines, pulseCard } from './cards.js';
import { renderTimeline, renderTopJobs } from './timeline.js';
import { renderTable, showLoading as tableShowLoading, showError as tableShowError } from './table.js';
import { renderGrouped } from './grouped.js';
import { renderPagination } from './pagination.js';
import { exportCSV, exportJSON } from './export.js';

// @ts-expect-error TS migration - TS2614
import { hashData } from './helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-04-ui';

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement, options: Record<string, unknown> = {}) {
    this.container = container;
    this.logger = options.logger || console;
    this.onPeriodChange = options.onPeriodChange || (() => {});
    this.onManualRefresh = options.onManualRefresh || (() => {});
    this.onAutoRefreshToggle = options.onAutoRefreshToggle || (() => {});
    this.mounted = false;
    this.hasData = false;
    this._lastDataHash = null;
    
    this._sortColumn = 'created_at';
    this._sortOrder = 'desc';
    this._filterText = '';
    this._filterSeverity = 'all';
    this._expandedRows = new Set();
    this._expandedJobs = new Set();
    this._currentPeriod = '24h';
    this._viewMode = 'table';
    this._currentPage = 1;
    this._pageSize = 30;
    this._soundEnabled = false;
    this._lastCriticalCount = 0;
    this._notificationSound = null;
    
    this._data = null;
    this._grouped = null;
    this._summary = null;
    this._timeline = null;
    this._topJobs = null;
    this._sparklines = null;
  }

  async init() {
    if (!this.container) {
      this.logger?.error?.('ui.no-container');
      return;
    }
    
    this._initSound();
    this.container.innerHTML = renderStructure();
    this._bindEvents();
    this.mounted = true;
    this.logger?.debug?.('ui.init');
  }

  _initSound() {
    try {
      this._notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR8NW6Hn/eSrSxM4cNj/7J1WAC1s2f/fkEoAMXPa/9iIPgA6eNv/zn4zAEN/3P/DczAASnvd/7tpKwBRd97/s18oAFhz3/+rVSUAXm/g/6NLIwBkauH/mz8hAGpl4v+TNB8Ab2Dj/4opHQB0W+T/giEdAHlW5f96GBwAfVDm/3IQHACBR+f/aQgbAIU95/9gABoAiDLo/1cAGQCLJun/TQAYAIwa6f9FABcAjw7q/z0AFgCQAur/NAAVAJHz6v8sABQAkebr/yQAEwCR2ev/HQASAJDr7P8WABEA');
      this._notificationSound.volume = 0.5;
    } catch (e) {}
  }

  _playNotificationSound() {
    if (!this._soundEnabled || !this._notificationSound) return;
    try { this._notificationSound.play().catch(() => {}); } catch {}
  }

  _bindEvents() {
    bindEvents(this.container, {
      onPeriodChange: (period: string) => {
        this._currentPeriod = period;
        this._currentPage = 1;
        updatePeriodUI(this.container, this._currentPeriod);
        this.onPeriodChange(this._currentPeriod);
      },
      onViewModeChange: (mode: string) => {
        this._viewMode = mode;
        updateViewModeUI(this.container, this._viewMode);
        this._renderContent();
      },
      onRefresh: () => this.onManualRefresh(),
      onAutoRefreshToggle: () => this.onAutoRefreshToggle(),
      onSoundToggle: () => {
        this._soundEnabled = !this._soundEnabled;
        updateSoundToggle(this.container, this._soundEnabled);
      },
      onExportCSV: () => exportCSV(this._getFilteredData(), this._currentPeriod),
      onExportJSON: () => exportJSON(this._getFilteredData(), this._currentPeriod),
      onFilterText: (text: string) => {
        this._filterText = text;
        this._currentPage = 1;
        this._renderContent();
      },
      onFilterSeverity: (severity: string) => {
        this._filterSeverity = this._filterSeverity === severity ? 'all' : severity;
        this._currentPage = 1;
        updateFilterUI(this.container, this._filterSeverity, this._filterText);
        this._renderContent();
      },
      onClearFilter: () => {
        this._filterSeverity = 'all';
        this._filterText = '';
        this._currentPage = 1;
        const filterInput = this.container.querySelector('[data-filter]');
        if (filterInput) filterInput.value = '';
        updateFilterUI(this.container, this._filterSeverity, this._filterText);
        this._renderContent();
      },
      onSort: (col: string) => {
        if (this._sortColumn === col) {
          this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this._sortColumn = col;
          this._sortOrder = 'desc';
        }
        updateSortIndicators(this.container, this._sortColumn, this._sortOrder);
        this._renderContent();
      }
    });
  }

  updateCountdown(seconds: number) {
    updateCountdown(this.container, seconds);
  }

  setAutoRefreshState(active: boolean) {
    setAutoRefreshState(this.container, active);
  }

  showLoading() {
    if (this.hasData) return;
    tableShowLoading(this.container);
  }

  hideLoading() {}

  showError(message: string) {
    if (this.hasData) return;
    tableShowError(this.container, message);
  }

  update(payload: Record<string, unknown>) {
    if (!this.container) return;
    
    const newHash = hashData(payload);
    if (newHash === this._lastDataHash && this.hasData) return;
    this._lastDataHash = newHash;

    try {
      this._data = payload?.data || [];
      this._grouped = payload?.grouped || [];
      this._summary = payload?.summary || {};
      this._timeline = payload?.timeline || [];
      this._topJobs = payload?.top_jobs || [];
      this._sparklines = payload?.sparklines || {};

      const criticalNew = this._summary.critical_new || 0;
      if (criticalNew > this._lastCriticalCount && this._lastCriticalCount > 0) {
        this._playNotificationSound();
        pulseCard(this.container, 'critical');
      }
      this._lastCriticalCount = criticalNew;

      updateCards(this.container, this._summary);
      renderSparklines(this.container, this._sparklines);
      renderTimeline(this.container, this._timeline);
      renderTopJobs(this.container, this._topJobs);
      
      // Atualizar footer
      updateFooterStats(this.container, this._summary);
      updateLastSync(this.container, Date.now());
      
      this._renderContent();
      
      this.hasData = true;
    } catch (error: any) {
      this.logger?.error?.('ui.update.error', { error: error.message });
      this.showError('Erro ao processar dados');
    }
  }

  _getFilteredData() {
    let data = [...(this._data || [])];
    if (this._filterSeverity !== 'all') {
      data = data.filter(d => d.type === this._filterSeverity);
    }
    if (this._filterText) {
      data = data.filter(d => 
        d.job_name?.toLowerCase().includes(this._filterText) ||
        d.message?.toLowerCase().includes(this._filterText)
      );
    }
    data.sort((a, b) => {
      let va = a[this._sortColumn] || '';
      let vb = b[this._sortColumn] || '';
      if (this._sortColumn === 'created_at') {
        va = new Date(va).getTime() || 0;
        vb = new Date(vb).getTime() || 0;
      }
      if (va < vb) return this._sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return this._sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }

  _renderContent() {
    if (this._viewMode === 'table') {
      renderTable(this.container, this._getFilteredData(), {
        expandedRows: this._expandedRows,
        currentPage: this._currentPage,
        pageSize: this._pageSize,
        onRowClick: (id: number) => {
          if (this._expandedRows.has(id)) this._expandedRows.delete(id);
          else this._expandedRows.add(id);
          this._renderContent();
        }
      });
    } else {
      renderGrouped(this.container, this._grouped, {
        expandedJobs: this._expandedJobs,
        filterText: this._filterText,
        onJobToggle: (jobName: string) => {
          if (this._expandedJobs.has(jobName)) this._expandedJobs.delete(jobName);
          else this._expandedJobs.add(jobName);
          this._renderContent();
        }
      });
    }
    renderPagination(this.container, {
      totalItems: this._getFilteredData().length,
      currentPage: this._currentPage,
      pageSize: this._pageSize,
      viewMode: this._viewMode,
      onPageChange: (page: number) => {
        this._currentPage = page;
        this._renderContent();
      }
    });
  }

  healthCheck() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, hasData: this.hasData };
  }

  async destroy() {
    if (this.container) this.container.innerHTML = '';
    this.mounted = false;
    this.hasData = false;
    this._data = null;
    this._expandedRows.clear();
    this._expandedJobs.clear();
  }
}

export default UIComponent;
