// shell/DetalheAsset.tsx — DRAWER DE DETALHES do asset (briefing §67, AS5).
// @version 1.0.0  @created 2026-08-01
//
// Pendência registrada da F3, fechada agora. Conteúdo §67.1: hero com o
// item APLICADO ao avatar atual (preview animado), nome, raridade, lore,
// tema, coleção que o contém (com progresso), canais de cor que a arte
// usa, slot, compatibilidades/incompatibilidades e origem do desbloqueio.
// Ações §67.2: Experimentar (SEGURAR = preview §608, mesma semântica do
// botão Original), Equipar/Remover, Favoritar, Salvar como preset e Ver
// coleção. Itens relacionados: mesmo tema, navegáveis dentro do drawer.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, BookmarkPlus, Check, Eye, Layers, Lock, Pause, Pin, Play, Star, X } from 'lucide-react';
import type { AvatarConfig, SlotCor } from '../domain/types';
import {
  COLECOES, RARIDADES, itemPorId, itensDe, progressoColecao, validarConfig,
} from '../services/AvatarCatalog';
import { comItem, FOCO_THUMB } from '../components/GradeItens';
import { alternarFavorito, favoritos, itensUsados } from '../services/Progresso';
import { alternarNaLista, criarLista, excluirLista, listarListas } from '../services/Listas';
// mega 229 (§229): favoritos que crescem — marca de permanente
import { alternarPermanente, favoritosPermanentes } from '../services/FavoritosCategorias';
import { flag } from '../nucleo/flags';
// mega 248 (§228): estado ARQUIVADO (local-first, reversível)
import { alternarArquivado, arquivados } from '../services/ArquivoItens';
import { salvarPreset } from '../services/PresetsPessoais';
import { AvatarSvg } from '../components/AvatarSvg';
import { MOVIMENTOS, animar } from './movimento';

const NOME_CANAL: Record<SlotCor, string> = {
  pele: 'Pele', cabelo: 'Cabelo', roupa: 'Cor principal', destaque: 'Detalhes',
};

