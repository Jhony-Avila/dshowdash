// Catálogo DECLARATIVO das colunas de Propostas. Fonte única: adicionar/expor uma coluna =
// acrescentar UMA entrada aqui (nenhuma lógica do grid muda). Campos vêm do endpoint
// GET /api/koala/proposals (ProposalRepository::listByRole devolve todas as colunas da tabela).
// - cmp      → ordenação (comparador ascendente)
// - accessor → valor BRUTO da coluna, consumido pelos filtros (proposalFilters.ts)
// - render   → CellSpec (dado puro, sem JSX; o grid o renderiza)
import { STATUS_LABELS, STATUS_ORDER } from './status';
import { money, dateBr, dateTimeBr } from '../../format';
import type { ColumnDef, CellSpec } from '../dataGrid';

// Status → variante de badge (cor por tokens de tema; NUNCA hardcode). Classes em styles.css.
export const STATUS_VARIANT: Record<string, string> = {
  draft: 'k-badge-neutral',      // Rascunho — cinza
  generated: 'k-badge-info',     // Gerada — azul suave
  sent: 'k-badge-info',          // Enviada — azul
  viewed: 'k-badge-brand',       // Visualizada — roxo (marca)
  won: 'k-badge-ok',             // Ganha — verde
  lost: 'k-badge-danger',        // Perdida — vermelho
  expired: 'k-badge-amber',      // Expirada — âmbar
  canceled: 'k-badge-neutral',   // Cancelada — cinza
  user_deleted: 'k-badge-neutral',
};

// Helpers de célula (retornam CellSpec — dado puro, sem JSX).
const cell = (text: string, title?: string): CellSpec => ({ text: text || '—', title });
const moneyCell = (v: any, cur: string): CellSpec => ({ text: v == null ? '—' : money(v, cur) });
const dateCell = (v: any): CellSpec => ({ text: v ? dateBr(v) : '—' });
const dateTimeCell = (v: any): CellSpec => ({ text: v ? dateTimeBr(v) : '—' });
const cmpText = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''), 'pt-BR');
const cmpNum = (f: (r: any) => any) => (a: any, b: any) => (Number(f(a)) || 0) - (Number(f(b)) || 0);
const cmpNumeric = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''), 'pt-BR', { numeric: true });
const cmpDate = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''));

const isPublic = (r: any) => r.published_at && !r.public_revoked_at;

