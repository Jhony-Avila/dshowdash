// services/AvatarUniversal.ts — UNIVERSAL AVATAR COMPONENT client-side
// (AS6 Parte 13 fase 1, lote 1201–1210, decisão #122, flag
// as6.contextos_v6).
// @version 1.0.0  @created 2026-08-09
//
// O contrato que o AS6 pede: QUALQUER canto do dash (header, menu,
// ranking — painéis vanilla incluídos) monta o avatar SALVO do usuário
// com uma chamada, sem conhecer o motor. Fonte = espelho local §619
// (dshow.avatar.config.v1) + evento 'avst:avatar-salvo' p/ atualizar ao
// vivo; sem avatar salvo = placeholder neutro determinístico (nunca
// quebra). Exposto em window.AvatarStudioUniversal quando a flag liga
// (feito no entry) — API estável p/ código fora do painel React.
import type { AvatarConfig } from '../domain/types';
import { svgDe, validarConfig } from './AvatarCatalog';

const CHAVE_CONFIG = 'dshow.avatar.config.v1'; // espelho §619 (AvatarService)

export interface OpcoesAvatarUniversal {
  /** lado em px (o SVG é fluido; isto vira width/height do host) */
  tamanho?: number;
  forma?: 'circulo' | 'quadrado';
  /** re-renderiza quando o avatar for salvo em qualquer aba/painel */
  observar?: boolean;
  /** rótulo acessível (default "Seu avatar") */
  rotulo?: string;
}

/** SVG placeholder neutro (sem avatar salvo) — determinístico. */
function placeholder(forma: 'circulo' | 'quadrado'): string {
  const r = forma === 'circulo' ? 120 : 26;
  return `<svg viewBox="0 0 240 240" role="img" aria-hidden="true">`
    + `<rect x="0" y="0" width="240" height="240" rx="${r}" fill="#232a38"/>`
    + `<circle cx="120" cy="96" r="42" fill="#8a93a6"/>`
    + `<path d="M48 216c8-44 38-66 72-66s64 22 72 66z" fill="#8a93a6"/></svg>`;
}

function lerSalvo(): AvatarConfig | null {
  try {
    const bruto = localStorage.getItem(CHAVE_CONFIG);
    if (!bruto) return null;
    return validarConfig(JSON.parse(bruto));
  } catch { return null; }
}

/** Monta o avatar salvo em `el`. Devolve o desmontar (remove listener). */
export function montarAvatarUniversal(el: HTMLElement, opcoes: OpcoesAvatarUniversal = {}): () => void {
  const { tamanho = 36, forma = 'circulo', observar = true, rotulo = 'Seu avatar' } = opcoes;
  const pintar = (): void => {
    const config = lerSalvo();
    el.innerHTML = config
      ? svgDe(config, { forma, estatico: true, uid: `avuni${Math.abs(el.id ? el.id.length : 0)}${tamanho}` })
      : placeholder(forma);
    el.style.width = `${tamanho}px`;
    el.style.height = `${tamanho}px`;
    el.style.display = 'inline-block';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', rotulo);
    el.setAttribute('data-avatar-universal', config ? 'salvo' : 'placeholder');
    const svg = el.querySelector('svg');
    if (svg) { svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%'); }
  };
  pintar();
  if (!observar) return () => { /* nada a desligar */ };
  const ao = () => pintar();
  // 'avst:avatar-salvo' = CustomEvent da Telemetria/anúncio de save;
  // 'storage' cobre salvamento em OUTRA aba (espelho §619 muda)
  window.addEventListener('avst:avatar_salvou', ao);
  window.addEventListener('avst:salvou', ao);
  const aoStorage = (e: StorageEvent) => { if (e.key === CHAVE_CONFIG) pintar(); };
  window.addEventListener('storage', aoStorage);
  return () => {
    window.removeEventListener('avst:avatar_salvou', ao);
    window.removeEventListener('avst:salvou', ao);
    window.removeEventListener('storage', aoStorage);
  };
}
