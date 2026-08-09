// workspace/Inspector.tsx — INSPECTOR contextual do workspace (AS6
// §181–§189, Parte 4). @version 1.0.0  @created 2026-08-09
// (lote 921–930, decisão #94, flag as6.inspector)
//
// Painel de propriedades PROFISSIONAL dirigido pelo schema
// (inspectorSchema.ts): mostra só o que faz sentido na categoria atual
// (§181/§182), em MÓDULOS independentes (§184) num accordion
// inteligente (§185) com memória do último grupo usado (§186,
// persistida). Largura pelo toggle que o painel já tem (§187 — reuso da
// alça/expansão existentes); fechar todos os grupos = estado compacto
// §188 (só ícones+títulos). O MIOLO de Cores/Propriedades é o MESMO dos
// componentes existentes (Cores/PropriedadesAsset com filtro contextual
// opcional) — zero duplicação de lógica, padrão da decisão #87.
import { useState } from 'react';
import {
  BadgeInfo, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight,
  Heart, Layers, Palette, ShieldCheck, Wand2,
} from 'lucide-react';
import type { AvatarConfig, CamadaId, CategoriaId } from '../domain/types';
import { COLECOES, RARIDADES, itemPorId } from '../services/AvatarCatalog';
import { alternarFavorito, favoritos } from '../services/Progresso';
import { Cores } from '../components/Cores';
import { PropriedadesAsset } from '../shell/PropriedadesAsset';
import { t } from '../nucleo/i18n';
import {
  GRUPOS_POR_CATEGORIA, ROTULO_GRUPO,
  camadasDaCategoria, gravarGrupoAberto, lerGrupoAberto,
} from './inspectorSchema';
import type { AberturaInspector, GrupoInspectorId } from './inspectorSchema';

const ICONE_GRUPO: Record<GrupoInspectorId, typeof BadgeInfo> = {
  identidade: BadgeInfo,
  propriedades: Layers,
  cores: Palette,
  compatibilidade: ShieldCheck,
  acoes: Wand2,
};

