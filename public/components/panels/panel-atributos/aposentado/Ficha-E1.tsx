// panel-atributos/src/screens/Ficha.tsx — ficha do produto (a tela mais importante). SÓ LEITURA.
// Briefing do Jhony §5: separar ESPECIFICAÇÃO TÉCNICA (atributos DSHOW, 3 camadas), FICHA DO PRECIFICA (só leitura) e PREÇO (Precifica, não exibido aqui),
// e dizer de onde veio cada informação. Camadas: 1 preenchidos (eq_valor) · 2 atribuídos no legado sem valor · 3 do modelo da subcategoria, vazios.
import React from 'react';
import type { Camada, FichaProduto, ItemAtributo } from '../lib/tipos';
import { FAMILIAS_PRECIFICA, IMPORTANCIA_CURTA, rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { campoPrecifica, dataCurta, precifica, valor } from '../lib/formatar';
import { BarraPreenchimento, CapsulaId, ChipKit, Etiqueta, Foto } from '../ui/Comuns';

const CAMADAS: { id: Camada; titulo: string; curto: string; descricao: string; classe: string }[] = [
  { id: 'preenchidos', titulo: 'Preenchidos', curto: 'Preenchido', descricao: 'Valor gravado no banco de atributos (DSHOW_EQUIPAMENTOS), com unidade, origem e data.', classe: 'preenchido' },
  { id: 'legado_sem_valor', titulo: 'Atribuídos no legado, sem valor', curto: 'Legado sem valor', descricao: 'O atributo foi atribuído a este produto no sistema antigo do Jhony (kit), mas nunca recebeu valor.', classe: 'legado' },
  { id: 'modelo_vazio', titulo: 'Do modelo da subcategoria, vazios', curto: 'Modelo vazio', descricao: 'Faz parte do modelo aplicado à subcategoria e ainda não tem valor nem atribuição no legado.', classe: 'modelo' },
];

function Linha({ a, camada }: { a: ItemAtributo; camada: Camada }) {
  const imp = a.importancia ? IMPORTANCIA_CURTA[a.importancia] ?? a.importancia : null;
  const v = a.valor;
  return (
    <div className={`at-attr at-attr--${CAMADAS.find((c) => c.id === camada)!.classe} ${a.atributo_ativo ? '' : 'at-attr--inativo'}`}>
      <div className="at-attr__nome">
        <span className="at-attr__marca" aria-hidden />
        <div>
          <div className="at-attr__rotulo">{a.rotulo}{a.obrigatorio && <span className="at-obrig" title="Obrigatório no modelo">*</span>}</div>
          <div className="at-attr__meta">
            {imp && <span className={`at-imp at-imp--${imp === 'Importante' || imp === 'Obrigatório' ? 'forte' : 'fraca'}`}>{imp}</span>}
            {!a.atributo_ativo && <Etiqueta tom="aviso" titulo="Atributo inativo no dicionário (decisão P1 do Jhony: as 6 descrições voltam a ser ativas)">inativo</Etiqueta>}
            {a.codigo && <code className="at-codigo" title="Código estável (contrato com o app)">{a.codigo}</code>}
          </div>
        </div>
      </div>
      <div className="at-attr__valor">
        {v ? <strong>{valor(v, a.unidade)}</strong> : <span className="at-vazio">sem valor{a.unidade ? <> · <em>{a.unidade}</em></> : null}</span>}
        {a.legado?.tp_unit && <span className="at-fraco" title="Unidade escrita no legado (tp_unit)"> legado: {a.legado.tp_unit}</span>}
      </div>
      <div className={`at-attr__precifica ${a.precifica ? "" : "at-attr__precifica--vazio"}`}>
        {a.precifica ? <><span className="at-fonte-mini">Precifica</span> {precifica(a.precifica.chave, a.precifica.valor)}</> : <span className="at-fraco">—</span>}
      </div>
      <div className="at-attr__origem">
        {v && <Etiqueta tom={v.origem === 'manual' ? 'verde' : 'neutro'} titulo={v.legado_bruto ? `Texto original no legado: ${v.legado_bruto}` : undefined}>
          {v.origem === 'manual' ? 'manual' : 'importado'} · {dataCurta(v.atualizado_em)}{v.lote_id ? ` · lote ${v.lote_id}` : ''}</Etiqueta>}
        {a.kit_origem && <ChipKit nome={a.kit_origem} />}
        {a.no_modelo && <Etiqueta tom="info" titulo={`Modelo: ${a.grupo}`}>modelo</Etiqueta>}
      </div>
    </div>
  );
}

export function Ficha({ ficha, aoVoltar }: { ficha: FichaProduto; aoVoltar: () => void }) {
  const [filtro, setFiltro] = React.useState<Camada | 'todos'>('todos');
  const [inativos, setInativos] = React.useState(true);
  const [fotoSel, setFotoSel] = React.useState(0);
  const p = ficha.produto, c = ficha.contagens;
  const universoAtivo = c.preenchidos_ativos + c.legado_sem_valor_ativos + ficha.camadas.modelo_vazio.filter((x) => x.atributo_ativo).length;
  const foto = ficha.fotos[fotoSel] ?? null;
  const visiveis = (cam: Camada) => ficha.camadas[cam].filter((a) => inativos || a.atributo_ativo);

  return (
    <div className="at-ficha">
      <div className="at-ficha__topo">
        <button type="button" className="bl-botao" onClick={aoVoltar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>Produtos</button>
        <span className="at-fraco">Ficha do produto · somente leitura</span>
      </div>

      <div className="at-heroi">
        <div className="at-galeria">
          <Foto cor={foto?.cor ?? null} temFoto={!!foto} proporcao={foto ? `${foto.largura} / ${foto.altura}` : '16 / 9'} idCapsula={p.id}
            rotulo={foto ? `foto ${fotoSel + 1} de ${ficha.fotos.length} · prévia (a imagem fica no app)` : 'sem foto'} />
          {ficha.fotos.length > 1 && (
            <div className="at-miniaturas" role="listbox" aria-label="Fotos do produto">
              {ficha.fotos.map((f, i) => (
                <button key={f.id} type="button" role="option" aria-selected={i === fotoSel} className={`at-miniatura ${i === fotoSel ? 'ativa' : ''}`}
                  style={{ background: f.cor ? `#${f.cor}` : 'var(--bl-superficie-2)' }} onClick={() => setFotoSel(i)} title={f.capa ? 'Capa' : `Foto ${i + 1}`}>
                  {f.capa && <span>capa</span>}
                </button>))}
            </div>)}
        </div>
        <div className="at-ident bl-cartao">
          <div className="at-ident__classe">{rotuloCategoria(p.categoria)} · {rotuloSubcategoria(p.subcategoria)}</div>
          <h1 className="at-ident__nome">{p.nome}</h1>
          <div className="at-ident__chips">
            <CapsulaId id={p.id} flutuante={false} />
            {p.ativo ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta tom="aviso">Inativo no catálogo</Etiqueta>}
            {ficha.legado && <ChipKit nome={ficha.legado.kit_nome} />}
            {ficha.precifica.familias.map((k) => <Etiqueta key={k} tom="info">Precifica: {tituloFamilia(k)}</Etiqueta>)}
          </div>
          <div className="at-camadas-resumo">
            {CAMADAS.map((cam) => (
              <button key={cam.id} type="button" className={`at-camada-cartao at-camada-cartao--${cam.classe} ${filtro === cam.id ? 'ativo' : ''}`}
                onClick={() => setFiltro(filtro === cam.id ? 'todos' : cam.id)} aria-pressed={filtro === cam.id}>
                <strong>{c[cam.id]}</strong><span>{cam.titulo}</span>
              </button>))}
          </div>
          <div className="at-ident__preench"><span className="at-fraco">Preenchimento (atributos ativos)</span><BarraPreenchimento preenchidos={c.preenchidos_ativos} universo={universoAtivo} /></div>
          <dl className="at-fontes">
            <div><dt><span className="at-ponto at-ponto--dshow" />Especificação técnica</dt><dd>Banco de atributos DSHOW. Carga do legado do Jhony em 16/11/2026 (lote 1){ficha.legado ? <> · item legado {ficha.legado.item}, {ficha.legado.atribuidos} atribuições, {ficha.legado.com_valor} com valor</> : ' · sem atribuição no legado'}.</dd></div>
            <div><dt><span className="at-ponto at-ponto--precifica" />Ficha do Precifica</dt><dd>{ficha.precifica.disponivel ? (ficha.precifica.familias.length ? 'Somente leitura, ao lado de cada atributo com par e no quadro à direita.' : 'Este produto não tem ficha técnica no Precifica.') : 'Indisponível nesta sessão.'}</dd></div>
            <div><dt><span className="at-ponto at-ponto--preco" />Preço</dt><dd>Vem do Precifica e não é exibido nesta tela.</dd></div>
          </dl>
        </div>
      </div>

      <div className="at-ficha__corpo">
        <section className="at-espec bl-cartao" aria-label="Especificação técnica">
          <div className="at-espec__cabeca">
            <div><h2>Especificação técnica <span className="at-fonte-mini at-fonte-mini--dshow">DSHOW</span></h2>
              <p className="at-fraco">{c.preenchidos + c.legado_sem_valor + c.modelo_vazio} atributos: {c.preenchidos} preenchidos · {c.legado_sem_valor} atribuídos no legado sem valor · {c.modelo_vazio} do modelo vazios</p></div>
            <div className="at-espec__controles">
              <div className="at-alternador" role="group" aria-label="Camada">
                <button type="button" className={filtro === 'todos' ? 'ativo' : ''} onClick={() => setFiltro('todos')}>Todas</button>
                {CAMADAS.map((cam) => <button key={cam.id} type="button" className={filtro === cam.id ? 'ativo' : ''} onClick={() => setFiltro(cam.id)}>{cam.curto} ({c[cam.id]})</button>)}
              </div>
              <label className="at-check"><input type="checkbox" checked={inativos} onChange={(e) => setInativos(e.target.checked)} /> mostrar inativos</label>
            </div>
          </div>
          <div className="at-attr at-attr--cabecalho" aria-hidden><div>Atributo</div><div>Valor (DSHOW)</div><div>Precifica</div><div>Origem</div></div>
          {CAMADAS.filter((cam) => filtro === 'todos' || filtro === cam.id).map((cam) => {
            const xs = visiveis(cam.id);
            return (
              <div key={cam.id} className={`at-bloco at-bloco--${cam.classe}`}>
                <div className="at-bloco__titulo"><span className="at-bloco__marca" /><strong>{cam.titulo}</strong><span className="at-filtro__n">{xs.length}</span><span className="at-fraco at-bloco__desc">{cam.descricao}</span></div>
                {xs.length ? xs.map((a) => <Linha key={`${cam.id}-${a.atributo_id}`} a={a} camada={cam.id} />)
                  : <div className="at-bloco__vazio">{cam.id === 'legado_sem_valor' && !ficha.legado ? 'Este produto não tem atribuição no legado.' : cam.id === 'modelo_vazio' && c.modelo === 0 ? 'A subcategoria não tem modelo com atributos (proposta E2: Controladoras, Cabos, Fontes).' : 'Nada nesta camada.'}</div>}
              </div>);
          })}
        </section>

        <aside className="at-lateral">
          <section className="bl-cartao at-precifica" aria-label="Ficha do Precifica">
            <h2><span className="at-ponto at-ponto--precifica" />Ficha do Precifica <span className="at-fraco">somente leitura</span></h2>
            {!ficha.precifica.disponivel ? <p className="at-fraco">Indisponível nesta sessão.</p>
              : ficha.precifica.familias.length === 0 ? <p className="at-fraco">Sem ficha técnica no Precifica para este produto.</p>
              : ficha.precifica.familias.map((k) => {
                const def = FAMILIAS_PRECIFICA[k];
                const campos = Object.entries(ficha.precifica.ficha[k] ?? {});
                return (
                  <div key={k} className="at-precifica__familia">
                    <div className="at-precifica__titulo">{tituloFamilia(k)}</div>
                    <dl>{campos.map(([campo, v]) => { const d = def?.campos[campo]; return (
                      <div key={campo}><dt>{d?.rotulo ?? campo}</dt><dd>{campoPrecifica(v, d?.unidade, d?.enumeracao)}</dd></div>); })}</dl>
                  </div>);
              })}
          </section>
          <section className="bl-cartao at-preco" aria-label="Preço">
            <h2><span className="at-ponto at-ponto--preco" />Preço</h2>
            <p className="at-fraco">Preços e valores comerciais vêm do Precifica atual e não aparecem nesta tela (somente especificação).</p>
          </section>
          <section className="bl-cartao at-legenda" aria-label="Legenda">
            <h2>Como ler</h2>
            <ul>
              {CAMADAS.map((cam) => <li key={cam.id}><span className={`at-legenda__marca at-legenda__marca--${cam.classe}`} /><div><strong>{cam.titulo}</strong><br /><span className="at-fraco">{cam.descricao}</span></div></li>)}
              <li><ChipKit nome="Base (8)" prefixo="" /><span className="at-fraco"> Kit do legado de onde veio a atribuição (Base de 8, Gabinete, Módulo, Controladoras, Cabos, Fontes, Parafusos).</span></li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
