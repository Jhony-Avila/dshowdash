// panel-atributos/src/screens/Preencher.tsx — preencher em massa numa grade (§11.8): linhas = produtos, colunas = atributos do kit (ou da
// ficha dos produtos). Edição na célula (tipo + unidade), teclado (setas, Tab, Enter), estado por célula, sugestões apagadas com "Aceitar"
// e "Aceitar todas desta coluna" (só com confirmação). Primeiras colunas fixas.
import React from 'react';
import type { Ficha, ItemFicha, KitResumo, Vitrine } from '../lib/tipos';
import { enviar, ErroApi, obter } from '../lib/api';
import { sugestaoTexto } from '../lib/formatar';
import { rotuloSubcategoria, IMPORTANCIA } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, CabecalhoTravado, Carregando, ChipKit, Dialogo, Erro, Etiqueta, Foto, Vazio } from '../ui/Comuns';
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

  const recarregarLinha = async (pid: number) => {
    const n = (seqLinha.current[pid] ?? 0) + 1; seqLinha.current[pid] = n;
    try { const f = await obter<Ficha>('ficha_produto', { product_id: pid }); if (n === seqLinha.current[pid]) setFichas((fs) => fs?.map((x) => (x.produto.id === pid ? f : x)) ?? null); } catch { /* a célula mostra o erro */ }
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
  const confirmarColuna = async () => {
    if (!aceitarCol) return; setTrab(true);
    try { const r = await enviar<{ aceitas: number; falhas: { id: number; erro: string }[] }>('sugestoes_lote', { ids: aceitarCol.ids, confirmar: true });
      m.aviso(`${r.aceitas} sugestão(ões) aceitas${r.falhas.length ? `; ${r.falhas.length} com erro` : ''}.`, r.falhas.length ? 'info' : 'sucesso'); setAceitarCol(null); carregarFichas(true); }
    catch (e) { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); } finally { setTrab(false); }
  };

  if (erro) return <Erro mensagem={erro} aoTentar={carregarBase} />;
  if (!vit) return <Carregando />;
  const subcats = [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort((a, b) => rotuloSubcategoria(a || null).localeCompare(rotuloSubcategoria(b || null), 'pt-BR'));
  const item = (f: Ficha, aid: number) => f.itens.find((i) => i.atributo_id === aid) ?? null;
  return (
    <div className="at-preencher">
      <CabecalhoTravado><div className="at-titulo-tela">
        {/* título vem do cabeçalho do módulo; kit, subcategoria e seleção ficam no bloco travado */}
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
      </div></CabecalhoTravado>
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
                    {ids.length > 0 && fichas[0]?.pode_editar && <button type="button" className="at-link" onClick={() => setAceitarCol({ id: c.id, rotulo: c.rotulo, ids })}>aceitar {ids.length} sugest{ids.length === 1 ? 'ão' : 'ões'}</button>}</div></th>);
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
      <Dialogo titulo={`Aceitar todas as sugestões de "${aceitarCol?.rotulo ?? ''}"?`} aberto={aceitarCol !== null} aoFechar={() => setAceitarCol(null)}
        rodape={<><Botao aoClicar={() => setAceitarCol(null)}>Cancelar</Botao><Botao primario trabalhando={trab} aoClicar={confirmarColuna}>Aceitar {aceitarCol?.ids.length}</Botao></>}>
        <p>Cada sugestão vira valor <strong>manual</strong> deste campo, com histórico. Valores já preenchidos à mão não são afetados (só células vazias têm sugestão).</p>
      </Dialogo>
    </div>);
}

function CelulaGrade({ i, f, aoGravar, marcarObrigatorio = false, aoDescer }: { i: ItemFicha; f: Ficha; aoGravar: () => void; marcarObrigatorio?: boolean; aoDescer?: () => void }) {
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
