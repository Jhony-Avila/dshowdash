// panel-atributos/src/screens/Conferencia.tsx — conferência (§11.9): filas com ação direta. 1 legado (inclui D5 Profundidade × Comprimento),
// 2 sugestões do nome, 3 valores fora da ficha, 4 obrigatórios vazios, 5 produtos sem kit.
import React from 'react';
import type { Conferencia as TConf, ItemConferencia, KitResumo } from '../lib/tipos';
import { enviar, ErroApi, obter } from '../lib/api';
import { decimal } from '../lib/formatar';
import { FONTE_SUGESTAO, rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, CapsulaId, Carregando, Dialogo, Erro, Etiqueta, Vazio } from '../ui/Comuns';

type Fila = 'legado' | 'nome' | 'fora_da_ficha' | 'obrigatorios_vazios' | 'sem_kit';
const FILAS: { id: Fila; rotulo: string; desc: string }[] = [
  { id: 'legado', rotulo: 'Legado (decisões)', desc: 'Valores do legado de 2025 que dependem de decisão, como Profundidade × Comprimento dos cabos (D5).' },
  { id: 'nome', rotulo: 'Sugestões do nome', desc: 'Tiradas do nome do produto (largura, altura, pitch, taxa, tipo de LED). Nunca viram valor sem aceite.' },
  { id: 'fora_da_ficha', rotulo: 'Fora da ficha', desc: 'Há valor gravado, mas o atributo não está vinculado ao produto.' },
  { id: 'obrigatorios_vazios', rotulo: 'Obrigatórios vazios', desc: 'Atributos obrigatórios sem valor em produtos ativos.' },
  { id: 'sem_kit', rotulo: 'Sem kit', desc: 'Produtos ativos que só têm o kit geral.' },
];
const valorTxt = (v: string | null) => (v && /^-?\d+(\.\d+)?$/.test(v) ? decimal(v) : v ?? '—');

