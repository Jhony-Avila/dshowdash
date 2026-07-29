// components/Hero.tsx — GreetingHero: saudação contextual + fundo atmosférico
// (briefing §6–§7). O céu varia por horário e clima em CSS puro (gradientes,
// lua/sol em SVG, estrelas discretas) — sem vídeo, sem canvas pesado, e as
// animações respeitam prefers-reduced-motion via CSS.
// @version 3.0.0  @created 2026-07-29
import { useMemo } from 'react';
import { CalendarDays, MapPin, RefreshCw, Thermometer } from 'lucide-react';
import type { ClimaCompleto, Saudacao } from '../domain/types';
import { Skeleton, fmtHora } from './ui';

type Ceu = 'madrugada' | 'manha' | 'tarde' | 'entardecer' | 'noite';

function ceuAtual(): Ceu {
  const h = new Date().getHours();
  if (h < 6) return 'madrugada';
  if (h < 12) return 'manha';
  if (h < 17) return 'tarde';
  if (h < 19) return 'entardecer';
  return 'noite';
}

const ESTRELAS = Array.from({ length: 26 }, (_, i) => i);

export function GreetingHero({ saudacao, clima, carimbo }: {
  saudacao: Saudacao | null;
  clima: ClimaCompleto | null;
  carimbo: string;
}) {
  const ceu = useMemo(ceuAtual, []);
  const noite = ceu === 'noite' || ceu === 'madrugada';
  const grupo = clima?.atual.grupo ?? 'limpo';

  const dataLonga = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (!saudacao) return <Skeleton altura={172} />;

  return (
    <section className="ger-hero" data-ceu={ceu} data-clima={grupo} aria-label="Saudação e contexto do dia">
      {/* céu (decorativo) */}
      <div className="ger-hero-ceu" aria-hidden>
        {noite && (
          <>
            <span className="ger-lua" />
            {ESTRELAS.map((i) => (
              <span key={i} className="ger-estrela"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 88}%`,
                  animationDelay: `${(i % 7) * 0.6}s`,
                }} />
            ))}
          </>
        )}
        {!noite && grupo !== 'chuva' && grupo !== 'tempestade' && grupo !== 'nublado' && <span className="ger-sol" />}
        {(grupo === 'nublado' || grupo === 'chuva' || grupo === 'tempestade' || grupo === 'parcial') && (
          <>
            <span className="ger-nuvem ger-nuvem-1" />
            <span className="ger-nuvem ger-nuvem-2" />
          </>
        )}
      </div>

      <div className="ger-hero-conteudo">
        <h1 className="ger-hero-saudacao">
          {saudacao.saudacao}{saudacao.nome ? `, ${saudacao.nome}` : ''}
        </h1>
        {saudacao.frases.length > 0 && (
          <p className="ger-hero-frase">{saudacao.frases.join(' ')}</p>
        )}
        <div className="ger-hero-meta">
          <span><CalendarDays size={12} aria-hidden /> {dataLonga}</span>
          <span><MapPin size={12} aria-hidden /> São Paulo</span>
          {clima?.atual.temp !== null && clima?.atual.temp !== undefined && (
            <span><Thermometer size={12} aria-hidden /> {Math.round(clima.atual.temp)}°C · {clima.atual.condicao}</span>
          )}
          <span><RefreshCw size={12} aria-hidden /> atualizado às {fmtHora(carimbo)}</span>
        </div>
      </div>
    </section>
  );
}
