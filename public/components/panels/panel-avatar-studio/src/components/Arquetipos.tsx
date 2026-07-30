// components/Arquetipos.tsx — ARQUÉTIPOS (Expansão §1): a primeira decisão.
// @version 1.0.0  @created 2026-07-30
//
// Kits de identidade completos (base + camadas + cores + título sugerido),
// com preview REAL renderizado pelo motor — nunca uma imagem estática.
import { useMemo } from 'react';
import { Fingerprint } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { ARQUETIPOS, RARIDADES, aplicarArquetipo, tituloPorId } from '../services/AvatarCatalog';
import { AvatarSvg } from './AvatarSvg';

export function Arquetipos({ config, aoAplicar }: {
  config: AvatarConfig;
  aoAplicar: (novo: AvatarConfig) => void;
}) {
  // previews validados uma única vez por render (mesma pele do usuário)
  const previews = useMemo(
    () => ARQUETIPOS.map((a) => aplicarArquetipo(a, config)),
    [config],
  );

  return (
    <div className="avst-presets">
      <p className="avst-conquistas-resumo">
        <Fingerprint size={13} aria-hidden /> Escolha quem você é — o kit aplica visual, cores e título de uma vez. Depois refine categoria por categoria.
      </p>
      {ARQUETIPOS.map((a, i) => {
        const rar = RARIDADES[a.raridade];
        const titulo = tituloPorId(a.titulo);
        return (
          <button key={a.id} type="button" className="avst-preset"
            data-raridade={a.raridade}
            style={{ '--avst-rar': rar.cor } as React.CSSProperties}
            onClick={() => aoAplicar(previews[i])}>
            <span className="avst-preset-thumb">
              <AvatarSvg config={previews[i]} estatico uid={`arq-${a.id}`} />
            </span>
            <span className="avst-preset-info">
              <strong>{a.nome}</strong>
              <em style={{ color: rar.cor }}>{rar.nome}{titulo ? ` · ${titulo.nome}` : ''}</em>
              <span className="avst-preset-desc">{a.papel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
