// components/Colecoes.tsx — coleções temáticas com progresso (AS3 F2c, §8).
// @version 1.0.0  @created 2026-07-30
import { useMemo } from 'react';
import { Check, Layers } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import {
  COLECOES, RARIDADES, aplicarColecao, itemPorId, progressoColecao,
} from '../services/AvatarCatalog';
import { itensUsados } from '../services/Progresso';
import { AvatarSvg } from './AvatarSvg';

export function Colecoes({ config, aoAplicar }: {
  config: AvatarConfig;
  aoAplicar: (novo: AvatarConfig) => void;
}) {
  const usados = useMemo(itensUsados, [config]); // recalcula a cada mudança

  return (
    <div className="avst-colecoes" role="list" aria-label="Coleções">
      {COLECOES.map((col) => {
        const rar = RARIDADES[col.raridade];
        const prog = progressoColecao(col, usados);
        const completa = prog.usados === prog.total;
        const preview = aplicarColecao(config, col);
        return (
          <article key={col.id} role="listitem" className="avst-colecao"
            style={{ '--avst-rar': rar.cor } as React.CSSProperties}>
            <span className="avst-colecao-thumb">
              <AvatarSvg config={preview} estatico uid={`col-${col.id}`} />
            </span>
            <div className="avst-colecao-info">
              <header>
                <strong>{col.nome}</strong>
                <em style={{ color: rar.cor }}>{rar.nome}</em>
                {completa && <span className="avst-colecao-completa"><Check size={11} aria-hidden /> Completa</span>}
              </header>
              <p>{col.descricao}</p>
              <div className="avst-colecao-progresso" role="progressbar"
                aria-valuenow={prog.usados} aria-valuemax={prog.total}
                aria-label={`Progresso da coleção ${col.nome}`}>
                <span style={{ width: `${(prog.usados / prog.total) * 100}%` }} />
              </div>
              <footer>
                <span className="avst-colecao-contagem">
                  <Layers size={11} aria-hidden /> {prog.usados}/{prog.total} itens explorados
                </span>
                <span className="avst-colecao-itens">
                  {col.itens.map((id) => itemPorId(id)?.nome).filter(Boolean).join(' · ')}
                </span>
                <button type="button" className="avst-botao avst-botao-primario"
                  onClick={() => aoAplicar(preview)}>
                  Equipar coleção
                </button>
              </footer>
            </div>
          </article>
        );
      })}
    </div>
  );
}
