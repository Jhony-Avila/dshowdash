// services/Renderizador3d.ts — o motor WebGL por trás do CONTRATO §401.
// @version 1.0.0  @created 2026-08-03  (AS5 · mega 6)
//
// Segunda implementação REAL do RenderizadorAvatar (a 1ª é o Renderizador2d):
// three IMPERATIVO, sem React/R3F — o contrato é framework-agnostic por
// design (§401). Carrega o personagem PUBLICADO pelo pipeline da mega 5
// (manifest §517, LOD por qualidade §423) e anima um idle PROCEDURAL nos
// bones (§436-ready: quando os clipes reais do UBC chegarem, tocarAnimacao
// ganha clipes de verdade; os nomes de bones canônicos ficam no rig).
//
// PENDÊNCIAS honestas (§481): este renderer reporta a cobertura REAL — o
// personagem-base renderiza; slots equipados SEM asset 3D publicado saem
// em `pendencias` (o classificador aspiracional pendenciasPara(estado,'3d')
// diz que 3D representa tudo; o palco só pode prometer o que tem no disco).
//
// Quem resolve QUAL personagem carregar é injetado (DI): por padrão, o
// manequim de desenvolvimento — o mapeamento base 2D → personagem 3D real
// nasce junto do catálogo 3D povoado (§614).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// lote 451-460 (§457/§177, flag as5.pos3d_real): PÓS real por composer
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type {
  CapturaRender, EstadoCamera, InicializacaoRenderer, OpcoesCaptura,
  PedidoAnimacao, PedidoPoder, RenderizadorAvatar, ResultadoAplicarEstado,
} from '../nucleo/renderizador';
import type { EstadoAvatar, QualidadeTier } from '../nucleo/contratos';
import { carregarManifest3d, lodPorQualidade, urlDoLod } from './Personagens3d';
import { buscarComCache } from './CacheAssets3d'; // lote 681-690 (§475)
import type { ManifestPersonagem3d } from './Personagens3d';
import { montarPersonagem } from './Assembler3d'; // lote 621-630 (§406)
import type { ResultadoMontagem } from './Assembler3d';
import { BONES_UBC_V1, carregarManifestParte, categoriaDaParte, urlDaParte } from './Partes3d';
import { aplicarFamilias, aplicarPipelineCores, descartarMateriais, marcarMateriaisPorManifest } from './Materiais3d'; // lote 641-650 (§418-§421) + onda 1408 (#160)
import { LOOKS, etiquetaLook, lookDe, type LookId } from './Looks3d'; // onda 1408 (#161): registry de looks
import { passesPos } from './QualityManager'; // onda 1420 (#206): degradação por pass
import { LENTES_FOTO, dimensoesLente, nomeFotoLente, type LenteFotoId } from './LentesFoto'; // onda 1420 (#207)
import { telemetria } from './Telemetria'; // onda 1420 (#206): p3d_pos_fallback
import { BOOKMARKS_CAMERA, LIMITES_ORBITA, TRANSICAO_CAMERA_MS, enquadrar, presetDe } from './Camera3d'; // onda 1419 (#204)
import { flag } from '../nucleo/flags'; // onda 1419 (#204/#205): camera_v2/sombras_v2
import { MaquinaAnimacao, alvoOlhar, carregarPacoteAnimacoes, mesclarClipes } from './Animacoes3d'; // lotes 661-670/731-740 (§432-§439)
import type { PacoteAnimacoes } from './Animacoes3d';

// ── onda 1420 (#206, as6.pos_v2): shaders da cadeia de pós v2 ──────────
/** GRADE paramétrico com PROTEÇÃO DE PELE (§1969): saturação/temperatura/
 *  contraste sobre o frame tone-mapped; a máscara de pele (razão R>G>B
 *  típica de tons de pele em sRGB) ATENUA o grading onde o pixel "parece
 *  rosto" — o look nunca cozinha a pele (uPele 0 desliga a proteção). */
const SHADER_GRADE = {
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1 }, uTemp: { value: 0 }, uCon: { value: 1 }, uPele: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSat; uniform float uTemp; uniform float uCon; uniform float uPele;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 rgb = c.rgb;
      vec3 quente = clamp(rgb + vec3(uTemp, uTemp * 0.25, -uTemp), 0.0, 1.0);
      float l = dot(quente, vec3(0.2126, 0.7152, 0.0722));
      vec3 sat = mix(vec3(l), quente, uSat);
      vec3 grad = (sat - 0.5) * uCon + 0.5;
      float pele = smoothstep(0.02, 0.12, rgb.r - rgb.g) * smoothstep(0.0, 0.15, rgb.g - rgb.b) * smoothstep(0.15, 0.35, rgb.r);
      vec3 fin = mix(grad, rgb, clamp(pele, 0.0, 1.0) * uPele * 0.65);
      gl_FragColor = vec4(clamp(fin, 0.0, 1.0), c.a);
    }`,
};
/** VINHETA paramétrica (força/suavidade por look — §1971). */
const SHADER_VINHETA = {
  uniforms: { tDiffuse: { value: null }, uForca: { value: 0 }, uSuav: { value: 0.5 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uForca; uniform float uSuav;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float d = distance(vUv, vec2(0.5));
      float v = smoothstep(0.72, 0.72 - uSuav * 0.6, d);
      c.rgb *= mix(1.0 - uForca, 1.0, v);
      gl_FragColor = c;
    }`,
};

/** onda 1419 (#205): CONTACT SHADOW procedural — gradiente radial num
 *  CanvasTexture (zero download, determinístico o suficiente p/ palco). */
function criarTexturaContato(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,0.9)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface OpcoesRenderizador3d {
  /** decide o SLUG publicado a partir do estado (DI — default: manequim) */
  resolverPersonagem?: (estado: EstadoAvatar) => string;
  /** base das pastas publicadas (o teste aponta p/ servidor efêmero) */
  basePersonagens?: string;
  /** mega 16 (§528): avisa quando o modo 'auto' rebaixa/sobe o tier */
  aoMudarQualidade?: (tier: QualidadeTier, motivo: 'fps_baixo' | 'fps_folga') => void;
  /** mega 41: watchdog — avisa a UI quando o contexto WebGL cai/volta */
  aoContexto?: (fase: 'perdido' | 'restaurado') => void;
  /** mega 685 (§472): estados REAIS do carregamento p/ a UI amigável */
  aoCarregamento?: (fase: 'metadados' | 'baixando' | 'modelo_rapido' | 'montando' | 'pronto') => void;
  /** onda 1409 (MEGA_BRIEFING_01 §2804, §2968–§2972): EVENTOS DE ASSET p/
   *  telemetria (sem PII: slug/lod/ms/erro curto). O caller decide flag,
   *  rate limit e destino; sem callback = zero custo. */
  aoEventoAsset?: (ev: EventoAsset3d) => void;
}

/** onda 1409: evento de ciclo de vida de asset 3D (observabilidade §2804). */
export interface EventoAsset3d {
  tipo: 'asset_carregou' | 'asset_falhou' | 'lod_transicao' | 'fallback_ativado' | 'parte_falhou' | 'parte_carregou';
  slug: string;
  /** 'lod0'|'lod1'|'lod2' quando conhecido */
  lod?: string;
  lodAnterior?: string;
  /** tempo de carga em ms (arredondado) */
  ms?: number;
  /** mensagem de erro CURTA (≤ 80 chars, sem URL completa) */
  erro?: string;
  /** 'standin_lod2' (progressivo §470) | 'parte_ignorada' (§481) | 'rig_incompativel' */
  motivo?: string;
}

const FUNDO_ESTUDIO = '#0d1017';

/** mega 693 (§483): passo SUAVE do DPR dinâmico — função PURA (testável).
 *  FPS baixo contínuo → reduz 15% por janela (piso 70% da base); folga →
 *  recupera gradualmente até a base. Nunca muda de forma abrupta. */
export function passoDpr(fpsMedia: number, atual: number, base: number): number {
  if (fpsMedia > 0 && fpsMedia < 28) return Math.max(base * 0.7, atual * 0.85);
  if (fpsMedia > 50) return Math.min(base, atual / 0.85);
  return atual;
}

export class Renderizador3d implements RenderizadorAvatar {
  readonly id = '3d' as const;

  private opcoes: Required<OpcoesRenderizador3d>;
  private qualidade: QualidadeTier | 'auto' = 'auto';
  private pixelRatioMax = 2;
  private antialias = true;

  private renderer: THREE.WebGLRenderer | null = null;
  private cena: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private personagem: THREE.Object3D | null = null;
  private manifest: ManifestPersonagem3d | null = null;
  private slugAtual: string | null = null;
  private lodAtual: string | null = null;
  private ultimoEstado: EstadoAvatar | null = null;

  private raf = 0;
  private pausado = false;
  private relogio = 0; // tempo do idle: avança por frame (determinístico)
  private idleAtivo = true;
  private orbitaAuto = false;
  // câmera ATUAL memorizada — reload adaptativo (§528) não pode resetá-la
  private cameraAtual: EstadoCamera = { modo: 'corpo' };
  // onda 1419 (#204): transição 300ms interromível + guard #165d
  private transicaoCam: { de: { pos: THREE.Vector3; alvo: THREE.Vector3; fov: number }; para: { pos: THREE.Vector3; alvo: THREE.Vector3; fov: number }; inicio: number } | null = null;
  private alvoCam = new THREE.Vector3(0, 1, 0);
  private modoCamAplicado: string | null = null;
  // onda 1419 (#205): chão v2 (studio_matte = atual) + environment por URL
  private chaoTipo: 'studio_matte' | 'gloss' | 'platform' | 'grid' = 'studio_matte';
  private chaoExtra: THREE.Object3D | null = null;
  // mega 21/22: fundo e luz do palco (paridade §9.3 / presets §163-lite)
  private fundoAtual: 'neutro' | 'estudio' | 'grade' = 'estudio';
  private grade: THREE.GridHelper | null = null;
  private chao: THREE.Mesh | null = null;
  private luzes: { chave: THREE.DirectionalLight; preencher: THREE.DirectionalLight; ambiente: THREE.AmbientLight } | null = null;
  // mega 23: órbita MANUAL (drag/zoom) — só no modo câmera 'orbita'
  private controles: OrbitControls | null = null;
  // mega 28: última média de FPS p/ o diagnostico() (HUD §290)
  private fpsMedia = 0;
  // mega 16 (§528): QUALIDADE ADAPTATIVA — média móvel de FPS decide o
  // tier quando qualidade === 'auto' (histerese: desce <30, sobe >55)
  private tierAuto: QualidadeTier = 'medio';
  private fpsUltimo = 0;
  private fpsSoma = 0;
  private fpsN = 0;
  // mega 17 (§402): CACHE dos BYTES do GLB por URL (LRU 8) — a parte cara
  // é a REDE; cada uso faz parseAsync fresco (ms) e a cena nasce íntegra.
  // (Clonar cena skinned foi descartado: RobotExpressive/2-skins ficou
  // invisível com SkeletonUtils.clone — bytes+parse elimina a classe.)
  private cacheGlb: Map<string, Promise<ArrayBuffer>> = new Map();

  private bones: Map<string, THREE.Bone> = new Map();
  private poseBase: Map<string, THREE.Quaternion> = new Map();
  // ANIMAÇÕES REAIS (mega 9): clipes do próprio GLB via AnimationMixer;
  // o idle procedural vira FALLBACK p/ modelos sem clipes (ex.: manequim)
  private mixer: THREE.AnimationMixer | null = null;
  private clipes: Map<string, THREE.AnimationClip> = new Map();
  private acaoAtual: THREE.AnimationAction | null = null;

