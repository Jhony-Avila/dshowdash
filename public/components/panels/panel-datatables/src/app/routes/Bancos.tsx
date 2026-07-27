// app/routes/Bancos.tsx — Bancos no padrão de Elevação Visual.
// @version 2.0.0  @updated 2026-07-20
// Estrutura: cards de resumo → FilterBar → visão (cards de saúde | AppDataGrid).
import { useState, useMemo, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRota } from '../../shell/useRota';
import { apiGet, ApiError } from '../../lib/api';
import { fmtInt, fmtBytes, fmtRelativo } from '../../lib/format';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import type { ColunaDef } from '../../components/grid/tipos';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge, BarraProporcao } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { EmptyState } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { BancoDrawer } from './drawers/BancoDrawer';
import css from './Bancos.module.css';

interface Banco {
  id: number; name: string; server_name: string | null; connection_name: string;
  connection_status: string; environment_label: string | null; environment_color: string | null;
  table_count: number; field_count: number; size_bytes: number | null;
  last_inventory_at: string | null; last_check_at: string | null;
  last_error: string | null; classification: string;
}

export function Bancos(): JSX.Element {
  const [, ir] = useRota();
  const [visao, setVisao] = useState<'cards' | 'grid'>('cards');
  const [busca, setBusca] = useState('');
  const [drawerBanco, setDrawerBanco] = useState<Banco | null>(null);
  // Abre a Comparação de esquemas com este banco pré-selecionado (deep-link ?a=).
  const compararEsquema = (dbId: number): void => { ir({ grupo: 'data', tela: 'compare', params: { a: String(dbId) } }); };

  const q = useQuery({
    queryKey: ['dt', 'databases'],
    queryFn: ({ signal }) => apiGet<Banco[]>('/databases', { limit: 100 }, signal),
  });

  const todos = q.data ?? [];
  const bancos = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t ? todos.filter((b) => b.name.toLowerCase().includes(t) || (b.server_name ?? '').toLowerCase().includes(t)) : todos;
  }, [todos, busca]);

  const maiorTamanho = Math.max(1, ...bancos.map((b) => b.size_bytes ?? 0));
  const erro = q.isError ? (q.error as ApiError) : null;
  const online = todos.filter((b) => b.connection_status === 'online').length;
  const totTabelas = todos.reduce((s, b) => s + b.table_count, 0);
  const totTamanho = todos.reduce((s, b) => s + (b.size_bytes ?? 0), 0);

  // Gráfico "Maiores bancos por volume": barra horizontal (top 12), cada barra na
  // COR REAL do ambiente (Bancos RETORNA environment_color, ≠ Conexões). Panorama
  // sobre `todos` (não o filtro). Guarda ≥2 bancos com volume. Hook estável.
  const palette = usePaletaGrafico();
  const opcaoVolume = useMemo(() => {
    const comVolume = todos.filter((b) => (b.size_bytes ?? 0) > 0);
    if (comVolume.length < 2) return null;
    const ord = [...comVolume].sort((a, b) => (a.size_bytes ?? 0) - (b.size_bytes ?? 0)).slice(-12);
    const bb = baseGrafico(palette);
    return {
      ...bb,
      grid: { left: 8, right: 70, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...(bb.tooltip as object), trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p: Array<{ name: string; value: number }>) => `${p[0].name}: ${fmtBytes(p[0].value)}` },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: palette.grade } },
        axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => fmtBytes(v) } },
      yAxis: { type: 'category', data: ord.map((b) => b.name),
        axisLine: { lineStyle: { color: palette.grade } }, axisTick: { show: false },
        axisLabel: { color: palette.texto, fontSize: 11 } },
      series: [{ type: 'bar', barWidth: '60%',
        data: ord.map((b) => ({ value: b.size_bytes ?? 0,
          itemStyle: { color: b.environment_color ?? palette.primary, borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: palette.muted, fontSize: 10,
          formatter: (p: { value: number }) => fmtBytes(p.value) } }],
    };
  }, [todos, palette]);

  const colunas: ColunaDef<Banco>[] = [
    { id: 'connection_status', cabecalho: 'Status', icone: 'Activity', largura: '150px', obrigatoria: true,
      celula: (b) => <StatusBadge status={b.connection_status} compacto /> },
    { id: 'name', cabecalho: 'Banco', icone: 'Database', largura: 'minmax(180px, 1.3fr)', obrigatoria: true,
      celula: (b) => <span className={css.nome}><Icone nome="Database" size={13} /><span className={css.mono}>{b.name}</span></span> },
    { id: 'server_name', cabecalho: 'Servidor', icone: 'Server', largura: 'minmax(150px, 1fr)',
      celula: (b) => <span className={css.discreto}>{b.server_name ?? b.connection_name}</span> },
    { id: 'environment_label', cabecalho: 'Ambiente', icone: 'Network', largura: '130px',
      celula: (b) => b.environment_label ? <Badge texto={b.environment_label} tom="info" icone="Network" /> : <span className={css.discreto}>—</span> },
    { id: 'table_count', cabecalho: 'Tabelas', icone: 'TableProperties', largura: '96px', alinhamento: 'fim',
      celula: (b) => <span className={css.num}>{fmtInt(b.table_count)}</span> },
    { id: 'field_count', cabecalho: 'Campos', icone: 'Columns3', largura: '96px', alinhamento: 'fim',
      celula: (b) => <span className={css.num}>{fmtInt(b.field_count)}</span> },
    { id: 'size_bytes', cabecalho: 'Tamanho', icone: 'HardDrive', largura: '130px', alinhamento: 'fim',
      celula: (b) => <span className={css.tamanho}><span className={css.num}>{fmtBytes(b.size_bytes)}</span><BarraProporcao valor={b.size_bytes ?? 0} maximo={maiorTamanho} /></span> },
    { id: 'last_inventory_at', cabecalho: 'Inventário', icone: 'Clock', largura: '130px',
      celula: (b) => <span className={css.discreto}>{fmtRelativo(b.last_inventory_at)}</span> },
  ];

  return (
    <div className={css.raiz}>
      <section className={css.cards}>
        <MetricCard icone="Database" rotulo="Bancos" valor={todos.length} contexto="catalogados" />
        <MetricCard icone="PlugZap" rotulo="Online" valor={online} tom={online === todos.length ? 'ok' : 'atencao'} contexto={`de ${todos.length}`} />
        <MetricCard icone="TableProperties" rotulo="Tabelas" valor={totTabelas} contexto="somadas" />
        <MetricCard icone="HardDrive" rotulo="Volume total" valor={fmtBytes(totTamanho)} contexto="somando os bancos" />
      </section>

      {opcaoVolume && (
        <Revelar atraso={60}>
          <section className={css.bloco}>
            <div className={css.blocoTopo}>
              <h2 className={css.blocoTitulo}>Maiores bancos por volume</h2>
              <span className={css.blocoSub}>top 12 por tamanho, colorido pela cor do ambiente</span>
            </div>
            <Grafico opcao={opcaoVolume}
              altura={Math.max(180, Math.min(12, todos.filter((b) => (b.size_bytes ?? 0) > 0).length) * 34)}
              aria="Maiores bancos por volume" />
          </section>
        </Revelar>
      )}

      <div className={css.barraTopo}>
        <FilterBar busca={{ valor: busca, aoMudar: setBusca, placeholder: 'Filtrar banco ou servidor…' }}
          aoLimpar={() => setBusca('')} algumAtivo={!!busca} />
        <div className={css.alternador} role="group" aria-label="Modo de visualização">
          <button type="button" aria-pressed={visao === 'cards'} title="Cards"
            className={visao === 'cards' ? css.modoAtivo : css.modo} onClick={() => setVisao('cards')}>
            <Icone nome="Layers" size={13} /> Cards
          </button>
          <button type="button" aria-pressed={visao === 'grid'} title="Grid"
            className={visao === 'grid' ? css.modoAtivo : css.modo} onClick={() => setVisao('grid')}>
            <Icone nome="TableProperties" size={13} /> Grid
          </button>
        </div>
      </div>

      {visao === 'grid' ? (
        <DataGrid<Banco>
          rotulo="Bancos catalogados" chaveEstado="bancos" colunas={colunas} linhas={bancos} idLinha={(b) => b.id}
          aoClicarLinha={(b) => setDrawerBanco(b)}
          carregando={q.isPending} aoAtualizar={() => q.refetch()}
          erro={erro ? { mensagem: 'Não foi possível listar os bancos.', codigo: erro.code, aoTentar: () => q.refetch() } : null}
          vazio={{ titulo: busca ? 'Nenhum banco corresponde ao filtro' : 'Nenhum banco catalogado',
                   descricao: busca ? 'Limpe o filtro para ver todos.' : 'Cadastre uma conexão e execute o inventário para popular o catálogo.' }} />
      ) : q.isPending ? (
        <div className={css.grade}>{Array.from({ length: 3 }, (_, i) => <div key={i} className={css.cardSkel} />)}</div>
      ) : bancos.length === 0 ? (
        <EmptyState icone="Database" titulo={busca ? 'Nenhum banco corresponde ao filtro' : 'Nenhum banco catalogado'}
          descricao={busca ? 'Limpe o filtro para ver todos.' : 'Cadastre uma conexão e execute o inventário para popular o catálogo.'} />
      ) : (
        <div className={css.grade}>{bancos.map((b) => <CardBanco key={b.id} b={b} maior={maiorTamanho} aoAbrir={() => setDrawerBanco(b)} />)}</div>
      )}

      <BancoDrawer banco={drawerBanco} aoFechar={() => setDrawerBanco(null)} aoComparar={compararEsquema} />
    </div>
  );
}

