// components/Colecoes.tsx — coleções temáticas com progresso (AS3 F2c, §8).
// @version 2.0.0  @created 2026-07-30  @updated 2026-08-04 (mega 67:
// PÁGINA da coleção §207–§214 — hero + lore + checklist + recompensa)
import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Eye, Layers, Trophy } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import {
  colecoesAtivas, COLECOES, RARIDADES, aplicarColecao, itemPorId, progressoColecao, svgItemIsolado, validarConfig,
} from '../services/AvatarCatalog';
import type { Colecao } from '../services/AvatarCatalog';
import { itensUsados } from '../services/Progresso';
import { telemetria } from '../services/Telemetria';
import { AvatarSvg } from './AvatarSvg';
import { focoItemDe } from './modoItem'; // onda 1418 (#203)
// megas 241–242 (§208/§209/§214): hero v2 + galeria (flag as5.progressao_v2)
import { comItem, FOCO_THUMB } from './GradeItens';
import { flag } from '../nucleo/flags';

/** mega 67 (§207–§214): página da coleção — hero, lore, checklist, CTA. */
function PaginaColecao({ col, config, usados, aoAplicar, aoVoltar }: {
  col: Colecao;
  config: AvatarConfig;
  usados: Set<string>;
  aoAplicar: (novo: AvatarConfig) => void;
  aoVoltar: () => void;
}) {
  const rar = RARIDADES[col.raridade];
  const prog = progressoColecao(col, usados);
  const completa = prog.usados === prog.total;
  const preview = aplicarColecao(config, col);
  const v2 = flag('as5.progressao_v2');
  // mega 241 (§209): EXPERIMENTAR — segurar mostra o conjunto em tamanho
  // grande (overlay efêmero; nada muda no config até Equipar)
  const [experimentando, setExperimentando] = useState(false);
  // mega 241 (§208): TAGS derivadas dos temas reais dos itens + criador
  const tags = useMemo(() => {
    const t = new Set<string>();
    for (const id of col.itens) { const tema = itemPorId(id)?.tema; if (tema) t.add(tema); }
    return [...t].slice(0, 5);
  }, [col]);
  return (
    <article className="avst-col-pagina" data-teste="col-pagina"
      style={{ '--avst-rar': rar.cor } as React.CSSProperties}>
      <button type="button" className="avst-botao" data-teste="col-voltar" onClick={aoVoltar}>
        <ArrowLeft size={13} aria-hidden /> Coleções
      </button>
      <div className="avst-col-hero">
        <span className="avst-col-hero-thumb">
          <AvatarSvg config={preview} uid={`colpg-${col.id}`} />
        </span>
        <div>
          <h3>{col.nome} <em style={{ color: rar.cor }}>{rar.nome}</em></h3>
          <p>{col.descricao}</p>
          {/* §210: LORE — a história do conjunto */}
          <p className="avst-col-lore" data-teste="col-lore">
            <BookOpen size={12} aria-hidden /> {col.lore
              ?? 'Cada peça desta coleção carrega um capítulo — equipe todas para contar a história inteira.'}
          </p>
          <div className="avst-colecao-progresso" role="progressbar"
            aria-valuenow={prog.usados} aria-valuemax={prog.total}
            aria-label={`Progresso da coleção ${col.nome}`}>
            <span style={{ width: `${(prog.usados / prog.total) * 100}%` }} />
          </div>
          <p className="avst-col-recompensa" data-teste="col-recompensa">
            <Trophy size={12} aria-hidden />
            {completa
              ? 'Coleção COMPLETA — o selo entra na sua linha do tempo de conquistas.'
              : `Explore os ${prog.total - prog.usados} item(ns) restantes para completar.`}
          </p>
          {v2 && (
            <p className="avst-col-tags" data-teste="col-tags">
              <em>Dshow Originals</em>
              {tags.map((t) => <span key={t} className="avst-fchip">{t}</span>)}
            </p>
          )}
          <div className="avst-foto-acoes">
            {v2 && (
              <button type="button" className="avst-botao" data-teste="col-experimentar"
                title="Segure para ver o conjunto completo em destaque (§209)"
                onPointerDown={() => setExperimentando(true)}
                onPointerUp={() => setExperimentando(false)}
                onPointerLeave={() => setExperimentando(false)}>
                <Eye size={13} aria-hidden /> Experimentar
              </button>
            )}
            <button type="button" className="avst-botao avst-botao-primario"
              onClick={() => { aoAplicar(preview); telemetria('colecao_equipou', { id: col.id }); }}>
              Equipar coleção completa
            </button>
          </div>
        </div>
      </div>
      {v2 && experimentando && (
        <div className="avst-col-experimenta" data-teste="col-experimenta" aria-hidden>
          <AvatarSvg config={preview} uid={`colxp-${col.id}`} />
        </div>
      )}
      {/* mega 242 (§214): GALERIA — cada item da coleção renderizado no SEU
          avatar, com foco da categoria (a página deixa de ser só lista) */}
      {v2 && (
        <div className="avst-col-galeria" data-teste="col-galeria" role="list"
          aria-label={`Galeria da coleção ${col.nome}`}>
          {col.itens.map((id) => {
            const item = itemPorId(id);
            if (!item) return null;
            const cfgItem = validarConfig(comItem(config, item.categoria, item.id));
            return (
              <figure key={id} role="listitem" className={usados.has(id) ? 'avst-col-gal-ok' : ''}>
                <AvatarSvg config={cfgItem} estatico uid={`colg-${id}`}
                  foco={FOCO_THUMB[item.categoria]} />
                <figcaption>{item.nome}{usados.has(id) ? ' ✓' : ''}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
      {/* §208/§214: checklist item a item (✓ = já explorado) */}
      <ul className="avst-col-itens" data-teste="col-itens">
        {col.itens.map((id) => {
          const item = itemPorId(id);
          const usado = usados.has(id);
          return (
            <li key={id} className={usado ? 'avst-col-item-ok' : ''}>
              {usado ? <Check size={12} aria-hidden /> : <Layers size={12} aria-hidden />}
              <span>{item?.nome ?? id}</span>
              <em>{item ? RARIDADES[item.raridade].nome : ''}</em>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

// onda 1418 (#203): miniatura POR PEÇA da coleção — o avatar da coleção
// com a câmera no FOCO do item (crop §68); determinístico e cacheável.
const cacheThumbCol = new Map<string, string>();
function thumbItemColecao(_config: AvatarConfig, col: Colecao, id: string): string {
  const chave = `${col.id}:${id}`;
  const memo = cacheThumbCol.get(chave);
  if (memo) return memo;
  const svg = svgItemIsolado(id, { uid: `colp-${col.id}-${id}`, foco: focoItemDe(id), cores: col.cores });
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cacheThumbCol.set(chave, uri);
  return uri;
}

export function Colecoes({ config, aoAplicar }: {
  config: AvatarConfig;
  aoAplicar: (novo: AvatarConfig) => void;
}) {
  const usados = useMemo(itensUsados, [config]); // recalcula a cada mudança
  // mega 67: navegação lista → página da coleção
  const [aberta, setAberta] = useState<string | null>(null);
  const colAberta = COLECOES.find((c) => c.id === aberta);

  if (colAberta) {
    return (
      <PaginaColecao col={colAberta} config={config} usados={usados}
        aoAplicar={aoAplicar} aoVoltar={() => setAberta(null)} />
    );
  }

  return (
    <div className="avst-colecoes" role="list" aria-label="Coleções">
      {colecoesAtivas().map((col) => {
        const rar = RARIDADES[col.raridade];
        const prog = progressoColecao(col, usados);
        const completa = prog.usados === prog.total;
        const preview = aplicarColecao(config, col);
        return (
          <article key={col.id} role="listitem" className="avst-colecao"
            style={{ '--avst-rar': rar.cor } as React.CSSProperties}>
            <span className="avst-colecao-thumb">
              <AvatarSvg config={preview} estatico uid={`col-${col.id}`} />
            </span>
            <div className="avst-colecao-info">
              <header>
                <strong>{col.nome}</strong>
                <em style={{ color: rar.cor }}>{rar.nome}</em>
                {completa && <span className="avst-colecao-completa"><Check size={11} aria-hidden /> Completa</span>}
              </header>
              <p>{col.descricao}</p>
              {/* onda 1418 (#203): THUMBS POR CATEGORIA — cada peça da
                  coleção com a sua miniatura focada (dataUriDe §68) */}
              {flag('as6.classico_premium') && (
                <div className="avst-colecao-pecas" data-teste="colecao-pecas">
                  {col.itens.map((id) => {
                    const it = itemPorId(id);
                    if (!it) return null;
                    return (
                      <span key={id} className="avst-colecao-peca" title={`${it.nome} (${it.categoria})`}>
                        <img src={thumbItemColecao(config, col, id)} alt={it.nome} loading="lazy" />
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="avst-colecao-progresso" role="progressbar"
                aria-valuenow={prog.usados} aria-valuemax={prog.total}
                aria-label={`Progresso da coleção ${col.nome}`}>
                <span style={{ width: `${(prog.usados / prog.total) * 100}%` }} />
              </div>
              <footer>
                <span className="avst-colecao-contagem">
                  <Layers size={11} aria-hidden /> {prog.usados}/{prog.total} itens explorados
                </span>
                <span className="avst-colecao-itens">
                  {col.itens.map((id) => itemPorId(id)?.nome).filter(Boolean).join(' · ')}
                </span>
                <button type="button" className="avst-botao" data-teste="col-abrir"
                  onClick={() => { setAberta(col.id); telemetria('colecao_abriu', { id: col.id }); }}>
                  <BookOpen size={12} aria-hidden /> Ver página
                </button>
                <button type="button" className="avst-botao avst-botao-primario"
                  onClick={() => aoAplicar(preview)}>
                  Equipar coleção
                </button>
              </footer>
            </div>
          </article>
        );
      })}
    </div>
  );
}
