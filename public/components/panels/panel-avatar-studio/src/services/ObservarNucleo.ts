// services/ObservarNucleo.ts — ponte núcleo → telemetria (AS5 F1, §652).
// @version 1.0.0  @created 2026-07-31
// O núcleo é dependência-zero; ESTA ponte assina o bus e envia eventos de
// comando/persistência para a telemetria existente do painel.
import { telemetria } from './Telemetria';
import type { AvatarStore } from '../nucleo/estado';

export function conectarTelemetria(store: AvatarStore): () => void {
  const off = [
    store.bus.em('comando:executado', (d) => telemetria('as5_comando', { nome: d.nome })),
    store.bus.em('comando:desfeito', (d) => telemetria('as5_desfazer', { nome: d.nome })),
    store.bus.em('persistencia:salva', (d) => telemetria('as5_salvo', { versao: d.versao })),
  ];
  return () => off.forEach((fn) => fn());
}
