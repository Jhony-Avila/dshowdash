// poc3d/Acessorios3D.tsx — LEVA 1 dos 14 sockets (fila #37 item 2, parcial).
// @version 1.0.0  @created 2026-07-30
//
// ANCORAGEM AGNÓSTICA DE RIG: em vez de decorar os eixos locais de cada
// osso (que variam por pack/exportador), a âncora calcula UMA VEZ a matriz
// local L = ossoMundo⁻¹ · desejada, onde "desejada" é posição do osso +
// deslocamento em ESPAÇO DO PERSONAGEM (Y pra cima, rosto em +Z) com
// orientação identidade e escala em METROS. O grupo vira filho do osso e
// segue a animação de graça; a mesma tabela funciona nos 3 rigs atuais e
// carregará para o corpo UBC da PoC Premium (#43) sem retrabalho.
// Itens 100% procedurais (zero download) — a ARTE definitiva por socket
// chega nas próximas levas; aqui o contrato roda de ponta a ponta.
import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ArquetipoId, Socket3D } from './catalogo3d';

// ── resolução socket → osso (candidatos em ordem; 1º que existir ganha) ──
// ATENÇÃO: o GLTFLoader SANITIZA nomes de nós (PropertyBinding) — 'Wrist.R'
// vira 'WristR' no runtime. Listamos as duas formas por segurança.
const OSSOS: Partial<Record<Socket3D, string[]>> = {
  head: ['Head'],
  face: ['Head'],
  neck: ['Neck', 'Head'],
  back: ['Chest', 'Torso'],
  hand_r: ['WristR', 'Wrist.R', 'HandR', 'Hand.R', 'Palm2R', 'FistR', 'Fist.R', 'LowerArmR', 'LowerArm.R'],
};

/** Deslocamento base por socket (espaço do personagem, metros). */
const DESLOC: Partial<Record<Socket3D, [number, number, number]>> = {
  head: [0, 0.16, 0],
  face: [0, 0.1, 0.12],
  neck: [0, -0.03, 0.05],
  back: [0, 0.04, -0.16],
  hand_r: [0.05, 0.02, 0.08],
};

/** Rotação da âncora (espaço do personagem) — o cetro inclina pra fora e
 *  pra frente; sem isso a haste vertical atravessa o braço na pose idle. */
const ROT: Partial<Record<Socket3D, [number, number, number]>> = {
  hand_r: [0.18, 0, -0.22],
};

/** Ajustes finos por arquétipo (somados ao base — cabeças bem diferentes:
 *  o osso Head fica na BASE do crânio, e androide/pug têm crânios enormes). */
const AJUSTE: Partial<Record<ArquetipoId, Partial<Record<Socket3D, [number, number, number]>>>> = {
  androide: { head: [0, 0.42, 0], face: [0, 0.24, 0.22], back: [0, -0.08, 0.02] },
  animal: { head: [0, 0.16, 0.02], face: [0, 0.12, 0.14], back: [0, -0.02, 0.08] },
};

/** Escala global dos itens por arquétipo (cabeça do pug/androide é maior). */
const ESCALA_ARQ: Record<ArquetipoId, number> = { humano: 1, androide: 1.25, animal: 1.1 };

/**
 * Âncora: acha o osso, pendura um Group nele e alinha a matriz local no
 * 2º quadro (deixa o mixer assentar a pose idle antes de medir o mundo).
 */
