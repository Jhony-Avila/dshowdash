// screens/EntidadesGrids.tsx — telas Pessoas / Organizações / Atividades sobre EntityGrid.
// @version 2.0.0  @created 2026-07-21
// v2.0.0 (Elevacao visual — Fase 3): cards-resumo por entidade (`statsEntity`),
//        avatares de iniciais em pessoas/organizacoes/usuarios e rotulos legiveis
//        de tipo de atividade (a API devolve 'call'/'meeting'/… em ingles).
import { lazy, Suspense, useState } from 'react';
import { UsersRound, Building2, CalendarCheck2, Target, Package, NotebookPen, UserRoundCog } from 'lucide-react';
import { EntityGrid, type GridColuna } from './EntityGrid';
import { CelulaComAvatar } from './Avatar';
import { PageHeader } from './PageHeader';
import { KpiStrip } from './KpiStrip';
import { SkeletonBloco } from './Estados';
import { LayoutGrid, CalendarDays } from 'lucide-react';

// A agenda so e baixada por quem abre a agenda (FullCalendar e pesado).
const Agenda = lazy(() => import('./Agenda').then((m) => ({ default: m.Agenda })));
import { PersonDrawer, OrgDrawer } from './ContatoDrawers';
import { ActivityDrawer, LeadDrawer, ProductDrawer } from './EntidadeDrawers';
import { fmtData, fmtBRL, fmtNum } from '../lib/format';
import type {
  PipeStatus, PipePersonRow, PipeOrgRow, PipeActivityRow,
  PipeLeadRow, PipeProductRow, PipeNoteRow, PipeUserRow,
} from '../shell/types';

const dashOr = (v: unknown): string => (v == null || v === '' ? '—' : String(v));

// ── Pessoas ──────────────────────────────────────────────────
const COLS_PESSOAS: GridColuna<PipePersonRow>[] = [
  { key: 'name', label: 'Nome', sortavel: true, fixa: true, width: 260,
    render: (r) => <CelulaComAvatar nome={r.name} sub={r.job_title} />, csv: (r) => r.name ?? '' },
  { key: 'org', label: 'Organização', sortavel: true, render: (r) => dashOr(r.org) },
  { key: 'email', label: 'E-mail', render: (r) => dashOr(r.email) },
  { key: 'phone', label: 'Telefone', render: (r) => dashOr(r.phone) },
  { key: 'open_deals', label: 'Negócios', align: 'right', render: (r) => r.open_deals > 0 ? <span className="pp-chip">{r.open_deals} aberto{r.open_deals > 1 ? 's' : ''}</span> : (r.won_deals > 0 ? <span style={{ color: 'var(--pp-text-dim)', fontSize: 11.5 }}>{r.won_deals} ganho{r.won_deals > 1 ? 's' : ''}</span> : '—') },
  { key: 'owner', label: 'Dono', render: (r) => dashOr(r.owner) },
];
export function Pessoas({ status }: { status?: PipeStatus }) {
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <>
      <EntityGrid<PipePersonRow> titulo="Pessoas" Icon={UsersRound} entidadePlural="pessoas" endpoint="/persons" cfEntity="person"
        colunas={COLS_PESSOAS} sortInicial="update_time" buscaPlaceholder="Buscar por nome, e-mail ou telefone…"
        statsEntity="persons" status={status} onRowClick={(r) => setAberto(r.id)} />
      {aberto != null && <PersonDrawer personId={aberto} onClose={() => setAberto(null)} />}
    </>
  );
}