  // mega 41: contexto WebGL perdido (GPU reset/aba de fundo) — watchdog
  private contextoPerdido = false;
  // mega 79 (§451): sombras REAIS por tier (econômico fica na fake)
  private chaoSombra: THREE.Mesh | null = null;
  private sombrasLigadas = false;
  // mega 81 (§419): tinta de destaque nos materiais do personagem
  private tinta: { cor: string; forca: number } | null = null;
  // lote 641–650 (§418–§421, flag as5.materiais3d no CALLER): cores §73
  // PERSONALIZADAS por canal (§420) — null = arte original dos GLBs
  private cores3d: Record<string, string> | null = null;
  // lote 651–660 (§412–§414, flag as5.morfos3d no CALLER): morfos
  // estruturais via ESCALA do personagem — null/neutro = escala 1
  private corpo3d: { tipo?: string | null; fino?: { largura?: number; altura?: number } | null } | null = null;
  // ── lote 681–690 (§461–§478, flag as5.progressivo3d no CALLER) ────
  // §473: geração de carga — resposta antiga NUNCA sobrescreve a nova
  // (bugfix de corrida, SEM flag: corretude não é feature)
  private geracaoCarga = 0;
  // §470/§462/§475: progressivo lod2-primeiro + LOD por tela + IndexedDB
  private progressivoAtivo = false;
  // ── lote 691–700 (§482–§483, flag as5.quality3d_v2 no CALLER) ─────
  // §483: DPR dinâmico — reduz suave quando o FPS cai contínuo
  private dprDinamico = false;
  private dprBase = 1;
  private dprAtual = 1;
  // ── lote 661–670 (§432–§439, flag as5.animacao3d no CALLER) ───────
  // pacotes de clipes EXTERNOS (UAL §436 — mesmo rig = reuso direto);
  // lote 731-740: LISTA de pacotes (básico + extras); [] = anterior
  private pacotesAnim: PacoteAnimacoes[] = [];
  private urlsPacotesAnim: string[] = [];
  /** máquina §433 — captura nunca é quebrada por emote */
  readonly maquinaAnim = new MaquinaAnimacao();
  // §439: olhar segue o cursor com amplitude limitada e SUAVIZAÇÃO
  private olharAlvo: { guinada: number; arfagem: number } = { guinada: 0, arfagem: 0 };
  private olharAtual: { guinada: number; arfagem: number } = { guinada: 0, arfagem: 0 };
  // mega 82 (§444): aura 3D — anel additive na cor do avatar
  private aura3d: THREE.Mesh | null = null;
  // lote 131–140 (§426–§431): SOCKETS — props procedurais presos aos
  // bones (arquitetura pronta p/ as malhas reais do UBC)
  private tiposProp: Map<'cabeca' | 'rosto' | 'pet', { tipo: string; cor: string }> = new Map();
  private props3d: Map<'cabeca' | 'rosto' | 'pet', THREE.Object3D> = new Map();
  // ── onda 261–270 (§440–§458): A5 sem UBC ──────────────────────────
  // mega 261/267 (§440–§441): VIDA procedural — respiração + micro-
  // movimento de cabeça ADITIVOS (aplicados DEPOIS do mixer, nunca
  // sobrescrevem clipes); null = desligada (padrão — zero mudança)
  private vida: { intensidade: number } | null = null;
  // mega 264/269 (§444–§446): PARTÍCULAS na cor de destaque
  private particulas3d: THREE.Points | null = null;
  private particulasBase: Float32Array | null = null;
  // mega 268 (§452): RIM LIGHT (luz de aro) atrás do personagem
  private rim: THREE.DirectionalLight | null = null;
  // onda 1408 (MEGA_BRIEFING_01 §1756–§1767, #161): LOOK ativo (registry
  // Looks3d), rim PRÓPRIO do look (≠ aro do usuário), exposição = base do
  // look × slider do usuário, ambiente do usuário (null = o do look).
  private lookAtual: LookId = 'estudio';
  // onda 1408 (#160, as6.material_v2 — o CALLER decide a flag): metadados
  // de material do manifest v2 (canal/naoTingir/familia) entram no pipeline
  private materiaisV2 = false;
  private rimLook: THREE.DirectionalLight | null = null;
  private exposicaoUsuario = 1.0;
  private ambienteUsuario: number | null = null;
  // onda 1408 (§105, §141–§146, #156 as6.qa_visual): overlay de QA e
  // laboratório de calibração — dev-only; restauração EXATA.
  private overlayAtual: 'nenhum' | 'clay' | 'normals' | 'wireframe' | 'silhueta' | 'grayscale' = 'nenhum';
  private overlayMaterial: THREE.Material | null = null;
  private laboratorio: { fundoAntes: 'neutro' | 'estudio' | 'grade'; lookAntes: LookId; checker: THREE.Group | null } | null = null;
  // ── lote 331–340 (§176/§457, flag as5.palco3d_cine) ────────────────
  // mega 331 (§176): MOVIMENTO cinematográfico contínuo da câmera
  private movCamera: 'nenhum' | 'dolly' | 'panoramica' | 'orbita' | 'composto' = 'nenhum';
  private movBase: { pos: THREE.Vector3; alvo: THREE.Vector3 } | null = null;
  // mega 333 (§457/§177): PÓS — vinheta/saturação por CSS filter no canvas
  // (§177.1: barato, desliga no econômico; composer real fica p/ quando o
  // peso do motor3d justificar — registrado)
  private posAtivo = false;
  // megas 451-455 (§457): composer REAL (bloom leve + vinheta) — criado
  // sob demanda no 1º uso; null = caminho de render 100% legado
  private composer: EffectComposer | null = null;
  private composerReal = false;
  private posReal = false; // onda 1420: guarda o `real` p/ recriar pós context loss
  // onda 1420 (#206, as6.pos_v2): COMPOSER V2 por look — cadeia
  // Render→Bloom→Grade→Vignette declarada em Look.pos, degradada por
  // pass via QualityManager.passesPos; null = caminho legado byte a byte
  private composerV2: EffectComposer | null = null;
  private passesV2: { bloom: UnrealBloomPass | null; grade: ShaderPass | null; vinheta: ShaderPass | null } = { bloom: null, grade: null, vinheta: null };
  private geracaoPosV2 = 0; // cresce a cada (re)construção — teste de context loss
  // onda 1420 (#206, as6.dev_iluminacao): multiplicadores dev sobre o look
  private devLuz: { key: number; fill: number; rim: number; bloom: number } | null = null;
  // mega 45: nitidez responsiva — o canvas segue o contêiner de verdade
  private observadorTamanho: ResizeObserver | null = null;
  private alvoEl: HTMLElement | null = null;
  // ── lote 621–630 (§406, flag as5.assembler3d no CALLER) ───────────
  // megas 625-626: PARTES 3D (cabelo/barba/roupa) montadas no esqueleto
  // da base pelo Character Assembler; [] = caminho legado byte a byte
  private partes3d: string[] = [];
  /** última montagem §406 — diagnóstico/testes (fases + pendências) */
  ultimaMontagem: ResultadoMontagem | null = null;

  constructor(opcoes: OpcoesRenderizador3d = {}) {
    this.opcoes = {
      resolverPersonagem: opcoes.resolverPersonagem ?? (() => 'manequim_dev'),
      basePersonagens: opcoes.basePersonagens ?? '/assets/avatars/3d/personagens',
      aoMudarQualidade: opcoes.aoMudarQualidade ?? (() => { /* opcional */ }),
      aoContexto: opcoes.aoContexto ?? (() => { /* opcional */ }),
      aoCarregamento: opcoes.aoCarregamento ?? (() => { /* opcional */ }),
      aoEventoAsset: opcoes.aoEventoAsset ?? (() => { /* opcional — onda 1409 */ }),
    };
  }

  async inicializar(config: InicializacaoRenderer): Promise<void> {
    this.qualidade = config.qualidade;
    this.pixelRatioMax = config.pixelRatioMax ?? 2;
    this.antialias = config.antialias ?? true;
    // mega 42: dica de CAPACIDADE (§605-lite) — só o ponto de partida do
    // adaptativo §528; o FPS real continua mandando depois
    if (config.dicaTier && this.qualidade === 'auto') this.tierAuto = config.dicaTier;
  }

  async montar(alvo: { innerHTML: string }): Promise<void> {
    const el = alvo as unknown as HTMLElement;
    if (typeof (el as { appendChild?: unknown }).appendChild !== 'function') {
      throw new Error('Renderizador3d.montar exige um HTMLElement real (canvas WebGL não vive em innerHTML)');
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias, alpha: true, preserveDrawingBuffer: true });
    this.dprBase = Math.min(window.devicePixelRatio || 1, this.pixelRatioMax);
    this.dprAtual = this.dprBase;
    this.renderer.setPixelRatio(this.dprBase); // §402
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // mega 78 (§458): tone mapping cinematográfico (exposição ajustável)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    // mega 79 (§451): shadow map pronto — ligar/desligar é por TIER
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const l = Math.max(1, el.clientWidth || 480);
    const a = Math.max(1, el.clientHeight || 480);
    this.renderer.setSize(l, a);
    el.appendChild(this.renderer.domElement);
    // mega 41: WATCHDOG de contexto — preventDefault permite o restore;
    // o laço para de renderizar até o navegador devolver o contexto
    this.renderer.domElement.addEventListener('webglcontextlost', this.aoPerderContexto, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.aoRestaurarContexto, false);
    // mega 45: NITIDEZ RESPONSIVA — fullscreen/redimensionamento do painel
    // ganham buffer REAL (antes o CSS só esticava o canvas montado)
    this.alvoEl = el;
    if (typeof ResizeObserver !== 'undefined') {
      this.observadorTamanho = new ResizeObserver(() => this.redimensionar());
      this.observadorTamanho.observe(el);
    }

