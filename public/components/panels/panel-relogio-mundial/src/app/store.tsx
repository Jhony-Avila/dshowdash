/**
 * app/store.tsx — estado do painel (reducer + contexto) e relógio mestre.
 * @version 3.0.0
 *
 * UM ÚNICO RELÓGIO para o painel inteiro. Cada componente que precisasse do "agora"
 * criando o próprio setInterval significaria dezenas de timers dessincronizados —
 * é assim que aparece aquele bug em que o cabeçalho marca 10:59:59 e o card 11:00:00.
 * Aqui o tique nasce num lugar só e desce por contexto.
 *
 * O tique PARA quando a aba está oculta (`document.hidden`) e é retomado com um
 * recálculo imediato no `visibilitychange` — nada de queimar CPU em aba de fundo,
 * e nada de voltar mostrando hora velha.
 *
 * `timeOffset` é o que faz a timeline funcionar: todo o painel lê `date`, que é
 * `agora + timeOffset`. Arrastar a linha do tempo move o terminador, os relógios,
 * os mercados e o clima-por-fase juntos, porque todos derivam do mesmo instante.
 */
'use strict';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type Dispatch, type ReactNode,
} from 'react';
import { getCity, LOCAL_CITY_ID, type City } from '@/data/cities';
import {
  DEFAULT_PREFS, makeDebouncedSave, readLocal, fetchServer,
  type LayerFlags, type Prefs,
} from '@/lib/prefs';
import { clearShareParams, mergeShareIntoPrefs, readShareUrl } from '@/lib/share';
import { INITIAL_VIEW, type ProjectionId, type ViewState } from '@/map/projections';
import type { ThemeName } from '@/map/renderer';

export type PanelId =
  | 'busca' | 'favoritos' | 'camadas' | 'relogio' | 'relogios'
  | 'mercados' | 'eventos' | 'comparador' | 'analitico' | 'timeline';

export interface State {
  prefs: Prefs;
  view: ViewState;
  /** Deslocamento da timeline em minutos a partir de agora. */
  timeOffset: number;
  /** Painéis flutuantes abertos. */
  open: Record<PanelId, boolean>;
  /** Preferências já reconciliadas com o servidor? */
  hydrated: boolean;
}

export type Action =
  | { type: 'prefs/replace'; prefs: Prefs; hydrated?: boolean }
  | { type: 'city/select'; id: string }
  | { type: 'city/add'; id: string }
  | { type: 'city/remove'; id: string }
  | { type: 'fav/toggle'; id: string }
  | { type: 'fav/reorder'; ids: string[] }
  | { type: 'fav/category'; id: string; label: string }
  | { type: 'layer/toggle'; layer: keyof LayerFlags }
  | { type: 'projection/set'; id: ProjectionId }
  | { type: 'view/set'; view: ViewState }
  | { type: 'time/offset'; minutes: number }
  | { type: 'panel/toggle'; panel: PanelId }
  | { type: 'panel/set'; panel: PanelId; open: boolean }
  | { type: 'compare/set'; pair: [string, string] }
  | { type: 'analog/toggle' };

/**
 * Painéis abertos no primeiro acesso.
 *
 * Abrir tudo cobria metade da largura do mapa e contrariava o próprio briefing
 * ("o mapa ocupa praticamente toda a tela"). A primeira prova visual mostrou cartões
 * de Los Angeles, Cidade do México, Moscou e Tóquio brigando com os painéis.
 *
 * O conjunto padrão é o mínimo operacional — onde estou, que horas são, quais praças
 * estão abertas e a linha do tempo. Favoritos, analítico, eventos, comparador e
 * camadas ficam a um clique (ou a uma tecla) de distância, e a escolha do usuário
 * é salva junto das preferências.
 */
export const INITIAL_OPEN: Record<PanelId, boolean> = {
  busca: true,
  favoritos: false,
  camadas: false,
  relogio: true,
  relogios: true,
  mercados: true,
  eventos: false,
  comparador: false,
  analitico: false,
  timeline: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'prefs/replace':
      return { ...state, prefs: action.prefs, hydrated: action.hydrated ?? state.hydrated };

    case 'city/select': {
      if (!getCity(action.id)) return state;
      const visible = state.prefs.visible.includes(action.id)
        ? state.prefs.visible
        : [...state.prefs.visible, action.id];
      return { ...state, prefs: { ...state.prefs, visible, activeId: action.id } };
    }

    case 'city/add': {
      if (!getCity(action.id) || state.prefs.visible.includes(action.id)) return state;
      return { ...state, prefs: { ...state.prefs, visible: [...state.prefs.visible, action.id] } };
    }

    case 'city/remove': {
      // A cidade local é a referência de todas as diferenças de fuso do painel:
      // removê-la deixaria o comparador e o tooltip sem base. Fica.
      if (action.id === LOCAL_CITY_ID) return state;
      const visible = state.prefs.visible.filter((id) => id !== action.id);
      const activeId = state.prefs.activeId === action.id ? LOCAL_CITY_ID : state.prefs.activeId;
      return { ...state, prefs: { ...state.prefs, visible, activeId } };
    }

    case 'fav/toggle': {
      const has = state.prefs.favorites.includes(action.id);
      const favorites = has
        ? state.prefs.favorites.filter((id) => id !== action.id)
        : [...state.prefs.favorites, action.id];
      // Sair dos favoritos leva a categoria junto: senão o mapa de categorias vira
      // lixo acumulado que volta a aparecer se a cidade for refavoritada.
      const categories = { ...state.prefs.categories };
      if (has) delete categories[action.id];
      return { ...state, prefs: { ...state.prefs, favorites, categories } };
    }

    case 'fav/reorder':
      return { ...state, prefs: { ...state.prefs, favorites: action.ids } };

    case 'fav/category': {
      const categories = { ...state.prefs.categories };
      const limpo = action.label.trim().slice(0, 32);
      // Rótulo vazio significa "tirar da categoria", não "categoria chamada vazio".
      if (limpo) categories[action.id] = limpo;
      else delete categories[action.id];
      return { ...state, prefs: { ...state.prefs, categories } };
    }

    case 'layer/toggle':
      return {
        ...state,
        prefs: {
          ...state.prefs,
          layers: { ...state.prefs.layers, [action.layer]: !state.prefs.layers[action.layer] },
        },
      };

    case 'projection/set':
      // Trocar de projeção reenquadra: manter o pan de uma equiretangular ampliada
      // ao virar globo deixaria a Terra fora da tela.
      return {
        ...state,
        prefs: { ...state.prefs, projection: action.id },
        view: INITIAL_VIEW,
      };

    case 'view/set':
      return { ...state, view: action.view };

    case 'time/offset':
      return { ...state, timeOffset: action.minutes };

    case 'panel/toggle':
      return { ...state, open: { ...state.open, [action.panel]: !state.open[action.panel] } };

    case 'panel/set':
      return { ...state, open: { ...state.open, [action.panel]: action.open } };

    case 'compare/set':
      return { ...state, prefs: { ...state.prefs, compare: action.pair } };

    case 'analog/toggle':
      return { ...state, prefs: { ...state.prefs, analog: !state.prefs.analog } };

    default:
      return state;
  }
}

