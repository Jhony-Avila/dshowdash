// poc3d/Personagem3D.tsx — o personagem 3D da PoC (AS4 Fase 1).
// @version 1.0.0  @created 2026-07-30
//
// Demonstra os pontos do briefing §46:
//   • humano MODULAR: outfit (Body+Legs+Feet) de uma variante + CABEÇA de
//     outra, cada um com seu mixer tocando o MESMO clip em sincronia (mesmo
//     rig, mesmo timeline → as partes se alinham perfeitamente);
//   • troca de roupa/cabelo = troca de variante/cabeça;
//   • editor de materiais por SLOT (pele/cabelo/roupa/detalhe) com PBR
//     (metalicidade/rugosidade) — materiais clonados por instância;
//   • morph targets faciais no androide (Angry/Surprised/Sad);
//   • animações: idle contínua + gestos (acenar/poder/extra) com crossfade;
//   • falha de asset não quebra o personagem (§43): ErrorBoundary no pai.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as clonarComEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  ANDROIDE, ANIMAL, MORFOS_ANDROIDE, VARIANTES_HUMANO,
} from './catalogo3d';
import type { Config3D, Modelo3D, SlotMaterial } from './catalogo3d';
import { Acessorios3D } from './Acessorios3D';

export type Gesto = 'acenar' | 'poder' | 'extra' | null;

/** Clona a cena preservando o esqueleto e DESCOMPARTILHA os materiais. */
function instanciar(cena: THREE.Object3D): THREE.Object3D {
  const copia = clonarComEsqueleto(cena);
  copia.traverse((o) => {
    const malha = o as THREE.Mesh;
    if (malha.isMesh) {
      malha.castShadow = true;
      malha.receiveShadow = false;
      malha.frustumCulled = false; // skinned meshes saem do bbox original
      if (Array.isArray(malha.material)) {
        malha.material = malha.material.map((m) => m.clone());
      } else if (malha.material) {
        malha.material = malha.material.clone();
      }
    }
  });
  return copia;
}

/** Normaliza a altura (modelos de packs diferentes → mesma régua). */
function normalizar(obj: THREE.Object3D, alturaAlvo: number): number {
  const caixa = new THREE.Box3().setFromObject(obj);
  const altura = Math.max(0.001, caixa.max.y - caixa.min.y);
  return alturaAlvo / altura;
}

/** Recolore materiais por slot + aplica PBR no slot de roupa. */
function aplicarMateriais(obj: THREE.Object3D, modelo: Modelo3D, config: Config3D): void {
  const porNome = new Map<string, SlotMaterial>();
  (Object.keys(modelo.slots) as SlotMaterial[]).forEach((slot) => {
    modelo.slots[slot].forEach((nome) => porNome.set(nome, slot));
  });
  obj.traverse((o) => {
    const malha = o as THREE.Mesh;
    if (!malha.isMesh) return;
    const mats = Array.isArray(malha.material) ? malha.material : [malha.material];
    for (const m of mats) {
      const padrao = m as THREE.MeshStandardMaterial;
      const slot = porNome.get(m.name);
      if (!slot || !padrao.color) continue;
      padrao.color.set(config.cores[slot]);
      if (slot === 'roupa') {
        padrao.metalness = config.material.metal;
        padrao.roughness = 1 - config.material.brilho;
      }
    }
  });
}

/** Esconde/mostra nós por nome exato. */
function visibilidade(obj: THREE.Object3D, decidir: (nome: string) => boolean | null): void {
  obj.traverse((o) => {
    const v = decidir(o.name);
    if (v !== null) o.visible = v;
  });
}

/** Um mixer por cena: idle em loop + gesto único com crossfade. */
function usarAnimacao(
  cena: THREE.Object3D,
  clips: THREE.AnimationClip[],
  modelo: Modelo3D,
  gesto: Gesto,
  aoTerminarGesto?: () => void,
) {
  const mixer = useMemo(() => new THREE.AnimationMixer(cena), [cena]);
  const idleRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const clip = THREE.AnimationClip.findByName(clips, modelo.anims.idle) ?? clips[0];
    if (!clip) return undefined;
    const acao = mixer.clipAction(clip);
    acao.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    idleRef.current = acao;
    return () => { mixer.stopAllAction(); };
  }, [mixer, clips, modelo]);

  useEffect(() => {
    if (!gesto) return undefined;
    const nome = modelo.anims[gesto];
    const clip = THREE.AnimationClip.findByName(clips, nome);
    const idle = idleRef.current;
    if (!clip || !idle) { aoTerminarGesto?.(); return undefined; }
    const acao = mixer.clipAction(clip);
    acao.reset().setLoop(THREE.LoopOnce, 1);
    acao.clampWhenFinished = false;
    idle.crossFadeTo(acao.play(), 0.22, false);
    const aoFim = (e: { action: THREE.AnimationAction }) => {
      if (e.action !== acao) return;
      idle.enabled = true;
      idle.reset().fadeIn(0.22).play();
      acao.fadeOut(0.22);
      aoTerminarGesto?.();
    };
    mixer.addEventListener('finished', aoFim);
    return () => mixer.removeEventListener('finished', aoFim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesto]);

  useFrame((_, dt) => mixer.update(dt));
  return mixer;
}

