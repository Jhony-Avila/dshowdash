// screens/PageHeader.tsx — cabeçalho padrão de página (Elevação visual §7).
// @version 1.0.0  @created 2026-07-22
//
// Ícone da área + título + descrição + contagem + slot de ações à direita.
// Usado por todas as telas para consistência visual (critério de aceite #24).
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({ Icon, titulo, descricao, contagem, atualizando, acoes }: {
  Icon?: LucideIcon;
  titulo: string;
  descricao?: ReactNode;
  contagem?: ReactNode;       // ex.: total de registros (vira chip)
  atualizando?: boolean;
  acoes?: ReactNode;          // botões à direita (atualizar, exportar, densidade…)
}) {
  return (
    <div className="pp-pagehead">
      <div className="pp-pagehead-l">
        {Icon && <span className="pp-pagehead-ic" aria-hidden><Icon size={22} strokeWidth={2} /></span>}
        <div className="pp-pagehead-txt">
          <div className="pp-pagehead-title">
            <h1 className="pp-h1">{titulo}</h1>
            {contagem != null && <span className="pp-pagehead-count">{contagem}</span>}
            {atualizando && <span className="pp-pagehead-live" title="Atualizando…">atualizando…</span>}
          </div>
          {descricao && <p className="pp-sub" style={{ margin: 0 }}>{descricao}</p>}
        </div>
      </div>
      {acoes && <div className="pp-pagehead-r">{acoes}</div>}
    </div>
  );
}
