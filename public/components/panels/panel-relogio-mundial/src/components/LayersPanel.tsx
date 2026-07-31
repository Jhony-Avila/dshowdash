/**
 * components/LayersPanel.tsx — controle completo de camadas e projeção.
 * @version 3.0.0
 *
 * A toolbar tem os atalhos do dia a dia; aqui fica a lista inteira, com o nome por
 * extenso e uma frase dizendo o que cada camada faz. Um interruptor sem explicação
 * é um interruptor que ninguém liga.
 *
 * Cada linha é um checkbox real (não uma div com onClick): Tab, Espaço e leitores de
 * tela funcionam de graça, e o estado marcado é anunciado sem precisar de ARIA extra.
 */
'use strict';

import { useStore } from '@/app/store';
import { PROJECTIONS, type ProjectionId } from '@/map/projections';
import type { LayerFlags } from '@/lib/prefs';

interface LayerDef {
  key: keyof LayerFlags;
  label: string;
  hint: string;
}

const LAYERS: LayerDef[] = [
  { key: 'night', label: 'Sombra dia / noite', hint: 'Terminador solar com gradiente de crepúsculo civil, náutico e astronômico' },
  { key: 'cityLights', label: 'Luzes das cidades', hint: '5.228 núcleos urbanos acesos no lado noturno, intensidade por população' },
  { key: 'stars', label: 'Estrelas', hint: 'Campo estelar discreto sobre a região de noite fechada (só no tema escuro)' },
  { key: 'sunMarker', label: 'Marcador solar', hint: 'Ponto subsolar com halo — onde é meio-dia solar exato' },
  { key: 'graticule', label: 'Grade geográfica', hint: 'Meridianos e paralelos a cada 10°, com Equador e Greenwich destacados' },
  { key: 'countries', label: 'Fronteiras', hint: 'Divisas nacionais do Natural Earth 50m' },
  { key: 'labels', label: 'Cartões das cidades', hint: 'Cartão completo por cidade; desligado, ficam só os pontos com a hora' },
  { key: 'markets', label: 'Bolsas de valores', hint: '29 praças com estado de sessão em tempo real' },
  { key: 'airports', label: 'Aeroportos', hint: 'Códigos IATA/ICAO nas coordenadas reais do aeroporto' },
  { key: 'events', label: 'Eventos mundiais', hint: 'Feriado nacional de hoje e mudança de horário de verão em até 7 dias' },
  { key: 'weather', label: 'Clima', hint: 'Temperatura e condição atuais via Open-Meteo (cache de 30 min)' },
];

export function LayersPanel() {
  const { state, dispatch } = useStore();

  return (
    <div className="wcm-layers">
      <fieldset className="wcm-layers__proj">
        <legend>Projeção</legend>
        {PROJECTIONS.map((p) => (
          <label key={p.id} className="wcm-radio" title={p.hint}>
            <input
              type="radio"
              name="wcm-projection"
              value={p.id}
              checked={state.prefs.projection === p.id}
              onChange={() => dispatch({ type: 'projection/set', id: p.id as ProjectionId })}
            />
            <span className="wcm-radio__label">{p.label}</span>
            <span className="wcm-radio__hint">{p.hint}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="wcm-layers__list">
        <legend>Camadas</legend>
        {LAYERS.map(({ key, label, hint }) => (
          <label key={key} className="wcm-check">
            <input
              type="checkbox"
              checked={state.prefs.layers[key]}
              onChange={() => dispatch({ type: 'layer/toggle', layer: key })}
            />
            <span className="wcm-check__label">{label}</span>
            <span className="wcm-check__hint">{hint}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
