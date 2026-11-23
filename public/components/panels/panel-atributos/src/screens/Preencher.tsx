// panel-atributos/src/screens/Preencher.tsx — PREENCHER V2 (proposta do Jhony, /srv/dshow-docs/briefings/BRIEFING-PREENCHER-V2.md, 19/11).
// Linhas = produtos, colunas = atributos REAIS do kit/subcategoria. Faixa única de filtros (kit · ou · subcategoria · busca · Colunas) no bloco
// travado; grade em dois painéis: Foto/ID/Produto fixos à esquerda e os atributos com rolagem horizontal PRÓPRIA (a barra começa depois do bloco
// fixo); cabeçalho das colunas travado logo abaixo do bloco (sincronizado na horizontal). Linhas de altura única (mensagens da célula ficam
// sobrepostas, não aumentam a linha). Gravação = a de sempre ("foi salvo ou não": chave por intenção, recibo, ícone/estado por célula, conflito,
// Conferir com o texto do DSHOW-099) e o lote de sugestões por coluna com chave (DSHOW-096). Nenhum valor é deduzido do nome do produto.
import React from 'react';
import type { Ficha, ItemFicha, KitResumo, Vitrine } from '../lib/tipos';
import { conferirGravacao, enviar, enviarLoteSugestoes, ErroApi, MSG_DESCONHECIDO, novaIntencaoLote, obter, resumoDaConferencia, resumoDoErroLote, resumoDoLote, type IntencaoLote, type ResumoLote } from '../lib/api';
import { marcarPendencia } from '../lib/pendencias';
import { sugestaoTexto } from '../lib/formatar';
import { casaBusca } from '../lib/formatar';
import { chaveOrdem, compararChaves } from '../lib/preencherOrdem';
import { rotuloSubcategoria, IMPORTANCIA } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, CabecalhoTravado, Carregando, Dialogo, Erro, Foto, Vazio } from '../ui/Comuns';
import { EditorValor } from '../ui/EditorValor';
import { IconeOrdenacao } from '../ui/TabelaDados';

const MAX_LINHAS = 60;
async function emLotes<T, R>(xs: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(xs.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => { while (i < xs.length) { const k = i++; out[k] = await f(xs[k]); } }));
  return out;
}

