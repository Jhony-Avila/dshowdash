// poc3d/Cena3D.tsx — iluminação cinematográfica + cenário 3D + PALCO VIVO.
// @version 2.0.0  @created 2026-07-30  @updated 2026-07-30 (fila #37 item 4)
//
// v2 — PALCO VIVO: além dos 3 presets de LUZ e da grade neon, entram a
// HORA DO DIA (dia/entardecer/noite modulam ambiente, chave e fundo por
// cima do preset) e 2 cenários procedurais novos (campo de estrelas em
// domo e dojo com torii + pilares) — tudo geometria pura, zero download.
// A cor de DESTAQUE do avatar segue tingindo aro e luz de recorte (§41).
import { useMemo } from 'react';
import * as THREE from 'three';
import type { CenarioId, HoraId, IluminacaoId } from './catalogo3d';

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

/**
 * Modulação da HORA sobre o preset de luz (palco vivo): a hora troca as
 * CORES/forças de ambiente+chave e o fundo; preenchimento/recorte do
 * preset ficam — a identidade da iluminação escolhida sobrevive à hora.
 */
const HORAS: Record<Exclude<HoraId, 'estudio'>, {
  ceu: string; chao: string; ambForca: number;
  chaveCor: string; chaveForca: number; fundo: string;
}> = {
  dia: { ceu: '#dcecff', chao: '#3a3a30', ambForca: 0.95, chaveCor: '#fffbe8', chaveForca: 3.0, fundo: '#20304a' },
  entardecer: { ceu: '#ffc890', chao: '#2a1420', ambForca: 0.55, chaveCor: '#ff9c54', chaveForca: 2.8, fundo: '#241026' },
  noite: { ceu: '#2a3a6e', chao: '#05060c', ambForca: 0.28, chaveCor: '#b8ccff', chaveForca: 1.6, fundo: '#05070f' },
};

export function Cena3D({ iluminacao, cenario, hora, corDestaque, sombras }: {
  iluminacao: IluminacaoId;
  cenario: CenarioId;
  /** hora do dia (palco vivo) — 'estudio' mantém o preset puro */
  hora: HoraId;
  corDestaque: string;
  /** desligado no perfil Econômico (qualidade adaptativa) */
  sombras: boolean;
}) {
  const luz = LUZES[iluminacao];
  const recorte = luz.recorte.cor === 'destaque' ? corDestaque : luz.recorte.cor;
  const h = hora !== 'estudio' ? HORAS[hora] : null;
  const ambiente = h
    ? { ceu: h.ceu, chao: h.chao, forca: h.ambForca }
    : luz.ambiente;
  const chave = h
    ? { ...luz.chave, cor: h.chaveCor, forca: h.chaveForca }
    : luz.chave;
  const fundo = h ? h.fundo : (iluminacao === 'neon' ? '#12081d' : '#0a0c14');

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

  // campo de ESTRELAS em domo (cenário 'estrelas') — LCG determinístico
  const estrelas = useMemo(() => {
    const qtd = 380;
    const arr = new Float32Array(qtd * 3);
    let s = 424242;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < qtd; i++) {
      const az = rnd() * Math.PI * 2;
      const el = rnd() * Math.PI * 0.48;
      const r = 13 + rnd() * 2;
      arr[i * 3] = Math.cos(az) * Math.cos(el) * r;
      arr[i * 3 + 1] = Math.sin(el) * r + 0.5;
      arr[i * 3 + 2] = Math.sin(az) * Math.cos(el) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  return (
    <>
      <hemisphereLight args={[ambiente.ceu, ambiente.chao, ambiente.forca]} />
      <directionalLight
        position={chave.pos}
        intensity={chave.forca}
        color={chave.cor}
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

      {/* PALCO VIVO: campo de estrelas em domo — fog={false}: o domo fica no
          raio 13–15 e o fog termina em 16; sem isso a névoa engole as estrelas */}
      {cenario === 'estrelas' && (
        <points geometry={estrelas} frustumCulled={false}>
          <pointsMaterial color="#fff2c8" size={0.08} sizeAttenuation transparent opacity={0.95} depthWrite={false} fog={false} />
        </points>
      )}

      {/* PALCO VIVO: dojo procedural — torii + pilares + tatame */}
      {cenario === 'dojo' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]} receiveShadow>
            <circleGeometry args={[3.2, 48]} />
            <meshStandardMaterial color="#4a3018" roughness={0.9} />
          </mesh>
          {/* torii atrás do personagem */}
          <group position={[0, 0, -3.4]}>
            <mesh position={[-1.5, 1.4, 0]} castShadow={sombras}>
              <cylinderGeometry args={[0.13, 0.16, 2.8, 10]} />
              <meshStandardMaterial color="#a5301e" roughness={0.7} />
            </mesh>
            <mesh position={[1.5, 1.4, 0]} castShadow={sombras}>
              <cylinderGeometry args={[0.13, 0.16, 2.8, 10]} />
              <meshStandardMaterial color="#a5301e" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.9, 0]} rotation={[0, 0, 0.02]}>
              <boxGeometry args={[4.4, 0.24, 0.3]} />
              <meshStandardMaterial color="#8a2416" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.45, 0]}>
              <boxGeometry args={[3.6, 0.16, 0.24]} />
              <meshStandardMaterial color="#a5301e" roughness={0.7} />
            </mesh>
          </group>
          {/* lanternas de pedra nas laterais */}
          {[-2.4, 2.4].map((x) => (
            <group key={x} position={[x, 0, -1.6]}>
              <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.14, 0.18, 0.7, 8]} />
                <meshStandardMaterial color="#6a6a70" roughness={0.95} />
              </mesh>
              <mesh position={[0, 0.82, 0]}>
                <boxGeometry args={[0.34, 0.26, 0.34]} />
                <meshStandardMaterial color="#7a7a80" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.82, 0]}>
                <boxGeometry args={[0.2, 0.14, 0.36]} />
                <meshStandardMaterial color="#ffd75e" emissive="#ffb054" emissiveIntensity={1.4} />
              </mesh>
              <pointLight position={[0, 0.85, 0]} color="#ffb054" intensity={0.9} distance={3.4} decay={1.8} />
            </group>
          ))}
        </group>
      )}

      <fog attach="fog" args={[fundo, 7, 16]} />
      <color attach="background" args={[fundo]} />
    </>
  );
}
