// app/routes/drawers/BancoDrawer.tsx — detalhe do banco em DRAWER (§12/§19).
// @version 1.0.0  @created 2026-07-21
// Abre ao clicar numa linha de Bancos. Resumo (da linha) + TENDÊNCIA de tamanho
// (/metrics?db=id) + maiores tabelas (/tables?database_id=id).
import { useMemo, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api';
import { fmtInt, fmtBytes } from '../../../lib/format';
import { Drawer, DrawerSecao } from '../../../components/ui/Drawer';
import { Badge } from '../../../components/ui/Badge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Icone } from '../../../components/ui/Icone';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../../components/ui/Grafico';
import { Skeleton, EmptyState } from '../../../components/ui/Estados';
import css from './TabelaDrawer.module.css';

export interface BancoLinha {
  id: number; name: string; server_name: string | null; connection_name: string;
  connection_status: string; environment_label: string | null;
  table_count: number; field_count: number; size_bytes: number | null;
}
interface TabelaLinha { id: number; name: string; size_bytes: number | null; row_count_approx: number | null }
interface Ponto { captured_at: string; size_bytes: number; table_count: number }
interface Serie { db_id: number; series: Ponto[] }

export function BancoDrawer({ banco, aoFechar, aoComparar }: {
  banco: BancoLinha | null; aoFechar: () => void; aoComparar?: (id: number) => void;
}): JSX.Element {
  const id = banco?.id ?? null;

  const qTab = useQuery({
    queryKey: ['dt', 'tables', { db: id }],
    queryFn: ({ signal }) => apiGet<TabelaLinha[]>('/tables', { database_id: id, limit: 300 }, signal),
    enabled: id !== null,
  });
  const qSer = useQuery({
    queryKey: ['dt', 'metrics', id],
    queryFn: ({ signal }) => apiGet<Serie>('/metrics', { db: id }, signal),
    enabled: id !== null,
  });
  const palette = usePaletaGrafico();

  const opcao = useMemo(() => {
    const pts = qSer.data?.series ?? [];
    if (pts.length < 2) return null;
    const b = baseGrafico(palette);
    return {
      ...b,
      tooltip: { ...(b.tooltip as object), trigger: 'axis' },
      xAxis: { type: 'category', data: pts.map((p) => p.captured_at.slice(5, 16)), boundaryGap: false,
        axisLine: { lineStyle: { color: palette.grade } },
        axisLabel: { color: palette.muted, fontSize: 9, hideOverlap: true } },
      yAxis: { type: 'value', name: 'MB', nameTextStyle: { color: palette.muted, fontSize: 9 },
        axisLabel: { color: palette.muted, fontSize: 9 },
        splitLine: { lineStyle: { color: palette.grade, opacity: 0.3 } } },
      series: [{ type: 'line', data: pts.map((p) => Math.round(p.size_bytes / 1048576)),
        smooth: true, symbol: 'none', lineStyle: { color: palette.primary, width: 2 },
        areaStyle: { opacity: 0.16, color: palette.primary } }],
    };
  }, [qSer.data, palette]);

  const topTabelas = useMemo(() => {
    const arr = qTab.data ?? [];
    return [...arr].sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0)).slice(0, 10);
  }, [qTab.data]);

  return (
    <Drawer aberto={id !== null} aoFechar={aoFechar}
      titulo={banco?.name ?? 'Banco'} subtitulo={banco ? (banco.server_name ?? banco.connection_name) : undefined}
      icone="Database" acoes={banco ? <StatusBadge status={banco.connection_status} compacto /> : undefined} largura={620}>
      {banco && (
        <>
          <div className={css.resumo}>
            <Resumo icone="TableProperties" rotulo="Tabelas" valor={fmtInt(banco.table_count)} />
            <Resumo icone="Columns3" rotulo="Campos" valor={fmtInt(banco.field_count)} />
            <Resumo icone="HardDrive" rotulo="Tamanho" valor={fmtBytes(banco.size_bytes)} />
            <Resumo icone="PlugZap" rotulo="Conexão" valor={banco.connection_name} />
          </div>
          {banco.environment_label && (
            <div className={css.tags}><Badge texto={banco.environment_label} tom="info" icone="Network" /></div>
          )}

          {aoComparar && (
            <button type="button" className={css.acaoBtn} onClick={() => aoComparar(banco.id)}
              title="Abrir a comparação de esquemas com este banco pré-selecionado">
              <Icone nome="GitCompare" size={14} /> Comparar esquema com outro banco
            </button>
          )}

          <DrawerSecao titulo="Tendência de tamanho" icone="TrendingUp">
            {qSer.isPending ? <Skeleton linhas={4} altura={20} />
              : opcao ? <Grafico opcao={opcao} altura={190} aria={`Tendência de tamanho de ${banco.name}`} />
              : <EmptyState icone="LineChart" titulo="Histórico em formação"
                            descricao="O coletor de métricas ainda tem poucas amostras deste banco." />}
          </DrawerSecao>

          <DrawerSecao titulo="Maiores tabelas" icone="TableProperties" contagem={topTabelas.length}>
            {qTab.isPending ? <Skeleton linhas={5} altura={18} />
              : topTabelas.length === 0
                ? <EmptyState icone="TableProperties" titulo="Sem tabelas" descricao="Nenhuma tabela catalogada neste banco." />
                : <div className={css.lista}>
                    {topTabelas.map((t) => (
                      <div key={t.id} className={css.linha}>
                        <span className={css.mono}>{t.name}</span>
                        <span className={css.discreto}>{fmtInt(t.row_count_approx)} reg</span>
                        <Badge texto={fmtBytes(t.size_bytes)} fraco />
                      </div>
                    ))}
                  </div>}
          </DrawerSecao>
        </>
      )}
    </Drawer>
  );
}

function Resumo({ icone, rotulo, valor }: { icone: string; rotulo: string; valor: string }): JSX.Element {
  return (
    <div className={css.resumoItem}>
      <span className={css.resumoIcone}><Icone nome={icone} size={14} /></span>
      <span className={css.resumoValor}>{valor}</span>
      <span className={css.resumoRotulo}>{rotulo}</span>
    </div>
  );
}
