/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/state/store.ts
 * @version 1.0.0
 * Store reativo (Observer pattern). Exporta instância singleton
 * `store` (padrão named-export dos painéis DShowDash).
 * ═══════════════════════════════════════════════════════════════ */

import type { PanelCriacaoState, NavGroup, RealPanel, NavItem, PanelMode } from '../core/types.js';

export type StoreListener = (state: PanelCriacaoState) => void;

function createInitialState(): PanelCriacaoState {
  return {
    groups: [],
    realPanels: [],
    icons: [],
    mode: 'list',
    editing: null,
    loading: false,
    error: null,
  };
}

class PanelCriacaoStore {
  private _state: PanelCriacaoState;
  private _listeners: Set<StoreListener> = new Set();

  constructor() {
    this._state = createInitialState();
  }

  getState(): PanelCriacaoState {
    return this._state;
  }

  setState(partial: Partial<PanelCriacaoState>): void {
    this._state = { ...this._state, ...partial };
    this._notify();
  }

  subscribe(listener: StoreListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  setError(error: string | null): void {
    this.setState({ error, loading: false });
  }

  setGroups(groups: NavGroup[]): void {
    this.setState({ groups, loading: false, error: null });
  }

  setRealPanels(realPanels: RealPanel[]): void {
    this.setState({ realPanels });
  }

  setIcons(icons: string[]): void {
    this.setState({ icons });
  }

  setMode(mode: PanelMode, editing: NavItem | null = null): void {
    this.setState({ mode, editing });
  }

  reset(): void {
    this._state = createInitialState();
    this._notify();
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      try {
        listener(this._state);
      } catch {
        /* listener isolado — falha de um não derruba os outros */
      }
    }
  }
}

export const store = new PanelCriacaoStore();
export { PanelCriacaoStore };