    // cena canônica — MESMA luz do §508 (thumbs): palco e thumb conversam
    this.cena = new THREE.Scene();
    const chave = new THREE.DirectionalLight(0xffffff, 2.6);
    chave.position.set(2.2, 3.0, 2.6);
    const preencher = new THREE.DirectionalLight(0x9db4ff, 1.1);
    preencher.position.set(-2.4, 1.2, -1.6);
    const ambiente = new THREE.AmbientLight(0xffffff, 0.55);
    this.luzes = { chave, preencher, ambiente };
    this.cena.add(chave, preencher, ambiente);
    // mega 21: CHÃO com sombra fake — disco escuro ancora o personagem
    this.chao = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34 }),
    );
    this.chao.position.y = 0.01;
    this.cena.add(this.chao);
    this.definirFundo(this.fundoAtual);
    // mega 77 (§449): ENVIRONMENT MAP procedural (RoomEnvironment — zero
    // download) → materiais standard ganham reflexo/ambiente AAA
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      (this.cena as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.55;
      pmrem.dispose();
    } catch { /* ambiente sem suporte — as 3 luzes canônicas seguram */ }
    // mega 79: chão receptor de sombra REAL (invisível fora do tier)
    this.chaoSombra = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2),
      new THREE.ShadowMaterial({ opacity: 0.32 }),
    );
    this.chaoSombra.position.y = 0.005;
    this.chaoSombra.receiveShadow = true;
    this.chaoSombra.visible = false;
    this.cena.add(this.chaoSombra);
    if (this.luzes) {
      this.luzes.chave.shadow.mapSize.set(1024, 1024);
      this.luzes.chave.shadow.camera.near = 0.5;
      this.luzes.chave.shadow.camera.far = 12;
    }
    this.atualizarSombras();
    this.camera = new THREE.PerspectiveCamera(32, l / a, 0.01, 100);

    if (this.ultimoEstado) await this.aplicarEstado(this.ultimoEstado);
    this.laço();
  }

  async aplicarEstado(estado: EstadoAvatar): Promise<ResultadoAplicarEstado> {
    this.ultimoEstado = estado;
    if (!this.cena) return { ok: false, pendencias: ['montagem'] };

    const slug = this.opcoes.resolverPersonagem(estado);
    const lod = this.lodDesejado();
    if (slug !== this.slugAtual || lod !== this.lodAtual) {
      try {
        await this.carregarPersonagem(slug);
      } catch (e) {
        return { ok: false, pendencias: [`personagem:${slug} (${(e as Error).message})`] };
      }
    }
    this.idleAtivo = estado.animation.idle !== 'nenhum';
    // §481: cobertura REAL — slots equipados ainda sem asset 3D publicado
    const pendencias = Object.entries(estado.equipment)
      .filter(([, id]) => Boolean(id))
      .map(([slot]) => slot);
    return { ok: true, pendencias };
  }

  definirCamera(camera: EstadoCamera): void {
    this.cameraAtual = camera;
    if (!this.camera || !this.personagem) return;
    // mega 23 (§453): modo 'orbita' liga o controle MANUAL (drag+wheel)
    if (camera.modo === 'orbita' && this.renderer) {
      if (!this.controles) {
        this.controles = new OrbitControls(this.camera, this.renderer.domElement);
        this.controles.enableDamping = true;
        this.controles.dampingFactor = 0.08;
        this.controles.minDistance = 0.6;
        this.controles.maxDistance = 8;
        // onda 1419 (#204, as6.camera_v2): limites duros da órbita —
        // nunca sob o chão, nunca dentro do personagem
        if (flag('as6.camera_v2')) {
          this.controles.minPolarAngle = LIMITES_ORBITA.minPolar;
          this.controles.maxPolarAngle = LIMITES_ORBITA.maxPolar;
          this.controles.minDistance = LIMITES_ORBITA.minDistance;
          this.controles.maxDistance = LIMITES_ORBITA.maxDistance;
        }
      }
      this.controles.enabled = true;
    } else if (this.controles) {
      this.controles.enabled = false;
    }
    const caixa = new THREE.Box3().setFromObject(this.personagem);
    const centro = caixa.getCenter(new THREE.Vector3());
    const tamanho = caixa.getSize(new THREE.Vector3());
    const maior = Math.max(tamanho.x, tamanho.y, tamanho.z);
    this.orbitaAuto = camera.modo === 'cinematica';

    // onda 1419 (#204, as6.camera_v2): presets do Camera3d com FOV próprio,
    // bounds-aware (Box3 ∪ partes/props já montados no personagem),
    // transição 300ms interromível e guard #165d (não resetar câmera:
    // mesmo modo já aplicado ⇒ nada muda, salvo `forcar` dos bookmarks)
    if (flag('as6.camera_v2') && presetDe(camera.modo)) {
      if (this.modoCamAplicado === camera.modo && !camera.forcar) return;
      // props FORA do personagem (pet §131) entram na caixa (accessory-aware)
      for (const [, prop] of this.props3d) caixa.expandByObject(prop);
      const enq = enquadrar(
        { min: [caixa.min.x, caixa.min.y, caixa.min.z], max: [caixa.max.x, caixa.max.y, caixa.max.z] },
        camera.modo as Parameters<typeof enquadrar>[1],
      );
      const primeira = this.modoCamAplicado === null;
      this.modoCamAplicado = camera.modo;
      const para = {
        pos: new THREE.Vector3(...enq.posicao),
        alvo: new THREE.Vector3(...enq.alvo),
        fov: enq.fov,
      };
      // primeira posição: corte seco (nada de animar a partir do nada)
      if (primeira) {
        this.camera.position.copy(para.pos);
        this.alvoCam.copy(para.alvo);
        this.camera.fov = para.fov;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.alvoCam);
        return;
      }
      this.transicaoCam = {
        de: { pos: this.camera.position.clone(), alvo: this.alvoCam.clone(), fov: this.camera.fov },
        para,
        inicio: performance.now(),
      };
      return;
    }

    if (camera.modo === 'retrato') {
      const alvoY = caixa.max.y - tamanho.y * 0.18; // altura da cabeça
      this.camera.position.set(centro.x + maior * 0.5, alvoY, centro.z + maior * 0.9);
      this.camera.lookAt(centro.x, alvoY, centro.z);
      return;
    }
    // corpo | orbita | cinematica: esféricas em volta do centro (§453.1)
    const d = (camera.distancia ?? 1.9) * maior;
    const az = camera.azimute ?? 0.65;
    const el = camera.elevacao ?? 0.35;
    const alvo = camera.alvo ? new THREE.Vector3(...camera.alvo) : centro;
    this.camera.position.set(
      alvo.x + d * Math.cos(el) * Math.sin(az),
      alvo.y + d * Math.sin(el),
      alvo.z + d * Math.cos(el) * Math.cos(az),
    );
    this.camera.lookAt(alvo);
  }

  async tocarAnimacao(pedido: PedidoAnimacao): Promise<void> {
    // §433: durante a CAPTURA nada muda (emote não quebra o frame §508)
    if (this.maquinaAnim.estado === 'captura') return;
    // fora da captura a intenção do usuário SEMPRE vale — em especial o
    // 'nenhum' (§297): descartá-lo durante 'carregando' deixava o idle
    // procedural ligado p/ sempre (bug pego pelo teste de reduced-motion)
    this.maquinaAnim.ir(pedido.id === 'nenhum' ? 'pose' : 'emote');
    this.idleAtivo = pedido.id !== 'nenhum';
    if (!this.mixer) return; // sem clipes no GLB → idle procedural decide
    if (pedido.id === 'nenhum') {
      this.acaoAtual?.fadeOut((pedido.transicaoMs ?? 200) / 1000);
      this.acaoAtual = null;
      return;
    }
    const clipe = this.clipes.get(pedido.id);
    if (!clipe || this.acaoAtual?.getClip() === clipe) return; // desconhecido/já ativo: sem erro
    const nova = this.mixer.clipAction(clipe);
    nova.reset();
    nova.setLoop(pedido.loop === false ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    nova.clampWhenFinished = pedido.loop === false;
    const cross = (pedido.transicaoMs ?? 280) / 1000;
    if (this.acaoAtual) {
      nova.play();
      this.acaoAtual.crossFadeTo(nova, cross, false);
    } else {
      nova.fadeIn(cross).play();
    }
    this.acaoAtual = nova;
  }

  /** Clipes REAIS disponíveis no personagem carregado (mega 9 — a UI
   *  monta o seletor daqui; vazio = modelo sem animações embutidas). */
  animacoesDisponiveis(): string[] {
    return [...this.clipes.keys()];
  }

  async tocarPoder(_pedido: PedidoPoder): Promise<void> {
    // poderes 3D (§152–§156) dependem de partículas/cenário — F9 com arte.
  }

  async capturar(opcoes: OpcoesCaptura): Promise<CapturaRender> {
    if (!this.renderer || !this.cena || !this.camera) throw new Error('capturar() antes de montar()');
    if (this.contextoPerdido) throw new Error('contexto WebGL perdido — aguarde a recuperação (mega 41)');
    const estava = this.pausado;
    // §433: estado CAPTURA — emotes pedidos durante o frame são recusados
    const estadoAntes = this.maquinaAnim.estado;
    this.maquinaAnim.ir('captura');
    if (opcoes.deterministica !== false) this.pausado = true; // §508
    // mega 32: transparente HONRADO — só o personagem atravessa o frame
    // (background nulo + chão/grade ocultos; canvas nasceu com alpha:true)
    const fundoAntes = this.cena.background;
    const chaoAntes = this.chao?.visible ?? true;
    const gradeAntes = this.grade?.visible ?? true;
    const sombraAntes = this.chaoSombra?.visible ?? false;
    if (opcoes.transparente) {
      this.cena.background = null;
      if (this.chao) this.chao.visible = false;
      if (this.grade) this.grade.visible = false;
      if (this.chaoSombra) this.chaoSombra.visible = false; // recorte limpo
    }
    // lote 691-700 (§506): câmera ESPECÍFICA da captura (aplica/restaura)
    const cameraAntes = this.cameraAtual;
    if (opcoes.camera) this.definirCamera(opcoes.camera);
    // onda 1420 (#207): transição 300ms pendente (as6.camera_v2) é
    // CORTADA a seco — a captura é um frame só e precisa ser
    // determinística (o laço não roda durante o capturar)
    if (this.transicaoCam) {
      const { para } = this.transicaoCam;
      this.camera.position.copy(para.pos);
      this.alvoCam.copy(para.alvo);
      this.camera.fov = para.fov;
      this.camera.lookAt(this.alvoCam);
      this.transicaoCam = null;
    }
    // §506 supersampling: renderiza no DOBRO e reduz — AA de captura
    const fator = opcoes.superAmostra === 2 ? 2 : 1;
    const tamanhoAntes = new THREE.Vector2();
    this.renderer.getSize(tamanhoAntes);
    this.renderer.setSize(opcoes.largura * fator, opcoes.altura * fator);
    this.camera.aspect = opcoes.largura / opcoes.altura;
    this.camera.updateProjectionMatrix();
    // onda 1420 (#206): a captura passa pela MESMA cadeia de pós do
    // palco (composer v2 quando ativo) — "o que vê é o que sai"
    if (this.composerV2) {
      this.composerV2.setSize(opcoes.largura * fator, opcoes.altura * fator);
      this.composerV2.render();
    } else {
      this.renderer.render(this.cena, this.camera);
    }
    // §506 múltiplos formatos (jpeg/webp p/ derivados §329.2)
    const mime = opcoes.formato === 'jpeg' ? 'image/jpeg'
      : opcoes.formato === 'webp' ? 'image/webp' : 'image/png';
    const q = opcoes.qualidade ?? 0.92;
    let dataUri: string;
    if (fator === 2) {
      const alvo = document.createElement('canvas');
      alvo.width = opcoes.largura;
      alvo.height = opcoes.altura;
      const ctx = alvo.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.renderer.domElement, 0, 0, opcoes.largura, opcoes.altura);
        dataUri = alvo.toDataURL(mime, q);
      } else {
        dataUri = this.renderer.domElement.toDataURL(mime, q);
      }
    } else {
      dataUri = this.renderer.domElement.toDataURL(mime, q);
    }
    this.renderer.setSize(tamanhoAntes.x, tamanhoAntes.y);
    this.composerV2?.setSize(tamanhoAntes.x, tamanhoAntes.y); // onda 1420: restaura
    this.camera.aspect = tamanhoAntes.x / Math.max(1, tamanhoAntes.y);
    this.camera.updateProjectionMatrix();
    if (opcoes.camera) this.definirCamera(cameraAntes); // §506 restaura
    if (opcoes.transparente) {
      this.cena.background = fundoAntes;
      if (this.chao) this.chao.visible = chaoAntes;
      if (this.grade) this.grade.visible = gradeAntes;
      if (this.chaoSombra) this.chaoSombra.visible = sombraAntes;
      this.renderer.render(this.cena, this.camera); // não deixa frame vazado
    }
    this.pausado = estava;
    // §433: sai da captura de volta ao estado anterior (idle/pose)
    this.maquinaAnim.ir(estadoAntes === 'pose' ? 'pose' : 'idle');
    return { dataUri, largura: opcoes.largura, altura: opcoes.altura };
  }

  /** onda 1420 (MEGA_BRIEFING_01 P8-E §2007–§2027, #207; as6.foto_lentes):
   *  captura com LENTE do registry LentesFoto — aplica look + preset de
   *  câmera + shadow map ↑ SÓ durante a captura e RESTAURA tudo (o palco
   *  volta byte a byte). Determinística: mesma cena ⇒ mesmos bytes
   *  (teste com hash de 2 capturas). Pós v2 entra pelo capturar(). */
  async capturarComLente(id: LenteFotoId, opcoes: { transparente?: boolean } = {}): Promise<CapturaRender & { nome: string }> {
    const lente = LENTES_FOTO[id];
    if (!lente) throw new Error(`lente desconhecida: ${id}`);
    const { largura, altura } = dimensoesLente(id);
    const lookAntes = this.lookAtual;
    // shadow ↑ só na captura (§2019): mapa 2048 na key, sem mexer em
    // tier/LOD (nada de rede no meio da foto); restaurado no finally
    const mapaAntes = this.luzes ? this.luzes.chave.shadow.mapSize.x : 0;
    const subirSombra = this.luzes !== null && this.luzes.chave.castShadow && mapaAntes > 0 && mapaAntes < 2048;
    const trocarMapa = (tam: number): void => {
      if (!this.luzes) return;
      this.luzes.chave.shadow.mapSize.set(tam, tam);
      this.luzes.chave.shadow.map?.dispose();
      (this.luzes.chave.shadow as unknown as { map: null }).map = null; // rebuild
    };
    if (subirSombra) trocarMapa(2048);
    this.aplicarLook(lente.look); // luz + pós da lente (restaurado abaixo)
    try {
      const foto = await this.capturar({
        largura, altura, deterministica: true, transparente: opcoes.transparente,
        superAmostra: 2,
        camera: { modo: lente.camera, forcar: true } as EstadoCamera,
      });
      telemetria('p3d_foto_lente', { lente: id, look: lente.look, aspecto: lente.aspecto });
      return { ...foto, nome: nomeFotoLente(id) };
    } finally {
      this.aplicarLook(lookAntes);
      if (subirSombra) trocarMapa(mapaAntes);
    }
  }

  definirQualidade(perfil: QualidadeTier | 'auto'): void {
    this.qualidade = perfil;
    this.atualizarSombras(); // mega 79: sombras seguem o tier
    // troca de LOD a quente: recarrega em silêncio se o tier mudou o arquivo
    if (this.ultimoEstado && this.lodDesejado() !== this.lodAtual) {
      void this.aplicarEstado(this.ultimoEstado);
    }
  }

  pausar(): void { this.pausado = true; }
  retomar(): void { this.pausado = false; }

  /** mega 44: SCRUB — avança/volta a pose um passo e pinta UM quadro,
   *  mesmo pausado (achar o frame perfeito antes de capturar). */
  avancarQuadro(delta = 0.15): void {
    if (!this.renderer || !this.cena || !this.camera || this.contextoPerdido) return;
    if (this.mixer) {
      this.mixer.update(delta);
    } else {
      this.relogio += delta;
      this.animarIdle();
    }
    if (this.composerV2) this.composerV2.render(); // onda 1420 (#206): pós v2 do look
    else if (this.composerReal && this.composer) this.composer.render();
    else this.renderer.render(this.cena, this.camera);
  }

  async descartar(): Promise<void> {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.derrubarPosV2(); // onda 1420 (#206): render targets do pós v2
    this.mixer?.stopAllAction();
    this.mixer = null;
    this.acaoAtual = null;
    this.clipes.clear();
    this.cacheGlb.clear();
    this.removerPersonagem();
    this.controles?.dispose();
    this.controles = null;
    this.observadorTamanho?.disconnect();
    this.observadorTamanho = null;
    this.alvoEl = null;
    this.definirAura3d(null); // mega 82: dispose do anel
    this.tiposProp.clear();   // lote 131: dispose das props
    this.aplicarProps();
    if (this.chaoSombra) {
      this.chaoSombra.geometry.dispose();
      (this.chaoSombra.material as THREE.Material).dispose();
      this.chaoSombra = null;
    }
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.aoPerderContexto);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.aoRestaurarContexto);
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
    this.renderer = null;
    this.cena = null;
    this.camera = null;
  }

  // ── mega 41: watchdog de contexto WebGL ─────────────────────────
  private aoPerderContexto = (e: Event): void => {
    e.preventDefault(); // sem isso o navegador NUNCA restaura
    this.contextoPerdido = true;
    this.opcoes.aoContexto('perdido');
  };

  private aoRestaurarContexto = (): void => {
    this.contextoPerdido = false;
    // o three re-sobe o estado GL; reaplicar o estado garante texturas/LOD
    if (this.ultimoEstado) void this.aplicarEstado(this.ultimoEstado);
    // onda 1420 (#206): os render targets dos COMPOSERS morreram junto
    // com o contexto — recriar evita frame preto p/ sempre. Legado: solta
    // a referência e o definirPos refaz; v2: derruba + reconstrói já.
    if (this.composer) {
      this.composer = null;
      this.composerReal = false;
      this.definirPos(this.posAtivo, this.posReal);
    }
    this.derrubarPosV2();
    this.aplicarPosV2();
    this.opcoes.aoContexto('restaurado');
  };

  /** mega 45: buffer real acompanha o contêiner (fullscreen nítido). */
  private redimensionar(): void {
    if (!this.renderer || !this.camera || !this.alvoEl) return;
    const l = Math.max(1, this.alvoEl.clientWidth);
    const a = Math.max(1, this.alvoEl.clientHeight);
    const atual = new THREE.Vector2();
    this.renderer.getSize(atual);
    if (atual.x === l && atual.y === a) return;
    this.renderer.setSize(l, a);
    this.composerV2?.setSize(l, a); // onda 1420 (#206): pós v2 acompanha
    this.camera.aspect = l / a;
    this.camera.updateProjectionMatrix();
  }

  // ── privados ────────────────────────────────────────────────────
  /** mega 21 (§9.3): fundo do palco 3D — paridade com o 2D. */
  /** onda 1419 (#204): BOOKMARKS Full/Bust/Face/Back — furam o guard
   *  #165d de propósito (gesto explícito do usuário). */
  irParaBookmark(id: keyof typeof BOOKMARKS_CAMERA): void {
    this.definirCamera({ modo: BOOKMARKS_CAMERA[id], forcar: true });
  }

  /** onda 1419 (#205): CHÃO do palco — 'studio_matte' é o visual atual
   *  (nada muda sem chamada); gloss/platform/grid são aditivos. */
  definirChao(tipo: 'studio_matte' | 'gloss' | 'platform' | 'grid'): void {
    this.chaoTipo = tipo;
    if (!this.cena) return;
    if (this.chaoExtra) {
      this.cena.remove(this.chaoExtra);
      this.chaoExtra.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
      });
      this.chaoExtra = null;
    }
    if (tipo === 'gloss') {
      const disco = new THREE.Mesh(
        new THREE.CircleGeometry(1.1, 64).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x0d1018, roughness: 0.12, metalness: 0.55, envMapIntensity: 1.1 }),
      );
      disco.position.y = 0.003;
      disco.receiveShadow = true;
      this.chaoExtra = disco;
    } else if (tipo === 'platform') {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.02, 0.07, 48),
        new THREE.MeshStandardMaterial({ color: 0x1a1f2c, roughness: 0.5, metalness: 0.25 }),
      );
      base.position.y = -0.035;
      base.receiveShadow = true;
      this.chaoExtra = base;
    } else if (tipo === 'grid') {
      this.chaoExtra = new THREE.GridHelper(6, 30, 0x2c3550, 0x161c2c);
      this.chaoExtra.position.y = 0.002;
    }
    if (this.chaoExtra) this.cena.add(this.chaoExtra);
  }

  chaoAtivo(): 'studio_matte' | 'gloss' | 'platform' | 'grid' { return this.chaoTipo; }

  /** onda 1419 (#205): ENVIRONMENT por URL preparado (§449 — SEM HDRIs
   *  no repo hoje): null volta ao RoomEnvironment procedural canônico. */
  definirEnvironment(url: string | null): void {
    if (!this.cena || !this.renderer) return;
    if (!url) {
      try {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
      } catch { /* fallback: 3 luzes canônicas */ }
      return;
    }
    new THREE.TextureLoader().load(url, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      if (this.cena) this.cena.environment = tex;
    }, undefined, () => { /* URL inválida: environment atual permanece */ });
  }

  definirFundo(fundo: 'neutro' | 'estudio' | 'grade'): void {
    this.fundoAtual = fundo;
    if (!this.cena) return;
    const cores = { neutro: '#161a24', estudio: FUNDO_ESTUDIO, grade: '#0a0d15' } as const;
    this.cena.background = new THREE.Color(cores[fundo]);
    if (fundo === 'grade' && !this.grade) {
      this.grade = new THREE.GridHelper(8, 32, 0x2c3550, 0x1a2030);
      this.cena.add(this.grade);
    } else if (fundo !== 'grade' && this.grade) {
      this.cena.remove(this.grade);
      this.grade.dispose();
      this.grade = null;
    }
  }

  /** mega 22 (§163-lite): presets de ILUMINAÇÃO sobre as luzes canônicas. */
  definirLuz(preset: 'estudio' | 'quente' | 'fria' | 'neon'): void {
    if (!this.luzes) return;
    const { chave, preencher, ambiente } = this.luzes;
    const aplicar = (cChave: number, iChave: number, cPre: number, iPre: number, iAmb: number) => {
      chave.color.setHex(cChave); chave.intensity = iChave;
      preencher.color.setHex(cPre); preencher.intensity = iPre;
      ambiente.intensity = iAmb;
    };
    if (preset === 'quente') aplicar(0xffd9a0, 2.9, 0xff9d5c, 0.9, 0.5);
    else if (preset === 'fria') aplicar(0xcfe4ff, 2.7, 0x6c8cff, 1.2, 0.45);
    else if (preset === 'neon') aplicar(0xff5f8f, 2.4, 0x4cd9e8, 1.6, 0.35);
    else aplicar(0xffffff, 2.6, 0x9db4ff, 1.1, 0.55);
  }

  /** mega 28 (§290): números vivos p/ o HUD de dev (mega 79: + sombras). */
  diagnostico(): { fps: number; tier: string; triangulos: number; sombras: boolean; drawCalls: number } {
    return {
      fps: Math.round(this.fpsMedia),
      tier: this.tierEfetivo(),
      triangulos: this.manifest?.triangulos?.[
        { alto: 'lod0', medio: 'lod1', economico: 'lod2' }[this.tierEfetivo()] as 'lod0'
      ] ?? 0,
      sombras: this.sombrasLigadas,
      // mega 687 (§467): draw calls REAIS do frame no painel de debug
      drawCalls: this.renderer?.info.render.calls ?? 0,
    };
  }

  /** mega 78 (§458): exposição do tone mapping (0.6–1.6; 1 = neutro). */
  definirExposicao(v: number): void {
    this.exposicaoUsuario = v;
    this.aplicarExposicao();
  }
  /** onda 1408 (#161): exposição efetiva = base do look × slider (clamp
   *  0.6–1.6). Look estudio (base 1.0) ⇒ idêntico ao comportamento anterior. */
  private aplicarExposicao(): void {
    if (!this.renderer) return;
    const base = LOOKS[this.lookAtual]?.exposicao ?? 1.0;
    this.renderer.toneMappingExposure = Math.min(1.6, Math.max(0.6, base * this.exposicaoUsuario));
  }

  // ── onda 261–270 (§440–§458): A5 sem UBC ──────────────────────────

  /** mega 263 (§457–§458): MODO do tone mapping (aces = o de sempre). */
  definirTonemapping(modo: 'aces' | 'agx' | 'neutro' | 'reinhard'): void {
    if (!this.renderer) return;
    const mapa = {
      aces: THREE.ACESFilmicToneMapping,
      agx: THREE.AgXToneMapping,
      neutro: THREE.NeutralToneMapping,
      reinhard: THREE.ReinhardToneMapping,
    } as const;
    this.renderer.toneMapping = mapa[modo] ?? THREE.ACESFilmicToneMapping;
    // materiais compilados cacheiam o tone mapping — força recompilação
    this.personagem?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.needsUpdate = true; });
    });
  }

  /** mega 262 (§449): intensidade do ENVIRONMENT map (0 = desliga). */
  definirAmbiente(intensidade: number): void {
    this.ambienteUsuario = intensidade; // onda 1408: o usuário vence o look
    if (!this.cena) return;
    (this.cena as THREE.Scene & { environmentIntensity?: number }).environmentIntensity =
      Math.min(1.2, Math.max(0, intensidade));
  }

  // ── onda 1408 (MEGA_BRIEFING_01 Parte 8 §1756–§1767/§2001–§2006, #161):
  //    LOOKS — registry Looks3d como fonte única de luz ────────────────

  /** Aplica um look do registry: key/fill/ambiente/env/rim do look/exposição
   *  base. `estudio` = valores canônicos de montar() byte a byte (contrato
   *  testado). NÃO toca fundo, câmera, aro do usuário nem partículas. */
  aplicarLook(id: LookId | string): void {
    const look = lookDe(id);
    this.lookAtual = look.id;
    // onda 1420 (#206, as6.dev_iluminacao): multiplicadores dev — null
    // (o caminho normal) multiplica por 1 = byte a byte
    const m = this.devLuz;
    if (this.luzes) {
      const { chave, preencher, ambiente } = this.luzes;
      chave.color.setHex(look.key.cor); chave.intensity = look.key.intensidade * (m?.key ?? 1); chave.position.set(...look.key.pos);
      preencher.color.setHex(look.fill.cor); preencher.intensity = look.fill.intensidade * (m?.fill ?? 1); preencher.position.set(...look.fill.pos);
      ambiente.intensity = look.ambiente;
    }
    if (this.cena && this.ambienteUsuario === null) {
      (this.cena as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = look.env;
    }
    if (this.rimLook) { this.cena?.remove(this.rimLook); this.rimLook.dispose(); this.rimLook = null; }
    if (look.rim && this.cena) {
      this.rimLook = new THREE.DirectionalLight(look.rim.cor, look.rim.intensidade * (m?.rim ?? 1));
      this.rimLook.position.set(...look.rim.pos);
      this.cena.add(this.rimLook);
    }
    // onda 1419 (#205, as6.sombras_v2): bias/softness da sombra e FOG
    // seguem o LOOK — sem a flag, defaults do three e sem névoa (byte a
    // byte o comportamento anterior)
    if (flag('as6.sombras_v2')) {
      if (this.luzes) {
        this.luzes.chave.shadow.bias = look.sombra.bias;
        this.luzes.chave.shadow.radius = look.sombra.raio;
      }
      if (this.cena) {
        this.cena.fog = look.fog
          ? new THREE.Fog(look.fog.cor, look.fog.near, look.fog.far)
          : null;
      }
    }
    this.aplicarExposicao();
    this.aplicarPosV2(); // onda 1420 (#206): a cadeia de pós segue o look
  }
  lookAtivo(): LookId { return this.lookAtual; }

  // ── onda 1420 (MEGA_BRIEFING_01 P8-D §1965–§1977, #206): PÓS V2 ─────

  /** (Re)aplica a cadeia de pós do LOOK atual × passes permitidos no
   *  tier (QualityManager.passesPos). Cadeia vazia (estudio, tier
   *  econômico, flag off) = composer DERRUBADO — render 100% legado.
   *  Falha de construção = fallback silencioso + `p3d_pos_fallback`. */
  private aplicarPosV2(): void {
    if (!flag('as6.pos_v2')) { this.derrubarPosV2(); return; }
    if (!this.renderer || !this.cena || !this.camera) return;
    const look = LOOKS[this.lookAtual];
    const permitidos = passesPos(this.tierEfetivo());
    const bloom = look.pos.bloom && permitidos.bloom ? look.pos.bloom : null;
    const grade = look.pos.grade && permitidos.grade ? look.pos.grade : null;
    const vinheta = look.pos.vinheta && permitidos.vinheta ? look.pos.vinheta : null;
    if (!bloom && !grade && !vinheta) { this.derrubarPosV2(); return; }
    try {
      if (!this.composerV2) {
        const tam = this.renderer.getSize(new THREE.Vector2());
        const composer = new EffectComposer(this.renderer);
        composer.addPass(new RenderPass(this.cena, this.camera));
        const pb = new UnrealBloomPass(tam, 0, 0.4, 1);
        const pg = new ShaderPass(SHADER_GRADE);
        const pv = new ShaderPass(SHADER_VINHETA);
        composer.addPass(pb); composer.addPass(pg); composer.addPass(pv);
        this.passesV2 = { bloom: pb, grade: pg, vinheta: pv };
        this.composerV2 = composer;
        this.geracaoPosV2 += 1;
      }
      const { bloom: pb, grade: pg, vinheta: pv } = this.passesV2;
      if (pb) {
        pb.enabled = bloom !== null;
        if (bloom) { pb.strength = bloom.forca * (this.devLuz?.bloom ?? 1); pb.radius = bloom.raio; pb.threshold = bloom.limiar; }
      }
      if (pg) {
        pg.enabled = grade !== null;
        if (grade) {
          pg.uniforms.uSat.value = grade.saturacao;
          pg.uniforms.uTemp.value = grade.temperatura;
          pg.uniforms.uCon.value = grade.contraste;
          pg.uniforms.uPele.value = grade.protegerPele ? 1 : 0;
        }
      }
      if (pv) {
        pv.enabled = vinheta !== null;
        if (vinheta) { pv.uniforms.uForca.value = vinheta.forca; pv.uniforms.uSuav.value = vinheta.suavidade; }
      }
    } catch (e) {
      this.derrubarPosV2();
      telemetria('p3d_pos_fallback', { look: this.lookAtual, motivo: e instanceof Error ? e.message.slice(0, 80) : 'erro' });
    }
  }

  private derrubarPosV2(): void {
    try { this.composerV2?.dispose(); } catch { /* contexto pode já ter morrido */ }
    this.composerV2 = null;
    this.passesV2 = { bloom: null, grade: null, vinheta: null };
  }

  /** Diagnóstico do pós v2 (testes/HUD): passes ativos + geração do
   *  composer (cresce a cada reconstrução — prova o context loss). */
  posInfo(): { v2: boolean; passes: string[]; geracao: number } {
    const p: string[] = [];
    if (this.composerV2) {
      if (this.passesV2.bloom?.enabled) p.push('bloom');
      if (this.passesV2.grade?.enabled) p.push('grade');
      if (this.passesV2.vinheta?.enabled) p.push('vinheta');
    }
    return { v2: this.composerV2 !== null, passes: p, geracao: this.geracaoPosV2 };
  }

  /** onda 1420 (#206, as6.dev_iluminacao — DEV): multiplicadores sobre o
   *  look atual (key/fill/rim/bloom). NUNCA persiste; null = restaura o
   *  look puro byte a byte (o gate da flag é do caller/UI). */
  ajustarLuzDev(m: { key?: number; fill?: number; rim?: number; bloom?: number } | null): void {
    this.devLuz = m ? { key: m.key ?? 1, fill: m.fill ?? 1, rim: m.rim ?? 1, bloom: m.bloom ?? 1 } : null;
    this.aplicarLook(this.lookAtual);
  }

  // ── onda 1408 (§105, §141–§146; flag as6.qa_visual — dev): OVERLAYS ──

  /** Overlay de QA sobre a cena inteira via scene.overrideMaterial (zero
   *  dependência nova): clay (cinza neutro), normals, wireframe, silhueta
   *  (preto sobre branco), grayscale (filtro CSS no canvas). 'nenhum'
   *  restaura EXATAMENTE (materiais originais intocados). */
  definirOverlay(modo: 'nenhum' | 'clay' | 'normals' | 'wireframe' | 'silhueta' | 'grayscale'): void {
    if (!this.cena || !this.renderer) return;
    this.overlayAtual = modo;
    if (this.overlayMaterial) { this.overlayMaterial.dispose(); this.overlayMaterial = null; }
    this.cena.overrideMaterial = null;
    this.renderer.domElement.style.filter = '';
    if (modo === 'clay') this.overlayMaterial = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.85, metalness: 0 });
    else if (modo === 'normals') this.overlayMaterial = new THREE.MeshNormalMaterial();
    else if (modo === 'wireframe') this.overlayMaterial = new THREE.MeshBasicMaterial({ color: 0x7c9cff, wireframe: true });
    else if (modo === 'silhueta') this.overlayMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    else if (modo === 'grayscale') this.renderer.domElement.style.filter = 'grayscale(1)';
    if (this.overlayMaterial) this.cena.overrideMaterial = this.overlayMaterial;
  }
  overlayAtivo(): string { return this.overlayAtual; }

  /** Cena de CALIBRAÇÃO visual (§107–§109): fundo cinza 18 % neutro, look
   *  estudio, exposição base, color checker opcional (6 esferas: branco,
   *  preto, cinza 18 %, metal, pele de referência, emissivo). Desligar
   *  restaura fundo/look anteriores. Tudo gerado em código (sem asset). */
  definirLaboratorio(ligado: boolean, comChecker = true): void {
    if (!this.cena) return;
    if (ligado && !this.laboratorio) {
      this.laboratorio = { fundoAntes: this.fundoAtual, lookAntes: this.lookAtual, checker: null };
      this.aplicarLook('estudio');
      this.cena.background = new THREE.Color(0x2e2e2e); // 18 % em sRGB ≈ #2e2e2e
      if (comChecker) {
        const g = new THREE.Group();
        g.name = 'avst-color-checker';
        const amostras: Array<[number, Partial<THREE.MeshStandardMaterialParameters>]> = [
          [0xffffff, { roughness: 0.6, metalness: 0 }],
          [0x000000, { roughness: 0.6, metalness: 0 }],
          [0x777777, { roughness: 0.6, metalness: 0 }],
          [0xd8d8d8, { roughness: 0.25, metalness: 1 }],
          [0xe8b58c, { roughness: 0.55, metalness: 0 }],
          [0x000000, { emissive: new THREE.Color(0x39d98a), emissiveIntensity: 1.5, roughness: 0.6 }],
        ];
        amostras.forEach(([cor, params], i) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 16), new THREE.MeshStandardMaterial({ color: cor, ...params }));
          m.position.set(-0.75 + i * 0.3, 0.1, 0.9);
          m.castShadow = true;
          g.add(m);
        });
        this.cena.add(g);
        this.laboratorio.checker = g;
      }
    } else if (!ligado && this.laboratorio) {
      const lab = this.laboratorio;
      this.laboratorio = null;
      if (lab.checker) {
        this.cena.remove(lab.checker);
        lab.checker.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); (m.material as THREE.Material)?.dispose?.(); });
      }
      this.aplicarLook(lab.lookAntes);
      this.definirFundo(lab.fundoAntes);
    }
  }
  laboratorioAtivo(): boolean { return this.laboratorio !== null; }

  /** onda 1408 (§2010, §1686–§1690): SNAPSHOT de métricas para goldens de
   *  luz/câmera e HUD — look, exposição efetiva, fov, posição da câmera,
   *  luzes, texturas/programas/geometrias do renderer.info. */
  snapshotMetricas(): {
    look: string; exposicao: number; toneMapping: number; env: number; fov: number;
    camera: [number, number, number]; luzes: Array<{ tipo: string; cor: string; intensidade: number; pos: [number, number, number] }>;
    texturas: number; programas: number; geometrias: number; drawCalls: number; triangulos: number; overlay: string; laboratorio: boolean;
  } {
    const r3 = (v: THREE.Vector3): [number, number, number] => [Math.round(v.x * 1000) / 1000, Math.round(v.y * 1000) / 1000, Math.round(v.z * 1000) / 1000];
    const luzes: Array<{ tipo: string; cor: string; intensidade: number; pos: [number, number, number] }> = [];
    this.cena?.traverse((o) => {
      const l = o as THREE.Light;
      if (!(l as THREE.Light).isLight) return;
      luzes.push({ tipo: l.type, cor: `#${l.color.getHexString()}`, intensidade: Math.round(l.intensity * 1000) / 1000, pos: r3(l.position) });
    });
    const info = this.renderer?.info;
    return {
      look: etiquetaLook(this.lookAtual),
      exposicao: Math.round((this.renderer?.toneMappingExposure ?? 1) * 1000) / 1000,
      toneMapping: this.renderer?.toneMapping ?? 0,
      env: Math.round((((this.cena as THREE.Scene & { environmentIntensity?: number } | null)?.environmentIntensity ?? 0) * 1000)) / 1000,
      fov: this.camera?.fov ?? 0,
      camera: this.camera ? r3(this.camera.position) : [0, 0, 0],
      luzes,
      texturas: info?.memory.textures ?? 0,
      programas: info?.programs?.length ?? 0,
      geometrias: info?.memory.geometries ?? 0,
      drawCalls: info?.render.calls ?? 0,
      triangulos: info?.render.triangles ?? 0,
      overlay: this.overlayAtual,
      laboratorio: this.laboratorio !== null,
    };
  }

  /** megas 261/267 (§440–§441): VIDA procedural (null = desliga). */
  definirVida(intensidade: number | null): void {
    this.vida = intensidade === null ? null : { intensidade: Math.min(1.5, Math.max(0.2, intensidade)) };
  }

  /** mega 268 (§452): RIM LIGHT — aro na cor dada (null = remove). */
  definirRim(cor: string | null): void {
    if (this.rim) {
      this.cena?.remove(this.rim);
      this.rim.dispose();
      this.rim = null;
    }
    if (!cor || !this.cena) return;
    this.rim = new THREE.DirectionalLight(cor, 2.4);
    this.rim.position.set(-1.2, 1.6, -2.2); // atrás e acima — contorno
    this.cena.add(this.rim);
  }

  /** megas 264/269 (§444–§446): PARTÍCULAS determinísticas na cor dada.
   *  Campo cilíndrico ao redor do personagem; densidade cai no tier
   *  econômico; null = remove e libera GPU. */
  definirParticulas3d(cor: string | null): void {
    if (this.particulas3d) {
      this.cena?.remove(this.particulas3d);
      this.particulas3d.geometry.dispose();
      (this.particulas3d.material as THREE.Material).dispose();
      this.particulas3d = null;
      this.particulasBase = null;
    }
    if (!cor || !this.cena) return;
    const n = this.tierEfetivo() === 'economico' ? 36 : 90;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // determinístico: mulberry-like por índice (nunca Math.random)
      const a = ((i * 2654435761) % 4096) / 4096 * Math.PI * 2;
      const r = 0.45 + (((i * 40503) % 997) / 997) * 0.55;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (((i * 69069) % 1013) / 1013) * 1.6;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    this.particulasBase = pos.slice();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particulas3d = new THREE.Points(geo, new THREE.PointsMaterial({
      color: cor, size: 0.035, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.cena.add(this.particulas3d);
  }

  /** mega 265 (§454): ENQUADRAMENTO fino — 'auto' ajusta ao Box3 com
   *  margem; 'rosto' aproxima do bone da cabeça (fallback: topo da caixa). */
  enquadrar(alvo: 'auto' | 'rosto' = 'auto'): void {
    if (!this.camera || !this.personagem) return;
    this.orbitaAuto = false; // one-shot manda: a órbita cinematográfica solta
    this.movCamera = 'nenhum'; this.movBase = null; // §176.3
    const caixa = new THREE.Box3().setFromObject(this.personagem);
    const centro = caixa.getCenter(new THREE.Vector3());
    const tam = caixa.getSize(new THREE.Vector3());
    if (alvo === 'rosto') {
      const boneCabeca = this.bones.get('Head') ?? this.bones.get('head')
        ?? this.bones.get('mixamorigHead') ?? this.bones.get('Neck') ?? null;
      const foco = new THREE.Vector3();
      if (boneCabeca) boneCabeca.getWorldPosition(foco);
      else foco.set(centro.x, caixa.max.y - tam.y * 0.12, centro.z);
      const d = Math.max(0.4, tam.y * 0.55);
      this.camera.position.set(foco.x + d * 0.25, foco.y + d * 0.1, foco.z + d);
      this.camera.lookAt(foco);
      return;
    }
    const maior = Math.max(tam.x, tam.y, tam.z);
    const d = maior * 1.9;
    this.camera.position.set(centro.x + d * 0.28, centro.y + maior * 0.32, centro.z + d);
    this.camera.lookAt(centro);
  }

  /** mega 331 (§176): movimento contínuo da câmera — 'dolly' aproxima e
   *  afasta lentamente; 'panoramica' desliza na vertical. §176.3: comandos
   *  manuais (controles/enquadrar/definirCamera) desligam o movimento.
   *  megas 571–573 (§176.1, flag as5.palco_v3 na UI): 'orbita' gira em
   *  torno do alvo (amplitude limitada — sem deriva) e 'composto' soma
   *  dolly + panorâmica (movimento composto). */
  definirMovimentoCamera(modo: 'nenhum' | 'dolly' | 'panoramica' | 'orbita' | 'composto'): void {
    this.movCamera = modo;
    this.movBase = null; // re-ancora no próximo frame
    if (modo !== 'nenhum') this.orbitaAuto = false;
  }

  /** mega 333 (§457/§177): pós leve (vinheta + saturação) no canvas.
   *  §177.1: NUNCA no tier econômico; false = canvas 100% legado. */
  definirPos(ligado: boolean, real = false): void {
    this.posAtivo = ligado;
    this.posReal = real; // onda 1420: p/ recriar o composer pós context loss
    const canvas = this.renderer?.domElement;
    if (!canvas) return;
    const aplicar = ligado && this.tierEfetivo() !== 'economico';
    // megas 451-455 (§457, flag as5.pos3d_real): COMPOSER de verdade —
    // bloom leve + vinheta em shader; §177.1: nunca no econômico
    this.composerReal = aplicar && real;
    if (this.composerReal && !this.composer && this.renderer && this.cena && this.camera) {
      try {
        const tam = this.renderer.getSize(new THREE.Vector2());
        const composer = new EffectComposer(this.renderer);
        composer.addPass(new RenderPass(this.cena, this.camera));
        composer.addPass(new UnrealBloomPass(tam, 0.32, 0.5, 0.85)); // sutil
        composer.addPass(new ShaderPass({
          uniforms: { tDiffuse: { value: null } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
          fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float d = distance(vUv, vec2(0.5)); c.rgb *= smoothstep(0.95, 0.45, d) * 0.25 + 0.75; gl_FragColor = c; }',
        }));
        this.composer = composer;
      } catch { this.composerReal = false; /* fallback: filter abaixo */ }
    }
    const filtroCss = aplicar && !this.composerReal;
    canvas.style.filter = filtroCss ? 'saturate(1.12) contrast(1.05)' : '';
    canvas.style.boxShadow = filtroCss ? 'inset 0 0 90px 30px rgba(0,0,0,0.4)' : '';
  }

  /** mega 79 (§451): sombras REAIS quando o tier aguenta; econômico usa a
   *  sombra fake de sempre. Chamado no montar/qualidade/carregar. */
  private atualizarSombras(): void {
    const reais = this.tierEfetivo() !== 'economico';
    this.definirPos(this.posAtivo); // §177.1: pós segue o tier a quente
    this.aplicarPosV2(); // onda 1420 (#206): degradação POR PASS segue o tier
    this.sombrasLigadas = reais;
    if (this.luzes) this.luzes.chave.castShadow = reais;
    if (this.chaoSombra) this.chaoSombra.visible = reais;
    if (this.chao) this.chao.visible = !reais; // fake só quando a real está fora
    // onda 1419 (#205, as6.sombras_v2): shadow map POR TIER (512/1024/2048),
    // contact shadow SEMPRE (gradiente radial procedural — ancora mesmo com
    // a sombra real ligada) e shadow camera justa no personagem
    if (flag('as6.sombras_v2')) {
      if (this.luzes) {
        const tam = { economico: 512, medio: 1024, alto: 2048 }[this.tierEfetivo()] ?? 1024;
        if (this.luzes.chave.shadow.mapSize.x !== tam) {
          this.luzes.chave.shadow.mapSize.set(tam, tam);
          this.luzes.chave.shadow.map?.dispose();
          (this.luzes.chave.shadow as unknown as { map: null }).map = null; // força rebuild
        }
      }
      if (this.chao) {
        this.chao.visible = true; // contact shadow sempre (§P8-C)
        const mat = this.chao.material as THREE.MeshBasicMaterial;
        if (!mat.map) {
          mat.map = criarTexturaContato();
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
        }
        mat.opacity = reais ? 0.22 : 0.34; // com a real ligada, só ancora
      }
      this.ajustarCameraSombra();
    }
    this.personagem?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = reais;
    });
    // lote 131: props fora do personagem (pet) também seguem o tier
    for (const [, prop] of this.props3d) {
      prop.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = reais; });
    }
  }

  /** onda 1419 (#205): SHADOW CAMERA justa no Box3 do personagem —
   *  resolução do mapa concentrada onde importa (menos serrilhado). */
  private ajustarCameraSombra(): void {
    if (!this.luzes || !this.personagem) return;
    const caixa = new THREE.Box3().setFromObject(this.personagem);
    for (const [, prop] of this.props3d) caixa.expandByObject(prop);
    if (caixa.isEmpty()) return;
    const tam = caixa.getSize(new THREE.Vector3());
    const meio = Math.max(tam.x, tam.y, tam.z) * 0.75;
    const cam = this.luzes.chave.shadow.camera as THREE.OrthographicCamera;
    cam.left = -meio; cam.right = meio; cam.top = meio; cam.bottom = -meio;
    cam.near = 0.5; cam.far = 12;
    cam.updateProjectionMatrix();
  }

  /** mega 81 (§419–§420): TINTA de destaque nos materiais (null = original).
   *  Cor original fica em userData — reaplicar nunca acumula. */
  definirTinta(cor: string | null, forca = 0.3): void {
    this.tinta = cor ? { cor, forca } : null;
    this.aplicarTinta();
  }

  /** lote 641–650 (§420): cores §73 personalizadas por canal — a UI fala
   *  canais, nunca nomes de mesh; null = arte original. O CALLER decide a
   *  flag (as5.materiais3d) — aqui é só o mecanismo (padrão da casa). */
  definirCores3d(cores: Record<string, string> | null): void {
    if (JSON.stringify(cores) === JSON.stringify(this.cores3d)) return;
    this.cores3d = cores ? { ...cores } : null;
    this.aplicarTinta(); // re-tinge VIVO — sem recarregar o personagem
  }

  /** Pipeline ÚNICO de cor (megas 641-644): restaura originais → canais
   *  §420 → tinta mega 81 → teto de emissivos §418.2 (Materiais3d). */
  private aplicarTinta(): void {
    if (!this.personagem) return;
    if (this.materiaisV2) {
      // onda 1408 (#160/#165a): marcas do manifest (canal pele das bases UBC,
      // naoTingir) e famílias declaradas ANTES do tint — idempotente
      marcarMateriaisPorManifest(this.personagem, this.manifest?.materiais ?? null);
      aplicarFamilias(this.personagem, this.tierEfetivo());
    }
    aplicarPipelineCores(this.personagem, { cores: this.cores3d, tinta: this.tinta });
  }
  /** onda 1408 (#160): liga/desliga o uso dos metadados de material do
   *  manifest v2 (as6.material_v2). OFF = pipeline anterior byte a byte. */
  definirMateriaisV2(v: boolean): void {
    if (this.materiaisV2 === v) return;
    this.materiaisV2 = v;
    if (v) this.aplicarTinta();
    else if (this.slugAtual) void this.carregarPersonagem(this.slugAtual); // restaura materiais do GLB (parse fresco)
  }

  /** lote 651–660 (§412–§414): morfos ESTRUTURAIS de corpo — a MESMA
   *  tabela §102 do 2D (engine/render) vira escala do personagem; o
   *  ajuste fino §102.2 MULTIPLICA o preset (regra da decisão #63).
   *  Escala no OBJETO raiz: base, cabelo, barba e roupas (mesmo esqueleto
   *  pós-rebind) acompanham juntas — §413 "morphs respeitam roupas/rig".
   *  Neutro = escala 1 = render idêntico (byte-stability do visual).
   *  O CALLER decide a flag (as5.morfos3d) — aqui é só o mecanismo. */
  definirCorpo3d(corpo: { tipo?: string | null; fino?: { largura?: number; altura?: number } | null } | null): void {
    if (JSON.stringify(corpo) === JSON.stringify(this.corpo3d)) return;
    this.corpo3d = corpo ? { tipo: corpo.tipo ?? null, fino: corpo.fino ?? null } : null;
    this.aplicarCorpo3d();
  }

  /** Tabela §102 (espelho de engine/render.ts — [largura, altura]). */
  private static readonly CORPOS_3D: Record<string, [number, number]> = {
    esbelto: [0.95, 1.02], atletico: [1.05, 1], robusto: [1.1, 0.98], compacto: [0.97, 0.94],
  };

  private aplicarCorpo3d(): void {
    if (!this.personagem) return;
    const preset = Renderizador3d.CORPOS_3D[this.corpo3d?.tipo ?? ''] ?? [1, 1];
    const larg = Math.min(1.15, Math.max(0.88, preset[0] * (this.corpo3d?.fino?.largura ?? 1)));
    const alt = Math.min(1.07, Math.max(0.9, preset[1] * (this.corpo3d?.fino?.altura ?? 1)));
    this.personagem.scale.set(larg, alt, larg); // XZ = largura · Y = altura
  }

  /** mega 82 (§444): AURA 3D — anel additive pulsante na cor do avatar. */
  definirAura3d(cor: string | null): void {
    if (this.aura3d) {
      this.cena?.remove(this.aura3d);
      this.aura3d.geometry.dispose();
      (this.aura3d.material as THREE.Material).dispose();
      this.aura3d = null;
    }
    if (!cor || !this.cena) return;
    this.aura3d = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.05, 12, 48),
      new THREE.MeshBasicMaterial({
        color: cor, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    this.aura3d.rotation.x = -Math.PI / 2;
    this.aura3d.position.y = 0.07;
    this.cena.add(this.aura3d);
  }

  /** mega 80 (§442–§443): congela o clipe num TEMPO exato (pose salva). */
  poseNoTempo(clipe: string, tempo: number): void {
    if (!this.mixer) return;
    const c = this.clipes.get(clipe);
    if (!c) return;
    this.acaoAtual?.stop();
    const acao = this.mixer.clipAction(c);
    acao.reset();
    acao.play();
    acao.paused = true;
    acao.time = Math.max(0, tempo % Math.max(0.001, c.duration));
    this.acaoAtual = acao;
    this.mixer.update(0);
    this.pausado = true;
    if (this.renderer && this.cena && this.camera) this.renderer.render(this.cena, this.camera);
  }

  // ── lote 131–140 (§426–§431): SOCKETS de acessórios ─────────────
  /** §426: prop procedural num socket ('cabeca'|'rosto'|'pet'; null tira).
   *  Tipos: chapeu · coroa · oculos · pet. A prop é APROXIMAÇÃO honesta —
   *  quando o UBC chegar, a MESMA API recebe as malhas reais. */
  definirProp3d(socket: 'cabeca' | 'rosto' | 'pet', tipo: string | null, cor = '#7c5cff'): void {
    if (tipo) this.tiposProp.set(socket, { tipo, cor });
    else this.tiposProp.delete(socket);
    this.aplicarProps();
  }

  /** Reconstrói as props (troca de personagem/LOD chama de novo). */
  private aplicarProps(): void {
    // remove as atuais
    for (const [, obj] of this.props3d) {
      obj.parent?.remove(obj);
      obj.traverse((n) => {
        const m = n as THREE.Mesh;
        if (m.isMesh) { m.geometry?.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x?.dispose()); }
      });
    }
    this.props3d.clear();
    if (!this.personagem || !this.cena) return;
    // §427: escala pela CABEÇA real do personagem (Box3 — pug ≠ androide)
    const caixa = new THREE.Box3().setFromObject(this.personagem);
    const altura = Math.max(0.2, caixa.getSize(new THREE.Vector3()).y);
    const s = altura * 0.16;
    const boneCabeca = this.bones.get('Head') ?? this.bones.get('head')
      ?? this.bones.get('mixamorigHead') ?? this.bones.get('Neck') ?? null;
    for (const [socket, { tipo, cor }] of this.tiposProp) {
      const prop = this.construirProp(tipo, cor, s);
      if (!prop) continue;
      prop.traverse((n) => { if ((n as THREE.Mesh).isMesh) (n as THREE.Mesh).castShadow = this.sombrasLigadas; });
      if (socket === 'pet') {
        this.cena.add(prop); // §430: companion orbita a CENA no laço
      } else if (boneCabeca) {
        // bones podem carregar ESCALA herdada — compensa p/ tamanho mundial
        const escalaMundo = new THREE.Vector3();
        boneCabeca.getWorldScale(escalaMundo);
        const f = 1 / Math.max(0.0001, escalaMundo.y);
        prop.scale.multiplyScalar(f);
        prop.position.y = (socket === 'cabeca' ? s * 1.15 : s * 0.15) * f;
        if (socket === 'rosto') prop.position.z = s * 0.75 * f;
        boneCabeca.add(prop);
      } else {
        // sem rig de cabeça (personagem estático): ancora no topo da caixa
        prop.position.set(0, caixa.max.y + (socket === 'cabeca' ? s * 0.4 : 0), socket === 'rosto' ? s * 0.7 : 0);
        this.cena.add(prop);
      }
      this.props3d.set(socket, prop);
    }
  }

  /** Geometria procedural de cada tipo (primitivas three — zero download). */
  private construirProp(tipo: string, cor: string, s: number): THREE.Object3D | null {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.45, metalness: 0.35 });
    const escuro = new THREE.MeshStandardMaterial({ color: '#14181f', roughness: 0.6, metalness: 0.2 });
    if (tipo === 'chapeu') {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(s * 0.95, s * 0.95, s * 0.08, 24), mat)); // aba
      const copa = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.55, s * 0.6, s * 0.7, 24), escuro);
      copa.position.y = s * 0.38;
      g.add(copa);
    } else if (tipo === 'coroa') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.62, s * 0.62, s * 0.3, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: cor, roughness: 0.25, metalness: 0.8, side: THREE.DoubleSide }));
      g.add(base);
      for (let i = 0; i < 5; i += 1) {
        const ponta = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.32, 8), base.material);
        const a = (i / 5) * Math.PI * 2;
        ponta.position.set(Math.sin(a) * s * 0.62, s * 0.3, Math.cos(a) * s * 0.62);
        g.add(ponta);
      }
    } else if (tipo === 'oculos') {
      const aro = new THREE.TorusGeometry(s * 0.28, s * 0.05, 10, 24);
      const e = new THREE.Mesh(aro, escuro);
      e.position.x = -s * 0.34;
      const d = new THREE.Mesh(aro.clone(), escuro);
      d.position.x = s * 0.34;
      const ponte = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.04, s * 0.04, s * 0.24, 8), escuro);
      ponte.rotation.z = Math.PI / 2;
      g.add(e, d, ponte);
    } else if (tipo === 'pet') {
      const corpo = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 20, 16), mat);
      const olho = new THREE.Mesh(new THREE.SphereGeometry(s * 0.16, 12, 10),
        new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      olho.position.set(0, s * 0.1, s * 0.42);
      g.add(corpo, olho);
    } else {
      return null;
    }
    return g;
  }

  /** mega 80: tempo atual do clipe ativo (p/ salvar a pose do scrub). */
  tempoDaPose(): { clipe: string | null; tempo: number } {
    const clip = this.acaoAtual?.getClip();
    let nome: string | null = null;
    if (clip) for (const [k, v] of this.clipes) { if (v === clip) { nome = k; break; } }
    return { clipe: nome, tempo: this.acaoAtual?.time ?? 0 };
  }

  /** Tier EFETIVO: 'auto' delega ao adaptativo (mega 16) + §462 (mega
   *  683): canvas PEQUENO rebaixa um nível — "painel menor → LOD2"
   *  (§461); só com o progressivo ligado (flag no caller). */
  private tierEfetivo(): QualidadeTier {
    const t = this.qualidade === 'auto' ? this.tierAuto : this.qualidade;
    if (this.progressivoAtivo) {
      const larg = this.alvoEl?.clientWidth ?? Infinity;
      if (larg > 0 && larg < 420) return t === 'alto' ? 'medio' : 'economico';
    }
    return t;
  }

  private lodDesejado(): string {
    return this.manifest === null || this.slugAtual === null
      ? `?${String(this.tierEfetivo())}`
      : urlDoLod(this.manifest, this.tierEfetivo(), this.opcoes.basePersonagens);
  }

  /** mega 17: pré-carrega manifest+GLB do personagem (hover no chip). */
  precarregar(slug: string): void {
    void carregarManifest3d(slug, this.opcoes.basePersonagens)
      .then((m) => { void this.gltfDe(urlDoLod(m, this.tierEfetivo(), this.opcoes.basePersonagens), this.hashDoLod(m)); })
      .catch(() => { /* prefetch é oportunista */ });
  }

  /** mega 684 (§471): preloader contextual de PARTES (hover nos chips de
   *  cabelo/barba/roupa) — nunca o catálogo inteiro. */
  precarregarParte(slug: string): void {
    void carregarManifestParte(slug)
      .then((m) => { void this.gltfDe(urlDaParte(m, this.tierEfetivo()), this.hashDoLod(m)); })
      .catch(() => { /* prefetch é oportunista */ });
  }

  /** lote 681–690: liga o progressivo §470/§462/§475 (caller decide a
   *  flag as5.progressivo3d — aqui é só o mecanismo). */
  definirProgressivo(v: boolean): void {
    this.progressivoAtivo = v;
  }

  /** mega 693 (§483): DPR dinâmico — caller decide (as5.quality3d_v2). */
  definirDprDinamico(v: boolean): void {
    this.dprDinamico = v;
    if (!v && this.renderer && this.dprAtual !== this.dprBase) {
      this.dprAtual = this.dprBase;
      this.renderer.setPixelRatio(this.dprBase);
    }
  }

  /** mega 692 (§482.1): teto de DPR do perfil (ultra=3, cine=3). */
  definirDprMax(teto: number): void {
    this.pixelRatioMax = Math.min(3, Math.max(1, teto));
    if (!this.renderer) return;
    this.dprBase = Math.min(window.devicePixelRatio || 1, this.pixelRatioMax);
    this.dprAtual = this.dprBase;
    this.renderer.setPixelRatio(this.dprBase);
  }

  /** hash §477 do LOD efetivo (invalidação do cache §475 por conteúdo). */
  private hashDoLod(m: ManifestPersonagem3d): string | null {
    const lod = lodPorQualidade(this.tierEfetivo());
    return m.hashes?.[lod] ?? null;
  }

  /** Bytes do GLB com cache LRU em memória + parse fresco por uso
   *  (mega 17). Lote 681-690: LRU REAL com pin do personagem atual
   *  (§474) e, com o progressivo ligado, IndexedDB por hash (§475). */
  private async gltfDe(url: string, hash?: string | null): Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] }> {
    let bytes = this.cacheGlb.get(url);
    if (bytes) {
      // §474 LRU: uso recente vai pro fim da fila de despejo
      this.cacheGlb.delete(url);
      this.cacheGlb.set(url, bytes);
    } else {
      bytes = this.progressivoAtivo
        ? buscarComCache(url, hash) // §475: IDB → rede (e grava)
        : fetch(url, { cache: 'default' }).then((r) => {
          if (!r.ok) throw new Error(`GLB ${r.status}`);
          return r.arrayBuffer();
        });
      this.cacheGlb.set(url, bytes);
      bytes.catch(() => this.cacheGlb.delete(url)); // erro não envenena
      if (this.cacheGlb.size > 8) {
        // §474: nunca despeja o personagem ATUAL (prioridade máxima)
        for (const chave of this.cacheGlb.keys()) {
          if (chave !== this.lodAtual) { this.cacheGlb.delete(chave); break; }
        }
      }
    }
    const buf = await bytes;
    const g = await new GLTFLoader().parseAsync(buf.slice(0), '');
    return { scene: g.scene, animations: g.animations ?? [] };
  }

  /** onda 1409: emite evento de asset (nunca lança; sem callback = no-op). */
  private eventoAsset(ev: EventoAsset3d): void {
    try { this.opcoes.aoEventoAsset?.(ev); } catch { /* observador quebrado não derruba o palco */ }
  }

  /** onda 1409: nome do LOD ('lod0'…) a partir da URL publicada. */
  private static lodDaUrl(url: string | null): string | undefined {
    const m = url ? /\.(lod[0-9])\.glb/.exec(url) : null;
    return m ? m[1] : undefined;
  }

  private async carregarPersonagem(slug: string): Promise<void> {
    try {
      await this.carregarPersonagemInterno(slug);
    } catch (e) {
      this.eventoAsset({ tipo: 'asset_falhou', slug, lod: Renderizador3d.lodDaUrl(this.manifest ? urlDoLod(this.manifest, this.tierEfetivo(), this.opcoes.basePersonagens) : null), erro: String((e as Error)?.message ?? e).slice(0, 80) });
      throw e;
    }
  }

  private async carregarPersonagemInterno(slug: string): Promise<void> {
    // §473 (mega 681): geração de carga — quem chegar DEPOIS manda;
    // resposta antiga é descartada em silêncio (nunca sobrescreve)
    const geracao = ++this.geracaoCarga;
    const obsoleto = () => geracao !== this.geracaoCarga;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const slugAntes = this.slugAtual;
    const lodAntes = Renderizador3d.lodDaUrl(this.lodAtual);
    this.maquinaAnim.ir('carregando'); // §433
    this.opcoes.aoCarregamento?.('metadados'); // §472
    const manifest = await carregarManifest3d(slug, this.opcoes.basePersonagens);
    if (obsoleto()) return;
    this.manifest = manifest;
    const url = urlDoLod(this.manifest, this.tierEfetivo(), this.opcoes.basePersonagens);
    // §470 (mega 682): PROGRESSIVO — alvo frio e pesado? o download do
    // ALVO começa já; enquanto voa, o LOD2 (base simplificada) entra na
    // cena como stand-in — "o usuário vê algo útil rapidamente"
    this.opcoes.aoCarregamento?.('baixando'); // §472
    const alvoFrio = !this.cacheGlb.has(url);
    const alvoPromise = this.gltfDe(url, this.hashDoLod(this.manifest));
    let alvoPronto = false;
    alvoPromise.then(() => { alvoPronto = true; }).catch(() => { /* tratado no await */ });
    const urlLod2 = urlDoLod(this.manifest, 'economico', this.opcoes.basePersonagens);
    if (this.progressivoAtivo && url !== urlLod2 && alvoFrio) {
      try {
        const rapido = await this.gltfDe(urlLod2, this.manifest.hashes?.lod2 ?? null);
        if (obsoleto()) return;
        if (!alvoPronto) { // alvo ainda em voo → stand-in na cena
          this.removerPersonagem();
          this.personagem = rapido.scene;
          this.personagem.traverse((n) => {
            if ((n as THREE.SkinnedMesh).isSkinnedMesh) n.frustumCulled = false;
          });
          this.cena?.add(this.personagem);
          this.definirCamera(this.cameraAtual);
          this.opcoes.aoCarregamento?.('modelo_rapido'); // §472
          this.eventoAsset({ tipo: 'fallback_ativado', slug, lod: 'lod2', motivo: 'standin_lod2' }); // onda 1409
        }
      } catch { /* §481: stand-in é acelerador, nunca dependência */ }
    }
    const gltf = await alvoPromise; // parse fresco — cena exclusiva do palco
    if (obsoleto()) return;
    this.opcoes.aoCarregamento?.('montando'); // §472
    this.removerPersonagem();
    this.personagem = gltf.scene;
    // SkinnedMesh clonado: a boundingSphere fica do BIND POSE original e o
    // frustum culling corta o mesh (androide/RobotExpressive ficou
    // invisível — mega 17). Skinned anima longe da esfera: culling OFF.
    this.personagem.traverse((n) => {
      if ((n as THREE.SkinnedMesh).isSkinnedMesh) n.frustumCulled = false;
    });
    this.cena?.add(this.personagem);
    this.slugAtual = slug;
    this.lodAtual = url;
    // onda 1408 (#165a): marcas de material do manifest v2 ANTES do
    // assembler — o passo "pele" reconhece a pele das bases UBC por metadado
    if (this.materiaisV2) marcarMateriaisPorManifest(this.personagem, manifest.materiais ?? null);
    // clipes REAIS do GLB (mega 9): mixer + mapa por nome; toca Idle já
    this.mixer?.stopAllAction();
    this.mixer = null;
    this.acaoAtual = null;
    this.clipes.clear();
    if (gltf.animations?.length) {
      this.mixer = new THREE.AnimationMixer(this.personagem);
      for (const clipe of gltf.animations) this.clipes.set(clipe.name, clipe);
      const idle = this.clipes.get('Idle') ?? this.clipes.get('Idle_Neutral') ?? gltf.animations[0];
      if (idle && this.idleAtivo) {
        this.acaoAtual = this.mixer.clipAction(idle);
        this.acaoAtual.play();
      }
    }
    // bones p/ o idle procedural + pose de referência (volta ao pausar)
    this.bones.clear();
    this.poseBase.clear();
    this.personagem.traverse((n) => {
      if ((n as THREE.Bone).isBone) {
        this.bones.set(n.name, n as THREE.Bone);
        this.poseBase.set(n.name, n.quaternion.clone());
      }
    });
    if (this.controles) {
      const caixa = new THREE.Box3().setFromObject(this.personagem);
      this.controles.target.copy(caixa.getCenter(new THREE.Vector3()));
    }
    // megas 625-626 (§406): PARTES no esqueleto da base — só quando há
    // partes pedidas E a base é do rig ubc-v1; [] = zero mudança (§651)
    await this.montarPartes3d();
    // lote 661-670 (§432): pacote externo entra DEPOIS do rebind — o
    // esqueleto final é um só e o clipe move base+cabelo+barba+roupas
    this.anexarPacoteExterno();
    this.maquinaAnim.ir('idle'); // §433: personagem pronto
    this.atualizarSombras(); // mega 79: castShadow no personagem novo
    this.aplicarTinta();     // mega 81: tinta sobrevive à troca/LOD
    this.aplicarCorpo3d();   // lote 651-660: morfos §414 sobrevivem à troca/LOD
    this.aplicarProps();     // lote 131: props seguem o personagem novo
    this.definirCamera(this.cameraAtual); // preserva órbita/retrato no reload §528
    this.opcoes.aoCarregamento?.('pronto'); // §472
    // onda 1409: observabilidade — carga concluída / transição de LOD
    const lodNovo = Renderizador3d.lodDaUrl(url);
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
    if (slugAntes === slug && lodAntes && lodNovo && lodAntes !== lodNovo) {
      this.eventoAsset({ tipo: 'lod_transicao', slug, lod: lodNovo, lodAnterior: lodAntes, ms });
    } else {
      this.eventoAsset({ tipo: 'asset_carregou', slug, lod: lodNovo, ms });
    }
  }

  /** lote 661–670 (§432/§436): pacote de clipes EXTERNO (UAL) — mesmo
   *  rig ubc-v1, tracks por NOME de bone = reuso direto. null volta ao
   *  comportamento anterior byte a byte. O CALLER decide a flag
   *  (as5.animacao3d) — aqui é só o mecanismo. Erro degrada §481. */
  async definirPacoteAnimacoes(url: string | null): Promise<void> {
    await this.definirPacotesAnimacoes(url ? [url] : []);
  }

  /** lote 731-740 (§432): LISTA de pacotes — o básico define o Idle
   *  canônico; extras SOMAM emotes (primeiro pacote vence conflito de
   *  nome). Falha individual degrada §481 (os demais seguem). */
  async definirPacotesAnimacoes(urls: string[]): Promise<void> {
    const iguais = urls.length === this.urlsPacotesAnim.length
      && urls.every((u, i) => u === this.urlsPacotesAnim[i]);
    if (iguais) return;
    this.urlsPacotesAnim = [...urls];
    if (!urls.length) {
      this.pacotesAnim = [];
      if (this.slugAtual) await this.carregarPersonagem(this.slugAtual);
      return;
    }
    const resultados = await Promise.allSettled(urls.map((u) => carregarPacoteAnimacoes(u)));
    this.pacotesAnim = resultados
      .filter((r): r is PromiseFulfilledResult<PacoteAnimacoes> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (!this.pacotesAnim.length) return; // §481: nada disponível — palco segue
    this.anexarPacoteExterno();
  }

  /** Anexa os clipes dos pacotes quando o GLB do personagem NÃO traz os
   *  próprios (§432 "mapear"): mixer novo na raiz montada — base e partes
   *  compartilham o esqueleto pós-rebind, então o clipe veste tudo. */
  private anexarPacoteExterno(): void {
    if (!this.pacotesAnim.length || !this.personagem) return;
    if (this.manifest?.rig !== 'ubc-v1') return; // pacotes são do rig ubc-v1
    if (this.clipes.size) return; // clipes do próprio GLB têm prioridade
    this.mixer = new THREE.AnimationMixer(this.personagem);
    for (const [nome, clipe] of mesclarClipes(this.pacotesAnim)) this.clipes.set(nome, clipe);
    // mega 670: convenções de nome da UAL entram no fallback do idle
    const idle = this.clipes.get('Idle') ?? this.clipes.get('Idle_Loop') ?? [...this.clipes.values()][0];
    if (idle && this.idleAtivo) {
      this.acaoAtual = this.mixer.clipAction(idle);
      this.acaoAtual.play();
    }
  }

  /** §439: cursor normalizado (-1..1) → alvo do olhar; null = centro.
   *  O CALLER desliga em prefers-reduced-motion (flag as5.animacao3d). */
  definirOlhar(nx: number | null, ny: number | null): void {
    this.olharAlvo = alvoOlhar(nx, ny);
  }

  /** O clipe atual anima o Head? (sem isso o olhar acumularia rotação) */
  private clipeAtualMoveHead(): boolean {
    const c = this.acaoAtual?.getClip();
    return !!c && c.tracks.some((t) => t.name.split('.')[0] === 'Head');
  }

  /** lote 621–630 (§406): define as partes 3D e remonta o personagem.
   *  O CALLER decide a flag (as5.assembler3d) — aqui é só o mecanismo. */
  async definirPartes3d(slugs: string[]): Promise<void> {
    const iguais = slugs.length === this.partes3d.length
      && slugs.every((s, i) => s === this.partes3d[i]);
    if (iguais) return;
    this.partes3d = [...slugs];
    if (this.slugAtual) await this.carregarPersonagem(this.slugAtual);
  }

  /** Monta as partes pedidas via Character Assembler §406 (14 passos). */
  private async montarPartes3d(): Promise<void> {
    this.ultimaMontagem = null;
    if (!this.partes3d.length || !this.personagem) return;
    if (this.manifest?.rig !== 'ubc-v1') {
      // §481: base fora do rig — partes ignoradas com pendência declarada
      this.eventoAsset({ tipo: 'fallback_ativado', slug: this.slugAtual ?? '?', motivo: 'rig_incompativel' }); // onda 1409
      this.ultimaMontagem = {
        ok: false,
        fases: [{ passo: 'validar_rig', ok: false, detalhe: `base "${this.slugAtual}" com rig ${this.manifest?.rig ?? '?'} — partes exigem ubc-v1` }],
        raiz: null, mixer: null, clipes: new Map(),
        pendencias: [`partes ignoradas: base não é ubc-v1`],
      };
      return;
    }
    const partes = [];
    for (const slug of this.partes3d) {
      try {
        const m = await carregarManifestParte(slug);
        const gltf = await this.gltfDe(urlDaParte(m, this.tierEfetivo()));
        partes.push({
          id: slug, categoria: categoriaDaParte(m.tipo), cena: gltf.scene,
          ...(m.mascara?.length ? { mascara: m.mascara } : {}), // §415.2
        });
        this.eventoAsset({ tipo: 'parte_carregou', slug }); // onda 1409
      } catch (e) {
        /* §481: parte indisponível não derruba o palco */
        this.eventoAsset({ tipo: 'parte_falhou', slug, motivo: 'parte_ignorada', erro: String((e as Error)?.message ?? e).slice(0, 80) }); // onda 1409
      }
    }
    if (!partes.length) return;
    this.ultimaMontagem = montarPersonagem({
      base: this.personagem,
      partes,
      bonesCanonicos: BONES_UBC_V1,
    });
    // rebind altera a hierarquia — re-mapeia bones/pose p/ o idle §440
    this.bones.clear();
    this.poseBase.clear();
    this.personagem.traverse((n) => {
      if ((n as THREE.Bone).isBone) {
        this.bones.set(n.name, n as THREE.Bone);
        this.poseBase.set(n.name, n.quaternion.clone());
      }
    });
  }

  private removerPersonagem(): void {
    if (!this.personagem) return;
    this.cena?.remove(this.personagem);
    // §419 "descartar recursos": materiais + TEXTURAS (parse fresco por
    // GLB — nada compartilhado com outros donos) via Material Manager
    descartarMateriais(this.personagem);
    this.personagem.traverse((n) => {
      const malha = n as THREE.Mesh;
      if (malha.isMesh) malha.geometry?.dispose();
    });
    this.personagem = null;
    this.slugAtual = null;
    this.lodAtual = null;
  }

  /** Idle procedural — FALLBACK p/ GLBs sem clipes (ex.: manequim dev). */
  private animarIdle(): void {
    if (!this.idleAtivo || this.mixer) return;
    const t = this.relogio;
    const girar = (nome: string, eixoX: number, eixoZ: number) => {
      const bone = this.bones.get(nome);
      const base = this.poseBase.get(nome);
      if (!bone || !base) return;
      bone.quaternion.copy(base);
      bone.rotateX(eixoX);
      bone.rotateZ(eixoZ);
    };
    girar('Spine', Math.sin(t * 1.7) * 0.028, Math.sin(t * 0.9) * 0.012);
    girar('Chest', Math.sin(t * 1.7 + 0.5) * 0.022, 0);
    girar('Head', Math.sin(t * 0.8) * 0.02, Math.sin(t * 0.55) * 0.015);
    girar('Hips', 0, Math.sin(t * 0.9) * 0.008);
  }

  private laço = (): void => {
    this.raf = requestAnimationFrame(this.laço);
    if (this.pausado || this.contextoPerdido || !this.renderer || !this.cena || !this.camera) return;
    this.relogio += 1 / 60; // passo FIXO: idle igual em qualquer refresh
    // onda 1419 (#204): TRANSIÇÃO de câmera 300ms — interromível (um novo
    // definirCamera substitui this.transicaoCam; easing suave)
    if (this.transicaoCam) {
      const t = Math.min(1, (performance.now() - this.transicaoCam.inicio) / TRANSICAO_CAMERA_MS);
      const k = t * t * (3 - 2 * t); // smoothstep
      const { de, para } = this.transicaoCam;
      this.camera.position.lerpVectors(de.pos, para.pos, k);
      this.alvoCam.lerpVectors(de.alvo, para.alvo, k);
      this.camera.fov = de.fov + (para.fov - de.fov) * k;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.alvoCam);
      if (t >= 1) this.transicaoCam = null;
    }
    // mega 16: FPS real (média móvel de 90 quadros) → tier adaptativo
    const agora = performance.now();
    if (this.fpsUltimo > 0) {
      const dt = agora - this.fpsUltimo;
      if (dt > 0 && dt < 1000) { this.fpsSoma += 1000 / dt; this.fpsN += 1; }
      if (this.fpsN >= 90) {
        const media = this.fpsSoma / this.fpsN;
        this.fpsMedia = media;
        this.fpsSoma = 0; this.fpsN = 0;
        // mega 693 (§483): DPR dinâmico SUAVE — último recurso quando o
        // FPS cai contínuo (depois do tier); recupera gradualmente.
        // SÓ em qualidade AUTO (mesma regra do tier adaptativo §528):
        // qualidade fixa é escolha do usuário — determinística.
        if (this.dprDinamico && this.renderer && this.qualidade === 'auto') {
          const novo = passoDpr(media, this.dprAtual, this.dprBase);
          if (Math.abs(novo - this.dprAtual) > 0.01) {
            this.dprAtual = novo;
            this.renderer.setPixelRatio(novo);
          }
        }
        if (this.qualidade === 'auto') {
          if (media < 30 && this.tierAuto !== 'economico') {
            this.tierAuto = 'economico';
            this.atualizarSombras(); // mega 79
            this.opcoes.aoMudarQualidade('economico', 'fps_baixo');
            if (this.ultimoEstado) void this.aplicarEstado(this.ultimoEstado);
          } else if (media > 55 && this.tierAuto !== 'medio') {
            this.tierAuto = 'medio';
            this.atualizarSombras(); // mega 79
            this.opcoes.aoMudarQualidade('medio', 'fps_folga');
            if (this.ultimoEstado) void this.aplicarEstado(this.ultimoEstado);
          }
        }
      }
    }
    this.fpsUltimo = agora;
    this.animarIdle();
    this.mixer?.update(1 / 60);
    // megas 261/267 (§440–§441): VIDA procedural ADITIVA — DEPOIS do mixer
    // (o clipe manda; a vida só soma micro-rotações por cima, nunca troca)
    if (this.vida) {
      const k = this.vida.intensidade;
      const t = this.relogio;
      const soma = (nome: string, rx: number, rz: number) => {
        const bone = this.bones.get(nome);
        if (!bone) return;
        if (!this.mixer && !this.idleAtivo) {
          // sem mixer nem idle ninguém repõe a pose → repõe aqui (não acumula)
          const base = this.poseBase.get(nome);
          if (base) bone.quaternion.copy(base);
        }
        bone.rotateX(rx);
        bone.rotateZ(rz);
      };
      soma('Spine', Math.sin(t * 1.4) * 0.02 * k, 0); // respiração §440
      soma('Chest', Math.sin(t * 1.4 + 0.4) * 0.016 * k, 0);
      // lote 661-670 (§441): rig ubc-v1 respira de verdade — peito/ombros
      // (nomes legados acima seguem cobrindo androide/manequim)
      soma('spine_02', Math.sin(t * 1.4) * 0.02 * k, 0);
      soma('spine_03', Math.sin(t * 1.4 + 0.4) * 0.016 * k, 0);
      soma('Head', Math.sin(t * 0.7) * 0.018 * k, Math.sin(t * 0.5) * 0.012 * k); // §441
    }
    // lote 661-670 (§439): OLHAR — suaviza rumo ao alvo do cursor e
    // aplica no Head APÓS idle/mixer/vida. Só aplica quando alguém repõe
    // o Head por frame (idle, vida, ou clipe com track de Head) ou quando
    // ninguém anima (repõe aqui) — rotação nunca ACUMULA.
    this.olharAtual.guinada += (this.olharAlvo.guinada - this.olharAtual.guinada) * 0.08;
    this.olharAtual.arfagem += (this.olharAlvo.arfagem - this.olharAtual.arfagem) * 0.08;
    if (Math.abs(this.olharAtual.guinada) > 0.001 || Math.abs(this.olharAtual.arfagem) > 0.001) {
      const head = this.bones.get('Head');
      const idleRepoe = this.idleAtivo && !this.mixer;
      const vidaRepoe = !!this.vida && !this.mixer && !this.idleAtivo;
      const clipeRepoe = !!this.mixer && !!this.acaoAtual && this.clipeAtualMoveHead();
      const ninguemAnima = !this.mixer && !this.idleAtivo && !this.vida;
      if (head && (idleRepoe || vidaRepoe || clipeRepoe || ninguemAnima)) {
        if (ninguemAnima) {
          const base = this.poseBase.get('Head');
          if (base) head.quaternion.copy(base);
        }
        head.rotateY(this.olharAtual.guinada);
        head.rotateX(this.olharAtual.arfagem);
      }
    }
    // megas 264/269 (§444–§446): partículas em DERIVA ascendente com
    // reciclagem no topo — determinístico (base + relógio, nunca random)
    if (this.particulas3d && this.particulasBase) {
      const attr = this.particulas3d.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const base = this.particulasBase;
      for (let i = 0; i < base.length; i += 3) {
        arr[i] = base[i] + Math.sin(this.relogio * 0.9 + i) * 0.05;
        arr[i + 1] = (base[i + 1] + this.relogio * 0.16 + i * 0.002) % 1.7;
        arr[i + 2] = base[i + 2] + Math.cos(this.relogio * 0.8 + i) * 0.05;
      }
      attr.needsUpdate = true;
    }
    // mega 331 (§176): movimento cinematográfico — oscilação senoidal
    // ANCORADA na pose atual da câmera (nunca acumula deriva)
    if (this.movCamera !== 'nenhum' && this.camera && this.personagem) {
      if (!this.movBase) {
        const caixa = new THREE.Box3().setFromObject(this.personagem);
        this.movBase = { pos: this.camera.position.clone(), alvo: caixa.getCenter(new THREE.Vector3()) };
      }
      const bm = this.movBase;
      if (this.movCamera === 'dolly') {
        const dir = bm.pos.clone().sub(bm.alvo);
        const fator = 1 + Math.sin(this.relogio * 0.35) * 0.09;
        this.camera.position.copy(bm.alvo.clone().add(dir.multiplyScalar(fator)));
      } else if (this.movCamera === 'orbita') {
        // megas 571–573 (§176.1): órbita LIMITADA em torno do alvo — o
        // ângulo oscila (seno), então nunca acumula deriva (§176.3)
        const ang = Math.sin(this.relogio * 0.22) * 0.5;
        const dir = bm.pos.clone().sub(bm.alvo);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        this.camera.position.copy(bm.alvo.clone().add(dir));
      } else if (this.movCamera === 'composto') {
        // megas 571–573 (§176.1): MOVIMENTO COMPOSTO = dolly + panorâmica
        // em fases diferentes (nunca sincronizados = sensação orgânica)
        const dir = bm.pos.clone().sub(bm.alvo);
        const fator = 1 + Math.sin(this.relogio * 0.28) * 0.07;
        const pos = bm.alvo.clone().add(dir.multiplyScalar(fator));
        pos.y += Math.sin(this.relogio * 0.19 + 1.3) * 0.1;
        this.camera.position.copy(pos);
      } else {
        this.camera.position.set(bm.pos.x, bm.pos.y + Math.sin(this.relogio * 0.3) * 0.12, bm.pos.z);
      }
      this.camera.lookAt(bm.alvo);
    }
    // mega 82: aura 3D respira (rotação + pulso sutil)
    if (this.aura3d) {
      this.aura3d.rotation.z = this.relogio * 0.8;
      const pulso = 1 + Math.sin(this.relogio * 2.2) * 0.045;
      this.aura3d.scale.set(pulso, pulso, 1);
    }
    // §430: o PET orbita o personagem com bobbing (companion vivo)
    const pet = this.props3d.get('pet');
    if (pet && this.personagem) {
      const caixa = new THREE.Box3().setFromObject(this.personagem);
      const centro = caixa.getCenter(new THREE.Vector3());
      const alturaP = caixa.getSize(new THREE.Vector3()).y;
      const a = this.relogio * 0.9;
      pet.position.set(
        centro.x + Math.sin(a) * alturaP * 0.55,
        centro.y + alturaP * 0.28 + Math.sin(this.relogio * 2.6) * alturaP * 0.04,
        centro.z + Math.cos(a) * alturaP * 0.55,
      );
      pet.lookAt(centro.x, pet.position.y, centro.z);
    }
    if (this.controles?.enabled) {
      // alvo do orbit acompanha o personagem (uma vez por frame é barato)
      this.controles.update();
    } else if (this.orbitaAuto && this.personagem) {
      const caixa = new THREE.Box3().setFromObject(this.personagem);
      const centro = caixa.getCenter(new THREE.Vector3());
      const maior = Math.max(...caixa.getSize(new THREE.Vector3()).toArray());
      const az = this.relogio * 0.35;
      this.camera.position.set(
        centro.x + maior * 1.8 * Math.sin(az),
        centro.y + maior * 0.6,
        centro.z + maior * 1.8 * Math.cos(az),
      );
      this.camera.lookAt(centro);
    }
    if (this.composerV2) this.composerV2.render(); // onda 1420 (#206): pós v2 do look
    else if (this.composerReal && this.composer) this.composer.render();
    else this.renderer.render(this.cena, this.camera);
  };
}