// ── Organizações ─────────────────────────────────────────────
const COLS_ORGS: GridColuna<PipeOrgRow>[] = [
  { key: 'name', label: 'Organização', sortavel: true, fixa: true, width: 260,
    render: (r) => <CelulaComAvatar nome={r.name} sub={r.cnpj} />, csv: (r) => r.name ?? '' },
  { key: 'local', label: 'Cidade/UF', render: (r) => (r.city || r.state) ? `${dashOr(r.city)}${r.state ? '/' + r.state : ''}` : '—', csv: (r) => (r.city || r.state) ? `${r.city ?? ''}${r.state ? '/' + r.state : ''}` : '' },
  { key: 'people', label: 'Pessoas', align: 'right', render: (r) => r.people > 0 ? <span className="pp-num">{fmtNum(r.people)}</span> : '—' },
  { key: 'open_deals', label: 'Negócios', align: 'right', render: (r) => r.open_deals > 0 ? <span className="pp-chip">{r.open_deals} aberto{r.open_deals > 1 ? 's' : ''}</span> : '—' },
  { key: 'valor_ganho', label: 'Valor ganho', align: 'right', render: (r) => r.valor_ganho > 0 ? <span style={{ color: 'var(--pp-ok)', fontWeight: 600 }}>{fmtBRL(r.valor_ganho)}</span> : '—' },
  { key: 'owner', label: 'Dono', render: (r) => dashOr(r.owner) },
];
export function Organizacoes({ status }: { status?: PipeStatus }) {
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <>
      <EntityGrid<PipeOrgRow> titulo="Organizações" Icon={Building2} entidadePlural="organizações" endpoint="/organizations" cfEntity="organization"
        colunas={COLS_ORGS} sortInicial="update_time" buscaPlaceholder="Buscar por nome ou CNPJ…"
        statsEntity="organizations" status={status} onRowClick={(r) => setAberto(r.id)} />
      {aberto != null && <OrgDrawer orgId={aberto} onClose={() => setAberto(null)} />}
    </>
  );
}

// ── Atividades ───────────────────────────────────────────────
function badgeAtividade(r: PipeActivityRow) {
  if (r.done) return <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}><span className="pp-dot" style={{ background: 'var(--pp-ok)' }} />Concluída</span>;
  if (r.overdue) return <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}><span className="pp-dot" style={{ background: 'var(--pp-danger)' }} />Atrasada</span>;
  return <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}><span className="pp-dot" style={{ background: 'var(--pp-sync)' }} />Pendente</span>;
}
// A API devolve o tipo em ingles ('call', 'meeting', …). Traduz o que e padrao e
// cai no valor cru quando o tenant tem tipo personalizado.
const ROTULO_TIPO: Record<string, string> = {
  call: 'Ligação', meeting: 'Reunião', task: 'Tarefa', deadline: 'Prazo',
  email: 'E-mail', lunch: 'Almoço', send_email: 'Enviar e-mail',
};
const rotuloTipo = (t?: string | null): string => (t ? (ROTULO_TIPO[t] ?? t.replace(/_/g, ' ')) : '—');