export function DetalheAsset({ id, config, desbloqueados, aoEscolher, aoPrever, aoFechar, aoVerColecao }: {
  id: string;
  config: AvatarConfig;
  desbloqueados: Set<string>;
  aoEscolher: (novo: AvatarConfig) => void;
  aoPrever: (novo: AvatarConfig | null) => void;
  aoFechar: () => void;
  /** leva à aba Coleções do modo clássico não existe no shell — rola p/ a categoria */
  aoVerColecao?: (colecaoId: string) => void;
}) {
  const [atual, setAtual] = useState(id);
  const [salvo, setSalvo] = useState(false);
  const [comparando, setComparando] = useState(false);
  // lote 207–208 (§181/§168/§170): preview por CONTEXTO (moldura/banner)
  // mega 238 (§168): +ranking e notificação — "o sistema deverá mostrar"
  const [contexto, setContexto] = useState<'palco' | 'perfil' | 'header' | 'menu' | 'ranking' | 'notificacao'>('palco');
  const [alternando, setAlternando] = useState(false);
  const [, setTic] = useState(0);
  const item = itemPorId(atual);

  const preview = useMemo(
    () => (item ? validarConfig(comItem(config, item.categoria, item.id)) : config),
    [config, item],
  );

  // §65.2: alternar automaticamente A/B no palco (preview §608 — nunca o
  // draft). Hook ANTES do early return (rules of hooks).
  // O efeito depende SÓ de `alternando` e lê o preview por REF — depender
  // do objeto preview realimentava o próprio toggle (preview muda o
  // configVisivel → config → preview → efeito de novo = loop).
  const refLado = useRef(false);
  const refPreview = useRef(preview);
  refPreview.current = preview;
  useEffect(() => {
    if (!alternando) return;
    const tique = () => { refLado.current = !refLado.current; aoPrever(refLado.current ? refPreview.current : null); };
    tique();
    const timer = setInterval(tique, 1100);
    return () => { clearInterval(timer); aoPrever(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alternando]);

  // §285: entrada suave do drawer (Motion System — guard §297 no módulo);
  // re-anima ao navegar p/ outro asset dentro do próprio drawer
  const refRaiz = useRef<HTMLElement>(null);
  useEffect(() => {
    void animar(refRaiz.current, MOVIMENTOS.aparecer, { duracao: 180, easing: 'ease-out' });
  }, [atual]);

  if (!item) return null;

  const rar = RARIDADES[item.raridade];
  // §65.1: lado A = o que está EQUIPADO neste lugar hoje (pode ser nada)
  const idEquipadoNoLugar = item.categoria === 'base'
    ? config.base
    : item.categoria === 'acessorio'
      ? config.camadas[`acessorio_${item.slot ?? 'cabeca'}`] ?? null
      : config.camadas[item.categoria] ?? null;
  const itemEquipado = idEquipadoNoLugar ? itemPorId(idEquipadoNoLugar) : undefined;
  const colecaoEquipado = itemEquipado
    ? COLECOES.find((c) => c.itens.includes(itemEquipado.id))
    : undefined;
  const bloqueado = Boolean(item.bloqueadoPor) && !desbloqueados.has(item.id);
  const equipado = config.base === item.id || Object.values(config.camadas).includes(item.id);
  const colecao = COLECOES.find((c) => c.itens.includes(item.id));
  const prog = colecao ? progressoColecao(colecao, itensUsados()) : null;
  const favorito = favoritos().has(item.id);
  const relacionados = itensDe(item.categoria)
    .filter((i) => i.id !== item.id && i.tema === item.tema).slice(0, 4);
  const incompativeis = (item.incompativelCom ?? [])
    .map((x) => itemPorId(x)?.nome).filter(Boolean);
  const bases = (item.requerBase ?? []).map((x) => itemPorId(x)?.nome).filter(Boolean);

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label={`Detalhes de ${item.nome}`}>
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar detalhes" onClick={aoFechar} />
      <aside ref={refRaiz} className="avst5-detalhe" data-teste="drawer-detalhe" style={{ '--avst-rar': rar.cor } as React.CSSProperties}>
        <header className="avst5-det-cab">
          <strong>{item.nome}</strong>
          <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}><X size={14} aria-hidden /></button>
        </header>
        {/* hero: o item aplicado AO SEU avatar, animado (§67.1) */}
        <div className={`avst5-det-hero avst5-ctx-${contexto}`}>
          <AvatarSvg config={preview} uid={`det-${item.id}`} foco={FOCO_THUMB[item.categoria]} />
        </div>
        {/* lote 207–208 (§181): "o sistema deverá mostrar" — moldura/banner
            em contextos reais (perfil/header/menu) sem sair do drawer */}
        {(item.categoria === 'moldura' || item.categoria === 'banner') && (
          <div className="avst-ft-chips avst5-ctx-chips" role="radiogroup" aria-label="Ver em contexto (§181)" data-teste="ctx-preview">
            {([['palco', 'Palco'], ['perfil', 'Perfil'], ['header', 'Header'], ['menu', 'Menu'],
              // mega 238 (§168): contextos novos atrás da flag do palco v2
              ...(flag('as5.palco_v2') ? [['ranking', 'Ranking'], ['notificacao', 'Notif.']] as const : [])] as const).map(([c, nome]) => (
              <button key={c} type="button" role="radio" aria-checked={contexto === c}
                className={`avst-ft-chip ${contexto === c ? 'avst-ft-chip-ativo' : ''}`}
                data-teste={`ctx-${c}`}
                onClick={() => setContexto(c)}>{nome}</button>
            ))}
          </div>
        )}
        {/* mega 239 (§170.1): PRESETS DE COMPOSIÇÃO do banner — equipam o
            banner com a posição escolhida (comando com undo) */}
        {flag('as5.palco_v2') && item.categoria === 'banner' && !bloqueado && (
          <div className="avst-ft-chips" role="group" aria-label="Composição do banner (§170.1)" data-teste="banner-presets">
            {([['esquerda', -24], ['centro', 0], ['direita', 24]] as const).map(([nome2, desloc]) => (
              <button key={nome2} type="button" className="avst-ft-chip"
                data-teste={`banner-comp-${nome2}`}
                title={`Equipar com o banner à ${nome2} (§170.1)`}
                onClick={() => {
                  const base2 = comItem(config, 'banner', item.id);
                  const params = { ...(base2.params ?? {}) };
                  if (desloc === 0) delete params.banner;
                  else params.banner = { ...(params.banner ?? {}), deslocamento: desloc };
                  aoEscolher(validarConfig({ ...base2, ...(Object.keys(params).length ? { params } : {}) }));
                  setTic((t) => t + 1);
                }}>Banner à {nome2}</button>
            ))}
          </div>
        )}
        <p className="avst5-det-rar" style={{ color: rar.cor }}>{rar.nome} · {item.tema}{bloqueado && <> · <Lock size={11} aria-hidden /> bloqueado</>}</p>
        <p className="avst5-det-lore">{item.lore ?? item.descricao}</p>
        {/* megas 92+93 (§85/§225–§228): ECONOMIA do asset — origem,
            disponibilidade e o caminho de desbloqueio explícito */}
        <p className="avst5-det-meta" data-teste="det-economia">
          {/* mega 247 (§226/§227): a COLEÇÃO entra como origem explícita */}
          Origem: {colecao ? `coleção ${colecao.nome}`
            : !item.bloqueadoPor ? 'catálogo Dshow'
              : item.bloqueadoPor.startsWith('evento:') ? 'evento sazonal' : 'recompensa de conquista'}
          {' · '}Disponibilidade: {item.bloqueadoPor?.startsWith('evento:') ? 'sazonal (janela do evento)'
            : item.bloqueadoPor ? 'permanente após desbloquear' : 'sempre'}
          {' · '}{itensUsados().has(item.id) ? 'já explorado ✓' : 'ainda não explorado'}
        </p>
        {/* mega 248 (§228): ESTADO do asset — badges derivados + arquivar */}
        {flag('as5.progressao_v2') && (
          <p className="avst5-det-meta avst5-det-estados" data-teste="det-estados">
            {(equipado ? ['Equipado'] : bloqueado ? ['Bloqueado'] : ['Disponível'])
              .concat(favorito ? ['Favorito'] : [])
              .concat(arquivados().has(item.id) ? ['Arquivado'] : [])
              .map((e2) => <span key={e2} className="avst-fchip" data-estado={e2.toLowerCase()}>{e2}</span>)}
            <button type="button" className="avst-fchip" data-teste="det-arquivar"
              aria-pressed={arquivados().has(item.id)}
              title={arquivados().has(item.id)
                ? 'Devolver à grade padrão (§228)'
                : 'Arquivar — sai da grade padrão sem perder nada (§228)'}
              onClick={() => { alternarArquivado(item.id); setTic((t) => t + 1); }}>
              {arquivados().has(item.id) ? 'Desarquivar' : 'Arquivar'}
            </button>
          </p>
        )}
        {bloqueado && (
          <p className="avst5-det-meta avst5-det-desbloqueio" data-teste="det-desbloqueio">
            <Lock size={11} aria-hidden /> Como desbloquear: {item.bloqueadoPor!.startsWith('evento:')
              ? `participe do evento "${item.bloqueadoPor!.slice(7).replace(/_/g, ' ')}"`
              : `complete a conquista "${item.bloqueadoPor!.replace(/^conquista:/, '').replace(/_/g, ' ')}"`}
          </p>
        )}
        {item.bloqueadoPor && !bloqueado && (
          <p className="avst5-det-meta">Desbloqueado ✓</p>
        )}
        {colecao && prog && (
          <button type="button" className="avst5-det-colecao" onClick={() => aoVerColecao?.(colecao.id)}>
            <Layers size={12} aria-hidden /> Coleção <strong>{colecao.nome}</strong> · {prog.usados}/{prog.total}
          </button>
        )}
        {(item.usaCores?.length ?? 0) > 0 && (
          <p className="avst5-det-meta">Canais de cor: {item.usaCores!.map((c) => NOME_CANAL[c]).join(', ')}</p>
        )}
        {item.slot && <p className="avst5-det-meta">Slot: {item.slot}</p>}
        {bases.length > 0 && <p className="avst5-det-meta">Só combina com: {bases.join(', ')}</p>}
        {incompativeis.length > 0 && <p className="avst5-det-meta">Incompatível com: {incompativeis.join(', ')}</p>}

        <div className="avst5-det-acoes">
          <button type="button" className="avst-botao" title="Segure para ver no palco"
            onPointerDown={() => aoPrever(preview)} onPointerUp={() => aoPrever(null)} onPointerLeave={() => aoPrever(null)}>
            <Eye size={13} aria-hidden /> Experimentar
          </button>
          <button type="button" className={`avst-botao${favorito ? ' avst-botao-ativo' : ''}`}
            onClick={() => { alternarFavorito(item.id); setTic((t) => t + 1); }}>
            <Star size={13} aria-hidden /> {favorito ? 'Favorito' : 'Favoritar'}
          </button>
          {/* mega 229 (§229): favorito PERMANENTE — nunca sai do topo */}
          {flag('as5.favoritos_categorias') && favorito && (
            <button type="button" data-teste="fav-permanente"
              className={`avst-botao${favoritosPermanentes().has(item.id) ? ' avst-botao-ativo' : ''}`}
              title="Favorito permanente — fica sempre no topo da visão de favoritos (§229)"
              aria-pressed={favoritosPermanentes().has(item.id)}
              onClick={() => { alternarPermanente(item.id); setTic((t) => t + 1); }}>
              <Pin size={13} aria-hidden /> {favoritosPermanentes().has(item.id) ? 'Permanente' : 'Tornar permanente'}
            </button>
          )}
          <button type="button" className="avst-botao" disabled={salvo}
            title="Salva o avatar COM este item como preset"
            onClick={() => { if (salvarPreset(`Com ${item.nome}`, preview)) setSalvo(true); }}>
            <BookmarkPlus size={13} aria-hidden /> {salvo ? 'Preset salvo ✓' : 'Salvar preset'}
          </button>
          <button type="button" className={`avst-botao${comparando ? ' avst-botao-ativo' : ''}`}
            title="Lado a lado com o que está equipado (§65.1)"
            onClick={() => { setComparando((v) => !v); setAlternando(false); }}>
            <ArrowLeftRight size={13} aria-hidden /> Comparar
          </button>
          <button type="button" className="avst-botao avst-botao-primario" disabled={bloqueado}
            onClick={() => { aoEscolher(comItem(config, item.categoria, item.id)); aoFechar(); }}>
            <Check size={13} aria-hidden /> {equipado ? (item.categoria === 'acessorio' ? 'Remover' : 'Equipado') : 'Equipar'}
          </button>
        </div>

        {/* lote 188–189 (§229–§230): LISTAS nomeadas — favoritos que crescem */}
        <div className="avst5-det-listas" data-teste="listas-item">
          <span className="avst5-det-meta">Listas (§230):</span>
          {listarListas().map((l) => (
            <span key={l.id} className="avst5-lista-chip-grupo">
              <button type="button" className={`avst-ft-chip${l.itens.includes(item.id) ? ' avst-ft-chip-ativo' : ''}`}
                aria-pressed={l.itens.includes(item.id)} data-teste="lista-toggle"
                title={l.itens.includes(item.id) ? `Tirar de "${l.nome}"` : `Guardar em "${l.nome}" (${l.itens.length})`}
                onClick={() => { alternarNaLista(l.id, item.id); setTic((t) => t + 1); }}>
                {l.nome} · {l.itens.length}
              </button>
              {l.itens.length === 0 && (
                <button type="button" className="avst5-painel-btn" aria-label={`Excluir lista ${l.nome}`}
                  onClick={() => { excluirLista(l.id); setTic((t) => t + 1); }}>×</button>
              )}
            </span>
          ))}
          {listarListas().length < 8 && (
            <input className="avst5-lista-nova" placeholder="+ nova lista" maxLength={18} data-teste="lista-nova"
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  const alvo = ev.target as HTMLInputElement;
                  const nova = criarLista(alvo.value);
                  if (nova) { alternarNaLista(nova.id, item.id); alvo.value = ''; setTic((t) => t + 1); }
                }
              }} />
          )}
        </div>

        {comparando && (
          <div className="avst5-comparacao" data-teste="comparacao">
            <div className="avst5-comp-lado">
              <span className="avst5-comp-rotulo">Equipado agora</span>
              <AvatarSvg config={config} estatico uid="cmp-a" foco={FOCO_THUMB[item.categoria]} />
              <strong>{itemEquipado?.nome ?? 'Nada neste lugar'}</strong>
              {itemEquipado && (
                <em style={{ color: RARIDADES[itemEquipado.raridade].cor }}>
                  {RARIDADES[itemEquipado.raridade].nome}{colecaoEquipado ? ` · ${colecaoEquipado.nome}` : ''}
                </em>
              )}
            </div>
            <div className="avst5-comp-lado avst5-comp-lado-b">
              <span className="avst5-comp-rotulo">Com {item.nome}</span>
              <AvatarSvg config={preview} estatico uid="cmp-b" foco={FOCO_THUMB[item.categoria]} />
              <strong>{item.nome}</strong>
              <em style={{ color: rar.cor }}>{rar.nome}{colecao ? ` · ${colecao.nome}` : ''}</em>
            </div>
            <button type="button" className="avst-botao avst5-comp-alternar"
              aria-pressed={alternando}
              title="Alterna A/B no palco a cada instante (§65.2)"
              onClick={() => setAlternando((v) => !v)}>
              {alternando ? <Pause size={13} aria-hidden /> : <Play size={13} aria-hidden />}
              {alternando ? ' Parar alternância' : ' Alternar no palco'}
            </button>
          </div>
        )}

        {relacionados.length > 0 && (
          <div className="avst5-det-rel">
            <h4 className="avst5-props-titulo">Relacionados ({item.tema})</h4>
            <div className="avst5-det-rel-lista">
              {relacionados.map((r) => (
                <button key={r.id} type="button" title={r.nome} onClick={() => { setAtual(r.id); setSalvo(false); setComparando(false); setAlternando(false); }}>
                  <AvatarSvg config={validarConfig(comItem(config, r.categoria, r.id))} estatico
                    uid={`rel-${r.id}`} foco={FOCO_THUMB[r.categoria]} />
                  <span>{r.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
