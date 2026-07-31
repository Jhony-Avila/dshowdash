/**
 * components/Toolbar.tsx — barra de ferramentas do mapa (estilo Google Maps).
 * @version 3.0.0
 *
 * Fica sobre o mapa, no canto superior direito: troca de projeção, zoom, reenquadrar
 * e os liga/desliga de camada que o usuário mexe o tempo todo (noite, luzes, mercados,
 * aeroportos, clima). As camadas raras ficam no painel Camadas — a toolbar é para o
 * que se usa toda hora, não para tudo que existe.
 *
 * Os controles de zoom são botões de verdade, e não só roda do mouse: em notebook com
 * trackpad e em tablet a roda é imprecisa, e sem eles o zoom vira recurso escondido.
 *
 * `aria-orientation` é HORIZONTAL: a toolbar nasceu vertical na coluna da direita e
 * migrou para a faixa superior. Anunciar orientação errada faz o leitor de tela
 * prometer navegação por ↑/↓ onde o teclado anda com ←/→.
 */
'use strict';

import {
  Plus, Minus, Crosshair, Moon, Sparkles, TrendingUp,
  Plane, CloudSun, Grid3x3, Download, Tags, PartyPopper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '@/app/store';
import { PROJECTIONS, clampZoom, INITIAL_VIEW, type ProjectionId } from '@/map/projections';
import type { LayerFlags } from '@/lib/prefs';

export interface ToolbarProps {
  onExport: () => void;
}

interface QuickLayer {
  key: keyof LayerFlags;
  label: string;
  icon: LucideIcon;
}

const QUICK_LAYERS: QuickLayer[] = [
  { key: 'night', label: 'Dia / noite', icon: Moon },
  { key: 'cityLights', label: 'Luzes das cidades', icon: Sparkles },
  { key: 'markets', label: 'Mercados', icon: TrendingUp },
  { key: 'airports', label: 'Aeroportos', icon: Plane },
  { key: 'weather', label: 'Clima', icon: CloudSun },
  { key: 'events', label: 'Eventos mundiais', icon: PartyPopper },
  { key: 'graticule', label: 'Grade de fusos', icon: Grid3x3 },
  { key: 'labels', label: 'Rótulos das cidades', icon: Tags },
];

export function Toolbar({ onExport }: ToolbarProps) {
  const { state, dispatch } = useStore();
  const { view, prefs } = state;

  const setZoom = (k: number) => dispatch({ type: 'view/set', view: { ...view, k: clampZoom(k) } });

  return (
    <div className="wcm-toolbar" role="toolbar" aria-label="Ferramentas do mapa" aria-orientation="horizontal">
      <div className="wcm-toolbar__group" role="group" aria-label="Projeção">
        <label className="wcm-toolbar__srlabel" htmlFor="wcm-proj">Projeção</label>
        <select
          id="wcm-proj"
          className="wcm-select"
          value={prefs.projection}
          onChange={(e) => dispatch({ type: 'projection/set', id: e.target.value as ProjectionId })}
          title="Projeção cartográfica"
        >
          {PROJECTIONS.map((p) => (
            <option key={p.id} value={p.id} title={p.hint}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="wcm-toolbar__group" role="group" aria-label="Zoom">
        <button type="button" className="wcm-tbtn" onClick={() => setZoom(view.k * 1.35)} title="Ampliar" aria-label="Ampliar">
          <Plus size={15} aria-hidden="true" />
        </button>
        <span className="wcm-toolbar__zoom" aria-live="off">{view.k.toFixed(1)}×</span>
        <button type="button" className="wcm-tbtn" onClick={() => setZoom(view.k / 1.35)} title="Reduzir" aria-label="Reduzir">
          <Minus size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="wcm-tbtn"
          onClick={() => dispatch({ type: 'view/set', view: INITIAL_VIEW })}
          title="Reenquadrar o mundo"
          aria-label="Reenquadrar o mundo"
        >
          <Crosshair size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="wcm-toolbar__group" role="group" aria-label="Camadas rápidas">
        {QUICK_LAYERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`wcm-tbtn${prefs.layers[key] ? ' is-on' : ''}`}
            onClick={() => dispatch({ type: 'layer/toggle', layer: key })}
            aria-pressed={prefs.layers[key]}
            title={label}
            aria-label={label}
          >
            <Icon size={15} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="wcm-toolbar__group" role="group" aria-label="Exportar">
        <button type="button" className="wcm-tbtn" onClick={onExport} title="Exportar imagem do mapa (PNG)" aria-label="Exportar imagem do mapa em PNG">
          <Download size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