const COLS_ATIV: GridColuna<PipeActivityRow>[] = [
  { key: 'subject', label: 'Assunto', sortavel: true, fixa: true, render: (r) => <span className="pp-td-title" title={r.subject ?? ''}>{dashOr(r.subject)}</span> },
  { key: 'type', label: 'Tipo', sortavel: true, render: (r) => rotuloTipo(r.type), csv: (r) => rotuloTipo(r.type) },
  { key: 'situacao', label: 'Situação', render: (r) => badgeAtividade(r), csv: (r) => r.done ? 'Concluída' : (r.overdue ? 'Atrasada' : 'Pendente') },
  { key: 'due_date', label: 'Vencimento', sortavel: true, render: (r) => (r.due_date ? fmtData(r.due_date).slice(0, 10) : '—') },
  { key: 'deal', label: 'Negócio', render: (r) => <span className="pp-td-title" title={r.deal ?? ''}>{dashOr(r.deal)}</span> },
  { key: 'owner', label: 'Dono', render: (r) => dashOr(r.owner) },
];
export function Atividades({ status }: { status?: PipeStatus }) {
  const [aberto, setAberto] = useState<number | null>(null);
  const [vista, setVista] = useState<'grade' | 'agenda'>(() => {
    try { return localStorage.getItem('pp:ativ:vista') === 'agenda' ? 'agenda' : 'grade'; } catch { return 'grade'; }
  });
  const trocar = (v: 'grade' | 'agenda') => {
    setVista(v);
    try { localStorage.setItem('pp:ativ:vista', v); } catch { /* ignora */ }
  };
  const alternador = (
    <div className="pp-seg" role="group" aria-label="Forma de visualizar">
      <button className={`pp-seg-b${vista === 'grade' ? ' is-active' : ''}`} onClick={() => trocar('grade')}
        aria-pressed={vista === 'grade'}><LayoutGrid size={14} /> Grade</button>
      <button className={`pp-seg-b${vista === 'agenda' ? ' is-active' : ''}`} onClick={() => trocar('agenda')}
        aria-pressed={vista === 'agenda'}><CalendarDays size={14} /> Agenda</button>
    </div>
  );

  return (
    <>
      {vista === 'grade' ? (
        <EntityGrid<PipeActivityRow> titulo="Atividades" Icon={CalendarCheck2} entidadePlural="atividades" endpoint="/activities"
          colunas={COLS_ATIV} sortInicial="due_date" buscaPlaceholder="Buscar por assunto…" status={status} statsEntity="activities"
          acoesExtras={alternador}
          onRowClick={(r) => setAberto(r.id)}
          filtros={[
            { key: 'done', label: 'Todas', options: [{ value: '0', label: 'Pendentes' }, { value: '1', label: 'Concluídas' }] },
            { key: 'type', label: 'Todos os tipos', facetKey: 'types' },
          ]} />
      ) : (
        <div>
          <PageHeader Icon={CalendarCheck2} titulo="Atividades" descricao="atividades na base local" acoes={alternador} />
          <KpiStrip entity="activities" />
          {status?.status !== 'connected'
            ? <div className="pp-card" style={{ maxWidth: 'none' }}><p className="pp-placeholder">A integração não está conectada.</p></div>
            : <Suspense fallback={<div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={8} altura={22} /></div>}>
                <Agenda onAbrir={setAberto} />
              </Suspense>}
        </div>
      )}
      {aberto != null && <ActivityDrawer activityId={aberto} onClose={() => setAberto(null)} />}
    </>
  );
}

function pill(texto: string, cor: string) {
  return <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}><span className="pp-dot" style={{ background: cor }} />{texto}</span>;
}

// ── Leads ────────────────────────────────────────────────────
const COLS_LEADS: GridColuna<PipeLeadRow>[] = [
  { key: 'title', label: 'Lead', sortavel: true, fixa: true, render: (r) => <span className="pp-td-title" title={r.title ?? ''}>{dashOr(r.title)}</span> },
  { key: 'value', label: 'Valor', sortavel: true, align: 'right', render: (r) => (r.value != null ? fmtBRL(r.value, r.currency ?? 'BRL') : '—') },
  { key: 'origin', label: 'Origem', render: (r) => dashOr(r.origin) },
  { key: 'org', label: 'Organização', render: (r) => dashOr(r.org) },
  { key: 'person', label: 'Contato', render: (r) => dashOr(r.person) },
  { key: 'owner', label: 'Dono', render: (r) => dashOr(r.owner) },
  { key: 'situacao', label: 'Situação', render: (r) => r.converted ? pill('Convertido', 'var(--pp-ok)') : (r.archived ? pill('Arquivado', 'var(--pp-text-dim)') : pill('Ativo', 'var(--pp-sync)')), csv: (r) => r.converted ? 'Convertido' : (r.archived ? 'Arquivado' : 'Ativo') },
];
export function Leads({ status }: { status?: PipeStatus }) {
  const [aberto, setAberto] = useState<string | null>(null);
  return (
    <>
      <EntityGrid<PipeLeadRow> titulo="Leads" Icon={Target} entidadePlural="leads" endpoint="/leads"
        colunas={COLS_LEADS} sortInicial="update_time" buscaPlaceholder="Buscar por título…" status={status} statsEntity="leads"
        onRowClick={(r) => setAberto(r.id)}
        filtros={[{ key: 'archived', label: 'Todos', options: [{ value: '0', label: 'Ativos' }, { value: '1', label: 'Arquivados' }] }]} />
      {aberto != null && <LeadDrawer leadId={aberto} onClose={() => setAberto(null)} />}
    </>
  );
}

