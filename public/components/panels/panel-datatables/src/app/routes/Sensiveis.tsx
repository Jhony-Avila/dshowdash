// app/routes/Sensiveis.tsx — Campos sensíveis no padrão de Elevação Visual.
// @version 2.0.0  @updated 2026-07-20
// Estrutura: aviso → cards de resumo → FilterBar (tipos) → AppDataGrid.
// ⚠️ Classificação por METADADO (nome/comentário). É INDÍCIO, não confirmação.
import { useState, useMemo, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../../lib/api';
import { fmtInt } from '../../lib/format';
import { DataGrid } from '../../components/grid/DataGrid';
import { FilterBar } from '../../components/grid/FilterBar';
import type { ColunaDef } from '../../components/grid/tipos';
import { MetricCard } from '../../components/ui/MetricCard';
import { Grafico, usePaletaGrafico, baseGrafico } from '../../components/ui/Grafico';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, SkeletonCartoes } from '../../components/ui/Estados';
import css from './Sensiveis.module.css';

interface Campo {
  id: number; name: string; sensitivity: string; labels: string[] | null; data_type: string;
  table_id: number; table_name: string; database_name: string; environment_label: string | null;
}
const KIND_TOM: Record<string, 'alerta' | 'atencao' | 'info' | 'neutro'> = {
  credencial: 'alerta', pii: 'atencao', financeiro: 'atencao', contato: 'info',
};

export function Sensiveis(): JSX.Element {
  const [kind, setKind] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['dt', 'sensitive', kind],
    queryFn: ({ signal }) => apiGet<Campo[]>('/fields/sensitive', { kind: kind ?? undefined }, signal),
  });
  // Totais por tipo (sempre do conjunto completo, independente do filtro).
  const todos = useQuery({
    queryKey: ['dt', 'sensitive', null],
    queryFn: ({ signal }) => apiGet<Campo[]>('/fields/sensitive', undefined, signal),
  });

  const palette = usePaletaGrafico();
  const opcaoTipos = useMemo(() => {
    const arr = todos.data ?? q.data ?? [];
    if (!arr.length) return null;
    const cont = arr.reduce((acc, c) => { acc[c.sensitivity] = (acc[c.sensitivity] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const CORES: Record<string, string> = { credencial: palette.danger, pii: palette.warning, financeiro: palette.slow, contato: palette.info };
    const ciclo = [palette.danger, palette.warning, palette.info, palette.primary, palette.slow, palette.cred, palette.success];
    const dados = Object.entries(cont).map(([k, v], i) => ({ name: k, value: v, cor: CORES[k] ?? ciclo[i % ciclo.length] }));
    const b = baseGrafico(palette);
    return {
      ...b,
      tooltip: { ...(b.tooltip as object), trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: palette.texto, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{ type: 'pie', radius: ['50%', '76%'], center: ['50%', '44%'], itemStyle: { borderColor: palette.surface, borderWidth: 2, borderRadius: 4 }, label: { show: false }, labelLine: { show: false },
        data: dados.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.cor } })) }],
    };
  }, [todos.data, q.data, palette]);

  if (q.isPending) return <SkeletonCartoes n={4} />;
  if (q.isError) {
    const e = q.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar os campos sensíveis." codigo={e.code} onRetry={() => q.refetch()} />;
  }
  const campos = q.data;
  const base = todos.data ?? campos;
  const porTipo = base.reduce<Record<string, number>>((acc, c) => { acc[c.sensitivity] = (acc[c.sensitivity] ?? 0) + 1; return acc; }, {});
  const tipos = Object.keys(porTipo).sort();

  const colunas: ColunaDef<Campo>[] = [
    { id: 'sensitivity', cabecalho: 'Tipo', icone: 'ShieldAlert', largura: '140px', obrigatoria: true,
      celula: (c) => <Badge texto={c.sensitivity} tom={KIND_TOM[c.sensitivity] ?? 'neutro'} icone="ShieldAlert" /> },
    { id: 'name', cabecalho: 'Campo', icone: 'Columns3', largura: 'minmax(170px, 1fr)',
      celula: (c) => <span className={css.mono}>{c.name}</span> },
    { id: 'table_name', cabecalho: 'Tabela', icone: 'TableProperties', largura: 'minmax(190px, 1.2fr)',
      celula: (c) => <span className={css.mono}>{c.database_name}.{c.table_name}</span> },
    { id: 'data_type', cabecalho: 'Tipo de dado', icone: 'Hash', largura: '130px',
      celula: (c) => <span className={css.discreto}>{c.data_type}</span> },
    { id: 'labels', cabecalho: 'Etiquetas', icone: 'Tag', largura: 'minmax(150px, 1fr)',
      celula: (c) => (c.labels && c.labels.length)
        ? <span className={css.tags}>{c.labels.map((l) => <span key={l} className={css.tag}><Icone nome="Tag" size={10} />{l}</span>)}</span>
        : <span className={css.discreto}>—</span> },
    { id: 'environment_label', cabecalho: 'Ambiente', icone: 'Network', largura: '120px', ocultaPorPadrao: true,
      celula: (c) => <span className={css.discreto}>{c.environment_label ?? '—'}</span> },
  ];

  return (
    <div className={css.raiz}>
      <div className={css.avisoTopo}>
        <Icone nome="ShieldAlert" size={14} />
        <div>
          <strong>Classificação por metadado.</strong> A sensibilidade é inferida do nome e do
          comentário da coluna — é um <em>indício</em> para revisão, não uma confirmação do conteúdo real.
        </div>
      </div>

      <section className={css.cards}>
        <MetricCard icone="ShieldAlert" rotulo="Campos sensíveis" valor={base.length} contexto="indício por metadado" />
        <MetricCard icone="KeyRound" rotulo="Credenciais" valor={porTipo.credencial ?? 0} tom={(porTipo.credencial ?? 0) > 0 ? 'alerta' : 'ok'} contexto="risco alto" />
        <MetricCard icone="Eye" rotulo="PII" valor={porTipo.pii ?? 0} tom={(porTipo.pii ?? 0) > 0 ? 'atencao' : 'ok'} contexto="dados pessoais" />
        <MetricCard icone="Tag" rotulo="Tipos distintos" valor={tipos.length} contexto="categorias" />
      </section>

      {opcaoTipos && (
        <section className={css.grafBloco}>
          <span className={css.grafTitulo}>Distribuição por tipo</span>
          <Grafico opcao={opcaoTipos} altura={220} aria="Distribuição de campos sensíveis por tipo" />
        </section>
      )}

      <DataGrid<Campo> rotulo="Campos sensíveis" chaveEstado="sensiveis" colunas={colunas} linhas={campos} idLinha={(c) => c.id}
        aoAtualizar={() => { q.refetch(); todos.refetch(); }}
        ferramentas={
          <FilterBar
            chips={[
              { ativo: kind === null, aoClicar: () => setKind(null), texto: `Todos (${fmtInt(base.length)})` },
              ...tipos.map((t) => ({ ativo: kind === t, aoClicar: () => setKind(kind === t ? null : t), icone: 'ShieldAlert', texto: `${t} (${fmtInt(porTipo[t])})` })),
            ]}
          />
        }
        vazio={{ titulo: 'Nenhum campo sensível', descricao: kind ? `Nenhum campo do tipo "${kind}".` : 'Nenhuma coluna foi classificada como sensível no catálogo.' }} />
    </div>
  );
}
