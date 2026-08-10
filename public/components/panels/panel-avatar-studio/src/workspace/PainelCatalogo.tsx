// workspace/PainelCatalogo.tsx — PAINEL DIREITO do workspace (AS6 L2
// §39, lote 821–830 — decisão #85, fase 2 da componentização).
// @version 1.0.0  @created 2026-08-08
//
// Extração VERBATIM do <aside> do ShellStudio (cabeçalho fixo P1
// §20–§22 + abas + Cores/Propriedades + criação avançada §102/§118/§105
// + grade). DOM byte a byte o mesmo. Estados que só o painel usa
// (toggle de propriedades, botão "Topo", ref do scroll) MORAM aqui;
// `aba` fica no PAI (PaletaComandos e DetalheAsset navegam por ela).
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronsLeft, ChevronsRight, Palette, Rows3 } from 'lucide-react';
import type { AvatarConfig, CategoriaId, SlotAcessorio } from '../domain/types';
import { validarConfig } from '../services/AvatarCatalog';
import type { AvatarStore } from '../nucleo/estado';
import { paraLegado2d } from '../nucleo/adaptadores';
import { GradeItens } from '../components/GradeItens';
import type { AbaCatalogo } from '../components/GradeItens';
import { Cores } from '../components/Cores';
import { Equipados, alternarBloqueio } from '../shell/Equipados';
import { PropriedadesAsset } from '../shell/PropriedadesAsset';
import { Inspector } from './Inspector';
import { PresetsShell } from '../shell/PresetsShell';
import { HistoricoSessao } from '../shell/HistoricoSessao';
import { DockAssets } from './DockAssets'; // decisão #112: MESMO trilho do clássico
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';

// decisão #112 (as6.dock_inferior): altura da dock — preferência local,
// mesmo mecanismo canônico dos demais ajustes de workspace (§186 etc.)
export type EstadoDock = 'compacta' | 'padrao' | 'expandida';
const CHAVE_DOCK = 'dshow.avst6.dockinf.v1';
const CICLO_DOCK: Record<EstadoDock, EstadoDock> = { compacta: 'padrao', padrao: 'expandida', expandida: 'compacta' };
function lerEstadoDock(): EstadoDock {
  try {
    const v = localStorage.getItem(CHAVE_DOCK);
    return v === 'compacta' || v === 'expandida' ? v : 'padrao';
  } catch { return 'padrao'; }
}

const CHIPS_SLOT: Array<{ id: 'todos' | SlotAcessorio; nome: string }> = [
  { id: 'todos', nome: 'Todos' },
  { id: 'cabeca', nome: 'Cabeça' },
  { id: 'rosto', nome: 'Rosto' },
  { id: 'pescoco', nome: 'Pescoço' },
];

export interface PropsPainelCatalogo {
  painelFechado: boolean;
  setPainelFechado: React.Dispatch<React.SetStateAction<boolean>>;
  painelLargo: boolean;
  setPainelLargo: React.Dispatch<React.SetStateAction<boolean>>;
  aba: AbaCatalogo | 'presets';
  setAba: React.Dispatch<React.SetStateAction<AbaCatalogo | 'presets'>>;
  categoria: CategoriaId;
  setCategoria: (c: CategoriaId) => void;
  filtroSlot: 'todos' | SlotAcessorio;
  setFiltroSlot: (s: 'todos' | SlotAcessorio) => void;
  configVisivel: AvatarConfig;
  configDraft: AvatarConfig;
  aoEscolher: (novo: AvatarConfig) => void;
  aoPrever: (novo: AvatarConfig | null) => void;
  resumoAcessorios: string[];
  store: AvatarStore;
  aplicarComando: (novo: AvatarConfig) => void;
  bloqueios: Set<string>;
  setBloqueios: (b: Set<string>) => void;
  aoMudarFavs: () => void;
  historico: React.ComponentProps<typeof HistoricoSessao>;
  desbloqueados: React.ComponentProps<typeof GradeItens>['desbloqueados'];
  setDetalheId: (id: string) => void;
  /** decisão #112 (as6.dock_inferior): painel vira DOCK horizontal
   *  abaixo do preview (estrutura do clássico AAA); false = lateral. */
  dockInferior?: boolean;
}

