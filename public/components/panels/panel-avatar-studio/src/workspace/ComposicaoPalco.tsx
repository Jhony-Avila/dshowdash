// workspace/ComposicaoPalco.tsx — CONTROLES DE COMPOSIÇÃO do palco 2D
// (§160/§161/§162/§163/§164/§165/§590). @version 1.0.0
// @created 2026-08-09  (lote 911–920, decisão #93 — componentização
// fase 3b do ShellStudio; DOM byte a byte com os blocos inline)
//
// Cluster completo dos radiogroups do rodapé do palco: temas de acento,
// cenários, horas, luzes (+ Auto §165 + intensidade §164.3), propriedades
// do cenário §161 (colapsável — estado LOCAL daqui) e climas §163 com a
// sugestão Clima→Luz (§179, memo LOCAL: só depende de clima+luz).
// Estados compartilhados (fundo/hora/luz/clima/propsCen/luzAuto/luzInt)
// seguem no PAI: o viewport e a PaletaComandos também leem.
import { useEffect, useMemo, useState } from 'react';
import { Clapperboard, X } from 'lucide-react';
import {
  AMBIENTES_CENARIO, CENARIO_NEUTRO, CLIMAS_PALCO, COR_AMBIENTE,
  FUNDOS_CLASSICOS, FUNDOS_PALCO, HORAS_CLASSICAS, HORAS_PALCO, IDLES_2D,
  LUZES_PALCO, ROTULO_CLIMA, ROTULO_FUNDO, ROTULO_HORA, ROTULO_IDLE,
  ROTULO_LUZ, TEMAS,
} from './palco';
import type {
  ClimaPalco, FundoPalco, HoraPalco, LuzPalco, PropsCenario, TemaId,
} from './palco';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';
import { telemetria } from '../services/Telemetria';

export interface PropsComposicaoPalco {
  tema: TemaId;
  trocarTema: (id: TemaId) => void;
  fundo: FundoPalco;
  trocarFundo: (f: FundoPalco) => void;
  hora: HoraPalco;
  trocarHora: (h: HoraPalco) => void;
  luz: LuzPalco;
  trocarLuz: (l: LuzPalco) => void;
  clima: ClimaPalco;
  trocarClima: (c: ClimaPalco) => void;
  luzAuto: boolean;
  mudarLuzAuto: (v: boolean) => void;
  luzInt: number;
  mudarLuzInt: (v: number) => void;
  propsCen: PropsCenario;
  mudarPropsCen: (patch: Partial<PropsCenario>) => void;
  dispararEntrada: (id: 'materializar' | 'teleporte' | 'ascender') => void;
  palcoV2: boolean;
  palco3d: boolean;
  sensorial: boolean;
  controlesTravados: boolean;
  movReduzido: boolean;
  /** decisão #112 (as6.dock_inferior): TOOLBAR recolhível — os mesmos
   *  controles saem de cima do avatar e vivem num painel sob demanda. */
  compacto?: boolean;
}