interface Ctx {
  state: State;
  dispatch: Dispatch<Action>;
  /** Instante efetivo do painel = agora + timeOffset. */
  date: Date;
  /** Agora real, sem deslocamento — usado para saber se a timeline está deslocada. */
  realNow: Date;
  theme: ThemeName;
  visibleCities: City[];
  activeCity: City;
}

const StoreContext = createContext<Ctx | null>(null);

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fora do StoreProvider');
  return ctx;
}

/**
 * Tema lido do shell. O projeto tem uma armadilha conhecida: a classe
 * `theme-light` existe nos DOIS temas (o boot adiciona `theme-<preferência>`, e
 * "auto" vira classe própria). Os sinais confiáveis são o atributo
 * `html[data-theme]` e `body.theme-*` — é o que este hook observa.
 */
function useShellTheme(): ThemeName {
  const read = useCallback((): ThemeName => {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    if (document.body.classList.contains('theme-light')) return 'light';
    return 'dark';
  }, []);

  const [theme, setTheme] = useState<ThemeName>(read);

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [read]);

  return theme;
}

/** Relógio mestre: 1 Hz, pausado com a aba oculta. */
function useMasterClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let id: number | null = null;

    const start = () => {
      if (id !== null) return;
      setNow(new Date());
      id = window.setInterval(() => {
        // Guarda obrigatória do projeto: polling não roda em aba oculta.
        if (document.hidden) return;
        setNow(new Date());
      }, 1000);
    };
    const stop = () => {
      if (id === null) return;
      clearInterval(id);
      id = null;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return now;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, (): State => {
    // Primeira pintura pelo espelho local + parâmetros do link compartilhado.
    // O servidor reconcilia depois, sem bloquear a montagem.
    const local = readLocal() ?? DEFAULT_PREFS;
    const share = readShareUrl();
    const prefs = share ? mergeShareIntoPrefs(local, share) : local;
    return {
      prefs,
      view: INITIAL_VIEW,
      timeOffset: share?.timeOffset ?? 0,
      open: { ...INITIAL_OPEN },
      hydrated: false,
    };
  });

  const realNow = useMasterClock();
  const theme = useShellTheme();
  const persist = useRef(makeDebouncedSave());
  const sharedApplied = useRef(false);

  // Um link compartilhado descreve uma configuração PONTUAL; deixar os parâmetros na
  // barra de endereços faria um F5 desfazer tudo que o usuário mexeu depois.
  useEffect(() => {
    if (sharedApplied.current) return;
    sharedApplied.current = true;
    clearShareParams();
  }, []);

  // Reconciliação com o servidor (fonte da verdade). Só sobrescreve se o servidor
  // REALMENTE tiver preferência salva — null significa "nunca salvou", e nesse caso
  // os defaults/local valem. Confundir os dois zeraria a tela de quem acabou de
  // configurar num outro dispositivo.
  useEffect(() => {
    const ac = new AbortController();
    void fetchServer(ac.signal).then((server) => {
      if (ac.signal.aborted) return;
      if (server) dispatch({ type: 'prefs/replace', prefs: server, hydrated: true });
      else dispatch({ type: 'prefs/replace', prefs: state.prefs, hydrated: true });
    });
    return () => ac.abort();
    // Roda uma vez: reconciliação de boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência com debounce, só depois da hidratação (senão o estado local
  // sobrescreveria no servidor o que ainda nem foi lido de lá).
  useEffect(() => {
    if (!state.hydrated) return;
    persist.current(state.prefs);
  }, [state.prefs, state.hydrated]);

  const date = useMemo(
    () => (state.timeOffset ? new Date(realNow.getTime() + state.timeOffset * 60000) : realNow),
    [realNow, state.timeOffset],
  );

  const visibleCities = useMemo(
    () => state.prefs.visible.map(getCity).filter((c): c is City => c !== null),
    [state.prefs.visible],
  );

  const activeCity = useMemo(
    () => getCity(state.prefs.activeId) ?? getCity(LOCAL_CITY_ID)!,
    [state.prefs.activeId],
  );

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, date, realNow, theme, visibleCities, activeCity }),
    [state, date, realNow, theme, visibleCities, activeCity],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
