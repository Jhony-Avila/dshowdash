import type { JSX } from 'react';
// components/ui/Navegacao.tsx — navegação em DUAS camadas (§8 aprovado).
// @version 1.0.0  @created 2026-07-20
//
// Camada 1: 6 grupos (segmented control, sempre visível, com ícone)
// Camada 2: telas do grupo selecionado
// NUNCA as 13 telas ao mesmo tempo — era o problema apontado na §7.1.
// Sem sidebar própria: a do Dshow Dash continua sendo a única.
import { GRUPOS, type Rota } from '../../shell/routing';
import { Icone } from './Icone';
import css from './Navegacao.module.css';

interface Props {
  rota: Rota;
  ir: (r: { grupo: string; tela: string }) => void;
  /** Badge de alertas críticos na camada 1. */
  alertas?: number;
}

export function Navegacao({ rota, ir, alertas = 0 }: Props): JSX.Element {
  const grupoAtual = GRUPOS.find((g) => g.id === rota.grupo) ?? GRUPOS[0];

  return (
    <nav className={css.raiz} aria-label="Navegação do DataTables">
      {/* Camada 1 — grupos */}
      <div className={css.grupos} role="tablist" aria-label="Áreas">
        {GRUPOS.map((g) => {
          const ativo = g.id === rota.grupo;
          const temBadge = g.id === 'observability' && alertas > 0;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              className={ativo ? css.grupoAtivo : css.grupo}
              onClick={() => ir({ grupo: g.id, tela: g.telas[0].id })}
            >
              <Icone nome={g.icone} size={15} />
              <span className={css.grupoRotulo}>{g.rotulo}</span>
              {temBadge && (
                <span className={css.badge} title={`${alertas} alerta(s) ativo(s)`}>{alertas}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Camada 2 — telas do grupo. Só aparece se houver mais de uma. */}
      {grupoAtual.telas.length > 1 && (
        <div className={css.telas} role="tablist" aria-label={`Telas de ${grupoAtual.rotulo}`}>
          {grupoAtual.telas.map((t) => {
            const ativo = t.id === rota.tela;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={ativo}
                className={ativo ? css.telaAtiva : css.tela}
                onClick={() => ir({ grupo: grupoAtual.id, tela: t.id })}
              >
                {t.rotulo}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
