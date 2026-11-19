// panel-atributos/src/screens/Preencher.tsx — preencher em massa numa grade (§11.8): linhas = produtos, colunas = atributos do kit (ou da
// ficha dos produtos). Edição na célula (tipo + unidade), teclado (setas, Tab, Enter), estado por célula, sugestões apagadas com "Aceitar"
// e "Aceitar todas desta coluna" (só com confirmação). Primeiras colunas fixas.
import React from 'react';
import type { Ficha, ItemFicha, KitResumo, Vitrine } from '../lib/tipos';
import { conferirGravacao, enviar, enviarLoteSugestoes, ErroApi, MSG_DESCONHECIDO, novaIntencaoLote, obter, resumoDaConferencia, resumoDoErroLote, resumoDoLote, type IntencaoLote, type ResumoLote } from '../lib/api';
import { marcarPendencia } from '../lib/pendencias';
import { sugestaoTexto } from '../lib/formatar';
import { rotuloSubcategoria, IMPORTANCIA } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, Carregando, ChipKit, Dialogo, Erro, Etiqueta, Foto, Vazio } from '../ui/Comuns';
import { EditorValor } from '../ui/EditorValor';

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
  const tabela = React.useRef<HTMLTableElement>(null);
  const seqGrade = React.useRef(0);                              // trocar de kit no meio da carga: só a última grade vale
  const seqLinha = React.useRef<Record<number, number>>({});    // recarga de linha fora de ordem: só a mais recente vale

  const carregarBase = React.useCallback(() => { setErro(null); Promise.all([obter<Vitrine>('vitrine'), obter<{ kits: KitResumo[] }>('kits')]).then(([v, k]) => { setVit(v); setKits(k.kits.filter((x) => x.ativo && x.itens > 0 && !x.aplica_a_todos)); }).catch((e) => setErro(e.message)); }, []);
  React.useEffect(carregarBase, [carregarBase]);
  const [erroGrade, setErroGrade] = React.useState<string | null>(null);   // DSHOW-067: erro da grade com "Tentar novamente", sem perder kit/subcategoria/seleção

  const produtos = React.useMemo(() => {
    if (!vit) return [];
    const ativos = vit.produtos.filter((p) => p.ativo);
    if (usarSelecao) return ativos.filter((p) => m.selecao.includes(p.id));
    if (kit !== '') return ativos.filter((p) => p.kits.some((k) => k.id === kit));
    if (sub) return ativos.filter((p) => (p.subcategoria ?? '') === sub);
    return [];
  }, [vit, kit, sub, usarSelecao, m.selecao]);

  const carregarFichas = React.useCallback(async (silencioso = false) => {
    const alvo = produtos.slice(0, MAX_LINHAS);
    const n = ++seqGrade.current;
    if (!alvo.length) { setFichas(null); setColunas([]); setErroGrade(null); setCarregando(false); return; }
    setErroGrade(null);
    if (!silencioso) { setCarregando(true); setFichas(null); }
    try {
      const fs = await emLotes(alvo, 6, (p) => obter<Ficha>('ficha_produto', { product_id: p.id }));
      if (n !== seqGrade.current) return;
      const cols = new Map<number, { id: number; rotulo: string; importancia: string | null; obrigatorio: boolean; ordem: number }>();
      let ordem = 0;
      for (const f of fs) for (const i of f.itens) {
        if (kit !== '' && i.kit_id !== kit && !i.origens.some((o) => o.grupo_id === kit)) continue;
        // UX-1: omitir um opcional SÓ quando TODAS as origens forem exclusivamente do kit geral ("aplica a todos"); com origem específica
        // (escopo/kit direto) ou avulsa, a coluna aparece — pelo kit e por "Usar selecionados"
        const soGeral = i.origens.length > 0 && i.origens.every((o) => o.tipo === 'kit' && (o.motivos ?? []).length > 0 && (o.motivos ?? []).every((x) => x.tipo === 'todos'));
        if (kit === '' && soGeral && !i.obrigatorio) continue;
        if (!cols.has(i.atributo_id)) cols.set(i.atributo_id, { id: i.atributo_id, rotulo: i.rotulo, importancia: i.importancia, obrigatorio: i.obrigatorio, ordem: ordem++ });
      }
      setColunas([...cols.values()].sort((a, b) => a.ordem - b.ordem));
      setFichas(fs);
    } catch (e) { if (n === seqGrade.current) setErroGrade(e instanceof ErroApi ? e.message : 'Falha de rede.'); } finally { if (n === seqGrade.current) setCarregando(false); }
  }, [produtos, kit]);
  React.useEffect(() => { carregarFichas(); }, [carregarFichas]);

  // "foi salvo ou não" (item 3): a releitura da linha NÃO engole o erro — devolve false e a célula mostra
  // "Salvo. Não foi possível atualizar o valor na tela." + [Atualizar valor] (só leitura). Resposta antiga não sobrescreve a mais nova.
  const recarregarLinha = async (pid: number): Promise<boolean> => {
    const n = (seqLinha.current[pid] ?? 0) + 1; seqLinha.current[pid] = n;
    try { const f = await obter<Ficha>('ficha_produto', { product_id: pid }); if (n === seqLinha.current[pid]) setFichas((fs) => fs?.map((x) => (x.produto.id === pid ? f : x)) ?? null); return true; }
    catch { return false; }
  };
  // UX-1: foco no mesmo atributo de outra linha (campo de digitar primeiro; senão o seletor)
  const focar = (l: number, c: string | number) => {
    const sel = `td[data-l="${l}"][data-c="${c}"]`;
    tabela.current?.querySelector<HTMLElement>(`${sel} input:not([type=checkbox]):not([type=radio]), ${sel} select`)?.focus();
  };
  // ↑/↓ mudam de linha SÓ num campo de digitar; num seletor (unidade/opção) as setas são dele. Enter: o EditorValor desce depois de confirmar.
  const mover = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const el = e.target as HTMLElement;
    if (!(el instanceof HTMLInputElement) || el.type === 'checkbox' || el.type === 'radio') return;
    const td = el.closest('td[data-l]') as HTMLElement | null; if (!td) return;
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

  if (erro) return <Erro mensagem={erro} aoTentar={carregarBase} />;
  if (!vit) return <Carregando />;
  const subcats = [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort((a, b) => rotuloSubcategoria(a || null).localeCompare(rotuloSubcategoria(b || null), 'pt-BR'));
  const item = (f: Ficha, aid: number) => f.itens.find((i) => i.atributo_id === aid) ?? null;
  return (
    <div className="at-preencher">
      <div className="at-titulo-tela">
        {/* UX-1b: título e descrição vêm do cabeçalho do módulo */}
        <div className="at-acoes">
          <select className="at-campo" aria-label="Kit" value={kit} onChange={(e) => { setKit(e.target.value ? Number(e.target.value) : ''); setSub(''); setUsarSelecao(false); }}>
            <option value="">Escolha um kit…</option>{kits.map((k) => <option key={k.id} value={k.id}>{k.nome} ({k.alcance} produtos)</option>)}
          </select>
          <span className="at-fraco">ou</span>
          <select className="at-campo" aria-label="Subcategoria" value={sub} onChange={(e) => { setSub(e.target.value); setKit(''); setUsarSelecao(false); }}>
            <option value="">Escolha uma subcategoria…</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}
          </select>
          {m.selecao.length > 0 && <Botao aoClicar={() => { setUsarSelecao(true); setKit(''); setSub(''); }}>Usar os {m.selecao.length} selecionados</Botao>}
        </div>
      </div>
      {produtos.length === 0 ? <Vazio titulo="Escolha o que preencher">Selecione um kit (ex.: Fontes) ou uma subcategoria para montar a grade.</Vazio>
        : erroGrade ? <Erro mensagem={erroGrade} aoTentar={() => void carregarFichas()} />
        : carregando || !fichas ? <Carregando rotulo={`Montando a grade (${Math.min(produtos.length, MAX_LINHAS)} produtos)`} />
        : colunas.length === 0 ? <Vazio titulo="Nenhum atributo para preencher">Estes produtos ainda não têm kit com atributos. Aplique um kit em Vincular.</Vazio> : (<>
          {produtos.length > MAX_LINHAS && <p className="at-fraco">Mostrando os primeiros {MAX_LINHAS} de {produtos.length} produtos.</p>}
          <div className="at-grade-massa bl-cartao" onKeyDown={mover}>
            <table className="at-tabela at-tabela--grade" ref={tabela}>
              <thead><tr>
                <th className="at-fixa at-fixa--1">Foto</th><th className="at-fixa at-fixa--2">ID</th><th className="at-fixa at-fixa--3">Produto</th>
                {colunas.map((c) => {
                  const ids = fichas.flatMap((f) => { const it = item(f, c.id); return it && !it.valor ? it.sugestoes.filter((s) => s.tipo === 'valor').map((s) => s.id) : []; });   // D10: só células vazias
                  // UX-1: "Obrigatório" no cabeçalho só quando vale para TODOS os produtos em que o atributo se aplica; senão, na célula
                  const aplic = fichas.map((f) => item(f, c.id)).filter((x): x is ItemFicha => x !== null);
                  const obrigTodos = aplic.length > 0 && aplic.every((x) => x.obrigatorio);
                  const impNaoObrig = aplic.find((x) => !x.obrigatorio)?.importancia ?? null;
                  const rotImp = obrigTodos ? IMPORTANCIA.obrigatorio : impNaoObrig && impNaoObrig !== 'obrigatorio' ? IMPORTANCIA[impNaoObrig] : null;
                  return (<th key={c.id}><div className="at-grade-col"><span>{c.rotulo}</span>
                    {rotImp && <span className={`at-imp ${obrigTodos ? 'at-imp--forte' : 'at-imp--fraca'}`}>{rotImp}</span>}
                    {ids.length > 0 && fichas[0]?.pode_editar && <button type="button" className="at-link" onClick={() => abrirLote({ id: c.id, rotulo: c.rotulo, ids })}>aceitar {ids.length} sugest{ids.length === 1 ? 'ão' : 'ões'}</button>}</div></th>);
                })}
              </tr></thead>
              <tbody>{fichas.map((f, l) => (
                <tr key={f.produto.id}>
                  <td className="at-fixa at-fixa--1"><div className="at-grade-foto"><Foto mediaId={f.fotos[0]?.id ?? null} cor={f.fotos[0]?.cor ?? null} compacta ajuste="cover" /></div></td>
                  <td className="at-fixa at-fixa--2">{f.produto.id}</td>
                  <td className="at-fixa at-fixa--3"><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(f.produto.id)} title={f.produto.nome}>{f.produto.nome}</button></td>
                  {colunas.map((c) => { const i = item(f, c.id);
                    const obrigTodos = fichas.every((g) => { const x = item(g, c.id); return !x || x.obrigatorio; });
                    return (
                    <td key={c.id} data-l={l} data-c={c.id} className="at-grade-cel">
                      {i ? <CelulaGrade i={i} f={f} aoGravar={() => recarregarLinha(f.produto.id)} marcarObrigatorio={i.obrigatorio && !obrigTodos} aoDescer={() => focar(l + 1, c.id)} /> : <span className="at-fora-ficha" title="Este atributo não está na ficha deste produto (nenhum kit nem vínculo avulso). Diferente de “Não se aplica”, que é uma resposta gravada.">Fora da ficha</span>}
                    </td>); })}
                </tr>))}</tbody>
            </table>
          </div></>)}
      <Dialogo titulo={`Aceitar todas as sugestões de "${aceitarCol?.rotulo ?? ''}"?`} aberto={aceitarCol !== null} aoFechar={fecharLote}
        rodape={<>
          <Botao aoClicar={fecharLote}>{lote.fase === 'confirmar' ? 'Cancelar' : 'Fechar'}</Botao>
          {lote.fase === 'confirmar' && <Botao primario trabalhando={trab} aoClicar={confirmarColuna}>Aceitar {aceitarCol?.ids.length}</Botao>}
          {(lote.fase === 'desconhecido' || lote.fase === 'em_andamento' || lote.fase === 'conferindo') && <Botao primario={lote.fase !== 'em_andamento' || !lote.reenvioSeguro} trabalhando={lote.fase === 'conferindo'} aoClicar={conferirLote}>Conferir gravação</Botao>}
          {(lote.fase === 'interrompida' || lote.fase === 'nao_encontrada' || (lote.fase === 'em_andamento' && lote.reenvioSeguro)) && <Botao primario trabalhando={trab} aoClicar={confirmarColuna}>{lote.fase === 'nao_encontrada' ? 'Enviar de novo' : 'Retomar os pendentes'}</Botao>}
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
            {lote.fase === 'nao_encontrada' && <p className="at-salvo--aviso"><strong>O servidor não recebeu este pedido.</strong> Nada foi salvo. Você pode enviar de novo (o mesmo pedido).</p>}
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
  const rot = s ? sugestaoTexto(s, i) : null;   // UX-1: pelo TIPO do atributo, igual na Ficha
  return (
    <div className="at-grade-celula">
      <EditorValor item={i} productId={f.produto.id} podeEditar={f.pode_editar} compacto aoGravar={aoGravar} aoRecarregar={aoGravar} rotuloVazio={f.pode_editar ? 'Preencher' : undefined} aoConfirmarEnter={aoDescer} />
      {marcarObrigatorio && <span className="at-imp at-imp--forte at-cel-obrig" title="Obrigatório neste produto">Obrigatório</span>}
      {s && !i.valor && <span className="at-sugestao at-sugestao--cel" title={s.evidencia ?? ''}>Sugestão: {rot}
        {f.pode_editar && <> · <button type="button" className="at-link" onClick={() => enviar('sugestao', { id: s.id, versao: s.versao, decisao: 'aceitar' }).then(() => { m.aviso('Sugestão usada.'); aoGravar(); }).catch((e) => m.aviso(e.message, 'erro'))}>Usar</button></>}</span>}
      {false && <ChipKit nome="" />}
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