export function PainelCatalogo(props: PropsPainelCatalogo) {
  const { painelFechado, setPainelFechado, painelLargo, setPainelLargo, aba, setAba,
    categoria, setCategoria, filtroSlot, setFiltroSlot, configVisivel, configDraft,
    aoEscolher, aoPrever, resumoAcessorios, store, aplicarComando, bloqueios,
    setBloqueios, aoMudarFavs, historico, desbloqueados, setDetalheId,
    dockInferior = false } = props;
  const [propriedades, setPropriedades] = useState(false);
  const [mostrarTopo, setMostrarTopo] = useState(false);
  // decisão #112: altura da dock (compacta/padrão/expandida) persistida;
  // "recolhida" = o painelFechado de sempre (mesmo botão, mesma semântica)
  const [estadoDock, setEstadoDock] = useState<EstadoDock>(lerEstadoDock);
  const ciclarDock = () => {
    const novo = CICLO_DOCK[estadoDock];
    setEstadoDock(novo);
    try { localStorage.setItem(CHAVE_DOCK, novo); } catch { /* sem storage */ }
  };
  // lote 1151-1160 (#117, as6.nav_dock): a tecla D (shell) cicla a
  // altura por evento — o estado mora aqui
  useEffect(() => {
    if (!dockInferior || !flag('as6.nav_dock')) return undefined;
    const ao = () => ciclarDock();
    window.addEventListener('avst6:dock-altura', ao);
    return () => window.removeEventListener('avst6:dock-altura', ao);
  });
  const refPainel = useRef<HTMLDivElement>(null);
  // lote 1131-1140 (#115, as6.motion_v2): trocar de categoria assenta a
  // biblioteca com um fade curto (aceite §568: nada muda de posição
  // abruptamente). Atributo temporário religa a animação CSS.
  const [trocando, setTrocando] = useState(false);
  useEffect(() => {
    if (!flag('as6.motion_v2')) return undefined;
    setTrocando(true);
    const timer = window.setTimeout(() => setTrocando(false), 240);
    return () => window.clearTimeout(timer);
  }, [categoria]);
  // blocos compartilhados entre a lateral (flag off) e a dock (#112):
  // MESMO JSX — só o lugar muda (drawer flutuante × dentro do scroll)
  const blocoPropriedades = propriedades && (flag('as6.inspector') ? (
    /* AS6 §181–§189 (lote 921–930, decisão #94): Inspector
       contextual schema-driven; off = seção anterior byte a byte */
    <Inspector categoria={categoria} configVisivel={configVisivel}
      aoEscolher={aoEscolher} aoPrever={aoPrever} bloqueios={bloqueios}
      aoMudarFavs={aoMudarFavs} setDetalheId={setDetalheId}
      painelLargo={painelLargo} setPainelLargo={setPainelLargo} />
  ) : (
    <section className="avst5-propriedades" aria-label="Cores e propriedades">
      <Cores config={configVisivel} aoMudar={aoEscolher} />
      {/* §71: sliders das camadas equipadas com propriedades */}
      <PropriedadesAsset config={configVisivel} aoAplicar={aoEscolher} aoPrever={aoPrever} />
    </section>
  ));
  // #112: criação avançada compartilhada — lateral (dentro do scroll)
  // ou drawer da dock; MESMO JSX, mesmos data-teste
  const blocoCriacao = flag('as5.criacao_avancada') && categoria === 'base' && (
              <div className="avst5-cavancada" data-teste="criacao-avancada">
                <span className="avst-ft-rotulo">Tipo corporal (§102)</span>
                <div className="avst-ft-chips" role="radiogroup" aria-label="Tipo corporal (§102)">
                  {([[null, 'Médio'], ['esbelto', 'Esbelto'], ['atletico', 'Atlético'], ['robusto', 'Robusto'], ['compacto', 'Compacto']] as const).map(([v, nome]) => (
                    <button key={nome} type="button" role="radio"
                      aria-checked={(configDraft.corpo ?? null) === v}
                      className={`avst-ft-chip ${(configDraft.corpo ?? null) === v ? 'avst-ft-chip-ativo' : ''}`}
                      data-teste={`corpo-${v ?? 'medio'}`}
                      onClick={() => {
                        const { corpo: _c, ...resto } = configDraft;
                        aoEscolher(validarConfig(v ? { ...resto, corpo: v } : resto));
                      }}>{nome}</button>
                  ))}
                </div>
                <span className="avst-ft-rotulo">Postura (§118)</span>
                <div className="avst-ft-chips" role="radiogroup" aria-label="Postura (§118)">
                  {([[null, 'Neutra'], ['confiante', 'Confiante'], ['relaxada', 'Relaxada'], ['executiva', 'Executiva'], ['heroica', 'Heroica'], ['misteriosa', 'Misteriosa']] as const).map(([v, nome]) => (
                    <button key={nome} type="button" role="radio"
                      aria-checked={(configDraft.postura ?? null) === v}
                      className={`avst-ft-chip ${(configDraft.postura ?? null) === v ? 'avst-ft-chip-ativo' : ''}`}
                      data-teste={`postura-${v ?? 'neutra'}`}
                      onClick={() => {
                        const { postura: _p, ...resto } = configDraft;
                        aoEscolher(validarConfig(v ? { ...resto, postura: v } : resto));
                      }}>{nome}</button>
                  ))}
                </div>
                <span className="avst-ft-rotulo">Formato facial (§105)</span>
                <div className="avst-ft-chips" role="group" aria-label="Presets de formato facial (§105)">
                  {([['classico', 'Clássico', null], ['suave', 'Suave', { olhos: 1.08, boca: 0.95 }],
                    ['marcante', 'Marcante', { olhos: 0.9, boca: 1.1 }],
                    ['expressivo', 'Expressivo', { olhos: 1.14, boca: 1.06 }]] as const).map(([id2, nome, esc]) => (
                      <button key={id2} type="button" className="avst-ft-chip"
                        data-teste={`facial-${id2}`}
                        title={esc ? `Aplica a morfologia §108 (olhos ${esc.olhos}× · boca ${esc.boca}×)` : 'Volta a morfologia facial ao padrão'}
                        onClick={() => {
                          const params = { ...(configDraft.params ?? {}) };
                          if (esc) {
                            params.olhos = { ...(params.olhos ?? {}), escala: esc.olhos };
                            params.boca = { ...(params.boca ?? {}), escala: esc.boca };
                          } else {
                            if (params.olhos) { const { escala: _e, ...ro } = params.olhos; if (Object.keys(ro).length) params.olhos = ro; else delete params.olhos; }
                            if (params.boca) { const { escala: _e2, ...rb } = params.boca; if (Object.keys(rb).length) params.boca = rb; else delete params.boca; }
                          }
                          aoEscolher(validarConfig({ ...configDraft, ...(Object.keys(params).length ? { params } : { params: {} }) }));
                        }}>{nome}</button>
                  ))}
                </div>
                {/* megas 561–564 (§102.2, flag as5.criacao_fina): ajuste
                    FINO — sliders multiplicam o preset; 1 = neutro e o
                    campo SOME (byte-stability); undo via aoEscolher */}
                {flag('as5.criacao_fina') && (
                  <>
                    <span className="avst-ft-rotulo">{t('Ajuste fino (§102.2)')}</span>
                    {([['largura', 'Largura', 0.92, 1.08], ['altura', 'Altura', 0.96, 1.04]] as const).map(([ch, nome, min, max]) => (
                      <label key={ch} className="avst-ft-linha" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ minWidth: 56 }}>{t(nome)}</span>
                        <input type="range" min={min} max={max} step={0.01}
                          data-teste={`fino-${ch}`}
                          value={configDraft.corpoFino?.[ch] ?? 1}
                          aria-label={`${t(nome)} (§102.2)`}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            const cf = { ...(configDraft.corpoFino ?? {}), [ch]: v };
                            const { corpoFino: _f, ...resto } = configDraft;
                            aoEscolher(validarConfig({ ...resto, corpoFino: cf }));
                          }} />
                        <span aria-hidden>{(configDraft.corpoFino?.[ch] ?? 1).toFixed(2)}×</span>
                      </label>
                    ))}
                    <button type="button" className="avst-ft-chip" data-teste="fino-neutro"
                      onClick={() => {
                        const { corpoFino: _f, ...resto } = configDraft;
                        aoEscolher(validarConfig(resto));
                      }}>{t('Restaurar neutro')}</button>
                  </>
                )}
              </div>
  );
  return (
    <aside className={`avst5-painel${painelFechado ? ' avst5-painel-fechado' : ''}${dockInferior ? ' avst5-dock' : ''}`}
      aria-label="Catálogo" data-dock-estado={dockInferior && !painelFechado ? estadoDock : undefined}>
      {/* cabeçalho FIXO do workspace (P1 §20–§22) */}
      <div className="avst5-painel-topo">
        <button type="button" className="avst5-painel-btn" title={painelFechado ? 'Abrir catálogo' : 'Recolher catálogo'}
          onClick={() => setPainelFechado((v) => !v)}>
          {painelFechado ? <ChevronsLeft size={14} aria-hidden /> : <ChevronsRight size={14} aria-hidden />}
        </button>
        {!painelFechado && (<>
          <div className="avst5-abas" role="tablist" aria-label="Filtro do catálogo">
            {(['todos', 'equipados', 'favoritos', 'novos', 'bloqueados', 'presets'] as Array<AbaCatalogo | 'presets'>).map((a) => (
              <button key={a} type="button" role="tab" aria-selected={aba === a}
                className={aba === a ? 'avst5-aba-on' : ''} onClick={() => setAba(a)}>
                {/* megas 511-513 (§296): abas traduzíveis (PT = chave) */}
                {t(a === 'todos' ? 'Todos' : a === 'equipados' ? 'Equipados' : a === 'favoritos' ? 'Favoritos' : a === 'novos' ? 'Novos' : a === 'bloqueados' ? 'Bloqueados' : 'Presets')}
              </button>
            ))}
          </div>
          <button type="button" className={`avst5-painel-btn${propriedades ? ' avst5-painel-btn-on' : ''}`}
            title="Cores e propriedades" aria-pressed={propriedades}
            onClick={() => setPropriedades((v) => !v)}><Palette size={14} aria-hidden /></button>
          {dockInferior ? (
            /* decisão #112: altura da dock em 3 estados (recolhida = botão
               de fechar de sempre); preferência persiste na sessão */
            <button type="button" className="avst5-painel-btn" data-teste="dock-altura"
              title={`Altura da dock: ${estadoDock} → ${CICLO_DOCK[estadoDock]}`}
              onClick={ciclarDock}><Rows3 size={14} aria-hidden /></button>
          ) : (
            <button type="button" className="avst5-painel-btn" title={painelLargo ? 'Largura normal' : 'Expandir painel'}
              onClick={() => setPainelLargo((v) => !v)}>
              {painelLargo ? <ChevronsRight size={14} aria-hidden /> : <ChevronsLeft size={14} aria-hidden />}
            </button>
          )}
        </>)}
      </div>
      {/* #112: na dock, Cores/Propriedades vira DRAWER flutuante acima da
          dock (overlay — abrir NÃO desloca o preview do centro) */}
      {!painelFechado && dockInferior && blocoPropriedades && (
        <div className="avst5-insp-drawer" data-teste="insp-drawer" role="complementary" aria-label="Cores e propriedades">
          {blocoPropriedades}
          {blocoCriacao}
        </div>
      )}
      {!painelFechado && (
        <div className="avst5-painel-scroll" ref={refPainel} data-troca={trocando ? '' : undefined}
          onScroll={(e) => setMostrarTopo((e.target as HTMLElement).scrollTop > 400)}>
          {!dockInferior && blocoPropriedades}
          {aba !== 'equipados' && categoria === 'acessorio' && (<>
            {/* §68.2/§68.3: resumo + navegação por slot */}
            <div className="avst5-resumo-slots" data-teste="resumo-acessorios">
              {resumoAcessorios.length
                ? <><strong>{resumoAcessorios.length} equipado{resumoAcessorios.length > 1 ? 's' : ''}</strong> · {resumoAcessorios.join(' · ')}</>
                : 'Nenhum acessório equipado'}
            </div>
            <div className="avst5-chips" role="radiogroup" aria-label="Filtrar por slot">
              {CHIPS_SLOT.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={filtroSlot === s.id}
                  className={`avst5-chip${filtroSlot === s.id ? ' avst5-chip-on' : ''}`}
                  onClick={() => setFiltroSlot(s.id)}>{s.nome}</button>
              ))}
            </div>
          </>)}
          {aba === 'presets' ? (
            <PresetsShell configAtual={paraLegado2d(store.estadoDraft)}
              aoAplicar={(cfg) => aplicarComando(validarConfig(cfg))} />
          ) : aba === 'equipados' ? (<>
            <Equipados config={paraLegado2d(store.estadoDraft)} bloqueios={bloqueios}
              aoRemover={(slot) => {
                const cfg = paraLegado2d(store.estadoDraft);
                const camadas = { ...cfg.camadas } as Record<string, string>;
                delete camadas[slot];
                aoEscolher({ ...cfg, camadas });
              }}
              aoTrocar={(cat) => { setCategoria(cat); setAba('todos'); }}
              aoBloquear={(slot) => setBloqueios(new Set(alternarBloqueio(slot)))}
              aoMudarFavs={aoMudarFavs} />
            {/* §138: timeline granular da sessão junto da gestão do estado */}
            <HistoricoSessao entradas={historico.entradas} posicao={historico.posicao} irPara={historico.irPara} />
          </>) : (
            <>
            {/* megas 254–256 (§102/§118/§105): CRIAÇÃO AVANÇADA — na
                categoria Base (identidade do corpo); tudo vira COMANDO
                com undo via aoEscolher; neutro = campo some.
                #112: na dock ela vive no drawer de propriedades (grupo
                de avançados fora do trilho) — mesmo JSX, outro lugar */}
            {!dockInferior && blocoCriacao}
            {dockInferior ? (
              /* decisão #112: a MESMA fundação do clássico AAA — wrapper
                 .avst-trilho (CSS do trilho, cards AAA, responsivo) +
                 DockAssets (wheel→horizontal, drag c/ momentum, setas,
                 magnificação §104–§105). Zero duplicação: componente e
                 folhas de estilo são os MESMOS do Modo Clássico. Na
                 altura "expandida" a grade volta a fluir em linhas com
                 scroll vertical (o trilho desativa o pan). */
              <div className="avst-trilho avst5-trilho-dock" data-teste="dock-inferior" data-dock-v3="">
                <DockAssets ativa={estadoDock !== 'expandida'}>
                  <GradeItens config={configDraft} categoria={categoria}
                    desbloqueados={desbloqueados} aoEscolher={aoEscolher} filtroAba={aba as AbaCatalogo}
                    aoPrever={aoPrever} filtroSlot={filtroSlot} aoDetalhes={setDetalheId} />
                </DockAssets>
              </div>
            ) : (
              <GradeItens config={configDraft} categoria={categoria}
                desbloqueados={desbloqueados} aoEscolher={aoEscolher} filtroAba={aba as AbaCatalogo}
                aoPrever={aoPrever} filtroSlot={filtroSlot} aoDetalhes={setDetalheId} />
            )}
            </>
          )}
        </div>
      )}
      {!painelFechado && mostrarTopo && (
        <button type="button" className="avst5-topo" title="Voltar ao topo"
          onClick={() => refPainel.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUp size={14} aria-hidden /> Topo
        </button>
      )}
    </aside>
  );
}