// ── Humano modular (outfit + cabeça de variantes possivelmente distintas) ──
function Humano({ config, corDestaque, gesto, aoTerminarGesto }: {
  config: Config3D; corDestaque: string; gesto: Gesto; aoTerminarGesto: () => void;
}) {
  const roupaDef = VARIANTES_HUMANO[config.roupa];
  const cabecaDef = VARIANTES_HUMANO[config.cabeca];
  const roupaG = useGLTF(roupaDef.arquivo);
  const cabecaG = useGLTF(cabecaDef.arquivo);

  const roupaCena = useMemo(() => instanciar(roupaG.scene), [roupaG.scene]);
  const cabecaCena = useMemo(() => instanciar(cabecaG.scene), [cabecaG.scene]);

  // outfit mostra Body/Legs/Feet (+Backpack opcional); cabeça mostra só _Head
  useEffect(() => {
    const pref = roupaDef.prefixo ?? '';
    visibilidade(roupaCena, (nome) => {
      if (roupaDef.ocultarSempre.includes(nome)) return false;
      if (nome === `${pref}_Head`) return false;
      if (nome === 'Backpack') return config.mochila;
      return null;
    });
    const prefC = cabecaDef.prefixo ?? '';
    visibilidade(cabecaCena, (nome) => {
      if (nome === `${prefC}_Head`) return true;
      if (/_(Body|Legs|Feet)$/.test(nome) || nome === 'Backpack' || nome === 'Pistol') return false;
      return null;
    });
  }, [roupaCena, cabecaCena, roupaDef, cabecaDef, config.mochila]);

  // materiais: roupa recolore o outfit; pele/cabelo recolorem a cabeça
  useEffect(() => {
    aplicarMateriais(roupaCena, roupaDef, config);
    aplicarMateriais(cabecaCena, cabecaDef, config);
  }, [roupaCena, cabecaCena, roupaDef, cabecaDef, config]);

  // mesmo rig + mesmo clip + mesmo delta ⇒ partes perfeitamente alinhadas
  usarAnimacao(roupaCena, roupaG.animations, roupaDef, gesto, aoTerminarGesto);
  usarAnimacao(cabecaCena, cabecaG.animations, cabecaDef, gesto);

  const escala = useMemo(() => normalizar(roupaG.scene, roupaDef.alturaAlvo), [roupaG.scene, roupaDef]);
  return (
    <>
      <group scale={escala}>
        <primitive object={roupaCena} />
        <primitive object={cabecaCena} />
      </group>
      {/* sockets (decisão #41): cabeça/rosto/pescoço ancoram na CENA DA
          CABEÇA (é ela que anima esses ossos); costas/mão, na do corpo */}
      <Acessorios3D sockets={config.sockets} arquetipo="humano" corDestaque={corDestaque}
        raizCabeca={cabecaCena} raizCorpo={roupaCena} />
    </>
  );
}

// ── Arquétipos de cena única (androide com morphs / animal bípede) ────────
function CenaUnica({ modelo, config, corDestaque, gesto, aoTerminarGesto }: {
  modelo: Modelo3D; config: Config3D; corDestaque: string; gesto: Gesto; aoTerminarGesto: () => void;
}) {
  const gltf = useGLTF(modelo.arquivo);
  const cena = useMemo(() => instanciar(gltf.scene), [gltf.scene]);

  useEffect(() => {
    visibilidade(cena, (nome) => (modelo.ocultarSempre.includes(nome) ? false : null));
    aplicarMateriais(cena, modelo, config);
  }, [cena, modelo, config]);

  // morph targets faciais (androide): sliders → influências por NOME
  useEffect(() => {
    if (modelo !== ANDROIDE) return;
    cena.traverse((o) => {
      const malha = o as THREE.Mesh;
      if (!malha.isMesh || !malha.morphTargetDictionary || !malha.morphTargetInfluences) return;
      (Object.keys(MORFOS_ANDROIDE) as Array<keyof Config3D['morfos']>).forEach((chave) => {
        const idx = malha.morphTargetDictionary?.[MORFOS_ANDROIDE[chave]];
        if (idx !== undefined && malha.morphTargetInfluences) {
          malha.morphTargetInfluences[idx] = config.morfos[chave];
        }
      });
    });
  }, [cena, modelo, config.morfos]);

  usarAnimacao(cena, gltf.animations, modelo, gesto, aoTerminarGesto);

  const escala = useMemo(() => normalizar(gltf.scene, modelo.alturaAlvo), [gltf.scene, modelo]);
  return (
    <>
      <primitive object={cena} scale={escala} />
      <Acessorios3D sockets={config.sockets} arquetipo={config.arquetipo} corDestaque={corDestaque}
        raizCabeca={cena} raizCorpo={cena} />
    </>
  );
}

export function Personagem3D({ config, corDestaque, gesto, aoTerminarGesto }: {
  config: Config3D; corDestaque: string; gesto: Gesto; aoTerminarGesto: () => void;
}) {
  if (config.arquetipo === 'humano') {
    return <Humano config={config} corDestaque={corDestaque} gesto={gesto} aoTerminarGesto={aoTerminarGesto} />;
  }
  const modelo = config.arquetipo === 'androide' ? ANDROIDE : ANIMAL;
  return <CenaUnica modelo={modelo} config={config} corDestaque={corDestaque} gesto={gesto} aoTerminarGesto={aoTerminarGesto} />;
}

// prefetch dos arquétipos padrão (streaming progressivo — decisão #29)
useGLTF.preload(VARIANTES_HUMANO.casual.arquivo);
