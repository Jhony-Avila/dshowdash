// panel-atributos/src/screens/Ficha.tsx — ficha do produto (§11.3): ver e editar. Cabeçalho com galeria, identificação e preenchimento;
// abas Atributos · Vínculos · Fotos · Precifica · Histórico. Briefing §5: especificação técnica (DSHOW) × Precifica (só leitura) × preço.
import React from 'react';
import type { AtributoDicionario, EventoHistorico, Ficha as TFicha, ItemFicha, KitResumo, Sugestao } from '../lib/tipos';
import { enviar, ErroApi, obter } from '../lib/api';
import { campoPrecifica, dataHora, decimal, precifica as fmtPrecifica, pctDe, valor as fmtValor } from '../lib/formatar';
import { ESTADO, FAMILIAS_PRECIFICA, FONTE_SUGESTAO, IMPORTANCIA, MOTIVO_KIT, rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Barra, Botao, CapsulaId, ChipKit, Carregando, Dialogo, Erro, Etiqueta, Foto, Vazio } from '../ui/Comuns';
import { EditorValor } from '../ui/EditorValor';

type AbaFicha = 'atributos' | 'vinculos' | 'fotos' | 'precifica' | 'historico';

export function Ficha({ id }: { id: number }) {
  const m = useModulo();
  const [f, setF] = React.useState<TFicha | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aba, setAba] = React.useState<AbaFicha>('atributos');
  const [detalhes, setDetalhes] = React.useState(false);
  const [foto, setFoto] = React.useState(0);
  const seq = React.useRef(0);   // recargas fora de ordem: só a mais recente vale (senão um campo volta ao valor antigo)
  const carregar = React.useCallback((silencioso = false) => {
    if (!silencioso) setF(null);
    setErro(null);
    const n = ++seq.current;
    obter<TFicha>('ficha_produto', { product_id: id }).then((d) => { if (n === seq.current) setF(d); }).catch((e) => { if (n === seq.current) setErro(e.message); });
  }, [id]);
  React.useEffect(() => { carregar(); setAba('atributos'); setFoto(0); }, [carregar]);
  if (erro) return <div><button type="button" className="bl-botao" onClick={m.fecharProduto}>← Voltar</button><Erro mensagem={erro} aoTentar={() => carregar()} /></div>;
  if (!f) return <Carregando rotulo="Carregando a ficha" />;
  const p = f.produto; const fs = f.fotos[foto] ?? null;
  const pend = f.itens.filter((i) => i.sugestoes.length).length;

  return (
    <div className="at-ficha">
      <div className="at-ficha__topo">
        <button type="button" className="bl-botao" onClick={m.fecharProduto}>← Voltar</button>
        <span className="at-fraco">Ficha do produto{f.pode_editar ? '' : ' · somente leitura'}</span>
      </div>
      <div className="at-heroi">
        <div className="at-galeria">
          <Foto mediaId={fs?.id ?? null} cor={fs?.cor ?? null} proporcao={fs ? `${fs.largura} / ${fs.altura}` : '16 / 9'} lado={1280} idCapsula={p.id} />
          {f.fotos.length > 1 && (
            <div className="at-miniaturas" role="listbox" aria-label="Fotos do produto">
              {f.fotos.map((x, i) => (
                <button key={x.id} type="button" role="option" aria-selected={i === foto} className={`at-miniatura ${i === foto ? 'ativa' : ''}`} onClick={() => setFoto(i)} title={x.capa ? 'Capa' : `Foto ${i + 1}`}>
                  <Foto mediaId={x.id} cor={x.cor} proporcao="4 / 3" compacta ajuste="cover" />
                </button>))}
            </div>)}
        </div>
        <div className="at-ident bl-cartao">
          <div className="at-ident__classe">{rotuloCategoria(p.categoria)} · {rotuloSubcategoria(p.subcategoria)}</div>
          <h1 className="at-ident__nome">{p.nome}</h1>
          <div className="at-ident__chips">
            <CapsulaId id={p.id} flutuante={false} />
            {p.ativo ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta tom="aviso">Inativo no catálogo</Etiqueta>}
            {f.kits.map((k) => <ChipKit key={k.id} nome={k.nome} titulo={`Kit ${k.nome} — ${k.motivos.map((x) => MOTIVO_KIT[x.tipo]).join(', ')}`} />)}
            {f.precifica.familias.map((k) => <Etiqueta key={k} tom="info">Precifica: {tituloFamilia(k)}</Etiqueta>)}
          </div>
          <div className="at-ident__barras">
            <Barra rotulo="Essencial" feitos={f.completude.essencial.feitos} total={f.completude.essencial.total} />
            <Barra rotulo="Completo" feitos={f.completude.completo.feitos} total={f.completude.completo.total} />
          </div>
          <dl className="at-fontes">
            <div><dt><span className="at-ponto at-ponto--dshow" />Especificação técnica</dt><dd>Banco de atributos DSHOW (esta tela). {f.legado ? `Legado do Jhony: item ${f.legado.item}, kit ${f.legado.kit_nome ?? '—'}.` : 'Sem atribuição no legado.'}</dd></div>
            <div><dt><span className="at-ponto at-ponto--precifica" />Ficha do Precifica</dt><dd>{f.precifica.familias.length ? 'Somente leitura, ao lado de cada atributo com par e na aba Precifica.' : 'Este produto não tem ficha técnica no Precifica.'}</dd></div>
          </dl>
          <div className="at-acoes">
            <Botao aoClicar={() => setDetalhes(true)}>Detalhes</Botao>
            {pend > 0 && <Etiqueta tom="info">{pend} sugest{pend === 1 ? 'ão' : 'ões'} para conferir</Etiqueta>}
            {f.completude.obrigatorios_vazios.length > 0 && <Etiqueta tom="aviso">{f.completude.obrigatorios_vazios.length} obrigatório(s) vazio(s)</Etiqueta>}
          </div>
        </div>
      </div>
      <div className="at-abas" role="tablist" aria-label="Seções da ficha">
        {([['atributos', `Atributos (${f.itens.length})`], ['vinculos', 'Vínculos'], ['fotos', `Fotos (${f.fotos.length})`], ['precifica', 'Precifica'], ['historico', 'Histórico']] as [AbaFicha, string][]).map(([a, r]) => (
          <button key={a} type="button" role="tab" aria-selected={aba === a} className={aba === a ? 'ativo' : ''} onClick={() => setAba(a)}>{r}</button>))}
      </div>
      {aba === 'atributos' && <AbaAtributos f={f} recarregar={() => carregar(true)} />}
      {aba === 'vinculos' && <AbaVinculos f={f} recarregar={() => carregar(true)} />}
      {aba === 'fotos' && (f.fotos.length ? <div className="at-fotos-grade">{f.fotos.map((x, i) => <button key={x.id} type="button" className="at-fotos-grade__item" onClick={() => { setFoto(i); window.scrollTo({ top: 0 }); }}><Foto mediaId={x.id} cor={x.cor} proporcao="4 / 3" />{x.capa && <Etiqueta tom="info">capa</Etiqueta>}</button>)}</div> : <Vazio titulo="Sem fotos">As fotos são gerenciadas no app. Esta tela é só leitura.</Vazio>)}
      {aba === 'precifica' && <AbaPrecifica f={f} />}
      {aba === 'historico' && <AbaHistorico id={p.id} />}
      <Dialogo titulo="Detalhes do produto" aberto={detalhes} aoFechar={() => setDetalhes(false)} largura={620}>
        <dl className="at-detalhes">
          <dt>ID</dt><dd>{p.id}</dd><dt>Nome (catálogo)</dt><dd>{p.nome}</dd><dt>Categoria</dt><dd>{rotuloCategoria(p.categoria)} ({p.categoria})</dd>
          <dt>Subcategoria</dt><dd>{rotuloSubcategoria(p.subcategoria)} ({p.subcategoria ?? '—'})</dd><dt>Situação</dt><dd>{p.ativo ? 'Ativo' : 'Inativo'}</dd>
          <dt>Kits</dt><dd>{f.kits.map((k) => `${k.nome} (${k.motivos.map((x) => MOTIVO_KIT[x.tipo]).join(', ')})`).join(' · ') || '—'}</dd>
          <dt>Legado</dt><dd>{f.legado ? `item ${f.legado.item} · kit ${f.legado.kit_nome ?? '—'} · ${f.legado.atribuidos} atribuições` : '—'}</dd>
          <dt>Precifica</dt><dd>{f.precifica.familias.map(tituloFamilia).join(', ') || '—'}</dd>
          <dt>Preço</dt><dd>Reservado. Preço e valores comerciais vêm do Precifica e não entram na web nesta etapa (A7).</dd>
          <dt>Completude</dt><dd>essencial {f.completude.essencial.feitos}/{f.completude.essencial.total} · completo {f.completude.completo.feitos}/{f.completude.completo.total} · geral {f.completude.geral.feitos}/{f.completude.geral.total}</dd>
        </dl>
      </Dialogo>
    </div>
  );
}

