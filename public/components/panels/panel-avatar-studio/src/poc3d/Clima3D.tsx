// poc3d/Clima3D.tsx — CLIMA do palco vivo (fila #37 item 4).
// @version 1.0.0  @created 2026-07-30
//
// Partículas 100% procedurais (THREE.Points — zero download): chuva cai
// rápido e reseta no topo; neve deriva devagar com balanço senoidal;
// vagalumes vagam com pulso de opacidade. Contagem modesta — o custo fica
// desprezível mesmo no perfil Econômico (1 draw call por clima).
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ClimaId } from './catalogo3d';

const AREA = 10;       // raio do volume de partículas
const TETO = 6;        // altura máxima

/** posições iniciais determinísticas (LCG — nada de Math.random). */
function posicoes(qtd: number, semente: number): Float32Array {
  const arr = new Float32Array(qtd * 3);
  let s = semente >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < qtd; i++) {
    arr[i * 3] = (rnd() - 0.5) * AREA;
    arr[i * 3 + 1] = rnd() * TETO;
    arr[i * 3 + 2] = (rnd() - 0.5) * AREA;
  }
  return arr;
}

function Particulas({ qtd, cor, tamanho, opacidade, animar }: {
  qtd: number;
  cor: string;
  tamanho: number;
  opacidade: number;
  animar: (pos: Float32Array, t: number, dt: number) => void;
}) {
  const ref = useRef<THREE.Points>(null);
  const base = useMemo(() => posicoes(qtd, qtd * 7919), [qtd]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
    return g;
  }, [base]);

  useFrame((estado, dt) => {
    const attr = ref.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!attr) return;
    animar(attr.array as Float32Array, estado.clock.elapsedTime, Math.min(dt, 0.1));
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial color={cor} size={tamanho} transparent opacity={opacidade}
        sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function Clima3D({ clima }: { clima: ClimaId }) {
  if (clima === 'chuva') {
    return (
      <Particulas qtd={420} cor="#9fc4ff" tamanho={0.035} opacidade={0.75}
        animar={(pos, _t, dt) => {
          for (let i = 1; i < pos.length; i += 3) {
            pos[i] -= dt * 7.5;
            if (pos[i] < 0) pos[i] += TETO;
          }
        }} />
    );
  }
  if (clima === 'neve') {
    return (
      <Particulas qtd={280} cor="#f4faff" tamanho={0.05} opacidade={0.9}
        animar={(pos, t, dt) => {
          for (let i = 0; i < pos.length; i += 3) {
            pos[i + 1] -= dt * 0.7;
            pos[i] += Math.sin(t * 0.8 + i) * dt * 0.35;
            if (pos[i + 1] < 0) pos[i + 1] += TETO;
          }
        }} />
    );
  }
  if (clima === 'vagalumes') {
    return (
      <Particulas qtd={46} cor="#d8ff8a" tamanho={0.07} opacidade={0.85}
        animar={(pos, t, dt) => {
          for (let i = 0; i < pos.length; i += 3) {
            pos[i] += Math.sin(t * 0.6 + i * 1.3) * dt * 0.5;
            pos[i + 1] += Math.cos(t * 0.5 + i * 0.7) * dt * 0.3;
            pos[i + 2] += Math.sin(t * 0.4 + i * 2.1) * dt * 0.5;
            if (pos[i + 1] < 0.2) pos[i + 1] = 0.2;
            if (pos[i + 1] > 3.4) pos[i + 1] = 3.4;
          }
        }} />
    );
  }
  return null;
}
