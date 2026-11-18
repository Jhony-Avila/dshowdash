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
    const semEssencial = (p: ProdutoResumo) => p.essencial.total === 0;
    out.sort((a, b) => (idQ !== null ? Number(b.id === idQ) - Number(a.id === idQ) : 0)
      || (f.ordem === 'id' ? a.id - b.id
        : f.ordem === 'preenchimento' ? (Number(semEssencial(a)) - Number(semEssencial(b))) || pct(a) - pct(b) || a.id - b.id   // UX-1: 0/0 vão para o fim
        : a.nome.localeCompare(b.nome, 'pt-BR')));
    return out;
  }, [dados, f]);

  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!dados) return <Carregando rotulo="Carregando produtos" />;
  const conta = (s: { produtos: number; ativos: number }) => (f.situacao === 'inativos' ? s.produtos - s.ativos : f.situacao === 'todos' ? s.produtos : s.ativos);
  const subcats = dados.facetas.filter((x) => (!f.categoria || x.categoria === f.categoria) && conta(x) > 0)
    .sort((a, b) => rotuloSubcategoria(a.subcategoria).localeCompare(rotuloSubcategoria(b.subcategoria), 'pt-BR'));
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  // UX-1: na ordem "menos preenchidos", os produtos sem essenciais (0/0) formam um grupo próprio no fim
  const grupoSemEssencial = (k: number) => f.ordem === 'preenchimento' && vis[k]?.essencial.total === 0 && (k === 0 ? (pagina === 0 || lista[pagina * POR_PAGINA - 1]?.essencial.total !== 0) : vis[k - 1].essencial.total !== 0);
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
        <span className="at-filtros__total">{lista.length} produto{lista.length === 1 ? '' : 's'} encontrado{lista.length === 1 ? '' : 's'}</span>
        {m.selecao.length > 0 && <span className="at-filtros__sel">{m.selecao.length} selecionado{m.selecao.length === 1 ? '' : 's'}</span>}
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
            {vis.map((p, k) => (<React.Fragment key={p.id}>
              {grupoSemEssencial(k) && <div className="at-grade__grupo" role="separator">Sem atributos essenciais definidos</div>}
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
              </article></React.Fragment>
            ))}
          </div>
        ) : (
          <div className="bl-cartao bl-rola-x">
            <table className="at-tabela">
              <thead><tr>
                {dados.pode_vincular && <th><span className="bl-so-leitor">Selecionar</span></th>}
                <th>ID e nome</th><th>Subcategoria</th><th>Kit específico</th><th>Essenciais (feitos/total)</th><th>Obrigatórios pendentes</th><th>Fotos</th><th>Precifica</th>
              </tr></thead>
              <tbody>
                {vis.map((p, k) => (<React.Fragment key={p.id}>
                  {grupoSemEssencial(k) && <tr className="at-tabela__grupo"><td colSpan={dados.pode_vincular ? 8 : 7}>Sem atributos essenciais definidos</td></tr>}
                  <tr key={p.id} className={`${p.ativo ? '' : 'at-linha--inativa'} ${sel.has(p.id) ? 'selecionada' : ''}`}>
                    {dados.pode_vincular && <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Selecionar ${p.nome}`} /></td>}
                    <td className="at-tabela__nome"><button type="button" className="at-link-produto" onClick={() => m.abrirProduto(p.id)}><CapsulaId id={p.id} flutuante={false} /> {p.nome}</button></td>
                    <td>{rotuloSubcategoria(p.subcategoria)}</td>
                    <td><div className="at-cartao__chips">{especificos(p).map((x) => <ChipKit key={x.id} nome={x.nome} pequeno />)}{p.kits_especificos === 0 && <span className="at-fraco">nenhum</span>}</div></td>
                    <td style={{ minWidth: 150 }}>{p.essencial.total === 0 ? <span className="at-fraco">0/0</span> : <Barra feitos={p.essencial.feitos} total={p.essencial.total} compacta />}</td>
                    <td>{p.obrigatorios_vazios || <span className="at-fraco">0</span>}</td>
                    <td>{p.fotos || <span className="at-alerta">0</span>}</td>
                    <td>{p.precifica.length ? p.precifica.map(tituloFamilia).join(', ') : <span className="at-fraco">—</span>}</td>
                  </tr></React.Fragment>))}
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
          <Botao primario aoClicar={() => m.ir('vincular', { selecao: m.selecao, intencao: 'kit' })}>Aplicar kit</Botao>
          <Botao aoClicar={() => m.ir('vincular', { selecao: m.selecao, intencao: 'atributo' })}>Adicionar atributo</Botao>
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
