// app/routes/Alertas.tsx — Alertas no padrão de Elevação Visual.
// @version 2.0.0  @updated 2026-07-20
// Estrutura: cards de resumo → FilterBar (status) → AppDataGrid com ícones de
// coluna, expansão de detalhe e menu ⋮ (reconhecer/resolver).
// Dedup por fingerprint: `occurrences` conta recorrências do MESMO problema.
import { useMemo, useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtRelativo, fmtInt } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import type { ColunaDef, ItemMenuLinha } from '../../components/grid/tipos';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { AlertaDrawer } from './drawers/AlertaDrawer';
import css from './Alertas.module.css';

export interface Alerta {
  id: number; alert_type: string; severity: string; target_type: string;
  connection_name: string | null; environment_label: string | null;
  title: string; message: string | null; status: string; occurrences: number;
  first_seen_at: string; last_seen_at: string; acknowledged_by: string | null; age_sec: number;
}
interface Dados {
  alerts: Alerta[];
  counters: { active: number; critical: number; warning: number; info: number; acknowledged: number; resolved: number };
}
const SEV: Record<string, { tom: 'alerta' | 'atencao' | 'neutro'; icone: string }> = {
  critico: { tom: 'alerta', icone: 'CircleX' }, atencao: { tom: 'atencao', icone: 'TriangleAlert' }, informativo: { tom: 'neutro', icone: 'CircleHelp' },
};
const ST: Record<string, { rotulo: string; tom: 'alerta' | 'atencao' | 'ok' | 'neutro'; icone: string }> = {
  active: { rotulo: 'ativo', tom: 'alerta', icone: 'BellRing' }, acknowledged: { rotulo: 'reconhecido', tom: 'atencao', icone: 'Eye' }, resolved: { rotulo: 'resolvido', tom: 'ok', icone: 'CircleCheck' },
};

