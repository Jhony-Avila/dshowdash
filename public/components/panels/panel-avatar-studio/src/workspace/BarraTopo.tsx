// workspace/BarraTopo.tsx — BARRA SUPERIOR do workspace (AS6 L2 §39,
// lote 771–780 — decisão #79, fase 1 da componentização).
// @version 1.0.0  @created 2026-08-08
//
// Extração VERBATIM do <header> do ShellStudio (§626): o DOM emitido é
// byte a byte o mesmo — fronteira de componente React não muda markup.
// Estados que só o header usa (menu do aleatório §90, preferências de
// som §178.2) MORAM aqui agora; todo o resto chega por props. Módulos
// puros (t/flag/idioma/sons) são importados direto — prop só para o que
// é ESTADO do estúdio.
import { useCallback, useState } from 'react';
import { ArrowUp, Boxes, Clapperboard, Dices, Flag, Focus, Gauge, GitBranch, History, Lightbulb, Play, Redo2, Undo2, Volume2, VolumeX } from 'lucide-react';
import type { ModoAleatorio } from '../services/AvatarCatalog';
import { definirPrefSom, prefsSom, tocarPreview } from '../services/Som';
import type { AvatarStore } from '../nucleo/estado';
import { flag } from '../nucleo/flags';
import { PERFIS_QUALIDADE, definirPerfil, perfilGuardado } from '../services/QualityManager'; // lote 1021-1030 (#104)
import { definirIdioma, idiomaAtual, t } from '../nucleo/i18n';

export type ModoShell = 'edicao' | 'foco' | 'studio';

export interface PropsBarraTopo {
  modo: ModoShell;
  setModo: React.Dispatch<React.SetStateAction<ModoShell>>;
  apresentando: boolean;
  /** clique em Apresentar (o pai decide showcase 2D §174 × sinal 3D) */
  aoApresentar: () => void;
  flagPalco3d: boolean;
  palco3d: boolean;
  aoAlternar3d: () => void;
  prefetch3d: () => void;
  /** aleatório inteligente §90 (o menu fecha AQUI; a lógica é do pai) */
  rodarAleatorio: (modo: ModoAleatorio) => void;
  somLigado: boolean;
  alternarSom: () => void;
  abrirConsultor: () => void;
  abrirMissoes: () => void;
  abrirEvolucao: () => void;
  abrirTimeline: () => void;
  abrirVersoes: () => void;
  abrirTour: () => void;
  store: AvatarStore;
  aoSairDoShell: () => void;
}

