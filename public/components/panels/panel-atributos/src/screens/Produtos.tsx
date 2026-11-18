// panel-atributos/src/screens/Produtos.tsx — lista de produtos (§11.2): grade de cartões e tabela; busca por nome ou ID (exato primeiro;
// 0611 = 611); filtros; ordenação; paginação; seleção múltipla com ações que levam a Vincular/Preencher.
import React from 'react';
import type { ProdutoResumo, Vitrine } from '../lib/tipos';
import { obter } from '../lib/api';
import { casaBusca, pctDe } from '../lib/formatar';
import { rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Barra, CapsulaId, ChipKit, Carregando, Erro, Etiqueta, Foto, Vazio, Botao } from '../ui/Comuns';

const POR_PAGINA = 48;
type Ordem = 'nome' | 'id' | 'preenchimento';

export function Produtos() {
  const m = useModulo();
  const [dados, setDados] = React.useState<Vitrine | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ busca: m.filtroInicial.busca ?? '', categoria: '', subcategoria: m.filtroInicial.subcategoria ?? '', kit: m.filtroInicial.kit ?? '', situacao: 'ativos',
    semFoto: !!m.filtroInicial.semFoto, semKit: !!m.filtroInicial.semKit, obrigatorios: !!m.filtroInicial.obrigatoriosVazios, fora: !!m.filtroInicial.foraDaFicha,
    precifica: !!m.filtroInicial.comPrecifica, ordem: 'nome' as Ordem, modo: 'grade' as 'grade' | 'tabela' });
  const [pagina, setPagina] = React.useState(0);
  const sel = React.useMemo(() => new Set(m.selecao), [m.selecao]);

  const carregar = React.useCallback(() => {
    setErro(null);
    obter<Vitrine>('vitrine').then(setDados).catch((e) => setErro(e.message));
  }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  React.useEffect(() => setPagina(0), [f]);

  const lista = React.useMemo(() => {
    if (!dados) return [];
    const q = f.busca.trim(); const idQ = /^\d+$/.test(q) ? Number(q.replace(/^0+(?=\d)/, '')) : null;
    const out = dados.produtos.filter((p) => (f.situacao === 'todos' || (f.situacao === 'ativos') === p.ativo)
      && (!f.categoria || p.categoria === f.categoria) && (!f.subcategoria || (p.subcategoria ?? '') === f.subcategoria)
      && (!f.kit || p.kits.some((k) => String(k.id) === f.kit)) && (!f.semFoto || p.fotos === 0) && (!f.semKit || p.kits_especificos === 0)
      && (!f.obrigatorios || p.obrigatorios_vazios > 0) && (!f.fora || p.fora_da_ficha > 0) && (!f.precifica || p.precifica.length > 0)
      && casaBusca(q, p.id, p.nome));
    const pct = (p: ProdutoResumo) => pctDe(p.essencial) ?? -1;
    out.sort((a, b) => (idQ !== null ? Number(b.id === idQ) - Number(a.id === idQ) : 0)
      || (f.ordem === 'id' ? a.id - b.id : f.ordem === 'preenchimento' ? pct(a) - pct(b) || a.id - b.id : a.nome.localeCompare(b.nome, 'pt-BR')));
    return out;
  }, [dados, f]);

  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!dados) return <Carregando rotulo="Carregando produtos" />;
  const conta = (s: { produtos: number; ativos: number }) => (f.situacao === 'inativos' ? s.produtos - s.ativos : f.situacao === 'todos' ? s.produtos : s.ativos);
  const subcats = dados.facetas.filter((x) => (!f.categoria || x.categoria === f.categoria) && conta(x) > 0)
    .sort((a, b) => rotuloSubcategoria(a.subcategoria).localeCompare(rotuloSubcategoria(b.subcategoria), 'pt-BR'));
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const vis = lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const alternar = (id: number) => m.setSelecao(sel.has(id) ? m.selecao.filter((x) => x !== id) : [...m.selecao, id]);
  const marcarPagina = () => { const ids = vis.map((p) => p.id); const todos = ids.every((i) => sel.has(i)); m.setSelecao(todos ? m.selecao.filter((x) => !ids.includes(x)) : [...new Set([...m.selecao, ...ids])]); };
  type Chave = 'semFoto' | 'semKit' | 'obrigatorios' | 'fora' | 'precifica';
  const chip = (k: Chave, rot: string, dica?: string) => (
    <button type="button" className={`at-filtro ${f[k] ? 'at-filtro--ativo' : ''}`} aria-pressed={f[k]} title={dica} onClick={() => setF({ ...f, [k]: !f[k] })}>{rot}</button>);
  // UX-1: filtros além da busca (a busca sozinha sem resultado não oferece "todo o catálogo": já é a busca em tudo o que está visível)
  const filtrosAlemDaBusca = !!(f.categoria || f.subcategoria || f.kit || f.semFoto || f.semKit || f.obrigatorios || f.fora || f.precifica || f.situacao !== 'ativos');
  const buscarEmTudo = () => setF({ ...f, categoria: '', subcategoria: '', kit: '', situacao: 'todos', semFoto: false, semKit: false, obrigatorios: false, fora: false, precifica: false });
  const algumFiltro = f.busca || f.categoria || f.subcategoria || f.kit || f.semFoto || f.semKit || f.obrigatorios || f.fora || f.precifica || f.situacao !== 'ativos';
  const especificos = (p: ProdutoResumo) => p.kits.filter((k) => !k.motivos.includes('todos'));

  return (
    <div className="at-produtos">
      <div className="at-titulo-tela">
        <div><h2>Produtos</h2><p>Busque pelo nome ou código. Clique no produto para abrir a ficha.</p></div>
      </div>
      <div className="at-barra-ferramentas">
        <label className="at-busca">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={f.busca} placeholder="Buscar por nome ou ID (ex.: 154)" aria-label="Buscar produto por nome ou ID" onChange={(e) => setF({ ...f, busca: e.target.value })} />
        </label>
        <select className="at-select" aria-label="Categoria" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value, subcategoria: '' })}>
          <option value="">Todas as categorias</option>
          {[...new Set(dados.facetas.map((x) => x.categoria))].map((c) => <option key={c} value={c}>{rotuloCategoria(c)}</option>)}
        </select>
        <select className="at-select" aria-label="Subcategoria" value={f.subcategoria} onChange={(e) => setF({ ...f, subcategoria: e.target.value })}>
          <option value="">Todas as subcategorias</option>
          {subcats.map((s) => <option key={`${s.categoria}|${s.subcategoria}`} value={s.subcategoria ?? ''}>{rotuloSubcategoria(s.subcategoria)} ({conta(s)})</option>)}
        </select>
        <select className="at-select" aria-label="Kit" value={f.kit} onChange={(e) => setF({ ...f, kit: e.target.value })}>
          <option value="">Qualquer kit</option>
          {dados.kits.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}
        </select>
        <select className="at-select" aria-label="Situação" value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value })}>
          <option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Ativos e inativos</option>
        </select>
        <select className="at-select" aria-label="Ordenar por" value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value as Ordem })}>
          <option value="nome">Ordenar: nome</option><option value="id">Ordenar: ID</option><option value="preenchimento">Ordenar: menos preenchidos</option>
        </select>
        <div className="at-alternador" role="group" aria-label="Modo de exibição">
          <button type="button" className={f.modo === 'grade' ? 'ativo' : ''} aria-pressed={f.modo === 'grade'} onClick={() => setF({ ...f, modo: 'grade' })}>Grade</button>
          <button type="button" className={f.modo === 'tabela' ? 'ativo' : ''} aria-pressed={f.modo === 'tabela'} onClick={() => setF({ ...f, modo: 'tabela' })}>Tabela</button>
        </div>
      </div>
      <div className="at-filtros">
        {chip('semFoto', 'Sem foto')}{chip('semKit', 'Sem kit', 'Produtos que só têm o kit Base (todos os produtos): nenhum kit específico')}{chip('obrigatorios', 'Com obrigatórios vazios')}{chip('fora', 'Com valores fora da ficha')}{chip('precifica', 'Com ficha do Precifica')}
        <span className="at-filtros__total">{lista.length} produto{lista.length === 1 ? '' : 's'}</span>
        {algumFiltro && <button type="button" className="bl-botao" onClick={() => setF({ ...f, busca: '', categoria: '', subcategoria: '', kit: '', situacao: 'ativos', semFoto: false, semKit: false, obrigatorios: false, fora: false, precifica: false })}>Limpar filtros</button>}
        {dados.pode_vincular && vis.length > 0 && <button type="button" className="bl-botao" onClick={marcarPagina}>{vis.every((p) => sel.has(p.id)) ? 'Desmarcar a página' : 'Selecionar a página'}</button>}
      </div>

      {lista.length === 0 ? (filtrosAlemDaBusca
          ? <Vazio titulo="Nenhum produto encontrado com estes filtros.">
              {f.busca.trim()
                ? <><Botao primario aoClicar={buscarEmTudo}>{`Buscar ‘${f.busca.trim()}’ em todo o catálogo`}</Botao><span className="at-fraco"> inclui produtos inativos; tira os outros filtros e mantém o termo</span></>
                : 'Ajuste ou limpe os filtros.'}
            </Vazio>
          : <Vazio titulo="Nenhum produto encontrado">{f.situacao === 'todos' ? 'Nenhum produto, ativo ou inativo, tem este nome ou código.' : 'Ajuste a busca.'}</Vazio>)
        : f.modo === 'grade' ? (
          <div className="at-grade">
            {vis.map((p) => (
              <article key={p.id} className={`at-cartao ${p.ativo ? '' : 'at-cartao--inativo'} ${sel.has(p.id) ? 'at-cartao--sel' : ''}`}>
                <button type="button" className="at-cartao__abrir" onClick={() => m.abrirProduto(p.id)} aria-label={`Abrir ficha: ${p.nome}`}>
                  <Foto mediaId={p.capa_id} cor={p.capa_cor} idCapsula={p.id} />
                  <div className="at-cartao__corpo">
                    <div className="at-cartao__classe">{rotuloSubcategoria(p.subcategoria)}</div>
                    <div className="at-cartao__nome" title={p.nome}>{p.nome}</div>
                    <div className="at-cartao__chips">
                      {especificos(p).slice(0, 2).map((k) => <ChipKit key={k.id} nome={k.nome} pequeno />)}
                      {especificos(p).length > 2 && <Etiqueta>+{especificos(p).length - 2}</Etiqueta>}
                      {p.kits_especificos === 0 && <KitBase />}
                      {!p.ativo && <Etiqueta tom="aviso">Inativo</Etiqueta>}
                    </div>
                    <Barra feitos={p.essencial.feitos} total={p.essencial.total} compacta />
                  </div>
                </button>
                {dados.pode_vincular && <label className="at-cartao__marcar"><input type="checkbox" checked={sel.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Selecionar ${p.nome}`} />{sel.has(p.id) ? 'Selecionado' : 'Selecionar'}</label>}
              </article>
            ))}
          </div>
        ) : (
          <div className="bl-cartao bl-rola-x">
            <table className="at-tabela">
              <thead><tr>
                {dados.pode_vincular && <th><span className="bl-so-leitor">Selecionar</span></th>}
                <th>ID</th><th>Produto</th><th>Subcategoria</th><th>Kits</th><th>Fotos</th><th>Precifica</th><th>Essencial</th><th>Obrig. vazios</th>
              </tr></thead>
              <tbody>
                {vis.map((p) => (
                  <tr key={p.id} className={`${p.ativo ? '' : 'at-linha--inativa'} ${sel.has(p.id) ? 'selecionada' : ''}`}>
                    {dados.pode_vincular && <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Selecionar ${p.nome}`} /></td>}
                    <td><CapsulaId id={p.id} flutuante={false} /></td>
                    <td className="at-tabela__nome"><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(p.id)}>{p.nome}</button></td>
                    <td>{rotuloSubcategoria(p.subcategoria)}</td>
                    <td><div className="at-cartao__chips">{especificos(p).map((k) => <ChipKit key={k.id} nome={k.nome} pequeno />)}{p.kits_especificos === 0 && <KitBase />}</div></td>
                    <td>{p.fotos || <span className="at-alerta">0</span>}</td>
                    <td>{p.precifica.length ? p.precifica.map(tituloFamilia).join(', ') : <span className="at-fraco">—</span>}</td>
                    <td style={{ minWidth: 150 }}><Barra feitos={p.essencial.feitos} total={p.essencial.total} compacta /></td>
                    <td>{p.obrigatorios_vazios || <span className="at-fraco">0</span>}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        )}
      {paginas > 1 && (
        <nav className="at-paginas" aria-label="Páginas">
          <button type="button" className="bl-botao" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina + 1} de {paginas}</span>
          <button type="button" className="bl-botao" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </nav>)}
      {m.selecao.length > 0 && (
        <div className="at-barra-selecao" role="region" aria-label="Ações para os produtos selecionados">
          <strong>{m.selecao.length} selecionado{m.selecao.length === 1 ? '' : 's'}</strong>
          <Botao primario aoClicar={() => m.ir('vincular', { selecao: m.selecao })}>Aplicar kit</Botao>
          <Botao aoClicar={() => m.ir('vincular', { selecao: m.selecao })}>Adicionar atributo</Botao>
          <Botao aoClicar={() => m.ir('preencher', { selecao: m.selecao, preencher: {} })}>Abrir na grade</Botao>
          <Botao aoClicar={() => m.setSelecao([])}>Limpar seleção</Botao>
        </div>)}
    </div>
  );
}

/** Produto só com o kit Base (vale para todos): chip discreto, não alerta. "Sem kit" = nenhum kit além do Base (feedback do Jhony, 18/11). */
function KitBase() {
  return <span className="at-chip at-chip--p at-chip--base" title="Só o kit Base (todos os produtos): nenhum kit específico ainda">Base</span>;
}
