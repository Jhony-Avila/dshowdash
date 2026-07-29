// components/Presets.tsx — galeria de presets curados (briefing §12).
// @version 1.0.0  @created 2026-07-29
import { useMemo } from 'react';
import type { AvatarConfig } from '../domain/types';
import { PRESETS, RARIDADES, configDePreset } from '../services/AvatarCatalog';
import { AvatarSvg } from './AvatarSvg';

export function Presets({ aoAplicar }: { aoAplicar: (config: AvatarConfig) => void }) {
  const prontos = useMemo(
    () => PRESETS.map((p) => ({ preset: p, config: configDePreset(p) })),
    [],
  );

  return (
    <div className="avst-presets" role="list" aria-label="Presets prontos">
      {prontos.map(({ preset, config }) => {
        const rar = RARIDADES[preset.raridade];
        return (
          <button key={preset.id} type="button" role="listitem"
            className="avst-preset"
            style={{ '--avst-rar': rar.cor } as React.CSSProperties}
            title={preset.descricao}
            onClick={() => aoAplicar(config)}>
            <span className="avst-preset-thumb">
              <AvatarSvg config={config} estatico uid={`pr-${preset.id}`} />
            </span>
            <span className="avst-preset-info">
              <strong>{preset.nome}</strong>
              <em style={{ color: rar.cor }}>{rar.nome}</em>
              <span className="avst-preset-desc">{preset.descricao}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