// ---- Aba Atributos -------------------------------------------------------------------------------------------------------------------
function AbaAtributos({ f, recarregar }: { f: TFicha; recarregar: () => void }) {
  const m = useModulo();
  const [agrup, setAgrup] = React.useState<'kit' | 'grupo'>('kit');
  const [filtro, setFiltro] = React.useState<'todos' | 'vazios' | 'obrigatorios' | 'sugestoes'>('todos');
  const [hist, setHist] = React.useState<ItemFicha | null>(null);
  const [adicionar, setAdicionar] = React.useState(false);
  // UX-1: depois de adicionar, o campo novo recebe o foco (avulso: o atributo escolhido; kit: o 1º campo vazio que o kit trouxe)
  const [focar, setFocar] = React.useState<{ atributo?: number; kit?: number } | null>(null);
  React.useEffect(() => {
    if (!focar) return;
    const alvo = focar.atributo ?? f.itens.find((i) => !i.valor && (i.kit_id === focar.kit || i.origens.some((o) => o.grupo_id === focar.kit)))?.atributo_id;
    if (alvo === undefined) return;
    const linha = document.querySelector<HTMLElement>(`[data-atributo="${alvo}"]`); if (!linha) return;
    linha.scrollIntoView({ block: 'center' });
    linha.querySelector<HTMLElement>('input:not([type=checkbox]):not([readonly]), select, button[role=radio], input[type=checkbox]')?.focus();
    setFocar(null);
  }, [focar, f]);
  const itens = f.itens.filter((i) => filtro === 'todos' || (filtro === 'vazios' && !i.valor) || (filtro === 'obrigatorios' && i.obrigatorio && !i.valor) || (filtro === 'sugestoes' && i.sugestoes.length > 0));
  const grupos = new Map<string, ItemFicha[]>();
  for (const i of itens) { const k = agrup === 'kit' ? (i.kit ?? 'Sem kit') : (i.grupo_atributos ?? 'Sem grupo de atributos'); grupos.set(k, [...(grupos.get(k) ?? []), i]); }
  const blocos = [...grupos.entries()].sort((a, b) => (agrup === 'grupo' ? a[0].localeCompare(b[0], 'pt-BR') : 0));
  return (
    <section className="at-painel" aria-label="Atributos do produto">
      <div className="at-painel__cabeca">
        <div className="at-acoes">
          <div className="at-alternador" role="group" aria-label="Agrupar por">
            <button type="button" className={agrup === 'kit' ? 'ativo' : ''} aria-pressed={agrup === 'kit'} onClick={() => setAgrup('kit')}>Por kit</button>
            <button type="button" className={agrup === 'grupo' ? 'ativo' : ''} aria-pressed={agrup === 'grupo'} onClick={() => setAgrup('grupo')}>Por grupo de atributos</button>
          </div>
          <select className="at-select" aria-label="Mostrar" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
            <option value="todos">Todos ({f.itens.length})</option><option value="vazios">Sem valor ({f.itens.filter((i) => !i.valor).length})</option>
            <option value="obrigatorios">Obrigatórios vazios ({f.completude.obrigatorios_vazios.length})</option><option value="sugestoes">Com sugestão ({f.itens.filter((i) => i.sugestoes.length).length})</option>
          </select>
        </div>
        <div className="at-acoes">
          {f.pode_vincular && <Botao primario aoClicar={() => setAdicionar(true)}>Adicionar atributo a este produto</Botao>}
          <span className="at-fraco">{f.pode_editar ? 'Cada campo grava sozinho (Enter ou ao sair do campo).' : 'Somente leitura para o seu nível.'}</span>
        </div>
      </div>
      <Dialogo titulo="Adicionar atributo a este produto" aberto={adicionar} aoFechar={() => setAdicionar(false)} largura={640}>
        <SeletorAdicionar f={f} aoFeito={(alvo) => { setAdicionar(false); setFocar(alvo); recarregar(); }} />
      </Dialogo>
      <div className="at-attr at-attr--cabecalho" aria-hidden><div>Atributo</div><div>Valor DSHOW</div><div>Referência do Precifica · somente leitura</div><div>Origem</div></div>
      {blocos.length === 0 && <div className="at-bloco__vazio">Nada neste filtro.</div>}
      {blocos.map(([nome, xs]) => (
        <div key={nome} className="at-bloco">
          <div className="at-bloco__titulo">{agrup === 'kit' && nome !== 'Sem kit' ? <ChipKit nome={nome} /> : <strong>{nome}</strong>}<span className="at-filtro__n">{xs.length}</span></div>
          {xs.map((i) => <LinhaAtributo key={i.atributo_id} i={i} f={f} recarregar={recarregar} aoHistorico={() => setHist(i)} />)}
        </div>))}
      {f.fora_da_ficha.length > 0 && <SecaoFora f={f} recarregar={recarregar} />}
      {f.legado_nao_vinculado.length > 0 && (
        <div className="at-bloco at-bloco--legado">
          <div className="at-bloco__titulo"><strong>Do legado, sem vínculo</strong><span className="at-filtro__n">{f.legado_nao_vinculado.length}</span><span className="at-fraco at-bloco__desc">Atribuídos a este produto no sistema antigo, mas fora dos kits atuais (ex.: atributos cadastrais inativos).</span></div>
          {f.legado_nao_vinculado.map((i) => (
            <div key={i.atributo_id} className="at-attr at-attr--legado">
              <div className="at-attr__nome"><span className="at-attr__marca" aria-hidden /><div><div className="at-attr__rotulo">{i.rotulo}</div><div className="at-attr__meta">{!i.atributo_ativo && <Etiqueta tom="aviso">inativo</Etiqueta>}{i.legado?.kit_origem && <ChipKit nome={`Legado: ${i.legado.kit_origem}`} pequeno />}</div></div></div>
              <div className="at-vazio">sem valor</div><div /><div>{f.pode_vincular && i.atributo_ativo && <Botao aoClicar={() => enviar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: 'incluir' }).then(() => { m.aviso('Atributo vinculado a este produto.'); recarregar(); }).catch((e) => m.aviso(e.message, 'erro'))}>Vincular a este produto</Botao>}</div>
            </div>))}
        </div>)}
      {f.excecoes.length > 0 && (
        <div className="at-bloco">
          <div className="at-bloco__titulo"><strong>Exceções deste produto</strong><span className="at-filtro__n">{f.excecoes.length}</span><span className="at-fraco at-bloco__desc">Atributos de kit excluídos só neste produto.</span></div>
          {f.excecoes.map((e) => (
            <div key={e.atributo_id} className="at-attr"><div className="at-attr__nome"><div><div className="at-attr__rotulo">{e.rotulo}</div><div className="at-attr__meta">motivo: {e.motivo ?? '—'}</div></div></div><div /><div />
              <div>{f.pode_vincular && <Botao aoClicar={() => enviar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: e.atributo_id, modo: null }).then(() => { m.aviso('Exceção desfeita.'); recarregar(); }).catch((x) => m.aviso(x.message, 'erro'))}>Desfazer exceção</Botao>}</div></div>))}
        </div>)}
      <HistoricoCampo produto={f.produto.id} item={hist} aoFechar={() => setHist(null)} />
    </section>
  );
}

