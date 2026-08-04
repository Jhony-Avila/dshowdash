// services/Capacidade3d.ts — DIAGNÓSTICO de capacidade 3D (AS5 · mega 42).
// @version 1.0.0  @created 2026-08-04
//
// §605-lite: um olhar honesto no hardware ANTES de gastar o primeiro
// frame — WebGL2, renderer real (SwiftShader/llvmpipe = software),
// memória e núcleos. O resultado vira só uma DICA de tier inicial p/ o
// adaptativo §528 (o FPS medido continua mandando) + telemetria. Cacheado
// por sessão: o contexto de sondagem é criado UMA vez e descartado.
import type { QualidadeTier } from '../nucleo/contratos';

export interface Capacidade3d {
  webgl2: boolean;
  renderizador: string;   // string real do driver ('' se o navegador esconde)
  software: boolean;      // SwiftShader/llvmpipe/ANGLE software
  memoriaGb: number | null;
  nucleos: number | null;
  dicaTier: QualidadeTier;
}

let cache: Capacidade3d | null = null;

/** Sondagem única por sessão (cria e descarta um contexto de 1×1). */
export function detectarCapacidade3d(): Capacidade3d {
  if (cache) return cache;
  let webgl2 = false;
  let renderizador = '';
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (gl) {
      webgl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) renderizador = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '');
      gl.getExtension('WEBGL_lose_context')?.loseContext(); // devolve o contexto
    }
  } catch { /* sem WebGL — o palco 3D já tem fallback próprio */ }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memoriaGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const nucleos = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
  const software = /swiftshader|llvmpipe|software|basic render/i.test(renderizador);

  // dica CONSERVADORA: software/pouca máquina começa econômico; máquina
  // folgada começa médio (o §528 sobe sozinho se o FPS deixar)
  const dicaTier: QualidadeTier =
    software || !webgl2 || (memoriaGb !== null && memoriaGb <= 2) ? 'economico' : 'medio';

  cache = { webgl2, renderizador, software, memoriaGb, nucleos, dicaTier };
  return cache;
}

/** Só p/ testes: zera o cache da sondagem. */
export function zerarCapacidade3d(): void { cache = null; }
