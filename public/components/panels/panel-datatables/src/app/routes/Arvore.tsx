// app/routes/Arvore.tsx — Árvore de infraestrutura (§8.1 / §38.2).
// @version 1.0.0  @created 2026-07-21
//
// Navegação hierárquica servidor → conexão → banco → tabela → campo, com
// EXPANSÃO SOB DEMANDA: servidores/conexões/bancos vêm da chamada /infrastructure;
// tabelas (por banco) e campos (por tabela) só são buscados ao expandir o nó —
// o catálogo é grande demais para carregar tudo de uma vez. Clique no nome da
// tabela abre o drawer de detalhe.
import { useState, type JSX, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../../lib/api';
import { fmtInt, fmtBytes } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { FilterBar } from '../../components/grid/FilterBar';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { TabelaDrawer } from './drawers/TabelaDrawer';
import css from './Arvore.module.css';

interface Banco { id: number; name: string; size_bytes: number | null; table_count: number; field_count: number; status: string }
interface Conexao { id: number; name: string; host: string; port: number; status: string; source_type: string; environment_label: string | null; environment_color: string | null; databases: Banco[] }
interface Servidor { server_id: number | null; name: string; identifier: string | null; provider: string | null; status: string | null; connections: Conexao[] }
interface Tabela { id: number; name: string; table_type: string; row_count_approx: number | null; size_bytes: number | null; field_count: number; is_orphan: number; has_pk: number; classification: string }
interface Campo { id: number; name: string; data_type: string; column_type: string; is_pk: boolean; is_fk: boolean; is_unique: boolean; sensitivity: string | null }

export function Arvore(): JSX.Element {
  const [drawer, setDrawer] = useState<number | null>(null);
  const [busca, setBusca] = useState('');

  const q = useQuery({
    queryKey: chaves.infra,
    queryFn: ({ signal }) => apiGet<Servidor[]>('/infrastructure', undefined, signal),
  });

  if (q.isPending) return <SkeletonCartoes n={3} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar a árvore de infraestrutura." codigo={e.code} onRetry={() => q.refetch()} />;
  }

  const servidores = q.data;
  const t = busca.trim().toLowerCase();
  const filtrados = t
    ? servidores
        .map((s) => ({
          ...s,
          connections: s.connections.filter((c) =>
            c.name.toLowerCase().includes(t) || (c.host ?? '').toLowerCase().includes(t) ||
            c.databases.some((d) => d.name.toLowerCase().includes(t))),
        }))
        .filter((s) => s.name.toLowerCase().includes(t) || s.connections.length > 0)
    : servidores;

  const totConn = servidores.reduce((n, s) => n + s.connections.length, 0);
  const totDb = servidores.reduce((n, s) => n + s.connections.reduce((m, c) => m + c.databases.length, 0), 0);

  return (
    <div className={css.raiz}>
      <section className={css.cards}>
        <MetricCard icone="Server" rotulo="Servidores" valor={servidores.length} contexto="máquinas" />
        <MetricCard icone="PlugZap" rotulo="Conexões" valor={totConn} contexto="monitoradas" />
        <MetricCard icone="Database" rotulo="Bancos" valor={totDb} contexto="catalogados" />
      </section>

      <div className={css.nota}>
        <Icone nome="ListTree" size={13} />
        Expanda os nós para descer de servidor a campo. Tabelas e campos carregam
        <strong> sob demanda</strong> — o catálogo é grande demais para abrir tudo de uma vez.
      </div>

      <FilterBar busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar conexão, host ou banco…' }}
        aoLimpar={() => setBusca('')} algumAtivo={!!busca} />

      <div className={css.arvore} role="tree" aria-label="Árvore de infraestrutura">
        {filtrados.length === 0
          ? <p className={css.vazio}>Nenhum servidor/conexão corresponde ao filtro.</p>
          : filtrados.map((s, i) => <NoServidor key={s.server_id ?? `x${i}`} srv={s} aoAbrirTabela={setDrawer} />)}
      </div>

      <TabelaDrawer id={drawer} aoFechar={() => setDrawer(null)} />
    </div>
  );
}

// ── linha genérica expansível ──────────────────────────────────────────────
function Linha({ nivel, aberto, temFilhos, icone, cor, onToggle, children }: {
  nivel: number; aberto: boolean; temFilhos: boolean; icone: string; cor?: string;
  onToggle: () => void; children: ReactNode;
}): JSX.Element {
  return (
    <div className={css.linha} style={{ paddingLeft: 8 + nivel * 20 }}
      role="button" tabIndex={0} onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
      <span className={css.chevron}>
        {temFilhos
          ? <Icone nome="ChevronRight" size={13} className={aberto ? css.chevronAberto : undefined} />
          : <span className={css.semChevron} />}
      </span>
      <span className={css.icone} style={cor ? { color: cor } : undefined}><Icone nome={icone} size={14} /></span>
      {children}
    </div>
  );
}

function Carregando({ nivel }: { nivel: number }): JSX.Element {
  return (
    <div className={css.carregando} style={{ paddingLeft: 8 + nivel * 20 + 20 }}>
      <Icone nome="RefreshCw" size={12} className={css.girando} /> carregando…
    </div>
  );
}