function LinhaAtributo({ i, f, recarregar, aoHistorico }: { i: ItemFicha; f: TFicha; recarregar: () => void; aoHistorico: () => void }) {
  const imp = i.importancia ? IMPORTANCIA[i.importancia] : null;
  const unidade = i.valor?.unidade_id ? i.unidades.find((u) => u.id === i.valor?.unidade_id)?.simbolo ?? i.unidade_efetiva?.simbolo ?? null : i.unidade_efetiva?.simbolo ?? null;
  return (
    <div data-atributo={i.atributo_id} className={`at-attr ${i.valor ? 'at-attr--preenchido' : i.obrigatorio ? 'at-attr--obrigatorio' : 'at-attr--modelo'}`}>
      <div className="at-attr__nome">
        <span className="at-attr__marca" aria-hidden />
        <div>
          <div className="at-attr__rotulo">{i.rotulo}{i.obrigatorio && <span className="at-obrig" title="Obrigatório">*</span>}{i.destaque && <span className="at-destaque" title="Destaque no app">★</span>}</div>
          <div className="at-attr__meta">
            {imp && <span className={`at-imp at-imp--${['Obrigatório', 'Importante'].includes(imp) ? 'forte' : 'fraca'}`}>{imp}</span>}
            {!i.visivel_app && <Etiqueta titulo="Não aparece no app (A5)">só na web</Etiqueta>}
            {i.codigo && <code className="at-codigo" title="Código estável (contrato com o app)">{i.codigo}</code>}
          </div>
        </div>
      </div>
      <div className="at-attr__valor">
        <EditorValor item={i} productId={f.produto.id} podeEditar={f.pode_editar} aoGravar={recarregar} aoRecarregar={recarregar} />
        {i.sugestoes.map((s) => <SugestaoLinha key={s.id} s={s} i={i} f={f} recarregar={recarregar} />)}
      </div>
      <div className="at-attr__precifica">{i.precifica ? <><span className="at-fonte-mini">Precifica</span> {fmtPrecifica(i.precifica.chave, i.precifica.valor)}</> : <span className="at-fraco">—</span>}</div>
      <div className="at-attr__origem">
        {i.valor && <Etiqueta tom={i.valor.origem === 'manual' ? 'verde' : 'neutro'} titulo={i.valor.legado_bruto ?? undefined}>{i.valor.origem === 'manual' ? 'manual' : 'importado'} · {dataHora(i.valor.atualizado_em)}{i.valor.atualizado_por ? ` · ${i.valor.atualizado_por.replace(/@.*/, '')}` : ''}</Etiqueta>}
        {i.origens.map((o, k) => <span key={k} className="at-origem">{o.tipo === 'avulso' ? 'avulso' : `${o.grupo_nome} · ${(o.motivos ?? []).map((x) => MOTIVO_KIT[x.tipo]).join(', ')}`}</span>)}
        {i.legado?.tp_unit && <span className="at-fraco" title="Unidade escrita no legado">legado: {i.legado.tp_unit}</span>}
        <button type="button" className="at-link" onClick={aoHistorico}>histórico</button>
        {unidade === null && null}
      </div>
    </div>
  );
}

