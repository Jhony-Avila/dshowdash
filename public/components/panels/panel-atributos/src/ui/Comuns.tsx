// panel-atributos/src/ui/Comuns.tsx — peças visuais da linguagem do app iOS: foto com cápsula "ID: 154", chip de kit, barra de preenchimento.
import React from 'react';
import { COR_KIT } from '../lib/rotulos';
import { pct } from '../lib/formatar';

/** Cor média (#rrggbb) → texto legível por cima (claro/escuro). */
function contraste(hex: string | null): string {
  if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return 'var(--bl-texto-3)';
  const n = parseInt(hex, 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? 'rgba(20,25,40,.55)' : 'rgba(255,255,255,.7)';
}

/**
 * Foto do produto. E1: o binário ainda não chega ao Dash (proposta de fotos pendente) → PLACEHOLDER com a cor média REAL da foto
 * (product_media.avg_color), ícone e "foto no app". Sem foto → moldura tracejada "sem foto".
 */
export function Foto({ cor, temFoto, proporcao = '4 / 3', idCapsula, compacta = false, rotulo }: {
  cor: string | null; temFoto: boolean; proporcao?: string; idCapsula?: number; compacta?: boolean; rotulo?: string;
}) {
  const fundo = temFoto ? (cor ? `#${cor}` : 'var(--bl-superficie-2)') : 'transparent';
  return (
    <div className={`at-foto ${temFoto ? '' : 'at-foto--vazia'}`} style={{ aspectRatio: proporcao, background: fundo }}
      role="img" aria-label={temFoto ? 'Foto do produto (prévia: disponível no app)' : 'Produto sem foto'}>
      {idCapsula !== undefined && <CapsulaId id={idCapsula} />}
      <div className="at-foto__miolo" style={{ color: temFoto ? contraste(cor) : 'var(--bl-texto-3)' }}>
        <svg width={compacta ? 18 : 26} height={compacta ? 18 : 26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" />
          {!temFoto && <path d="M4 4l16 16" />}
        </svg>
        {!compacta && <span>{rotulo ?? (temFoto ? 'foto no app' : 'sem foto')}</span>}
      </div>
    </div>
  );
}

export function CapsulaId({ id, flutuante = true }: { id: number; flutuante?: boolean }) {
  return <span className={`at-capsula ${flutuante ? 'at-capsula--sobre' : ''}`}>ID: {id}</span>;
}

export function ChipKit({ nome, prefixo = 'Kit' }: { nome: string | null; prefixo?: string }) {
  if (!nome) return null;
  const cor = COR_KIT[nome] ?? 'var(--bl-neutro)';
  return (
    <span className="at-chip" style={{ color: cor, borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`, background: `color-mix(in srgb, ${cor} 13%, transparent)` }}
      title={`${prefixo} do legado: ${nome}`}>
      <span className="at-chip__ponto" style={{ background: cor }} />{prefixo ? `${prefixo} ${nome}` : nome}
    </span>
  );
}

export function Etiqueta({ children, tom = 'neutro', titulo }: { children: React.ReactNode; tom?: 'neutro' | 'info' | 'aviso' | 'sucesso' | 'erro' | 'verde'; titulo?: string }) {
  return <span className={`at-etiqueta at-etiqueta--${tom}`} title={titulo}>{children}</span>;
}

/** Preenchimento: preenchidos / universo (atributos atribuídos no legado ∪ modelo ∪ preenchidos; só atributos ativos). */
export function BarraPreenchimento({ preenchidos, universo, compacta = false }: { preenchidos: number; universo: number; compacta?: boolean }) {
  const p = pct(preenchidos, universo);
  const cor = universo === 0 ? 'var(--bl-neutro)' : p >= 70 ? 'var(--bl-sucesso)' : p >= 25 ? 'var(--bl-aviso)' : 'var(--bl-erro)';
  return (
    <div className="at-barra" title={universo ? `${preenchidos} de ${universo} atributos preenchidos (${p}%)` : 'Sem atributos atribuídos nem modelo'}>
      <div className="at-barra__trilho"><div className="at-barra__valor" style={{ width: `${universo ? Math.max(p, preenchidos ? 3 : 0) : 0}%`, background: cor }} /></div>
      <span className="at-barra__texto">{universo ? `${preenchidos}/${universo}` : 'sem ficha'}{!compacta && universo ? ` · ${p}%` : ''}</span>
    </div>
  );
}
