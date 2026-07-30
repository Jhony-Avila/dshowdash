// poc3d/Cena3D.tsx — iluminação cinematográfica + cenário 3D (AS4 Fase 1).
// @version 1.0.0  @created 2026-07-30
//
// 3 presets de LUZ (estúdio/dramática/neon — chave + preenchimento + recorte)
// independentes de 2 CENÁRIOS (vazio/grade neon), como o briefing separa.
// A cor de DESTAQUE do avatar tinge o aro do chão e a luz de recorte —
// "iluminação reagir ao personagem" (§41).
import { useMemo } from 'react';
import * as THREE from 'three';
import type { CenarioId, IluminacaoId } from './catalogo3d';

interface PresetLuz {
  ambiente: { ceu: string; chao: string; forca: number };
  chave: { cor: string; forca: number; pos: [number, number, number] };
  preenchimento: { cor: string; forca: number; pos: [number, number, number] };
  recorte: { cor: string | 'destaque'; forca: number; pos: [number, number, number] };
}

const LUZES: Record<IluminacaoId, PresetLuz> = {
  estudio: {
    ambiente: { ceu: '#cdd6ff', chao: '#171320', forca: 0.65 },
    chave: { cor: '#fff2e0', forca: 2.6, pos: [2.6, 4.2, 2.8] },
    preenchimento: { cor: '#a9b6ff', forca: 0.7, pos: [-3.2, 2.2, 1.6] },
    recorte: { cor: 'destaque', forca: 2.2, pos: [-1.6, 2.8, -2.8] },
  },
  dramatica: {
    ambiente: { ceu: '#39364d', chao: '#0a0810', forca: 0.22 },
    chave: { cor: '#ffe6c4', forca: 3.4, pos: [3.4, 3.4, 1.2] },
    preenchimento: { cor: '#31406e', forca: 0.35, pos: [-2.8, 1.4, 2.2] },
    recorte: { cor: 'destaque', forca: 3.2, pos: [-2.2, 3.2, -2.4] },
  },
  neon: {
    ambiente: { ceu: '#2b3568', chao: '#12081d', forca: 0.4 },
    chave: { cor: '#22d3ee', forca: 2.4, pos: [2.8, 3.6, 2.4] },
    preenchimento: { cor: '#f472b6', forca: 1.1, pos: [-3.0, 1.8, 2.0] },
    recorte: { cor: 'destaque', forca: 2.6, pos: [0, 2.6, -3.0] },
  },
};

export function Cena3D({ iluminacao, cenario, corDestaque, sombras }: {
  iluminacao: IluminacaoId;
  cenario: CenarioId;
  corDestaque: string;
  /** desligado no perfil Econômico (qualidade adaptativa) */
  sombras: boolean;
}) {
  const luz = LUZES[iluminacao];
  const recorte = luz.recorte.cor === 'destaque' ? corDestaque : luz.recorte.cor;
  const linhas = useMemo(() => {
    // grade neon do cenário: linhas finas no chão (sem textura — geometria pura)
    const pontos: number[] = [];
    for (let i = -10; i <= 10; i++) {
      pontos.push(i, 0.001, -10, i, 0.001, 10);
      pontos.push(-10, 0.001, i, 10, 0.001, i);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pontos, 3));
    return geo;
  }, []);

  return (
    <>
      <hemisphereLight args={[luz.ambiente.ceu, luz.ambiente.chao, luz.ambiente.forca]} />
      <directionalLight
        position={luz.chave.pos}
        intensity={luz.chave.forca}
        color={luz.chave.cor}
        castShadow={sombras}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0004}
      />
      <directionalLight position={luz.preenchimento.pos} intensity={luz.preenchimento.forca} color={luz.preenchimento.cor} />
      <pointLight position={luz.recorte.pos} intensity={luz.recorte.forca} color={recorte} distance={12} decay={1.6} />

      {/* chão do palco */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#12141d" roughness={0.92} metalness={0.04} />
      </mesh>

      {/* aro de destaque sob o personagem (mesma linguagem do arco 2D) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.92, 1.0, 64]} />
        <meshBasicMaterial color={corDestaque} transparent opacity={0.55} />
      </mesh>

      {cenario === 'grade' && (
        <lineSegments geometry={linhas}>
          <lineBasicMaterial color={corDestaque} transparent opacity={0.22} />
        </lineSegments>
      )}

      <fog attach="fog" args={[iluminacao === 'neon' ? '#12081d' : '#0a0c14', 7, 16]} />
      <color attach="background" args={[iluminacao === 'neon' ? '#12081d' : '#0a0c14']} />
    </>
  );
}