// Colunas. defaultVisible=true → as do print (+ Total, já em produção). false → opcionais no seletor.
export const PROPOSAL_COLUMNS: ColumnDef[] = [
  // ── Padrão (visíveis) ──
  { key: 'number', label: 'Número', width: '96px', defaultVisible: true, sticky: 'left', fixed: true, filter: 'text',
    cmp: cmpNumeric((r) => r.proposal_number), accessor: (r) => r.proposal_number,
    render: (r) => cell(r.proposal_number) },
  { key: 'title', label: 'Título', width: 'minmax(150px,1.4fr)', defaultVisible: true, filter: 'text',
    cmp: cmpText((r) => r.title), accessor: (r) => r.title,
    render: (r) => cell(r.title, r.title || undefined) },
  { key: 'client', label: 'Cliente', width: 'minmax(110px,1fr)', defaultVisible: true, filter: 'text',
    cmp: cmpText((r) => r.client_display), accessor: (r) => r.client_display,
    render: (r) => cell(r.client_display, r.client_display || undefined) },
  { key: 'budget', label: 'Orçamento', width: '92px', defaultVisible: true, filter: 'budget',
    cmp: cmpNumeric((r) => r.budget_number), accessor: (r) => r.budget_number,
    render: (r) => cell(r.budget_number ? 'Orç ' + r.budget_number : '') },
  { key: 'date', label: 'Data', width: '100px', defaultVisible: true, filter: 'daterange',
    cmp: cmpDate((r) => r.proposal_date), accessor: (r) => r.proposal_date,
    render: (r) => dateCell(r.proposal_date) },
  { key: 'status', label: 'Status', width: '112px', defaultVisible: true, filter: 'select',
    cmp: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status), accessor: (r) => r.status,
    render: (r) => ({ text: STATUS_LABELS[r.status] || r.status, badge: STATUS_VARIANT[r.status] || 'k-badge-neutral' }) },
  { key: 'total', label: 'Total', width: '120px', defaultVisible: true, num: true,
    cmp: cmpNum((r) => r.total_final), accessor: (r) => r.total_final,
    render: (r) => moneyCell(r.total_final, r.currency) },

  // ── Opcionais (já vêm no endpoint — zero mudança de API) ──
  { key: 'seller', label: 'Vendedor', width: 'minmax(120px,1fr)', defaultVisible: false, filter: 'text',
    cmp: cmpText((r) => r.seller_name), accessor: (r) => r.seller_name,
    render: (r) => cell(r.seller_name, r.seller_name || undefined) },
  { key: 'project', label: 'Projeto', width: 'minmax(120px,1fr)', defaultVisible: false, filter: 'text',
    cmp: cmpText((r) => r.project_name), accessor: (r) => r.project_name,
    render: (r) => cell(r.project_name, r.project_name || undefined) },
  { key: 'valid_until', label: 'Validade', width: '100px', defaultVisible: false, filter: 'daterange',
    cmp: cmpDate((r) => r.valid_until), accessor: (r) => r.valid_until,
    render: (r) => dateCell(r.valid_until) },
  { key: 'approval_deadline', label: 'Prazo aprov.', width: '110px', defaultVisible: false, filter: 'daterange',
    cmp: cmpDate((r) => r.approval_deadline), accessor: (r) => r.approval_deadline,
    render: (r) => dateCell(r.approval_deadline) },
  { key: 'created_at', label: 'Criada em', width: '132px', defaultVisible: false, filter: 'daterange',
    cmp: cmpDate((r) => r.created_at), accessor: (r) => r.created_at,
    render: (r) => dateTimeCell(r.created_at) },
  { key: 'updated_at', label: 'Atualizada em', width: '132px', defaultVisible: false, filter: 'daterange',
    cmp: cmpDate((r) => r.updated_at), accessor: (r) => r.updated_at,
    render: (r) => dateTimeCell(r.updated_at) },
  { key: 'published_at', label: 'Publicada em', width: '132px', defaultVisible: false, filter: 'daterange',
    cmp: cmpDate((r) => r.published_at), accessor: (r) => r.published_at,
    render: (r) => dateTimeCell(r.published_at) },
  { key: 'currency', label: 'Moeda', width: '72px', defaultVisible: false, filter: 'text',
    cmp: cmpText((r) => r.currency), accessor: (r) => r.currency,
    render: (r) => cell(r.currency) },
  { key: 'discount_pct', label: 'Desc. %', width: '84px', defaultVisible: false, num: true,
    cmp: cmpNum((r) => r.proposal_discount_percent), accessor: (r) => r.proposal_discount_percent,
    render: (r) => ({ text: r.proposal_discount_percent == null ? '—' : Number(r.proposal_discount_percent).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' }) },
  { key: 'total_gross', label: 'Total bruto', width: '120px', defaultVisible: false, num: true,
    cmp: cmpNum((r) => r.total_gross), accessor: (r) => r.total_gross,
    render: (r) => moneyCell(r.total_gross, r.currency) },
  { key: 'total_expenses', label: 'Despesas', width: '120px', defaultVisible: false, num: true,
    cmp: cmpNum((r) => r.total_expenses), accessor: (r) => r.total_expenses,
    render: (r) => moneyCell(r.total_expenses, r.currency) },
  { key: 'public', label: 'Link público', width: '110px', defaultVisible: false, filter: 'budget',
    cmp: cmpNum((r) => (isPublic(r) ? 1 : 0)), accessor: (r) => (isPublic(r) ? '1' : ''),
    render: (r) => (isPublic(r) ? { text: 'Publicado', badge: 'k-badge-ok' } : { text: 'Não', badge: 'k-badge-neutral' }) },
];
