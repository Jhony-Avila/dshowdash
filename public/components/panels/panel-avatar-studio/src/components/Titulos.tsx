// components/Titulos.tsx — sistema de TÍTULOS (Expansão §27).
// @version 1.0.0  @created 2026-07-30
//
// Dados puros (sem arte): o título vira um SELO sob o personagem no palco e
// entra no config (campo opcional `titulo` — validado nos dois lados).
// Categoria 2D imediata autorizada pela decisão #33.
import { Ban, Crown } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { RARIDADES, TITULOS } from '../services/AvatarCatalog';

export function Titulos({ config, aoAplicar }: {
  config: AvatarConfig;
  aoAplicar: (novo: AvatarConfig) => void;
}) {
  const escolher = (id: string | null) => {
    const novo: AvatarConfig = { ...config };
    if (id) novo.titulo = id;
    else delete novo.titulo;
    aoAplicar(novo);
  };

  return (
    <div className="avst-titulos">
      <p className="avst-conquistas-resumo">
        <Crown size={13} aria-hidden /> O título aparece como selo sob o personagem — escolha o seu.
      </p>
      <button type="button"
        className={`avst-titulo-card ${!config.titulo ? 'avst-titulo-ativo' : ''}`}
        onClick={() => escolher(null)}>
        <span className="avst-titulo-nome avst-titulo-nenhum"><Ban size={14} aria-hidden /> Sem título</span>
        <span className="avst-titulo-lore">Deixe o trabalho falar por você.</span>
      </button>
      {TITULOS.map((t) => {
        const rar = RARIDADES[t.raridade];
        return (
          <button key={t.id} type="button"
            className={`avst-titulo-card ${config.titulo === t.id ? 'avst-titulo-ativo' : ''}`}
            data-raridade={t.raridade}
            style={{ '--avst-rar': rar.cor } as React.CSSProperties}
            onClick={() => escolher(t.id)}>
            <span className="avst-titulo-nome">{t.nome}</span>
            <span className="avst-titulo-tier">{rar.nome}</span>
            <span className="avst-titulo-lore">{t.lore}</span>
          </button>
        );
      })}
    </div>
  );
}
