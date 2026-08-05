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
import { ArrowUp, Boxes, Camera, ChevronsLeft, ChevronsRight, Clapperboard, Dices, Eye, Flag, Focus, GitBranch, History, LayoutGrid, Lightbulb, Palette, Play, Redo2, ShieldAlert, Sparkles, Undo2, Volume2, VolumeX, X } from 'lucide-react';
import type { AvatarConfig, CategoriaId, SlotAcessorio } from '../domain/types';
import { CATEGORIAS, COLECOES, RARIDADES, aleatorioInteligente, itemPorId, nivelRaridade, svgEfeitoIsolado, tituloPorId, validarConfig } from '../services/AvatarCatalog';
import type { ModoAleatorio } from '../services/AvatarCatalog';
import { favoritos } from '../services/Progresso';
import { conectarTelemetria } from '../services/ObservarNucleo';
import { definirSom, somAtivo, tocarCapturar, tocarEquipar, tocarPoder, tocarSalvar } from '../services/Som';
import { AvatarStore } from '../nucleo/estado';
import type { Comando } from '../nucleo/estado';
import { checksumEstado } from '../nucleo/contratos';
import { deLegado2d, paraLegado2d } from '../nucleo/adaptadores';
import { AvatarSvg } from '../components/AvatarSvg';
import { GradeItens, comItem } from '../components/GradeItens';
import type { AbaCatalogo } from '../components/GradeItens';
import { Cores } from '../components/Cores';
import { Equipados, alternarBloqueio, lerBloqueios } from './Equipados';
import { PropriedadesAsset } from './PropriedadesAsset';
import { PresetsShell } from './PresetsShell';
import { Evolucao } from './Evolucao';
import { incrementar } from '../services/Contadores'; // mega 246 (§221)
import { avaliarMissoes } from '../services/Missoes';
import { registrarMarco } from '../services/Evolucao';
import { TourGuiado, tourJaVisto } from './TourGuiado';
import { Palco3d } from './Palco3d';
import { flag } from '../nucleo/flags';

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
import { HistoricoSessao, useHistoricoSessao } from './HistoricoSessao';
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
const CHIPS_SLOT: Array<{ id: 'todos' | SlotAcessorio; nome: string }> = [
  { id: 'todos', nome: 'Todos' },
  { id: 'cabeca', nome: 'Cabeça' },
  { id: 'rosto', nome: 'Rosto' },
  { id: 'pescoco', nome: 'Pescoço' },
];

const CHAVE_LARGURAS = 'dshow.avst5.larguras.v1';
const CHAVE_FUNDO = 'dshow.avst5.fundo.v1';
// §590 (P9): TEMAS de acento do estúdio — preferência local, nunca flag
const CHAVE_TEMA = 'dshow.avst5.tema.v1';
const TEMAS = [
  { id: 'roxo', nome: 'Roxo', cor: '#7c5cff' },
  { id: 'verde', nome: 'Verde', cor: '#39d98a' },
  { id: 'ambar', nome: 'Âmbar', cor: '#e8b64c' },
  { id: 'ciano', nome: 'Ciano', cor: '#4cd9e8' },
] as const;
type TemaId = (typeof TEMAS)[number]['id'];

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

/** R1 (P1 §9.3) + mega 60 (§160): CENÁRIOS do palco — os 3 clássicos
 *  seguem intactos; dojo/neon/galáxia são os prioritários do briefing. */