export function ComposicaoPalco(props: PropsComposicaoPalco) {
  const { tema, trocarTema, fundo, trocarFundo, hora, trocarHora, luz, trocarLuz,
    clima, trocarClima, luzAuto, mudarLuzAuto, luzInt, mudarLuzInt,
    propsCen, mudarPropsCen, dispararEntrada,
    palcoV2, palco3d, sensorial, controlesTravados, movReduzido,
    compacto = false } = props;
  // megas 233–234 (§161): painel colapsável — estado local do cluster
  const [cenAberto, setCenAberto] = useState(false);
  // #112: no modo compacto tudo fica atrás de UM botão "Cenário"
  const [toolAberta, setToolAberta] = useState(false);
  // lote 1231-1240 (#126, a11y §297): Escape fecha a caixa do Cenário
  useEffect(() => {
    if (!toolAberta) return undefined;
    const ao = (e: KeyboardEvent) => { if (e.key === 'Escape') setToolAberta(false); };
    window.addEventListener('keydown', ao);
    return () => window.removeEventListener('keydown', ao);
  }, [toolAberta]);
  // lote 205 (§179): ponte Clima→Iluminação (chuva pede luz fria; névoa, dramática)
  const sugestaoLuz = useMemo(() => {
    if (clima === 'chuva' && luz !== 'fria') return { luzSug: 'fria' as LuzPalco, motivo: 'a chuva' };
    if (clima === 'nevoa' && luz !== 'dramatica') return { luzSug: 'dramatica' as LuzPalco, motivo: 'a névoa' };
    return null;
  }, [clima, luz]);
  const linhas = (
    <>
      <div className="avst5-temas" role="radiogroup" aria-label="Tema do estúdio (§590)">
        {TEMAS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={tema === x.id}
            className={`avst5-tema-bolinha${tema === x.id ? ' avst5-tema-on' : ''}`}
            title={`Tema ${x.nome}`} aria-label={`Tema ${x.nome}`}
            style={{ background: x.cor }}
            onClick={() => trocarTema(x.id)} />
        ))}
      </div>
      <div className="avst5-fundos" role="radiogroup" aria-label="Cenário do palco (§160)" data-teste="cenarios-2d">
        {(palcoV2 ? FUNDOS_PALCO : FUNDOS_CLASSICOS).map((f) => (
          <button key={f} type="button" role="radio" aria-checked={fundo === f}
            className={fundo === f ? 'avst5-fundo-on' : ''}
            disabled={controlesTravados}
            onClick={() => trocarFundo(f)}>{ROTULO_FUNDO[f]}</button>
        ))}
      </div>
      <div className="avst5-fundos avst5-horas" role="radiogroup" aria-label="Hora do dia (§162)" data-teste="horas-2d">
        {(palcoV2 ? HORAS_PALCO : HORAS_CLASSICAS).map((h) => (
          <button key={h} type="button" role="radio" aria-checked={hora === h}
            className={hora === h ? 'avst5-fundo-on' : ''}
            disabled={controlesTravados}
            onClick={() => trocarHora(h)}>{t(ROTULO_HORA[h])}</button>
        ))}
      </div>
      <div className="avst5-fundos avst5-luzes" role="radiogroup" aria-label="Iluminação (§164)" data-teste="luzes-2d">
        {LUZES_PALCO.map((l) => (
          <button key={l} type="button" role="radio" aria-checked={luz === l}
            className={luz === l ? 'avst5-fundo-on' : ''}
            disabled={controlesTravados}
            onClick={() => trocarLuz(l)}>{t(ROTULO_LUZ[l])}</button>
        ))}
        {/* mega 471-473 (§165, flag as5.luz_contextual): AUTO */}
        {flag('as5.luz_contextual') && (
          <button type="button" role="radio" aria-checked={luzAuto}
            className={luzAuto ? 'avst5-fundo-on' : ''}
            data-teste="luz-auto" disabled={controlesTravados}
            title="A luz segue a hora do palco (§165): tarde=quente, noite=dramática, madrugada=fria"
            onClick={() => mudarLuzAuto(!luzAuto)}>{t('Auto')}</button>
        )}
        {/* mega 325 (§164.3, flag as5.palco_sensorial): INTENSIDADE —
            modo simples §164.4 = deixar em 1 (zero mudança visual) */}
        {sensorial && !palco3d && (
          <label className="avst5-p3d-slider" title="Intensidade da luz do palco (§164.3)">
            <input type="range" min="0.7" max="1.3" step="0.05" value={luzInt}
              aria-label="Intensidade da luz" data-teste="luz-intensidade"
              disabled={controlesTravados}
              onChange={(e) => mudarLuzInt(Number(e.target.value))} />
          </label>
        )}
      </div>
      {/* megas 233–234 (§161): propriedades do cenário — colapsável */}
      {palcoV2 && !palco3d && (
        <div className="avst5-fundos avst5-cenprops" data-teste="cenario-props">
          <button type="button" aria-pressed={cenAberto} aria-expanded={cenAberto}
            className={cenAberto ? 'avst5-fundo-on' : ''} data-teste="cenario-abrir"
            title="Propriedades do cenário (§161)"
            onClick={() => setCenAberto((v) => !v)}>✧ Cenário</button>
          {cenAberto && (<>
            <label className="avst5-cen-slider">Luz
              <input type="range" min={0.6} max={1.4} step={0.05} value={propsCen.luz}
                aria-label="Intensidade de luz do cenário (§161)" data-teste="cen-luz"
                onChange={(e) => mudarPropsCen({ luz: Number(e.target.value) })} />
            </label>
            <label className="avst5-cen-slider">Prof.
              <input type="range" min={0} max={1} step={0.05} value={propsCen.profundidade}
                aria-label="Profundidade do cenário (§161)" data-teste="cen-prof"
                onChange={(e) => mudarPropsCen({ profundidade: Number(e.target.value) })} />
            </label>
            {AMBIENTES_CENARIO.map((am) => (
              <button key={am} type="button" role="radio" aria-checked={propsCen.ambiente === am}
                className={propsCen.ambiente === am ? 'avst5-fundo-on' : ''}
                data-teste={`cen-amb-${am}`}
                title={am === 'nenhuma' ? 'Sem cor ambiente' : `Cor ambiente ${am} (§161)`}
                style={am !== 'nenhuma' ? { color: COR_AMBIENTE[am] } : undefined}
                onClick={() => mudarPropsCen({ ambiente: am })}>{am === 'nenhuma' ? 'Sem cor' : '●'}</button>
            ))}
            <button type="button" aria-pressed={propsCen.vivo}
              className={propsCen.vivo ? 'avst5-fundo-on' : ''} data-teste="cen-vivo"
              title={movReduzido ? 'Indisponível com redução de movimento (§297)' : 'Cenário vivo — movimento sutil (§161)'}
              disabled={movReduzido}
              onClick={() => mudarPropsCen({ vivo: !propsCen.vivo })}>Vivo</button>
            {/* mega 257 (§119): idle 2D do avatar */}
            {flag('as5.criacao_avancada') && IDLES_2D.map((idl) => (
              <button key={idl} type="button" role="radio" aria-checked={propsCen.idle === idl}
                className={propsCen.idle === idl ? 'avst5-fundo-on' : ''}
                data-teste={`idle-${idl}`}
                title={movReduzido ? 'Indisponível com redução de movimento (§297)' : `Idle ${ROTULO_IDLE[idl]} (§119)`}
                disabled={movReduzido && idl !== 'nenhum'}
                onClick={() => mudarPropsCen({ idle: idl })}>{ROTULO_IDLE[idl]}</button>
            ))}
            {/* megas 578–579 (§157.4, flag as5.palco_v3): transição de
                ENTRADA one-shot — apresentação pura, nada persiste */}
            {flag('as5.palco_v3') && ([['materializar', 'Materializar'], ['teleporte', 'Teleporte'], ['ascender', 'Ascender']] as const).map(([id2, nome]) => (
              <button key={id2} type="button" data-teste={`entrada-${id2}`}
                title={movReduzido ? 'Indisponível com redução de movimento (§297)' : `Entrada ${nome} (§157.4)`}
                disabled={movReduzido}
                onClick={() => dispararEntrada(id2)}>{t(nome)}</button>
            ))}
            <button type="button" data-teste="cen-zerar"
              title="Voltar o cenário ao padrão"
              onClick={() => mudarPropsCen({ ...CENARIO_NEUTRO })}>Zerar</button>
          </>)}
        </div>
      )}
      {/* clima é do palco 2D — no 3D o cenário próprio manda (evita
          sobrepor os chips do p3d na mesma faixa do viewport) */}
      {!palco3d && (
      <div className="avst5-fundos avst5-climas" role="radiogroup" aria-label="Clima (§163)" data-teste="climas-2d">
        {CLIMAS_PALCO.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={clima === c}
            className={clima === c ? 'avst5-fundo-on' : ''}
            disabled={controlesTravados}
            onClick={() => trocarClima(c)}>{ROTULO_CLIMA[c]}</button>
        ))}
        {sugestaoLuz && (
          <button type="button" className="avst5-sugestao-cenario" data-teste="sugestao-luz"
            title={`§179: ${sugestaoLuz.motivo} combina com a luz ${ROTULO_LUZ[sugestaoLuz.luzSug]}`}
            onClick={() => { trocarLuz(sugestaoLuz.luzSug); telemetria('palco_sugestao_luz', { luz: sugestaoLuz.luzSug }); }}>
            ✦ Luz {ROTULO_LUZ[sugestaoLuz.luzSug]} combina com {sugestaoLuz.motivo}</button>
        )}
      </div>
      )}
    </>
  );
  if (!compacto) return linhas;
  /* decisão #112: um botão só ("Cenário") no canto — o cluster inteiro
     abre num painel flutuante e NUNCA cobre o avatar por padrão */
  return (
    <div className="avst6-cen-tool" data-teste="cen-tool">
      <button type="button" className="avst6-cen-abrir" data-teste="cen-tool-abrir"
        aria-expanded={toolAberta} title={t('Cenário, luz e clima')}
        onClick={() => setToolAberta((v) => !v)}>
        {toolAberta ? <X size={13} aria-hidden /> : <Clapperboard size={13} aria-hidden />} {t('Cenário')}
      </button>
      {toolAberta && (
        <div className="avst6-cen-caixa" data-teste="cen-caixa" role="group" aria-label={t('Cenário, luz e clima')}>
          {linhas}
        </div>
      )}
    </div>
  );
}
