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
import { carregarManifest3d, urlDoLod } from './Personagens3d';
import type { ManifestPersonagem3d } from './Personagens3d';
import { montarPersonagem } from './Assembler3d'; // lote 621-630 (§406)
import type { ResultadoMontagem } from './Assembler3d';
import { BONES_UBC_V1, carregarManifestParte, categoriaDaParte, urlDaParte } from './Partes3d';

export interface OpcoesRenderizador3d {
  /** decide o SLUG publicado a partir do estado (DI — default: manequim) */
  resolverPersonagem?: (estado: EstadoAvatar) => string;
  /** base das pastas publicadas (o teste aponta p/ servidor efêmero) */
  basePersonagens?: string;
  /** mega 16 (§528): avisa quando o modo 'auto' rebaixa/sobe o tier */
  aoMudarQualidade?: (tier: QualidadeTier, motivo: 'fps_baixo' | 'fps_folga') => void;
  /** mega 41: watchdog — avisa a UI quando o contexto WebGL cai/volta */
  aoContexto?: (fase: 'perdido' | 'restaurado') => void;
}

const FUNDO_ESTUDIO = '#0d1017';

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.pixelRatioMax)); // §402
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
    const tamanhoAntes = new THREE.Vector2();
    this.renderer.getSize(tamanhoAntes);
    this.renderer.setSize(opcoes.largura, opcoes.altura);
    this.camera.aspect = opcoes.largura / opcoes.altura;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.cena, this.camera);
    const dataUri = this.renderer.domElement.toDataURL('image/png');
    this.renderer.setSize(tamanhoAntes.x, tamanhoAntes.y);
    this.camera.aspect = tamanhoAntes.x / Math.max(1, tamanhoAntes.y);
    this.camera.updateProjectionMatrix();
    if (opcoes.transparente) {
      this.cena.background = fundoAntes;
      if (this.chao) this.chao.visible = chaoAntes;
      if (this.grade) this.grade.visible = gradeAntes;
      if (this.chaoSombra) this.chaoSombra.visible = sombraAntes;
      this.renderer.render(this.cena, this.camera); // não deixa frame vazado
    }
    this.pausado = estava;
    return { dataUri, largura: opcoes.largura, altura: opcoes.altura };
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
    if (this.composerReal && this.composer) this.composer.render();
    else this.renderer.render(this.cena, this.camera);
  }

  async descartar(): Promise<void> {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
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
    this.camera.aspect = l / a;
    this.camera.updateProjectionMatrix();
  }

  // ── privados ────────────────────────────────────────────────────
  /** mega 21 (§9.3): fundo do palco 3D — paridade com o 2D. */
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
  diagnostico(): { fps: number; tier: string; triangulos: number; sombras: boolean } {
    return {
      fps: Math.round(this.fpsMedia),
      tier: this.tierEfetivo(),
      triangulos: this.manifest?.triangulos?.[
        { alto: 'lod0', medio: 'lod1', economico: 'lod2' }[this.tierEfetivo()] as 'lod0'
      ] ?? 0,
      sombras: this.sombrasLigadas,
    };
  }

  /** mega 78 (§458): exposição do tone mapping (0.6–1.6; 1 = neutro). */
  definirExposicao(v: number): void {
    if (this.renderer) this.renderer.toneMappingExposure = Math.min(1.6, Math.max(0.6, v));
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
    if (!this.cena) return;
    (this.cena as THREE.Scene & { environmentIntensity?: number }).environmentIntensity =
      Math.min(1.2, Math.max(0, intensidade));
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
    this.sombrasLigadas = reais;
    if (this.luzes) this.luzes.chave.castShadow = reais;
    if (this.chaoSombra) this.chaoSombra.visible = reais;
    if (this.chao) this.chao.visible = !reais; // fake só quando a real está fora
    this.personagem?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = reais;
    });
    // lote 131: props fora do personagem (pet) também seguem o tier
    for (const [, prop] of this.props3d) {
      prop.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = reais; });
    }
  }

  /** mega 81 (§419–§420): TINTA de destaque nos materiais (null = original).
   *  Cor original fica em userData — reaplicar nunca acumula. */
  definirTinta(cor: string | null, forca = 0.3): void {
    this.tinta = cor ? { cor, forca } : null;
    this.aplicarTinta();
  }

  private aplicarTinta(): void {
    if (!this.personagem) return;
    this.personagem.traverse((o) => {
      const bruto = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      const lista = Array.isArray(bruto) ? bruto : bruto ? [bruto] : [];
      for (const mat of lista) {
        const ms = mat as THREE.MeshStandardMaterial & { userData: { corOriginal?: number } };
        if (!ms.color) continue;
        if (ms.userData.corOriginal === undefined) ms.userData.corOriginal = ms.color.getHex();
        ms.color.setHex(ms.userData.corOriginal);
        if (this.tinta) ms.color.lerp(new THREE.Color(this.tinta.cor), this.tinta.forca);
      }
    });
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

  /** Tier EFETIVO: 'auto' delega ao adaptativo (mega 16). */
  private tierEfetivo(): QualidadeTier {
    return this.qualidade === 'auto' ? this.tierAuto : this.qualidade;
  }

  private lodDesejado(): string {
    return this.manifest === null || this.slugAtual === null
      ? `?${String(this.tierEfetivo())}`
      : urlDoLod(this.manifest, this.tierEfetivo(), this.opcoes.basePersonagens);
  }

  /** mega 17: pré-carrega manifest+GLB do personagem (hover no chip). */
  precarregar(slug: string): void {
    void carregarManifest3d(slug, this.opcoes.basePersonagens)
      .then((m) => { void this.gltfDe(urlDoLod(m, this.tierEfetivo(), this.opcoes.basePersonagens)); })
      .catch(() => { /* prefetch é oportunista */ });
  }

  /** Bytes do GLB com cache LRU (8) + parse fresco por uso (mega 17). */
  private async gltfDe(url: string): Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] }> {
    let bytes = this.cacheGlb.get(url);
    if (!bytes) {
      bytes = fetch(url, { cache: 'default' }).then((r) => {
        if (!r.ok) throw new Error(`GLB ${r.status}`);
        return r.arrayBuffer();
      });
      this.cacheGlb.set(url, bytes);
      bytes.catch(() => this.cacheGlb.delete(url)); // erro não envenena
      if (this.cacheGlb.size > 8) {
        const primeira = this.cacheGlb.keys().next().value;
        if (primeira) this.cacheGlb.delete(primeira);
      }
    }
    const buf = await bytes;
    const g = await new GLTFLoader().parseAsync(buf.slice(0), '');
    return { scene: g.scene, animations: g.animations ?? [] };
  }

  private async carregarPersonagem(slug: string): Promise<void> {
    this.manifest = await carregarManifest3d(slug, this.opcoes.basePersonagens);
    const url = urlDoLod(this.manifest, this.tierEfetivo(), this.opcoes.basePersonagens);
    const gltf = await this.gltfDe(url); // parse fresco — cena exclusiva do palco
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
    this.atualizarSombras(); // mega 79: castShadow no personagem novo
    this.aplicarTinta();     // mega 81: tinta sobrevive à troca/LOD
    this.aplicarProps();     // lote 131: props seguem o personagem novo
    this.definirCamera(this.cameraAtual); // preserva órbita/retrato no reload §528
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
        partes.push({ id: slug, categoria: categoriaDaParte(m.tipo), cena: gltf.scene });
      } catch { /* §481: parte indisponível não derruba o palco */ }
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
    this.personagem.traverse((n) => {
      const malha = n as THREE.Mesh;
      if (malha.isMesh) {
        malha.geometry?.dispose();
        const mats = Array.isArray(malha.material) ? malha.material : [malha.material];
        for (const m of mats) m?.dispose();
      }
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
    // mega 16: FPS real (média móvel de 90 quadros) → tier adaptativo
    const agora = performance.now();
    if (this.fpsUltimo > 0) {
      const dt = agora - this.fpsUltimo;
      if (dt > 0 && dt < 1000) { this.fpsSoma += 1000 / dt; this.fpsN += 1; }
      if (this.fpsN >= 90) {
        const media = this.fpsSoma / this.fpsN;
        this.fpsMedia = media;
        this.fpsSoma = 0; this.fpsN = 0;
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
      soma('Head', Math.sin(t * 0.7) * 0.018 * k, Math.sin(t * 0.5) * 0.012 * k); // §441
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
    if (this.composerReal && this.composer) this.composer.render();
    else this.renderer.render(this.cena, this.camera);
  };
}