export function Preencher() {
  const m = useModulo();
  const [vit, setVit] = React.useState<Vitrine | null>(null);
  const [kits, setKits] = React.useState<KitResumo[]>([]);
  const [kit, setKit] = React.useState<number | ''>(m.preencher.kit ?? '');
  const [sub, setSub] = React.useState(m.preencher.subcategoria ?? '');
  // PREENCHER V2: busca (sobre o conjunto escolhido inteiro, não só o que está à vista), colunas ocultas, ordenação
  const [busca, setBusca] = React.useState(''); const [buscaAtiva, setBuscaAtiva] = React.useState('');
  React.useEffect(() => { const t = window.setTimeout(() => setBuscaAtiva(busca), 250); return () => window.clearTimeout(t); }, [busca]);
  const [ocultas, setOcultas] = React.useState<Set<number>>(new Set());
  const [menuColunas, setMenuColunas] = React.useState(false);
  const [ordem, setOrdem] = React.useState<{ chave: 'id' | 'nome' | number; dir: 1 | -1 } | null>(null);
  const cache = React.useRef(new Map<number, Ficha>());   // fichas já lidas (a busca não relê o que já está aqui)
  const [usarSelecao, setUsarSelecao] = React.useState(m.selecao.length > 0 && !m.preencher.kit && !m.preencher.subcategoria);
  const [fichas, setFichas] = React.useState<Ficha[] | null>(null);
  const [colunas, setColunas] = React.useState<{ id: number; rotulo: string; importancia: string | null; obrigatorio: boolean }[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(false);
  const [aceitarCol, setAceitarCol] = React.useState<{ id: number; rotulo: string; ids: number[] } | null>(null);
  const [trab, setTrab] = React.useState(false);
  // DSHOW-096: aceitar a coluna em LOTE com chave por intenção (gerada ao confirmar; corpo e IDs congelados; a mesma chave em todo reenvio).
  type FaseLote = 'confirmar' | 'enviando' | 'concluido' | 'desconhecido' | 'conferindo' | 'em_andamento' | 'interrompida' | 'nao_encontrada' | 'recusada';
  const [lote, setLote] = React.useState<{ fase: FaseLote; intencao: IntencaoLote | null; resumo: ResumoLote | null; msg: string | null; reenvioSeguro: boolean }>({ fase: 'confirmar', intencao: null, resumo: null, msg: null, reenvioSeguro: false });
  const geracaoLote = React.useRef(0);   // cada abertura/fechamento do diálogo = nova geração: resposta antiga não mexe no diálogo nem na grade novos
  const tabela = React.useRef<HTMLDivElement>(null);
  const cabRola = React.useRef<HTMLDivElement>(null); const corpoRola = React.useRef<HTMLDivElement>(null);
  const seqGrade = React.useRef(0);                              // trocar de kit no meio da carga: só a última grade vale
  const seqLinha = React.useRef<Record<number, number>>({});    // recarga de linha fora de ordem: só a mais recente vale

  const carregarBase = React.useCallback(() => { setErro(null); Promise.all([obter<Vitrine>('vitrine'), obter<{ kits: KitResumo[] }>('kits')]).then(([v, k]) => { setVit(v); setKits(k.kits.filter((x) => x.ativo && x.itens > 0 && !x.aplica_a_todos)); }).catch((e) => setErro(e.message)); }, []);
  React.useEffect(carregarBase, [carregarBase]);
  const [erroGrade, setErroGrade] = React.useState<string | null>(null);   // DSHOW-067: erro da grade com "Tentar novamente", sem perder kit/subcategoria/seleção

  const produtosBase = React.useMemo(() => {
    if (!vit) return [];
    const ativos = vit.produtos.filter((p) => p.ativo);
    if (usarSelecao) return ativos.filter((p) => m.selecao.includes(p.id));
    if (kit !== '') return ativos.filter((p) => p.kits.some((k) => k.id === kit));
    if (sub) return ativos.filter((p) => (p.subcategoria ?? '') === sub);
    return [];
  }, [vit, kit, sub, usarSelecao, m.selecao]);
  /** A busca age no conjunto escolhido INTEIRO (também nos que ficariam fora das 60 linhas). */
  const produtos = React.useMemo(() => (buscaAtiva.trim() ? produtosBase.filter((p) => casaBusca(buscaAtiva.trim(), p.id, p.nome)) : produtosBase), [produtosBase, buscaAtiva]);

  // As COLUNAS vêm do conjunto escolhido (kit/subcategoria/seleção), não da busca: buscar não some com colunas nem com valores.
  const carregarFichas = React.useCallback(async (silencioso = false) => {
    const base = produtosBase.slice(0, MAX_LINHAS); const linhas = produtos.slice(0, MAX_LINHAS);
    const alvo = [...new Map([...base, ...linhas].map((p) => [p.id, p])).values()];
    const n = ++seqGrade.current;
    if (!alvo.length) { setFichas(null); setColunas([]); setErroGrade(null); setCarregando(false); return; }
    setErroGrade(null);
    const faltam = silencioso ? alvo : alvo.filter((p) => !cache.current.has(p.id));
    if (!silencioso && faltam.length) { setCarregando(true); }
    try {
      const novas = await emLotes(faltam, 6, (p) => obter<Ficha>('ficha_produto', { product_id: p.id }));
      if (n !== seqGrade.current) return;
      for (const f of novas) cache.current.set(f.produto.id, f);
      const fsBase = base.map((p) => cache.current.get(p.id)).filter((x): x is Ficha => !!x);
      const cols = new Map<number, { id: number; rotulo: string; importancia: string | null; obrigatorio: boolean; ordem: number }>();
      let ordemCol = 0;
      for (const f of fsBase) for (const i of f.itens) {
        if (kit !== '' && i.kit_id !== kit && !i.origens.some((o) => o.grupo_id === kit)) continue;
        // UX-1: omitir um opcional SÓ quando TODAS as origens forem exclusivamente do kit geral ("aplica a todos"); com origem específica
        // (escopo/kit direto) ou avulsa, a coluna aparece — pelo kit e por "Usar selecionados"
        const soGeral = i.origens.length > 0 && i.origens.every((o) => o.tipo === 'kit' && (o.motivos ?? []).length > 0 && (o.motivos ?? []).every((x) => x.tipo === 'todos'));
        if (kit === '' && soGeral && !i.obrigatorio) continue;
        if (!cols.has(i.atributo_id)) cols.set(i.atributo_id, { id: i.atributo_id, rotulo: i.rotulo, importancia: i.importancia, obrigatorio: i.obrigatorio, ordem: ordemCol++ });
      }
      setColunas([...cols.values()].sort((a, b) => a.ordem - b.ordem));
      setFichas(linhas.map((p) => cache.current.get(p.id)).filter((x): x is Ficha => !!x));
    } catch (e) { if (n === seqGrade.current) setErroGrade(e instanceof ErroApi ? e.message : 'Falha de rede.'); } finally { if (n === seqGrade.current) setCarregando(false); }
  }, [produtos, produtosBase, kit]);
  React.useEffect(() => { carregarFichas(); }, [carregarFichas]);

  // "foi salvo ou não" (item 3): a releitura da linha NÃO engole o erro — devolve false e a célula mostra
  // "Salvo. Não foi possível atualizar o valor na tela." + [Atualizar valor] (só leitura). Resposta antiga não sobrescreve a mais nova.
  const recarregarLinha = async (pid: number): Promise<boolean> => {
    const n = (seqLinha.current[pid] ?? 0) + 1; seqLinha.current[pid] = n;
    try { const f = await obter<Ficha>('ficha_produto', { product_id: pid }); if (n === seqLinha.current[pid]) { cache.current.set(pid, f); setFichas((fs) => fs?.map((x) => (x.produto.id === pid ? f : x)) ?? null); } return true; }
    catch { return false; }
  };
  // UX-1: foco no mesmo atributo de outra linha (campo de digitar primeiro; senão o seletor)
  const focar = (l: number, c: string | number) => {
    const sel = `[data-l="${l}"][data-c="${c}"]`;
    tabela.current?.querySelector<HTMLElement>(`${sel} input:not([type=checkbox]):not([type=radio]), ${sel} select`)?.focus();
  };
  // ↑/↓ mudam de linha SÓ num campo de digitar; num seletor (unidade/opção) as setas são dele. Enter: o EditorValor desce depois de confirmar.
  const mover = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const el = e.target as HTMLElement;
    if (!(el instanceof HTMLInputElement) || el.type === 'checkbox' || el.type === 'radio') return;
    const td = el.closest('[data-l]') as HTMLElement | null; if (!td) return;
    e.preventDefault(); focar(Number(td.dataset.l) + (e.key === 'ArrowUp' ? -1 : 1), td.dataset.c ?? '');
  };
  const abrirLote = (x: { id: number; rotulo: string; ids: number[] }) => { geracaoLote.current++; setTrab(false); setLote({ fase: 'confirmar', intencao: null, resumo: null, msg: null, reenvioSeguro: false }); setAceitarCol(x); };
  const fecharLote = () => { geracaoLote.current++; setTrab(false); if (lote.intencao) marcarPendencia(lote.intencao.chave, false); setAceitarCol(null); };
  const terminar = (i: IntencaoLote, g: number, resumo: ResumoLote | null) => {
    marcarPendencia(i.chave, false); if (g !== geracaoLote.current) return;
    setLote((l) => ({ ...l, fase: 'concluido', resumo, msg: null }));
    if (resumo) m.aviso(`${resumo.aceitas.length} sugestão(ões) aceita(s)${resumo.rejeitadas.length ? `; ${resumo.rejeitadas.length} rejeitada(s)` : ''}${resumo.ignoradas.length ? `; ${resumo.ignoradas.length} ignorada(s)` : ''}.`, resumo.rejeitadas.length ? 'info' : 'sucesso');
    carregarFichas(true);
  };
  /** Envia (1ª vez: cria a intenção) ou RETOMA com a MESMA intenção. */
  const confirmarColuna = async () => {
    if (!aceitarCol || trab) return;
    const g = geracaoLote.current; const i = lote.intencao ?? novaIntencaoLote(aceitarCol.ids);
    marcarPendencia(i.chave, true); setTrab(true); setLote((l) => ({ ...l, fase: 'enviando', intencao: i, msg: null }));
    try { const r = await enviarLoteSugestoes(i); terminar(i, g, resumoDoLote(r)); }
    catch (e) {
      if (g !== geracaoLote.current) return;
      const er = e instanceof ErroApi ? e : null;
      if (er?.interrompida) setLote((l) => ({ ...l, fase: 'interrompida', resumo: resumoDoErroLote(er, i.ids), msg: null }));
      else if (er?.emAndamento) setLote((l) => ({ ...l, fase: 'em_andamento', resumo: resumoDoErroLote(er, i.ids), msg: null, reenvioSeguro: false }));
      else if (er && (er.recusada || er.conflito)) { marcarPendencia(i.chave, false); setLote((l) => ({ ...l, fase: 'recusada', intencao: null, msg: er.message })); }
      else setLote((l) => ({ ...l, fase: 'desconhecido', msg: null }));   // resposta perdida, 5xx, 2xx sem recibo: NUNCA "salvo" nem "não salvo"
    } finally { if (g === geracaoLote.current) setTrab(false); }
  };
  /** Conferir gravação: só GET; nada é reenviado. */
  const conferirLote = async () => {
    const i = lote.intencao; if (!i || trab) return; const g = geracaoLote.current;
    setTrab(true); setLote((l) => ({ ...l, fase: 'conferindo' }));
    try {
      const c = await conferirGravacao(i.chave); if (g !== geracaoLote.current) return;
      const resumo = resumoDaConferencia(c, i.ids);
      if (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca') terminar(i, g, resumo);
      else if (c.resultado === 'interrompida') setLote((l) => ({ ...l, fase: 'interrompida', resumo }));
      else if (c.resultado === 'em_andamento') setLote((l) => ({ ...l, fase: 'em_andamento', resumo, reenvioSeguro: !!c.reenvio_seguro }));
      else if (c.resultado === 'nao_aplicada') { marcarPendencia(i.chave, false); setLote((l) => ({ ...l, fase: 'recusada', intencao: null, msg: c.erro?.mensagem ?? 'O servidor recusou o pedido. Nada foi salvo.' })); }
      else setLote((l) => ({ ...l, fase: 'nao_encontrada', resumo: null }));
    } catch { if (g === geracaoLote.current) setLote((l) => ({ ...l, fase: 'desconhecido', msg: 'Não foi possível conferir agora. Tente de novo.' })); }
    finally { if (g === geracaoLote.current) setTrab(false); }
  };

  // ordem das linhas: recalculada SÓ quando a ordenação ou o conjunto de linhas muda — gravar um valor não reordena (nada troca de linha
  // durante a edição; cada campo é do produto+atributo da sua linha, chave estável = id do produto)
  const idsLinhas = (fichas ?? []).map((f) => f.produto.id).join(',');
  const fichasRef = React.useRef(fichas); fichasRef.current = fichas;
  const ordemIds = React.useMemo(() => {
    const fs = fichasRef.current ?? []; if (!ordem) return fs.map((f) => f.produto.id);
    const k = ordem.chave; const dir = ordem.dir;
    return [...fs].sort((a, b) => (k === 'id' ? (a.produto.id - b.produto.id) * dir
      : k === 'nome' ? a.produto.nome.localeCompare(b.produto.nome, 'pt-BR', { numeric: true }) * dir
      : compararChaves(chaveOrdem(a.itens.find((x) => x.atributo_id === k)), chaveOrdem(b.itens.find((x) => x.atributo_id === k)), dir)) || a.produto.id - b.produto.id).map((f) => f.produto.id);
  }, [idsLinhas, ordem]);   // eslint-disable-line react-hooks/exhaustive-deps

  // BARRA DE ROLAGEM HORIZONTAL ESPELHO (decisão do Cima, 19/11): grudada embaixo da área visível, alinhada à área dos atributos e
  // sincronizada nos dois sentidos com a grade e o cabeçalho. A largura de rolagem vem de um ResizeObserver (largura, não altura).
  const barra = React.useRef<HTMLDivElement>(null);
  const [larguraRola, setLarguraRola] = React.useState<{ total: number; visivel: number }>({ total: 0, visivel: 0 });
  const [maisDireita, setMaisDireita] = React.useState(false);   // acabamento: indicação clara de colunas à direita
  React.useEffect(() => {
    const c = corpoRola.current; if (!c || typeof ResizeObserver === 'undefined') return;
    const medir = () => { setLarguraRola((w) => (w.total === c.scrollWidth && w.visivel === c.clientWidth ? w : { total: c.scrollWidth, visivel: c.clientWidth })); const m = c.scrollLeft + c.clientWidth < c.scrollWidth - 2; setMaisDireita((v) => (v === m ? v : m)); };
    const ro = new ResizeObserver(medir); ro.observe(c); if (c.firstElementChild) ro.observe(c.firstElementChild); medir();
    return () => ro.disconnect();
  });
  const sincronizar = (x: number, origem: 'corpo' | 'barra') => {
    const c = corpoRola.current; if (c) { const m = x + c.clientWidth < c.scrollWidth - 2; setMaisDireita((v) => (v === m ? v : m)); }
    if (cabRola.current && cabRola.current.scrollLeft !== x) cabRola.current.scrollLeft = x;
    if (origem !== 'barra' && barra.current && barra.current.scrollLeft !== x) barra.current.scrollLeft = x;
    if (origem !== 'corpo' && corpoRola.current && corpoRola.current.scrollLeft !== x) corpoRola.current.scrollLeft = x;
  };

  if (erro) return <Erro mensagem={erro} aoTentar={carregarBase} />;
  if (!vit) return <Carregando />;
  const subcats = [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort((a, b) => rotuloSubcategoria(a || null).localeCompare(rotuloSubcategoria(b || null), 'pt-BR'));
  const item = (f: Ficha, aid: number) => f.itens.find((i) => i.atributo_id === aid) ?? null;
  const porId = new Map((fichas ?? []).map((f) => [f.produto.id, f]));
  const linhas = ordemIds.map((id) => porId.get(id)).filter((x): x is Ficha => !!x);
  const visiveis = colunas.filter((c) => !ocultas.has(c.id));
  // larguras: valor+unidade 190 · seleção 180 · texto 170 (mesma grade no cabeçalho e no corpo)
  const tipoCol = (cid: number) => (fichas ?? []).map((f) => item(f, cid)).find((x) => x)?.tipo ?? 'texto';
  const temUni = (cid: number) => (fichas ?? []).some((f) => { const x = item(f, cid); return !!x && (x.tipo === 'numero' || x.tipo === 'inteiro') && (x.unidades.length > 0 || !!x.unidade_efetiva); });
  const largura = (cid: number) => (temUni(cid) ? 190 : ['opcao', 'multiopcao'].includes(tipoCol(cid)) ? 180 : ['booleano'].includes(tipoCol(cid)) ? 200 : 170);
  const grade = colunas.map((c) => (ocultas.has(c.id) ? '0px' : `${largura(c.id)}px`)).join(' ');
  const seta = (k: 'id' | 'nome' | number) => (ordem?.chave === k ? (ordem.dir === 1 ? 'asc' : 'desc') : 'none');
  const ordenar = (k: 'id' | 'nome' | number) => setOrdem((o) => (o?.chave !== k ? { chave: k, dir: 1 } : o.dir === 1 ? { chave: k, dir: -1 } : null));
  // setas: o MESMO ícone da TabelaDados nova da ESQUERDA (IconeOrdenacao), só nas colunas que ordenam de verdade (Foto não ordena)
  const Setas = ({ k }: { k: 'id' | 'nome' | number }) => <IconeOrdenacao estado={seta(k) === 'asc' ? 'ascending' : seta(k) === 'desc' ? 'descending' : 'none'} />;
  const ariaSort = (k: 'id' | 'nome' | number) => (seta(k) === 'asc' ? 'ascending' : seta(k) === 'desc' ? 'descending' : 'none') as React.AriaAttributes['aria-sort'];
  return (
    <div className="at-preencher at-preencher--v2">
      <CabecalhoTravado>
        <div className="pv2-filtros" role="group" aria-label="O que preencher">
          <select className="at-campo pv2-campo" aria-label="Kit" value={kit} onChange={(e) => { setKit(e.target.value ? Number(e.target.value) : ''); setSub(''); setUsarSelecao(false); setOcultas(new Set()); setOrdem(null); }}>
            <option value="">Escolher kit</option>{kits.map((k) => <option key={k.id} value={k.id}>{k.nome} ({k.alcance} produtos)</option>)}
          </select>
          <span className="at-fraco">ou</span>
          <select className="at-campo pv2-campo" aria-label="Subcategoria" value={sub} onChange={(e) => { setSub(e.target.value); setKit(''); setUsarSelecao(false); setOcultas(new Set()); setOrdem(null); }}>
            <option value="">Escolher subcategoria</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}
          </select>
          {m.selecao.length > 0 && <Botao aoClicar={() => { setUsarSelecao(true); setKit(''); setSub(''); }}>Usar os {m.selecao.length} selecionados</Botao>}
          <label className="pv2-busca"><span className="bl-so-leitor">Buscar produto ou ID</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar produto ou ID" value={busca} onChange={(e) => setBusca(e.target.value)} disabled={!produtosBase.length} />
          </label>
          <div className="pv2-colunas">
            <button type="button" className="bl-botao pv2-campo" aria-haspopup="true" aria-expanded={menuColunas} disabled={!colunas.length} onClick={() => setMenuColunas((x) => !x)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" /></svg>
              Colunas{ocultas.size ? ` · ${ocultas.size} oculta${ocultas.size === 1 ? '' : 's'}` : ''}</button>
            {menuColunas && (
              <div className="pv2-colunas__menu" role="dialog" aria-label="Colunas visíveis" onKeyDown={(e) => { if (e.key === 'Escape') setMenuColunas(false); }}>
                <div className="pv2-colunas__topo"><span>Atributos da grade</span><button type="button" className="at-link" onClick={() => setOcultas(new Set())}>Mostrar todas</button></div>
                {colunas.map((c) => (
                  <label key={c.id} className="pv2-colunas__item"><input type="checkbox" checked={!ocultas.has(c.id)} onChange={() => setOcultas((o) => { const n = new Set(o); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} />{c.rotulo}{c.obrigatorio && <span className="at-obrig" aria-label="obrigatório">*</span>}</label>))}
                <p className="at-fraco">Foto, ID e Produto ficam sempre. Ocultar não apaga nem desfaz nada: valores e edições em andamento continuam.</p>
              </div>)}
          </div>
        </div>
      </CabecalhoTravado>
      {produtosBase.length === 0 ? <Vazio titulo="Escolha o que preencher">Selecione um kit (ex.: Fontes) ou uma subcategoria para montar a grade.</Vazio>
        : erroGrade ? <Erro mensagem={erroGrade} aoTentar={() => void carregarFichas()} />
        : carregando || !fichas ? <Carregando rotulo={`Montando a grade (${Math.min(produtos.length, MAX_LINHAS)} produtos)`} />
        : colunas.length === 0 ? <Vazio titulo="Nenhum atributo para preencher">Estes produtos ainda não têm kit com atributos. Aplique um kit em Vincular.</Vazio>
        : produtos.length === 0 ? <Vazio titulo="Nenhum produto com esta busca" acao={<Botao aoClicar={() => setBusca('')}>Limpar busca</Botao>}>A busca vale para todos os produtos do conjunto escolhido.</Vazio> : (<>
          {produtos.length > MAX_LINHAS && <p className="at-fraco">Mostrando os primeiros {MAX_LINHAS} de {produtos.length} produtos. Use a busca para chegar aos outros.</p>}
          {ocultas.size > 0 && <p className="at-fraco pv2-aviso-ocultas">{ocultas.size} coluna{ocultas.size === 1 ? '' : 's'} oculta{ocultas.size === 1 ? '' : 's'} (valores e edições preservados).</p>}
          {/* UX-1c (d): ajuda de teclado */}
          {fichas[0]?.pode_editar && <p className="at-fraco at-preencher__teclado" data-at-ajuda-teclado><strong>Teclado:</strong> Tab vai ao próximo campo · ↑/↓ mudam de linha num campo de digitar · Enter grava e desce depois de salvo · Esc desfaz o que ainda não foi salvo.</p>}
          <div className="pv2-grade" ref={tabela} role="table" aria-label="Grade de preenchimento" aria-rowcount={linhas.length + 1} onKeyDown={mover}>
            <div className="pv2-cab" role="rowgroup">
              <div className="pv2-cab__fixo" role="row">
                <div className="pv2-th pv2-th--foto" role="columnheader">Foto</div>
                <div className="pv2-th pv2-th--id" role="columnheader" aria-sort={ariaSort('id')}><button type="button" className="pv2-ordenar" onClick={() => ordenar('id')}>ID <Setas k="id" /></button></div>
                <div className="pv2-th pv2-th--nome" role="columnheader" aria-sort={ariaSort('nome')}><button type="button" className="pv2-ordenar" onClick={() => ordenar('nome')}>Produto <Setas k="nome" /></button></div>
              </div>
              <div className="pv2-cab__rola" ref={cabRola}>
                <div className="pv2-linha-cab" role="row" style={{ gridTemplateColumns: grade }}>
                  {colunas.map((c) => {
                    const ids = fichas.flatMap((f) => { const it = item(f, c.id); return it && !it.valor ? it.sugestoes.filter((s) => s.tipo === 'valor').map((s) => s.id) : []; });   // D10: só células vazias
                    const aplic = fichas.map((f) => item(f, c.id)).filter((x): x is ItemFicha => x !== null);
                    const obrigTodos = aplic.length > 0 && aplic.every((x) => x.obrigatorio);
                    const imp = aplic.find((x) => x.importancia)?.importancia ?? null;
                    const ajuda = [obrigTodos ? 'Obrigatório em todos os produtos' : aplic.some((x) => x.obrigatorio) ? 'Obrigatório em parte dos produtos (marcado na célula)' : null, imp && !obrigTodos ? `Importância: ${IMPORTANCIA[imp as keyof typeof IMPORTANCIA] ?? imp}` : null].filter(Boolean).join(' · ');
                    return (
                      <div key={c.id} className={`pv2-th ${ocultas.has(c.id) ? 'pv2-oculta' : ''}`} role="columnheader" aria-sort={ariaSort(c.id)} title={ajuda || undefined}>
                        <button type="button" className="pv2-ordenar pv2-ordenar--atr" onClick={() => ordenar(c.id)} aria-describedby={ajuda ? `pv2-ajuda-${c.id}` : undefined}>
                          <span className="pv2-th__rot">{c.rotulo}{obrigTodos && <span className="at-obrig" aria-hidden>*</span>}</span><Setas k={c.id} />
                        </button>
                        {ajuda && <span id={`pv2-ajuda-${c.id}`} className="bl-so-leitor">{ajuda}</span>}
                        {ids.length > 0 && fichas[0]?.pode_editar && <button type="button" className="at-link pv2-th__lote" onClick={() => abrirLote({ id: c.id, rotulo: c.rotulo, ids })}>aceitar {ids.length} sugest{ids.length === 1 ? 'ão' : 'ões'}</button>}
                      </div>);
                  })}
                </div>
              </div>
              {maisDireita && <button type="button" className="pv2-mais" onClick={() => { const c = corpoRola.current; if (c) { const x = Math.min(c.scrollWidth, c.scrollLeft + Math.round(c.clientWidth * 0.6)); c.scrollLeft = x; sincronizar(c.scrollLeft, 'corpo'); } }}
                  aria-label="Há mais colunas à direita: rolar para a direita" title="Há mais colunas à direita"><span aria-hidden>›</span></button>}
            </div>
            <div className="pv2-corpo" role="rowgroup">
              <div className="pv2-corpo__fixo">
                {linhas.map((f) => (
                  <div key={f.produto.id} className="pv2-linha pv2-linha--fixa" role="row" data-produto={f.produto.id}>
                    <div className="pv2-td pv2-td--foto" role="cell"><Foto mediaId={f.fotos[0]?.id ?? null} cor={f.fotos[0]?.cor ?? null} proporcao="1 / 1" compacta ajuste="cover" /></div>
                    <div className="pv2-td pv2-td--id" role="cell">{f.produto.id}</div>
                    <div className="pv2-td pv2-td--nome" role="cell"><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(f.produto.id)} title={f.produto.nome}>{f.produto.nome}</button></div>
                  </div>))}
              </div>
              <div className="pv2-corpo__rola" ref={corpoRola} onScroll={(e) => sincronizar((e.target as HTMLDivElement).scrollLeft, 'corpo')}>
                {linhas.map((f, l) => (
                  <div key={f.produto.id} className="pv2-linha" role="row" style={{ gridTemplateColumns: grade }} data-produto={f.produto.id}>
                    {colunas.map((c) => { const i = item(f, c.id);
                      const obrigTodos = fichas.every((g) => { const x = item(g, c.id); return !x || x.obrigatorio; });
                      return (
                        <div key={c.id} role="cell" data-l={l} data-c={c.id} className={`pv2-td pv2-cel ${ocultas.has(c.id) ? 'pv2-oculta' : ''}`}>
                          {i ? <CelulaGrade i={i} f={f} aoGravar={() => recarregarLinha(f.produto.id)} marcarObrigatorio={i.obrigatorio && !obrigTodos} aoDescer={() => focar(l + 1, c.id)} />
                            : <span className="at-fora-ficha pv2-fora" title="Este atributo não está na ficha deste produto (nenhum kit nem vínculo avulso). Diferente de “Não se aplica”, que é uma resposta gravada.">—</span>}
                        </div>);
                    })}
                  </div>))}
              </div>
            </div>
            {larguraRola.total > larguraRola.visivel + 1 && (
              <div className="pv2-barra" ref={barra} onScroll={(e) => sincronizar((e.target as HTMLDivElement).scrollLeft, 'barra')} aria-hidden data-pv2-barra>
                <div style={{ width: larguraRola.total, height: 1 }} />
              </div>)}
          </div></>)}
      <Dialogo titulo={`Aceitar todas as sugestões de "${aceitarCol?.rotulo ?? ''}"?`} aberto={aceitarCol !== null} aoFechar={fecharLote}
        rodape={<>
          <Botao aoClicar={fecharLote}>{lote.fase === 'confirmar' ? 'Cancelar' : 'Fechar'}</Botao>
          {lote.fase === 'confirmar' && <Botao primario trabalhando={trab} aoClicar={confirmarColuna}>Aceitar {aceitarCol?.ids.length}</Botao>}
          {(lote.fase === 'desconhecido' || lote.fase === 'em_andamento' || lote.fase === 'conferindo' || lote.fase === 'nao_encontrada') && <Botao primario={lote.fase !== 'nao_encontrada' && (lote.fase !== 'em_andamento' || !lote.reenvioSeguro)} trabalhando={lote.fase === 'conferindo'} aoClicar={conferirLote}>{lote.fase === 'nao_encontrada' ? 'Consultar de novo' : 'Conferir gravação'}</Botao>}
          {(lote.fase === 'interrompida' || lote.fase === 'nao_encontrada' || (lote.fase === 'em_andamento' && lote.reenvioSeguro)) && <Botao primario trabalhando={trab} aoClicar={confirmarColuna}>{lote.fase === 'nao_encontrada' ? 'Tentar de novo com segurança' : 'Retomar os pendentes'}</Botao>}
        </>}>
        <div data-at-lote={lote.fase} data-at-chave={lote.intencao?.chave ?? ''}>
          {lote.fase === 'confirmar' && <p>Cada sugestão vira valor <strong>manual</strong> deste campo, com histórico. Valores já preenchidos à mão não são afetados (só células vazias têm sugestão).</p>}
          <div role="status" aria-live="polite">
            {lote.fase === 'enviando' && <p>Aceitando {lote.intencao?.ids.length} sugestões…</p>}
            {lote.fase === 'conferindo' && <p>Conferindo no servidor…</p>}
            {lote.fase === 'concluido' && <p className="at-salvo">Pronto. Confirmado pelo servidor.</p>}
            {lote.fase === 'desconhecido' && <p className="at-salvo--aviso"><strong>{MSG_DESCONHECIDO}</strong> Nada será reenviado sem você pedir. Use “Conferir gravação”.{lote.msg ? ` ${lote.msg}` : ''}</p>}
            {lote.fase === 'em_andamento' && <p className="at-salvo--aviso"><strong>Ainda em andamento no servidor.</strong> {lote.reenvioSeguro ? 'Está demorando; retomar com o mesmo pedido é seguro (nada é duplicado).' : 'Confira de novo em instantes.'}</p>}
            {lote.fase === 'interrompida' && <p className="at-salvo--aviso"><strong>O lote parou no meio.</strong> As aceitas já estão salvas; as pendentes não. “Retomar os pendentes” reenvia o MESMO pedido: nada é duplicado.</p>}
            {lote.fase === 'nao_encontrada' && <p className="at-salvo--aviso"><strong>Ainda não encontramos o resultado desta gravação.</strong> Você pode consultar de novo ou tentar de novo com segurança: o mesmo pedido vai com a MESMA chave e não grava duas vezes.</p>}
            {lote.fase === 'recusada' && <p className="at-alerta"><strong>Não foi salvo.</strong> {lote.msg}</p>}
          </div>
          {lote.resumo && <ResumoDoLote r={lote.resumo} />}
        </div>
      </Dialogo>
    </div>);
}

function CelulaGrade({ i, f, aoGravar, marcarObrigatorio = false, aoDescer }: { i: ItemFicha; f: Ficha; aoGravar: () => Promise<boolean> | void; marcarObrigatorio?: boolean; aoDescer?: () => void }) {
  const m = useModulo();
  const s = i.sugestoes.find((x) => x.tipo === 'valor');
  const rot = s ? sugestaoTexto(s, i) : null;   // pelo TIPO do atributo, igual na Ficha; NUNCA deduzido do nome do produto
  return (
    <div className="pv2-celula" aria-label={`${f.produto.nome} · ${i.rotulo}`}>
      {/* PREENCHER V2: sem "Preencher" repetido (rotulo vazio = campo vazio; seletor mostra "—"); valor + unidade lado a lado */}
      <EditorValor item={i} productId={f.produto.id} podeEditar={f.pode_editar} compacto aoGravar={aoGravar} aoRecarregar={aoGravar} rotuloVazio="" aoConfirmarEnter={aoDescer} />
      {marcarObrigatorio && <span className="at-obrig pv2-cel-obrig" title="Obrigatório neste produto" aria-label="obrigatório neste produto">*</span>}
      {s && !i.valor && f.pode_editar && <button type="button" className="pv2-sugestao" title={`Sugestão: ${rot}${s.evidencia ? ` (${s.evidencia})` : ''} · clique para usar`} aria-label={`Usar a sugestão ${rot}`}
        onClick={() => enviar('sugestao', { id: s.id, versao: s.versao, decisao: 'aceitar' }).then(() => { m.aviso('Sugestão usada.'); aoGravar(); }).catch((e) => m.aviso(e.message, 'erro'))}>sug.</button>}
    </div>);
}

/** Desfecho POR ITEM do lote (aceitas · rejeitadas · ignoradas · pendentes). */
function ResumoDoLote({ r }: { r: ResumoLote }) {
  const lista = (xs: { id: number; motivo: string }[]) => xs.slice(0, 8).map((x) => <li key={x.id}>Sugestão {x.id}{x.motivo ? `: ${x.motivo}` : ''}</li>);
  return (
    <div className="at-lote-resumo" data-at-lote-resumo>
      <p><strong data-n="aceitas">{r.aceitas.length}</strong> aceita(s) · <strong data-n="rejeitadas">{r.rejeitadas.length}</strong> rejeitada(s) · <strong data-n="ignoradas">{r.ignoradas.length}</strong> ignorada(s) · <strong data-n="pendentes">{r.pendentes.length}</strong> pendente(s)</p>
      {r.rejeitadas.length > 0 && <><p className="at-fraco">Rejeitadas (continuam como sugestão):</p><ul>{lista(r.rejeitadas)}</ul></>}
      {r.ignoradas.length > 0 && <><p className="at-fraco">Ignoradas:</p><ul>{lista(r.ignoradas)}</ul></>}
      {r.pendentes.length > 0 && <p className="at-fraco">Pendentes (ainda não decididas): {r.pendentes.slice(0, 12).join(', ')}{r.pendentes.length > 12 ? '…' : ''}</p>}
    </div>);
}
