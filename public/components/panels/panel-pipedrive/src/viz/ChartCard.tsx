// viz/ChartCard.tsx — moldura padrao de um grafico + atalho EChartCard.
// @version 1.0.0  @created 2026-07-27  (Fase 4)
//
// ChartCard envolve QUALQUER grafico com cabecalho (titulo/subtitulo), barra de acoes
// (acoes extras + exportar PNG + tela cheia), estados de carregando/vazio e Esc para sair
// da tela cheia. EChartCard combina o card com o <EChart>, ja fiando export e altura.
//
// ⚠️ TRAP herdada do panel-ads: no CSS, `.pp-cc-body` DEVE ser `flex: 1 1 auto`.
// `flex: 1` (= basis 0%) sobrepoe a altura inline e COLAPSA o grafico fora de um grid
// que estica. O sintoma e um cartao com cabecalho e nada embaixo.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import { EChart, type EChartHandle, type MapaEventos } from './EChart';
import type { Opcao } from './opts';

export interface ChartCardProps {
  titulo: string;
  subtitulo?: ReactNode;
  altura?: number;
  carregando?: boolean;
  vazio?: boolean;
  vazioMsg?: string;
  /** Acoes extras a esquerda dos botoes-icone (ex.: alternador de metrica). */
  acoes?: ReactNode;
  /** Exportacao propria (ECharts usa getDataURL). Sem isto o botao nao aparece. */
  onExport?: () => void;
  /** Nota curta abaixo do grafico (ex.: aviso de metodologia). */
  rodape?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  titulo, subtitulo, altura = 260, carregando, vazio, vazioMsg = 'Sem dados no período.',
  acoes, onExport, rodape, children, className,
}: ChartCardProps) {
  const [fs, setFs] = useState(false);
  const sair = useCallback(() => setFs(false), []);

  useEffect(() => {
    if (!fs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') sair(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fs, sair]);

  return (
    <div className={`pp-cc${fs ? ' is-fs' : ''}${className ? ' ' + className : ''}`}>
      <div className="pp-cc-head">
        <div className="pp-cc-tit">
          <span className="pp-cc-tit-txt">{titulo}</span>
          {subtitulo && <span className="pp-cc-sub">{subtitulo}</span>}
        </div>
        <div className="pp-cc-tools">
          {acoes}
          {onExport && (
            <button type="button" className="pp-cc-btn" title="Exportar PNG" aria-label="Exportar PNG" onClick={onExport}>
              <Download size={15} aria-hidden />
            </button>
          )}
          <button type="button" className="pp-cc-btn" onClick={() => setFs((v) => !v)}
            title={fs ? 'Sair da tela cheia (Esc)' : 'Tela cheia'} aria-label={fs ? 'Sair da tela cheia' : 'Tela cheia'}>
            {fs ? <Minimize2 size={15} aria-hidden /> : <Maximize2 size={15} aria-hidden />}
          </button>
        </div>
      </div>
      <div className="pp-cc-body" style={{ height: fs ? undefined : altura }}>
        {children}
        {carregando && <div className="pp-cc-overlay"><span className="pp-cc-load">Carregando…</span></div>}
        {!carregando && vazio && <div className="pp-cc-overlay"><span className="pp-cc-vazio">{vazioMsg}</span></div>}
      </div>
      {rodape && <p className="pp-cc-rodape">{rodape}</p>}
    </div>
  );
}

export interface EChartCardProps extends Omit<ChartCardProps, 'children' | 'onExport'> {
  opcao: Opcao | null;
  eventos?: MapaEventos;
  aria?: string;
}

/** ChartCard + EChart ja fiados (export PNG pela instancia do ECharts). */
export function EChartCard({ opcao, eventos, aria, ...card }: EChartCardProps) {
  const ref = useRef<EChartHandle>(null);
  const nome = card.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
  return (
    <ChartCard {...card} onExport={() => ref.current?.exportarPNG(`pipedrive-${nome}`)}>
      <EChart ref={ref} opcao={opcao} aria={aria ?? card.titulo} eventos={eventos} />
    </ChartCard>
  );
}