function Ancora({ raiz, socket, arquetipo, children }: {
  raiz: THREE.Object3D;
  socket: Socket3D;
  arquetipo: ArquetipoId;
  children: React.ReactNode;
}) {
  const grupo = useMemo(() => {
    const g = new THREE.Group();
    g.visible = false; // invisível até alinhar (evita 1 quadro gigante)
    return g;
  }, []);
  const t0 = useRef<number | null>(null);

  const osso = useMemo(() => {
    for (const nome of OSSOS[socket] ?? []) {
      const o = raiz.getObjectByName(nome);
      if (o) return o;
    }
    return null;
  }, [raiz, socket]);

  useEffect(() => {
    if (!osso) return undefined;
    osso.add(grupo);
    t0.current = null;
    grupo.visible = false;
    return () => { osso.remove(grupo); };
  }, [osso, grupo]);

  useFrame((estado) => {
    if (!osso || grupo.visible) return;
    // espera o CROSSFADE bind→idle terminar (fadeIn 0.25s) antes de medir:
    // alinhar em T-pose deixaria o item torto quando o braço desce (pego na
    // validação headless — o cetro "subia" pro ombro)
    if (t0.current === null) t0.current = estado.clock.elapsedTime;
    if (estado.clock.elapsedTime - t0.current < 0.6) return;
    osso.updateWorldMatrix(true, false);
    const base = DESLOC[socket] ?? [0, 0, 0];
    const fino = AJUSTE[arquetipo]?.[socket] ?? [0, 0, 0];
    const alvo = new THREE.Vector3()
      .setFromMatrixPosition(osso.matrixWorld)
      .add(new THREE.Vector3(base[0] + fino[0], base[1] + fino[1], base[2] + fino[2]));
    const e = ESCALA_ARQ[arquetipo];
    const rot = ROT[socket] ?? [0, 0, 0];
    const desejada = new THREE.Matrix4().compose(
      alvo,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])),
      new THREE.Vector3(e, e, e),
    );
    const local = new THREE.Matrix4().copy(osso.matrixWorld).invert().multiply(desejada);
    local.decompose(grupo.position, grupo.quaternion, grupo.scale);
    grupo.visible = true;
  });

  if (!osso) return null;
  return createPortal(children, grupo);
}

// ── itens procedurais ────────────────────────────────────────────────────
function Coroa() {
  return (
    <group>
      <mesh castShadow>
        <torusGeometry args={[0.105, 0.02, 10, 28]} />
        <meshStandardMaterial color="#d4a017" metalness={0.9} roughness={0.28} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.105, 0.045, Math.sin(a) * 0.105]}>
            <coneGeometry args={[0.02, 0.075, 6]} />
            <meshStandardMaterial color="#e8b923" metalness={0.9} roughness={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

function Halo({ cor }: { cor: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.8; });
  return (
    <group ref={ref} position={[0, 0.2, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.014, 10, 36]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Oculos() {
  return (
    <group>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <torusGeometry args={[0.028, 0.007, 8, 22]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[0.026, 0.009, 0.009]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function Colar({ cor }: { cor: string }) {
  return (
    <group>
      <mesh rotation={[1.25, 0, 0]}>
        <torusGeometry args={[0.088, 0.009, 8, 26]} />
        <meshStandardMaterial color="#d4a017" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, 0.055]}>
        <octahedronGeometry args={[0.024]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Jetpack() {
  return (
    <group>
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.08]} />
        <meshStandardMaterial color="#5a6172" metalness={0.8} roughness={0.35} />
      </mesh>
      {[-0.075, 0.075].map((x) => (
        <group key={x} position={[x, 0, -0.07]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.048, 0.052, 0.3, 12]} />
            <meshStandardMaterial color="#9aa2b4" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.17, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.034, 0.06, 10]} />
            <meshStandardMaterial color="#ff8c3a" emissive="#ff6a1a" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Asas({ cor }: { cor: string }) {
  const pena = (i: number) => ({
    pos: [0.16 + i * 0.1, 0.1 - i * 0.055, 0] as [number, number, number],
    rot: [0, 0, 0.55 - i * 0.42] as [number, number, number],
    tam: [0.3 - i * 0.04, 0.05, 0.012] as [number, number, number],
  });
  return (
    <group>
      {[1, -1].map((lado) => (
        <group key={lado} scale={[lado, 1, 1]}>
          {[0, 1, 2].map((i) => {
            const p = pena(i);
            return (
              <mesh key={i} position={p.pos} rotation={p.rot}>
                <boxGeometry args={p.tam} />
                <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={1.5}
                  transparent opacity={0.68} toneMapped={false} depthWrite={false} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function Cetro({ cor }: { cor: string }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.013, 0.44, 8]} />
        <meshStandardMaterial color="#3a2c22" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.028, 0.007, 8, 18]} />
        <meshStandardMaterial color="#d4a017" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.345, 0]}>
        <sphereGeometry args={[0.036, 14, 12]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Drone orbital (socket companion — sem osso: voa em volta do personagem). */
function Drone({ cor, altura }: { cor: string; altura: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current;
    if (!g) return;
    const t = s.clock.elapsedTime * 0.7;
    g.position.set(Math.cos(t) * 0.85, altura + Math.sin(t * 2.3) * 0.07, Math.sin(t) * 0.85);
    g.lookAt(0, altura, 0);
  });
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.11, 0.07, 0.11]} />
        <meshStandardMaterial color="#aab2c6" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.058]}>
        <sphereGeometry args={[0.024, 12, 10]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.05, 6]} />
          <meshStandardMaterial color="#9aa2b4" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Bit, o robô-pet (socket pet — senta ao lado do personagem, no chão). */
function PetBit({ cor }: { cor: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = Math.max(0, Math.sin(s.clock.elapsedTime * 2.2)) * 0.05;
    g.rotation.y = -0.5 + Math.sin(s.clock.elapsedTime * 0.6) * 0.15;
  });
  return (
    <group position={[0.8, 0, 0.35]}>
      <group ref={ref}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.22]} />
          <meshStandardMaterial color="#98a0b4" metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.24, 0.09]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.1]} />
          <meshStandardMaterial color="#a8b0c4" metalness={0.55} roughness={0.4} />
        </mesh>
        {[-0.028, 0.028].map((x) => (
          <mesh key={x} position={[x, 0.25, 0.142]}>
            <sphereGeometry args={[0.013, 8, 8]} />
            <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.6} toneMapped={false} />
          </mesh>
        ))}
        {([[-0.05, 0.08], [0.05, 0.08], [-0.05, -0.08], [0.05, -0.08]] as const).map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.035, z]}>
            <cylinderGeometry args={[0.018, 0.02, 0.07, 8]} />
            <meshStandardMaterial color="#5a6172" metalness={0.7} roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, -0.12]} rotation={[0.7, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.003, 0.1, 6]} />
          <meshStandardMaterial color="#9aa2b4" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ── composição ───────────────────────────────────────────────────────────
