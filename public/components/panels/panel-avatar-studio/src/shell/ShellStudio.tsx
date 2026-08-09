// shell/ShellStudio.tsx — NOVO SHELL do Avatar Studio 5.0 (F2 S1, decisão #47).
// @version 0.1.0  @created 2026-07-31
//
// Layout de editor profissional (P1 §8): sidebar de categorias ajustável ·
// VIEWPORT DOMINANTE (P1 §9) · painel direito com scroll PRÓPRIO (P1 §20,
// §38 — o avatar nunca sai do foco). Vive atrás da flag as5.novo_shell;
// com a flag OFF o App atual segue intacto. O estado é o AvatarStore da F1
// (comandos + undo/redo); o catálogo reusa GradeItens (auditado MANTER).
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Camera, Eye, LayoutGrid, ShieldAlert, Sparkles, X } from 'lucide-react';
import type { AvatarConfig, CategoriaId, SlotAcessorio } from '../domain/types';
import { RARIDADES, aleatorioInteligente, itemPorId, nivelRaridade, svgEfeitoIsolado, tituloPorId, validarConfig } from '../services/AvatarCatalog';
import type { ModoAleatorio } from '../services/AvatarCatalog';
import { favoritos } from '../services/Progresso';
import { conectarTelemetria } from '../services/ObservarNucleo';
import { definirSom, pararAmbiente, somAtivo, tocarAmbiente, tocarCapturar, tocarEquipar, tocarPoder, tocarSalvar } from '../services/Som';
import { AvatarStore } from '../nucleo/estado';
import type { Comando } from '../nucleo/estado';
import { checksumEstado } from '../nucleo/contratos';
import { deLegado2d, paraLegado2d } from '../nucleo/adaptadores';
import { AvatarSvg } from '../components/AvatarSvg';
import { comItem } from '../components/GradeItens';
import type { AbaCatalogo } from '../components/GradeItens';
import { lerBloqueios } from './Equipados';
import { Evolucao } from './Evolucao';
import { incrementar } from '../services/Contadores'; // mega 246 (§221)
import { avaliarMissoes } from '../services/Missoes';
import { registrarMarco } from '../services/Evolucao';
import { TourGuiado, tourJaVisto } from './TourGuiado';
import { useHistoricoSessao } from './HistoricoSessao';
import { BarraTopo } from '../workspace/BarraTopo';
import { TrilhoCategorias } from '../workspace/TrilhoCategorias';
import { PainelCatalogo } from '../workspace/PainelCatalogo';
import { ClimaOverlay } from '../workspace/ClimaOverlay';
import { ComposicaoPalco } from '../workspace/ComposicaoPalco';
import { BarraCenas } from '../workspace/BarraCenas';
import { aplicarContexto } from '../workspace/contexto';
import { EVENTO_QUALIDADE, qualidade } from '../services/QualityManager'; // lote 1021-1030 (#104)
// lote 911–920 (decisão #93): domínio da composição do palco movido
// VERBATIM p/ workspace/palco.ts (fase 3b — sem dependência circular §3470)
import {
  CHAVE_CENARIO_PROPS, CHAVE_CLIMA, CHAVE_FUNDO, CHAVE_HIST_PALCO, CHAVE_HORA, CHAVE_LUZ,
  CHAVE_TEMA, CLIMAS_PALCO, COR_AMBIENTE, FUNDOS_PALCO, HORAS_PALCO,
  LUZES_PALCO, LUZ_POR_HORA, ROTULO_FUNDO, ROTULO_HORA, ROTULO_LUZ,
  TEMAS, lerHistPalco, lerPropsCenario,
} from '../workspace/palco';
import type {
  ClimaPalco, Composicao, FundoPalco, HoraPalco, LuzPalco, PropsCenario, TemaId,
} from '../workspace/palco';
import { Palco3d } from './Palco3d';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n'; // lote 411-420 (§296)
import { ROTULO_FAMILIA, familiaDoPoder, svgRoteiroFamilia } from '../services/PoderesFamilia'; // lote 281-290 (§153/§156)
import { svgParticulas } from '../engine/particulas'; // lote 351-360 (§157.3)
import { instalarFocoPreso } from './foco'; // mega 301 (P10)

// ── megas 273–275 (§274–§275, lazy §275): painéis SOB DEMANDA ────────
// Cada um vira chunk próprio e só atravessa a rede na PRIMEIRA abertura
// (thumbnail/metadados na tela antes do peso — streaming §274). Suspense
// fallback null: o overlay aparece um frame depois, nunca quebra o shell.
const PaletaComandos = lazy(() => import('./PaletaComandos').then((m) => ({ default: m.PaletaComandos })));
const Consultor = lazy(() => import('./Consultor').then((m) => ({ default: m.Consultor })));
const TimelineShell = lazy(() => import('./TimelineShell').then((m) => ({ default: m.TimelineShell }))); // mega 228 (§220)
const Missoes = lazy(() => import('./Missoes').then((m) => ({ default: m.Missoes })));
const VersoesAvatar = lazy(() => import('./VersoesAvatar').then((m) => ({ default: m.VersoesAvatar })));
const Atalhos = lazy(() => import('./Atalhos').then((m) => ({ default: m.Atalhos })));
const TelemetriaDev = lazy(() => import('./TelemetriaDev').then((m) => ({ default: m.TelemetriaDev })));
const DetalheAsset = lazy(() => import('./DetalheAsset').then((m) => ({ default: m.DetalheAsset })));
const CmsRo = lazy(() => import('./CmsRo').then((m) => ({ default: m.CmsRo }))); // lote 1061-1070 (#108)
import {
  CHAVE_RASCUNHO_STORAGE, gravarRascunho, idDaAba, lerRascunho, limparRascunho,
} from '../services/PresetsPessoais';
import { carregarEstado, estadoApiAtivo, salvarDraft, salvarVersao } from '../services/EstadoService';
import { telemetria } from '../services/Telemetria';
import { log } from '../services/Log';
import type { Rascunho } from '../services/PresetsPessoais';
import { BarraSalvamento } from './BarraSalvamento';
import { MOVIMENTOS, SHOWCASE_174, animar, movimentoReduzido, sequencia } from './movimento';

/** §68.3: chips de navegação por slot na categoria Acessórios. */

const CHAVE_LARGURAS = 'dshow.avst5.larguras.v1';

/** R2 (P1 §9.4): enquadramento AUTOMÁTICO por categoria — retângulo do
 *  viewBox 240×240 que a câmera deve ocupar (FOCO_THUMB é a semente). */
const ENQUADRAMENTOS: Partial<Record<CategoriaId, [number, number, number, number]>> = {
  base: [45, 36, 150, 150],
  cabelo: [38, 6, 164, 164],
  olhos: [64, 56, 112, 112],
  boca: [66, 92, 108, 108],
  acessorio: [40, 28, 160, 160],
  roupa: [30, 70, 180, 170],
  emblema: [108, 162, 92, 92],
};

/** AS6 §52 (lote 781–790, flag as6.viewport): presets MANUAIS de câmera
 *  — sobrepõem o enquadramento automático R2; 'corpo' = quadro cheio. */
const PRESETS_CAM6: Record<'rosto' | 'busto' | 'corpo', [number, number, number, number] | undefined> = {
  rosto: [56, 26, 128, 128],
  busto: [40, 20, 168, 168],
  corpo: undefined,
};
type Cam6 = 'auto' | 'rosto' | 'busto' | 'corpo';

// mega 239 (§172): apresentação do TÍTULO no palco — preferências locais
const CHAVE_TITULO_PALCO = 'dshow.avst5.palco.titulo.v1';
interface TituloPalco { alinhamento: 'esquerda' | 'centro' | 'direita'; escala: 'p' | 'm' | 'g' }
function lerTituloPalco(): TituloPalco {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_TITULO_PALCO) ?? 'null');
    return {
      alinhamento: ['esquerda', 'centro', 'direita'].includes(b?.alinhamento) ? b.alinhamento : 'centro',
      escala: ['p', 'm', 'g'].includes(b?.escala) ? b.escala : 'm',
    };
  } catch { return { alinhamento: 'centro', escala: 'm' }; }
}
const DEGRAUS_ESQ = [64, 84, 176, 220, 280];

// mega 71 (§117): PERSONALIDADE — combos curados de olhos+boca (1 clique)
const PERSONALIDADES = [
  { id: 'confiante', nome: 'Confiante', olhos: 'olh_serio', boca: 'boc_determinada' },
  { id: 'alegre', nome: 'Alegre', olhos: 'olh_feliz', boca: 'boc_sorriso' },
  { id: 'focado', nome: 'Focado', olhos: 'olh_focado', boca: 'boc_neutra' },
  { id: 'intenso', nome: 'Intenso', olhos: 'olh_chamas', boca: 'boc_determinada' },
] as const;

// mega 76 (§120): EMOTES — expressão TEMPORÁRIA (preview §608, nunca comando)
const EMOTES = [
  { id: 'feliz', rotulo: '😊', olhos: 'olh_feliz', boca: 'boc_sorriso' },
  { id: 'uau', rotulo: '😮', olhos: 'olh_arregalado', boca: 'boc_bocejo' },
  { id: 'bravo', rotulo: '😠', olhos: 'olh_chamas', boca: 'boc_determinada' },
  { id: 'amor', rotulo: '😍', olhos: 'olh_apaixonado', boca: 'boc_beijo' },
  // mega 259 (§120): emotes v2 — combos com arte EXISTENTE (nunca partes novas)
  { id: 'surpresa', rotulo: '😲', olhos: 'olh_arregalado', boca: 'boc_surpresa' },
  { id: 'sono', rotulo: '😴', olhos: 'olh_sonolento', boca: 'boc_bocejo' },
  { id: 'fa', rotulo: '🤩', olhos: 'olh_estrela', boca: 'boc_sorriso' },
] as const;

function lerLarguras(): { esq: number; dir: number } {
  try {
    const l = JSON.parse(localStorage.getItem(CHAVE_LARGURAS) ?? '{}') as { esq?: number; dir?: number };
    return { esq: l.esq ?? 176, dir: l.dir ?? 380 };
  } catch { return { esq: 176, dir: 380 }; }
}