function SugestaoLinha({ s, i, f, recarregar }: { s: Sugestao; i: ItemFicha; f: TFicha; recarregar: () => void }) {
  const m = useModulo();
  const [trab, setTrab] = React.useState(false);
  const rotOp = s.opcao_id ? i.opcoes.find((o) => o.id === s.opcao_id)?.rotulo : null;
  const un = s.unidade_id ? i.unidades.find((u) => u.id === s.unidade_id)?.simbolo ?? '' : '';
  const decidir = (decisao: 'aceitar' | 'recusar') => {
    setTrab(true);
    enviar('sugestao', { id: s.id, versao: s.versao, decisao }).then(() => { m.aviso(decisao === 'aceitar' ? 'Sugestão aceita.' : 'Sugestão recusada.'); recarregar(); })
      .catch((e) => { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); setTrab(false); });
  };
  if (s.tipo === 'conferencia') return <div className="at-sugestao" title={s.evidencia ?? ''}><span className="at-sugestao__rot">conferir ({FONTE_SUGESTAO[s.fonte]}):</span> {s.valor_proposto} {un} <button type="button" className="at-link" onClick={() => m.ir('conferencia')}>resolver na Conferência</button></div>;
  return (
    <div className="at-sugestao" title={s.evidencia ?? ''}>
      <span className="at-sugestao__rot">sugestão ({FONTE_SUGESTAO[s.fonte]}):</span> <span className="at-sugestao__val">{rotOp ?? (s.valor_proposto && /^-?\d+(\.\d+)?$/.test(s.valor_proposto) ? decimal(s.valor_proposto) : s.valor_proposto)} {un}</span>
      {f.pode_editar && <>{i.valor ? <span className="at-fraco" title="Sugestão não sobrescreve (D10)"> campo já preenchido</span> : <button type="button" className="at-link" disabled={trab} onClick={() => decidir('aceitar')}>Aceitar</button>} <button type="button" className="at-link at-link--fraco" disabled={trab} onClick={() => decidir('recusar')}>Recusar</button></>}
    </div>);
}

