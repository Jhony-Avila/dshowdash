// panel-atributos/src/screens/Preencher.tsx — preencher em massa numa grade (§11.8): linhas = produtos, colunas = atributos do kit (ou da
// ficha dos produtos). Edição na célula (tipo + unidade), teclado (setas, Tab, Enter), estado por célula, sugestões apagadas com "Aceitar"
// e "Aceitar todas desta coluna" (só com confirmação). Primeiras colunas fixas.
import React from 'react';
import type { Ficha, ItemFicha, KitResumo, Vitrine } from '../lib/tipos';
import { enviar, ErroApi, obter } from '../lib/api';
import { decimal } from '../lib/formatar';
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
  const tabela = React.useRef<HTMLTableElement>(null);

  React.useEffect(() => { Promise.all([obter<Vitrine>('vitrine'), obter<{ kits: KitResumo[] }>('kits')]).then(([v, k]) => { setVit(v); setKits(k.kits.filter((x) => x.ativo && x.itens > 0 && !x.aplica_a_todos)); }).catch((e) => setErro(e.message)); }, []);

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
    if (!alvo.length) { setFichas(null); setColunas([]); return; }
    if (!silencioso) { setCarregando(true); setFichas(null); }
    try {
      const fs = await emLotes(alvo, 6, (p) => obter<Ficha>('ficha_produto', { product_id: p.id }));
      const cols = new Map<number, { id: number; rotulo: string; importancia: string | null; obrigatorio: boolean; ordem: number }>();
      let ordem = 0;
      for (const f of fs) for (const i of f.itens) {
        if (kit !== '' && i.kit_id !== kit && !i.origens.some((o) => o.grupo_id === kit)) continue;
        if (kit === '' && i.origens.some((o) => (o.motivos ?? []).some((x) => x.tipo === 'todos')) && !i.obrigatorio) continue;   // grade sem o kit geral (descrições), salvo obrigatórios
        if (!cols.has(i.atributo_id)) cols.set(i.atributo_id, { id: i.atributo_id, rotulo: i.rotulo, importancia: i.importancia, obrigatorio: i.obrigatorio, ordem: ordem++ });
      }
      setColunas([...cols.values()].sort((a, b) => a.ordem - b.ordem));
      setFichas(fs);
    } catch (e) { setErro(e instanceof ErroApi ? e.message : 'Falha.'); } finally { setCarregando(false); }
  }, [produtos, kit]);
  React.useEffect(() => { carregarFichas(); }, [carregarFichas]);

  const recarregarLinha = async (pid: number) => {
    try { const f = await obter<Ficha>('ficha_produto', { product_id: pid }); setFichas((fs) => fs?.map((x) => (x.produto.id === pid ? f : x)) ?? null); } catch { /* a célula mostra o erro */ }
  };
  const mover = (e: React.KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
    const td = (e.target as HTMLElement).closest('td[data-l]') as HTMLElement | null; if (!td) return;
    const l = Number(td.dataset.l) + (e.key === 'ArrowUp' ? -1 : 1); const c = td.dataset.c;
    const alvo = tabela.current?.querySelector<HTMLElement>(`td[data-l="${l}"][data-c="${c}"] input, td[data-l="${l}"][data-c="${c}"] select`);
    if (alvo) { if (e.key !== 'Enter') e.preventDefault(); window.setTimeout(() => alvo.focus(), e.key === 'Enter' ? 60 : 0); }
  };
  const confirmarColuna = async () => {
    if (!aceitarCol) return; setTrab(true);
    try { const r = await enviar<{ aceitas: number; falhas: { id: number; erro: string }[] }>('sugestoes_lote', { ids: aceitarCol.ids, confirmar: true });
      m.aviso(`${r.aceitas} sugestão(ões) aceitas${r.falhas.length ? `; ${r.falhas.length} com erro` : ''}.`, r.falhas.length ? 'info' : 'sucesso'); setAceitarCol(null); carregarFichas(true); }
    catch (e) { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); } finally { setTrab(false); }
  };

  if (erro) return <Erro mensagem={erro} />;
  if (!vit) return <Carregando />;
  const subcats = [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort((a, b) => rotuloSubcategoria(a || null).localeCompare(rotuloSubcategoria(b || null), 'pt-BR'));
  const item = (f: Ficha, aid: number) => f.itens.find((i) => i.atributo_id === aid) ?? null;
  return (
    <div className="at-preencher">
      <div className="at-titulo-tela">
        <div><h2>Preencher em massa</h2><p>Escolha um kit ou uma subcategoria. Setas ↑↓ mudam de linha, Tab muda de coluna, Enter grava e desce. Sugestões aparecem apagadas na célula.</p></div>
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
        : carregando || !fichas ? <Carregando rotulo={`Montando a grade (${Math.min(produtos.length, MAX_LINHAS)} produtos)`} />
        : colunas.length === 0 ? <Vazio titulo="Nenhum atributo para preencher">Estes produtos ainda não têm kit com atributos. Aplique um kit em Vincular.</Vazio> : (<>
          {produtos.length > MAX_LINHAS && <p className="at-fraco">Mostrando os primeiros {MAX_LINHAS} de {produtos.length} produtos.</p>}
          <div className="at-grade-massa bl-cartao" onKeyDown={mover}>
            <table className="at-tabela at-tabela--grade" ref={tabela}>
              <thead><tr>
                <th className="at-fixa at-fixa--1">Foto</th><th className="at-fixa at-fixa--2">ID</th><th className="at-fixa at-fixa--3">Produto</th>
                {colunas.map((c) => {
                  const ids = fichas.flatMap((f) => { const it = item(f, c.id); return it && !it.valor ? it.sugestoes.filter((s) => s.tipo === 'valor').map((s) => s.id) : []; });   // D10: só células vazias
                  return (<th key={c.id}><div className="at-grade-col"><span>{c.rotulo}{c.obrigatorio && <span className="at-obrig">*</span>}</span>
                    {c.importancia && <span className="at-imp at-imp--fraca">{IMPORTANCIA[c.importancia]}</span>}
                    {ids.length > 0 && fichas[0]?.pode_editar && <button type="button" className="at-link" onClick={() => setAceitarCol({ id: c.id, rotulo: c.rotulo, ids })}>aceitar {ids.length} sugest{ids.length === 1 ? 'ão' : 'ões'}</button>}</div></th>);
                })}
              </tr></thead>
              <tbody>{fichas.map((f, l) => (
                <tr key={f.produto.id}>
                  <td className="at-fixa at-fixa--1"><div className="at-grade-foto"><Foto mediaId={f.fotos[0]?.id ?? null} cor={f.fotos[0]?.cor ?? null} compacta ajuste="cover" /></div></td>
                  <td className="at-fixa at-fixa--2">{f.produto.id}</td>
                  <td className="at-fixa at-fixa--3"><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(f.produto.id)} title={f.produto.nome}>{f.produto.nome}</button></td>
                  {colunas.map((c) => { const i = item(f, c.id); return (
                    <td key={c.id} data-l={l} data-c={c.id} className="at-grade-cel">
                      {i ? <CelulaGrade i={i} f={f} aoGravar={() => recarregarLinha(f.produto.id)} /> : <span className="at-fraco" title="Não se aplica a este produto">—</span>}
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

function CelulaGrade({ i, f, aoGravar }: { i: ItemFicha; f: Ficha; aoGravar: () => void }) {
  const m = useModulo();
  const s = i.sugestoes.find((x) => x.tipo === 'valor');
  const rot = s ? (s.opcao_id ? i.opcoes.find((o) => o.id === s.opcao_id)?.rotulo : s.valor_proposto && /^-?\d+(\.\d+)?$/.test(s.valor_proposto) ? decimal(s.valor_proposto) : s.valor_proposto) : null;
  return (
    <div className="at-grade-celula">
      <EditorValor item={i} productId={f.produto.id} podeEditar={f.pode_editar} compacto aoGravar={aoGravar} aoRecarregar={aoGravar} />
      {s && !i.valor && <span className="at-sugestao at-sugestao--cel" title={s.evidencia ?? ''}>{rot} {s.unidade_id ? i.unidades.find((u) => u.id === s.unidade_id)?.simbolo : ''}
        {f.pode_editar && <> <button type="button" className="at-link" onClick={() => enviar('sugestao', { id: s.id, versao: s.versao, decisao: 'aceitar' }).then(() => { m.aviso('Sugestão aceita.'); aoGravar(); }).catch((e) => m.aviso(e.message, 'erro'))}>aceitar</button></>}</span>}
      {i.obrigatorio && !i.valor && !s && <Etiqueta tom="aviso">obrigatório</Etiqueta>}
      {false && <ChipKit nome="" />}
    </div>);
}
