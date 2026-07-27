/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/core/types.ts
 * @version 1.0.0
 * TypeScript interfaces for panel management
 * ═══════════════════════════════════════════════════════════════ */

export interface PanelData {
  panel_id: string;
  module_name: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  thumbnail_path: string | null;
  thumbnail_url: string | null;
  thumbnail_updated_at: string | null;
  tags: string[];
  version: string;
  author: string | null;
  route: string | null;
  screenshot_count: number;
  last_screenshot_at: string | null;
}

export interface PanelCategory {
  category: string;
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface ScreenshotRequest {
  screenshot_id: number;
  panel_id: string;
  status: 'pending' | 'success' | 'error';
  estimated_seconds: number;
}

export interface PanelGestaoState {
  panels: PanelData[];
  categories: PanelCategory[];
  filters: FilterState;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  selectedPanel: PanelData | null;
  modalOpen: boolean;
  pendingScreenshots: Map<string, ScreenshotRequest>;
}

export interface FilterState {
  category: string | null;
  status: 'active' | 'inactive' | 'all';
  search: string;
}

export interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface PanelPorts {
  Logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  EventBus?: { emit: (event: string, data?: unknown) => void };
  [key: string]: unknown;
}

export interface PanelStatus {
  mounted: boolean;
  state: string;
  lastUpdate: string | null;
  error: string | null;
  panelCount: number;
}

export interface PanelInfo {
  version: string;
  moduleId: string;
  panelId: string;
  description: string;
}