const FUNDOS_CLASSICOS = ['neutro', 'estudio', 'grade', 'dojo', 'neon', 'galaxia'] as const;
// mega 231 (§160.1–.4): cenários PRIORITÁRIOS v2 (flag as5.palco_v2) —
// um por família do briefing: Dshow/corporativo/gamer/sci-fi
const FUNDOS_V2 = ['showroom', 'escritorio', 'arena', 'cyberpunk'] as const;
const FUNDOS_PALCO = [...FUNDOS_CLASSICOS, ...FUNDOS_V2] as const;
type FundoPalco = (typeof FUNDOS_PALCO)[number];
const ROTULO_FUNDO: Record<FundoPalco, string> = {
  neutro: 'Neutro', estudio: 'Estúdio', grade: 'Grade',
  dojo: 'Dojo', neon: 'Neon', galaxia: 'Galáxia',
  showroom: 'Showroom LED', escritorio: 'Escritório', arena: 'Arena', cyberpunk: 'Cyberpunk',
};
// mega 61 (§162): HORA DO DIA — modificador de luz do cenário
const HORAS_CLASSICAS = ['dia', 'tarde', 'noite'] as const;
// mega 232 (§162): horas v2 (flag as5.palco_v2)
const HORAS_V2 = ['amanhecer', 'por-do-sol', 'madrugada'] as const;
const HORAS_PALCO = [...HORAS_CLASSICAS, ...HORAS_V2] as const;
type HoraPalco = (typeof HORAS_PALCO)[number];
const ROTULO_HORA: Record<HoraPalco, string> = {
  dia: 'Dia', tarde: 'Tarde', noite: 'Noite',
  amanhecer: 'Amanhecer', 'por-do-sol': 'Pôr do sol', madrugada: 'Madrugada',
};
// mega 62 (§164): ILUMINAÇÃO 2D — presets de filtro sobre o avatar
const LUZES_PALCO = ['neutra', 'quente', 'fria', 'dramatica'] as const;
type LuzPalco = (typeof LUZES_PALCO)[number];
const ROTULO_LUZ: Record<LuzPalco, string> = { neutra: 'Neutra', quente: 'Quente', fria: 'Fria', dramatica: 'Dramática' };
const CHAVE_HORA = 'dshow.avst5.palco.hora.v1';
const CHAVE_LUZ = 'dshow.avst5.palco.luz.v1';
// lote 201 (§163): CLIMA do palco — overlay determinístico sobre o cenário
const CLIMAS_PALCO = ['limpo', 'chuva', 'neve', 'nevoa'] as const;
type ClimaPalco = (typeof CLIMAS_PALCO)[number];
const ROTULO_CLIMA: Record<ClimaPalco, string> = { limpo: 'Limpo', chuva: 'Chuva', neve: 'Neve', nevoa: 'Névoa' };
const CHAVE_CLIMA = 'dshow.avst5.palco.clima.v1';

