// panel-atributos/src/screens/VincularMatriz.tsx — VINCULAR · MATRIZ V2 (ESQUERDA, 19/11; BRIEFING-MATRIZ-V2 + COMPARATIVO aprovado do Jhony).
// A Matriz que está no ar (e4ee5f48) volta, com a MESMA tipografia e densidade (medidas na 8113: tabela 12,5 px; produto 550; cabeçalho 11,5 px/600;
// célula com 7/10 px de respiro e linha de 35,3 px) e com: títulos dos kits centralizados sobre o conjunto de marcadores (até 2 linhas), seta que
// não desloca o título, ordenação (Produto pelo código; kit por "tem vínculo / não tem" com desempate pelo código), zebra suave recalculada na
// ordem exibida, marcadores Subcat. / Direto / Todos (cumulativos, ordem fixa; célula sem vínculo vazia) e a mesma aparência na legenda.
// TRAVAMENTO (padrão do Jhony): da barra verde até o cabeçalho da matriz — título, filtro e legenda no <CabecalhoTravado>; o cabeçalho da matriz
// gruda logo abaixo. Para a coluna Produto ficar fixa na rolagem HORIZONTAL sem prender o cabeçalho num contêiner com rolagem, cabeçalho e corpo
// são duas tabelas com as MESMAS larguras (table-layout: fixed + <colgroup>): o cabeçalho é sticky na página e acompanha o scrollLeft do corpo.
// Nada muda nos dados nem nas regras de origem; os marcadores não são botões. O clique no produto abre a ficha (como no ar).
import React from 'react';
import type { KitResumo, ProdutoResumo, Vitrine } from '../lib/tipos';
import { rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { CabecalhoTravado, Etiqueta } from '../ui/Comuns';
import { IconeOrdenacao } from '../ui/TabelaDados';
import {
  ariaSortMatriz, larguraKit, MARCADOR, ORDEM_INICIAL, ORDEM_ORIGENS, ordenarMatriz, origensDaCelula, produtosDaMatriz, proximaOrdem, rotuloOrdenar,
  textoOrigens, type ChaveMatriz, type Origem, type OrdemMatriz,
} from '../lib/matriz';
import './vincular-matriz.css';

const LARGURA_PRODUTO = 440;

function Marcador({ o }: { o: Origem }) {
  const m = MARCADOR[o];
  return <abbr className={`at-mx__m at-mx__m--${m.classe}`} title={m.titulo} aria-label={m.titulo} data-origem={o}>{m.texto}</abbr>;
}

/** O MESMO indicador da TabelaDados (↑ / ↓ na direção ativa, ↑↓ nas demais). */
function Seta({ ordem, chave }: { ordem: OrdemMatriz; chave: ChaveMatriz }) {
  return <span className="at-mx__seta"><IconeOrdenacao estado={ariaSortMatriz(ordem, chave)} /></span>;
}

export function VincularMatriz({ vit, kits, sel }: { vit: Vitrine; kits: KitResumo[]; sel: ReadonlySet<number> }) {
  const m = useModulo();
  const [sub, setSub] = React.useState('');
  const [ordem, setOrdem] = React.useState<OrdemMatriz>(ORDEM_INICIAL);
  const corpo = React.useRef<HTMLDivElement>(null); const cab = React.useRef<HTMLDivElement>(null);
  const filtrados = React.useMemo(() => produtosDaMatriz(vit.produtos, sel, sub), [vit.produtos, sel, sub]);
  const prods = React.useMemo(() => ordenarMatriz(filtrados, ordem), [filtrados, ordem]);
  const subcats = React.useMemo(() => [...new Set(vit.produtos.filter((p) => p.ativo).map((p) => p.subcategoria ?? ''))].sort(), [vit.produtos]);
  // larguras pelo conjunto ATIVO inteiro (não mudam ao filtrar/ordenar: a coluna não "pula")
  const larguras = React.useMemo(() => { const ativos = vit.produtos.filter((p) => p.ativo); return kits.map((k) => larguraKit(ativos, k.id)); }, [vit.produtos, kits]);
  const total = LARGURA_PRODUTO + larguras.reduce((s, w) => s + w, 0);
  const sincronizar = React.useCallback(() => { if (cab.current && corpo.current) cab.current.scrollLeft = corpo.current.scrollLeft; }, []);
  React.useLayoutEffect(sincronizar);
  const ordenar = (c: ChaveMatriz) => setOrdem((o) => proximaOrdem(o, c));
  const cols = <colgroup><col style={{ width: LARGURA_PRODUTO }} />{larguras.map((w, i) => <col key={kits[i].id} style={{ width: w }} />)}</colgroup>;
  const estiloTabela: React.CSSProperties = { width: `max(100%, ${total}px)` };

  return (
    <section className="at-painel at-mx at-matriz" data-matriz>{/* .at-matriz: o seletor que a trava da CIMA espera ("vincular-matriz") */}
      <CabecalhoTravado>
        <div className="at-mx__faixa">
          <h3>Matriz produtos × kits {sel.size ? <Etiqueta tom="verde">{sel.size} selecionado(s)</Etiqueta> : null}</h3>
          <span className="at-mx__espaco" />
          <select className="at-campo" aria-label="Subcategoria" value={sub} onChange={(e) => setSub(e.target.value)}>
            <option value="">Todas as subcategorias</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}
          </select>
          <ul className="at-mx__legenda" aria-label="Legenda das origens">
            {ORDEM_ORIGENS.map((o) => <li key={o}><Marcador o={o} /><span>{o === 'escopo' ? 'Pela subcategoria' : o === 'direto' ? 'Vínculo direto' : 'Todos os produtos'}</span></li>)}
          </ul>
        </div>
      </CabecalhoTravado>
      <div className="at-mx__cab" ref={cab} data-matriz-cabecalho>
        <table className="at-tabela at-mx__tabela" style={estiloTabela} aria-hidden="false">
          {cols}
          <thead><tr>
            <th scope="col" className="at-mx__col-produto" aria-sort={ariaSortMatriz(ordem, 'produto')} data-coluna="produto">
              <button type="button" className="at-mx__ordenar" onClick={() => ordenar('produto')} aria-label={rotuloOrdenar(ordem, 'produto')} title="Ordenar pelo código do produto">
                <span>Produto</span><Seta ordem={ordem} chave="produto" /></button></th>
            {kits.map((k) => { const c = `kit:${k.id}` as ChaveMatriz; return (
              <th key={k.id} scope="col" className="at-mx__col-kit" aria-sort={ariaSortMatriz(ordem, c)} data-coluna={c} title={k.nome}>
                <button type="button" className="at-mx__ordenar at-mx__ordenar--kit" onClick={() => ordenar(c)} aria-label={rotuloOrdenar(ordem, c, k.nome)}>
                  <span className="at-mx__kit">{k.nome}</span><Seta ordem={ordem} chave={c} /></button></th>); })}
          </tr></thead>
        </table>
      </div>
      <div className="at-mx__corpo" ref={corpo} onScroll={sincronizar} data-matriz-corpo>
        <table className="at-tabela at-mx__tabela" style={estiloTabela}>
          <caption className="bl-so-leitor">Matriz produtos × kits ({prods.length} produtos). Cabeçalho das colunas acima.</caption>
          {cols}
          <tbody>{prods.map((p: ProdutoResumo, i) => (
            <tr key={p.id} data-chave={p.id} className={i % 2 ? 'at-mx__linha--par' : undefined}>
              <th scope="row" className="at-mx__col-produto at-tabela__nome">
                <button type="button" className="at-link-produto at-mx__produto" onClick={() => m.abrirProduto(p.id)} title={`${p.id} · ${p.nome}`}>{p.id} · {p.nome}</button></th>
              {kits.map((k) => { const { origens, outras } = origensDaCelula(p, k.id); return (
                <td key={k.id} className="at-mx__cel" title={textoOrigens(p, k.id)} data-kit={k.id}>
                  {origens.length + outras.length > 0 && <span className="at-mx__marcadores">{origens.map((o) => <Marcador key={o} o={o} />)}
                    {outras.map((x) => <span key={x} className="at-mx__m at-mx__m--todos" title={x}>{x}</span>)}</span>}
                </td>); })}
            </tr>))}</tbody>
        </table>
        {prods.length === 0 && <p className="at-fraco" style={{ padding: 12 }}>Nenhum produto.</p>}
      </div>
    </section>);
}
