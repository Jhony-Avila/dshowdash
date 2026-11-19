// panel-atributos/src/screens/Vincular.tsx — vincular atributos × produtos em massa (§11.4): passo 1 produtos, passo 2 o que aplicar ou
// remover, passo 3 PRÉVIA obrigatória e confirmação (idempotente pela chave). Visão em matriz produtos × kits.
import React from 'react';
import type { AtributoDicionario, KitResumo, Previa, Vitrine } from '../lib/tipos';
import { enviar, ErroApi, novaChave, obter } from '../lib/api';
import { casaBusca } from '../lib/formatar';
import { rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, CabecalhoTravado, CapsulaId, Carregando, ChipKit, Erro, Etiqueta, Vazio } from '../ui/Comuns';
import { alternarLado } from '../lib/integridade';

export function Vincular() {
  const m = useModulo();
  const [modo, setModo] = React.useState<'passos' | 'matriz'>('passos');
  const [vit, setVit] = React.useState<Vitrine | null>(null);
  const [kits, setKits] = React.useState<KitResumo[] | null>(null);
  const [dic, setDic] = React.useState<AtributoDicionario[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [passo, setPasso] = React.useState(m.selecao.length ? 2 : 1);   // vindo de Produtos com seleção: direto ao passo 2
  const [busca, setBusca] = React.useState(''); const [sub, setSub] = React.useState('');
  const [kA, setKA] = React.useState<number[]>([]); const [kR, setKR] = React.useState<number[]>([]);
  const [aI, setAI] = React.useState<number[]>([]); const [aE, setAE] = React.useState<{ id: number; motivo: string }[]>([]);
  const [qAtr, setQAtr] = React.useState('');
  const [previa, setPrevia] = React.useState<Previa | null>(null); const [chave, setChave] = React.useState('');
  const [trab, setTrab] = React.useState(false);
  // DSHOW-056: RETRATO imutável do pedido que gerou a prévia; a confirmação envia só ele. Mudou a intenção → a prévia cai (volta ao passo 2).
  const corpoAtual = () => ({ produtos: m.selecao, kits_aplicar: kA, kits_remover: kR, atributos_incluir: aI.map((id) => ({ atributo_id: id })), atributos_excluir: aE.map((x) => ({ atributo_id: x.id, motivo: x.motivo })) });
  const intencao = JSON.stringify(corpoAtual());
  const intencaoRef = React.useRef(intencao); intencaoRef.current = intencao;
  const [pedidoPrevia, setPedidoPrevia] = React.useState<string | null>(null);
  const pedidoSeq = React.useRef(0);                                           // ignora resposta de prévia atrasada
  const incerta = React.useRef<{ pedido: string; chave: string } | null>(null); // tentativa sem resposta: a mesma intenção reusa a MESMA chave
  React.useEffect(() => {
    if (pedidoPrevia !== null && pedidoPrevia !== intencao) { pedidoSeq.current++; setPrevia(null); setPedidoPrevia(null); setPasso((p) => (p === 3 ? 2 : p)); }
  }, [intencao, pedidoPrevia]);
  const carregar = React.useCallback(() => {
    setErro(null);
    Promise.all([obter<Vitrine>('vitrine'), obter<{ kits: KitResumo[] }>('kits'), obter<{ atributos: AtributoDicionario[] }>('dicionario')])
      .then(([v, k, d]) => { setVit(v); setKits(k.kits.filter((x) => x.ativo && x.itens > 0)); setDic(d.atributos.filter((a) => a.ativo)); }).catch((e) => setErro(e.message));
  }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!vit || !kits || !dic) return <Carregando rotulo="Carregando produtos e kits" />;
  if (!vit.pode_vincular) return <Vazio titulo="Seu nível não permite vincular">Peça a alguém com nível de administração (80).</Vazio>;
  const sel = new Set(m.selecao);
  const ativos = vit.produtos.filter((p) => p.ativo);
  const filtrados = ativos.filter((p) => (!sub || (p.subcategoria ?? '') === sub) && casaBusca(busca, p.id, p.nome));
  const subcats = [...new Set(ativos.map((p) => p.subcategoria ?? ''))].sort((a, b) => rotuloSubcategoria(a || null).localeCompare(rotuloSubcategoria(b || null), 'pt-BR'));
  // Ações opostas: marcar um kit/atributo num lado tira do outro e avisa (o servidor também recusa os dois lados com 422)
  const ladoKit = (id: number, lado: 'a' | 'b') => {
    const r = alternarLado({ a: kA, b: kR }, id, lado);
    setKA(r.estado.a); setKR(r.estado.b);
    if (r.trocou) m.aviso(`Kit ${kits.find((k) => k.id === id)?.nome ?? `#${id}`} passou de ${lado === 'a' ? 'Remover para Aplicar' : 'Aplicar para Remover'}.`, 'info');
  };
  const ladoAtr = (id: number, lado: 'a' | 'b') => {
    if ((lado === 'a' ? aI.includes(id) : aE.some((x) => x.id === id))) return;   // os links só acrescentam; o ✕ tira
    const r = alternarLado({ a: aI, b: aE.map((x) => x.id) }, id, lado);
    setAI(r.estado.a);
    setAE(r.estado.b.map((x) => aE.find((y) => y.id === x) ?? { id: x, motivo: '' }));
    if (r.trocou) m.aviso(`Atributo ${rotAtr(id)} passou de ${lado === 'a' ? 'Excluir para Incluir' : 'Incluir para Excluir'}.`, 'info');
  };
  const nada = !kA.length && !kR.length && !aI.length && !aE.length;
  const verPrevia = async () => {
    const pedido = intencao; const seq = ++pedidoSeq.current;
    setTrab(true); setPrevia(null); setPedidoPrevia(null);
    try {
      const r = await enviar<Previa>('massa_previa', JSON.parse(pedido));
      if (seq !== pedidoSeq.current || pedido !== intencaoRef.current) return;   // atrasada ou a intenção mudou no meio: ignora
      setPrevia(r); setPedidoPrevia(pedido); setChave(incerta.current?.pedido === pedido ? incerta.current.chave : novaChave()); setPasso(3);
    } catch (e) { if (seq === pedidoSeq.current) m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); } finally { setTrab(false); }
  };
  const aplicar = async () => {
    if (!previa || pedidoPrevia === null || pedidoPrevia !== intencaoRef.current || trab) return;   // só confirma o RETRATO da prévia vigente
    const pedido = pedidoPrevia;
    setTrab(true);
    try {
      const r = await enviar<{ gravado: Record<string, number>; repetido?: boolean }>('massa_aplicar', { ...JSON.parse(pedido), chave, versao_previa: previa.versao_previa });
      incerta.current = null;
      m.aviso(r.repetido ? 'Esta aplicação já tinha sido gravada (nada repetido).' : `Gravado: ${r.gravado.kits_aplicados} kit(s) aplicados, ${r.gravado.inclusoes} atributo(s) incluídos, ${r.gravado.exclusoes} exceção(ões), ${r.gravado.kits_removidos} kit(s) removidos.`);
      setPasso(1); setPrevia(null); setPedidoPrevia(null); setKA([]); setKR([]); setAI([]); setAE([]); m.recarregar();
    } catch (e) {
      if (!(e instanceof ErroApi) || e.http >= 500) incerta.current = { pedido, chave };   // resultado incerto: a próxima tentativa usa a mesma chave
      m.aviso(e instanceof ErroApi ? e.message : 'Sem resposta do servidor. Confira e tente de novo: a mesma chave evita gravar duas vezes.', 'erro');
    } finally { setTrab(false); }
  };
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const atrFiltrados = qAtr.trim().length < 2 ? [] : dic.filter((a) => n(a.rotulo + ' ' + a.codigo).includes(n(qAtr))).slice(0, 30);
  const rotAtr = (id: number) => dic.find((a) => a.id === id)?.rotulo ?? `#${id}`;
  const frase = previa ? `Vai acrescentar ${previa.resumo.atributos_acrescentados} atributo(s) a ${previa.resumo.produtos_afetados} de ${previa.resumo.produtos} produto(s)`
    + (previa.resumo.ja_tinham ? `; ${previa.resumo.ja_tinham} vínculo(s) já existiam` : '') + (previa.resumo.kits_ja_aplicados ? `; ${previa.resumo.kits_ja_aplicados} kit(s) já estavam aplicados` : '')
    + (previa.resumo.atributos_removidos ? `; ${previa.resumo.atributos_removidos} atributo(s) saem da ficha.` : '; nada será removido.') : '';

  return (
    <div className="at-vincular">
      <CabecalhoTravado>{/* CABEÇALHO TRAVADO (exceção do Jhony, 19/11): só envolve; nada de lógica */}
      <div className="at-titulo-tela">
        <div><h2>Vincular</h2><p>Aplique kits ou atributos avulsos a vários produtos de uma vez. Nada é gravado antes da prévia.</p></div>
        <div className="at-alternador" role="group" aria-label="Visão">
          <button type="button" className={modo === 'passos' ? 'ativo' : ''} aria-pressed={modo === 'passos'} onClick={() => setModo('passos')}>Aplicar</button>
          <button type="button" className={modo === 'matriz' ? 'ativo' : ''} aria-pressed={modo === 'matriz'} onClick={() => setModo('matriz')}>Matriz</button>
        </div>
      </div></CabecalhoTravado>
      {modo === 'matriz' ? <Matriz vit={vit} kits={kits} sel={sel} /> : (<>
        <CabecalhoTravado>
        <ol className="at-passos" aria-label="Passos">
          {['Produtos', 'O que aplicar', 'Prévia e confirmação'].map((r, i) => (
            <li key={r} className={passo === i + 1 ? 'ativo' : passo > i + 1 ? 'feito' : ''}><button type="button" disabled={i + 1 > passo && !(i === 1 && m.selecao.length)} onClick={() => setPasso(i + 1)}><span>{i + 1}</span>{r}</button></li>))}
        </ol></CabecalhoTravado>
        {passo === 1 && (
          <section className="at-painel">
            <CabecalhoTravado>
            <div className="at-painel__cabeca">
              <h3>1. Escolha os produtos <Etiqueta tom={m.selecao.length ? 'verde' : 'neutro'}>{m.selecao.length} selecionado(s)</Etiqueta></h3>
              <div className="at-acoes">
                <input className="at-campo" type="search" placeholder="Nome ou ID" aria-label="Filtrar produtos" value={busca} onChange={(e) => setBusca(e.target.value)} />
                <select className="at-campo" aria-label="Subcategoria" value={sub} onChange={(e) => setSub(e.target.value)}><option value="">Todas as subcategorias</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}</select>
                <Botao aoClicar={() => m.setSelecao([...new Set([...m.selecao, ...filtrados.map((p) => p.id)])])}>Selecionar os {filtrados.length} filtrados</Botao>
                <Botao aoClicar={() => m.setSelecao([])} desligado={!m.selecao.length}>Limpar</Botao>
                <Botao primario desligado={!m.selecao.length} aoClicar={() => setPasso(2)}>Continuar</Botao>
              </div>
            </div></CabecalhoTravado>
            <div className="at-lista-produtos bl-rola-x">
              {filtrados.slice(0, 200).map((p) => (
                <label key={p.id} className={`at-lista-produtos__item ${sel.has(p.id) ? 'ativo' : ''}`}>
                  <input type="checkbox" checked={sel.has(p.id)} onChange={() => m.setSelecao(sel.has(p.id) ? m.selecao.filter((x) => x !== p.id) : [...m.selecao, p.id])} />
                  <CapsulaId id={p.id} flutuante={false} /><span className="at-lista-produtos__nome">{p.nome}</span><span className="at-fraco">{rotuloSubcategoria(p.subcategoria)}</span>
                  <span className="at-cartao__chips">{p.kits.filter((k) => !k.motivos.includes('todos')).map((k) => <ChipKit key={k.id} nome={k.nome} pequeno />)}</span>
                </label>))}
              {filtrados.length > 200 && <p className="at-fraco" style={{ padding: 12 }}>Mostrando 200 de {filtrados.length}. Use os filtros (ou "selecionar os filtrados").</p>}
            </div>
          </section>)}
        {passo === 2 && (
          <section className="at-painel">
            <div className="at-painel__cabeca"><h3>2. O que aplicar ou remover em {m.selecao.length} produto(s)</h3>
              <div className="at-acoes"><Botao aoClicar={() => setPasso(1)}>Voltar</Botao><Botao primario desligado={nada} trabalhando={trab} aoClicar={verPrevia}>Ver prévia</Botao></div></div>
            <div className="at-painel__corpo at-vinc-colunas">
              <div>
                <h4>Aplicar kits</h4>
                <ul className="at-escolha">{kits.map((k) => (
                  <li key={k.id}><label className={kA.includes(k.id) ? 'ativo' : ''}><input type="checkbox" checked={kA.includes(k.id)} onChange={() => ladoKit(k.id, 'a')} />
                    <span><ChipKit nome={k.nome} pequeno /> <span className="at-fraco">{k.itens} atributos · alcança {k.alcance}</span></span></label></li>))}</ul>
                <h4>Remover kit aplicado direto</h4>
                <p className="at-fraco">Só desfaz vínculo direto. Kit que vale pela subcategoria não sai por aqui (use "excluir atributo").</p>
                <ul className="at-escolha">{kits.filter((k) => k.diretos > 0).map((k) => (
                  <li key={k.id}><label className={kR.includes(k.id) ? 'ativo' : ''}><input type="checkbox" checked={kR.includes(k.id)} onChange={() => ladoKit(k.id, 'b')} /><span>{k.nome} <span className="at-fraco">({k.diretos} direto(s))</span></span></label></li>))}</ul>
              </div>
              <div>
                <h4>Atributos avulsos</h4>
                <input className="at-campo" style={{ width: '100%' }} type="search" placeholder="Buscar no dicionário (2+ letras)" aria-label="Buscar atributo" value={qAtr} onChange={(e) => setQAtr(e.target.value)} />
                <ul className="at-escolha at-escolha--curta">{atrFiltrados.map((a) => (
                  <li key={a.id}><span className="at-escolha__linha"><span><strong>{a.rotulo}</strong> <span className="at-fraco">{a.unidade ?? ''} {a.grupo_atributos ?? ''}</span></span>
                    <span><button type="button" className="at-link" onClick={() => ladoAtr(a.id, 'a')}>incluir</button> · <button type="button" className="at-link" onClick={() => ladoAtr(a.id, 'b')}>excluir</button></span></span></li>))}</ul>
                {aI.length > 0 && <><h4>Incluir</h4><ul className="at-tags">{aI.map((id) => <li key={id}>{rotAtr(id)} <button type="button" className="at-link" aria-label={`Tirar ${rotAtr(id)}`} onClick={() => setAI(aI.filter((x) => x !== id))}>✕</button></li>)}</ul></>}
                {aE.length > 0 && <><h4>Excluir (exceção nos produtos escolhidos)</h4>{aE.map((x, k) => (
                  <div key={x.id} className="at-acoes" style={{ marginBottom: 6 }}><span style={{ minWidth: 160 }}>{rotAtr(x.id)}</span>
                    <input className="at-campo" style={{ flex: 1 }} placeholder="motivo (obrigatório)" aria-label={`Motivo para excluir ${rotAtr(x.id)}`} value={x.motivo} onChange={(e) => setAE(aE.map((y, j) => (j === k ? { ...y, motivo: e.target.value } : y)))} />
                    <button type="button" className="at-link" onClick={() => setAE(aE.filter((y) => y.id !== x.id))}>✕</button></div>))}</>}
              </div>
            </div>
          </section>)}
        {passo === 3 && previa && (
          <section className="at-painel">
            <div className="at-painel__cabeca"><h3>3. Prévia</h3>
              <div className="at-acoes"><Botao aoClicar={() => setPasso(2)}>Voltar</Botao><Botao primario trabalhando={trab} desligado={trab || !pedidoPrevia || pedidoPrevia !== intencao || aE.some((x) => x.motivo.trim().length < 3)} aoClicar={aplicar}>Confirmar e gravar</Botao></div></div>
            <div className="at-painel__corpo">
              <p className="at-previa-frase" role="status">{frase}</p>
              <div className="bl-rola-x"><table className="at-tabela">
                <thead><tr><th>Produto</th><th>Atributos antes</th><th>Depois</th><th>Acrescenta</th><th>Remove</th></tr></thead>
                <tbody>{previa.produtos.map((p) => <tr key={p.product_id}><td><CapsulaId id={p.product_id} flutuante={false} /> {p.nome}</td><td>{p.antes}</td><td>{p.depois}</td><td>{p.acrescenta ? <strong>+{p.acrescenta}</strong> : '—'}</td><td>{p.remove ? <span className="at-alerta">−{p.remove}</span> : '—'}</td></tr>)}</tbody>
              </table></div>
            </div>
          </section>)}
      </>)}
    </div>
  );
}