function SecaoFora({ f, recarregar }: { f: TFicha; recarregar: () => void }) {
  const m = useModulo();
  const [paraKit, setParaKit] = React.useState<ItemFicha | null>(null);
  return (
    <div className="at-bloco at-bloco--fora">
      <div className="at-bloco__titulo"><strong>Fora da ficha</strong><span className="at-filtro__n">{f.fora_da_ficha.length}</span><span className="at-fraco at-bloco__desc">Há valor gravado, mas o atributo não está vinculado a este produto (nem por kit nem avulso).</span></div>
      {f.fora_da_ficha.map((i) => (
        <div key={i.atributo_id} className="at-attr at-attr--fora">
          <div className="at-attr__nome"><span className="at-attr__marca" aria-hidden /><div><div className="at-attr__rotulo">{i.rotulo}</div><div className="at-attr__meta">{!i.atributo_ativo && <Etiqueta tom="aviso">inativo</Etiqueta>}{i.codigo && <code className="at-codigo">{i.codigo}</code>}</div></div></div>
          <div className="at-attr__valor"><strong>{i.valor ? fmtValor(i.valor, i.unidades.find((u) => u.id === i.valor?.unidade_id)?.simbolo ?? i.unidade_efetiva?.simbolo ?? null) : '—'}</strong></div>
          <div className="at-attr__precifica">{i.precifica ? fmtPrecifica(i.precifica.chave, i.precifica.valor) : <span className="at-fraco">—</span>}</div>
          <div className="at-attr__origem">{f.pode_vincular && i.atributo_ativo && <>
            <Botao aoClicar={() => enviar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: 'incluir' }).then(() => { m.aviso('Vinculado a este produto.'); recarregar(); }).catch((e) => m.aviso(e.message, 'erro'))}>Vincular a este produto</Botao>
            <Botao aoClicar={() => setParaKit(i)}>Adicionar ao kit…</Botao></>}</div>
        </div>))}
      <AdicionarAoKit f={f} item={paraKit} aoFechar={() => setParaKit(null)} aoFeito={() => { setParaKit(null); recarregar(); }} />
    </div>);
}

/** "Adicionar ao kit": acrescenta o atributo ao fim dos itens de um dos kits do produto (vale para todos os produtos do kit). */
function AdicionarAoKit({ f, item, aoFechar, aoFeito }: { f: TFicha; item: ItemFicha | null; aoFechar: () => void; aoFeito: () => void }) {
  const m = useModulo();
  const [kit, setKit] = React.useState<number | ''>('');
  const [trab, setTrab] = React.useState(false);
  const kits = f.kits.filter((k) => !k.motivos.some((x) => x.tipo === 'todos'));
  const confirmar = async () => {
    if (!item || kit === '') return;
    setTrab(true);
    try {
      const d = await obter<{ kit: { id: number; versao: number; atributos: { atributo_id: number; posicao: number; obrigatorio: number; visivel: number; destaque: number; importancia: string | null; unidade_id: number | null }[] } }>('kit', { id: kit });
      const itens = d.kit.atributos.map((a) => ({ atributo_id: a.atributo_id, posicao: a.posicao, obrigatorio: a.obrigatorio, visivel: a.visivel, destaque: a.destaque, importancia: a.importancia, unidade_id: a.unidade_id }));
      itens.push({ atributo_id: item.atributo_id, posicao: Math.max(0, ...itens.map((x) => x.posicao)) + 1, obrigatorio: 0, visivel: 1, destaque: 0, importancia: null, unidade_id: null });
      await enviar('kit_itens', { id: kit, versao: d.kit.versao, itens });
      m.aviso(`"${item.rotulo}" adicionado ao kit.`); aoFeito();
    } catch (e) { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); } finally { setTrab(false); }
  };
  return (
    <Dialogo titulo={`Adicionar "${item?.rotulo ?? ''}" a um kit`} aberto={item !== null} aoFechar={aoFechar}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><Botao primario desligado={kit === ''} trabalhando={trab} aoClicar={confirmar}>Adicionar ao kit</Botao></>}>
      {kits.length === 0 ? <p>Este produto não tem kit específico. Vincule o atributo só a este produto ou aplique um kit na aba Vínculos.</p> : <>
        <p>O atributo passa a valer para <strong>todos</strong> os produtos que recebem o kit escolhido.</p>
        <label className="at-rotulo-campo">Kit<select className="at-campo" value={kit} onChange={(e) => setKit(e.target.value ? Number(e.target.value) : '')}><option value="">Escolha…</option>{kits.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}</select></label></>}
    </Dialogo>);
}

