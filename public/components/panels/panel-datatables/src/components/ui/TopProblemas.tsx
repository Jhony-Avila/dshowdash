// components/ui/TopProblemas.tsx — executivo: ranking das tabelas mais problemáticas.
// @version 1.0.0  @created 2026-07-21
// Auto-suficiente (fetch próprio + estados). Agrega /quality por tabela e mostra
// as 6 piores (mais críticos → menor score → mais problemas). Clica → Qualidade.
import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../../lib/api';
import { Badge, AnelScore } from './Badge';
import { Icone } from './Icone';
import { Skeleton, EmptyState } from './Estados';
import css from './TopProblemas.module.css';

interface Problema { table_name: string; database_name: string; health_score: number | null; severity: string }
interface Dados { issues: Problema[] }
interface Linha { tabela: string; banco: string; criticos: number; atencao: number; total: number; score: number | null }

export function TopProblemas({ ir }: { ir: (r: { grupo: string; tela: string }) => void }): JSX.Element {
  const q = useQuery({
    queryKey: [...chaves.qualidade, 'top'],
    queryFn: ({ signal }) => apiGet<Dados>('/quality', { limit: 200 }, signal),
  });

  if (q.isPending) return <Skeleton linhas={4} altura={40} />;
  if (q.isError) {
    return <EmptyState icone="ShieldAlert" titulo="Qualidade indisponível"
                       descricao="A análise de qualidade não respondeu agora." />;
  }

  const mapa = new Map<string, Linha>();
  for (const i of q.data.issues ?? []) {
    const k = `${i.database_name}.${i.table_name}`;
    const l = mapa.get(k) ?? { tabela: i.table_name, banco: i.database_name, criticos: 0, atencao: 0, total: 0, score: i.health_score };
    if (i.severity === 'critico') l.criticos++;
    else if (i.severity === 'atencao') l.atencao++;
    l.total++;
    if (i.health_score != null) l.score = l.score == null ? i.health_score : Math.min(l.score, i.health_score);
    mapa.set(k, l);
  }
  const top = [...mapa.values()]
    .sort((a, b) => b.criticos - a.criticos || (a.score ?? 100) - (b.score ?? 100) || b.total - a.total)
    .slice(0, 6);

  if (top.length === 0) {
    return <EmptyState icone="CircleCheck" titulo="Nenhum problema aberto"
                       descricao="Todas as tabelas analisadas estão saudáveis." />;
  }

  return (
    <ol className={css.lista}>
      {top.map((l, idx) => (
        <li key={`${l.banco}.${l.tabela}`} className={css.item}
            onClick={() => ir({ grupo: 'observability', tela: 'quality' })}>
          <span className={`${css.rank} ${l.criticos > 0 ? css.rankAlerta : ''}`}>{idx + 1}</span>
          <span className={css.nome}>
            <span className={css.tabela}>{l.tabela}</span>
            <span className={css.banco}>{l.banco}</span>
          </span>
          <span className={css.chips}>
            {l.criticos > 0 && <Badge texto={`${l.criticos} crítico${l.criticos > 1 ? 's' : ''}`} tom="alerta" fraco />}
            {l.atencao > 0 && <Badge texto={`${l.atencao} atenção`} tom="atencao" fraco />}
          </span>
          <AnelScore score={l.score} tamanho={30} />
          <Icone nome="ChevronRight" size={14} className={css.ir} />
        </li>
      ))}
    </ol>
  );
}
