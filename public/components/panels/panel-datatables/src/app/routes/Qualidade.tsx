// app/routes/Qualidade.tsx — migração de Qualidade (§19).
// @version 1.0.0  @created 2026-07-20
// Gauge do score geral, distribuição, agrupamento por regra e grid de problemas.
import { useState, useMemo, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../../lib/api';
import { fmtInt } from '../../lib/format';
import { Gauge } from '../../components/ui/Gauge';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { MetricCard } from '../../components/ui/MetricCard';
import { DataGrid } from '../../components/grid/DataGrid';
import type { ColunaDef } from '../../components/grid/tipos';
import { Badge, AnelScore } from '../../components/ui/Badge';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import { Icone } from '../../components/ui/Icone';
import css from './Qualidade.module.css';

interface Problema {
  id: number; rule_key: string; rule_label: string | null; dimension: string | null;
  severity: string; metric_value: number | null; detail: string | null;
  table_id: number; table_name: string; field_name: string | null;
  database_name: string; health_score: number | null;
}
interface PorRegra { rule_key: string; label: string | null; dimension: string | null; severity: string; n: number }
interface Score { classification: string; n: number; avg_score: number }
interface Dados {
  issues: Problema[];
  counters: { critico: number; atencao: number; informativo: number; total: number };
  by_rule: PorRegra[];
  scores: Score[];
}

const SEV_TOM: Record<string, 'alerta' | 'atencao' | 'neutro'> = {
  critico: 'alerta', atencao: 'atencao', informativo: 'neutro',
};

export function Qualidade(): JSX.Element {
  const [filtroSev, setFiltroSev] = useState<string | null>(null);

  const q = useQuery({
    queryKey: [...chaves.qualidade, filtroSev],
    queryFn: ({ signal }) => apiGet<Dados>('/quality', { limit: 200, severity: filtroSev ?? undefined }, signal),
  });

  // Hooks de gráfico ANTES dos early returns (regra dos hooks).
  const palette = usePaletaGrafico();
  const opcaoSeveridade = useMemo(() => {
    const cc = q.data?.counters;
    if (!cc) return null;
    const dados = [
      { name: 'Crítico', value: Number(cc.critico ?? 0), cor: palette.danger },
      { name: 'Atenção', value: Number(cc.atencao ?? 0), cor: palette.warning },
      { name: 'Informativo', value: Number(cc.informativo ?? 0), cor: palette.neutral },
    ].filter((d) => d.value > 0);
    if (!dados.length) return null;
    const b = baseGrafico(palette);
    return {
      ...b,
      tooltip: { ...(b.tooltip as object), trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: palette.texto, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['52%', '78%'], center: ['50%', '44%'], avoidLabelOverlap: false,
        itemStyle: { borderColor: palette.surface, borderWidth: 2, borderRadius: 4 },
        label: { show: false }, labelLine: { show: false },
        data: dados.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.cor } })),
      }],
    };
  }, [q.data, palette]);

  // Radar: nº de problemas por DIMENSÃO de qualidade (completude, validade, etc.).
  const opcaoDimensoes = useMemo(() => {
    const br = q.data?.by_rule ?? [];
    if (!br.length) return null;
    const mapa = new Map<string, number>();
    for (const r of br) {
      const dim = r.dimension ?? 'outros';
      mapa.set(dim, (mapa.get(dim) ?? 0) + Number(r.n));
    }
    const dims = [...mapa.entries()];
    if (dims.length < 3) return null; // radar precisa de ≥3 eixos p/ fazer sentido
    const maxN = Math.max(...dims.map(([, n]) => n), 1);
    const b = baseGrafico(palette);
    return {
      ...b,
      tooltip: { ...(b.tooltip as object), trigger: 'item' },
      radar: {
        indicator: dims.map(([nome]) => ({ name: nome, max: maxN })),
        radius: '66%',
        axisName: { color: palette.texto, fontSize: 11 },
        splitLine: { lineStyle: { color: palette.grade, opacity: 0.6 } },
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisLine: { lineStyle: { color: palette.grade } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: dims.map(([, n]) => n), name: 'Problemas',
          areaStyle: { color: palette.primary, opacity: 0.18 },
          lineStyle: { color: palette.primary, width: 2 },
          itemStyle: { color: palette.primary },
        }],
      }],
    };
  }, [q.data, palette]);

  // Heatmap: matriz DIMENSÃO × SEVERIDADE (contagem de problemas). Mostra onde os
  // problemas se concentram — complementa o radar (que é só o total por dimensão).
  const opcaoHeatmap = useMemo(() => {
    const iss = q.data?.issues ?? [];
    if (!iss.length) return null;
    const sevs = ['critico', 'atencao', 'informativo'];
    const sevRotulo: Record<string, string> = { critico: 'Crítico', atencao: 'Atenção', informativo: 'Informativo' };
    const dims = [...new Set(iss.map((i) => i.dimension ?? 'outros'))];
    if (dims.length < 2) return null;
    const conta = new Map<string, number>();
    for (const i of iss) {
      const si = sevs.indexOf(i.severity);
      const di = dims.indexOf(i.dimension ?? 'outros');
      if (si < 0 || di < 0) continue;
      const k = `${si}-${di}`;
      conta.set(k, (conta.get(k) ?? 0) + 1);
    }
    const dados: [number, number, number][] = [];
    let maxV = 1;
    for (let si = 0; si < sevs.length; si++) {
      for (let di = 0; di < dims.length; di++) {
        const v = conta.get(`${si}-${di}`) ?? 0;
        dados.push([si, di, v]);
        if (v > maxV) maxV = v;
      }
    }
    const b = baseGrafico(palette);
    return {
      ...b,
      tooltip: { position: 'top', backgroundColor: palette.surface, borderColor: palette.grade,
        borderWidth: 1, textStyle: { color: palette.texto, fontSize: 12 },
        formatter: (p: { data: [number, number, number] }) => `${dims[p.data[1]]} · ${sevRotulo[sevs[p.data[0]]]}: <b>${p.data[2]}</b>` },
      grid: { left: 96, right: 14, top: 12, bottom: 54, containLabel: false },
      xAxis: { type: 'category', data: sevs.map((s) => sevRotulo[s]), splitArea: { show: true },
        axisLabel: { color: palette.muted, fontSize: 11 }, axisLine: { lineStyle: { color: palette.grade } } },
      yAxis: { type: 'category', data: dims, splitArea: { show: true },
        axisLabel: { color: palette.texto, fontSize: 11 }, axisLine: { lineStyle: { color: palette.grade } } },
      visualMap: { min: 0, max: maxV, calculable: false, orient: 'horizontal', left: 'center', bottom: 4,
        inRange: { color: [palette.surface, palette.warning, palette.danger] },
        textStyle: { color: palette.muted, fontSize: 10 } },
      series: [{ type: 'heatmap', data: dados, label: { show: true, color: palette.texto, fontSize: 11 },
        itemStyle: { borderColor: palette.grade, borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,.4)' } } }],
    };
  }, [q.data, palette]);

  if (q.isPending) return <SkeletonCartoes n={4} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar a análise de qualidade." codigo={e.code}
                       onRetry={() => q.refetch()} />;
  }

  const { issues, counters: c, by_rule, scores } = q.data;

  // Score geral ponderado pela quantidade de tabelas em cada classificação.
  const totalTab = scores.reduce((s, x) => s + Number(x.n), 0);
  const scoreGeral = totalTab > 0
    ? Math.round(scores.reduce((s, x) => s + Number(x.avg_score) * Number(x.n), 0) / totalTab)
    : null;

  const colunas: ColunaDef<Problema>[] = [
    { id: 'severity', cabecalho: 'Severidade', icone: 'ShieldAlert', largura: '130px', obrigatoria: true,
      celula: (p) => <Badge texto={p.severity} tom={SEV_TOM[p.severity] ?? 'neutro'}
        icone={p.severity === 'critico' ? 'CircleX' : p.severity === 'atencao' ? 'TriangleAlert' : 'CircleHelp'} /> },
    { id: 'rule', cabecalho: 'Regra', icone: 'ListChecks', largura: 'minmax(190px, 1.1fr)',
      celula: (p) => <span>{p.rule_label ?? p.rule_key}</span> },
    { id: 'dimension', cabecalho: 'Dimensão', icone: 'Layers', largura: '120px', ocultaPorPadrao: true,
      celula: (p) => <span className={css.discreto}>{p.dimension ?? '—'}</span> },
    { id: 'table_name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(190px, 1.2fr)',
      celula: (p) => <span className={css.mono}>{p.table_name}</span> },
    { id: 'field_name', cabecalho: 'Campo', icone: 'Columns3', largura: 'minmax(140px, .8fr)',
      celula: (p) => <span className={css.mono}>{p.field_name ?? '—'}</span> },
    { id: 'metric_value', cabecalho: 'Métrica', icone: 'Gauge', largura: '100px', alinhamento: 'fim',
      celula: (p) => <span className={css.num}>{p.metric_value !== null ? Number(p.metric_value).toFixed(2) : '—'}</span> },
    { id: 'health_score', cabecalho: 'Saúde', icone: 'Activity', largura: '80px', alinhamento: 'centro',
      celula: (p) => <AnelScore score={p.health_score} tamanho={30} /> },
  ];

  return (
    <div className={css.raiz}>
      <section className={css.topo}>
        <div className={css.gaugeBox}>
          <Gauge valor={scoreGeral} rotulo="Saúde dos dados" />
          <div className={css.dist}>
            {scores.map((s) => (
              <div key={s.classification} className={css.distItem}>
                <span className={`${css.distDot} ${css[s.classification] ?? ''}`} aria-hidden="true" />
                <span className={css.distNome}>{s.classification}</span>
                <span className={css.distNum}>{fmtInt(s.n)} tabelas · média {s.avg_score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={css.cards}>
          <MetricCard icone="Gauge" rotulo="Total aberto" valor={c.total} contexto="problemas em análise"
            onClick={() => setFiltroSev(null)} />
          <MetricCard icone="CircleX" rotulo="Críticos" valor={c.critico}
            tom={Number(c.critico) > 0 ? 'alerta' : 'ok'} contexto="violação real"
            onClick={() => setFiltroSev(filtroSev === 'critico' ? null : 'critico')} />
          <MetricCard icone="TriangleAlert" rotulo="Atenção" valor={c.atencao}
            tom={Number(c.atencao) > 0 ? 'atencao' : 'ok'} contexto="merece revisão"
            onClick={() => setFiltroSev(filtroSev === 'atencao' ? null : 'atencao')} />
          <MetricCard icone="CircleHelp" rotulo="Informativos" valor={c.informativo}
            contexto="sinal, não defeito"
            onClick={() => setFiltroSev(filtroSev === 'informativo' ? null : 'informativo')} />
        </div>
      </section>

      <div className={css.nota}>
        <Icone nome="ShieldAlert" size={13} />
        Problema de qualidade afeta a saúde da <strong>tabela</strong>, não o status da conexão (§24.6).
        Coluna anulável com muitos vazios costuma ser opcional por projeto — por isso nunca é crítica.
      </div>

      <div className={css.linhaViz}>
        {opcaoSeveridade && (
          <section className={css.bloco}>
            <h2 className={css.blocoTitulo}>Severidade dos problemas</h2>
            <Grafico opcao={opcaoSeveridade} altura={240} aria="Distribuição dos problemas por severidade" />
          </section>
        )}
        <section className={css.bloco}>
          <h2 className={css.blocoTitulo}>Por regra</h2>
          <div className={css.regras}>
          {by_rule.map((r) => (
            <div key={`${r.rule_key}-${r.severity}`} className={css.regra}>
              <Badge texto={r.severity} tom={SEV_TOM[r.severity] ?? 'neutro'} />
              <span className={css.regraNome}>{r.label ?? r.rule_key}</span>
              <span className={css.regraDim}>{r.dimension ?? '—'}</span>
              <strong className={css.regraNum}>{fmtInt(r.n)}</strong>
            </div>
          ))}
        </div>
        </section>
      </div>

      {(opcaoDimensoes || opcaoHeatmap) && (
        <div className={css.linhaViz}>
          {opcaoDimensoes && (
            <section className={css.bloco}>
              <h2 className={css.blocoTitulo}>Perfil por dimensão</h2>
              <Grafico opcao={opcaoDimensoes} altura={300} aria="Problemas de qualidade por dimensão" />
            </section>
          )}
          {opcaoHeatmap && (
            <section className={css.bloco}>
              <h2 className={css.blocoTitulo}>Dimensão × severidade</h2>
              <Grafico opcao={opcaoHeatmap} altura={300} aria="Mapa de calor de problemas por dimensão e severidade" />
            </section>
          )}
        </div>
      )}

      <section className={css.bloco}>
        <div className={css.blocoTopo}>
          <h2 className={css.blocoTitulo}>Problemas</h2>
          {filtroSev && (
            <button type="button" className={css.limpar} onClick={() => setFiltroSev(null)}>
              filtrando por “{filtroSev}” — limpar
            </button>
          )}
        </div>
        <DataGrid<Problema> rotulo="Problemas de qualidade" chaveEstado="qualidade"
          colunas={colunas} linhas={issues} idLinha={(p) => p.id} aoAtualizar={() => q.refetch()}
          expansao={(p) => <p className={css.detalhe}>{p.detail ?? 'Sem detalhe registrado.'}</p>}
          vazio={{ titulo: 'Nenhum problema encontrado',
                   descricao: filtroSev
                     ? `Nenhum problema com severidade “${filtroSev}”.`
                     : 'Execute a análise de qualidade para popular esta tela.' }} />
      </section>
    </div>
  );
}
