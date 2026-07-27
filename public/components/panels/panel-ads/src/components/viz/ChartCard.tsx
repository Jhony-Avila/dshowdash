// components/viz/ChartCard.tsx — moldura padrão de um gráfico (Fase 2).
// @version 1.1.0  @modified 2026-07-22 (exporta PNG também para gráficos D3/SVG)
//
// Envolve QUALQUER gráfico (ECharts ou D3) com: cabeçalho (título/subtítulo), toolbar
// (ações extras + exportar + tela cheia), estados de carregamento/vazio e responsividade.
// Tela cheia = overlay fixo (Esc fecha); o gráfico dentro redimensiona sozinho via
// ResizeObserver. Aceita children como função para reagir ao modo tela cheia.
// Exportação: ECharts passa `onExport` (getDataURL). Para D3/SVG, sem `onExport`,
// o próprio card serializa o <svg> interno em PNG (`exportarSvgComoPng`).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTokensAds } from '../../shell/useShellTheme';
import css from './ChartCard.module.css';

export interface ChartCardProps {
  titulo: string;
  subtitulo?: ReactNode;
  altura?: number;
  carregando?: boolean;
  vazio?: boolean;
  vazioMsg?: string;
  /** Ações extras na toolbar (ex.: alternador de métrica, seletor). */
  acoes?: ReactNode;
  /** Exportação customizada (ECharts). Sem isto, exporta o <svg> interno (D3). */
  onExport?: () => void;
  /** Desliga o botão de exportar (ex.: gráfico sem conteúdo rasterizável). */
  semExport?: boolean;
  children: ReactNode | ((ctx: { fullscreen: boolean }) => ReactNode);
  className?: string;
}

/** Serializa um <svg> (D3) em PNG e dispara o download. Estilos por atributo. */
export async function exportarSvgComoPng(svg: SVGSVGElement, nome: string, bg: string, escala = 2): Promise<void> {
  const rect = svg.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width || 800));
  const h = Math.max(1, Math.round(rect.height || 400));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('svg load')); img.src = svg64; });
  const canvas = document.createElement('canvas');
  canvas.width = w * escala; canvas.height = h * escala;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png'); a.download = `${nome}.png`;
  document.body.appendChild(a); a.click(); a.remove();
}

export function ChartCard({ titulo, subtitulo, altura = 240, carregando, vazio, vazioMsg = 'Sem dados no período.', acoes, onExport, semExport, children, className }: ChartCardProps) {
  const [fs, setFs] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pal = useTokensAds();

  const sair = useCallback(() => setFs(false), []);
  useEffect(() => {
    if (!fs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') sair(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fs, sair]);

  const exportar = useCallback(() => {
    if (onExport) { onExport(); return; }
    const svg = bodyRef.current?.querySelector('svg');
    if (svg) void exportarSvgComoPng(svg as SVGSVGElement, titulo.toLowerCase().replace(/\s+/g, '-'), pal.surface);
  }, [onExport, titulo, pal.surface]);

  const corpo = typeof children === 'function' ? (children as (c: { fullscreen: boolean }) => ReactNode)({ fullscreen: fs }) : children;

  return (
    <div className={`${css.card} ${fs ? css.fullscreen : ''} ${className ?? ''}`}>
      <div className={css.head}>
        <div className={css.tit}>
          <span className={css.titTxt}>{titulo}</span>
          {subtitulo && <span className={css.sub}>{subtitulo}</span>}
        </div>
        <div className={css.tools}>
          {acoes}
          {!semExport && (
            <button type="button" className={css.btn} title="Exportar PNG" aria-label="Exportar PNG" onClick={exportar}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </button>
          )}
          <button type="button" className={css.btn} title={fs ? 'Sair da tela cheia (Esc)' : 'Tela cheia'} aria-label="Tela cheia" onClick={() => setFs((v) => !v)}>
            {fs ? (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
            )}
          </button>
        </div>
      </div>
      <div ref={bodyRef} className={css.body} style={{ height: fs ? undefined : altura }}>
        {corpo}
        {carregando && <div className={css.overlay}><span className="ads-spinner" /></div>}
        {!carregando && vazio && <div className={css.overlay}><span className={css.vazio}>{vazioMsg}</span></div>}
      </div>
      {fs && <button type="button" className={css.backdrop} aria-label="Fechar tela cheia" onClick={sair} />}
    </div>
  );
}
