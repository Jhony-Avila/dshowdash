// services/FabricaRenderizador.ts — fábrica do CONTRATO §401 (AS5 · mega 6).
// @version 1.0.0  @created 2026-08-03
//
// Ponto ÚNICO de criação de renderers. O 3D entra por import DINÂMICO:
// three (~980KB no chunk motor3d) só atravessa a rede quando alguém pede
// '3d' — o entry nunca engorda. Mesmo padrão da FabricaIA (registro por
// id, fail explícito p/ id desconhecido).
import type { RenderizadorAvatar } from '../nucleo/renderizador';
import type { RendererId } from '../nucleo/contratos';
import { Renderizador2d } from './Renderizador2d';
import type { OpcoesRenderizador3d } from './Renderizador3d';

export async function criarRenderizador(
  id: Exclude<RendererId, 'foto'>,
  opcoes3d?: OpcoesRenderizador3d,
): Promise<RenderizadorAvatar> {
  if (id === '2d') return new Renderizador2d();
  if (id === '3d') {
    const { Renderizador3d } = await import('./Renderizador3d');
    return new Renderizador3d(opcoes3d);
  }
  throw new Error(`renderer desconhecido: ${String(id)}`);
}
