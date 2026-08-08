// components/Cores.tsx — seletor de cores por slot (pele/cabelo/roupa/destaque).
// @version 1.0.0  @created 2026-07-29
//
// Mostra apenas os slots que os itens EQUIPADOS realmente usam (briefing §11):
// trocar para um androide sem cabelo esconde o slot 'cabelo' sozinho.
import { useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import type { AvatarConfig, SlotCor } from '../domain/types';
import { CORES_SUGERIDAS, itemPorId } from '../services/AvatarCatalog';
import { harmoniasDe, hexParaHsl, hslParaHex } from '../engine/cor-hsl';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';

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
  // AS6 §206–§212 (as6.color_studio): slot EXPANDIDO com HSL + harmonias
  const [estudio, setEstudio] = useState<SlotCor | null>(null);
  const temEstudio = flag('as6.color_studio');
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
            {/* AS6 §206 (as6.color_studio): abre o estúdio HSL do slot */}
            {temEstudio && (
              <button type="button" className="avst-ft-chip avst6-cs-abrir"
                aria-expanded={estudio === slot} data-teste={`cs-abrir-${slot}`}
                title="Color Studio — ajuste fino HSL e harmonias (§206)"
                onClick={() => setEstudio((v) => (v === slot ? null : slot))}>HSL</button>
            )}
          </div>
          {temEstudio && estudio === slot && (() => {
            const hsl = hexParaHsl(config.cores[slot]);
            const mexer = (eixo: 'h' | 's' | 'l', valor: number) =>
              trocar(slot, hslParaHex({ ...hsl, [eixo]: valor }));
            return (
              <div className="avst6-cs" data-teste={`cs-painel-${slot}`}>
                {([['h', 'Matiz', 360], ['s', 'Saturação', 100], ['l', 'Luminosidade', 100]] as const).map(([eixo, nome, max]) => (
                  <label key={eixo} className="avst6-cs-linha">
                    <span>{t(nome)}</span>
                    <input type="range" min={0} max={max} value={hsl[eixo]}
                      data-teste={`cs-${eixo}-${slot}`} aria-label={`${t(nome)} de ${NOMES[slot]}`}
                      onChange={(e) => mexer(eixo, Number(e.target.value))} />
                    <output>{hsl[eixo]}</output>
                  </label>
                ))}
                <div className="avst6-cs-harmonias" role="group" aria-label={t('Harmonias')}>
                  {harmoniasDe(config.cores[slot]).map((h) => (
                    <button key={h.id} type="button" className="avst-swatch"
                      style={{ background: h.hex }} title={`${t(h.nome)} · ${h.hex}`}
                      data-teste={`cs-harmonia-${h.id}-${slot}`}
                      onClick={() => trocar(slot, h.hex)} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ))}
    </section>
  );
}
