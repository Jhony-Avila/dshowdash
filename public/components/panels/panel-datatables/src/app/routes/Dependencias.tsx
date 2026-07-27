// app/routes/Dependencias.tsx — migração de Dependências (§17).
// @version 1.0.0  @created 2026-07-20
// Mantém as LISTAS (precisão técnica, §17.3). O diagrama de rede fica para
// depois — carregamento sob demanda, nunca no bundle inicial.
import { useMemo, useState, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../../lib/api';
import { fmtInt, fmtBytes } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { GrafoDependencias, type NoGrafo, type ArestaGrafo } from '../../components/ui/GrafoDependencias';
import { DataGrid } from '../../components/grid/DataGrid';
import type { ColunaDef } from '../../components/grid/tipos';
import { Badge, BarraProporcao } from '../../components/ui/Badge';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { Icone } from '../../components/ui/Icone';
import { TabelaDrawer } from './drawers/TabelaDrawer';
import css from './Dependencias.module.css';

interface Grafo { database_id: number; databases: { id: number; name: string; fk_count: number }[]; nodes: NoGrafo[]; edges: ArestaGrafo[] }

interface Referenciada { id: number; name: string; database_name: string; fk_count: number; referenced_by: number; broken_in: number }
interface Orfa { id: number; name: string; database_name: string; row_count_approx: number | null; size_bytes: number | null; classification: string }
interface Quebrada { id: number; constraint_name: string; column_name: string | null; ref_table: string | null; ref_column: string | null; table_name: string; database_name: string }
interface Dados {
  counters: { total_fks: number; broken_fks: number; orphans: number; total_tables: number };
  most_referenced: Referenciada[]; orphans: Orfa[]; broken: Quebrada[];
}

export function Dependencias(): JSX.Element {
  const q = useQuery({
    queryKey: chaves.dependencias,
    queryFn: ({ signal }) => apiGet<Dados>('/dependencies', undefined, signal),
  });

  // Mapa (grafo) de dependências — banco selecionável; 0 = o backend escolhe o de mais FKs.
  const [dbGrafo, setDbGrafo] = useState(0);
  const [drawerTabela, setDrawerTabela] = useState<number | null>(null);
  const gq = useQuery({
    queryKey: ['dt', 'dep-graph', dbGrafo],
    queryFn: ({ signal }) => apiGet<Grafo>('/dependencies/graph', dbGrafo > 0 ? { database_id: dbGrafo } : undefined, signal),
  });

  const palette = usePaletaGrafico();
  const opcaoTop = useMemo(() => {
    const mr = (q.data?.most_referenced ?? []).slice(0, 8).slice().reverse();
    if (!mr.length) return null;
    const b = baseGrafico(palette);
    return {
      ...b,
      grid: { left: 8, right: 28, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...(b.tooltip as object), trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} referência(s)' },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: palette.grade } }, axisLabel: { color: palette.muted, fontSize: 10 } },
      yAxis: { type: 'category', data: mr.map((t) => t.name), axisLine: { lineStyle: { color: palette.grade } }, axisTick: { show: false }, axisLabel: { color: palette.texto, fontSize: 11 } },
      series: [{ type: 'bar', data: mr.map((t) => t.referenced_by), barWidth: '58%', itemStyle: { color: palette.primary, borderRadius: [0, 4, 4, 0] } }],
    };
  }, [q.data, palette]);

  if (q.isPending) return <SkeletonCartoes n={4} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar as dependências." codigo={e.code}
                       onRetry={() => q.refetch()} />;
  }

  const { counters: c, most_referenced, orphans, broken } = q.data;
  const maxRef = Math.max(1, ...most_referenced.map((t) => t.referenced_by));
  const maxTam = Math.max(1, ...orphans.map((t) => t.size_bytes ?? 0));

  const colRef: ColunaDef<Referenciada>[] = [
    { id: 'name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(200px, 1.4fr)', obrigatoria: true,
      celula: (t) => <span className={css.mono}>{t.name}</span> },
    { id: 'database_name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(130px, .8fr)',
      celula: (t) => <span className={css.discreto}>{t.database_name}</span> },
    { id: 'referenced_by', cabecalho: 'Referenciada por', icone: 'Network', largura: '190px',
      celula: (t) => (
        <span className={css.refCel}>
          <span className={css.num}>{fmtInt(t.referenced_by)}</span>
          <BarraProporcao valor={t.referenced_by} maximo={maxRef}
            dica={`${t.referenced_by} tabela(s) apontam para esta`} />
        </span>
      ) },
    { id: 'fk_count', cabecalho: 'FKs próprias', icone: 'GitBranch', largura: '110px', alinhamento: 'fim',
      celula: (t) => <span className={css.num}>{fmtInt(t.fk_count)}</span> },
    { id: 'broken_in', cabecalho: 'Integridade', icone: 'ShieldAlert', largura: '140px',
      celula: (t) => t.broken_in > 0
        ? <Badge texto={`${t.broken_in} quebrada(s)`} tom="alerta" icone="TriangleAlert" />
        : <Badge texto="íntegra" tom="ok" icone="CircleCheck" /> },
  ];

  const colOrfa: ColunaDef<Orfa>[] = [
    { id: 'name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(200px, 1.4fr)', obrigatoria: true,
      celula: (t) => <span className={css.mono}>{t.name}</span> },
    { id: 'database_name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(130px, .8fr)',
      celula: (t) => <span className={css.discreto}>{t.database_name}</span> },
    { id: 'row_count_approx', cabecalho: 'Registros', icone: 'Hash', largura: '110px', alinhamento: 'fim',
      celula: (t) => <span className={css.num}>{fmtInt(t.row_count_approx)}</span> },
    { id: 'size_bytes', cabecalho: 'Tamanho', icone: 'HardDrive', largura: '140px', alinhamento: 'fim',
      celula: (t) => (
        <span className={css.tamanho}>
          <span className={css.num}>{fmtBytes(t.size_bytes)}</span>
          <BarraProporcao valor={t.size_bytes ?? 0} maximo={maxTam} />
        </span>
      ) },
    { id: 'classification', cabecalho: 'Classificação', icone: 'Tag', largura: '130px',
      celula: (t) => <Badge texto={t.classification} /> },
  ];

  const colQuebrada: ColunaDef<Quebrada>[] = [
    { id: 'table_name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(200px, 1.2fr)', obrigatoria: true,
      celula: (f) => <span className={css.mono}>{f.database_name}.{f.table_name}</span> },
    { id: 'constraint_name', cabecalho: 'Constraint', icone: 'GitBranch', largura: 'minmax(170px, 1fr)',
      celula: (f) => <span className={css.mono}>{f.constraint_name}</span> },
    { id: 'column_name', cabecalho: 'Campo', icone: 'Columns3', largura: '150px',
      celula: (f) => <span className={css.mono}>{f.column_name ?? '—'}</span> },
    { id: 'ref', cabecalho: 'Referencia', icone: 'ArrowUpRight', largura: 'minmax(180px, 1fr)',
      celula: (f) => <span className={css.mono}>{f.ref_table ?? '—'}.{f.ref_column ?? '—'}</span> },
  ];

  return (
    <div className={css.raiz}>
      <section className={css.cards}>
        <MetricCard icone="GitBranch" rotulo="Chaves estrangeiras" valor={c.total_fks}
          contexto={`em ${fmtInt(c.total_tables)} tabelas`} />
        <MetricCard icone="TriangleAlert" rotulo="FKs quebradas" valor={c.broken_fks}
          tom={c.broken_fks > 0 ? 'alerta' : 'ok'}
          contexto={c.broken_fks > 0 ? 'referência inexistente' : 'integridade preservada'} />
        <MetricCard icone="Layers" rotulo="Tabelas órfãs" valor={c.orphans}
          contexto="sinal, não necessariamente problema" />
        <MetricCard icone="Network" rotulo="Mais referenciada"
          valor={most_referenced[0]?.referenced_by ?? 0}
          contexto={most_referenced[0]?.name ?? '—'} />
      </section>

      <div className={css.nota}>
        <Icone nome="Network" size={13} />
        As relações aparecem no <strong>mapa interativo</strong> abaixo (§23) e nas listas
        técnicas — o grafo dá a visão de conjunto; as listas, a precisão campo a campo.
      </div>

      <section className={css.bloco}>
        <div className={css.blocoTopo}>
          <h2 className={css.blocoTitulo}>Mapa de dependências</h2>
          <span className={css.blocoSub}>grafo interativo de tabelas ↔ chaves estrangeiras</span>
          {gq.data && gq.data.databases.length > 0 && (
            <select className={css.seletorBanco} aria-label="Banco do grafo de dependências"
              value={dbGrafo || gq.data.database_id}
              onChange={(e) => setDbGrafo(Number(e.target.value))}>
              {gq.data.databases.map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {fmtInt(d.fk_count)} FKs</option>
              ))}
            </select>
          )}
        </div>
        {gq.isPending ? (
          <div className={css.grafoAviso}><Icone nome="RefreshCw" size={14} className={css.girando} /> carregando o grafo…</div>
        ) : gq.isError || !gq.data || gq.data.nodes.length === 0 ? (
          <div className={css.grafoAviso}>Nenhuma relação de FK para exibir neste banco.</div>
        ) : (
          <GrafoDependencias nodes={gq.data.nodes} edges={gq.data.edges}
            aoClicarTabela={(id) => setDrawerTabela(id)} />
        )}
      </section>

      {opcaoTop && (
        <section className={css.bloco}>
          <div className={css.blocoTopo}>
            <h2 className={css.blocoTitulo}>Top 8 mais referenciadas</h2>
            <span className={css.blocoSub}>quantas tabelas apontam para cada uma</span>
          </div>
          <Grafico opcao={opcaoTop} altura={260} aria="Top tabelas mais referenciadas" />
        </section>
      )}

      <Bloco titulo="Mais referenciadas"
             sub="alterar estas estruturas tem alcance amplo">
        <DataGrid<Referenciada> rotulo="Tabelas mais referenciadas" chaveEstado="deps-ref"
          colunas={colRef} linhas={most_referenced} idLinha={(t) => t.id} aoAtualizar={() => q.refetch()}
          vazio={{ titulo: 'Nenhuma tabela é referenciada', descricao: 'Não há chaves estrangeiras no catálogo.' }} />
      </Bloco>

      <Bloco titulo="Chaves estrangeiras quebradas"
             sub={c.broken_fks === 0 ? 'nenhuma — integridade preservada' : `${c.broken_fks} constraint(s) apontam para objeto inexistente`}>
        <DataGrid<Quebrada> rotulo="Chaves quebradas" chaveEstado="deps-quebradas"
          colunas={colQuebrada} linhas={broken} idLinha={(f) => f.id} aoAtualizar={() => q.refetch()}
          vazio={{ titulo: 'Nenhuma chave quebrada', descricao: 'Todas as referências apontam para tabelas e campos existentes.' }} />
      </Bloco>

      <Bloco titulo="Tabelas órfãs" sub={`${fmtInt(c.orphans)} no total`}>
        <DataGrid<Orfa> rotulo="Tabelas órfãs" chaveEstado="deps-orfas"
          colunas={colOrfa} linhas={orphans} idLinha={(t) => t.id} aoAtualizar={() => q.refetch()}
          vazio={{ titulo: 'Nenhuma tabela órfã', descricao: 'Todas as tabelas participam de alguma relação.' }} />
      </Bloco>

      <TabelaDrawer id={drawerTabela} aoFechar={() => setDrawerTabela(null)} />
    </div>
  );
}

function Bloco({ titulo, sub, children }: { titulo: string; sub?: string; children: JSX.Element }): JSX.Element {
  return (
    <section className={css.bloco}>
      <div className={css.blocoTopo}>
        <h2 className={css.blocoTitulo}>{titulo}</h2>
        {sub && <span className={css.blocoSub}>{sub}</span>}
      </div>
      {children}
    </section>
  );
}
