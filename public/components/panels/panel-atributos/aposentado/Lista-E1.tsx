// panel-atributos/src/screens/Lista.tsx — lista de produtos: grade de cartões (linguagem do app iOS) e modo tabela; busca e filtros.
import React from 'react';
import type { ProdutoVitrine, Vitrine } from '../lib/tipos';
import { rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { casaBusca, pct } from '../lib/formatar';
import { BarraPreenchimento, CapsulaId, ChipKit, Etiqueta, Foto } from '../ui/Comuns';
import { EstadoVazio } from '@shared';

export interface FiltrosLista {
  busca: string; modo: 'grade' | 'tabela'; categoria: string; subcategoria: string; kit: string;
  semFoto: boolean; semPreenchido: boolean; comPrecifica: boolean; inativos: boolean;
  ordem: 'id' | 'nome' | 'preenchimento' | 'subcategoria'; direcao: 'asc' | 'desc';
}
export const FILTROS_INICIAIS: FiltrosLista = { busca: '', modo: 'grade', categoria: '', subcategoria: '', kit: '', semFoto: false, semPreenchido: false, comPrecifica: false, inativos: false, ordem: 'id', direcao: 'asc' };

function aplicar(ps: ProdutoVitrine[], f: FiltrosLista): ProdutoVitrine[] {
  const out = ps.filter((p) => (f.inativos || p.ativo)
    && (!f.categoria || p.categoria === f.categoria) && (!f.subcategoria || (p.subcategoria ?? '') === f.subcategoria)
    && (!f.kit || (f.kit === '__sem' ? !p.legado : p.legado?.kit === f.kit))
    && (!f.semFoto || p.fotos === 0) && (!f.semPreenchido || p.preenchidos === 0) && (!f.comPrecifica || p.precifica.length > 0)
    && casaBusca(f.busca, p.id, p.nome));
  const s = f.direcao === 'asc' ? 1 : -1;
  const chave = (p: ProdutoVitrine): [number | string, number] => f.ordem === 'nome' ? [p.nome.toLowerCase(), p.id] : f.ordem === 'preenchimento' ? [pct(p.preenchidos, p.universo) * 1000 + p.universo, p.id]
    : f.ordem === 'subcategoria' ? [rotuloSubcategoria(p.subcategoria), p.id] : [p.id, 0];
  return out.sort((a, b) => { const [x1, x2] = chave(a), [y1, y2] = chave(b); return (x1 < y1 ? -1 : x1 > y1 ? 1 : x2 - y2) * s; });
}

function Interruptor({ ativo, rotulo, contagem, aoMudar }: { ativo: boolean; rotulo: string; contagem: number; aoMudar: (v: boolean) => void }) {
  return (
    <button type="button" className={`at-filtro ${ativo ? 'at-filtro--ativo' : ''}`} aria-pressed={ativo} onClick={() => aoMudar(!ativo)}>
      {rotulo}<span className="at-filtro__n">{contagem}</span>
    </button>
  );
}

export function Lista({ dados, filtros, aoMudar, aoAbrir }: { dados: Vitrine; filtros: FiltrosLista; aoMudar: (p: Partial<FiltrosLista>) => void; aoAbrir: (id: number) => void }) {
  const base = React.useMemo(() => dados.produtos.filter((p) => filtros.inativos || p.ativo), [dados, filtros.inativos]);
  const lista = React.useMemo(() => aplicar(dados.produtos, filtros), [dados, filtros]);
  const subcats = React.useMemo(() => dados.facetas.filter((x) => !filtros.categoria || x.categoria === filtros.categoria)
    .map((x) => ({ v: x.subcategoria ?? '', n: filtros.inativos ? x.produtos : x.ativos })).filter((x) => x.n > 0)
    .sort((a, b) => rotuloSubcategoria(a.v).localeCompare(rotuloSubcategoria(b.v), 'pt-BR')), [dados, filtros.categoria, filtros.inativos]);
  const filtroAtivo = !!(filtros.busca || filtros.categoria || filtros.subcategoria || filtros.kit || filtros.semFoto || filtros.semPreenchido || filtros.comPrecifica);
  const k = { total: base.length, semFoto: base.filter((p) => p.fotos === 0).length, comPrecifica: base.filter((p) => p.precifica.length).length,
    semPreenchido: base.filter((p) => p.preenchidos === 0).length, comLegado: base.filter((p) => p.legado).length };

  return (
    <div className="at-lista">
      <div className="at-resumo">
        <div className="at-resumo__item"><strong>{k.total}</strong><span>produtos {filtros.inativos ? '' : 'ativos'}</span></div>
        <div className="at-resumo__item"><strong>{k.comLegado}</strong><span>com atribuição no legado</span></div>
        <div className="at-resumo__item"><strong>{k.comPrecifica}</strong><span>com ficha do Precifica</span></div>
        <div className="at-resumo__item at-resumo__item--aviso"><strong>{k.semPreenchido}</strong><span>sem atributo preenchido</span></div>
        <div className="at-resumo__item at-resumo__item--aviso"><strong>{k.semFoto}</strong><span>sem foto</span></div>
      </div>

      <div className="at-barra-ferramentas">
        <label className="at-busca">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={filtros.busca} placeholder="Buscar por nome ou ID (ex.: 154)" aria-label="Buscar produto por nome ou ID"
            onChange={(e) => aoMudar({ busca: e.target.value })} />
        </label>
        <select className="at-select" value={filtros.categoria} aria-label="Categoria" onChange={(e) => aoMudar({ categoria: e.target.value, subcategoria: '' })}>
          <option value="">Todas as categorias</option>
          {[...new Set(dados.facetas.map((x) => x.categoria))].map((c) => <option key={c} value={c}>{rotuloCategoria(c)}</option>)}
        </select>
        <select className="at-select" value={filtros.subcategoria} aria-label="Subcategoria" onChange={(e) => aoMudar({ subcategoria: e.target.value })}>
          <option value="">Todas as subcategorias</option>
          {subcats.map((s) => <option key={s.v} value={s.v}>{rotuloSubcategoria(s.v || null)} ({s.n})</option>)}
        </select>
        <select className="at-select" value={filtros.kit} aria-label="Kit do legado" onChange={(e) => aoMudar({ kit: e.target.value })}>
          <option value="">Qualquer kit do legado</option>
          {dados.kits.map((x) => <option key={x.codigo} value={x.codigo}>Kit {x.nome}</option>)}
          <option value="__sem">Sem legado</option>
        </select>
        <div className="at-alternador" role="group" aria-label="Modo de exibição">
          <button type="button" className={filtros.modo === 'grade' ? 'ativo' : ''} aria-pressed={filtros.modo === 'grade'} onClick={() => aoMudar({ modo: 'grade' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>Grade</button>
          <button type="button" className={filtros.modo === 'tabela' ? 'ativo' : ''} aria-pressed={filtros.modo === 'tabela'} onClick={() => aoMudar({ modo: 'tabela' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>Tabela</button>
        </div>
      </div>
      <div className="at-filtros">
        <Interruptor ativo={filtros.semFoto} rotulo="Sem foto" contagem={k.semFoto} aoMudar={(v) => aoMudar({ semFoto: v })} />
        <Interruptor ativo={filtros.semPreenchido} rotulo="Sem atributo preenchido" contagem={k.semPreenchido} aoMudar={(v) => aoMudar({ semPreenchido: v })} />
        <Interruptor ativo={filtros.comPrecifica} rotulo="Com ficha do Precifica" contagem={k.comPrecifica} aoMudar={(v) => aoMudar({ comPrecifica: v })} />
        <Interruptor ativo={filtros.inativos} rotulo="Incluir inativos" contagem={dados.produtos.length - dados.produtos.filter((p) => p.ativo).length} aoMudar={(v) => aoMudar({ inativos: v })} />
        <span className="at-filtros__total">{lista.length} de {base.length}</span>
        {filtroAtivo && <button type="button" className="bl-botao" onClick={() => aoMudar({ ...FILTROS_INICIAIS, modo: filtros.modo, inativos: filtros.inativos })}>Limpar filtros</button>}
      </div>

      {lista.length === 0 ? (
        <div className="bl-cartao"><EstadoVazio titulo="Nenhum produto encontrado" descricao="Ajuste a busca ou os filtros." filtroAtivo={filtroAtivo} /></div>
      ) : filtros.modo === 'grade' ? (
        <div className="at-grade">
          {lista.map((p) => (
            <button key={p.id} type="button" className={`at-cartao ${p.ativo ? '' : 'at-cartao--inativo'}`} onClick={() => aoAbrir(p.id)} aria-label={`Abrir ficha: ${p.nome}`}>
              <Foto cor={p.capa_cor} temFoto={p.fotos > 0} idCapsula={p.id} />
              <div className="at-cartao__corpo">
                <div className="at-cartao__classe">{rotuloSubcategoria(p.subcategoria)}</div>
                <div className="at-cartao__nome">{p.nome}</div>
                <div className="at-cartao__chips">
                  {p.legado && <ChipKit nome={p.legado.kit_nome} />}
                  {p.precifica.length > 0 && <Etiqueta tom="info" titulo={p.precifica.map(tituloFamilia).join(', ')}>Precifica</Etiqueta>}
                  {!p.ativo && <Etiqueta tom="aviso">Inativo</Etiqueta>}
                  {p.fotos > 1 && <Etiqueta>{p.fotos} fotos</Etiqueta>}
                </div>
                <BarraPreenchimento preenchidos={p.preenchidos} universo={p.universo} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bl-cartao bl-rola-x">
          <table className="at-tabela">
            <thead><tr>
              {([['id', 'ID'], ['nome', 'Produto'], ['subcategoria', 'Subcategoria']] as const).map(([c, r]) => (
                <th key={c} aria-sort={filtros.ordem === c ? (filtros.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => aoMudar({ ordem: c, direcao: filtros.ordem === c && filtros.direcao === 'asc' ? 'desc' : 'asc' })}>{r}{filtros.ordem === c ? (filtros.direcao === 'asc' ? ' ↑' : ' ↓') : ''}</button>
                </th>))}
              <th>Kit do legado</th><th>Fotos</th><th>Precifica</th>
              <th aria-sort={filtros.ordem === 'preenchimento' ? (filtros.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => aoMudar({ ordem: 'preenchimento', direcao: filtros.ordem === 'preenchimento' && filtros.direcao === 'asc' ? 'desc' : 'asc' })}>Preenchimento{filtros.ordem === 'preenchimento' ? (filtros.direcao === 'asc' ? ' ↑' : ' ↓') : ''}</button>
              </th>
            </tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} onClick={() => aoAbrir(p.id)} className={p.ativo ? '' : 'at-linha--inativa'} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') aoAbrir(p.id); }}>
                  <td><CapsulaId id={p.id} flutuante={false} /></td>
                  <td className="at-tabela__nome"><span className="at-mini" style={{ background: p.fotos ? (p.capa_cor ? `#${p.capa_cor}` : 'var(--bl-superficie-2)') : 'transparent' }} />{p.nome}{!p.ativo && <> <Etiqueta tom="aviso">Inativo</Etiqueta></>}</td>
                  <td>{rotuloSubcategoria(p.subcategoria)}</td>
                  <td>{p.legado ? <ChipKit nome={p.legado.kit_nome} prefixo="" /> : <span className="at-fraco">—</span>}</td>
                  <td>{p.fotos || <span className="at-alerta">0</span>}</td>
                  <td>{p.precifica.length ? p.precifica.map(tituloFamilia).join(', ') : <span className="at-fraco">—</span>}</td>
                  <td style={{ minWidth: 150 }}><BarraPreenchimento preenchidos={p.preenchidos} universo={p.universo} compacta /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