function CardBanco({ b, maior, aoAbrir }: { b: Banco; maior: number; aoAbrir: () => void }): JSX.Element {
  return (
    <article className={`${css.card} ${css.cardClicavel}`} onClick={aoAbrir}
             role="button" tabIndex={0}
             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrir(); } }}>
      <header className={css.cardTopo}>
        <span className={css.cardIcone}><Icone nome="Database" size={17} /></span>
        <div className={css.cardTitulo}>
          <strong className={css.mono}>{b.name}</strong>
          <span className={css.discreto}>{b.server_name ?? b.connection_name}</span>
        </div>
        <StatusBadge status={b.connection_status} compacto />
      </header>
      <div className={css.cardMetricas}>
        <Metrica rotulo="Tabelas" valor={fmtInt(b.table_count)} />
        <Metrica rotulo="Campos" valor={fmtInt(b.field_count)} />
        <Metrica rotulo="Tamanho" valor={fmtBytes(b.size_bytes)} />
      </div>
      <div className={css.cardBarra}>
        <BarraProporcao valor={b.size_bytes ?? 0} maximo={maior} dica={`${fmtBytes(b.size_bytes)} — proporcional ao maior banco`} />
      </div>
      <footer className={css.cardRodape}>
        {b.environment_label && <Badge texto={b.environment_label} tom="info" icone="Network" />}
        <span className={css.discreto}><Icone nome="Clock" size={11} /> inventário {fmtRelativo(b.last_inventory_at)}</span>
      </footer>
      {b.last_error && <p className={css.cardErro} title={b.last_error}><Icone nome="TriangleAlert" size={11} /> {b.last_error.slice(0, 90)}</p>}
    </article>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }): JSX.Element {
  return (
    <div className={css.metrica}>
      <span className={css.metricaValor}>{valor}</span>
      <span className={css.metricaRotulo}>{rotulo}</span>
    </div>
  );
}
