// components/Vitrine.tsx — HOME do catálogo em seções + vitrine da equipe.
// @version 2.0.0  @created 2026-07-30  @updated 2026-07-30 (briefing 4.6 §23, decisão #42)
//
// v2 — a Vitrine deixa de ser só o leaderboard: vira a porta de entrada do
// catálogo, com seções calculadas SERVER-SIDE (/api/avatar/vitrine.php v2):
// Destaques, Novidades, Eventos, Mais usados, Raros, Dshow Originals,
// Em alta, Para você, Recém-desbloqueados e Coleções. Ações por card:
// VISUALIZAR (tooltip rica), EXPERIMENTAR (aplica no palco com barra
// Manter/Reverter + comparação antes/depois), FAVORITAR e ABRIR COLEÇÃO.
// O leaderboard da equipe segue no fim (participação voluntária, coleção).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, Crown, FlaskConical, LoaderCircle, Lock, Medal, RotateCcw, Sparkles, Star,
  TriangleAlert, Users,
} from 'lucide-react';
import type { AvatarConfig, Raridade } from '../domain/types';
import {
  ARQUETIPOS, COLECOES, RARIDADES, aplicarArquetipo, itemPorId, progressoColecao,
  tituloPorId, validarConfig,
} from '../services/AvatarCatalog';
import { alternarFavorito, favoritos, itensUsados } from '../services/Progresso';
import { telemetria } from '../services/Telemetria';
import { AvatarSvg } from './AvatarSvg';
import { BASE_PERSONAGENS_3D, carregarIndice3d } from '../services/Personagens3d';
import type { EntradaIndice3d } from '../services/Personagens3d';
import { Dica } from './Dica';
import { FOCO_THUMB, comItem } from './GradeItens';

// ── Payload do servidor (validado campo a campo — nunca confiar no shape) ──
interface ItemSecao {
  key: string;
  nome: string;
  categoria: string;
  raridade: string;
  usos?: number;
  favs?: number;
  evento?: string;
  evento_ativo?: boolean;
}
interface Secao { id: string; nome: string; descricao: string; itens: ItemSecao[] }
interface ColecaoVitrine { key: string; nome: string; descricao: string; raridade: string; total: number }
interface ItemEquipe { usuario: string; url: string; versoes: number; atualizado_em: string; sou_eu: boolean }
interface DadosVitrine { equipe: ItemEquipe[]; secoes: Secao[]; colecoes: ColecaoVitrine[] }

function raridadeSegura(r: string): Raridade {
  return (r in RARIDADES ? r : 'comum') as Raridade;
}

/** Como este card se aplica ao avatar (parte 2D, título, arquétipo ou só leitura). */
function resolver(item: ItemSecao, config: AvatarConfig, desbloqueados: Set<string>): {
  aplicar: (() => AvatarConfig) | null;
  preview: AvatarConfig | null;
  foco?: string;
  lore?: string;
  bloqueado: boolean;
  selo?: string;
} {
  const parte = itemPorId(item.key);
  if (parte) {
    const bloqueado = Boolean(parte.bloqueadoPor) && !desbloqueados.has(parte.id);
    // base incompatível? o experimento troca a base junto — o efeito SEMPRE aparece
    const baseOk = !parte.requerBase || parte.requerBase.includes(config.base);
    const alvo = baseOk ? config : { ...config, base: parte.requerBase![0] };
    const novo = () => validarConfig(comItem(alvo, parte.categoria, parte.id));
    return {
      aplicar: bloqueado ? null : novo,
      preview: validarConfig(comItem(alvo, parte.categoria, parte.id)),
      foco: FOCO_THUMB[parte.categoria],
      lore: parte.lore ?? parte.descricao,
      bloqueado,
      selo: !baseOk ? 'troca a espécie' : undefined,
    };
  }
  const titulo = tituloPorId(item.key);
  if (titulo) {
    return {
      aplicar: () => ({ ...config, titulo: titulo.id }),
      preview: null, lore: titulo.lore, bloqueado: false, selo: 'título',
    };
  }
  const arq = ARQUETIPOS.find((a) => a.id === item.key);
  if (arq) {
    const novo = aplicarArquetipo(arq, config);
    return { aplicar: () => novo, preview: novo, lore: arq.papel, bloqueado: false, selo: 'arquétipo' };
  }
  // asset só do banco (ex.: GLB 3D) — card de leitura; o estúdio 2D não o veste
  return { aplicar: null, preview: null, bloqueado: false, selo: item.key.startsWith('glb_') ? 'Estúdio 3D' : item.categoria };
}