// mega 233–234 (§161): PROPRIEDADES DO CENÁRIO — preferências LOCAIS do
// palco (nunca tocam o avatar salvo): intensidade de luz, profundidade
// (vinheta), cor ambiente (paleta aprovada) e movimento ("cenário vivo")
const AMBIENTES_CENARIO = ['nenhuma', 'azul', 'ambar', 'violeta', 'verde'] as const;
type AmbienteCenario = (typeof AMBIENTES_CENARIO)[number];
const COR_AMBIENTE: Record<Exclude<AmbienteCenario, 'nenhuma'>, string> = {
  azul: '#4c9de8', ambar: '#e8b64c', violeta: '#7c5cff', verde: '#39d98a',
};
// mega 257 (§119): IDLE 2D — respiração/flutuação/balanço do avatar no
// palco (preferência local; o render salvo é sempre estático)
const IDLES_2D = ['nenhum', 'respirar', 'flutuar', 'balancar'] as const;
type Idle2d = (typeof IDLES_2D)[number];
const ROTULO_IDLE: Record<Idle2d, string> = { nenhum: 'Parado', respirar: 'Respirar', flutuar: 'Flutuar', balancar: 'Balançar' };
interface PropsCenario { luz: number; profundidade: number; ambiente: AmbienteCenario; vivo: boolean; idle: Idle2d }
const CENARIO_NEUTRO: PropsCenario = { luz: 1, profundidade: 0, ambiente: 'nenhuma', vivo: false, idle: 'nenhum' };
const CHAVE_CENARIO_PROPS = 'dshow.avst5.palco.cenario.v1';
function lerPropsCenario(): PropsCenario {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_CENARIO_PROPS) ?? 'null');
    if (!b || typeof b !== 'object') return { ...CENARIO_NEUTRO };
    return {
      luz: typeof b.luz === 'number' ? Math.max(0.6, Math.min(1.4, b.luz)) : 1,
      profundidade: typeof b.profundidade === 'number' ? Math.max(0, Math.min(1, b.profundidade)) : 0,
      ambiente: (AMBIENTES_CENARIO as readonly string[]).includes(b.ambiente) ? b.ambiente : 'nenhuma',
      vivo: b.vivo === true,
      idle: (IDLES_2D as readonly string[]).includes(b.idle) ? b.idle : 'nenhum',
    };
  } catch { return { ...CENARIO_NEUTRO }; }
}
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
// mega 65 (§180): PRESETS DE APRESENTAÇÃO {fundo, hora, luz}
const CHAVE_APRESENTACAO = 'dshow.avst5.apresentacao.v1';
interface PresetApresentacao { id: string; nome: string; fundo: FundoPalco; hora: HoraPalco; luz: LuzPalco; clima?: ClimaPalco }
function lerApresentacoes(): PresetApresentacao[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_APRESENTACAO) ?? '[]');
    return Array.isArray(b) ? b.filter((p): p is PresetApresentacao =>
      !!p && typeof p.id === 'string' && typeof p.nome === 'string'
      && (FUNDOS_PALCO as readonly string[]).includes(p.fundo)
      && (HORAS_PALCO as readonly string[]).includes(p.hora)
      && (LUZES_PALCO as readonly string[]).includes(p.luz)
      && (p.clima === undefined || (CLIMAS_PALCO as readonly string[]).includes(p.clima))).slice(0, 6) : [];
  } catch { return []; }
}
function gravarApresentacoes(l: PresetApresentacao[]): void {
  try { localStorage.setItem(CHAVE_APRESENTACAO, JSON.stringify(l.slice(0, 6))); } catch { /* sem storage */ }
}
// lote 175–176 (§185): HISTÓRICO de apresentação — restaurar composição completa
const CHAVE_HIST_PALCO = 'dshow.avst5.palco.hist.v1';
interface ComposicaoPalco { fundo: FundoPalco; hora: HoraPalco; luz: LuzPalco; clima?: ClimaPalco }
function lerHistPalco(): ComposicaoPalco[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_HIST_PALCO) ?? '[]');
    return Array.isArray(b) ? b.filter((h): h is ComposicaoPalco =>
      !!h && (FUNDOS_PALCO as readonly string[]).includes(h.fundo)
      && (HORAS_PALCO as readonly string[]).includes(h.hora)
      && (LUZES_PALCO as readonly string[]).includes(h.luz)
      && (h.clima === undefined || (CLIMAS_PALCO as readonly string[]).includes(h.clima))).slice(-10) : [];
  } catch { return []; }
}
// lote 174 (§179): ponte Coleção → Cenário ("itens sugerem ambiente")
const COLECAO_CENARIO: Partial<Record<string, FundoPalco>> = {
  col_cyber_nexus: 'neon', col_neon_noturno: 'neon', col_dojo: 'dojo',
  col_galaxia: 'galaxia', col_oito_bits: 'grade', col_executivo: 'estudio',
};
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
  // R7/R8: modos do palco — edicao | foco (F/Esc) | studio (apresentação)
  const [modo, setModo] = useState<'edicao' | 'foco' | 'studio'>('edicao');
  const [painelLargo, setPainelLargo] = useState(false);
  const [painelFechado, setPainelFechado] = useState(false);
  const [mostrarTopo, setMostrarTopo] = useState(false);
  const [propriedades, setPropriedades] = useState(false);
  const [bloqueios, setBloqueios] = useState<Set<string>>(() => lerBloqueios());
  const [, setTicFavs] = useState(0); // re-render após favoritar no Equipados
  // §69.1: conflito pendente aguardando decisão do usuário
  const [conflito, setConflito] = useState<{ novo: AvatarConfig; slot: string; antes: string; depois: string } | null>(null);
  const refPainel = useRef<HTMLDivElement>(null);
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
  const enquadramento = ENQUADRAMENTOS[categoria];
  const zoomEstilo = useMemo(() => {
    if (!enquadramento) return { transform: 'scale(1)', transformOrigin: '50% 50%' };
    const [x, y, w, h] = enquadramento;
    return {
      transform: `scale(${Math.min(2.4, 240 / Math.max(w, h))})`,
      transformOrigin: `${((x + w / 2) / 240) * 100}% ${((y + h / 2) / 240) * 100}%`,
    };
  }, [enquadramento]);

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
  const trocarLuz = (l: LuzPalco) => {
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

  // lote 174 (§179): itens de coleção sugerem o AMBIENTE correspondente
  const sugestaoCenario = useMemo(() => {
    const equipados = new Set(Object.values(configVisivel.camadas).filter(Boolean) as string[]);
    for (const [colId, fundoSug] of Object.entries(COLECAO_CENARIO)) {
      const col = COLECOES.find((c) => c.id === colId);
      if (!col || !fundoSug || fundo === fundoSug) continue;
      if (col.itens.filter((i) => equipados.has(i)).length >= 2) return { col, fundoSug };
    }
    return null;
  }, [configVisivel, fundo]);

  // lote 205 (§179): ponte Clima→Iluminação (chuva pede luz fria; névoa, dramática)
  const sugestaoLuz = useMemo(() => {
    if (clima === 'chuva' && luz !== 'fria') return { luzSug: 'fria' as LuzPalco, motivo: 'a chuva' };
    if (clima === 'nevoa' && luz !== 'dramatica') return { luzSug: 'dramatica' as LuzPalco, motivo: 'a névoa' };
    return null;
  }, [clima, luz]);

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
  const [poderAtivo, setPoderAtivo] = useState<string | null>(null);
  const [poderFase, setPoderFase] = useState<'pronto' | 'reproduzindo' | 'cooldown'>('pronto');
  const idPoder = configVisivel.camadas.efeito ?? configVisivel.camadas.aura ?? null;
  const metaPoder = useMemo(() => (idPoder ? itemPorId(idPoder) : undefined), [idPoder]);
  const ativarPoder = useCallback(() => {
    if (!idPoder || poderAtivo) return;
    if (palcoV2 && (poderFase !== 'pronto' || movReduzido)) return;
    setPoderAtivo(idPoder);
    telemetria('palco_poder', { id: idPoder }); // §290
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

  // megas 233–234 (§161): propriedades do cenário (locais, flag v2)
  const [propsCen, setPropsCen] = useState<PropsCenario>(lerPropsCenario);
  const [cenAberto, setCenAberto] = useState(false);
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

  // mega 65 (§180): presets de APRESENTAÇÃO (fundo+hora+luz num clique)
  const [apresentacoes, setApresentacoes] = useState<PresetApresentacao[]>(lerApresentacoes);
  const salvarApresentacao = useCallback(() => {
    const atuais = lerApresentacoes();
    if (atuais.length >= 6) return;
    const nova: PresetApresentacao = {
      id: `ap_${Date.now().toString(36)}`, nome: `Cena ${atuais.length + 1}`, fundo, hora, luz,
      ...(clima !== 'limpo' ? { clima } : {}), // lote 204 (§180 v2 — compat)
    };
    gravarApresentacoes([...atuais, nova]);
    setApresentacoes(lerApresentacoes());
    telemetria('palco_apresentacao_salvou', { fundo, hora, luz, clima }); // §290
  }, [fundo, hora, luz, clima]);
  // lote 175–176 (§185): histórico do palco (ring ≤10, dedupe consecutivo)
  const [histPalco, setHistPalco] = useState<ComposicaoPalco[]>(lerHistPalco);
  useEffect(() => {
    const atual: ComposicaoPalco = { fundo, hora, luz, ...(clima !== 'limpo' ? { clima } : {}) };
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
  const restaurarComposicao = useCallback((h: ComposicaoPalco) => {
    trocarFundo(h.fundo); trocarHora(h.hora); trocarLuz(h.luz); trocarClima(h.clima ?? 'limpo');
    telemetria('palco_hist_restaurou', { fundo: h.fundo, hora: h.hora, luz: h.luz }); // §290
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lote 177 (§180): RENOMEAR preset de apresentação (inline)
  const [renomeandoAp, setRenomeandoAp] = useState<{ id: string; nome: string } | null>(null);
  const confirmarRenomear = useCallback(() => {
    if (!renomeandoAp) return;
    const nome = renomeandoAp.nome.replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 18).trim();
    if (nome) {
      gravarApresentacoes(lerApresentacoes().map((x) => (x.id === renomeandoAp.id ? { ...x, nome } : x)));
      setApresentacoes(lerApresentacoes());
    }
    setRenomeandoAp(null);
  }, [renomeandoAp]);

  const aplicarApresentacao = useCallback((p: PresetApresentacao) => {
    trocarFundo(p.fundo);
    trocarHora(p.hora);
    trocarLuz(p.luz);
    trocarClima(p.clima ?? 'limpo'); // lote 204
    telemetria('palco_apresentacao_aplicou', { nome: p.nome }); // §290
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const excluirApresentacao = useCallback((id: string) => {
    gravarApresentacoes(lerApresentacoes().filter((p) => p.id !== id));
    setApresentacoes(lerApresentacoes());
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
  const aoPrever = useCallback((cfg: AvatarConfig | null) => {
    if (cfg) store.visualizar(() => deLegado2d(cfg));
    else store.limparPreview();
  }, [store]);

  // §90: aleatório inteligente — bloqueios §70.1 NUNCA são trocados.
  // Aplica direto (sem modal §69.1): a proteção já aconteceu no sorteio.
  const [menuAleatorio, setMenuAleatorio] = useState(false);
  const rodarAleatorio = useCallback((modoAlea: ModoAleatorio) => {
    setMenuAleatorio(false);
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
  const [palco3d, setPalco3d] = useState(false);
  // mega 10: Apresentar delega ao showcase 3D quando o palco 3D está ativo
  const [sinal3d, setSinal3d] = useState(0);

    // §584 (P9): SOM no shell — reusa services/Som (WebAudio synth, sem
  // assets); preferência única compartilhada com o modo clássico
  const [somLigado, setSomLigado] = useState(somAtivo);
  const alternarSom = useCallback(() => {
    setSomLigado((v) => { definirSom(!v); return !v; });
  }, []);

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
      const canvas = document.createElement('canvas');
      canvas.width = 960; canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, 960, 960);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'dshow-showcase-960px.png';
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
        style={{ '--avst-acento': corTema, '--avst5-esq': `${larguras.esq}px`,
          '--avst5-dir': painelFechado ? '36px' : painelLargo ? '560px' : `${larguras.dir}px` } as React.CSSProperties}>
        {/* header interno (§626) */}
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
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('completo')}>Completo <small>respeita bloqueios</small></button>
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('categoria')}>Só esta categoria</button>
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('cores')}>Só cores</button>
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('favoritos')}>Dos favoritos</button>
                </div>
              </>)}
            </div>
            <button type="button" className="avst-botao" title="Modo foco (F)"
              aria-pressed={modo === 'foco'}
              onClick={() => setModo((m) => (m === 'foco' ? 'edicao' : 'foco'))}>
              <Focus size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" title="Modo Studio (apresentação)"
              aria-pressed={modo === 'studio'}
              onClick={() => setModo((m) => (m === 'studio' ? 'edicao' : 'studio'))}>
              <Clapperboard size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" title="Showcase — apresentação cinematográfica (§174)"
              data-teste="showcase" disabled={apresentando}
              onClick={() => { if (palco3d) setSinal3d((n) => n + 1); else void apresentar(); }}>
              <Play size={14} aria-hidden /> Apresentar</button>
            {flagPalco3d && (
              <button type="button" className="avst-botao" title="Prévia 3D (personagens curados)"
                aria-pressed={palco3d} data-teste="botao-3d"
                onClick={() => setPalco3d((v) => !v)}>
                <Boxes size={14} aria-hidden /> 3D</button>
            )}
            {flag('as5.consultor') && (
              <button type="button" className="avst-botao" title="Consultor de estilo — sugestões por regras (§232)"
                data-teste="consultor-abrir" onClick={() => setConsultor(true)}>
                <Lightbulb size={14} aria-hidden /></button>
            )}
            <button type="button" className="avst-botao" title="Missões e desafio da semana (§250)"
              data-teste="missoes-abrir" onClick={() => setMissoes(true)}>
              <Flag size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" title="Evolução do avatar — linha do tempo (§241)"
              data-teste="evolucao-abrir" onClick={() => setEvolucao(true)}>
              <GitBranch size={14} aria-hidden /></button>
            {flag('as5.timeline_shell') && (
              <button type="button" className="avst-botao" title="Linha do tempo — sua jornada (§220)"
                data-teste="timeline-abrir" onClick={() => setTimeline(true)}>
                <History size={14} aria-hidden /></button>
            )}
            <button type="button" className="avst-botao" title="Versões do avatar no espelho (§619)"
              data-teste="versoes-abrir" onClick={() => setVersoes619(true)}>
              <ArrowUp size={14} aria-hidden style={{ transform: 'rotate(180deg)' }} /></button>
            <button type="button" className="avst-botao" title={somLigado ? 'Silenciar sons' : 'Ligar sons'}
              aria-pressed={somLigado} data-teste="som-toggle" onClick={alternarSom}>
              {somLigado ? <Volume2 size={14} aria-hidden /> : <VolumeX size={14} aria-hidden />}</button>
            <button type="button" className="avst-botao" disabled={!store.podeDesfazer}
              title="Desfazer (Ctrl+Z)" onClick={() => store.desfazer()}><Undo2 size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" disabled={!store.podeRefazer}
              title="Refazer" onClick={() => store.refazer()}><Redo2 size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" title="Rever o tour do estúdio (§569)"
              data-teste="tour-abrir" onClick={() => setTour(true)}>?</button>
            <button type="button" className="avst-botao" onClick={aoSairDoShell}>Modo clássico</button>
          </div>
        </header>

        <div className="avst5-corpo">
          {/* sidebar esquerda — scroll próprio (R5) */}
          <nav className={`avst5-sidebar${compacta ? ' avst5-sidebar-compacta' : ''}`} aria-label="Categorias">
            {CATEGORIAS.map((c) => (
              <button key={c.id} type="button"
                className={`avst5-cat${categoria === c.id ? ' avst5-cat-on' : ''}`}
                title={c.nome} onClick={() => { setCategoria(c.id); setFiltroSlot('todos'); }}>
                <span className="avst5-cat-inicial" aria-hidden>{c.nome.slice(0, 1)}</span>
                {!compacta && <span>{c.nome}</span>}
              </button>
            ))}
          </nav>
          <div className="avst5-alca" role="separator" aria-orientation="vertical" aria-label="Redimensionar navegação"
            onPointerDown={(e) => { arraste.current = { lado: 'esq', x0: e.clientX, w0: larguras.esq }; }} />

          {/* viewport dominante (R1) — SEM scroll de página (R5) */}
          {/* mega 75 (§132): EDIÇÃO tem luz neutra garantida — cor fiel;
              a iluminação §164 só vale nos modos studio/foco */}
          <main className="avst5-viewport" aria-label="Palco do avatar" data-fundo={fundo}
            data-hora={hora} data-luz={modo === 'edicao' ? 'neutra' : luz} data-clima={clima}
            data-moldura-viva={!palco3d ? molduraViva : undefined}
            data-cen-vivo={palcoV2 && !palco3d && propsCen.vivo && !movReduzido ? '' : undefined}
            data-idle={flag('as5.criacao_avancada') && !palco3d && !movReduzido && propsCen.idle !== 'nenhum' ? propsCen.idle : undefined}>
            {/* lote 201 (§163): overlay de CLIMA — determinístico, sobre o cenário
                e atrás dos controles; reduced-motion desliga o movimento (§182) */}
            {clima !== 'limpo' && !palco3d && (
              <svg className="avst5-clima" aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" data-teste="clima-overlay">
                {clima === 'chuva' && Array.from({ length: 26 }, (_, i) => (
                  <line key={i} x1={(i * 61) % 400} y1={-20 - ((i * 37) % 60)} x2={((i * 61) % 400) - 8} y2={4 - ((i * 37) % 60)}
                    stroke="#9db4ff" strokeWidth="1.1" opacity="0.5">
                    {!movReduzido && (
                      <animateTransform attributeName="transform" type="translate" from="0 0" to="-40 340"
                        dur={`${(1.1 + (i % 5) * 0.14).toFixed(2)}s`} repeatCount="indefinite" />
                    )}
                  </line>
                ))}
                {clima === 'neve' && Array.from({ length: 22 }, (_, i) => (
                  <circle key={i} cx={(i * 73) % 400} cy={-8 - ((i * 41) % 40)} r={1.4 + (i % 3) * 0.7}
                    fill="#e6eaf2" opacity="0.75">
                    {!movReduzido && (
                      <animateTransform attributeName="transform" type="translate" from="0 0" to={`${(i % 2 ? 18 : -14)} 330`}
                        dur={`${(4 + (i % 6) * 0.8).toFixed(2)}s`} repeatCount="indefinite" />
                    )}
                  </circle>
                ))}
                {clima === 'nevoa' && (<>
                  <defs>
                    <linearGradient id="avst5nevoa" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#aeb6c9" stopOpacity="0.42" />
                      <stop offset="60%" stopColor="#aeb6c9" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#aeb6c9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="300" fill="url(#avst5nevoa)">
                    {!movReduzido && (
                      <animate attributeName="opacity" values="0.85;1;0.85" dur="7s" repeatCount="indefinite" />
                    )}
                  </rect>
                </>)}
              </svg>
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
            {celebrando && (
              <div className="avst5-celebracao" aria-hidden data-teste="celebracao"
                dangerouslySetInnerHTML={{ __html: svgEfeitoIsolado('efe_confete') }} />
            )}
            {poderAtivo && (
              <div className="avst5-celebracao avst5-poder" aria-hidden data-teste="poder-ativo"
                dangerouslySetInnerHTML={{ __html: svgEfeitoIsolado(poderAtivo, configVisivel.cores.destaque) }} />
            )}
            {/* mega 235 (§154 item 7): NOME do poder durante a reprodução */}
            {palcoV2 && poderAtivo && metaPoder && (
              <div className="avst5-poder-nome" role="status" data-teste="poder-nome"
                style={{ '--avst-rar': RARIDADES[metaPoder.raridade].cor } as React.CSSProperties}>
                <Sparkles size={12} aria-hidden /> {metaPoder.nome}
                <small>{RARIDADES[metaPoder.raridade].nome}</small>
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
                <Camera size={13} aria-hidden /> Capturar
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
            {modo === 'studio' && (
              <div className="avst5-apresenta" data-teste="apresentacoes">
                <span>Cenas:</span>
                {apresentacoes.map((p) => (
                  <span key={p.id} className="avst5-apresenta-item">
                    {renomeandoAp?.id === p.id ? (
                      <input autoFocus value={renomeandoAp.nome} maxLength={18}
                        aria-label="Novo nome da cena" data-teste="ap-renomear-input"
                        onChange={(ev) => setRenomeandoAp({ id: p.id, nome: ev.target.value })}
                        onBlur={confirmarRenomear}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') confirmarRenomear(); if (ev.key === 'Escape') setRenomeandoAp(null); }} />
                    ) : (
                      <button type="button" title={`${ROTULO_FUNDO[p.fundo]} · ${ROTULO_HORA[p.hora]} · ${ROTULO_LUZ[p.luz]} — duplo clique renomeia (§180)`}
                        data-teste="ap-aplicar"
                        onDoubleClick={() => setRenomeandoAp({ id: p.id, nome: p.nome })}
                        onClick={() => aplicarApresentacao(p)}>{p.nome}</button>
                    )}
                    <button type="button" aria-label={`Excluir ${p.nome}`}
                      onClick={() => excluirApresentacao(p.id)}>×</button>
                  </span>
                ))}
                <button type="button" data-teste="apresentacao-salvar" disabled={apresentacoes.length >= 6}
                  title="Guardar fundo+hora+luz atuais como cena (§180)"
                  onClick={salvarApresentacao}>+ salvar</button>
                {ultimaCena && (ultimaCena.fundo !== fundo || ultimaCena.hora !== hora || ultimaCena.luz !== luz) && (
                  <button type="button" data-teste="apresentacao-ultima"
                    title="Voltar à cena da última apresentação (§185)"
                    onClick={() => { trocarFundo(ultimaCena.fundo); trocarHora(ultimaCena.hora); trocarLuz(ultimaCena.luz); }}>
                    ↺ última</button>
                )}
                {sugestaoCenario && (
                  <button type="button" className="avst5-sugestao-cenario" data-teste="sugestao-cenario"
                    title={`§179: ${sugestaoCenario.col.nome} combina com o cenário ${ROTULO_FUNDO[sugestaoCenario.fundoSug]}`}
                    onClick={() => { trocarFundo(sugestaoCenario.fundoSug); telemetria('palco_sugestao_cenario', { col: sugestaoCenario.col.id }); }}>
                    ✦ {ROTULO_FUNDO[sugestaoCenario.fundoSug]} combina com {sugestaoCenario.col.nome}</button>
                )}
                {histPalco.length > 1 && (
                  <span className="avst5-hist-palco" data-teste="hist-palco">
                    <span aria-hidden>·</span>
                    {histPalco.slice(0, -1).slice(-3).reverse().map((h, i) => (
                      <button key={`${h.fundo}-${h.hora}-${h.luz}-${i}`} type="button" data-teste="hist-restaurar"
                        title={`Restaurar composição (§185): ${ROTULO_FUNDO[h.fundo]} · ${ROTULO_HORA[h.hora]} · ${ROTULO_LUZ[h.luz]}`}
                        onClick={() => restaurarComposicao(h)}>
                        ⤺ {ROTULO_FUNDO[h.fundo]}·{ROTULO_HORA[h.hora].slice(0, 3)}·{ROTULO_LUZ[h.luz].slice(0, 4)}{h.clima && h.clima !== 'limpo' ? `·${ROTULO_CLIMA[h.clima]}` : ''}</button>
                    ))}
                  </span>
                )}
              </div>
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
                  onClick={() => trocarHora(h)}>{ROTULO_HORA[h]}</button>
              ))}
            </div>
            <div className="avst5-fundos avst5-luzes" role="radiogroup" aria-label="Iluminação (§164)" data-teste="luzes-2d">
              {LUZES_PALCO.map((l) => (
                <button key={l} type="button" role="radio" aria-checked={luz === l}
                  className={luz === l ? 'avst5-fundo-on' : ''}
                  disabled={controlesTravados}
                  onClick={() => trocarLuz(l)}>{ROTULO_LUZ[l]}</button>
              ))}
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
          <aside className={`avst5-painel${painelFechado ? ' avst5-painel-fechado' : ''}`} aria-label="Catálogo">
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
                      {a === 'todos' ? 'Todos' : a === 'equipados' ? 'Equipados' : a === 'favoritos' ? 'Favoritos' : a === 'novos' ? 'Novos' : a === 'bloqueados' ? 'Bloqueados' : 'Presets'}
                    </button>
                  ))}
                </div>
                <button type="button" className={`avst5-painel-btn${propriedades ? ' avst5-painel-btn-on' : ''}`}
                  title="Cores e propriedades" aria-pressed={propriedades}
                  onClick={() => setPropriedades((v) => !v)}><Palette size={14} aria-hidden /></button>
                <button type="button" className="avst5-painel-btn" title={painelLargo ? 'Largura normal' : 'Expandir painel'}
                  onClick={() => setPainelLargo((v) => !v)}>
                  {painelLargo ? <ChevronsRight size={14} aria-hidden /> : <ChevronsLeft size={14} aria-hidden />}
                </button>
              </>)}
            </div>
            {!painelFechado && (
              <div className="avst5-painel-scroll" ref={refPainel}
                onScroll={(e) => setMostrarTopo((e.target as HTMLElement).scrollTop > 400)}>
                {propriedades && (
                  <section className="avst5-propriedades" aria-label="Cores e propriedades">
                    <Cores config={configVisivel} aoMudar={aoEscolher} />
                    {/* §71: sliders das camadas equipadas com propriedades */}
                    <PropriedadesAsset config={configVisivel} aoAplicar={aoEscolher} aoPrever={aoPrever} />
                  </section>
                )}
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
                    aoMudarFavs={() => setTicFavs((t) => t + 1)} />
                  {/* §138: timeline granular da sessão junto da gestão do estado */}
                  <HistoricoSessao entradas={historico.entradas} posicao={historico.posicao} irPara={historico.irPara} />
                </>) : (
                  <>
                  {/* megas 254–256 (§102/§118/§105): CRIAÇÃO AVANÇADA — na
                      categoria Base (identidade do corpo); tudo vira COMANDO
                      com undo via aoEscolher; neutro = campo some */}
                  {flag('as5.criacao_avancada') && categoria === 'base' && (
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
                    </div>
                  )}
                  <GradeItens config={configDraft} categoria={categoria}
                    desbloqueados={desbloqueados} aoEscolher={aoEscolher} filtroAba={aba as AbaCatalogo}
                    aoPrever={aoPrever} filtroSlot={filtroSlot} aoDetalhes={setDetalheId} />
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
        </div>
        {tour && <TourGuiado aoFechar={() => setTour(false)} />}
        <Suspense fallback={null}>
        {atalhos && <Atalhos aoFechar={() => setAtalhos(false)} />}
        {telemetriaDev && <TelemetriaDev aoFechar={() => setTelemetriaDev(false)} />}
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
            aoNavegar={(cat) => { setCategoria(cat as CategoriaId); setAba('todos'); setFiltroSlot('todos'); }}
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
              { id: 'atalhos', rotulo: 'Atalhos do teclado (?)', executar: () => setAtalhos(true) },
              // mega 46: viewer de telemetria (só com a flag dev ligada)
              ...(flag('as5.telemetria_painel') ? [{
                id: 'telemetria', rotulo: 'Telemetria local (dev)', executar: () => setTelemetriaDev(true),
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
