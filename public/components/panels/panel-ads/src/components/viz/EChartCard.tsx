// components/viz/EChartCard.tsx — ChartCard + EChart já fiados (Fase 2).
// @version 1.0.0  @created 2026-07-22
//
// Componente de conveniência que a maioria das telas usa: passa `opcao` e ganha
// moldura padrão + tela cheia + exportar PNG + carregamento, tudo fiado. Para gráficos
// D3 (mapa/sankey/grafo) use ChartCard diretamente envolvendo o componente D3.
import { useRef, type ReactNode } from 'react';
import { ChartCard } from './ChartCard';
import { EChart, type EChartHandle, type MapaEventos } from './EChart';
import type { Opcao } from './echarts-opts';

export interface EChartCardProps {
  titulo: string;
  subtitulo?: ReactNode;
  opcao: Opcao | null;
  altura?: number;
  carregando?: boolean;
  vazio?: boolean;
  vazioMsg?: string;
  aria?: string;
  eventos?: MapaEventos;
  acoes?: ReactNode;
  exportNome?: string;
  grupo?: string;
  className?: string;
}

export function EChartCard({ titulo, subtitulo, opcao, altura = 240, carregando, vazio, vazioMsg, aria, eventos, acoes, exportNome, grupo, className }: EChartCardProps) {
  const ref = useRef<EChartHandle>(null);
  return (
    <ChartCard
      titulo={titulo}
      subtitulo={subtitulo}
      altura={altura}
      carregando={carregando}
      vazio={vazio}
      vazioMsg={vazioMsg}
      acoes={acoes}
      onExport={() => ref.current?.exportarPNG(exportNome ?? titulo.toLowerCase().replace(/\s+/g, '-'))}
      className={className}
    >
      <EChart ref={ref} opcao={opcao} altura="100%" aria={aria ?? titulo} eventos={eventos} grupo={grupo} />
    </ChartCard>
  );
}
