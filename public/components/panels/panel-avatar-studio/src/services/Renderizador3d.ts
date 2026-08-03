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
import type {
  CapturaRender, EstadoCamera, InicializacaoRenderer, OpcoesCaptura,
  PedidoAnimacao, PedidoPoder, RenderizadorAvatar, ResultadoAplicarEstado,
} from '../nucleo/renderizador';
import type { EstadoAvatar, QualidadeTier } from '../nucleo/contratos';
import { carregarManifest3d, urlDoLod } from './Personagens3d';
import type { ManifestPersonagem3d } from './Personagens3d';

export interface OpcoesRenderizador3d {
  /** decide o SLUG publicado a partir do estado (DI — default: manequim) */
  resolverPersonagem?: (estado: EstadoAvatar) => string;
  /** base das pastas publicadas (o teste aponta p/ servidor efêmero) */
  basePersonagens?: string;
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
  private bones: Map<string, THREE.Bone> = new Map();
  private poseBase: Map<string, THREE.Quaternion> = new Map();
  // ANIMAÇÕES REAIS (mega 9): clipes do próprio GLB via AnimationMixer;
  // o idle procedural vira FALLBACK p/ modelos sem clipes (ex.: manequim)
  private mixer: THREE.AnimationMixer | null = null;
  private clipes: Map<string, THREE.AnimationClip> = new Map();
  private acaoAtual: THREE.AnimationAction | null = null;

  constructor(opcoes: OpcoesRenderizador3d = {}) {
    this.opcoes = {
      resolverPersonagem: opcoes.resolverPersonagem ?? (() => 'manequim_dev'),
      basePersonagens: opcoes.basePersonagens ?? '/assets/avatars/3d/personagens',
    };
  }

  async inicializar(config: InicializacaoRenderer): Promise<void> {
    this.qualidade = config.qualidade;
    this.pixelRatioMax = config.pixelRatioMax ?? 2;
    this.antialias = config.antialias ?? true;
  }

  async montar(alvo: { innerHTML: string }): Promise<void> {
    const el = alvo as unknown as HTMLElement;
    if (typeof (el as { appendChild?: unknown }).appendChild !== 'function') {
      throw new Error('Renderizador3d.montar exige um HTMLElement real (canvas WebGL não vive em innerHTML)');
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.pixelRatioMax)); // §402
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const l = Math.max(1, el.clientWidth || 480);
    const a = Math.max(1, el.clientHeight || 480);
    this.renderer.setSize(l, a);
    el.appendChild(this.renderer.domElement);

    // cena canônica — MESMA luz do §508 (thumbs): palco e thumb conversam
    this.cena = new THREE.Scene();
    this.cena.background = new THREE.Color(FUNDO_ESTUDIO);
    const chave = new THREE.DirectionalLight(0xffffff, 2.6);
    chave.position.set(2.2, 3.0, 2.6);
    const preencher = new THREE.DirectionalLight(0x9db4ff, 1.1);
    preencher.position.set(-2.4, 1.2, -1.6);
    this.cena.add(chave, preencher, new THREE.AmbientLight(0xffffff, 0.55));
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
    if (!this.camera || !this.personagem) return;
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
    const estava = this.pausado;
    if (opcoes.deterministica !== false) this.pausado = true; // §508
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
    this.pausado = estava;
    return { dataUri, largura: opcoes.largura, altura: opcoes.altura };
  }

  definirQualidade(perfil: QualidadeTier | 'auto'): void {
    this.qualidade = perfil;
    // troca de LOD a quente: recarrega em silêncio se o tier mudou o arquivo
    if (this.ultimoEstado && this.lodDesejado() !== this.lodAtual) {
      void this.aplicarEstado(this.ultimoEstado);
    }
  }

  pausar(): void { this.pausado = true; }
  retomar(): void { this.pausado = false; }

  async descartar(): Promise<void> {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.mixer?.stopAllAction();
    this.mixer = null;
    this.acaoAtual = null;
    this.clipes.clear();
    this.removerPersonagem();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
    this.renderer = null;
    this.cena = null;
    this.camera = null;
  }

  // ── privados ────────────────────────────────────────────────────
  private lodDesejado(): string {
    return this.manifest === null || this.slugAtual === null
      ? `?${String(this.qualidade)}`
      : urlDoLod(this.manifest, this.qualidade, this.opcoes.basePersonagens);
  }

  private async carregarPersonagem(slug: string): Promise<void> {
    this.manifest = await carregarManifest3d(slug, this.opcoes.basePersonagens);
    const url = urlDoLod(this.manifest, this.qualidade, this.opcoes.basePersonagens);
    const gltf = await new GLTFLoader().loadAsync(url);
    this.removerPersonagem();
    this.personagem = gltf.scene;
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
    this.definirCamera({ modo: 'corpo' });
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
    if (this.pausado || !this.renderer || !this.cena || !this.camera) return;
    this.relogio += 1 / 60; // passo FIXO: idle igual em qualquer refresh
    this.animarIdle();
    this.mixer?.update(1 / 60);
    if (this.orbitaAuto && this.personagem) {
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
    this.renderer.render(this.cena, this.camera);
  };
}
