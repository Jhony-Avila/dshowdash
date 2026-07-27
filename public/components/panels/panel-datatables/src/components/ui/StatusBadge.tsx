import type { JSX } from 'react';
// components/ui/StatusBadge.tsx — status com cor + ícone + texto + tooltip.
// @version 1.0.0  @created 2026-07-20
// §13.8: NENHUM status pode ser comunicado só por cor.
import { statusVisual } from '../../lib/status';
import { Icone } from './Icone';
import css from './StatusBadge.module.css';

export function StatusBadge({ status, compacto = false }: { status: string | null | undefined; compacto?: boolean }): JSX.Element {
  const v = statusVisual(status);
  return (
    <span
      className={compacto ? css.compacto : css.badge}
      style={{ ['--cor' as string]: v.cor, ['--fundo' as string]: v.fundo }}
      title={v.descricao}
    >
      <Icone nome={v.icone} size={compacto ? 12 : 13} />
      <span>{v.rotulo}</span>
    </span>
  );
}
