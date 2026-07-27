// screens/Estados.tsx — estados padronizados: carregando (skeleton) / vazio / erro.
// @version 1.0.0  @created 2026-07-24  (Elevação visual — Fase 1 fatia 3)
//
// Um só vocabulário visual para as 16 telas: nada de "Carregando…" solto.
// - SkeletonLinhas: linhas fantasma DENTRO do <tbody> (mantém cabeçalho e larguras).
// - SkeletonBloco : retângulos fantasma para telas de cards.
// - EstadoVazio   : sem resultado (com ação opcional, ex.: limpar filtros).
// - EstadoErro    : falha de carga (com "Tentar novamente").
import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RotateCw, type LucideIcon } from 'lucide-react';

/** Linhas fantasma para tabelas. Renderiza <tr> — usar dentro de <tbody>. */
export function SkeletonLinhas({ colunas, linhas = 8 }: { colunas: number; linhas?: number }) {
  return (
    <>
      {Array.from({ length: linhas }, (_, i) => (
        <tr key={i} className="pp-skel-tr" aria-hidden>
          {Array.from({ length: colunas }, (_, j) => (
            <td key={j}><span className="pp-skel" style={{ width: `${[86, 62, 74, 54, 68][(i + j) % 5]}%` }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Blocos fantasma para telas de cards (sem tabela). */
export function SkeletonBloco({ linhas = 4, altura = 14 }: { linhas?: number; altura?: number }) {
  return (
    <div className="pp-skel-bloco" aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} className="pp-skel" style={{ height: altura, width: `${[92, 78, 85, 64, 71][i % 5]}%` }} />
      ))}
    </div>
  );
}

export function EstadoVazio({ Icon = Inbox, titulo, descricao, acao }: {
  Icon?: LucideIcon;
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="pp-estado">
      <span className="pp-estado-ic" aria-hidden><Icon size={26} strokeWidth={1.8} /></span>
      <div className="pp-estado-t">{titulo}</div>
      {descricao && <div className="pp-estado-d">{descricao}</div>}
      {acao && <div className="pp-estado-a">{acao}</div>}
    </div>
  );
}

export function EstadoErro({ titulo = 'Não foi possível carregar', detalhe, onRetry }: {
  titulo?: string;
  detalhe?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="pp-estado is-err">
      <span className="pp-estado-ic is-err" aria-hidden><AlertTriangle size={26} strokeWidth={1.8} /></span>
      <div className="pp-estado-t">{titulo}</div>
      {detalhe && <div className="pp-estado-d">{detalhe}</div>}
      {onRetry && (
        <div className="pp-estado-a">
          <button className="pp-btn" onClick={onRetry}><RotateCw size={14} /> Tentar novamente</button>
        </div>
      )}
    </div>
  );
}