export interface PropsInspector {
  categoria: CategoriaId;
  configVisivel: AvatarConfig;
  aoEscolher: (novo: AvatarConfig) => void;
  aoPrever: (novo: AvatarConfig | null) => void;
  bloqueios: Set<string>;
  aoMudarFavs: () => void;
  setDetalheId: (id: string) => void;
  painelLargo: boolean;
  setPainelLargo: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Itens equipados que a categoria enxerga (base = a própria base). */
function equipadosDaCategoria(categoria: CategoriaId, config: AvatarConfig): Array<{ camada: CamadaId | 'base'; id: string }> {
  if (categoria === 'base') return [{ camada: 'base', id: config.base }];
  return camadasDaCategoria(categoria)
    .map((c) => ({ camada: c, id: config.camadas[c] }))
    .filter((x): x is { camada: CamadaId; id: string } => !!x.id && x.id !== 'nenhum');
}

export function Inspector(props: PropsInspector) {
  const { categoria, configVisivel, aoEscolher, aoPrever, bloqueios,
    aoMudarFavs, setDetalheId, painelLargo, setPainelLargo } = props;
  // §185–§189: primeiro uso = COMPLETO ('todos', §189); usar um grupo
  // recolhe os demais (§186); fechar o grupo usado = COMPACTO (§188).
  // Memória local do último estado. (setTic: favoritar re-renderiza)
  const [aberto, setAberto] = useState<AberturaInspector>(lerGrupoAberto);
  const [, setTic] = useState(0);
  const grupos = GRUPOS_POR_CATEGORIA[categoria];
  const equipados = equipadosDaCategoria(categoria, configVisivel);
  const favs = favoritos();
  const alternarGrupo = (g: GrupoInspectorId) => {
    const novo = aberto === g ? null : g; // §186 recolhe os demais; §188 compacto
    setAberto(novo);
    gravarGrupoAberto(novo);
  };
  const removerCamada = (camada: CamadaId) => {
    const camadas = { ...configVisivel.camadas } as Record<string, string>;
    delete camadas[camada];
    aoEscolher({ ...configVisivel, camadas });
  };
  return (
    /* também .avst5-propriedades: é a MESMA seção evoluída — herda o
       enquadramento visual e os fluxos existentes seguem encontrando-a */
    <section className="avst5-propriedades avst6-inspector" aria-label="Inspector (§181)" data-teste="inspector">
      <div className="avst6-insp-topo">
        <strong>{t('Inspector')}</strong>
        {/* §187: largura — reusa a expansão do painel (alça continua valendo) */}
        <button type="button" className="avst5-painel-btn" data-teste="insp-largura"
          title={painelLargo ? 'Largura normal (§187)' : 'Inspector largo (§187)'}
          onClick={() => setPainelLargo((v) => !v)}>
          {painelLargo ? <ChevronsRight size={13} aria-hidden /> : <ChevronsLeft size={13} aria-hidden />}
        </button>
      </div>
      {grupos.map((g) => {
        const Icone = ICONE_GRUPO[g];
        const estaAberto = aberto === 'todos' || aberto === g;
        return (
          <div key={g} className={`avst6-insp-grupo${estaAberto ? ' avst6-insp-aberto' : ''}`}>
            <button type="button" className="avst6-insp-cab" data-teste={`insp-grupo-${g}`}
              aria-expanded={estaAberto} onClick={() => alternarGrupo(g)}>
              <Icone size={13} aria-hidden />
              <span>{t(ROTULO_GRUPO[g])}</span>
              {estaAberto ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
            </button>
            {estaAberto && (
              <div className="avst6-insp-corpo" data-teste={`insp-corpo-${g}`}>
                {g === 'identidade' && (
                  equipados.length === 0
                    ? <p className="avst6-insp-vazio">{t('Nada equipado nesta categoria.')}</p>
                    : equipados.map(({ camada, id }) => {
                      const item = itemPorId(id);
                      if (!item) return null;
                      const colecao = COLECOES.find((c) => c.itens.includes(id));
                      return (
                        <div key={camada} className="avst6-insp-item" data-teste="insp-identidade-item">
                          <strong>{item.nome}</strong>
                          <span className="avst6-insp-rar" style={{ color: RARIDADES[item.raridade].cor }}>
                            {RARIDADES[item.raridade].nome}
                          </span>
                          <span className="avst6-insp-meta">
                            {item.tema}{colecao ? ` · ${colecao.nome}` : ''}
                          </span>
                        </div>
                      );
                    })
                )}
                {g === 'propriedades' && (
                  <PropriedadesAsset config={configVisivel} aoAplicar={aoEscolher}
                    aoPrever={aoPrever} soCamadas={camadasDaCategoria(categoria)} />
                )}
                {/* cores são TRANSVERSAIS no modelo AS5 (§11: uma paleta
                    p/ o avatar inteiro) — o recorte contextual §181 vale
                    p/ as propriedades por camada, nunca p/ a paleta */}
                {g === 'cores' && (
                  <Cores config={configVisivel} aoMudar={aoEscolher} />
                )}
                {g === 'compatibilidade' && (
                  equipados.length === 0
                    ? <p className="avst6-insp-vazio">{t('Nada equipado nesta categoria.')}</p>
                    : equipados.map(({ camada, id }) => {
                      const item = itemPorId(id);
                      if (!item) return null;
                      const equipadosTodos = new Set([configVisivel.base, ...Object.values(configVisivel.camadas)]);
                      const conflitos = (item.incompativelCom ?? []).filter((x) => equipadosTodos.has(x));
                      return (
                        <div key={camada} className="avst6-insp-item" data-teste="insp-compat-item">
                          <strong>{item.nome}</strong>
                          {item.slot && <span className="avst6-insp-meta">{t('Slot')}: {item.slot}</span>}
                          {(item.requerBase?.length ?? 0) > 0 && (
                            <span className="avst6-insp-meta">
                              {t('Requer base')}: {item.requerBase!.map((b) => itemPorId(b)?.nome ?? b).join(', ')}
                            </span>
                          )}
                          {conflitos.length > 0
                            ? <span className="avst6-insp-conflito" data-teste="insp-conflito">
                                ⚠ {t('Conflita com')} {conflitos.map((x) => itemPorId(x)?.nome ?? x).join(', ')}
                              </span>
                            : <span className="avst6-insp-ok">✓ {t('Sem conflitos no conjunto atual')}</span>}
                          {bloqueios.has(camada) && (
                            <span className="avst6-insp-meta">🔒 {t('Camada travada no aleatório')}</span>
                          )}
                        </div>
                      );
                    })
                )}
                {g === 'acoes' && (
                  equipados.length === 0
                    ? <p className="avst6-insp-vazio">{t('Nada equipado nesta categoria.')}</p>
                    : equipados.map(({ camada, id }) => (
                      <div key={camada} className="avst6-insp-acoes" data-teste="insp-acoes-item">
                        <button type="button" className="avst-ft-chip" data-teste="insp-fav"
                          aria-pressed={favs.has(id)}
                          onClick={() => { alternarFavorito(id); aoMudarFavs(); setTic((v) => v + 1); }}>
                          <Heart size={12} aria-hidden /> {favs.has(id) ? t('Favorito') : t('Favoritar')}
                        </button>
                        <button type="button" className="avst-ft-chip" data-teste="insp-detalhes"
                          onClick={() => setDetalheId(id)}>{t('Detalhes')}</button>
                        {camada !== 'base' && (
                          <button type="button" className="avst-ft-chip" data-teste="insp-remover"
                            onClick={() => removerCamada(camada)}>{t('Remover')}</button>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
