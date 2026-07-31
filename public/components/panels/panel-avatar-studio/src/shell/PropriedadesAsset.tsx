// shell/PropriedadesAsset.tsx — sliders de PROPRIEDADES por asset (§71, F3 C2).
// @version 1.0.0  @created 2026-07-31
//
// Lista cada camada EQUIPADA cuja categoria expõe propriedades (engine/
// params.ts) e monta um slider por propriedade. Interação em duas fases,
// como o hover preview (§64):
//   • arrastar → aoPrever (store.visualizar — o palco reage AO VIVO e o
//     draft fica intacto; soltar fora não vira alteração);
//   • soltar (pointerup/keyup) → aoAplicar (vira COMANDO com undo).
// Valor padrão remove a entrada do config (validarConfig faz o mesmo) —
// "Restaurar" é só aplicar o config sem a camada em params.
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { AvatarConfig, CamadaId } from '../domain/types';
import { itemPorId, paramsDaCamada } from '../services/AvatarCatalog';
import type { ParamDef } from '../services/AvatarCatalog';

/** Config com UMA propriedade regulada (imutável; padrão → remove entrada). */
export function comParam(
  config: AvatarConfig, chave: CamadaId, def: ParamDef, valor: number,
): AvatarConfig {
  const params = { ...(config.params ?? {}) };
  const daCamada = { ...(params[chave] ?? {}) };
  if (valor === def.padrao) delete daCamada[def.id];
  else daCamada[def.id] = Math.round(valor * 100) / 100;
  if (Object.keys(daCamada).length) params[chave] = daCamada;
  else delete params[chave];
  const { params: _antigos, ...resto } = config;
  return Object.keys(params).length ? { ...resto, params } : resto;
}

/** Camadas equipadas COM propriedades — na ordem do config. */
function camadasComProps(config: AvatarConfig): CamadaId[] {
  return (Object.keys(config.camadas) as CamadaId[])
    .filter((c) => config.camadas[c] && config.camadas[c] !== 'nenhum' && paramsDaCamada(c));
}

export function PropriedadesAsset({ config, aoAplicar, aoPrever }: {
  config: AvatarConfig;
  /** commit (soltar o slider) — entra na pilha de undo */
  aoAplicar: (novo: AvatarConfig) => void;
  /** ao vivo (arrastando) — preview §608; null limpa */
  aoPrever: (novo: AvatarConfig | null) => void;
}) {
  const camadas = camadasComProps(config);
  if (!camadas.length) return null;

  return (
    <section className="avst5-props" aria-label="Propriedades do item">
      <h4 className="avst5-props-titulo">
        <SlidersHorizontal size={13} aria-hidden /> Propriedades
      </h4>
      {camadas.map((chave) => {
        const id = config.camadas[chave]!;
        const item = itemPorId(id);
        const defs = paramsDaCamada(chave)!;
        const regulada = !!config.params?.[chave];
        return (
          <div key={chave} className="avst5-props-item">
            <div className="avst5-props-cab">
              <strong>{item?.nome ?? id}</strong>
              {regulada && (
                <button type="button" className="avst5-props-reset" title="Restaurar padrão"
                  onClick={() => {
                    const params = { ...(config.params ?? {}) };
                    delete params[chave];
                    const { params: _p, ...resto } = config;
                    aoPrever(null);
                    aoAplicar(Object.keys(params).length ? { ...resto, params } : resto);
                  }}>
                  <RotateCcw size={12} aria-hidden /> Restaurar
                </button>
              )}
            </div>
            {defs.map((def) => {
              const valor = config.params?.[chave]?.[def.id] ?? def.padrao;
              return (
                <label key={def.id} className="avst5-slider">
                  <span className="avst5-slider-nome">{def.nome}</span>
                  <input type="range" min={def.min} max={def.max} step={def.passo}
                    value={valor} aria-label={`${def.nome} de ${item?.nome ?? id}`}
                    onChange={(e) => aoPrever(comParam(config, chave, def, e.target.valueAsNumber))}
                    onPointerUp={(e) => {
                      aoPrever(null);
                      aoAplicar(comParam(config, chave, def, (e.target as HTMLInputElement).valueAsNumber));
                    }}
                    onKeyUp={(e) => {
                      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
                      aoPrever(null);
                      aoAplicar(comParam(config, chave, def, (e.target as HTMLInputElement).valueAsNumber));
                    }} />
                  <span className="avst5-slider-valor">{Math.round(valor * 100)}%</span>
                </label>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