/** Matriz produtos × kits: onde cada kit se aplica e por quê (escopo, direto ou todos). */
function Matriz({ vit, kits, sel }: { vit: Vitrine; kits: KitResumo[]; sel: Set<number> }) {
  const m = useModulo();
  const [sub, setSub] = React.useState('');
  const prods = vit.produtos.filter((p) => p.ativo && (sel.size ? sel.has(p.id) : true) && (!sub || (p.subcategoria ?? '') === sub)).slice(0, 80);
  const subcats = [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort();
  const simb: Record<string, string> = { escopo: '●', direto: '◆', todos: '○' };
  return (
    <section className="at-painel">
      <CabecalhoTravado>      <div className="at-painel__cabeca"><h3>Matriz produtos × kits {sel.size ? <Etiqueta tom="verde">{sel.size} selecionado(s)</Etiqueta> : null}</h3>
        <div className="at-acoes"><select className="at-campo" aria-label="Subcategoria" value={sub} onChange={(e) => setSub(e.target.value)}><option value="">Todas as subcategorias</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}</select>
          <span className="at-fraco">● pela subcategoria · ◆ direto · ○ todos os produtos</span></div></div></CabecalhoTravado>
      <div className="bl-rola-x at-matriz">
        <table className="at-tabela">
          <thead><tr><th>Produto</th>{kits.map((k) => <th key={k.id} title={k.nome}><span className="at-matriz__kit">{k.nome}</span></th>)}</tr></thead>
          <tbody>{prods.map((p) => (
            <tr key={p.id}><td className="at-tabela__nome"><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(p.id)}>{p.id} · {p.nome}</button></td>
              {kits.map((k) => { const x = p.kits.find((y) => y.id === k.id); return <td key={k.id} className="at-matriz__cel" title={x ? x.motivos.join(', ') : ''}>{x ? x.motivos.map((mm) => simb[mm] ?? '•').join('') : ''}</td>; })}</tr>))}</tbody>
        </table>
        {prods.length === 0 && <p className="at-fraco" style={{ padding: 12 }}>Nenhum produto.</p>}
      </div>
    </section>);
}
