// services/Animacoes3d.ts — ANIMATION MANAGER (megas 661–665 · §432–§439,
// lote 661–670, flag as5.animacao3d).
// @version 1.0.0  @created 2026-08-07
//
// Gerenciador CENTRAL de animações §432: carrega PACOTES de clipes (GLBs
// slim, esqueleto+animações, publicados por publicar-animacoes.mjs) e os
// aplica em qualquer personagem do MESMO rig — os tracks endereçam bones
// POR NOME, e o rig ubc-v1 é idêntico em bases/cabelos/roupas (§436:
// retargeting aqui é REUSO direto; a validação §436.1 é a suíte).
// Regras embutidas:
//   · §437 root motion: tracks de POSIÇÃO do root/pelvis/Hips são
//     REMOVIDOS no carregamento — personagem fica no centro, loop fecha;
//   · §433 state machine: estados claros com transições CONTROLADAS
//     (emote nunca quebra captura; pose persiste até pedido explícito);
//   · §439 olhar: alvo do cursor com amplitude LIMITADA (helper puro —
//     o renderer aplica no head bone com suavização e desliga em captura
//     e em prefers-reduced-motion).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface PacoteAnimacoes {
  url: string;
  clipes: Map<string, THREE.AnimationClip>;
}

/** §437: bones cuja POSIÇÃO nunca vem do clipe (root motion fora). */
const RAIZES_SEM_TRANSLACAO = /^(root|pelvis|hips)$/i;

/** Remove root motion §437 de um clipe (mutação controlada no load). */
export function removerRootMotion(clipe: THREE.AnimationClip): THREE.AnimationClip {
  clipe.tracks = clipe.tracks.filter((t) => {
    const [no, prop] = t.name.split('.');
    return !(prop === 'position' && RAIZES_SEM_TRANSLACAO.test(no ?? ''));
  });
  return clipe;
}

const cachePacotes = new Map<string, Promise<PacoteAnimacoes>>();

/** §432 "carregar clips": GLB slim → Map nome→clipe (root motion §437
 *  já removido). Cache por URL — pacote é compartilhado entre trocas de
 *  personagem. Lança em erro de rede/parse (o caller degrada §481). */
export function carregarPacoteAnimacoes(url: string): Promise<PacoteAnimacoes> {
  let p = cachePacotes.get(url);
  if (!p) {
    p = (async () => {
      const r = await fetch(url, { cache: 'default' });
      if (!r.ok) throw new Error(`pacote de animações ${r.status}`);
      const g = await new GLTFLoader().parseAsync(await r.arrayBuffer(), '');
      const clipes = new Map<string, THREE.AnimationClip>();
      for (const c of g.animations ?? []) clipes.set(c.name, removerRootMotion(c));
      if (!clipes.size) throw new Error('pacote sem clipes');
      return { url, clipes };
    })();
    cachePacotes.set(url, p);
    p.catch(() => cachePacotes.delete(url)); // erro não envenena o cache
  }
  return p;
}

// ── §433: ANIMATION STATE MACHINE ───────────────────────────────────
export type EstadoAnimacao =
  | 'carregando' | 'idle' | 'transicao' | 'pose' | 'emote' | 'captura' | 'pausado';

/** Transições PERMITIDAS §433 — tudo que não está aqui é recusado.
 *  O estado RESTRITIVO é a captura: nada entra durante o frame §508
 *  (emote não quebra a captura). Pose é persistente por CONSTRUÇÃO —
 *  nada a troca automaticamente; sair dela é sempre pedido explícito. */
const TRANSICOES: Record<EstadoAnimacao, EstadoAnimacao[]> = {
  carregando: ['idle', 'pausado'],
  idle: ['transicao', 'pose', 'emote', 'captura', 'pausado', 'carregando'],
  transicao: ['idle', 'pose', 'emote'],
  pose: ['idle', 'transicao', 'emote', 'captura', 'pausado', 'carregando'],
  emote: ['idle', 'transicao', 'pose', 'captura', 'pausado', 'carregando'],
  captura: ['idle', 'pose', 'pausado'],
  pausado: ['idle', 'pose', 'carregando'],
};

/** Máquina mínima e auditável: pode()/ir() + motivo da recusa. */
export class MaquinaAnimacao {
  estado: EstadoAnimacao = 'carregando';

  pode(destino: EstadoAnimacao): boolean {
    return destino === this.estado || TRANSICOES[this.estado].includes(destino);
  }

  /** Tenta ir; devolve se FOI (recusa é silenciosa e auditável). */
  ir(destino: EstadoAnimacao): boolean {
    if (!this.pode(destino)) return false;
    this.estado = destino;
    return true;
  }
}

// ── §439: OLHAR (cursor) — helper PURO p/ o renderer aplicar ────────
/** Amplitude máxima §439 (rad): guinada (Y) e arfagem (X) discretas. */
export const OLHAR_MAX = { guinada: 0.28, arfagem: 0.14 };

/** Converte a posição do cursor (normalizada -1..1) no alvo de rotação
 *  do head bone, com amplitude LIMITADA (§439). null = voltar ao centro. */
export function alvoOlhar(
  nx: number | null,
  ny: number | null,
): { guinada: number; arfagem: number } {
  if (nx === null || ny === null) return { guinada: 0, arfagem: 0 };
  const cx = Math.min(1, Math.max(-1, nx));
  const cy = Math.min(1, Math.max(-1, ny));
  return { guinada: cx * OLHAR_MAX.guinada, arfagem: cy * OLHAR_MAX.arfagem };
}
