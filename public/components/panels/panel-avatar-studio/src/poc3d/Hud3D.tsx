// poc3d/Hud3D.tsx — medição de desempenho da PoC (AS4 §46: FPS, memória,
// tempo de carregamento) + gatilho da QUALIDADE ADAPTATIVA.
// @version 1.0.0  @created 2026-07-30
//
// Vive DENTRO do Canvas (useFrame) mas não renderiza nada 3D: publica as
// métricas para o pai a cada 500 ms (fora do hot path de render).
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface Metricas {
  fps: number;
  triangulos: number;
  chamadas: number;
  memoriaMB: number | null;
  cargaMs: number | null;
}

export function Hud3D({ aoMedir }: { aoMedir: (m: Metricas) => void }) {
  const gl = useThree((s) => s.gl);
  const quadros = useRef(0);
  const fpsSuave = useRef(60);
  const nascimento = useRef(performance.now());
  const primeiroQuadro = useRef<number | null>(null);

  useFrame((_, dt) => {
    quadros.current += 1;
    if (primeiroQuadro.current === null) {
      primeiroQuadro.current = performance.now() - nascimento.current;
    }
    if (dt > 0) {
      fpsSuave.current = fpsSuave.current * 0.95 + (1 / dt) * 0.05;
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      aoMedir({
        fps: Math.round(fpsSuave.current),
        triangulos: gl.info.render.triangles,
        chamadas: gl.info.render.calls,
        memoriaMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null,
        cargaMs: primeiroQuadro.current === null ? null : Math.round(primeiroQuadro.current),
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [gl, aoMedir]);

  return null;
}
