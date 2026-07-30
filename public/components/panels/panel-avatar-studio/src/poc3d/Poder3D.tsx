// poc3d/Poder3D.tsx — sistema de PODER com partículas (AS4 Fase 1).
// @version 1.0.0  @created 2026-07-30
//
// O briefing exige poderes como SISTEMA real com fases (idle → ativação →
// clímax → dissipação) e cena reagindo (luz + aro do chão). Implementação:
// THREE.Points com ~420 partículas orbitais atualizadas por frame (barato),
// blending aditivo na cor de destaque, ponto de luz pulsando no clímax.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type FasePoder = 'inativo' | 'carga' | 'climax' | 'dissipa';

const N = 420;
const DURACAO: Record<Exclude<FasePoder, 'inativo'>, number> = {
  carga: 0.6, climax: 0.55, dissipa: 0.75,
};

export function Poder3D({ fase, cor, aoAvancar }: {
  fase: FasePoder;
  cor: string;
  /** chamada quando a fase atual termina (o pai avança a máquina de estados) */
  aoAvancar: (proxima: FasePoder) => void;
}) {
  const pontosRef = useRef<THREE.Points>(null);
  const luzRef = useRef<THREE.PointLight>(null);
  const aroRef = useRef<THREE.Mesh>(null);
  const relogio = useRef(0);

  // sementes fixas por partícula (determinístico entre execuções)
  const dados = useMemo(() => {
    const posicoes = new Float32Array(N * 3);
    const sementes = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const s1 = (i * 16807) % 2147483647 / 2147483647;
      const s2 = ((i + 999) * 48271) % 2147483647 / 2147483647;
      const s3 = ((i + 4242) * 69621) % 2147483647 / 2147483647;
      sementes[i * 3] = s1; sementes[i * 3 + 1] = s2; sementes[i * 3 + 2] = s3;
    }
    return { posicoes, sementes };
  }, []);

  useFrame((estado, dt) => {
    const pontos = pontosRef.current;
    const luz = luzRef.current;
    const aro = aroRef.current;
    if (!pontos || !luz || !aro) return;
    const mat = pontos.material as THREE.PointsMaterial;
    const t = estado.clock.elapsedTime;

    if (fase === 'inativo') {
      relogio.current = 0;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.12);
      luz.intensity = THREE.MathUtils.lerp(luz.intensity, 0, 0.12);
      (aro.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp((aro.material as THREE.MeshBasicMaterial).opacity, 0, 0.12);
      return;
    }

    relogio.current += dt;
    const dur = DURACAO[fase];
    const p = Math.min(1, relogio.current / dur);

    // alvo por fase: raio da órbita, altura, opacidade, luz
    let raio = 0.9; let altura = 0.35; let opa = 0.35; let forca = 0.8; let vel = 1.4;
    if (fase === 'carga') { raio = 1.1 - 0.55 * p; altura = 0.3 + 0.9 * p; opa = 0.28 + 0.5 * p; forca = 0.6 + 2.2 * p; vel = 1.2 + 3.2 * p; }
    if (fase === 'climax') { raio = 0.5 + 1.5 * p; altura = 1.15; opa = 0.95 - 0.25 * p; forca = 5.4 - 1.2 * p; vel = 5.2; }
    if (fase === 'dissipa') { raio = 2.0 + 0.8 * p; altura = 1.15 - 0.6 * p; opa = 0.65 * (1 - p); forca = 3.6 * (1 - p); vel = 2.2; }

    const pos = pontos.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const s1 = dados.sementes[i * 3];
      const s2 = dados.sementes[i * 3 + 1];
      const s3 = dados.sementes[i * 3 + 2];
      const ang = s1 * Math.PI * 2 + t * vel * (0.6 + s2 * 0.8);
      const r = raio * (0.55 + s2 * 0.75);
      const y = altura * (0.25 + s3 * 1.25) + Math.sin(t * 2.4 + s1 * 9) * 0.06;
      pos.setXYZ(i, Math.cos(ang) * r, y, Math.sin(ang) * r);
    }
    pos.needsUpdate = true;

    mat.opacity = Math.min(1, opa * 1.3);
    mat.size = fase === 'climax' ? 0.11 : 0.07;
    luz.intensity = forca;
    const aroMat = aro.material as THREE.MeshBasicMaterial;
    aroMat.opacity = Math.min(0.85, opa + 0.15);
    aro.scale.setScalar(fase === 'climax' ? 1 + p * 1.6 : 1);

    if (p >= 1) {
      relogio.current = 0;
      aoAvancar(fase === 'carga' ? 'climax' : fase === 'climax' ? 'dissipa' : 'inativo');
    }
  });

  return (
    <group>
      <points ref={pontosRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dados.posicoes, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={cor} size={0.05} sizeAttenuation transparent opacity={0}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <pointLight ref={luzRef} position={[0, 1.2, 0]} color={cor} intensity={0} distance={7} decay={1.8} />
      {/* anel de energia no chão — o CENÁRIO reage ao poder (§ poderes) */}
      <mesh ref={aroRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.05, 1.28, 64]} />
        <meshBasicMaterial color={cor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