// ── níveis ──────────────────────────────────────────────────────────────────
function NoServidor({ srv, aoAbrirTabela }: { srv: Servidor; aoAbrirTabela: (id: number) => void }): JSX.Element {
  const [aberto, setAberto] = useState(true);
  return (
    <div role="treeitem" aria-expanded={aberto}>
      <Linha nivel={0} aberto={aberto} temFilhos={srv.connections.length > 0} icone="Server" onToggle={() => setAberto((v) => !v)}>
        <span className={css.nome}>{srv.name}</span>
        {srv.provider && <span className={css.meta}>{srv.provider}</span>}
        <span className={css.contagem}>{fmtInt(srv.connections.length)} conexão(ões)</span>
      </Linha>
      {aberto && srv.connections.map((c) => <NoConexao key={c.id} conn={c} aoAbrirTabela={aoAbrirTabela} />)}
    </div>
  );
}

function NoConexao({ conn, aoAbrirTabela }: { conn: Conexao; aoAbrirTabela: (id: number) => void }): JSX.Element {
  const [aberto, setAberto] = useState(false);
  return (
    <div role="treeitem" aria-expanded={aberto}>
      <Linha nivel={1} aberto={aberto} temFilhos={conn.databases.length > 0} icone="PlugZap" onToggle={() => setAberto((v) => !v)}>
        <span className={css.nome}>{conn.name}</span>
        <span className={css.meta}>{conn.host}:{conn.port}</span>
        <StatusBadge status={conn.status} compacto />
        {conn.environment_label && (
          <span className={css.env} style={{ ['--env' as string]: conn.environment_color ?? 'var(--dt-neutral)' }}>{conn.environment_label}</span>
        )}
      </Linha>
      {aberto && conn.databases.map((d) => <NoBanco key={d.id} db={d} aoAbrirTabela={aoAbrirTabela} />)}
    </div>
  );
}

function NoBanco({ db, aoAbrirTabela }: { db: Banco; aoAbrirTabela: (id: number) => void }): JSX.Element {
  const [aberto, setAberto] = useState(false);
  const tq = useQuery({
    queryKey: ['dt', 'infra-tables', db.id],
    queryFn: ({ signal }) => apiGet<Tabela[]>('/infrastructure/tables', { database_id: db.id }, signal),
    enabled: aberto,
  });
  return (
    <div role="treeitem" aria-expanded={aberto}>
      <Linha nivel={2} aberto={aberto} temFilhos={db.table_count > 0} icone="Database" onToggle={() => setAberto((v) => !v)}>
        <span className={css.nome}>{db.name}</span>
        <span className={css.contagem}>{fmtInt(db.table_count)} tabelas · {fmtBytes(db.size_bytes)}</span>
      </Linha>
      {aberto && (tq.isPending
        ? <Carregando nivel={3} />
        : (tq.data ?? []).map((tb) => <NoTabela key={tb.id} table={tb} aoAbrir={aoAbrirTabela} />))}
    </div>
  );
}

function NoTabela({ table, aoAbrir }: { table: Tabela; aoAbrir: (id: number) => void }): JSX.Element {
  const [aberto, setAberto] = useState(false);
  const fq = useQuery({
    queryKey: ['dt', 'infra-fields', table.id],
    queryFn: ({ signal }) => apiGet<{ fields: Campo[] }>(`/tables/${table.id}`, undefined, signal),
    enabled: aberto,
    select: (d) => d.fields,
  });
  return (
    <div role="treeitem" aria-expanded={aberto}>
      <Linha nivel={3} aberto={aberto} temFilhos={table.field_count > 0} icone="TableProperties" onToggle={() => setAberto((v) => !v)}>
        <button type="button" className={css.nomeBtn} onClick={(e) => { e.stopPropagation(); aoAbrir(table.id); }}
          title="Abrir detalhe da tabela">{table.name}</button>
        <span className={css.contagem}>{fmtInt(table.field_count)} campos</span>
        {table.is_orphan === 1 && <Badge texto="órfã" tom="neutro" fraco />}
        {table.has_pk === 0 && <Badge texto="sem PK" tom="atencao" icone="TriangleAlert" fraco />}
      </Linha>
      {aberto && (fq.isPending
        ? <Carregando nivel={4} />
        : (fq.data ?? []).map((f) => <NoCampo key={f.id} campo={f} />))}
    </div>
  );
}

function NoCampo({ campo }: { campo: Campo }): JSX.Element {
  return (
    <div role="treeitem" className={css.campo} style={{ paddingLeft: 8 + 4 * 20 + 20 }}>
      <span className={css.icone}><Icone nome="Columns3" size={12} /></span>
      <span className={css.nomeCampo}>{campo.name}</span>
      <span className={css.tipo}>{campo.column_type || campo.data_type}</span>
      <span className={css.tags}>
        {campo.is_pk && <Badge texto="PK" tom="info" fraco />}
        {campo.is_fk && <Badge texto="FK" tom="neutro" fraco />}
        {campo.is_unique && <Badge texto="UQ" tom="ok" fraco />}
        {campo.sensitivity && <Badge texto={campo.sensitivity} tom="atencao" icone="ShieldAlert" fraco />}
      </span>
    </div>
  );
}