export function Acessorios3D({ sockets, arquetipo, corDestaque, raizCabeca, raizCorpo }: {
  sockets: Partial<Record<Socket3D, string>> | undefined;
  arquetipo: ArquetipoId;
  corDestaque: string;
  /** cena que tem a CABEÇA animada (humano modular: pode diferir do corpo) */
  raizCabeca: THREE.Object3D;
  /** cena do corpo/outfit (torso e mãos vivem aqui) */
  raizCorpo: THREE.Object3D;
}) {
  if (!sockets) return null;
  const alturaDrone = arquetipo === 'animal' ? 1.15 : 1.55;
  const ancorado = (socket: Socket3D, raiz: THREE.Object3D, filho: React.ReactNode) => (
    <Ancora raiz={raiz} socket={socket} arquetipo={arquetipo}>{filho}</Ancora>
  );
  return (
    <>
      {sockets.head === 'soc_coroa' && ancorado('head', raizCabeca, <Coroa />)}
      {sockets.head === 'soc_halo' && ancorado('head', raizCabeca, <Halo cor={corDestaque} />)}
      {sockets.face === 'soc_oculos_neon' && ancorado('face', raizCabeca, <Oculos />)}
      {sockets.neck === 'soc_colar_estrela' && ancorado('neck', raizCabeca, <Colar cor={corDestaque} />)}
      {sockets.back === 'soc_jetpack' && ancorado('back', raizCorpo, <Jetpack />)}
      {sockets.back === 'soc_asas_energia' && ancorado('back', raizCorpo, <Asas cor={corDestaque} />)}
      {sockets.hand_r === 'soc_cetro' && ancorado('hand_r', raizCorpo, <Cetro cor={corDestaque} />)}
      {sockets.companion === 'soc_drone' && <Drone cor={corDestaque} altura={alturaDrone} />}
      {sockets.pet === 'soc_pet_bit' && <PetBit cor={corDestaque} />}
    </>
  );
}
