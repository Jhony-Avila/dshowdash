/**
 * components/HeaderBar.tsx — barra superior do painel.
 * @version 3.0.0
 *
 * O header da v2 só dizia "Relógio Mundial". Aqui ele vira instrumento: cidades
 * monitoradas, UTC vivo, fuso local, mercados abertos AGORA e os atalhos para os
 * painéis. Cada número é lido do mesmo instante do resto da tela (o `date` do store),
 * então nunca diverge do mapa.
 *
 * Em telas estreitas os rótulos somem e ficam só os ícones — o header não quebra em
 * duas linhas nem esconde função atrás de "…". A zona morta do app-shell (a barra
 * lateral fixa de 312 px) faz o painel ter 208–258 px em janelas de 600–820 px, então
 * "estreito" aqui é bem mais comum do que a largura da janela sugere.
 */
'use strict';

import { useMemo } from 'react';
import {
  Globe2, Star, ArrowLeftRight, CalendarClock, TrendingUp, Clock4,
  Share2, Maximize2, Minimize2, Layers, Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore, type PanelId } from '@/app/store';
import { fmtHMS, offsetLabel, tzAbbrev } from '@/lib/time';
import { marketsSummary } from '@/lib/markets';

export interface HeaderBarProps {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onShare: () => void;
}

interface HeaderAction {
  panel: PanelId;
  label: string;
  icon: LucideIcon;
}

const ACTIONS: HeaderAction[] = [
  { panel: 'busca', label: 'Pesquisar', icon: Search },
  { panel: 'favoritos', label: 'Favoritos', icon: Star },
  { panel: 'relogios', label: 'Relógios', icon: Clock4 },
  { panel: 'comparador', label: 'Comparar fusos', icon: ArrowLeftRight },
  { panel: 'eventos', label: 'Eventos', icon: CalendarClock },
  { panel: 'mercados', label: 'Mercados', icon: TrendingUp },
  { panel: 'camadas', label: 'Camadas', icon: Layers },
];

export function HeaderBar({ fullscreen, onToggleFullscreen, onShare }: HeaderBarProps) {
  const { state, dispatch, date, activeCity } = useStore();

  const resumo = useMemo(() => marketsSummary(date), [date]);
  const localTz = activeCity.tz;

  return (
    <header className="wcm-header">
      <div className="wcm-header__brand">
        <Globe2 size={18} className="wcm-header__globe" aria-hidden="true" />
        <h1 className="wcm-header__title">Relógio Mundial</h1>
        <span className="wcm-header__sub">Centro Global de Tempo</span>
      </div>

      <dl className="wcm-header__stats">
        <div className="wcm-stat">
          <dt>Cidades</dt>
          <dd>{state.prefs.visible.length}</dd>
        </div>
        <div className="wcm-stat wcm-stat--mono">
          <dt>UTC</dt>
          <dd>{fmtHMS(date, 'UTC')}</dd>
        </div>
        <div className="wcm-stat wcm-stat--mono">
          <dt>Local</dt>
          <dd>{fmtHMS(date, localTz)}</dd>
        </div>
        <div className="wcm-stat">
          <dt>Fuso</dt>
          <dd title={localTz}>
            {offsetLabel(date, localTz)}
            <span className="wcm-stat__abbr">{tzAbbrev(date, localTz)}</span>
          </dd>
        </div>
        <div className="wcm-stat wcm-stat--markets">
          <dt>Mercados</dt>
          <dd>
            <span className="wcm-stat__pulse" aria-hidden="true" />
            {resumo.abertos} <span className="wcm-stat__of">/ {resumo.total} abertos</span>
          </dd>
        </div>
      </dl>

      <nav className="wcm-header__actions" aria-label="Painéis">
        {ACTIONS.map(({ panel, label, icon: Icon }) => (
          <button
            key={panel}
            type="button"
            className={`wcm-hbtn${state.open[panel] ? ' is-on' : ''}`}
            onClick={() => dispatch({ type: 'panel/toggle', panel })}
            aria-pressed={state.open[panel]}
            title={label}
          >
            <Icon size={15} aria-hidden="true" />
            <span className="wcm-hbtn__label">{label}</span>
          </button>
        ))}

        <span className="wcm-header__sep" aria-hidden="true" />

        <button type="button" className="wcm-hbtn" onClick={onShare} title="Compartilhar esta configuração">
          <Share2 size={15} aria-hidden="true" />
          <span className="wcm-hbtn__label">Compartilhar</span>
        </button>

        <button
          type="button"
          className="wcm-hbtn"
          onClick={onToggleFullscreen}
          title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          aria-pressed={fullscreen}
        >
          {fullscreen ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
          <span className="wcm-hbtn__label">{fullscreen ? 'Restaurar' : 'Tela cheia'}</span>
        </button>
      </nav>
    </header>
  );
}
