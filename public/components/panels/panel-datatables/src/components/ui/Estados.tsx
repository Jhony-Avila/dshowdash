// components/ui/Estados.tsx — Skeleton, EmptyState e ErrorState (§31/§32/§33).
// @version 1.0.0  @created 2026-07-20
import type { ReactNode, JSX } from 'react';
import { Icone } from './Icone';
import css from './Estados.module.css';

export function Skeleton({ linhas = 3, altura = 14 }: { linhas?: number; altura?: number }): JSX.Element {
  return (
    <div className={css.skeleton} aria-busy="true" aria-live="polite">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className={css.barra} style={{ height: altura, width: `${100 - i * 7}%` }} />
      ))}
      <span className={css.sr}>Carregando…</span>
    </div>
  );
}

export function SkeletonCartoes({ n = 4 }: { n?: number }): JSX.Element {
  return (
    <div className={css.grade} aria-busy="true">
      {Array.from({ length: n }, (_, i) => <div key={i} className={css.cartaoSkel} />)}
    </div>
  );
}

/** §32: todo estado vazio tem ícone, título, explicação e ação. */
export function EmptyState({ icone = 'FileWarning', titulo, descricao, acao }: {
  icone?: string; titulo: string; descricao: string; acao?: ReactNode;
}): JSX.Element {
  return (
    <div className={css.vazio}>
      <div className={css.vazioIcone}><Icone nome={icone} size={40} /></div>
      <strong className={css.vazioTitulo}>{titulo}</strong>
      <p className={css.vazioTexto}>{descricao}</p>
      {acao && <div className={css.vazioAcao}>{acao}</div>}
    </div>
  );
}

/** §33: erro diz o que falhou, permite tentar de novo e mostra código técnico. */
export function ErrorState({ titulo, mensagem, codigo, onRetry }: {
  titulo?: string; mensagem: string; codigo?: string; onRetry?: () => void;
}): JSX.Element {
  return (
    <div className={css.erro} role="alert">
      <div className={css.erroIcone}><Icone nome="TriangleAlert" size={32} /></div>
      <strong className={css.vazioTitulo}>{titulo ?? 'Não foi possível carregar'}</strong>
      <p className={css.vazioTexto}>{mensagem}</p>
      {codigo && <code className={css.codigo}>{codigo}</code>}
      {onRetry && (
        <button type="button" className={css.botao} onClick={onRetry}>
          <Icone nome="RefreshCw" size={13} /> Tentar novamente
        </button>
      )}
    </div>
  );
}