export function BarraTopo(props: PropsBarraTopo) {
  const { modo, setModo, apresentando, aoApresentar, flagPalco3d, palco3d,
    aoAlternar3d, prefetch3d, rodarAleatorio, somLigado, alternarSom,
    abrirConsultor, abrirMissoes, abrirEvolucao, abrirTimeline,
    abrirVersoes, abrirTour, store, aoSairDoShell } = props;
  const [menuAleatorio, setMenuAleatorio] = useState(false);
  // megas 574–577 (§178.2, flag as5.palco_v3): preferências de som por
  // CATEGORIA — volume geral + efeitos/ambiente/celebrações + preview
  const [somPrefsAberto, setSomPrefsAberto] = useState(false);
  const [somPrefs, setSomPrefs] = useState(prefsSom);
  const mudarPrefSom = useCallback((patch: Parameters<typeof definirPrefSom>[0]) => {
    definirPrefSom(patch);
    setSomPrefs(prefsSom());
  }, []);
  const escolherAleatorio = (modoAlea: ModoAleatorio) => {
    setMenuAleatorio(false);
    rodarAleatorio(modoAlea);
  };
  return (
    <header className="avst5-header">
      <strong>Avatar Studio</strong>
      <span className="avst5-header-sub">5.0 · novo estúdio (prévia)</span>
      <div className="avst5-header-acoes">
        <div className="avst5-alea">
          <button type="button" className="avst-botao" title="Aleatório inteligente (§90)"
            aria-expanded={menuAleatorio} aria-haspopup="menu"
            onClick={() => setMenuAleatorio((v) => !v)}>
            <Dices size={14} aria-hidden /> Aleatório
          </button>
          {menuAleatorio && (<>
            <button type="button" className="avst-fpop-fundo" aria-label="Fechar menu"
              onClick={() => setMenuAleatorio(false)} />
            <div className="avst5-alea-menu" role="menu" aria-label="Modos de aleatório">
              <button type="button" role="menuitem" onClick={() => escolherAleatorio('completo')}>Completo <small>respeita bloqueios</small></button>
              <button type="button" role="menuitem" onClick={() => escolherAleatorio('categoria')}>Só esta categoria</button>
              <button type="button" role="menuitem" onClick={() => escolherAleatorio('cores')}>Só cores</button>
              <button type="button" role="menuitem" onClick={() => escolherAleatorio('favoritos')}>Dos favoritos</button>
            </div>
          </>)}
        </div>
        <button type="button" className="avst-botao" title={`${t('Modo foco')} (F)`}
          aria-pressed={modo === 'foco'}
          onClick={() => setModo((m) => (m === 'foco' ? 'edicao' : 'foco'))}>
          <Focus size={14} aria-hidden /></button>
        <button type="button" className="avst-botao" title={t('Modo Studio (apresentação)')}
          aria-pressed={modo === 'studio'}
          onClick={() => setModo((m) => (m === 'studio' ? 'edicao' : 'studio'))}>
          <Clapperboard size={14} aria-hidden /></button>
        <button type="button" className="avst-botao" title="Showcase — apresentação cinematográfica (§174)"
          data-teste="showcase" disabled={apresentando}
          onClick={aoApresentar}>
          <Play size={14} aria-hidden /> {t('Apresentar')}</button>
        {flagPalco3d && (
          <button type="button" className="avst-botao" title={t('Prévia 3D (personagens curados)')}
            aria-pressed={palco3d} data-teste="botao-3d"
            onMouseEnter={prefetch3d} onFocus={prefetch3d}
            onClick={aoAlternar3d}>
            <Boxes size={14} aria-hidden /> 3D</button>
        )}
        {flag('as5.consultor') && (
          <button type="button" className="avst-botao" title="Consultor de estilo — sugestões por regras (§232)"
            data-teste="consultor-abrir" onClick={abrirConsultor}>
            <Lightbulb size={14} aria-hidden /></button>
        )}
        <button type="button" className="avst-botao" title="Missões e desafio da semana (§250)"
          data-teste="missoes-abrir" onClick={abrirMissoes}>
          <Flag size={14} aria-hidden /></button>
        <button type="button" className="avst-botao" title="Evolução do avatar — linha do tempo (§241)"
          data-teste="evolucao-abrir" onClick={abrirEvolucao}>
          <GitBranch size={14} aria-hidden /></button>
        {flag('as5.timeline_shell') && (
          <button type="button" className="avst-botao" title="Linha do tempo — sua jornada (§220)"
            data-teste="timeline-abrir" onClick={abrirTimeline}>
            <History size={14} aria-hidden /></button>
        )}
        <button type="button" className="avst-botao" title="Versões do avatar no espelho (§619)"
          data-teste="versoes-abrir" onClick={abrirVersoes}>
          <ArrowUp size={14} aria-hidden style={{ transform: 'rotate(180deg)' }} /></button>
        {/* mega 415 (§296, flag as5.i18n): seletor de idioma */}
        {flag('as5.i18n') && (
          <button type="button" className="avst-botao" data-teste="idioma-toggle"
            title={idiomaAtual() === 'pt' ? 'Switch interface to English (§296)' : 'Voltar a interface para português (§296)'}
            onClick={() => definirIdioma(idiomaAtual() === 'pt' ? 'en' : 'pt')}>
            {idiomaAtual() === 'pt' ? 'EN' : 'PT'}
          </button>
        )}
        {/* lote 1021-1030 (#104, as6.quality): perfil de QUALIDADE central
            (Auto→Eco→Equilibrado→Alto) — o shell/3D/partículas consultam */}
        {flag('as6.quality') && (() => {
          const atual = perfilGuardado();
          const i = PERFIS_QUALIDADE.findIndex((x) => x.id === atual);
          const proximo = PERFIS_QUALIDADE[(i + 1) % PERFIS_QUALIDADE.length];
          const nome = PERFIS_QUALIDADE[i]?.nome ?? 'Auto';
          return (
            <button type="button" className="avst-botao" data-teste="qualidade-perfil"
              title={`Qualidade: ${nome} — clicar muda para ${proximo.nome} (AS6 Parte 9)`}
              onClick={() => definirPerfil(proximo.id)}>
              <Gauge size={14} aria-hidden />
              <span className="avst6-qual-rotulo" aria-hidden>{nome.slice(0, 3)}</span>
            </button>
          );
        })()}
        <button type="button" className="avst-botao" title={somLigado ? 'Silenciar sons' : 'Ligar sons'}
          aria-pressed={somLigado} data-teste="som-toggle" onClick={alternarSom}>
          {somLigado ? <Volume2 size={14} aria-hidden /> : <VolumeX size={14} aria-hidden />}</button>
        {/* megas 574–577 (§178.2, flag as5.palco_v3): prefs por categoria */}
        {flag('as5.palco_v3') && somLigado && (
          <span style={{ position: 'relative' }}>
            <button type="button" className="avst-botao" data-teste="som-prefs-abrir"
              aria-expanded={somPrefsAberto} title="Preferências de som por categoria (§178.2)"
              onClick={() => setSomPrefsAberto((v) => !v)}>♪</button>
            {somPrefsAberto && (
              <div className="avst5-som-prefs" data-teste="som-prefs" role="group" aria-label="Preferências de som (§178.2)">
                <label className="avst5-som-linha">
                  <span>{t('Volume geral')}</span>
                  <input type="range" min={0} max={1} step={0.05} value={somPrefs.volume}
                    data-teste="som-volume" aria-label={t('Volume geral')}
                    onChange={(e) => mudarPrefSom({ volume: Number(e.target.value) })} />
                </label>
                {([['efeitos', 'Efeitos'], ['ambiente', 'Ambiente'], ['celebracoes', 'Celebrações']] as const).map(([cat, nome]) => (
                  <button key={cat} type="button" className="avst-ft-chip"
                    aria-pressed={somPrefs[cat]} data-teste={`som-cat-${cat}`}
                    onClick={() => mudarPrefSom({ [cat]: !somPrefs[cat] })}>
                    {somPrefs[cat] ? '✓ ' : ''}{t(nome)}</button>
                ))}
                <button type="button" className="avst-ft-chip" data-teste="som-preview"
                  title="Tocar uma nota de teste (§178.2)"
                  onClick={() => tocarPreview()}>{t('Testar som')}</button>
              </div>
            )}
          </span>
        )}
        <button type="button" className="avst-botao" disabled={!store.podeDesfazer}
          title="Desfazer (Ctrl+Z)" onClick={() => store.desfazer()}><Undo2 size={14} aria-hidden /></button>
        <button type="button" className="avst-botao" disabled={!store.podeRefazer}
          title="Refazer" onClick={() => store.refazer()}><Redo2 size={14} aria-hidden /></button>
        <button type="button" className="avst-botao" title="Rever o tour do estúdio (§569)"
          data-teste="tour-abrir" onClick={abrirTour}>?</button>
        {/* GOLDEN V4.2 (§1/§36/§58, #64): PRODUTO 2D ÚNICO — a troca de modo some
            da experiência principal; sob QA (as6.qa_route) permanece para compat/dev (§37). */}
        {(!flag('as6.single_2d') || flag('as6.qa_route')) && (
          <button type="button" className="avst-botao" onClick={aoSairDoShell}>
            {flag('as6.single_2d') ? 'Compat clássico (QA)' : 'Modo clássico'}
          </button>
        )}
      </div>
    </header>
  );
}