export function Conferencia() {
  const m = useModulo();
  const [d, setD] = React.useState<TConf | null>(null);
  const [kits, setKits] = React.useState<KitResumo[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);
  const [fila, setFila] = React.useState<Fila>('legado');
  const [filtroAtr, setFiltroAtr] = React.useState('');
  const [lote, setLote] = React.useState<number[] | null>(null);
  const [trab, setTrab] = React.useState<number | null>(null);
  const carregar = React.useCallback(() => { setErro(null); obter<TConf>('conferencia').then(setD).catch((e) => setErro(e.message)); obter<{ kits: KitResumo[] }>('kits').then((k) => setKits(k.kits.filter((x) => x.ativo && x.itens > 0 && !x.aplica_a_todos))).catch(() => undefined); }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!d) return <Carregando rotulo="Montando as filas de conferência" />;
  const total = (f: Fila) => (f === 'obrigatorios_vazios' ? d.totais.obrigatorios_vazios : d.filas[f].length);
  const decidir = async (it: ItemConferencia, decisao: 'aceitar' | 'recusar', destino?: number) => {
    setTrab(it.id);
    try { await enviar('sugestao', { id: it.id, versao: it.versao, decisao, ...(destino ? { atributo_id: destino, vincular: true } : {}) }); m.aviso(decisao === 'aceitar' ? 'Decidido: valor gravado.' : 'Sugestão recusada.'); carregar(); }
    catch (e) { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); } finally { setTrab(null); }
  };
  const aceitarLote = async () => {
    if (!lote) return;
    try { const r = await enviar<{ aceitas: number; falhas: unknown[] }>('sugestoes_lote', { ids: lote.slice(0, 200), confirmar: true }); m.aviso(`${r.aceitas} aceitas${r.falhas.length ? `, ${r.falhas.length} com erro` : ''}.`); setLote(null); carregar(); }
    catch (e) { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); }
  };
  const atual = FILAS.find((x) => x.id === fila)!;
  const sugs = (fila === 'legado' || fila === 'nome') ? d.filas[fila].filter((x) => !filtroAtr || x.atributo === filtroAtr) : [];
  const atrs = (fila === 'legado' || fila === 'nome') ? [...new Set(d.filas[fila].map((x) => x.atributo ?? ''))].sort() : [];

  return (
    <div className="at-conferencia">
      <div className="at-titulo-tela"><div><h2>Conferência</h2><p>Filas com ação direta. Nada vira valor sem decisão; cada decisão fica no histórico do produto.</p></div></div>
      <div className="at-abas" role="tablist" aria-label="Filas">
        {FILAS.map((x) => <button key={x.id} type="button" role="tab" aria-selected={fila === x.id} className={fila === x.id ? 'ativo' : ''} onClick={() => { setFila(x.id); setFiltroAtr(''); }}>{x.rotulo} <span className="at-filtro__n">{total(x.id)}</span></button>)}
      </div>
      <section className="at-painel">
        <div className="at-painel__cabeca"><span className="at-fraco">{atual.desc}</span>
          {(fila === 'legado' || fila === 'nome') && <div className="at-acoes">
            <select className="at-campo" aria-label="Filtrar por atributo" value={filtroAtr} onChange={(e) => setFiltroAtr(e.target.value)}><option value="">Todos os atributos</option>{atrs.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            {fila === 'nome' && d.pode_decidir && sugs.length > 0 && <Botao aoClicar={() => setLote(sugs.map((x) => x.id))}>Aceitar as {Math.min(sugs.length, 200)} visíveis…</Botao>}
          </div>}
        </div>
        {(fila === 'legado' || fila === 'nome') && (sugs.length === 0 ? <div className="at-painel__corpo"><Vazio titulo="Fila vazia">Nada pendente aqui.</Vazio></div> : (
          <div className="bl-rola-x"><table className="at-tabela">
            <thead><tr><th>Produto</th><th>Atributo</th><th>Proposto</th><th>Evidência</th><th>Decisão</th></tr></thead>
            <tbody>{sugs.slice(0, 300).map((it) => (
              <tr key={it.id}>
                <td><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(it.product_id)}><CapsulaId id={it.product_id} flutuante={false} /> {it.produto}</button></td>
                <td>{it.atributo}{it.atributo_alternativo && <div className="at-fraco">ou {it.atributo_alternativo}?</div>}</td>
                <td><strong>{valorTxt(it.valor_proposto)}</strong> {it.unidade ?? ''} <Etiqueta>{FONTE_SUGESTAO[it.fonte]}</Etiqueta></td>
                <td className="at-conf__evid" title={it.evidencia ?? ''}>{it.evidencia}</td>
                <td>{d.pode_decidir ? (
                  <div className="at-acoes">
                    {it.atributo_alternativo_id ? <>
                      <Botao trabalhando={trab === it.id} aoClicar={() => decidir(it, 'aceitar', it.atributo_id)}>Gravar em {it.atributo}</Botao>
                      <Botao primario trabalhando={trab === it.id} aoClicar={() => decidir(it, 'aceitar', it.atributo_alternativo_id!)}>Gravar em {it.atributo_alternativo}</Botao>
                    </> : <Botao primario trabalhando={trab === it.id} aoClicar={() => decidir(it, 'aceitar')}>Aceitar</Botao>}
                    <Botao trabalhando={trab === it.id} aoClicar={() => decidir(it, 'recusar')}>Recusar</Botao>
                  </div>) : <span className="at-fraco">só leitura</span>}</td>
              </tr>))}</tbody>
          </table></div>))}
        {fila === 'fora_da_ficha' && (d.filas.fora_da_ficha.length === 0 ? <div className="at-painel__corpo"><Vazio titulo="Nada fora da ficha" /></div> : (
          <div className="bl-rola-x"><table className="at-tabela">
            <thead><tr><th>Produto</th><th>Atributo com valor</th><th>Ação</th></tr></thead>
            <tbody>{d.filas.fora_da_ficha.slice(0, 400).map((x) => (
              <tr key={`${x.product_id}-${x.atributo_id}`}>
                <td><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(x.product_id)}><CapsulaId id={x.product_id} flutuante={false} /> {x.produto}</button></td>
                <td>{x.atributo}</td>
                <td><div className="at-acoes">{d.pode_decidir && <Botao aoClicar={() => enviar('produto_atributo', { product_id: x.product_id, atributo_id: x.atributo_id, modo: 'incluir' }).then(() => { m.aviso('Vinculado a este produto.'); carregar(); }).catch((e) => m.aviso(e.message, 'erro'))}>Vincular a este produto</Botao>}
                  <button type="button" className="at-link" onClick={() => m.abrirProduto(x.product_id)}>abrir ficha</button></div></td>
              </tr>))}</tbody>
          </table></div>))}
        {fila === 'obrigatorios_vazios' && (d.filas.obrigatorios_vazios.length === 0 ? <div className="at-painel__corpo"><Vazio titulo="Nenhum obrigatório vazio" /></div> : (
          <div className="bl-rola-x"><table className="at-tabela">
            <thead><tr><th>Produto</th><th>Obrigatório vazio</th><th /></tr></thead>
            <tbody>{d.filas.obrigatorios_vazios.slice(0, 400).map((x) => (
              <tr key={`${x.product_id}-${x.atributo_id}`}><td><CapsulaId id={x.product_id} flutuante={false} /> {x.produto}</td><td>{x.atributo}</td><td><button type="button" className="at-link" onClick={() => m.abrirProduto(x.product_id)}>preencher na ficha</button></td></tr>))}</tbody>
          </table>{d.totais.obrigatorios_vazios > 400 && <p className="at-fraco" style={{ padding: 12 }}>Mostrando 400 de {d.totais.obrigatorios_vazios}. Use a grade (Preencher) para resolver em massa.</p>}</div>))}
        {fila === 'sem_kit' && (d.filas.sem_kit.length === 0 ? <div className="at-painel__corpo"><Vazio titulo="Todos os produtos têm kit" /></div> : (
          <div className="bl-rola-x"><table className="at-tabela">
            <thead><tr><th>Produto</th><th>Subcategoria</th><th>Kit no legado</th><th>Aplicar kit</th></tr></thead>
            <tbody>{d.filas.sem_kit.map((x) => (
              <tr key={x.product_id}><td><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(x.product_id)}><CapsulaId id={x.product_id} flutuante={false} /> {x.produto}</button></td>
                <td>{rotuloSubcategoria(x.subcategoria)}</td><td>{x.legado ?? '—'}</td>
                <td>{d.pode_decidir ? <select className="at-campo" aria-label={`Aplicar kit em ${x.produto}`} value="" onChange={(e) => { const g = Number(e.target.value); if (g) enviar('produto_kit', { product_id: x.product_id, grupo_id: g, ativo: 1 }).then(() => { m.aviso('Kit aplicado.'); carregar(); }).catch((er) => m.aviso(er.message, 'erro')); }}>
                  <option value="">Escolha um kit…</option>{kits.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}</select> : '—'}</td></tr>))}</tbody>
          </table></div>))}
      </section>
      <Dialogo titulo="Aceitar sugestões em lote?" aberto={lote !== null} aoFechar={() => setLote(null)}
        rodape={<><Botao aoClicar={() => setLote(null)}>Cancelar</Botao><Botao primario aoClicar={aceitarLote}>Aceitar {Math.min(lote?.length ?? 0, 200)}</Botao></>}>
        <p>Cada sugestão vira valor do produto, com histórico ("sugestão #id"). Só atinge campos sem valor; nada cadastrado à mão é sobrescrito.</p>
      </Dialogo>
    </div>);
}
