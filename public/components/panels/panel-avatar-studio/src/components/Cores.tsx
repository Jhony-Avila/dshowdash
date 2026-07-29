// components/Cores.tsx — seletor de cores por slot (pele/cabelo/roupa/destaque).
// @version 1.0.0  @created 2026-07-29
//
// Mostra apenas os slots que os itens EQUIPADOS realmente usam (briefing §11):
// trocar para um androide sem cabelo esconde o slot 'cabelo' sozinho.
import { useMemo } from 'react';
import { Palette } from 'lucide-react';
import type { AvatarConfig, SlotCor } from '../domain/types';
import { CORES_SUGERIDAS, itemPorId } from '../services/AvatarCatalog';

const NOMES: Record<SlotCor, string> = {
  pele: 'Pele', cabelo: 'Cabelo', roupa: 'Roupa', destaque: 'Destaque',
};

/** Slots usados pelo conjunto equipado (base + camadas). */
export function slotsAtivos(config: AvatarConfig): SlotCor[] {
  const ids = [config.base, ...Object.values(config.camadas)];
  const usados = new Set<SlotCor>();
  for (const id of ids) {
    const item = id ? itemPorId(id) : undefined;
    item?.usaCores?.forEach((s) => usados.add(s));
  }
  const ordem: SlotCor[] = ['pele', 'cabelo', 'roupa', 'destaque'];
  return ordem.filter((s) => usados.has(s));
}

export function Cores({ config, aoMudar }: {
  config: AvatarConfig;
  aoMudar: (novo: AvatarConfig) => void;
}) {
  const slots = useMemo(() => slotsAtivos(config), [config]);
  if (slots.length === 0) return null;

  const trocar = (slot: SlotCor, hex: string) =>
    aoMudar({ ...config, cores: { ...config.cores, [slot]: hex } });

  return (
    <section className="avst-cores" aria-label="Cores do avatar">
      <h3 className="avst-cores-titulo"><Palette size={14} aria-hidden /> Cores</h3>
      {slots.map((slot) => (
        <div key={slot} className="avst-cores-slot">
          <span className="avst-cores-nome">{NOMES[slot]}</span>
          <div className="avst-cores-lista" role="radiogroup" aria-label={`Cor de ${NOMES[slot]}`}>
            {CORES_SUGERIDAS[slot].map((hex) => (
              <button key={hex} type="button" role="radio"
                aria-checked={config.cores[slot] === hex}
                className={`avst-swatch ${config.cores[slot] === hex ? 'avst-swatch-ativo' : ''}`}
                style={{ background: hex }}
                title={hex}
                onClick={() => trocar(slot, hex)} />
            ))}
            <label className="avst-swatch avst-swatch-livre" title="Cor personalizada">
              <input type="color" value={config.cores[slot]}
                onChange={(e) => trocar(slot, e.target.value)}
                aria-label={`Cor personalizada de ${NOMES[slot]}`} />
              <span aria-hidden>+</span>
            </label>
          </div>
        </div>
      ))}
    </section>
  );
}
