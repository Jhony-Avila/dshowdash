// poc3d/CameraRig3D.tsx — presets cinematográficos + órbita manual (AS4).
// @version 1.1.0  @created 2026-07-30
//
// Presets (corpo/busto/rosto/três-quartos) POR ARQUÉTIPO — humano, androide
// e animal têm proporções muito diferentes — com transição suave (lerp).
// A órbita manual (OrbitControls) continua SEMPRE disponível — trocar de
// preset apenas re-alveja; o usuário retoma o controle a qualquer momento.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERAS } from './catalogo3d';
import type { ArquetipoId, CameraId } from './catalogo3d';

export function CameraRig3D({ preset, arquetipo, aoOrbitar }: {
  preset: CameraId;
  arquetipo: ArquetipoId;
  /** avisa o pai quando o usuário assume a órbita manualmente */
  aoOrbitar?: () => void;
}) {
  const controles = useRef<OrbitControlsImpl>(null);
  const destinoPos = useRef(new THREE.Vector3(...CAMERAS.humano.corpo.pos));
  const destinoAlvo = useRef(new THREE.Vector3(...CAMERAS.humano.corpo.alvo));
  const animando = useRef(false);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const alvo = CAMERAS[arquetipo][preset];
    destinoPos.current.set(...alvo.pos);
    destinoAlvo.current.set(...alvo.alvo);
    animando.current = true;
  }, [preset, arquetipo]);

  useFrame(() => {
    if (!animando.current || !controles.current) return;
    camera.position.lerp(destinoPos.current, 0.09);
    controles.current.target.lerp(destinoAlvo.current, 0.09);
    controles.current.update();
    // só encerra quando POSIÇÃO e ALVO chegaram (senão o alvo fica no chão
    // quando a posição já nasce no lugar — cabeça cortada no 1º quadro)
    if (camera.position.distanceTo(destinoPos.current) < 0.015
      && controles.current.target.distanceTo(destinoAlvo.current) < 0.015) {
      animando.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={0.7}
      maxDistance={8}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 + 0.08}
      onStart={() => { animando.current = false; aoOrbitar?.(); }}
    />
  );
}