export function Vitrine({ config, desbloqueados, aoAplicar, aoAbrirColecoes }: {
  config: AvatarConfig;
  /** ids liberados por conquistas/eventos (/api/avatar/vida.php) */
  desbloqueados: Set<string>;
  /** experimentar/equipar passam por aqui (alimenta o undo do App) */
  aoAplicar: (novo: AvatarConfig) => void;
  /** ação "abrir coleção" (4.6 §23) — leva à aba Coleções */
  aoAbrirColecoes: () => void;
}) {
  const [dados, setDados] = useState<DadosVitrine | null>(null);
  const [erro, setErro] = useState(false);
  // mega 14 (§23): personagens 3D na porta de entrada (cadeia registry→
  // índice) — hooks AQUI no topo, antes dos early returns (rules of hooks;
  // mesma lição do DetalheAsset)
  const [personagens3d, setPersonagens3d] = useState<EntradaIndice3d[] | null>(null);
  useEffect(() => {
    let vivo = true;
    void carregarIndice3d().then((i) => { if (vivo) setPersonagens3d(i?.personagens ?? null); });
    return () => { vivo = false; };
  }, []);
  const [favs, setFavs] = useState<Set<string>>(favoritos);
  // experimento ativo: snapshot de ANTES + nome do último item vestido
  const [experimento, setExperimento] = useState<{ antes: AvatarConfig; nome: string } | null>(null);

  const carregar = useCallback(() => {
    setDados(null);
    setErro(false);
    void fetch('/api/avatar/vitrine.php', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((c) => setDados({
        equipe: Array.isArray(c?.data?.equipe) ? c.data.equipe
          : Array.isArray(c?.data?.vitrine) ? c.data.vitrine : [],
        secoes: Array.isArray(c?.data?.secoes) ? c.data.secoes : [],
        colecoes: Array.isArray(c?.data?.colecoes) ? c.data.colecoes : [],
      }))
      .catch(() => setErro(true));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const experimentar = (nome: string, novo: AvatarConfig) => {
    // o snapshot de ANTES é o do PRIMEIRO experimento — encadear itens compara
    // sempre contra o visual original, e Reverter volta tudo de uma vez
    setExperimento((e) => (e ? { ...e, nome } : { antes: config, nome }));
    aoAplicar(novo);
    telemetria('vitrine_experimentou', { item: nome });
  };
  const manter = () => { setExperimento(null); telemetria('vitrine_manteve'); };
  const reverter = () => {
    if (experimento) aoAplicar(experimento.antes);
    setExperimento(null);
    telemetria('vitrine_reverteu');
  };
  const favoritar = (id: string) => setFavs(new Set(alternarFavorito(id)));

  const usados = useMemo(() => itensUsados(), []);

  if (erro) {
    return (
      <div className="avst-vazio">
        <TriangleAlert size={24} aria-hidden />
        <p>Não deu para carregar a vitrine agora.</p>
        <button type="button" className="avst-botao" onClick={carregar}>Tentar de novo</button>
      </div>
    );
  }
  if (dados === null) {
    return (
      <div className="avst-vazio">
        <LoaderCircle className="avst-girando" size={22} aria-hidden />
        <p>Carregando a vitrine…</p>
      </div>
    );
  }

  return (
    <div className="avst-vitrine2">
      {/* barra do experimento — comparar ANTES × AGORA, manter ou reverter */}
      {experimento && (
        <div className="avst-vt-experimento" role="status">
          <span className="avst-vt-exp-thumbs" aria-hidden>
            <span className="avst-vt-exp-thumb"><AvatarSvg config={experimento.antes} estatico uid="vt-antes" /></span>
            <span className="avst-vt-exp-seta">→</span>
            <span className="avst-vt-exp-thumb avst-vt-exp-agora"><AvatarSvg config={config} estatico uid="vt-agora" /></span>
          </span>
          <span className="avst-vt-exp-info">
            <FlaskConical size={14} aria-hidden /> Experimentando: <strong>{experimento.nome}</strong>
          </span>
          <span className="avst-vt-exp-acoes">
            <button type="button" className="avst-botao avst-botao-primario" onClick={manter}>
              <Check size={13} aria-hidden /> Manter
            </button>
            <button type="button" className="avst-botao" onClick={reverter}>
              <RotateCcw size={13} aria-hidden /> Reverter
            </button>
          </span>
        </div>
      )}

      {/* mega 14 (§23): seção PERSONAGENS 3D — previews §508 publicados */}
      {personagens3d && personagens3d.length > 0 && (
        <section className="avst-vt-secao" aria-label="Personagens 3D" data-teste="vitrine-3d">
          <header className="avst-vt-cab">
            <h3>Personagens 3D</h3>
            <p>Os curados do palco 3D — ligue a prévia no estúdio novo ou use na Foto.</p>
          </header>
          <div className="avst-vt-fila" role="list">
            {personagens3d.map((p3) => (
              <div key={p3.slug} role="listitem" className="avst-vt-card avst-vt-card-3d" title={p3.nome}>
                <img src={`${BASE_PERSONAGENS_3D}/${p3.slug}/preview.webp`} alt={p3.nome}
                  width={96} height={96} loading="lazy" />
                <strong>{p3.nome}</strong>
                <small>{(p3.animacoes ?? []).length} animações</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {dados.secoes.length === 0 && (
        <p className="avst-conquistas-resumo">
          <Sparkles size={13} aria-hidden /> As seções do catálogo aparecem quando o servidor terminar a migração do catálogo.
        </p>
      )}

      {dados.secoes.map((s) => (
        <section key={s.id} className="avst-vt-secao" aria-label={s.nome}>
          <header className="avst-vt-cab">
            <h3>{s.nome}</h3>
            <p>{s.descricao}</p>
          </header>
          <div className="avst-vt-fila" role="list">
            {s.itens.map((item) => (
              <CardVitrine key={`${s.id}-${item.key}`} item={item} secao={s.id} config={config}
                desbloqueados={desbloqueados}
                favorito={favs.has(item.key)}
                aoFavoritar={() => favoritar(item.key)}
                aoExperimentar={experimentar} />
            ))}
          </div>
        </section>
      ))}

      {/* Coleções — cards próprios com progresso + ação "abrir coleção" */}
      {dados.colecoes.length > 0 && (
        <section className="avst-vt-secao" aria-label="Coleções">
          <header className="avst-vt-cab">
            <h3>Coleções</h3>
            <p>Conjuntos completos com tema, lore e recompensa visual.</p>
          </header>
          <div className="avst-vt-fila" role="list">
            {dados.colecoes.map((c) => {
              const rar = RARIDADES[raridadeSegura(c.raridade)];
              const tsCol = COLECOES.find((x) => x.id === c.key);
              const prog = tsCol ? progressoColecao(tsCol, usados) : null;
              return (
                <button key={c.key} type="button" role="listitem" className="avst-vt-card avst-vt-colecao"
                  style={{ '--avst-rar': rar.cor } as React.CSSProperties}
                  onClick={() => { telemetria('vitrine_abriu_colecao', { colecao: c.key }); aoAbrirColecoes(); }}>
                  <span className="avst-vt-col-nome">{c.nome}</span>
                  <span className="avst-vt-col-desc">{c.descricao}</span>
                  <span className="avst-vt-col-meta" style={{ color: rar.cor }}>
                    {rar.nome} · {c.total} {c.total === 1 ? 'item' : 'itens'}
                    {prog && <> · {prog.usados}/{prog.total} seu</>}
                  </span>
                  <span className="avst-vt-col-abrir">Abrir coleção →</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Equipe — leaderboard v1 preservado (voluntário, coleção, nunca produtividade) */}
      <section className="avst-vt-secao" aria-label="Vitrine da equipe">
        <header className="avst-vt-cab">
          <h3>Equipe</h3>
          <p>Quem mais explorou o estúdio — participação voluntária, ranking de coleção.</p>
        </header>
        {dados.equipe.length === 0 ? (
          <div className="avst-vazio">
            <Users size={26} aria-hidden />
            <p>A vitrine mostra quem já criou seu avatar — seja a primeira pessoa!</p>
          </div>
        ) : (
          <div className="avst-vitrine" role="list" aria-label="Vitrine de avatares">
            {dados.equipe.map((v, i) => (
              <article key={v.usuario + i} role="listitem"
                className={`avst-vitrine-item ${v.sou_eu ? 'avst-vitrine-eu' : ''}`}>
                <span className={`avst-vitrine-pos avst-vitrine-pos-${i < 3 ? i + 1 : 'x'}`}>
                  {i === 0 ? <Crown size={14} aria-hidden /> : i < 3 ? <Medal size={13} aria-hidden /> : i + 1}
                </span>
                <img src={v.url} alt={`Avatar de ${v.usuario}`} loading="lazy" />
                <div className="avst-vitrine-info">
                  <strong>{v.usuario} {v.sou_eu && <em>(você)</em>}</strong>
                  <span>{v.versoes} {v.versoes === 1 ? 'versão explorada' : 'versões exploradas'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CardVitrine({ item, secao, config, desbloqueados, favorito, aoFavoritar, aoExperimentar }: {
  item: ItemSecao;
  secao: string;
  config: AvatarConfig;
  desbloqueados: Set<string>;
  favorito: boolean;
  aoFavoritar: () => void;
  aoExperimentar: (nome: string, novo: AvatarConfig) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rar = RARIDADES[raridadeSegura(item.raridade)];
  const r = useMemo(() => resolver(item, config, desbloqueados), [item, config, desbloqueados]);
  const eventoFechado = item.evento !== undefined && item.evento_ativo === false;
  const aplicavel = r.aplicar !== null && !eventoFechado;

  const escolher = aplicavel
    ? () => aoExperimentar(item.nome, r.aplicar!())
    : undefined;

  return (
    <div ref={cardRef} role="listitem" tabIndex={0}
      className={`avst-vt-card ${aplicavel ? '' : 'avst-vt-card-leitura'} ${r.bloqueado || eventoFechado ? 'avst-card-bloqueado' : ''}`}
      data-raridade={raridadeSegura(item.raridade)}
      style={{ '--avst-rar': rar.cor } as React.CSSProperties}
      onClick={escolher}
      onKeyDown={(e) => { if (escolher && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); escolher(); } }}>
      <span className="avst-vt-thumb">
        {r.preview
          ? <AvatarSvg config={r.preview} estatico uid={`vt-${secao}-${item.key}`} foco={r.foco} />
          : <span className="avst-vt-thumb-texto" style={{ color: rar.cor }}>
              {item.key.startsWith('tit_') ? <Crown size={22} aria-hidden /> : <Sparkles size={22} aria-hidden />}
            </span>}
      </span>
      <span className="avst-card-nome">{item.nome}</span>
      <span className="avst-card-raridade" style={{ color: rar.cor }}>{rar.nome}</span>
      {(item.usos !== undefined || item.favs !== undefined || r.selo || eventoFechado) && (
        <span className="avst-vt-badges">
          {item.usos !== undefined && <em>{item.usos} em uso</em>}
          {item.favs !== undefined && <em>★ {item.favs}</em>}
          {eventoFechado && <em>janela fechada</em>}
          {!eventoFechado && r.selo && <em>{r.selo}</em>}
        </span>
      )}
      {(r.bloqueado || eventoFechado) && <span className="avst-card-lock"><Lock size={14} aria-hidden /></span>}
      <button type="button" className={`avst-card-fav ${favorito ? 'avst-card-fav-on' : ''}`}
        title={favorito ? 'Remover dos favoritos' : 'Favoritar'} aria-pressed={favorito}
        onClick={(e) => { e.stopPropagation(); aoFavoritar(); }}>
        <Star size={12} aria-hidden />
      </button>
      <Dica alvo={cardRef} id={`avst-vt-tip-${secao}-${item.key}`} cor={rar.cor}>
        <strong>{item.nome}</strong>
        <em style={{ color: rar.cor }}>{rar.nome}</em>
        {r.lore && <span>{r.lore}</span>}
        {r.bloqueado && <span className="avst-tip-lock">🔒 Recompensa de conquista ou evento — veja as abas correspondentes.</span>}
        {eventoFechado && <span className="avst-tip-lock">🔒 Item sazonal — volta na próxima janela do evento.</span>}
        {aplicavel && <span>Clique para experimentar — nada é salvo até você mandar.</span>}
      </Dica>
    </div>
  );
}
