import type { JSX } from 'react';
// components/ui/HealthBanner.tsx — situação geral em uma frase (§12.2).
// @version 1.0.0  @created 2026-07-20
import { Icone } from './Icone';
import { fmtRelativo } from '../../lib/format';
import css from './HealthBanner.module.css';

interface Props {
  online: number; offline: number; instaveis: number;
  alertasCriticos: number; alertasAtencao: number;
  problemasQualidade: number; ultimaVerificacao?: string | null;
}

export function HealthBanner(p: Props): JSX.Element {
  const critico = p.offline > 0 || p.alertasCriticos > 0;
  const atencao = !critico && (p.instaveis > 0 || p.alertasAtencao > 0);
  const tom = critico ? 'critico' : atencao ? 'atencao' : 'saudavel';

  const titulo = critico
    ? 'Infraestrutura com falhas'
    : atencao ? 'Infraestrutura em atenção' : 'Infraestrutura saudável';

  const partes: string[] = [];
  partes.push(`${p.online} conexão(ões) online`);
  if (p.offline > 0) partes.push(`${p.offline} offline`);
  if (p.instaveis > 0) partes.push(`${p.instaveis} instável(is)`);
  partes.push(p.alertasCriticos > 0 ? `${p.alertasCriticos} alerta(s) crítico(s)` : 'nenhuma falha crítica');
  if (p.alertasAtencao > 0) partes.push(`${p.alertasAtencao} alerta(s) de atenção`);
  if (p.problemasQualidade > 0) partes.push(`${p.problemasQualidade} problema(s) de qualidade`);

  return (
    <div className={`${css.banner} ${css[tom]}`} role="status">
      <span className={css.icone}>
        <Icone nome={critico ? 'CircleX' : atencao ? 'TriangleAlert' : 'CircleCheck'} size={20} />
      </span>
      <div className={css.corpo}>
        <strong className={css.titulo}>{titulo}</strong>
        <span className={css.detalhe}>{partes.join(' · ')}</span>
      </div>
      <span className={css.tempo} title={p.ultimaVerificacao ?? undefined}>
        <Icone nome="Clock" size={12} /> {fmtRelativo(p.ultimaVerificacao)}
      </span>
    </div>
  );
}
