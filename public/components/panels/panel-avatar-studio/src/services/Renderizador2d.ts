// services/Renderizador2d.ts — o motor SVG por trás do CONTRATO §401 (AS5 F5).
// @version 1.0.0  @created 2026-07-31
//
// Primeira implementação REAL do RenderizadorAvatar: prova que o contrato
// funciona antes de o 3D chegar (§401 pede renderer 2D na lista). Puro e
// sem framework: recebe um alvo com innerHTML e pinta o SVG determinístico
// do engine. pausar() re-renderiza ESTÁTICO (congela SMIL — §404 economia);
// capturar() devolve dataUri determinístico (§508: captura pausa animações).
import type {
  CapturaRender, EstadoCamera, InicializacaoRenderer, OpcoesCaptura,
  PedidoAnimacao, PedidoPoder, RenderizadorAvatar, ResultadoAplicarEstado,
} from '../nucleo/renderizador';
import { pendenciasPara } from '../nucleo/renderizador';
import type { EstadoAvatar, QualidadeTier } from '../nucleo/contratos';
import { paraLegado2d } from '../nucleo/adaptadores';
import type { AvatarConfig } from '../domain/types';
import { dataUriDe, svgDe, validarConfig } from './AvatarCatalog';

export class Renderizador2d implements RenderizadorAvatar {
  readonly id = '2d' as const;
  private alvo: { innerHTML: string } | null = null;
  private ultimoConfig: AvatarConfig | null = null;
  private pausado = false;

  async inicializar(_config: InicializacaoRenderer): Promise<void> {
    // 2D não tem GPU/context para preparar — contrato satisfeito.
  }

  async montar(alvo: { innerHTML: string }): Promise<void> {
    this.alvo = alvo;
    if (this.ultimoConfig) this.pintar();
  }

  async aplicarEstado(estado: EstadoAvatar): Promise<ResultadoAplicarEstado> {
    this.ultimoConfig = validarConfig(paraLegado2d(estado));
    this.pintar();
    return { ok: true, pendencias: pendenciasPara(estado, '2d') };
  }

  definirCamera(_camera: EstadoCamera): void {
    // câmera 2D é o enquadramento do shell (R2) — fora do renderer por design.
  }

  async tocarAnimacao(_pedido: PedidoAnimacao): Promise<void> {
    // idle 2D é SMIL embutido na arte; pedidos dirigidos chegam com o palco vivo.
  }

  async tocarPoder(_pedido: PedidoPoder): Promise<void> {
    // poderes 2D são camadas de efeito (§79+) — aplicados via estado.
  }

  async capturar(opcoes: OpcoesCaptura): Promise<CapturaRender> {
    if (!this.ultimoConfig) throw new Error('capturar() antes de aplicarEstado()');
    return {
      dataUri: dataUriDe(this.ultimoConfig, { estatico: true, tamanho: opcoes.largura }),
      largura: opcoes.largura,
      altura: opcoes.altura,
    };
  }

  definirQualidade(_perfil: QualidadeTier | 'auto'): void {
    // SVG não tem tiers — determinístico por natureza.
  }

  pausar(): void {
    this.pausado = true;
    this.pintar(); // re-render estático: congela TODO SMIL (§404)
  }

  retomar(): void {
    this.pausado = false;
    this.pintar();
  }

  async descartar(): Promise<void> {
    if (this.alvo) this.alvo.innerHTML = '';
    this.alvo = null;
    this.ultimoConfig = null;
  }

  private pintar(): void {
    if (!this.alvo || !this.ultimoConfig) return;
    this.alvo.innerHTML = svgDe(this.ultimoConfig, { estatico: this.pausado });
  }
}