function HistoricoCampo({ produto, item, aoFechar }: { produto: number; item: ItemFicha | null; aoFechar: () => void }) {
  const [ev, setEv] = React.useState<EventoHistorico[] | null>(null);
  React.useEffect(() => { if (!item) return; setEv(null); obter<{ historico: EventoHistorico[] }>('historico_produto', { product_id: produto }).then((d) => setEv(d.historico.filter((h) => h.atributo_id === item.atributo_id))).catch(() => setEv([])); }, [item, produto]);
  return (
    <Dialogo titulo={`Histórico: ${item?.rotulo ?? ''}`} aberto={item !== null} aoFechar={aoFechar} largura={640}>
      {ev === null ? <Carregando /> : ev.length === 0 ? <p className="at-fraco">Nenhuma alteração registrada neste campo{item?.valor?.origem === 'importado' ? ' (o valor atual veio de importação do legado).' : '.'}</p> : <ListaEventos ev={ev} />}
    </Dialogo>);
}

function resumo(x: Record<string, unknown> | null): string {
  if (!x) return '—';
  if (x.estado && x.estado !== 'informado') return ESTADO[String(x.estado)] ?? String(x.estado);
  const v = x.valor_num ?? x.valor_texto ?? x.opcao_id ?? x.valor_bool ?? x.valor_data ?? x.modo ?? x.grupo_id ?? null;
  return v === null || v === undefined ? '—' : typeof v === 'string' && /^-?\d+\.\d+$/.test(v) ? decimal(v) : String(v);
}
function ListaEventos({ ev }: { ev: EventoHistorico[] }) {
  return (
    <ol className="at-eventos">
      {ev.map((e) => (
        <li key={e.id}><div className="at-eventos__quando">{dataHora(e.quando)} · <strong>{e.quem.replace(/@.*/, '')}</strong></div>
          <div>{e.acao.replace(/_/g, ' ')}{e.atributo ? ` · ${e.atributo}` : ''}: <span className="at-fraco">{resumo(e.antes)}</span> → <strong>{resumo(e.depois)}</strong>{e.motivo ? <span className="at-fraco"> · {e.motivo}</span> : null}</div></li>))}
    </ol>);
}

function AbaHistorico({ id }: { id: number }) {
  const [ev, setEv] = React.useState<EventoHistorico[] | null>(null); const [erro, setErro] = React.useState<string | null>(null);
  React.useEffect(() => { obter<{ historico: EventoHistorico[] }>('historico_produto', { product_id: id }).then((d) => setEv(d.historico)).catch((e) => setErro(e.message)); }, [id]);
  if (erro) return <Erro mensagem={erro} />;
  if (!ev) return <Carregando />;
  return <section className="at-painel"><div className="at-painel__cabeca"><h3>Histórico do produto</h3><span className="at-fraco">quem, quando, antes e depois (valores, vínculos e sugestões)</span></div>
    <div className="at-painel__corpo">{ev.length ? <ListaEventos ev={ev} /> : <p className="at-fraco">Nenhuma alteração registrada ainda. Os valores importados do legado não geram histórico.</p>}</div></section>;
}

function AbaPrecifica({ f }: { f: TFicha }) {
  if (!f.precifica.disponivel) return <Vazio titulo="Ficha do Precifica indisponível nesta sessão" />;
  if (!f.precifica.familias.length) return <Vazio titulo="Sem ficha técnica no Precifica">Este produto não tem especificação no Precifica. A especificação técnica fica no banco de atributos (aba Atributos).</Vazio>;
  return (
    <div className="at-precifica-grade">
      {f.precifica.familias.map((k) => { const def = FAMILIAS_PRECIFICA[k]; return (
        <section key={k} className="at-painel at-precifica">
          <div className="at-painel__cabeca"><h3><span className="at-ponto at-ponto--precifica" />{tituloFamilia(k)}</h3><span className="at-fraco">somente leitura</span></div>
          <dl className="at-painel__corpo">{Object.entries(f.precifica.ficha[k] ?? {}).map(([c, v]) => { const d = def?.campos[c]; return <div key={c}><dt>{d?.rotulo ?? c}</dt><dd>{campoPrecifica(v, d?.unidade, d?.enumeracao)}</dd></div>; })}</dl>
        </section>); })}
    </div>);
}

