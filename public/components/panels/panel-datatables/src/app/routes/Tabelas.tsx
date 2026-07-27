// app/routes/Tabelas.tsx — Tabelas no padrão de Elevação Visual.
// @version 2.0.0  @updated 2026-07-20
// Estrutura padrão: cards de resumo → FilterBar → AppDataGrid (zebra/sticky/
// hover/selecionada/ícones de coluna/densidade). Ordenação e paginação no servidor.
import { useState, type JSX } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../../lib/api';
import { fmtInt, fmtBytes, fmtData } from '../../lib/format';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import type { ColunaDef, OrdenacaoEstado } from '../../components/grid/tipos';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge, AnelScore, HeatProblemas, BarraProporcao } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { TabelaDrawer } from './drawers/TabelaDrawer';
import css from './Tabelas.module.css';

interface Tabela {
  id: number; name: string; database_name: string; table_type: string;
  engine: string | null; row_count_approx: number | null; size_bytes: number | null;
  field_count: number; index_count: number; fk_count: number; has_pk: number;
  classification: string; is_orphan: number; health_score: number | null;
  open_issues: number; table_comment: string | null; update_time: string | null;
  environment_label: string | null;
}

export function Tabelas(): JSX.Element {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [soOrfas, setSoOrfas] = useState(false);
  const [semPk, setSemPk] = useState(false);
  const [ordem, setOrdem] = useState<OrdenacaoEstado>({ coluna: 'name', direcao: 'asc' });
  const [drawerId, setDrawerId] = useState<number | null>(null);

  // Resumo (cards) — reusa o /dashboard já cacheado pela Visão Geral.
  const resumo = useQuery({
    queryKey: chaves.dashboard,
    queryFn: ({ signal }) => apiGet<{ counters: Record<string, number>; pending: Record<string, number> }>('/dashboard', undefined, signal),
  });

  const q = useQuery({
    queryKey: ['dt', 'tables', { pagina, porPagina, buscaAtiva, soOrfas, semPk, ordem }],
    queryFn: async ({ signal }) => {
      const r = await fetch(
        `/api/datatables/tables?` + new URLSearchParams({
          page: String(pagina), limit: String(porPagina),
          sort: ordem.coluna, dir: ordem.direcao.toUpperCase(),
          ...(buscaAtiva ? { search: buscaAtiva } : {}),
          ...(soOrfas ? { orphan_only: '1' } : {}),
          ...(semPk ? { no_pk: '1' } : {}),
        }),
        { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal }
      );
      const body = await r.json();
      if (!r.ok || body.ok === false) {
        throw new ApiError(body?.meta?.message ?? 'Falha ao listar tabelas', body?.error ?? `HTTP_${r.status}`, r.status);
      }
      return { items: body.data as Tabela[], total: Number(body.meta?.total ?? 0) };
    },
    placeholderData: keepPreviousData,
  });

  const maiorTamanho = Math.max(1, ...(q.data?.items ?? []).map((t) => t.size_bytes ?? 0));
  const rc = resumo.data?.counters ?? {};
  const rp = resumo.data?.pending ?? {};

  const colunas: ColunaDef<Tabela>[] = [
    { id: 'name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(230px, 1.6fr)', ordenavel: true, obrigatoria: true,
      celula: (t) => (
        <span className={css.nome}>
          <Icone nome={t.table_type === 'VIEW' ? 'Layers' : 'TableProperties'} size={13} />
          <span className={css.mono}>{t.name}</span>
        </span>) },
    { id: 'database_name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(130px, .8fr)', ordenavel: true,
      celula: (t) => <span className={css.mono}>{t.database_name}</span> },
    { id: 'row_count_approx', cabecalho: 'Registros', icone: 'Hash', largura: '110px', alinhamento: 'fim', ordenavel: true, dica: 'Contagem aproximada (information_schema)',
      celula: (t) => <span className={css.num}>{fmtInt(t.row_count_approx)}</span> },
    { id: 'size_bytes', cabecalho: 'Tamanho', icone: 'HardDrive', largura: '130px', alinhamento: 'fim', ordenavel: true,
      celula: (t) => (
        <span className={css.tamanho}>
          <span className={css.num}>{fmtBytes(t.size_bytes)}</span>
          <BarraProporcao valor={t.size_bytes ?? 0} maximo={maiorTamanho} dica={`${fmtBytes(t.size_bytes)} — proporcional à maior desta página`} />
        </span>) },
    { id: 'field_count', cabecalho: 'Campos', icone: 'Columns3', largura: '90px', alinhamento: 'fim', ordenavel: true,
      celula: (t) => <span className={css.num}>{fmtInt(t.field_count)}</span> },
    { id: 'index_count', cabecalho: 'Índices', largura: '90px', alinhamento: 'fim', ordenavel: true, ocultaPorPadrao: true,
      celula: (t) => <span className={css.num}>{fmtInt(t.index_count)}</span> },
    { id: 'fk_count', cabecalho: 'FKs', icone: 'GitBranch', largura: '76px', alinhamento: 'fim', ordenavel: true,
      celula: (t) => <span className={css.num}>{fmtInt(t.fk_count)}</span> },
    { id: 'health_score', cabecalho: 'Saúde', icone: 'Gauge', largura: '84px', alinhamento: 'centro', ordenavel: true,
      celula: (t) => <AnelScore score={t.health_score} /> },
    { id: 'open_issues', cabecalho: 'Problemas', icone: 'TriangleAlert', largura: '120px',
      celula: (t) => <HeatProblemas n={t.open_issues ?? 0} /> },
    { id: 'sinais', cabecalho: 'Sinais', icone: 'Tag', largura: 'minmax(160px, 1fr)',
      celula: (t) => (
        <span className={css.sinais}>
          {t.classification !== 'active' && <Badge texto={t.classification} tom="info" />}
          {!!t.is_orphan && <Badge texto="órfã" icone="GitBranch" fraco dica="Sem FK própria e não referenciada. É um sinal, não necessariamente um problema." />}
          {!t.has_pk && t.table_type === 'BASE TABLE' && <Badge texto="sem PK" icone="TriangleAlert" tom="atencao" dica="Tabela base sem chave primária" />}
          {!t.table_comment && <Badge texto="sem doc" fraco dica="Sem COMMENT no banco" />}
        </span>) },
    { id: 'update_time', cabecalho: 'Alterada', icone: 'Clock', largura: '150px', ordenavel: true, ocultaPorPadrao: true,
      celula: (t) => <span className={css.discreto}>{fmtData(t.update_time)}</span> },
  ];

  const erro = q.isError ? (q.error as ApiError) : null;
  const algumFiltro = !!(buscaAtiva || soOrfas || semPk);
  const limpar = (): void => { setBusca(''); setBuscaAtiva(''); setSoOrfas(false); setSemPk(false); setPagina(1); };

  return (
    <div className={css.raiz}>
      <section className={css.cards}>
        <MetricCard icone="TableProperties" rotulo="Tabelas" valor={rc.tables} contexto="no catálogo" />
        <MetricCard icone="Columns3" rotulo="Campos" valor={rc.fields} contexto="somados" />
        <MetricCard icone="GitBranch" rotulo="Órfãs" valor={rp.orphan_tables}
          tom={(rp.orphan_tables ?? 0) > 0 ? 'info' : 'neutro'} contexto="sinal, não problema" />
        <MetricCard icone="TriangleAlert" rotulo="Sem chave primária" valor={rp.tables_no_pk}
          tom={(rp.tables_no_pk ?? 0) > 0 ? 'atencao' : 'ok'} contexto="tabelas base" />
      </section>

      <DataGrid<Tabela>
        rotulo="Tabelas catalogadas" chaveEstado="tabelas" colunas={colunas}
        linhas={q.data?.items ?? []} idLinha={(t) => t.id}
        carregando={q.isPending}
        aoAtualizar={() => { q.refetch(); resumo.refetch(); }}
        erro={erro ? {
          mensagem: erro.ehAuth ? 'Sua sessão expirou. Recarregue a página.' : 'Não foi possível listar as tabelas.',
          codigo: erro.code, aoTentar: erro.ehAuth ? undefined : () => q.refetch(),
        } : null}
        vazio={{
          titulo: 'Nenhuma tabela encontrada',
          descricao: algumFiltro
            ? 'Nenhuma tabela corresponde aos filtros aplicados. Limpe os filtros para ver o catálogo completo.'
            : 'O catálogo ainda não foi inventariado. Cadastre uma conexão e execute o inventário.',
        }}
        ordenacao={ordem} aoOrdenar={(o) => { setOrdem(o); setPagina(1); }}
        paginacao={{ pagina, porPagina, total: q.data?.total ?? 0, aoMudarPagina: setPagina, aoMudarPorPagina: (n) => { setPorPagina(n); setPagina(1); } }}
        aoClicarLinha={(t) => setDrawerId(t.id)}
        ferramentas={
          <FilterBar
            busca={{ valor: busca, aoMudar: setBusca, aoSubmeter: () => { setBuscaAtiva(busca); setPagina(1); }, placeholder: 'Filtrar por nome…' }}
            chips={[
              { ativo: soOrfas, aoClicar: () => { setSoOrfas((v) => !v); setPagina(1); }, icone: 'GitBranch', texto: 'Somente órfãs' },
              { ativo: semPk, aoClicar: () => { setSemPk((v) => !v); setPagina(1); }, icone: 'TriangleAlert', texto: 'Sem chave primária' },
            ]}
            aoLimpar={limpar} algumAtivo={algumFiltro}
          />
        }
      />

      <TabelaDrawer id={drawerId} aoFechar={() => setDrawerId(null)} />
    </div>
  );
}

