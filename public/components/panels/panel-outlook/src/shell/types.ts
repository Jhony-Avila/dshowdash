// shell/types.ts — tipos compartilhados do painel Integração Outlook.
// @version 1.0.0  @created 2026-07-21

export interface ShellFlag {
  key: string;
  enabled: boolean;
  payload?: unknown;
  source?: string;
}

export interface ShellConfig {
  flag?: ShellFlag;
  signal?: AbortSignal;
  [k: string]: unknown;
}

// Envelope oficial do DShowDash: {ok, data, error, meta}.
export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error: string | null;
  meta?: { message?: string; [k: string]: unknown } | null;
}

// ── Contas (GET /api/outlook/accounts | /status) ─────────────────────────
export type ConnStatus =
  | 'connected' | 'needs_auth' | 'revoked' | 'expired' | 'error' | 'disconnected';

export interface OutlookAccount {
  id: number;
  microsoft_account_id: string | null;
  tenant_id: string | null;
  email: string | null;
  display_name: string | null;
  account_type: 'work' | 'personal' | 'shared' | 'unknown';
  is_default: boolean;
  is_active: boolean;
  connection_status: ConnStatus;
  scopes: string | null;
  token_expires_at: string | null;
  last_sync_at: string | null;
  last_success_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string | null;
  disconnected_at: string | null;
}

// Estado do módulo (GET /api/outlook/status).
export interface OutlookStatus {
  phase: number;
  db_ready: boolean;
  crypto_ready: boolean;
  oauth_configured: boolean;
  provider?: string;
  tenant: string | null;
  redirect_uri: string | null;
  accounts_total: number;
  accounts_active: number;
  accounts_need_auth?: number;
  accounts: OutlookAccount[];
  message?: string;
}

export interface AccountsResponse {
  accounts: OutlookAccount[];
  oauth_configured: boolean;
  crypto_ready: boolean;
}

export interface ConnectResponse {
  authorize_url: string;
}

// ── Endereço e mensagens ─────────────────────────────────────────────────
export interface EmailAddress {
  name?: string | null;
  address?: string | null;
}

export interface MessageListItem {
  id: string;
  subject: string;
  from: EmailAddress | null;
  to: (EmailAddress | null)[];
  received: string | null;
  sent: string | null;
  preview: string;
  is_read: boolean;
  is_draft: boolean;
  has_attachments: boolean;
  importance: 'low' | 'normal' | 'high';
  is_flagged: boolean;
  categories: string[];
  conversation_id: string | null;
  scheduled_at?: string | null;
  sched_status?: string | null;
}

export interface MessagesPage {
  items: MessageListItem[];
  next: string | null;
}

export interface MessageBody {
  contentType: string;
  content: string;
}

export interface MessageDetail {
  id: string;
  subject: string;
  from: { emailAddress?: EmailAddress } | null;
  toRecipients?: { emailAddress?: EmailAddress }[];
  ccRecipients?: { emailAddress?: EmailAddress }[];
  receivedDateTime?: string | null;
  sentDateTime?: string | null;
  body?: MessageBody;
  bodyPreview?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  importance?: string;
  categories?: string[];
  webLink?: string;
}

export interface MessageResponse {
  message: MessageDetail | null;
}

// ── Anexos (§20) ─────────────────────────────────────────────────────────
export interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline?: boolean;
}
export interface AttachmentsResponse { items: Attachment[]; }

// ── Envio em massa (§23) ─────────────────────────────────────────────────
export interface MassResult { email: string; status: string; }
export interface MassStatus {
  id: number; total: number; processed: number;
  success: number; failure: number; status: string;
  results: MassResult[];
}

// ── Pastas (GET /api/outlook/folders) ────────────────────────────────────
export interface FolderNode {
  id: string;
  well_known?: string | null;
  display_name: string;
  unread: number;
  total: number;
  children?: FolderNode[];
}

export interface FoldersResponse {
  folders: FolderNode[];
}

// ── Badge (GET /api/outlook/header-counter) ──────────────────────────────
export interface HeaderCounter {
  received_today: number;
  unread: number;
  updated_at: string | null;
  degraded?: boolean;
}

// ── Dashboard (GET /api/outlook/dashboard/summary) ───────────────────────
export interface DashboardBig {
  received_today: number;
  sent_today: number;
  unread: number;
  important: number;
  with_attachments: number;
  total_period: number;
  avg_per_day: number;
  avg_response_seconds: number;
}
export interface DashboardDay { date: string; received: number; sent: number; }
export interface DashboardHour { hour: number; count: number; }
export interface DashboardContact { name: string; address: string; count: number; }
export interface DashboardStatus { read: number; unread: number; important: number; archived: number; }

export interface DashboardSummary {
  available: boolean;
  reason?: string;
  message?: string;
  provider?: string;
  period?: string;
  big?: DashboardBig;
  by_day?: DashboardDay[];
  by_hour?: DashboardHour[];
  top_contacts?: DashboardContact[];
  status?: DashboardStatus;
  attachments_count?: number;
}

// ── Modelos (§22) ────────────────────────────────────────────────────────
export interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  subject: string;
  body_html: string;
  is_favorite: boolean;
  created_at: string | null;
}
export interface TemplatesResponse {
  available: boolean;
  templates: EmailTemplate[];
  categories: string[];
  message?: string;
}

// ── Categorias (§15) ─────────────────────────────────────────────────────
export interface OutlookCategory { name: string; color: string; }
export interface CategoriesResponse {
  available: boolean;
  categories: OutlookCategory[];
  message?: string;
}

// ── Regras automáticas (§16) ─────────────────────────────────────────────
export interface RuleConditions {
  from_contains: string; subject_contains: string; body_contains: string;
  has_attachment: boolean; importance: string; category: string;
}
export interface RuleActions {
  move_to: string; assign_category: string; mark_read: boolean;
  mark_important: boolean; delete: boolean; stop: boolean;
}
export interface OutlookRule {
  id: number; name: string; enabled: boolean; order: number;
  conditions: RuleConditions; actions: RuleActions;
}
export interface RulesResponse {
  available: boolean;
  rules: OutlookRule[];
  message?: string;
}
