// shell/PropriedadesAsset.tsx — regulagens POR ASSET no painel do shell.
// @version 2.0.0  @created 2026-07-31  (C2: §71 sliders · C3: §73/§74 canais)
//
// Duas seções, mesma filosofia (preview §608 + comando com undo):
//   • PROPRIEDADES (§71): sliders das camadas cuja categoria expõe params
//     (engine/params.ts) — arrastar = preview ao vivo; soltar = comando.
//   • CORES DA PEÇA (§73): canais de cor POR CAMADA — recolore UMA peça
//     sem vazar para quem divide a cor global (aura/emblema/moldura usam
//     o 'destaque' global; o canal muda só o da roupa). Canal = família
//     que a arte já usa (usaCores) — nenhuma arte foi tocada. §74: paletas
//     prontas preenchem os canais de uma vez; Original remove o override.
// Valor padrão/igual ao global nunca persiste (validarConfig garante o
// mesmo no backend do config) — publicação byte-estável.
import { useState } from 'react';
import { Paintbrush, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { AvatarConfig, CamadaId, SlotCor } from '../domain/types';
import { CORES_SUGERIDAS, PALETAS_ROUPA, itemPorId, paramsDaCamada } from '../services/AvatarCatalog';
import { flag } from '../nucleo/flags';
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

/** Config com UM canal da camada trocado (null/igual ao global → remove). */
export function comCanal(
  config: AvatarConfig, chave: CamadaId, canal: SlotCor, hex: string | null,
): AvatarConfig {
  const cores = { ...(config.coresCamada ?? {}) };
  const daCamada = { ...(cores[chave] ?? {}) };
  if (!hex || hex.toLowerCase() === config.cores[canal]) delete daCamada[canal];
  else daCamada[canal] = hex.toLowerCase();
  if (Object.keys(daCamada).length) cores[chave] = daCamada;
  else delete cores[chave];
  const { coresCamada: _antigos, ...resto } = config;
  return Object.keys(cores).length ? { ...resto, coresCamada: cores } : resto;
}

/** Config com a paleta §74 aplicada à camada (null = Original: sem override). */
export function comPaleta(
  config: AvatarConfig, chave: CamadaId, canais: Partial<Record<SlotCor, string>> | null,
): AvatarConfig {
  const cores = { ...(config.coresCamada ?? {}) };
  if (canais) cores[chave] = { ...canais };
  else delete cores[chave];
  const { coresCamada: _antigos, ...resto } = config;
  return Object.keys(cores).length ? { ...resto, coresCamada: cores } : resto;
}

/** Camadas equipadas COM propriedades (§71) — na ordem do config. */
function camadasComProps(config: AvatarConfig): CamadaId[] {
  return (Object.keys(config.camadas) as CamadaId[])
    .filter((c) => config.camadas[c] && config.camadas[c] !== 'nenhum' && paramsDaCamada(c, config.camadas[c]))
    // mega 444 (§158, §651): editor do EFEITO só com a flag do lote
    .filter((c) => c !== 'efeito' || flag('as5.editor_efeitos'));
}

/** §73 v1: canais expostos só na ROUPA (infra é genérica — qualquer camada
 *  funciona via config; a UI cresce quando houver mais peças de vestuário).
 *  onda 1413 (§893): CABELO entra quando a peça equipada é premium (a
 *  checagem por item fica no componente — flag + `_px_`). */
const CAMADAS_COM_CANAIS: CamadaId[] = ['roupa', 'cabelo'];
const ROTULO_CANAL: Record<SlotCor, string> = {
  roupa: 'Cor principal', destaque: 'Detalhes', pele: 'Pele', cabelo: 'Cabelo',
};

export function PropriedadesAsset({ config, aoAplicar, aoPrever, soCamadas }: {
  config: AvatarConfig;
  /** commit — entra na pilha de undo */
  aoAplicar: (novo: AvatarConfig) => void;
  /** ao vivo (arrastando/hover) — preview §608; null limpa */
  aoPrever: (novo: AvatarConfig | null) => void;
  /** AS6 §181 (as6.inspector): recorte CONTEXTUAL de camadas — ausente =
   *  todas as equipadas (comportamento anterior byte a byte). */
  soCamadas?: CamadaId[];
}) {
  const [canalAberto, setCanalAberto] = useState<string | null>(null);
  const comProps = camadasComProps(config).filter((c) => !soCamadas || soCamadas.includes(c));
  const comCanais = CAMADAS_COM_CANAIS.filter((c) => !soCamadas || soCamadas.includes(c)).filter((c) => {
    const id = config.camadas[c];
    if (!id || id === 'nenhum' || (itemPorId(id)?.usaCores?.length ?? 0) === 0) return false;
    // onda 1413: cabelo só expõe canais no trilho premium (§651)
    if (c === 'cabelo') return flag('as6.classico_premium') && /_px_/.test(id);
    return true;
  });
  if (!comProps.length && !comCanais.length) return null;

  return (
    <>
      {comProps.length > 0 && (
        <section className="avst5-props" aria-label="Propriedades do item">
          <h4 className="avst5-props-titulo">
            <SlidersHorizontal size={13} aria-hidden /> Propriedades
          </h4>
          {comProps.map((chave) => {
            const id = config.camadas[chave]!;
            const item = itemPorId(id);
            const defs = paramsDaCamada(chave, config.camadas[chave])!;
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
                {chave === 'aura' && (
              <div className="avst5-paletas" role="group" aria-label="Presets rápidos da aura (§150.2)">
                {([['Sutil', { intensidade: 0.4, velocidade: 0.7, raio: 0.85 }],
                   ['Padrão', {}],
                   ['Intensa', { intensidade: 1, velocidade: 1.5, raio: 1.15 }]] as Array<[string, Record<string, number>]>).map(([nome, valores]) => (
                  <button key={nome} type="button" className="avst5-paleta"
                    onClick={() => {
                      let cfg = config;
                      for (const d of defs) cfg = comParam(cfg, chave, d, valores[d.id] ?? d.padrao);
                      aoPrever(null); aoAplicar(cfg);
                    }}>{nome}</button>
                ))}
              </div>
            )}
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
      )}

      {comCanais.map((chave) => {
        const id = config.camadas[chave]!;
        const item = itemPorId(id);
        const canais = (item?.usaCores ?? []).filter((c) => (chave === 'cabelo' ? (c === 'cabelo' || c === 'destaque') : (c === 'roupa' || c === 'destaque')));
        if (!canais.length) return null;
        const override = config.coresCamada?.[chave];
        return (
          <section key={chave} className="avst5-canais" aria-label={`Cores da peça ${item?.nome ?? id}`}>
            <h4 className="avst5-props-titulo">
              <Paintbrush size={13} aria-hidden /> Cores da peça · {item?.nome ?? id}
            </h4>
            {/* onda 1413 (§893): CABELO premium — cor PRINCIPAL global
                (sobrancelhas legadas seguem juntas: usam p.cabelo) +
                "Sincronizar" que remove overrides da peça (zero schema) */}
            {chave === 'cabelo' && (
              <div className="avst5-canal-cores" role="radiogroup" aria-label="Cor principal do cabelo" data-teste="cab-cor-principal">
                {CORES_SUGERIDAS.cabelo.map((hex) => (
                  <button key={hex} type="button" role="radio" aria-checked={config.cores.cabelo === hex}
                    className={`avst-swatch${config.cores.cabelo === hex ? ' avst-swatch-ativo' : ''}`}
                    style={{ background: hex }} title={hex}
                    onMouseEnter={() => aoPrever({ ...config, cores: { ...config.cores, cabelo: hex } })}
                    onMouseLeave={() => aoPrever(null)}
                    onClick={() => { aoPrever(null); aoAplicar({ ...config, cores: { ...config.cores, cabelo: hex } }); }} />
                ))}
                {override && (
                  <button type="button" className="avst5-props-reset" data-teste="cab-sincronizar"
                    title="Sincronizar: a peça volta a seguir a cor principal (e as sobrancelhas)"
                    onClick={() => { aoPrever(null); aoAplicar(comPaleta(config, chave, null)); }}>
                    <RotateCcw size={12} aria-hidden /> Sincronizar
                  </button>
                )}
              </div>
            )}
            {/* §74: paletas prontas + Original — só vestuário */}
            {chave !== 'cabelo' && (
            <div className="avst5-paletas" role="group" aria-label="Paletas de roupa">
              <button type="button" className={`avst5-paleta${!override ? ' avst5-paleta-on' : ''}`}
                title="Original — sem cores próprias da peça"
                onClick={() => { aoPrever(null); aoAplicar(comPaleta(config, chave, null)); }}>
                <span className="avst5-paleta-amostra"
                  style={{ background: `linear-gradient(135deg, ${config.cores.roupa} 50%, ${config.cores.destaque} 50%)` }} aria-hidden />
                Original
              </button>
              {PALETAS_ROUPA.map((pal) => (
                <button key={pal.id} type="button" className="avst5-paleta" title={pal.nome}
                  onMouseEnter={() => aoPrever(comPaleta(config, chave, pal.canais))}
                  onMouseLeave={() => aoPrever(null)}
                  onClick={() => { aoPrever(null); aoAplicar(comPaleta(config, chave, pal.canais)); }}>
                  <span className="avst5-paleta-amostra"
                    style={{ background: `linear-gradient(135deg, ${pal.canais.roupa} 50%, ${pal.canais.destaque} 50%)` }} aria-hidden />
                  {pal.nome}
                </button>
              ))}
            </div>
            )}
            {/* §73.1: um chip por canal declarado pela arte */}
            {canais.map((canal) => {
              const efetiva = override?.[canal] ?? config.cores[canal];
              const idCanal = `${chave}:${canal}`;
              const aberto = canalAberto === idCanal;
              return (
                <div key={canal} className="avst5-canal">
                  <button type="button" className="avst5-canal-chip" aria-expanded={aberto}
                    onClick={() => setCanalAberto(aberto ? null : idCanal)}>
                    <span className="avst-swatch" style={{ background: efetiva }} aria-hidden />
                    <span>{ROTULO_CANAL[canal]}</span>
                    {override?.[canal] && <em>próprio</em>}
                  </button>
                  {aberto && (
                    <div className="avst5-canal-cores" role="radiogroup" aria-label={`Cor de ${ROTULO_CANAL[canal]}`}>
                      {CORES_SUGERIDAS[canal].map((hex) => (
                        <button key={hex} type="button" role="radio" aria-checked={efetiva === hex}
                          className={`avst-swatch${efetiva === hex ? ' avst-swatch-ativo' : ''}`}
                          style={{ background: hex }} title={hex}
                          onMouseEnter={() => aoPrever(comCanal(config, chave, canal, hex))}
                          onMouseLeave={() => aoPrever(null)}
                          onClick={() => { aoPrever(null); aoAplicar(comCanal(config, chave, canal, hex)); }} />
                      ))}
                      <label className="avst-swatch avst-swatch-livre" title="Cor personalizada">
                        <input type="color" value={efetiva}
                          onChange={(e) => aoPrever(comCanal(config, chave, canal, e.target.value))}
                          onBlur={(e) => { aoPrever(null); aoAplicar(comCanal(config, chave, canal, e.target.value)); }}
                          aria-label={`Cor personalizada de ${ROTULO_CANAL[canal]}`} />
                        <span aria-hidden>+</span>
                      </label>
                      {override?.[canal] && (
                        <button type="button" className="avst5-props-reset" title="Voltar à cor global"
                          onClick={() => { aoPrever(null); aoAplicar(comCanal(config, chave, canal, null)); }}>
                          <RotateCcw size={12} aria-hidden /> Restaurar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
