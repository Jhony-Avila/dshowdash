// Migrado para TypeScript: 2026-02-25
'use strict';
// Panel 05 - Adapter Bridge v1.0.0-ENTERPRISE
// Bridge para /public/components/panels/panel-05/index.js

import PanelComponent from '/components/panels/panel-05/index.js';

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'panel-05-adapter';
export const PANEL_ID: string = 'panel-05';

interface PanelStatus {
  mounted: boolean;
  [key: string]: unknown;
}

interface PanelInfo {
  version: string;
  moduleId: string;
  panelId: string;
  legacy: string;
}

interface PanelComponentModule {
  mount?: (container: HTMLElement) => void | Promise<void>;
  unmount?: () => void | Promise<void>;
  refresh?: () => void | Promise<void>;
  getStatus?: () => PanelStatus;
  isReady?: () => boolean;
  [key: string]: unknown;
}

interface PanelAdapter {
  mount: (container: HTMLElement) => void | Promise<void> | undefined;
  unmount: () => void | Promise<void> | undefined;
  refresh: () => void | Promise<void> | undefined;
  getStatus: () => PanelStatus;
  isReady: () => boolean;
  info: () => PanelInfo;
}

const TypedPanelComponent = PanelComponent as unknown as unknown as PanelComponentModule;

export * from '/components/panels/panel-05/index.js';
export { PanelComponent };

export const Panel: PanelAdapter = {
  mount: (container: HTMLElement): void | Promise<void> | undefined => TypedPanelComponent?.mount?.(container),
  unmount: (): void | Promise<void> | undefined => TypedPanelComponent?.unmount?.(),
  refresh: (): void | Promise<void> | undefined => TypedPanelComponent?.refresh?.(),
  getStatus: (): PanelStatus => TypedPanelComponent?.getStatus?.() || { mounted: false },
  isReady: (): boolean => TypedPanelComponent?.isReady?.() ?? false,
  info: (): PanelInfo => ({ version: VERSION, moduleId: MODULE_ID, panelId: PANEL_ID, legacy: '/components/panels/panel-05/index.js' })
};

export const mountPanel = (container: HTMLElement): void | Promise<void> | undefined => Panel.mount(container);
export const unmountPanel = (): void | Promise<void> | undefined => Panel.unmount();
export const refreshPanel = (): void | Promise<void> | undefined => Panel.refresh();
export const getPanelStatus = (): PanelStatus => Panel.getStatus();

export default Panel;
