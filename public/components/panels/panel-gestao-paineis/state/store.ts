/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/state/store.ts
 * @version 1.0.0
 * Reactive store with Observer pattern
 * ═══════════════════════════════════════════════════════════════ */

import type { PanelGestaoState, PanelData, PanelCategory, FilterState, PaginationState, ScreenshotRequest } from '../core/types.js';
import { DEFAULT_PER_PAGE } from '../core/constants.js';

export type StoreListener = (state: PanelGestaoState) => void;

function createInitialState(): PanelGestaoState {
  return {
    panels: [],
    categories: [],
    filters: {
      category: null,
      status: 'all',
      search: '',
    },
    pagination: {
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      total: 0,
      total_pages: 0,
    },
    loading: false,
    error: null,
    selectedPanel: null,
    modalOpen: false,
    pendingScreenshots: new Map(),
  };
}

class PanelGestaoStore {
  private _state: PanelGestaoState;
  private _listeners: Set<StoreListener> = new Set();

  constructor() {
    this._state = createInitialState();
  }

  getState(): PanelGestaoState {
    return this._state;
  }

  setState(partial: Partial<PanelGestaoState>): void {
    this._state = { ...this._state, ...partial };
    this._notify();
  }

  subscribe(listener: StoreListener): () => void {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  setPanels(panels: PanelData[], meta?: { total: number; page: number; per_page: number; total_pages: number }): void {
    const update: Partial<PanelGestaoState> = { panels, loading: false, error: null };
    if (meta) {
      update.pagination = { ...this._state.pagination, ...meta };
    }
    this.setState(update);
  }

  setCategories(categories: PanelCategory[]): void {
    this.setState({ categories });
  }

  setFilters(filters: Partial<FilterState>): void {
    this.setState({
      filters: { ...this._state.filters, ...filters },
      pagination: { ...this._state.pagination, page: 1 },
    });
  }

  setPage(page: number): void {
    this.setState({
      pagination: { ...this._state.pagination, page },
    });
  }

  setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  setError(error: string | null): void {
    this.setState({ error, loading: false });
  }

  selectPanel(panel: PanelData | null): void {
    this.setState({ selectedPanel: panel, modalOpen: panel !== null });
  }

  closeModal(): void {
    this.setState({ selectedPanel: null, modalOpen: false });
  }

  updatePanelInList(panelId: string, updates: Partial<PanelData>): void {
    const panels = this._state.panels.map(p =>
      p.panel_id === panelId ? { ...p, ...updates } : p
    );
    const selectedPanel = this._state.selectedPanel?.panel_id === panelId
      ? { ...this._state.selectedPanel, ...updates }
      : this._state.selectedPanel;
    this.setState({ panels, selectedPanel });
  }

  addPendingScreenshot(panelId: string, request: ScreenshotRequest): void {
    const pending = new Map(this._state.pendingScreenshots);
    pending.set(panelId, request);
    this.setState({ pendingScreenshots: pending });
  }

  removePendingScreenshot(panelId: string): void {
    const pending = new Map(this._state.pendingScreenshots);
    pending.delete(panelId);
    this.setState({ pendingScreenshots: pending });
  }

  reset(): void {
    this._state = createInitialState();
    this._listeners.clear();
  }

  private _notify(): void {
    const state = this._state;
    this._listeners.forEach(fn => {
      try { fn(state); } catch (_) { /* swallow */ }
    });
  }
}

export const store = new PanelGestaoStore();
