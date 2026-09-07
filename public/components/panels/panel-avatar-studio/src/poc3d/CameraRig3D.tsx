// poc3d/CameraRig3D.tsx — presets cinematográficos + órbita manual (AS4).
// @version 1.2.0  @created 2026-07-30
//
// Presets (corpo/busto/rosto/três-quartos) POR ARQUÉTIPO — humano, androide
// e animal têm proporções muito diferentes — com transição suave (lerp).
// A órbita manual (OrbitControls) continua SEMPRE disponível — trocar de
// preset apenas re-alveja; o usuário retoma o controle a qualquer momento.
// VC-3D (Briefing 2): props OPCIONAIS `pan` (habilita pan) e `resetToken`
// (recentraliza no preset ao mudar) — ambas com default que preserva o
// comportamento anterior byte a byte (Estudio3D clássico intocado).
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERAS } from './catalogo3d';
import { PRESETS_CAMERA_3D } from '../services/Camera3d'; // onda 1419 (#204)
import { flag } from '../nucleo/flags';
import type { ArquetipoId, CameraId } from './catalogo3d';

export function CameraRig3D({ preset, arquetipo, aoOrbitar, pan = false, resetToken = 0 }: {
  preset: CameraId;
  arquetipo: ArquetipoId;
  /** avisa o pai quando o usuário assume a órbita manualmente */
  aoOrbitar?: () => void;
  /** VC-3D: habilita pan (arrastar o alvo). Default false = comportamento anterior. */
  pan?: boolean;
  /** VC-3D: mudar este número recentraliza a câmera no preset atual. */
  resetToken?: number;
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
    // onda 1419 (#204, as6.camera_v2): a PoC passa a LER o registry —
    // FOV do preset equivalente do Camera3d (fonte única §P8-B)
    if (flag('as6.camera_v2')) {
      const mapa: Record<string, keyof typeof PRESETS_CAMERA_3D> = { corpo: 'corpo', busto: 'busto', rosto: 'face', tresquartos: 'retrato' };
      const px = PRESETS_CAMERA_3D[mapa[preset] ?? 'corpo'];
      const cam = camera as THREE.PerspectiveCamera;
      if (px && cam.isPerspectiveCamera && cam.fov !== px.fov) {
        cam.fov = px.fov;
        cam.updateProjectionMatrix();
      }
    }
  }, [preset, arquetipo, camera, resetToken]);

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
      enablePan={pan}
      minDistance={0.7}
      maxDistance={8}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 + 0.08}
      onStart={() => { animando.current = false; aoOrbitar?.(); }}
    />
  );
}
