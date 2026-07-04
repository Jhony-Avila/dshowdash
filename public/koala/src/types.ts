// Tipos de domínio do Koala (consolidação 2026-07-04, E1).
// O projeto roda com strict:false e boa parte do código ainda usa `any` nas bordas de rede;
// estes tipos documentam o shape real das entidades e habilitam apiGet<T>. Adoção incremental —
// aplicar em novos pontos e onde for barato, sem forçar strict global (registrado p/ próximo lote).

export type ProposalStatus =
  | 'draft' | 'generated' | 'sent' | 'viewed'
  | 'expired' | 'won' | 'lost' | 'canceled' | 'user_deleted';

export interface Me {
  id: number;
  system_user_id?: number;
  name?: string;
  email?: string;
  role: 'seller' | 'manager' | 'admin';
  is_active?: number;
}

export interface Proposal {
  id: number;
  proposal_number: string;
  title?: string | null;
  project_name?: string | null;
  status: ProposalStatus;
  currency: string;
  client_snapshot_id?: number | null;
  budget_number?: string | null;
  proposal_date?: string | null;
  valid_until?: string | null;
  current_version_id?: number | null;
  objective?: string | null;
  need_context?: string | null;
  executive_summary?: string | null;
  project_scope?: string | null;
  commercial_notes?: string | null;
  freight_value?: number | null;
  installation_value?: number | null;
  displacement_value?: number | null;
  proposal_discount_value?: number | null;
  proposal_discount_percent?: number | null;
  total_gross?: number | null;
  total_discount?: number | null;
  total_net?: number | null;
  total_expenses?: number | null;
  total_final?: number | null;
  seller_name?: string | null;
  seller_email?: string | null;
  seller_phone?: string | null;
}

export interface LineItem {
  id: number;
  proposal_id: number;
  catalog_item_id?: number | null;
  description: string;
  category_name?: string | null;
  quantity: number;
  unit_measure?: string | null;
  unit_price: number;
  discount_value?: number | null;
  discount_percent?: number | null;
  addition_value?: number | null;
  observation?: string | null;
  subtotal?: number;
  line_subtotal?: number;
  line_total?: number;
  display_order?: number;
}

export type Expense = LineItem;

export interface Contact {
  id: number;
  snapshot_id: number;
  contact_type: 'phone' | 'email';
  contact_value: string;
  display_order?: number;
}

export interface PaymentTerm {
  id: number;
  payment_method_id: number;
  payment_method_name?: string | null;
  installments_quantity?: number | null;
  down_payment_value?: number | null;
  first_due_date?: string | null;
  free_observations?: string | null;
}

export interface ClientSnapshot {
  id: number;
  external_client_id?: number | null;
  client_name?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  document_type?: 'CPF' | 'CNPJ' | null;
  document_number?: string | null;
  internal_client_code?: string | null;
  logo_url?: string | null;
  postal_code?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface TemplateSummary {
  id: number;
  name: string;
  status: 'draft' | 'published' | 'inactive';
  is_default?: number;
  updated_at?: string | null;
}