export function Alertas(): JSX.Element {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<string>('active');
  const [aviso, setAviso] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Alerta | null>(null);

  const q = useQuery({
    queryKey: ['dt', 'alerts', filtro],
    queryFn: ({ signal }) => apiGet<Dados>('/alerts', { status: filtro || undefined, limit: 200 }, signal),
  });
  const acao = useMutation({
    mutationFn: ({ id, tipo }: { id: number; tipo: 'acknowledge' | 'resolve' }) => apiWrite(`/alerts/${id}/${tipo}`, 'POST'),
    onSuccess: (_r, v) => { setAviso(v.tipo === 'resolve' ? 'Alerta resolvido.' : 'Alerta reconhecido.'); qc.invalidateQueries({ queryKey: ['dt'] }); },
    onError: (e: ApiError) => setAviso(`Falha: ${e.message}`),
  });

  // Gráfico de barras: alertas por TIPO (reflete o filtro atual). Hook ANTES dos
  // early returns (regra dos hooks); guarda de ≥2 tipos p/ não virar barra única.
  const palette = usePaletaGrafico();
  const opcaoTipo = useMemo(() => {
    const lista = q.data?.alerts ?? [];
    if (!lista.length) return null;
    const mapa = new Map<string, number>();
    for (const a of lista) mapa.set(a.alert_type, (mapa.get(a.alert_type) ?? 0) + 1);
    const tipos = [...mapa.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
    if (tipos.length < 2) return null;
    const ord = tipos.slice().reverse(); // barra horizontal: o maior no topo
    const b = baseGrafico(palette);
    return {
      ...b,
      grid: { left: 8, right: 28, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...(b.tooltip as object), trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} alerta(s)' },
      xAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: palette.grade } }, axisLabel: { color: palette.muted, fontSize: 10 } },
      yAxis: { type: 'category', data: ord.map(([t]) => t), axisLine: { lineStyle: { color: palette.grade } }, axisTick: { show: false }, axisLabel: { color: palette.texto, fontSize: 11 } },
      series: [{ type: 'bar', data: ord.map(([, n]) => n), barWidth: '58%', itemStyle: { color: palette.primary, borderRadius: [0, 4, 4, 0] } }],
    };
  }, [q.data, palette]);

  if (q.isPending) return <SkeletonCartoes n={4} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar os alertas." codigo={e.code} onRetry={() => q.refetch()} />;
  }
  const { alerts, counters: c } = q.data;

  const colunas: ColunaDef<Alerta>[] = [
    { id: 'severity', cabecalho: 'Severidade', icone: 'ShieldAlert', largura: '130px', obrigatoria: true,
      celula: (a) => { const s = SEV[a.severity] ?? SEV.informativo; return <Badge texto={a.severity} tom={s.tom} icone={s.icone} />; } },
    { id: 'title', cabecalho: 'Alerta', icone: 'BellRing', largura: 'minmax(240px, 1.6fr)',
      celula: (a) => <span className={css.tituloCel}><span className={css.titulo}>{a.title}</span><span className={css.tipo}>{a.alert_type}</span></span> },
    { id: 'connection_name', cabecalho: 'Alvo', icone: 'PlugZap', largura: 'minmax(150px, 1fr)',
      celula: (a) => <span className={css.discreto}>{a.connection_name ?? a.target_type}</span> },
    { id: 'occurrences', cabecalho: 'Ocorr.', icone: 'Hash', largura: '96px', alinhamento: 'fim',
      celula: (a) => a.occurrences > 1 ? <Badge texto={`×${fmtInt(a.occurrences)}`} tom="atencao" dica={`${a.occurrences} recorrências do mesmo problema`} fraco /> : <span className={css.num}>1</span> },
    { id: 'last_seen_at', cabecalho: 'Visto', icone: 'Clock', largura: '130px',
      celula: (a) => <span className={css.discreto} title={a.last_seen_at}>{fmtRelativo(a.last_seen_at)}</span> },
    { id: 'status', cabecalho: 'Status', icone: 'Activity', largura: '150px',
      celula: (a) => { const s = ST[a.status] ?? ST.active; return <Badge texto={s.rotulo} tom={s.tom} icone={s.icone} />; } },
  ];
  const menu = (a: Alerta): ItemMenuLinha<Alerta>[] => {
    const itens: ItemMenuLinha<Alerta>[] = [];
    if (a.status === 'active') itens.push({ rotulo: 'Reconhecer', icone: 'Eye', aoClicar: () => acao.mutate({ id: a.id, tipo: 'acknowledge' }) });
    if (a.status !== 'resolved') itens.push({ rotulo: 'Resolver', icone: 'Check', aoClicar: () => acao.mutate({ id: a.id, tipo: 'resolve' }) });
    return itens;
  };

  const chips = [
    { ativo: filtro === 'active', aoClicar: () => setFiltro('active'), icone: 'BellRing', texto: `Ativos (${fmtInt(c.active ?? 0)})` },
    { ativo: filtro === 'acknowledged', aoClicar: () => setFiltro('acknowledged'), icone: 'Eye', texto: `Reconhecidos (${fmtInt(c.acknowledged ?? 0)})` },
    { ativo: filtro === 'resolved', aoClicar: () => setFiltro('resolved'), icone: 'CircleCheck', texto: `Resolvidos (${fmtInt(c.resolved ?? 0)})` },
    { ativo: filtro === '', aoClicar: () => setFiltro(''), icone: 'Layers', texto: 'Todos' },
  ];

  return (
    <div className={css.raiz}>
      <Revelar>
        <section className={css.cards}>
          <MetricCard icone="BellRing" rotulo="Ativos" valor={c.active} tom={Number(c.active) > 0 ? 'alerta' : 'ok'} contexto="exigem ação" />
          <MetricCard icone="CircleX" rotulo="Críticos" valor={c.critical} tom={Number(c.critical) > 0 ? 'alerta' : 'ok'} contexto="prioridade máxima" />
          <MetricCard icone="TriangleAlert" rotulo="Atenção" valor={c.warning} tom={Number(c.warning) > 0 ? 'atencao' : 'ok'} />
          <MetricCard icone="Eye" rotulo="Reconhecidos" valor={c.acknowledged} contexto="em acompanhamento" />
        </section>
      </Revelar>

      {aviso && <div className={css.avisoBox}><Icone nome="CircleCheck" size={14} />{aviso}</div>}

      {opcaoTipo && (
        <Revelar atraso={60}>
          <section className={css.bloco}>
            <div className={css.blocoTopo}>
              <h2 className={css.blocoTitulo}>Alertas por tipo</h2>
              <span className={css.blocoSub}>distribuição dos alertas listados no filtro atual</span>
            </div>
            <Grafico opcao={opcaoTipo} altura={230} aria="Alertas agrupados por tipo" />
          </section>
        </Revelar>
      )}

      <DataGrid<Alerta> rotulo="Alertas" chaveEstado="alertas" colunas={colunas} linhas={alerts} idLinha={(a) => a.id}
        menuLinha={menu} aoAtualizar={() => q.refetch()} aoClicarLinha={(a) => setDrawer(a)}
        ferramentas={<FilterBar chips={chips} />}
        vazio={{ titulo: filtro === 'active' ? 'Nenhum alerta ativo' : 'Nada aqui',
                 descricao: filtro === 'active' ? 'Tudo sob controle — nenhum problema aberto no momento.' : 'Nenhum alerta neste filtro.' }} />

      <AlertaDrawer alerta={drawer} aoFechar={() => setDrawer(null)}
        acaoPendente={acao.isPending}
        aoAcao={(id, tipo) => acao.mutate({ id, tipo })} />
    </div>
  );
}