/** Error boundary do shell (R10) — falha aqui nunca derruba o painel. */
class LimiteShell extends Component<{ aoSair: () => void; children: ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() { return { erro: true }; }
  // lote 156 (§291): o error boundary REPORTA antes de degradar —
  // mega 279 (§291 v2): CRÍTICO (quebrou o fluxo; entra no ring do suporte)
  componentDidCatch(e: Error) {
    log.critico('shell_error_boundary', { motivo: String(e?.message ?? e).slice(0, 120) });
  }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="avst5-erro" role="alert">
        <ShieldAlert size={26} aria-hidden />
        <p>O novo estúdio encontrou um erro — voltando ao modo clássico.</p>
        <button type="button" className="avst-botao" onClick={this.props.aoSair}>Voltar agora</button>
      </div>
    );
  }
}

export function ShellStudio({ configInicial, versaoBase, desbloqueados, aoSalvarLegado, aoSalvarFotoLegado, aoSairDoShell }: {
  configInicial: AvatarConfig;
  versaoBase: number;
  desbloqueados: Set<string>;
  /** salva pelo caminho legado (studio.php) até o corte do §619 */
  aoSalvarLegado: (config: AvatarConfig) => Promise<{ ok: boolean; versao?: number }>;
  /** mega 24: captura 3D vira o AVATAR OFICIAL (pipeline salvarFoto do App) */
  aoSalvarFotoLegado?: (png960: string) => Promise<boolean>;
  /** flag off / erro → App clássico */
  aoSairDoShell: () => void;
}) {
  const store = useMemo(() => {
    const s = new AvatarStore(deLegado2d(configInicial), versaoBase);
    return s;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => conectarTelemetria(store), [store]);
  // megas 555-556 (§72.3): anúncio de conjunto → aria-live do shell
  useEffect(() => {
    const ao = (e: Event) => setAnuncio(String((e as CustomEvent).detail ?? ''));
    window.addEventListener('avst5:anuncio', ao);
    // lote 1021-1030 (#104): perfil de qualidade mudou → re-render do shell
    // (setTicFavs é o tic de re-render que o shell já usa p/ favoritos)
    const aoQualidade = () => setTicFavs((v) => v + 1);
    window.addEventListener(EVENTO_QUALIDADE, aoQualidade);
    return () => { window.removeEventListener('avst5:anuncio', ao); window.removeEventListener(EVENTO_QUALIDADE, aoQualidade); };
  }, []);
  // mega 301 (P10/§548): focus trap delegado — prende o Tab no dialog aberto
  useEffect(() => instalarFocoPreso(), []);

  // assinatura do estado visível (preview > draft) — §608
  const estado = useSyncExternalStore(store.assinar, () => store.estadoVisivel);
  const configVisivel = useMemo(() => validarConfig(paraLegado2d(estado)), [estado]);
  // PERF (§276/§64): a GRADE olha o DRAFT, não o visível — o hover-preview
  // muda só o palco; estadoDraft mantém a MESMA referência durante preview,
  // então a grade (40+ thumbnails SVG) não re-renderiza a cada hover.
  const estadoDraft = useSyncExternalStore(store.assinar, () => store.estadoDraft);
  const configDraft = useMemo(() => validarConfig(paraLegado2d(estadoDraft)), [estadoDraft]);

  // estados locais de UI (§607.2/§607.3 — nunca entram no AvatarStore)
  const [categoria, setCategoria] = useState<CategoriaId>('base');
  const [larguras, setLarguras] = useState(lerLarguras);
  const [aba, setAba] = useState<AbaCatalogo | 'presets'>('todos');
  // §68.3: chip de slot ativo (só em Acessórios; troca de categoria zera)
  const [filtroSlot, setFiltroSlot] = useState<'todos' | SlotAcessorio>('todos');
  // §67: drawer de detalhes do asset (null = fechado)
  const [detalheId, setDetalheId] = useState<string | null>(null);
  // lote 1031-1040 (#105, as6.touch): drag de card sobre o palco
  const [arrastandoItem, setArrastandoItem] = useState(false);
  // R7/R8: modos do palco — edicao | foco (F/Esc) | studio (apresentação)
  const [modo, setModo] = useState<'edicao' | 'foco' | 'studio'>('edicao');
  const [painelLargo, setPainelLargo] = useState(false);
  const [painelFechado, setPainelFechado] = useState(false);
  const [bloqueios, setBloqueios] = useState<Set<string>>(() => lerBloqueios());
  const [, setTicFavs] = useState(0); // re-render após favoritar no Equipados
  // §69.1: conflito pendente aguardando decisão do usuário
  const [conflito, setConflito] = useState<{ novo: AvatarConfig; slot: string; antes: string; depois: string } | null>(null);
  // §590: tema de acento persistido
  const [tema, setTema] = useState<TemaId>(() => {
    try {
      const v = localStorage.getItem(CHAVE_TEMA) as TemaId | null;
      return v && TEMAS.some((x) => x.id === v) ? v : 'roxo';
    } catch { return 'roxo'; }
  });
  const trocarTema = (id: TemaId) => {
    setTema(id);
    try { localStorage.setItem(CHAVE_TEMA, id); } catch { /* sem storage */ }
  };
  const corTema = TEMAS.find((x) => x.id === tema)!.cor;

  const [fundo, setFundo] = useState<FundoPalco>(() => {
    try {
      const f = localStorage.getItem(CHAVE_FUNDO) as FundoPalco | null;
      return f && (FUNDOS_PALCO as readonly string[]).includes(f) ? f : 'estudio';
    } catch { return 'estudio'; }
  });

  // R11: atalhos de undo/redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key.toLowerCase() === 'z' && e.shiftKey) { e.preventDefault(); store.refazer(); }
      else if (e.key.toLowerCase() === 'z') { e.preventDefault(); store.desfazer(); }
      else if (e.key.toLowerCase() === 'y') { e.preventDefault(); store.refazer(); }
    };
    const aoTeclarModo = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setModo((m) => (m === 'foco' ? 'edicao' : 'foco'));
      } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // mega 105: E = emote aleatório (só faz algo no modo studio)
        window.dispatchEvent(new CustomEvent('avst5:emote-aleatorio'));
      } else if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // mega 297 (§548 v2): A = ativar o poder equipado (evento — o
        // handler do poder decide se pode; nada acontece sem poder)
        if (flag('as5.microinteracoes')) window.dispatchEvent(new CustomEvent('avst5:ativar-poder'));
      } else if (e.key === 'Escape') {
        setModo('edicao');
      }
    };
    window.addEventListener('keydown', aoTeclarModo);
    window.addEventListener('keydown', aoTeclar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('keydown', aoTeclarModo);
    };
  }, [store]);

  // R2: câmera contextual — zoom suave via transform (viewBox não anima)
  // AS6 §52/§84 (as6.viewport): preset manual persiste e sobrepõe o auto
  const [cam6, setCam6] = useState<Cam6>(() => {
    try {
      const v = localStorage.getItem('dshow.avst6.cam.v1');
      return v === 'rosto' || v === 'busto' || v === 'corpo' ? v : 'auto';
    } catch { return 'auto'; }
  });
  const escolherCam6 = useCallback((c: Cam6) => {
    setCam6(c);
    try { localStorage.setItem('dshow.avst6.cam.v1', c); } catch { /* sem storage */ }
  }, []);
  const flagViewport = flag('as6.viewport');
  const enquadramento = flagViewport && cam6 !== 'auto' ? PRESETS_CAM6[cam6] : ENQUADRAMENTOS[categoria];
  // (zoomEstilo desceu p/ depois do estado do poder — mega 287 §154 passo 2)

  const trocarFundo = (f: FundoPalco) => {
    setFundo(f);
    try { localStorage.setItem(CHAVE_FUNDO, f); } catch { /* sem storage */ }
  };

  // megas 61+62 (§162/§164): hora do dia + iluminação 2D (persistidas)
  const [hora, setHora] = useState<HoraPalco>(() => {
    try {
      const h = localStorage.getItem(CHAVE_HORA) as HoraPalco | null;
      return h && (HORAS_PALCO as readonly string[]).includes(h) ? h : 'dia';
    } catch { return 'dia'; }
  });
  const [luz, setLuz] = useState<LuzPalco>(() => {
    try {
      const l = localStorage.getItem(CHAVE_LUZ) as LuzPalco | null;
      return l && (LUZES_PALCO as readonly string[]).includes(l) ? l : 'neutra';
    } catch { return 'neutra'; }
  });
  const trocarHora = (h: HoraPalco) => {
    setHora(h);
    telemetria('palco_hora', { hora: h }); // §290
    try { localStorage.setItem(CHAVE_HORA, h); } catch { /* sem storage */ }
  };
  // mega 471 (§165): modo AUTO persistido; escolher preset manual desliga
  const [luzAuto, setLuzAuto] = useState<boolean>(() => {
    try { return localStorage.getItem('dshow.avst5.palco.luzauto.v1') === '1'; } catch { return false; }
  });
  const mudarLuzAuto = (v: boolean) => {
    setLuzAuto(v);
    try { localStorage.setItem('dshow.avst5.palco.luzauto.v1', v ? '1' : '0'); } catch { /* sem storage */ }
  };
  const trocarLuz = (l: LuzPalco) => {
    if (flag('as5.luz_contextual')) mudarLuzAuto(false); // manual manda (§165)
    setLuz(l);
    telemetria('palco_luz', { luz: l }); // §290
    try { localStorage.setItem(CHAVE_LUZ, l); } catch { /* sem storage */ }
  };
  // lote 201–202 (§163): clima persistido
  const [clima, setClima] = useState<ClimaPalco>(() => {
    try {
      const c = localStorage.getItem(CHAVE_CLIMA) as ClimaPalco | null;
      return c && (CLIMAS_PALCO as readonly string[]).includes(c) ? c : 'limpo';
    } catch { return 'limpo'; }
  });
  const trocarClima = (c: ClimaPalco) => {
    setClima(c);
    telemetria('palco_clima', { clima: c }); // §290
    try { localStorage.setItem(CHAVE_CLIMA, c); } catch { /* sem storage */ }
  };

  // (§179 sugestões Coleção→Cenário e Clima→Luz: memos locais de
  // BarraCenas/ComposicaoPalco desde a fase 3b — decisão #93)

  // §297 (P6) + §151 (P4): redução de movimento — palco ESTÁTICO (congela
  // SMIL). Guard vem do Motion System §285 (fonte única). Declarado AQUI
  // porque o poder v2 (§154.1) depende dele.
  const [movReduzido] = useState(movimentoReduzido);

  // mega 63 (§153–§155): ATIVAR PODER — efeito/aura equipado explode no
  // palco por ~2,6s (overlay isolado; nada muda no estado do avatar)
  // mega 235 (§154/§154.1): com a flag as5.palco_v2 o botão ganha a
  // SEQUÊNCIA completa — estados pronto/reproduzindo/cooldown, nome do
  // poder no overlay, controles conflitantes desabilitados e replay;
  // movimento reduzido = indisponível (§154.1)
  const palcoV2 = flag('as5.palco_v2');
  // lote 281–290 (§153.1–.4/§156): roteiro visual POR FAMÍLIA do poder
  const podFamilia = flag('as5.poderes_familia');
  const [poderAtivo, setPoderAtivo] = useState<string | null>(null);
  const [poderFase, setPoderFase] = useState<'pronto' | 'reproduzindo' | 'cooldown'>('pronto');
  const idPoder = configVisivel.camadas.efeito ?? configVisivel.camadas.aura ?? null;
  const metaPoder = useMemo(() => (idPoder ? itemPorId(idPoder) : undefined), [idPoder]);
  const ativarPoder = useCallback(() => {
    if (!idPoder || poderAtivo) return;
    if (palcoV2 && (poderFase !== 'pronto' || movReduzido)) return;
    setPoderAtivo(idPoder);
    // mega 289 (§292): família junto no evento — heatmap §293 por família
    telemetria('palco_poder', podFamilia
      ? { id: idPoder, familia: familiaDoPoder(idPoder) }
      : { id: idPoder }); // §290
    incrementar('poderes'); // mega 246 (§221): "seus números" local
    tocarPoder(); // mega 89 (§584)
    if (palcoV2) {
      setPoderFase('reproduzindo');
      setTimeout(() => { setPoderAtivo(null); setPoderFase('cooldown'); }, 2600);
      setTimeout(() => setPoderFase('pronto'), 3800); // §154.1: cooldown visual + replay
    } else {
      setTimeout(() => setPoderAtivo(null), 2600);
    }
  }, [idPoder, poderAtivo, palcoV2, poderFase, movReduzido]);
  // §154.1: controles do cenário ficam travados DURANTE a reprodução
  const controlesTravados = palcoV2 && poderFase === 'reproduzindo';

  // mega 297 (§548 v2): tecla A dispara o poder — mesmo alcance do botão
  // (só no modo studio; os guards do ativarPoder decidem o resto)
  useEffect(() => {
    const ao = () => { if (modo === 'studio') ativarPoder(); };
    window.addEventListener('avst5:ativar-poder', ao);
    return () => window.removeEventListener('avst5:ativar-poder', ao);
  }, [ativarPoder, modo]);

  const zoomEstilo = useMemo(() => {
    // mega 287 (§154 passo 2): a "câmera" aproxima de leve DURANTE o poder
    // (multiplica o zoom contextual; ×1 fora do poder = bytes idênticos)
    const cam = podFamilia && poderAtivo && !movReduzido ? 1.05 : 1;
    if (!enquadramento) return { transform: `scale(${cam})`, transformOrigin: '50% 50%' };
    const [x, y, w, h] = enquadramento;
    return {
      transform: `scale(${Math.min(2.4, 240 / Math.max(w, h)) * cam})`,
      transformOrigin: `${((x + w / 2) / 240) * 100}% ${((y + h / 2) / 240) * 100}%`,
    };
  }, [enquadramento, podFamilia, poderAtivo, movReduzido]);

  // megas 233–234 (§161): propriedades do cenário (locais, flag v2) —
  // o colapsável (cenAberto) mora no ComposicaoPalco desde a fase 3b
  const [propsCen, setPropsCen] = useState<PropsCenario>(lerPropsCenario);
  const mudarPropsCen = useCallback((patch: Partial<PropsCenario>) => {
    setPropsCen((p) => {
      const novo = { ...p, ...patch };
      try { localStorage.setItem(CHAVE_CENARIO_PROPS, JSON.stringify(novo)); } catch { /* sem storage */ }
      telemetria('palco_cenario_props', patch); // §290
      return novo;
    });
  }, []);

  // mega 239 (§172): apresentação do título no palco (local, flag v2)
  const [tituloPalco, setTituloPalco] = useState<TituloPalco>(lerTituloPalco);
  const mudarTituloPalco = useCallback((patch: Partial<TituloPalco>) => {
    setTituloPalco((t) => {
      const novo = { ...t, ...patch };
      try { localStorage.setItem(CHAVE_TITULO_PALCO, JSON.stringify(novo)); } catch { /* sem storage */ }
      return novo;
    });
  }, []);
  const metaTitulo = useMemo(
    () => (configVisivel.titulo ? tituloPorId(configVisivel.titulo) : undefined),
    [configVisivel.titulo],
  );

  // mega 237 (§167): comportamento da MOLDURA por raridade — só palco,
  // só flag, só sem redução de movimento (nunca no render salvo)
  const molduraViva = useMemo(() => {
    if (!palcoV2 || movReduzido) return undefined;
    const m = configVisivel.camadas.moldura ? itemPorId(configVisivel.camadas.moldura) : undefined;
    if (!m) return undefined;
    return m.raridade === 'raro' ? 'pulso' : m.raridade === 'epico' ? 'energia' : m.raridade === 'lendario' ? 'reativa' : undefined;
  }, [palcoV2, movReduzido, configVisivel.camadas.moldura]);

  // (§180 presets de apresentação: estado/handlers locais da BarraCenas
  // desde a fase 3b — decisão #93; o pai só guarda o RING do histórico)
  // lote 175–176 (§185): histórico do palco (ring ≤10, dedupe consecutivo)
  const [histPalco, setHistPalco] = useState<Composicao[]>(lerHistPalco);
  useEffect(() => {
    const atual: Composicao = { fundo, hora, luz, ...(clima !== 'limpo' ? { clima } : {}) };
    const t = setTimeout(() => {
      setHistPalco((h) => {
        const ult = h[h.length - 1];
        if (ult && ult.fundo === atual.fundo && ult.hora === atual.hora && ult.luz === atual.luz
          && (ult.clima ?? 'limpo') === (atual.clima ?? 'limpo')) return h;
        const novo = [...h, atual].slice(-10);
        try { localStorage.setItem(CHAVE_HIST_PALCO, JSON.stringify(novo)); } catch { /* sem storage */ }
        return novo;
      });
    }, 700); // preset aplicado = 1 entrada só (não 3)
    return () => clearTimeout(t);
  }, [fundo, hora, luz, clima]);
  const restaurarComposicao = useCallback((h: Composicao) => {
    trocarFundo(h.fundo); trocarHora(h.hora); trocarLuz(h.luz); trocarClima(h.clima ?? 'limpo');
    telemetria('palco_hist_restaurou', { fundo: h.fundo, hora: h.hora, luz: h.luz }); // §290
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GradeItens fala AvatarConfig — cada escolha vira COMANDO com inverso
  const aplicarComando = useCallback((novo: AvatarConfig) => {
    const antesLegado = paraLegado2d(store.estadoDraft);
    const antes = store.estadoDraft;
    const depois = deLegado2d(novo);
    // no-op nunca entra na pilha (clique em slider parado, re-clique na base)
    if (checksumEstado(antes) === checksumEstado(depois)) return;
    const cmd: Comando = {
      nome: `equipar:${novoDiff(antesLegado, novo)}`,
      executar: () => depois,
      desfazer: () => antes,
    };
    store.executar(cmd);
    if (!refFunil.current.editou) { // mega 106 (§294)
      refFunil.current.editou = true;
      telemetria('funil', { etapa: 'editou' });
    }
    // §158 (gatilho EQUIPAR): item novo ÉPICO+ ganha brilho curto no palco —
    // efeito efêmero via Motion System §285 (nunca persiste; §297 no módulo)
    const equipadosNovos = [
      ...(novo.base !== antesLegado.base ? [novo.base] : []),
      ...Object.entries(novo.camadas)
        .filter(([k, v]) => v && (antesLegado.camadas as Record<string, string | undefined>)[k] !== v)
        .map(([, v]) => v as string),
    ];
    const temRaro = equipadosNovos.some((id) => {
      const item = itemPorId(id);
      return item && nivelRaridade(item.raridade) >= nivelRaridade('epico');
    });
    if (temRaro) void animar(document.querySelector('.avst5-palco'), MOVIMENTOS.brilho, { duracao: 700 });
    // §584: clique de equipar afinado pela MAIOR raridade recém-equipada
    const maiorNivel = equipadosNovos.reduce((m, id) => {
      const item = itemPorId(id);
      return item ? Math.max(m, nivelRaridade(item.raridade)) : m;
    }, -1);
    if (maiorNivel >= 0) tocarEquipar(maiorNivel);
  }, [store]);

  // mega 71 (§117): aplica um combo de personalidade (vira COMANDO c/ undo)
  const aplicarPersonalidade = useCallback((p: (typeof PERSONALIDADES)[number]) => {
    const cfg = paraLegado2d(store.estadoDraft);
    if (!itemPorId(p.olhos) || !itemPorId(p.boca)) return; // catálogo manda
    aplicarComando(validarConfig({ ...cfg, camadas: { ...cfg.camadas, olhos: p.olhos, boca: p.boca } }));
    telemetria('personalidade_aplicou', { id: p.id }); // §290
  }, [store, aplicarComando]);

  // lote 157: GUARDA de cota do storage — dshow.* passando de ~3,5MB
  // avisa uma vez (antes que um save silenciosamente falhe)
  useEffect(() => {
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k?.startsWith('dshow.')) bytes += (localStorage.getItem(k)?.length ?? 0) * 2;
      }
      if (bytes > 3.5 * 1024 * 1024) {
        log.aviso('storage_perto_da_cota', { kb: Math.round(bytes / 1024) }); // §291
        setAnuncio('Armazenamento local quase cheio — considere limpar projetos/cenas antigos.');
      }
    } catch { /* sem storage */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mega 106 (§294): FUNIL — entrou→editou→salvou (1× por sessão de shell)
  const refFunil = useRef({ entrou: false, editou: false });
  useEffect(() => {
    if (!refFunil.current.entrou) {
      refFunil.current.entrou = true;
      telemetria('funil', { etapa: 'entrou' });
    }
  }, []);

  // mega 99 (§285): micro-motion na troca de categoria (§297 no módulo)
  useEffect(() => {
    void animar(document.querySelector('.avst5-painel'), MOVIMENTOS.aparecer, { duracao: 140, easing: 'ease-out' });
  }, [categoria]);

  // mega 76 (§120): EMOTE — troca temporária via preview (§608); 2s e volta
  const refEmote = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fazerEmote = useCallback((e: (typeof EMOTES)[number]) => {
    if (!itemPorId(e.olhos) || !itemPorId(e.boca)) return;
    if (refEmote.current) clearTimeout(refEmote.current);
    store.visualizar((est) => ({ ...est, equipment: { ...est.equipment, olhos: e.olhos, boca: e.boca } }));
    telemetria('emote', { id: e.id }); // §290
    refEmote.current = setTimeout(() => { store.limparPreview(); refEmote.current = null; }, 2000);
  }, [store]);
  useEffect(() => () => { if (refEmote.current) clearTimeout(refEmote.current); }, []);
  // mega 105: tecla E dispara um emote aleatório (studio apenas)
  const refModo = useRef(modo);
  refModo.current = modo;
  useEffect(() => {
    const ao = () => {
      if (refModo.current !== 'studio') return;
      fazerEmote(EMOTES[Math.floor(Math.random() * EMOTES.length)]);
    };
    window.addEventListener('avst5:emote-aleatorio', ao);
    return () => window.removeEventListener('avst5:emote-aleatorio', ao);
  }, [fazerEmote]);

  // §69.1: SUBSTITUIÇÃO em slot (item A → item B) ou slot BLOQUEADO pede
  // confirmação explícita — nada de troca silenciosa
  const aoEscolher = useCallback((novo: AvatarConfig) => {
    const antes = paraLegado2d(store.estadoDraft);
    const chaves = new Set([...Object.keys(antes.camadas), ...Object.keys(novo.camadas)]);
    for (const slot of chaves) {
      const a = (antes.camadas as Record<string, string | undefined>)[slot];
      const b = (novo.camadas as Record<string, string | undefined>)[slot];
      if (a && b && a !== b && (bloqueios.has(slot) || slot.startsWith('acessorio'))) {
        setConflito({ novo, slot, antes: a, depois: b });
        return;
      }
      if (a && !b && bloqueios.has(slot)) { // remoção de slot bloqueado
        setConflito({ novo, slot, antes: a, depois: '' });
        return;
      }
    }
    aplicarComando(novo);
  }, [store, bloqueios, aplicarComando]);

  // §64: hover do card → preview no palco (nunca contamina o draft)
  // megas 591–593 (§64.2, flag as5.ux_final): FIXAR PRÉVIA — com prévia
  // fixada o hover não mexe no palco; sair do card tem uma janela de
  // graça p/ alcançar o botão "Fixar" (o clique cancela a limpeza)
  const [previaFixa, setPreviaFixa] = useState<AvatarConfig | null>(null);
  const [previaAtiva, setPreviaAtiva] = useState<AvatarConfig | null>(null);
  const refLimparPrevia = useRef<number | null>(null);
  const aoPrever = useCallback((cfg: AvatarConfig | null) => {
    if (!flag('as5.ux_final')) { // caminho legado intacto (§651)
      if (cfg) store.visualizar(() => deLegado2d(cfg));
      else store.limparPreview();
      return;
    }
    if (previaFixa) return; // §64.2: fixada = hover ignorado
    if (refLimparPrevia.current) { clearTimeout(refLimparPrevia.current); refLimparPrevia.current = null; }
    if (cfg) {
      setPreviaAtiva(cfg);
      store.visualizar(() => deLegado2d(cfg));
    } else {
      refLimparPrevia.current = window.setTimeout(() => {
        refLimparPrevia.current = null;
        setPreviaAtiva(null);
        store.limparPreview();
      }, 380); // janela de graça — alcança o "Fixar" no viewport
    }
  }, [store, previaFixa]);
  const fixarPrevia = useCallback(() => {
    if (!previaAtiva) return;
    if (refLimparPrevia.current) { clearTimeout(refLimparPrevia.current); refLimparPrevia.current = null; }
    setPreviaFixa(previaAtiva);
    store.visualizar(() => deLegado2d(previaAtiva));
  }, [previaAtiva, store]);
  const soltarPrevia = useCallback(() => {
    setPreviaFixa(null);
    setPreviaAtiva(null);
    store.limparPreview();
  }, [store]);

  // §90: aleatório inteligente — bloqueios §70.1 NUNCA são trocados.
  // Aplica direto (sem modal §69.1): a proteção já aconteceu no sorteio.
  const rodarAleatorio = useCallback((modoAlea: ModoAleatorio) => {
    const novo = aleatorioInteligente(paraLegado2d(store.estadoDraft), {
      semente: Date.now() % 2147483647,
      modo: modoAlea,
      categoria,
      bloqueados: lerBloqueios(),
      favoritos: favoritos(),
    });
    aplicarComando(novo);
  }, [store, categoria, aplicarComando]);

  // §65.3: comparação por tecla — SEGURAR mostra a versão persistida
  const [comparando, setComparando] = useState(false);
  useEffect(() => {
    const baixo = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) setComparando(true);
    };
    const cima = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v') setComparando(false);
    };
    window.addEventListener('keydown', baixo);
    window.addEventListener('keyup', cima);
    return () => { window.removeEventListener('keydown', baixo); window.removeEventListener('keyup', cima); };
  }, []);
  const configPalco = useMemo(
    () => (comparando ? validarConfig(paraLegado2d(store.estadoPersistido)) : configVisivel),
    [comparando, configVisivel, store],
  );

  // §138: registro da timeline vive AQUI (a sessão inteira, não só na aba)
  const historico = useHistoricoSessao(store);

  // §158: GATILHO de efeito — celebração efêmera ao SALVAR (nunca persiste;
  // respeita redução de movimento §297)
  const [celebrando, setCelebrando] = useState(false);
  const celebrar = useCallback(() => {
    if (movReduzido) return;
    setCelebrando(true);
    setTimeout(() => setCelebrando(false), 2200);
  }, [movReduzido]);

  // mega 7: PRÉVIA 3D no viewport (flag as5.palco3d fail-safe OFF) —
  // o chunk pesado (motor3d) só carrega quando o usuário LIGA o modo
  const flagPalco3d = flag('as5.palco3d');
  // mega 386 (§274, flag as5.orcamento_perf): PREFETCH do motor3d no
  // hover/focus do botão — o clique encontra o chunk já no cache HTTP
  const refPrefetch3d = useRef(false);
  const prefetch3d = useCallback(() => {
    if (refPrefetch3d.current || !flag('as5.orcamento_perf')) return;
    refPrefetch3d.current = true;
    void import('../services/Renderizador3d').catch(() => { refPrefetch3d.current = false; });
  }, []);
  const [palco3d, setPalco3d] = useState(false);
  // mega 10: Apresentar delega ao showcase 3D quando o palco 3D está ativo
  const [sinal3d, setSinal3d] = useState(0);

    // §584 (P9): SOM no shell — reusa services/Som (WebAudio synth, sem
  // assets); preferência única compartilhada com o modo clássico
  const [somLigado, setSomLigado] = useState(somAtivo);
  // lote 411-420 (§296): re-render ao trocar idioma (troca ao vivo)
  const [, setTicIdioma] = useState(0);
  useEffect(() => {
    const ao = () => setTicIdioma(x => x + 1);
    window.addEventListener('avst:idioma', ao);
    return () => window.removeEventListener('avst:idioma', ao);
  }, []);
  // ── lote 321–330 (§157/§161/§164/§178, flag as5.palco_sensorial) ──
  const sensorial = flag('as5.palco_sensorial');
  // mega 321 (§161/§178): PAD ambiente por cenário — segue fundo+mute+3D
  useEffect(() => {
    if (!sensorial || !somLigado || palco3d) { pararAmbiente(); return undefined; }
    tocarAmbiente(fundo);
    return () => pararAmbiente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorial, somLigado, fundo, palco3d]);
  // mega 323 (§157.4): CROSSFADE de cenário — camada com o fundo ANTERIOR
  // desvanece por cima do novo (350ms); movimento reduzido pula
  const [fadeFundo, setFadeFundo] = useState<FundoPalco | null>(null);
  const refFundoAnt = useRef(fundo);
  useEffect(() => {
    if (refFundoAnt.current === fundo) return undefined;
    const anterior = refFundoAnt.current;
    refFundoAnt.current = fundo;
    if (!sensorial || movReduzido || palco3d) return undefined;
    setFadeFundo(anterior);
    const t = setTimeout(() => setFadeFundo(null), 380);
    return () => clearTimeout(t);
  }, [fundo, sensorial, movReduzido, palco3d]);
  // mega 324 (§157.5): PRESENÇA — entrada sutil ao trocar a base do avatar
  const [presenca, setPresenca] = useState(false);
  const refBaseAnt = useRef(configVisivel.base);
  useEffect(() => {
    if (refBaseAnt.current === configVisivel.base) return undefined;
    refBaseAnt.current = configVisivel.base;
    if (!sensorial || movReduzido) return undefined;
    setPresenca(true);
    const t = setTimeout(() => setPresenca(false), 650);
    return () => clearTimeout(t);
  }, [configVisivel.base, sensorial, movReduzido]);
  // mega 325 (§164.3): INTENSIDADE da luz (modo simples §164.4 = 1)
  const [luzInt, setLuzInt] = useState(() => {
    try { return Number(localStorage.getItem('dshow.avst5.palco.luzint.v1') ?? '1') || 1; } catch { return 1; }
  });
  const mudarLuzInt = useCallback((v: number) => {
    const lim = Math.min(1.3, Math.max(0.7, v));
    setLuzInt(lim);
    try { localStorage.setItem('dshow.avst5.palco.luzint.v1', String(lim)); } catch { /* sem storage */ }
  }, []);
  const alternarSom = useCallback(() => {
    setSomLigado((v) => { definirSom(!v); return !v; });
  }, []);
  // megas 578–579 (§157.4, flag as5.palco_v3): transição de ENTRADA do
  // avatar no palco 2D — one-shot por gesto; §297 nunca liga o data-attr
  const [entrada2d, setEntrada2d] = useState<'materializar' | 'teleporte' | 'ascender' | null>(null);
  const dispararEntrada = useCallback((id: 'materializar' | 'teleporte' | 'ascender') => {
    if (movReduzido) return; // §297: feedback visual estático basta
    setEntrada2d(null); // reinicia a animação mesmo repetindo o efeito
    requestAnimationFrame(() => setEntrada2d(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movReduzido]);
  useEffect(() => {
    if (!entrada2d) return undefined;
    const t = setTimeout(() => setEntrada2d(null), 1400);
    return () => clearTimeout(t);
  }, [entrada2d]);

  // §568–§571: TOUR de primeiro uso (auto na 1ª visita; "?" reabre)
  const [tour, setTour] = useState(() => !tourJaVisto());

  // §566: COMMAND PALETTE — Ctrl+K/⌘K
  const [paleta, setPaleta] = useState(false);
  useEffect(() => {
    const aoK = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaleta((v) => !v);
      }
    };
    window.addEventListener('keydown', aoK);
    return () => window.removeEventListener('keydown', aoK);
  }, []);

  // mega 46 (§290): viewer local de telemetria (flag dev)
  const [telemetriaDev, setTelemetriaDev] = useState(false);
  // lote 1061-1070 (#108, as6.cms_ro): CMS somente-leitura (AdminGate)
  const [cmsRo, setCmsRo] = useState(false);

  // lote 121–130 (§232): CONSULTOR de estilo (regras, flag as5.consultor)
  const [consultor, setConsultor] = useState(false);
  // lote 141–150 (§619): timeline de VERSÕES do espelho
  const [versoes619, setVersoes619] = useState(false);
  // lote 181–187 (§241–§246): drawer de EVOLUÇÃO
  const [evolucao, setEvolucao] = useState(false);
  // lote 196–198 (§250/§251): drawer de MISSÕES
  const [missoes, setMissoes] = useState(false);
  // mega 228 (§220): LINHA DO TEMPO unificada (flag as5.timeline_shell)
  const [timeline, setTimeline] = useState(false);

  // mega 37 (§548): folha de ATALHOS — "?" abre (fora de campos de texto)
  const [atalhos, setAtalhos] = useState(false);
  useEffect(() => {
    const aoInterrogacao = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setAtalhos((v) => !v);
      }
    };
    window.addEventListener('keydown', aoInterrogacao);
    return () => window.removeEventListener('keydown', aoInterrogacao);
  }, []);

  // §174 SHOWCASE: apresentação cinematográfica 2D no modo Studio.
  // Sequência automática (fade → aproxima → gira → composição §174.1),
  // ~6s (§174.2). A coreografia e o guard §297 vivem no Motion System §285.
  const [apresentando, setApresentando] = useState(false);
  // mega 66 (§185): HISTÓRICO de apresentação — última cena usada em
  // showcase/captura fica registrada e volta num clique
  const [ultimaCena, setUltimaCena] = useState<{ fundo: FundoPalco; hora: HoraPalco; luz: LuzPalco } | null>(() => {
    try { return JSON.parse(localStorage.getItem('dshow.avst5.apresentacao.ultima.v1') ?? 'null'); } catch { return null; }
  });
  const registrarApresentacao = useCallback((tipo: 'showcase' | 'captura') => {
    const cena = { fundo, hora, luz };
    setUltimaCena(cena);
    // mega 292 (§221/§223): "seus números" + XP por uso na fórmula aberta
    incrementar(tipo === 'showcase' ? 'apresentacoes' : 'capturas');
    telemetria('palco_apresentou', { tipo, ...cena }); // §290/§185
    try { localStorage.setItem('dshow.avst5.apresentacao.ultima.v1', JSON.stringify(cena)); } catch { /* sem storage */ }
  }, [fundo, hora, luz]);
  const apresentar = useCallback(async () => {
    if (apresentando) return;
    setApresentando(true);
    setModo('studio');
    registrarApresentacao('showcase'); // mega 66
    await new Promise((r) => setTimeout(r, 80)); // studio monta primeiro
    await sequencia(document.querySelector('.avst5-zoom'), SHOWCASE_174);
    setApresentando(false);
  }, [apresentando, registrarApresentacao]);

  // §174.1 item 11: CAPTURA do palco em PNG (rasterização local, como na Foto)
  const capturarPalco = useCallback(async () => {
    const svg = document.querySelector('.avst5-palco svg');
    if (!svg) return;
    try {
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
      });
      // mega 383 (§186.1, flag as5.orcamento_perf): captura em ALTA
      // qualidade (1920px) — SVG é vetor, o custo é só do canvas final
      const lado = flag('as5.orcamento_perf') ? 1920 : 960;
      const canvas = document.createElement('canvas');
      canvas.width = lado; canvas.height = lado;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, lado, lado);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `dshow-showcase-${lado}px.png`;
        a.click();
        telemetria('showcase_captura');
        tocarCapturar(); // mega 89 (§584)
        registrarApresentacao('captura'); // mega 66 (§185)
      }
      URL.revokeObjectURL(url);
    } catch { /* captura é conveniência — nunca quebra o shell */ }
  }, [registrarApresentacao]);

  // §548/§561 (P9) + §297: ANUNCIADOR de ações — feedback visível e lido
  // por screen reader (aria-live) para equipar/desfazer/refazer
  const [anuncio, setAnuncio] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mostrar = (txt: string) => {
      setAnuncio(txt);
      clearTimeout(timer);
      timer = setTimeout(() => setAnuncio(null), 1800);
    };
    const p1 = store.bus.em('comando:executado', (d) => mostrar(`Aplicado: ${d.nome.replace('equipar:', '')}`));
    const p2 = store.bus.em('comando:desfeito', (d) => mostrar(`Desfeito: ${d.nome.replace('equipar:', '')}`));
    const p3 = store.bus.em('comando:refeito', (d) => mostrar(`Refeito: ${d.nome.replace('equipar:', '')}`));
    return () => { clearTimeout(timer); p1(); p2(); p3(); };
  }, [store]);

  // §619 (Etapa 3 do §647 — DUAL-WRITE atrás da flag as5.estado_api):
  // o legado segue como FONTE DA VERDADE; o estado novo é espelhado
  // best-effort com lock otimista (§619.1). Falha nunca interrompe o fluxo.
  const refChecksum619 = useRef<string | null>(null);
  useEffect(() => {
    if (!estadoApiAtivo()) return;
    let vivo = true;
    void carregarEstado().then((c) => {
      if (vivo && c) refChecksum619.current = c.checksum;
    });
    return () => { vivo = false; };
  }, []);
  const espelhar619 = useCallback(async (comVersao: boolean) => {
    // lote 141 (§619): a ESCRITA no espelho é sempre ativa (best-effort,
    // aditiva, fail-safe — alimenta a timeline de versões); a flag
    // as5.estado_api segue gateando só o CORTE DE LEITURA futuro.
    try {
      const r = await salvarDraft(store.estadoDraft, refChecksum619.current);
      if (r.ok && r.checksum) refChecksum619.current = r.checksum;
      if (r.conflito) telemetria('estado619_conflito');
      if (r.ok && comVersao) {
        const v = await salvarVersao('shell as5', true);
        telemetria('estado619_versao', { ok: v.ok, versao: v.versao ?? 0 });
      }
    } catch { /* espelho é best-effort */ }
  }, [store]);

  // §139: AUTOSAVE do rascunho (debounce) — limpa quando não há mudanças
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const parar = store.assinar(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (store.temMudancas) {
          gravarRascunho(paraLegado2d(store.estadoDraft), store.versao);
          void espelhar619(false); // §139 "sincronizar quando possível"
        } else limparRascunho();
      }, 800);
    });
    return () => { clearTimeout(timer); parar(); };
  }, [store, espelhar619]);

  // §139: recuperação — rascunho órfão diferente do estado carregado
  const [rascunho, setRascunho] = useState<Rascunho | null>(() => {
    const r = lerRascunho();
    if (!r) return null;
    return JSON.stringify(validarConfig(r.config)) !== JSON.stringify(validarConfig(configInicial)) ? r : null;
  });

  // §629 "conflito entre abas": outra aba gravou rascunho → avisa
  const [outraAba, setOutraAba] = useState(false);
  useEffect(() => {
    const aoStorage = (e: StorageEvent) => {
      if (e.key !== CHAVE_RASCUNHO_STORAGE || !e.newValue) return;
      try {
        const r = JSON.parse(e.newValue) as Rascunho;
        if (r.aba && r.aba !== idDaAba()) setOutraAba(true);
      } catch { /* rascunho ilegível — ignora */ }
    };
    window.addEventListener('storage', aoStorage);
    return () => window.removeEventListener('storage', aoStorage);
  }, []);

  // §68.2: resumo dos acessórios equipados no topo da categoria
  const resumoAcessorios = useMemo(() => {
    const nomes = (['acessorio_cabeca', 'acessorio_rosto', 'acessorio_pescoco'] as const)
      .map((s) => configVisivel.camadas[s])
      .filter((id): id is string => Boolean(id))
      .map((id) => itemPorId(id)?.nome ?? id);
    return nomes;
  }, [configVisivel]);

  // arraste das larguras (R3/R4) com persistência
  const arraste = useRef<{ lado: 'esq' | 'dir'; x0: number; w0: number } | null>(null);
  const aoMoverPonteiro = useCallback((e: PointerEvent) => {
    const a = arraste.current;
    if (!a) return;
    const delta = a.lado === 'esq' ? e.clientX - a.x0 : a.x0 - e.clientX;
    const bruto = a.w0 + delta;
    const novo = a.lado === 'esq'
      ? DEGRAUS_ESQ.reduce((m, d) => (Math.abs(d - bruto) < Math.abs(m - bruto) ? d : m), DEGRAUS_ESQ[2])
      : Math.min(520, Math.max(280, bruto));
    setLarguras((l) => {
      const prox = { ...l, [a.lado]: novo };
      try { localStorage.setItem(CHAVE_LARGURAS, JSON.stringify(prox)); } catch { /* sem storage */ }
      return prox;
    });
  }, [setLarguras]);
  useEffect(() => {
    const soltar = () => { arraste.current = null; };
    window.addEventListener('pointermove', aoMoverPonteiro);
    window.addEventListener('pointerup', soltar);
    return () => { window.removeEventListener('pointermove', aoMoverPonteiro); window.removeEventListener('pointerup', soltar); };
  }, [aoMoverPonteiro]);

  const compacta = larguras.esq <= 84;

  return (
    <LimiteShell aoSair={aoSairDoShell}>
      <div className="avst5-shell" data-avst5="1" data-modo={modo} data-apresentando={apresentando ? "1" : undefined}
        data-qualidade={flag('as6.quality') ? qualidade().perfil : undefined} /* lote 1021-1030 (#104) */
        data-uxfinal={flag('as5.ux_final') ? '' : undefined} // megas 598-599 (§545-§546)
        data-micro={flag('as5.microinteracoes') && !movReduzido ? '' : undefined} /* mega 296 (P9/§285) */
        style={{ '--avst-acento': corTema, '--avst5-esq': `${larguras.esq}px`,
          '--avst5-dir': painelFechado ? '36px' : painelLargo ? '560px' : `${larguras.dir}px` } as React.CSSProperties}>
        {/* header interno (§626) — extraído p/ workspace/BarraTopo (decisão #79) */}
        <BarraTopo modo={modo} setModo={setModo} apresentando={apresentando}
          aoApresentar={() => { if (palco3d) setSinal3d((n) => n + 1); else void apresentar(); }}
          flagPalco3d={flagPalco3d} palco3d={palco3d}
          aoAlternar3d={() => setPalco3d((v) => !v)} prefetch3d={prefetch3d}
          rodarAleatorio={rodarAleatorio} somLigado={somLigado} alternarSom={alternarSom}
          abrirConsultor={() => setConsultor(true)} abrirMissoes={() => setMissoes(true)}
          abrirEvolucao={() => setEvolucao(true)} abrirTimeline={() => setTimeline(true)}
          abrirVersoes={() => setVersoes619(true)} abrirTour={() => setTour(true)}
          store={store} aoSairDoShell={aoSairDoShell} />

        <div className="avst5-corpo">
          {/* sidebar esquerda — scroll próprio (R5) */}
          <TrilhoCategorias categoria={categoria} compacta={compacta}
            aoEscolher={(id) => {
              setCategoria(id); setFiltroSlot('todos');
              // §323–§325 (as6.contexto): UMA ação prepara o ambiente —
              // aba volta ao catálogo cheio, busca antiga limpa, grupo
              // do inspector relevante abre, aria-live anuncia
              if (flag('as6.contexto')) { setAba('todos'); aplicarContexto(id); }
            }} />
          <div className="avst5-alca" role="separator" aria-orientation="vertical" aria-label="Redimensionar navegação"
            onPointerDown={(e) => { arraste.current = { lado: 'esq', x0: e.clientX, w0: larguras.esq }; }} />

          {/* viewport dominante (R1) — SEM scroll de página (R5) */}
          {/* mega 75 (§132): EDIÇÃO tem luz neutra garantida — cor fiel;
              a iluminação §164 só vale nos modos studio/foco */}
          <main className="avst5-viewport" aria-label="Palco do avatar" data-fundo={fundo}
            /* lote 1031-1040 (#105, as6.touch): soltar um card AQUI equipa —
               §325 na prática (arrastou → vestiu); realce via data-soltavel */
            data-soltavel={arrastandoItem ? '' : undefined}
            onDragOver={flag('as6.touch') ? (e) => {
              if (e.dataTransfer.types.includes('text/avst-item')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                if (!arrastandoItem) setArrastandoItem(true);
              }
            } : undefined}
            onDragLeave={flag('as6.touch') ? () => setArrastandoItem(false) : undefined}
            onDrop={flag('as6.touch') ? (e) => {
              const id = e.dataTransfer.getData('text/avst-item');
              setArrastandoItem(false);
              if (!id) return;
              e.preventDefault();
              const item = itemPorId(id);
              if (!item) return;
              aplicarComando(validarConfig(comItem(paraLegado2d(store.estadoDraft), item.categoria, id)));
              telemetria('palco_drop_equipou', { id }); // §290
            } : undefined}
            data-hora={hora}
            data-luz={modo === 'edicao' ? 'neutra'
              : (flag('as5.luz_contextual') && luzAuto ? LUZ_POR_HORA[hora] : luz)} data-clima={clima}
            data-moldura-viva={!palco3d ? molduraViva : undefined}
            data-cen-vivo={palcoV2 && !palco3d && propsCen.vivo && !movReduzido ? '' : undefined}
            data-idle={flag('as5.criacao_avancada') && !palco3d && !movReduzido && propsCen.idle !== 'nenhum' ? propsCen.idle : undefined}
            data-poder-cam={podFamilia && poderAtivo && !movReduzido ? '' : undefined}
            data-luzctx={flag('as5.luz_contextual') ? '' : undefined}
            data-presenca={presenca ? '' : undefined}
            data-entrada={flag('as5.palco_v3') && !palco3d && !movReduzido && entrada2d ? entrada2d : undefined}
            data-luzadv={sensorial && luzInt !== 1 && !palco3d ? '' : undefined}
            style={sensorial && luzInt !== 1 && !palco3d ? { '--avst5-luzint': luzInt } as React.CSSProperties : undefined}>
            {/* mega 323 (§157.4): o fundo ANTERIOR desvanece por cima do novo
                — reusa os seletores reais (.avst5-viewport[data-fundo] .avst5-palco) */}
            {fadeFundo && (
              <div className="avst5-viewport avst5-cen-fade" data-fundo={fadeFundo} aria-hidden data-teste="cen-fade">
                <div className="avst5-palco" />
              </div>
            )}
            {/* lote 201 (§163): overlay de CLIMA — extraído p/
                workspace/ClimaOverlay (decisão #91, fase 3); 'limpo'
                devolve null lá (mesma condição de antes, byte a byte) */}
            {!palco3d && <ClimaOverlay clima={clima} movReduzido={movReduzido} />}
            {/* AS6 §52 (as6.viewport): presets de câmera do palco 2D */}
            {flagViewport && !palco3d && (
              <div className="avst6-cam" role="group" aria-label="Câmera (§52)" data-teste="cam6-chips">
                {([['auto', 'Auto'], ['rosto', 'Rosto'], ['busto', 'Busto'], ['corpo', 'Corpo']] as const).map(([id, nome]) => (
                  <button key={id} type="button" className="avst-ft-chip" aria-pressed={cam6 === id}
                    data-teste={`cam6-${id}`} onClick={() => escolherCam6(id)}>{nome}</button>
                ))}
              </div>
            )}
            {palco3d ? (
              <Palco3d estado={estadoDraft} movReduzido={movReduzido} sinalApresentar={sinal3d}
                aoUsarComoAvatar={aoSalvarFotoLegado} />
            ) : (
              <div className={`avst5-palco${poderAtivo ? ' avst5-palco-climax' : ''}`}
                style={palcoV2 && propsCen.luz !== 1 ? { filter: `brightness(${propsCen.luz})` } : undefined}>
                {/* mega 233 (§161): profundidade (vinheta) + cor ambiente —
                    overlay do CENÁRIO, nunca serializado no avatar */}
                {palcoV2 && (propsCen.profundidade > 0 || propsCen.ambiente !== 'nenhuma') && (
                  <div className="avst5-cenprop" aria-hidden data-teste="cenario-props-overlay"
                    style={{
                      ...(propsCen.profundidade > 0
                        ? { boxShadow: `inset 0 0 ${Math.round(40 + propsCen.profundidade * 120)}px rgba(0,0,0,${(propsCen.profundidade * 0.55).toFixed(2)})` }
                        : {}),
                      ...(propsCen.ambiente !== 'nenhuma'
                        ? { background: `radial-gradient(ellipse 80% 70% at 50% 40%, ${COR_AMBIENTE[propsCen.ambiente]}22, transparent 75%)` }
                        : {}),
                    }} />
                )}
                <div className="avst5-zoom" style={zoomEstilo}>
                  <AvatarSvg config={configPalco} uid="avst5" estatico={movReduzido} />
                </div>
              </div>
            )}
            {comparando && (
              <div className="avst5-comparando" role="status">Original salvo · solte para voltar</div>
            )}
            {/* megas 591–593 (§64.2, flag as5.ux_final): badge de prévia com
                fixar/soltar — comparar detalhes sem segurar o hover */}
            {flag('as5.ux_final') && (previaAtiva || previaFixa) && !comparando && (
              <div className="avst5-previa-badge" data-teste="previa-badge" role="status">
                <span>{previaFixa ? t('Prévia fixada') : t('Prévia')}</span>
                {previaFixa
                  ? (
                    <button type="button" data-teste="previa-soltar"
                      onClick={soltarPrevia}>{t('Soltar')}</button>
                  ) : (
                    <button type="button" data-teste="previa-fixar"
                      onClick={fixarPrevia}>{t('Fixar prévia')}</button>
                  )}
              </div>
            )}
            {celebrando && (
              <div className="avst5-celebracao" aria-hidden data-teste="celebracao"
                dangerouslySetInnerHTML={{
                  // megas 354-355 (§157.3/§158.1, flag as5.efeitos_v2): a
                  // celebração do gatilho usa a biblioteca §156 na COR do
                  // avatar; flag off = confete legado byte a byte
                  // megas 445-446 (§158.1, flag as5.editor_efeitos): o TIPO
                  // da celebração é configurável (paleta); 'legado' = confete
                  __html: (() => {
                    const tipoPref = flag('as5.editor_efeitos')
                      ? (() => { try { return localStorage.getItem('dshow.avst5.gatilho.v1') ?? 'pontos'; } catch { return 'pontos'; } })()
                      : 'pontos';
                    if (!flag('as5.efeitos_v2') || tipoPref === 'legado') return svgEfeitoIsolado('efe_confete');
                    const tipo = (['pontos', 'estrelas', 'pixels', 'faiscas'].includes(tipoPref) ? tipoPref : 'pontos') as 'pontos' | 'estrelas' | 'pixels' | 'faiscas';
                    return svgParticulas(tipo, {
                      // #104: densidade segue o Quality Manager (×1 sem a flag)
                      quantidade: Math.max(8, Math.round(34 * qualidade().particulas)), tamanho: 6, velocidade: 1.3, direcao: 'explodir',
                      cor: configVisivel.cores.destaque, opacidade: 0.9, duracaoMs: 1600, turbulencia: 0.3,
                    }, 'medio', 5);
                  })(),
                }} />
            )}
            {poderAtivo && (
              <div className="avst5-celebracao avst5-poder" aria-hidden data-teste="poder-ativo"
                dangerouslySetInnerHTML={{ __html: svgEfeitoIsolado(poderAtivo, configVisivel.cores.destaque) }} />
            )}
            {/* megas 283–287 (§153.1–.4 + §156): ROTEIRO da família — campo
                de partículas próprio por cima do efeito; movimento reduzido
                = poses estáticas (a biblioteca não anima) */}
            {podFamilia && poderAtivo && (
              <div className="avst5-celebracao avst5-poder-part" aria-hidden
                data-teste="poder-particulas" data-familia={familiaDoPoder(poderAtivo)}
                dangerouslySetInnerHTML={{
                  __html: svgRoteiroFamilia(familiaDoPoder(poderAtivo), configVisivel.cores.destaque, 'medio', !movReduzido),
                }} />
            )}
            {/* mega 235 (§154 item 7): NOME do poder durante a reprodução */}
            {palcoV2 && poderAtivo && metaPoder && (
              <div className="avst5-poder-nome" role="status" aria-live="polite" data-teste="poder-nome"
                style={{ '--avst-rar': RARIDADES[metaPoder.raridade].cor } as React.CSSProperties}>
                <Sparkles size={12} aria-hidden /> {metaPoder.nome}
                <small>
                  {RARIDADES[metaPoder.raridade].nome}
                  {/* mega 288 (§153): família visível na placa do poder */}
                  {podFamilia && <> · {ROTULO_FAMILIA[familiaDoPoder(poderAtivo)]}</>}
                </small>
              </div>
            )}
            {anuncio && !comparando && (
              <div className="avst5-anuncio" role="status" aria-live="polite">{anuncio}</div>
            )}
            {rascunho && (
              <div className="avst5-rascunho" role="alertdialog" aria-label="Rascunho recuperado" data-teste="rascunho">
                <span>
                  Recuperamos um rascunho de{' '}
                  {new Date(rascunho.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
                  Deseja continuar?
                </span>
                <button type="button" className="avst-botao avst-botao-primario"
                  onClick={() => { aplicarComando(validarConfig(rascunho.config)); setRascunho(null); }}>
                  Continuar
                </button>
                <button type="button" className="avst-botao"
                  onClick={() => { limparRascunho(); setRascunho(null); }}>
                  Descartar
                </button>
              </div>
            )}
            {outraAba && (
              <div className="avst5-outra-aba" role="status">
                Outra aba também está editando este avatar — a última que salvar prevalece.
                <button type="button" onClick={() => setOutraAba(false)} aria-label="Entendi">
                  <X size={12} aria-hidden />
                </button>
              </div>
            )}
            {store.temMudancas && modo === 'edicao' && (
              <button type="button" className="avst5-comparar" title="Segure para ver o original (V)"
                onPointerDown={() => setComparando(true)}
                onPointerUp={() => setComparando(false)}
                onPointerLeave={() => setComparando(false)}>
                <Eye size={13} aria-hidden /> Original
              </button>
            )}
            {modo !== 'edicao' && (
              <button type="button" className="avst5-sair-modo" title="Voltar à edição (Esc)"
                onClick={() => setModo('edicao')}><X size={14} aria-hidden /> Sair</button>
            )}
            <button type="button" className="avst5-drawer-abrir" title="Abrir catálogo"
              onClick={() => setPainelFechado(false)}><LayoutGrid size={16} aria-hidden /></button>
            {modo === 'studio' && (
              <button type="button" className="avst5-comparar avst5-capturar" title="Baixar PNG do palco (§174.1)"
                onClick={() => void capturarPalco()}>
                <Camera size={13} aria-hidden /> {t('Capturar')}
              </button>
            )}
            {modo === 'studio' && (
              <button type="button" className="avst5-comparar avst5-poder-btn" data-teste="ativar-poder"
                data-fase={palcoV2 ? poderFase : undefined}
                title={!idPoder ? 'Equipe um efeito ou aura para ativar'
                  : palcoV2 && movReduzido ? 'Indisponível com redução de movimento (§154.1)'
                    : palcoV2 && poderFase === 'cooldown' ? 'Recarregando… replay em instantes (§154.1)'
                      : 'Ativar o poder equipado (§154)'}
                disabled={!idPoder || poderAtivo !== null || (palcoV2 && (poderFase !== 'pronto' || movReduzido))}
                onClick={ativarPoder}>
                <Sparkles size={13} aria-hidden />
                {palcoV2 && poderFase === 'cooldown' ? ' Recarregando…' : ' Poder'}
              </button>
            )}
            {/* barra de cenas §180/§185 — extraída p/ workspace/BarraCenas (decisão #93) */}
            {modo === 'studio' && (
              <BarraCenas
                fundo={fundo} hora={hora} luz={luz} clima={clima}
                trocarFundo={trocarFundo} trocarHora={trocarHora}
                trocarLuz={trocarLuz} trocarClima={trocarClima}
                ultimaCena={ultimaCena} configVisivel={configVisivel}
                histPalco={histPalco} restaurarComposicao={restaurarComposicao} />
            )}
            {modo === 'studio' && (
              <div className="avst5-emotes" role="group" aria-label="Emotes (§120)" data-teste="emotes">
                {EMOTES.map((e) => (
                  <button key={e.id} type="button" title={`Emote ${e.id} (expressão por 2s)`}
                    onClick={() => fazerEmote(e)}>{e.rotulo}</button>
                ))}
              </div>
            )}
            {modo === 'studio' && configVisivel.titulo && (
              /* mega 239 (§171.3/§172): selo do título com nome REAL do
                 catálogo + raridade; alinhamento/escala editáveis (locais);
                 títulos com trava de conquista ficam PROTEGIDOS (§172) */
              <div className={`avst5-titulo-selo${palcoV2 ? ` avst5-ts-${tituloPalco.alinhamento} avst5-ts-${tituloPalco.escala}` : ''}`}
                role="note" data-teste="titulo-selo"
                style={palcoV2 && metaTitulo ? { '--avst-rar': RARIDADES[metaTitulo.raridade].cor } as React.CSSProperties : undefined}>
                {palcoV2 && metaTitulo ? metaTitulo.nome : String(configVisivel.titulo).replace(/^tit_/, '').replace(/_/g, ' ')}
              </div>
            )}
            {modo === 'studio' && palcoV2 && configVisivel.titulo && (
              <div className="avst5-fundos avst5-titulo-editor" role="group" aria-label="Editor de título (§172)" data-teste="titulo-editor">
                {(['esquerda', 'centro', 'direita'] as const).map((al) => (
                  <button key={al} type="button" role="radio" aria-checked={tituloPalco.alinhamento === al}
                    className={tituloPalco.alinhamento === al ? 'avst5-fundo-on' : ''}
                    data-teste={`titulo-al-${al}`}
                    onClick={() => mudarTituloPalco({ alinhamento: al })}>{al === 'esquerda' ? '⯇' : al === 'centro' ? '·' : '⯈'}</button>
                ))}
                {(['p', 'm', 'g'] as const).map((es) => (
                  <button key={es} type="button" role="radio" aria-checked={tituloPalco.escala === es}
                    className={tituloPalco.escala === es ? 'avst5-fundo-on' : ''}
                    data-teste={`titulo-esc-${es}`}
                    onClick={() => mudarTituloPalco({ escala: es })}>{es.toUpperCase()}</button>
                ))}
                {(metaTitulo?.raridade === 'exclusivo' || metaTitulo?.raridade === 'lendario') && (
                  <span className="avst5-titulo-protegido" data-teste="titulo-protegido"
                    title="Título de conquista — aparência protegida (§172)">🔒</span>
                )}
              </div>
            )}
            {/* composição do palco §160–§165/§590 — extraída p/
                workspace/ComposicaoPalco (decisão #93, fase 3b) */}
            <ComposicaoPalco
              tema={tema} trocarTema={trocarTema}
              fundo={fundo} trocarFundo={trocarFundo}
              hora={hora} trocarHora={trocarHora}
              luz={luz} trocarLuz={trocarLuz}
              clima={clima} trocarClima={trocarClima}
              luzAuto={luzAuto} mudarLuzAuto={mudarLuzAuto}
              luzInt={luzInt} mudarLuzInt={mudarLuzInt}
              propsCen={propsCen} mudarPropsCen={mudarPropsCen}
              dispararEntrada={dispararEntrada}
              palcoV2={palcoV2} palco3d={palco3d} sensorial={sensorial}
              controlesTravados={controlesTravados} movReduzido={movReduzido} />
            <BarraSalvamento store={store} aoSalvar={async () => {
              const r = await aoSalvarLegado(paraLegado2d(store.estadoDraft));
              if (r.ok) {
                store.confirmarPersistencia(r.versao ?? store.versao + 1);
                void espelhar619(true); // §619: versão publicada no espelho
                registrarMarco(paraLegado2d(store.estadoDraft), 'salvo'); // §241
                { // lote 199 (§250): missão concluída no salvar → anúncio
                  const novas = avaliarMissoes(paraLegado2d(store.estadoDraft));
                  if (novas.length) {
                    setAnuncio(`Missão concluída: ${novas.join(', ')} — badge liberado!`);
                    telemetria('missao_concluida', { ids: novas.join(',') }); // §290
                  }
                }
                celebrar(); // §158: gatilho de celebração
                tocarSalvar(); // §584: acorde de salvamento
                telemetria('funil', { etapa: 'salvou' }); // mega 106 (§294)
              }
              return r.ok;
            }} />
          </main>

          <div className="avst5-alca" role="separator" aria-orientation="vertical" aria-label="Redimensionar catálogo"
            onPointerDown={(e) => { arraste.current = { lado: 'dir', x0: e.clientX, w0: larguras.dir }; }} />
          {/* painel direito — workspace com scroll INTERNO (R4/R5) */}
          {/* painel direito — extraído p/ workspace/PainelCatalogo (decisão #85) */}
          <PainelCatalogo painelFechado={painelFechado} setPainelFechado={setPainelFechado}
            painelLargo={painelLargo} setPainelLargo={setPainelLargo}
            aba={aba} setAba={setAba} categoria={categoria} setCategoria={setCategoria}
            filtroSlot={filtroSlot} setFiltroSlot={setFiltroSlot}
            configVisivel={configVisivel} configDraft={configDraft}
            aoEscolher={aoEscolher} aoPrever={aoPrever} resumoAcessorios={resumoAcessorios}
            store={store} aplicarComando={aplicarComando}
            bloqueios={bloqueios} setBloqueios={setBloqueios}
            aoMudarFavs={() => setTicFavs((t) => t + 1)}
            historico={historico} desbloqueados={desbloqueados} setDetalheId={setDetalheId} />
        </div>
        {tour && <TourGuiado aoFechar={() => setTour(false)} />}
        <Suspense fallback={null}>
        {atalhos && <Atalhos aoFechar={() => setAtalhos(false)} />}
        {telemetriaDev && <TelemetriaDev aoFechar={() => setTelemetriaDev(false)} />}
        {cmsRo && <CmsRo aoFechar={() => setCmsRo(false)} />}
        {consultor && (
          <Consultor config={validarConfig(paraLegado2d(store.estadoDraft))}
            desbloqueados={desbloqueados}
            aoAplicar={(novo) => { aplicarComando(validarConfig(novo)); }}
            aoPrever={aoPrever}
            aoFechar={() => setConsultor(false)} />
        )}
        {versoes619 && (
          <VersoesAvatar estadoLocal={store.estadoDraft}
            aoAplicarEstado={(novo) => aplicarComando(validarConfig(paraLegado2d(novo)))}
            aoFechar={() => setVersoes619(false)} />
        )}
        {evolucao && (
          <Evolucao configAtual={validarConfig(paraLegado2d(store.estadoDraft))}
            aoAplicar={(cfg) => aplicarComando(validarConfig(cfg))}
            aoFechar={() => setEvolucao(false)} />
        )}
        {missoes && (
          <Missoes config={validarConfig(paraLegado2d(store.estadoDraft))}
            aoFechar={() => setMissoes(false)} />
        )}
        {timeline && (
          <TimelineShell aoFechar={() => setTimeline(false)}
            aoAbrirEvolucao={() => setEvolucao(true)} />
        )}
        {paleta && (
          <PaletaComandos
            aoFechar={() => setPaleta(false)}
            aoNavegar={(cat) => {
              setCategoria(cat as CategoriaId); setAba('todos'); setFiltroSlot('todos');
              if (flag('as6.contexto')) aplicarContexto(cat as CategoriaId); // §324
            }}
            aoEquipar={(id) => {
              const item = itemPorId(id);
              if (item) aoEscolher(comItem(paraLegado2d(store.estadoDraft), item.categoria, id));
            }}
            acoes={[
              { id: 'aleatorio', rotulo: 'Randomizar (aleatório completo)', executar: () => rodarAleatorio('completo') },
              { id: 'apresentar', rotulo: 'Apresentar (Showcase §174)', executar: () => void apresentar() },
              { id: 'capturar', rotulo: 'Capturar PNG do palco', executar: () => { setModo('studio'); setTimeout(() => void capturarPalco(), 150); } },
              { id: 'desfazer', rotulo: 'Desfazer última ação', executar: () => store.desfazer() },
              { id: 'refazer', rotulo: 'Refazer', executar: () => store.refazer() },
              { id: 'foco', rotulo: 'Alternar modo Foco', executar: () => setModo((m) => (m === 'foco' ? 'edicao' : 'foco')) },
              { id: 'studio', rotulo: 'Alternar modo Studio', executar: () => setModo((m) => (m === 'studio' ? 'edicao' : 'studio')) },
              { id: 'presets', rotulo: 'Abrir meus Presets', executar: () => setAba('presets') },
              { id: 'equipados', rotulo: 'Abrir Equipados', executar: () => setAba('equipados') },
              // mega 35: o 3D e a folha de atalhos entram na paleta §566
              ...(flagPalco3d ? [{
                id: 'palco3d',
                rotulo: palco3d ? 'Desligar a prévia 3D' : 'Ligar a prévia 3D',
                executar: () => setPalco3d((v) => !v),
              }] : []),
              // mega 71 (§117): personalidades na paleta
              ...PERSONALIDADES.map((p) => ({
                id: `pers-${p.id}`,
                rotulo: `Personalidade: ${p.nome}`,
                executar: () => aplicarPersonalidade(p),
              })),
              // mega 88: cenário/hora/luz também pela paleta (§566)
              ...FUNDOS_PALCO.map((f) => ({
                id: `cen-${f}`, rotulo: `Cenário: ${ROTULO_FUNDO[f]}`, executar: () => trocarFundo(f),
              })),
              ...HORAS_PALCO.map((h) => ({
                id: `hora-${h}`, rotulo: `Hora do dia: ${ROTULO_HORA[h]}`, executar: () => trocarHora(h),
              })),
              ...LUZES_PALCO.map((l) => ({
                id: `luz-${l}`, rotulo: `Iluminação: ${ROTULO_LUZ[l]}`, executar: () => trocarLuz(l),
              })),
              // mega 298 (§566 v2): o poder também sai da paleta
              ...(flag('as5.microinteracoes') && idPoder ? [{
                id: 'poder',
                rotulo: `Ativar poder: ${metaPoder?.nome ?? 'equipado'} (§154)`,
                executar: () => { setModo('studio'); setTimeout(() => window.dispatchEvent(new CustomEvent('avst5:ativar-poder')), 200); },
              }] : []),
              // megas 447-448 (§158.1, flag as5.editor_efeitos): gatilho
              ...(flag('as5.editor_efeitos') ? (['pontos', 'estrelas', 'pixels', 'faiscas', 'legado'] as const).map((tp) => ({
                id: `gatilho-${tp}`,
                rotulo: `Celebração ao salvar: ${tp === 'legado' ? 'confete clássico' : tp} (§158.1)`,
                executar: () => { try { localStorage.setItem('dshow.avst5.gatilho.v1', tp); } catch { /* sem storage */ } },
              })) : []),
              { id: 'atalhos', rotulo: 'Atalhos do teclado (?)', executar: () => setAtalhos(true) },
              // mega 46: viewer de telemetria (só com a flag dev ligada)
              ...(flag('as5.telemetria_painel') ? [{
                id: 'telemetria', rotulo: 'Telemetria local (dev)', executar: () => setTelemetriaDev(true),
              }] : []),
              ...(flag('as6.cms_ro') ? [{
                id: 'cms-ro', rotulo: 'CMS do catálogo (admin, leitura)', executar: () => setCmsRo(true),
              }] : []),
              { id: 'classico', rotulo: 'Voltar ao modo clássico', executar: aoSairDoShell },
            ]} />
        )}
        {detalheId && (
          <DetalheAsset id={detalheId} config={validarConfig(paraLegado2d(store.estadoDraft))} desbloqueados={desbloqueados}
            aoEscolher={aoEscolher} aoPrever={aoPrever} aoFechar={() => setDetalheId(null)} />
        )}
        </Suspense>
        {conflito && (
          <div className="avst5-modal-fundo" role="dialog" aria-modal="true" aria-label="Conflito de equipamento">
            <div className="avst5-modal">
              <p>
                {conflito.depois
                  ? <>Equipar este item vai <strong>substituir</strong> o que está no slot{bloqueios.has(conflito.slot) ? ' BLOQUEADO' : ''}.</>
                  : <>Este slot está <strong>bloqueado</strong> — remover mesmo assim?</>}
              </p>
              <div className="avst5-modal-acoes">
                <button type="button" className="avst-botao"
                  onClick={() => { store.limparPreview(); setConflito(null); }}>Cancelar</button>
                <button type="button" className="avst-botao avst-botao-primario"
                  onClick={() => { aplicarComando(conflito.novo); setConflito(null); }}>
                  {conflito.depois ? 'Equipar e substituir' : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LimiteShell>
  );
}

/** rótulo curto do comando: qual categoria mudou. */
function novoDiff(antes: AvatarConfig, depois: AvatarConfig): string {
  if (antes.base !== depois.base) return 'base';
  const chaves = new Set([...Object.keys(antes.camadas), ...Object.keys(depois.camadas)]);
  for (const k of chaves) {
    if ((antes.camadas as Record<string, string>)[k] !== (depois.camadas as Record<string, string>)[k]) return k;
  }
  return 'config';
}