// ---- Aba Vínculos (H6) ---------------------------------------------------------------------------------------------------------------
function AbaVinculos({ f, recarregar }: { f: TFicha; recarregar: () => void }) {
  const m = useModulo();
  const [excluir, setExcluir] = React.useState<ItemFicha | null>(null);
  const [motivo, setMotivo] = React.useState('');
  const pid = f.produto.id;
  const chamar = (rota: string, corpo: Record<string, unknown>, ok: string) => enviar(rota, corpo).then(() => { m.aviso(ok); recarregar(); }).catch((e) => m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'));
  const pode = f.pode_vincular;
  return (
    <div className="at-vinculos">
      <section className="at-painel">
        <div className="at-painel__cabeca"><h3>Kits deste produto</h3><span className="at-fraco">de onde vem cada atributo</span></div>
        <div className="at-painel__corpo">
          {f.kits.length === 0 ? <p className="at-fraco">Nenhum kit vale para este produto.</p> : (
            <ul className="at-kits-produto">{f.kits.map((k) => (
              <li key={k.id}><ChipKit nome={k.nome} /><span>{k.motivos.map((x) => x.tipo === 'escopo' ? `pela subcategoria ${rotuloSubcategoria(x.subcategoria || null)}${x.subcategoria ? '' : ' (categoria inteira)'}` : MOTIVO_KIT[x.tipo]).join(' · ')}</span>
                {pode && k.motivos.some((x) => x.tipo === 'direto') && <Botao aoClicar={() => chamar('produto_kit', { product_id: pid, versao_vinculos: f.versao_vinculos, grupo_id: k.id, ativo: 0 }, 'Kit removido deste produto.')}>Remover kit direto</Botao>}
                <button type="button" className="at-link" onClick={() => m.ir('kits', { kit: k.id })}>abrir kit</button></li>))}</ul>)}
          {pode && <div style={{ marginTop: 12 }}><SeletorAdicionar f={f} aoFeito={() => recarregar()} /></div>}
        </div>
      </section>
      <section className="at-painel">
        <div className="at-painel__cabeca"><h3>Atributos e origem</h3><span className="at-fraco">exclua um atributo só aqui (exceção ao kit) ou defina a unidade deste produto</span></div>
        <div className="bl-rola-x">
          <table className="at-tabela">
            <thead><tr><th>Atributo</th><th>Vem de</th><th>Unidade deste produto</th><th>Ações</th></tr></thead>
            <tbody>{f.itens.map((i) => (
              <tr key={i.atributo_id}>
                <td>{i.rotulo}{i.obrigatorio && <span className="at-obrig">*</span>}</td>
                <td>{i.origens.map((o, k) => <span key={k} className="at-origem">{o.tipo === 'avulso' ? 'avulso' : `${o.grupo_nome} (${(o.motivos ?? []).map((x) => MOTIVO_KIT[x.tipo]).join(', ')})`}</span>)}</td>
                <td>{(i.tipo === 'numero' || i.tipo === 'inteiro') && i.unidades.length > 0 ? (
                  <select className="at-campo at-campo--unid" aria-label={`Unidade deste produto para ${i.rotulo}`} disabled={!pode} value={i.unidade_produto_id ?? ''}
                    onChange={(e) => { const u = e.target.value ? Number(e.target.value) : null; const avul = i.origens.some((o) => o.tipo === 'avulso');
                      chamar('produto_atributo', { product_id: pid, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: u === null ? (avul ? 'incluir' : null) : (avul ? 'incluir' : 'ajustar'), unidade_id: u }, 'Unidade deste produto definida.'); }}>
                    <option value="">padrão ({i.unidades.find((u) => u.padrao)?.simbolo ?? i.unidade_efetiva?.simbolo ?? '—'})</option>
                    {i.unidades.map((u) => <option key={u.id} value={u.id}>{u.simbolo}</option>)}
                  </select>) : <span className="at-fraco">—</span>}</td>
                <td>{pode && (i.origens.every((o) => o.tipo === 'avulso')
                  ? <Botao aoClicar={() => chamar('produto_atributo', { product_id: pid, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: null }, 'Atributo avulso removido.')}>Remover avulso</Botao>
                  : <Botao aoClicar={() => { setExcluir(i); setMotivo(''); }}>Excluir só neste produto</Botao>)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>
      <Dialogo titulo={`Excluir "${excluir?.rotulo ?? ''}" só neste produto`} aberto={excluir !== null} aoFechar={() => setExcluir(null)}
        rodape={<><Botao aoClicar={() => setExcluir(null)}>Cancelar</Botao><Botao primario desligado={motivo.trim().length < 3} aoClicar={() => { if (excluir) chamar('produto_atributo', { product_id: pid, versao_vinculos: f.versao_vinculos, atributo_id: excluir.atributo_id, modo: 'excluir', motivo }, 'Exceção registrada: o atributo some só neste produto.'); setExcluir(null); }}>Excluir neste produto</Botao></>}>
        <p>O atributo continua no kit para os outros produtos. Aqui ele deixa de aparecer (o valor, se houver, vai para "Fora da ficha").</p>
        <label className="at-rotulo-campo">Motivo (obrigatório)<input className="at-campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: este modelo não tem esse componente" /></label>
      </Dialogo>
    </div>);
}

/** UX-1: o seletor de "adicionar ao produto" — o MESMO na aba Vínculos e no botão da aba Atributos: aplicar um kit ou um atributo avulso. */
function SeletorAdicionar({ f, aoFeito }: { f: TFicha; aoFeito: (alvo: { atributo?: number; kit?: number }) => void }) {
  const m = useModulo();
  const [kits, setKits] = React.useState<KitResumo[]>([]);
  const [kitNovo, setKitNovo] = React.useState<number | ''>('');
  const [avulso, setAvulso] = React.useState(false);
  const [trab, setTrab] = React.useState(false);
  React.useEffect(() => { obter<{ kits: KitResumo[] }>('kits').then((d) => setKits(d.kits.filter((k) => k.ativo && k.itens > 0))).catch(() => setKits([])); }, []);
  const aplicarKit = () => {
    if (kitNovo === '') return; const k = kitNovo; setTrab(true);
    enviar('produto_kit', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, grupo_id: k, ativo: 1 })
      .then(() => { m.aviso('Kit aplicado a este produto.'); setKitNovo(''); aoFeito({ kit: k }); })
      .catch((e) => m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro')).finally(() => setTrab(false));
  };
  return (
    <div className="at-acoes">
      <select className="at-campo" aria-label="Kit para aplicar" value={kitNovo} onChange={(e) => setKitNovo(e.target.value ? Number(e.target.value) : '')}>
        <option value="">Aplicar um kit a este produto…</option>{kits.filter((k) => !f.kits.some((x) => x.id === k.id)).map((k) => <option key={k.id} value={k.id}>{k.nome} ({k.itens} atributos)</option>)}
      </select>
      <Botao primario desligado={kitNovo === ''} trabalhando={trab} aoClicar={aplicarKit}>Aplicar kit</Botao>
      <Botao aoClicar={() => setAvulso(true)}>Adicionar atributo avulso</Botao>
      <BuscaAvulso aberto={avulso} f={f} aoFechar={() => setAvulso(false)} aoFeito={(aid) => { setAvulso(false); aoFeito({ atributo: aid }); }} />
    </div>);
}

/** Adicionar atributo avulso (H4): busca no dicionário com filtros. */
function BuscaAvulso({ aberto, f, aoFechar, aoFeito }: { aberto: boolean; f: TFicha; aoFechar: () => void; aoFeito: (atributoId: number) => void }) {
  const m = useModulo();
  const [dic, setDic] = React.useState<AtributoDicionario[] | null>(null);
  const [q, setQ] = React.useState(''); const [tipo, setTipo] = React.useState(''); const [esc, setEsc] = React.useState<number | null>(null); const [trab, setTrab] = React.useState(false);
  React.useEffect(() => { if (aberto && !dic) obter<{ atributos: AtributoDicionario[] }>('dicionario').then((d) => setDic(d.atributos)).catch(() => setDic([])); if (aberto) { setQ(''); setEsc(null); } }, [aberto, dic]);
  const ja = new Set(f.itens.map((i) => i.atributo_id));
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = (dic ?? []).filter((a) => a.ativo && !ja.has(a.id) && (!tipo || a.tipo === tipo) && (!q || n(a.rotulo + ' ' + a.codigo).includes(n(q)))).slice(0, 60);
  const confirmar = () => { if (esc === null) return; setTrab(true); enviar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: esc, modo: 'incluir' }).then(() => { m.aviso('Atributo avulso adicionado.'); aoFeito(esc); }).catch((e) => m.aviso(e.message, 'erro')).finally(() => setTrab(false)); };
  return (
    <Dialogo titulo="Adicionar atributo avulso a este produto" aberto={aberto} aoFechar={aoFechar} largura={640}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><Botao primario desligado={esc === null} trabalhando={trab} aoClicar={confirmar}>Adicionar</Botao></>}>
      <div className="at-acoes" style={{ marginBottom: 10 }}>
        <input className="at-campo" style={{ flex: 1 }} type="search" placeholder="Buscar no dicionário (rótulo ou código)" aria-label="Buscar atributo" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="at-campo" aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos os tipos</option><option value="numero">Número</option><option value="inteiro">Inteiro</option><option value="texto">Texto</option><option value="opcao">Opção</option><option value="booleano">Sim/Não</option><option value="data">Data</option></select>
      </div>
      {dic === null ? <Carregando /> : lista.length === 0 ? <p className="at-fraco">Nenhum atributo encontrado.</p> : (
        <ul className="at-escolha" role="listbox" aria-label="Atributos">{lista.map((a) => (
          <li key={a.id}><label className={esc === a.id ? 'ativo' : ''}><input type="radio" name="avulso" checked={esc === a.id} onChange={() => setEsc(a.id)} />
            <span><strong>{a.rotulo}</strong> <span className="at-fraco">{a.unidade ? `(${a.unidade}) ` : ''}{a.grupo_atributos ?? ''}</span><br /><code className="at-codigo">{a.codigo}</code></span></label></li>))}</ul>)}
    </Dialogo>);
}

export const _pct = pctDe;
