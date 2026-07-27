// components/ui/Tendencia.tsx — executivo: tendência de tamanho do maior banco.
// @version 1.0.0  @created 2026-07-21
// Auto-suficiente. Consome /metrics (série do maior banco ao longo do tempo).
// HONESTO: enquanto o cron de métricas acumula histórico (poucas amostras / dias),
// mostra uma nota "histórico em formação". O gráfico enriquece sozinho com o tempo.
import { useMemo, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { fmtInt } from '../../lib/format';
import { Grafico, usePaletaGrafico, baseGrafico } from './Grafico';
import { Icone } from './Icone';
import { Skeleton, EmptyState } from './Estados';
import css from './Tendencia.module.css';

interface Ponto { t: string; size_bytes: number; table_count: number }
interface Dados {
  coverage: { db_samples?: number; span_hours?: number; since?: string | null };
  series: { db: string | null; points: Ponto[] };
}

export function Tendencia(): JSX.Element {
  const q = useQuery({
    queryKey: ['dt', 'metrics'],
    queryFn: ({ signal }) => apiGet<Dados>('/metrics', undefined, signal),
  });

  const palette = usePaletaGrafico();
  const opcao = useMemo(() => {
    const pts = q.data?.series?.points ?? [];
    if (pts.length < 2) return null;
    const b = baseGrafico(palette);
    const x = pts.map((p) => p.t.slice(5, 16)); // MM-DD HH:mm
    const mb = pts.map((p) => Math.round(p.size_bytes / 1048576));
    return {
      ...b,
      tooltip: { ...(b.tooltip as object), trigger: 'axis' },
      xAxis: {
        type: 'category', data: x, boundaryGap: false,
        axisLine: { lineStyle: { color: palette.grade } },
        axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true },
      },
      yAxis: {
        type: 'value', name: 'MB', nameTextStyle: { color: palette.muted, fontSize: 10 },
        axisLabel: { color: palette.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: palette.grade, opacity: 0.35 } },
      },
      series: [{
        type: 'line', data: mb, smooth: true, symbol: 'circle', symbolSize: 5,
        lineStyle: { color: palette.primary, width: 2 }, itemStyle: { color: palette.primary },
        areaStyle: {
          opacity: 0.18,
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: palette.primary }, { offset: 1, color: 'transparent' }] },
        },
      }],
    };
  }, [q.data, palette]);

  if (q.isPending) return <Skeleton linhas={5} altura={34} />;
  if (q.isError) {
    return <EmptyState icone="TrendingUp" titulo="Tendência indisponível"
                       descricao="O coletor de métricas não respondeu agora." />;
  }

  const { coverage, series } = q.data;
  const pts = series.points ?? [];

  if (pts.length < 2) {
    return <EmptyState icone="LineChart" titulo="Histórico em formação"
                       descricao="O coletor de métricas registrou poucos pontos até agora. A linha de tendência aparece conforme as amostras diárias acumulam." />;
  }

  const primeiro = pts[0].t, ultimo = pts[pts.length - 1].t;
  const horas = (new Date(ultimo.replace(' ', 'T')).getTime() - new Date(primeiro.replace(' ', 'T')).getTime()) / 3600000;
  const formando = horas < 24 * 7; // menos de 7 dias de janela
  const ultimoP = pts[pts.length - 1];

  return (
    <div className={css.raiz}>
      <div className={css.topo}>
        <span className={css.metaBanco}><Icone nome="Database" size={12} /> {series.db ?? 'maior banco'}</span>
        <span className={css.metaAgora}>{fmtInt(Math.round(ultimoP.size_bytes / 1048576))} MB · {fmtInt(ultimoP.table_count)} tabelas</span>
      </div>
      <Grafico opcao={opcao} altura={190} aria={`Tendência de tamanho de ${series.db ?? 'banco'} em MB`} />
      {formando && (
        <div className={css.nota}>
          <Icone nome="Info" size={12} />
          Histórico em formação — {fmtInt(coverage.db_samples ?? pts.length)} amostras em ~{Math.max(1, Math.round(horas))}h. A tendência ganha precisão com os dias.
        </div>
      )}
    </div>
  );
}
