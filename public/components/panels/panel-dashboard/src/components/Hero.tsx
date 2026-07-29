// components/Hero.tsx — céu atmosférico de PÁGINA INTEIRA + saudação contextual.
// @version 3.1.0
// @changelog v3.1.0 — pedido do Jhony (2026-07-29): a identidade imersiva da
//   tela noturna volta a ocupar a página TODA como camada de fundo (CeuFundo),
//   e os cards flutuam por cima com vidro (glassmorphism §36.2). O GreetingHero
//   vira um bloco transparente sobre o céu. CSS puro, reduced-motion respeitado.
import { useMemo } from 'react';
import { CalendarDays, MapPin, RefreshCw, Thermometer } from 'lucide-react';
import type { ClimaCompleto, GrupoClima, Saudacao } from '../domain/types';
import { Skeleton, fmtHora } from './ui';

export type Ceu = 'madrugada' | 'manha' | 'tarde' | 'entardecer' | 'noite';

export function ceuAtual(): Ceu {
  const h = new Date().getHours();
  if (h < 6) return 'madrugada';
  if (h < 12) return 'manha';
  if (h < 17) return 'tarde';
  if (h < 19) return 'entardecer';
  return 'noite';
}

const ESTRELAS = Array.from({ length: 54 }, (_, i) => i);

/** Camada de fundo em tela cheia — lua/sol, estrelas e nuvens conforme horário e clima. */
export function CeuFundo({ grupo }: { grupo: GrupoClima | null }) {
  const ceu = useMemo(ceuAtual, []);
  const noite = ceu === 'noite' || ceu === 'madrugada';
  const g = grupo ?? 'limpo';

  return (
    <div className="ger-ceu-fundo" aria-hidden>
      {noite && (
        <>
          <span className="ger-lua" />
          {ESTRELAS.map((i) => (
            <span key={i} className="ger-estrela"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 96}%`,
                animationDelay: `${(i % 9) * 0.7}s`,
                opacity: 0.35 + ((i * 29) % 60) / 100,
              }} />
          ))}
        </>
      )}
      {!noite && g !== 'chuva' && g !== 'tempestade' && g !== 'nublado' && <span className="ger-sol" />}
      {(g === 'nublado' || g === 'chuva' || g === 'tempestade' || g === 'parcial') && (
        <>
          <span className="ger-nuvem ger-nuvem-1" />
          <span className="ger-nuvem ger-nuvem-2" />
          <span className="ger-nuvem ger-nuvem-3" />
        </>
      )}
    </div>
  );
}

/** Bloco de saudação — transparente, flutua diretamente sobre o céu. */
export function GreetingHero({ saudacao, clima, carimbo }: {
  saudacao: Saudacao | null;
  clima: ClimaCompleto | null;
  carimbo: string;
}) {
  const dataLonga = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (!saudacao) return <Skeleton altura={150} />;

  return (
    <section className="ger-hero" aria-label="Saudação e contexto do dia">
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
    </section>
  );
}