// ── Produtos ─────────────────────────────────────────────────
const COLS_PROD: GridColuna<PipeProductRow>[] = [
  { key: 'name', label: 'Produto', sortavel: true, fixa: true, render: (r) => <span className="pp-td-title" title={r.name ?? ''}>{dashOr(r.name)}</span> },
  { key: 'code', label: 'Código', sortavel: true, render: (r) => dashOr(r.code) },
  { key: 'category', label: 'Categoria', render: (r) => dashOr(r.category) },
  { key: 'unit', label: 'Unidade', render: (r) => dashOr(r.unit) },
  { key: 'price', label: 'Preço', align: 'right', render: (r) => r.price != null && r.price > 0 ? <span style={{ fontWeight: 600 }}>{fmtBRL(r.price, r.currency ?? 'BRL')}</span> : '—' },
  { key: 'tax', label: 'Imposto', align: 'right', render: (r) => (r.tax != null && r.tax > 0 ? `${r.tax}%` : '—') },
  { key: 'owner', label: 'Dono', render: (r) => dashOr(r.owner) },
];
export function Produtos({ status }: { status?: PipeStatus }) {
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <>
      <EntityGrid<PipeProductRow> titulo="Produtos" Icon={Package} entidadePlural="produtos" endpoint="/products" cfEntity="product"
        colunas={COLS_PROD} sortInicial="name" buscaPlaceholder="Buscar por nome ou código…" status={status} statsEntity="products"
        onRowClick={(r) => setAberto(r.id)}
        filtros={[{ key: 'category', label: 'Todas as categorias', facetKey: 'categories' }]} />
      {aberto != null && <ProductDrawer productId={aberto} onClose={() => setAberto(null)} />}
    </>
  );
}

// ── Notas ────────────────────────────────────────────────────
const COLS_NOTAS: GridColuna<PipeNoteRow>[] = [
  { key: 'content', label: 'Conteúdo', fixa: true, width: 440, render: (r) => <span title={r.content ?? ''} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.content && r.content.trim() !== '' ? r.content : '(sem texto)'}</span>, csv: (r) => r.content ?? '' },
  { key: 'vinculo', label: 'Vínculo', render: (r) => dashOr(r.vinculo) },
  { key: 'author', label: 'Autor', render: (r) => dashOr(r.author) },
  { key: 'add_time', label: 'Criada', sortavel: true, render: (r) => fmtData(r.add_time) },
];
export function Notas({ status }: { status?: PipeStatus }) {
  return <EntityGrid<PipeNoteRow> titulo="Notas" Icon={NotebookPen} entidadePlural="notas" endpoint="/notes"
    colunas={COLS_NOTAS} sortInicial="add_time" buscaPlaceholder="Buscar no conteúdo…" status={status} statsEntity="notes" />;
}

// ── Usuários ─────────────────────────────────────────────────
const COLS_USERS: GridColuna<PipeUserRow>[] = [
  { key: 'name', label: 'Nome', sortavel: true, fixa: true, width: 240,
    render: (r) => <CelulaComAvatar nome={r.name} />, csv: (r) => r.name ?? '' },
  { key: 'email', label: 'E-mail', sortavel: true, render: (r) => dashOr(r.email) },
  { key: 'active', label: 'Situação', render: (r) => r.active ? pill('Ativo', 'var(--pp-ok)') : pill('Inativo', 'var(--pp-text-dim)') },
  { key: 'timezone', label: 'Fuso', render: (r) => dashOr(r.timezone) },
  { key: 'last_login', label: 'Último acesso', sortavel: true, render: (r) => fmtData(r.last_login) },
];
export function Usuarios({ status }: { status?: PipeStatus }) {
  return <EntityGrid<PipeUserRow> titulo="Usuários" Icon={UserRoundCog} entidadePlural="usuários" endpoint="/users"
    colunas={COLS_USERS} sortInicial="name" buscaPlaceholder="Buscar por nome ou e-mail…" status={status}
    filtros={[{ key: 'active', label: 'Todos', options: [{ value: '1', label: 'Ativos' }, { value: '0', label: 'Inativos' }] }]} />;
}
