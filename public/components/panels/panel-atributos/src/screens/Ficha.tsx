// panel-atributos/src/screens/Ficha.tsx — ficha do produto (§11.3): ver e editar. Cabeçalho com galeria, identificação e preenchimento;
// abas Atributos · Vínculos · Fotos · Precifica · Histórico. Briefing §5: especificação técnica (DSHOW) × Precifica (só leitura) × preço.
import React from 'react';
import { createPortal } from 'react-dom';
import type { AtributoDicionario, EventoHistorico, Ficha as TFicha, ItemFicha, KitResumo, Sugestao } from '../lib/tipos';
import { enviar, ErroApi, obter } from '../lib/api';
import { campoPrecifica, dataHora, decimal, precifica as fmtPrecifica, pctDe, sugestaoTexto, valor as fmtValor } from '../lib/formatar';
import { ESTADO, FAMILIAS_PRECIFICA, FONTE_SUGESTAO, IMPORTANCIA, MOTIVO_KIT, rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Barra, Botao, CapsulaId, ChipKit, Carregando, Dialogo, Erro, Etiqueta, CabecalhoTravado, Foto, Vazio } from '../ui/Comuns';
import { Icone, type NomeIcone } from '../ui/Icones';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import type { Ordenacao } from '../lib/ordenar';
import { EditorValor } from '../ui/EditorValor';

type AbaFicha = 'atributos' | 'vinculos' | 'fotos' | 'precifica' | 'historico';

type FiltroAtr = 'todos' | 'obrigatorios' | 'sugestoes';

export function Ficha({ id }: { id: number }) {
  const m = useModulo();
  const [f, setF] = React.useState<TFicha | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aba, setAba] = React.useState<AbaFicha>('atributos');
  React.useEffect(() => { if (m.atributoFoco !== null) setAba('atributos'); }, [m.atributoFoco]);   // UX-1: abrir num atributo = aba Atributos
  const [detalhes, setDetalhes] = React.useState(false);
  const [ampliar, setAmpliar] = React.useState<number | null>(null);   // UX-1b: foto ampliada (carrossel / aba Fotos)
  // UX-1 (b) + UX-1b: o filtro da aba Atributos vive aqui para "Ver N pendentes" (bloco do produto) aplicá-lo
  const [filtro, setFiltro] = React.useState<FiltroAtr>('todos');
  const [slotFiltros, setSlotFiltros] = React.useState<HTMLDivElement | null>(null);   // UX-1b: filtros da aba na linha das sub-abas
  const trilho = React.useRef<HTMLDivElement>(null);
  const seq = React.useRef(0);   // recargas fora de ordem: só a mais recente vale (senão um campo volta ao valor antigo)
  // "foi salvo ou não" (item 3): a releitura SILENCIOSA (depois de gravar) não troca a ficha por uma tela de erro — devolve false e quem
  // gravou mostra "Salvo. Não foi possível atualizar o valor na tela." junto ao campo. Só a carga inicial mostra o erro da ficha.
  const carregar = React.useCallback((silencioso = false): Promise<boolean> => {
    if (!silencioso) { setF(null); setErro(null); }
    const n = ++seq.current;
    return obter<TFicha>('ficha_produto', { product_id: id })
      .then((d) => { if (n === seq.current) { setF(d); setErro(null); } return true; })
      .catch((e) => { if (n === seq.current && !silencioso) setErro(e.message); return false; });
  }, [id]);
  React.useEffect(() => { carregar(); setAba('atributos'); setAmpliar(null); setFiltro('todos'); }, [carregar]);
  if (erro) return <div><button type="button" className="bl-botao" onClick={m.fecharProduto}>← Voltar</button><Erro mensagem={erro} aoTentar={() => carregar()} /></div>;
  if (!f) return <Carregando rotulo="Carregando a ficha" />;
  const p = f.produto; const capa = f.fotos.find((x) => x.capa) ?? f.fotos[0] ?? null;
  const ess = f.completude.essencial; const nPend = f.completude.obrigatorios_vazios.length;
  const verPendentes = () => { setAba('atributos'); setFiltro('obrigatorios'); };
  const pend = f.itens.filter((i) => i.sugestoes.length).length;

  return (
    <div className="at-ficha">
      {/* UX-1b (refeito): a FAIXA do produto + sub-abas + filtros ficam no bloco fixo (sticky) do topo; o bloco grande do produto rola
          com a página (sem cálculo de altura: o "encolher" é o bloco grande sair de vista enquanto a faixa fina fica). */}
      <CabecalhoTravado>
        <div className="at-heroi-compacto at-ficha__faixa">
          <button type="button" className="bl-botao" onClick={m.fecharProduto}>← Produtos</button>
          <div className="at-heroi-compacto__foto"><Foto mediaId={capa?.id ?? null} cor={capa?.cor ?? null} proporcao="1 / 1" compacta ajuste="cover" /></div>
          <strong className="at-heroi-compacto__nome" title={p.nome}>{p.nome}</strong>
          <CapsulaId id={p.id} flutuante={false} />
          <span className="at-fraco at-ficha__classe">{rotuloCategoria(p.categoria)} / {rotuloSubcategoria(p.subcategoria)}</span>
          {!f.pode_editar && <Etiqueta>somente leitura</Etiqueta>}
          <div className="at-heroi-compacto__barras">
            <Barra rotulo="Essencial" feitos={ess.feitos} total={ess.total} compacta />
            <Barra rotulo="Completo" feitos={f.completude.completo.feitos} total={f.completude.completo.total} compacta />
          </div>
          <Botao aoClicar={() => setDetalhes(true)}>Detalhes</Botao>
        </div>
        <div className="at-ficha__abas-linha">
        <div className="at-abas at-abas--icones" role="tablist" aria-label="Seções da ficha">
          {([['atributos', `Atributos (${f.itens.length})`, 'list'], ['vinculos', 'Vínculos', 'link'], ['fotos', `Fotos (${f.fotos.length})`, 'image'], ['precifica', 'Precifica', 'tag'], ['historico', 'Histórico', 'clock']] as [AbaFicha, string, NomeIcone][]).map(([a, r, ic]) => (
            <button key={a} type="button" role="tab" aria-selected={aba === a} className={aba === a ? 'ativo' : ''} onClick={() => setAba(a)}><Icone nome={ic} />{r}</button>))}
        </div>
        <div className="at-ficha__filtros-slot" ref={setSlotFiltros} />
        </div>
      </CabecalhoTravado>
      <div className="at-heroi-fixo">
          <div className="at-heroi">
            <div className="at-galeria">
              <Foto mediaId={capa?.id ?? null} cor={capa?.cor ?? null} proporcao="4 / 3" lado={480} idCapsula={p.id} />
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
              {/* UX-1b (ajuste 1): completude acionável — o clique aplica o filtro "Obrigatórios pendentes" (a mesma regra do contador) */}
              <div className="at-completude">
                {ess.total === 0 ? <span className="at-fraco">Sem essenciais definidos</span> : <span>{ess.feitos} de {ess.total} essenciais preenchidos</span>}
                {nPend > 0 && <> · <button type="button" className="at-link" onClick={verPendentes}>Ver {nPend} pendente{nPend === 1 ? '' : 's'}</button></>}
                {pend > 0 && <Etiqueta tom="info">{pend} sugest{pend === 1 ? 'ão' : 'ões'} para conferir</Etiqueta>}
              </div>
              {/* UX-1b: carrossel de fotos (a capa continua à esquerda); sem fotos, não aparece */}
              {f.fotos.length > 0 && (
                <div className="at-carrossel" role="group" aria-label="Fotos do produto">
                  <button type="button" className="at-carrossel__seta" aria-label="Fotos anteriores" onClick={() => trilho.current?.scrollBy({ left: -240, behavior: 'smooth' })}><Icone nome="chevron-left" /></button>
                  <div className="at-carrossel__trilho" ref={trilho}>
                    {f.fotos.map((x, k) => (
                      <button key={x.id} type="button" className="at-carrossel__item" onClick={() => setAmpliar(k)} aria-label={`Ampliar foto ${k + 1} de ${f.fotos.length}`} title={x.capa ? 'Capa' : `Foto ${k + 1}`}>
                        <Foto mediaId={x.id} cor={x.cor} proporcao="4 / 3" compacta ajuste="cover" />
                      </button>))}
                  </div>
                  <button type="button" className="at-carrossel__seta" aria-label="Próximas fotos" onClick={() => trilho.current?.scrollBy({ left: 240, behavior: 'smooth' })}><Icone nome="chevron-right" /></button>
                </div>)}
            </div>
          </div>
      </div>
      {aba === 'atributos' && <AbaAtributos f={f} recarregar={() => carregar(true)} focoInicial={m.atributoFoco} aoConsumirFoco={m.limparAtributoFoco} filtro={filtro} setFiltro={setFiltro} slotFiltros={slotFiltros} />}
      {aba === 'vinculos' && <AbaVinculos f={f} recarregar={() => carregar(true)} />}
      {aba === 'fotos' && (f.fotos.length ? <div className="at-fotos-grade">{f.fotos.map((x, i) => <button key={x.id} type="button" className="at-fotos-grade__item" onClick={() => setAmpliar(i)}><Foto mediaId={x.id} cor={x.cor} proporcao="4 / 3" />{x.capa && <Etiqueta tom="info">capa</Etiqueta>}</button>)}</div> : <Vazio titulo="Sem fotos">As fotos são gerenciadas no app. Esta tela é só leitura.</Vazio>)}
      {aba === 'precifica' && <AbaPrecifica f={f} />}
      {aba === 'historico' && <AbaHistorico id={p.id} />}
      <Dialogo titulo={ampliar !== null ? `Foto ${ampliar + 1} de ${f.fotos.length}` : 'Foto'} aberto={ampliar !== null && !!f.fotos[ampliar]} aoFechar={() => setAmpliar(null)} largura={900}
        rodape={f.fotos.length > 1 ? <><Botao aoClicar={() => setAmpliar((a) => (a === null ? a : (a + f.fotos.length - 1) % f.fotos.length))}>‹ Anterior</Botao><Botao aoClicar={() => setAmpliar((a) => (a === null ? a : (a + 1) % f.fotos.length))}>Próxima ›</Botao></> : undefined}>
        {ampliar !== null && f.fotos[ampliar] && <Foto mediaId={f.fotos[ampliar].id} cor={f.fotos[ampliar].cor} proporcao={`${f.fotos[ampliar].largura} / ${f.fotos[ampliar].altura}`} lado={1280} />}
      </Dialogo>
      <Dialogo titulo="Detalhes do produto · dados cadastrais" aberto={detalhes} aoFechar={() => setDetalhes(false)} largura={620}>
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
function AbaAtributos({ f, recarregar, focoInicial = null, aoConsumirFoco, filtro, setFiltro, slotFiltros = null }: { f: TFicha; recarregar: () => Promise<boolean> | void; focoInicial?: number | null; aoConsumirFoco?: () => void; filtro: FiltroAtr; setFiltro: (v: FiltroAtr) => void; slotFiltros?: HTMLElement | null }) {
  const m = useModulo();
  const [agrup, setAgrup] = React.useState<'kit' | 'grupo' | 'nenhum'>('kit');
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao | null>(null);   // null = ordem da ficha (posição no kit)
  const pendentes = React.useMemo(() => new Set(f.completude.obrigatorios_vazios), [f]);   // UX-1: a MESMA lista do contador (servidor)
  const [hist, setHist] = React.useState<ItemFicha | null>(null);
  const [adicionar, setAdicionar] = React.useState(false);
  // UX-1: depois de adicionar, o campo novo recebe o foco (avulso: o atributo escolhido; kit: o 1º campo vazio que o kit trouxe)
  const [focar, setFocar] = React.useState<{ atributo?: number; kit?: number } | null>(null);
  // UX-1: abrir a ficha já num atributo (pelo ID). Fora da ficha → aviso; a ficha abre normalmente.
  React.useEffect(() => {
    if (focoInicial === null) return;
    aoConsumirFoco?.();
    if (f.itens.some((i) => i.atributo_id === focoInicial)) { setFiltro('todos'); setFocar({ atributo: focoInicial }); }   // filtro não pode esconder a linha
    else m.aviso('Este atributo já não faz parte da ficha. Os dados foram atualizados.', 'info');
  }, [focoInicial]);   // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!focar) return;
    const alvo = focar.atributo ?? f.itens.find((i) => !i.valor && (i.kit_id === focar.kit || i.origens.some((o) => o.grupo_id === focar.kit)))?.atributo_id;
    if (alvo === undefined) return;
    const celula = document.querySelector<HTMLElement>(`[data-atributo="${alvo}"]`); if (!celula) return;
    const linha = celula.closest<HTMLElement>('tr') ?? celula;   // UX-1b: a linha é a <tr> da TabelaDados (cada célula marca data-atributo)
    linha.scrollIntoView({ block: 'center' });
    linha.querySelector<HTMLElement>('input:not([type=checkbox]):not([readonly]), select, button[role=radio], input[type=checkbox]')?.focus();
    setFocar(null);
  }, [focar, f]);
  const itens = f.itens.filter((i) => filtro === 'todos' || (filtro === 'obrigatorios' && pendentes.has(i.atributo_id)) || (filtro === 'sugestoes' && i.sugestoes.length > 0));
  // UX-1b: tabela de dados (TabelaDados da ESQUERDA). "Por kit"/"Por grupo": a ordenação vale DENTRO de cada grupo (os grupos mantêm a
  // ordem); "Todos juntos": a lista inteira. A ordem congela enquanto um campo da tabela tem o foco (o editor grava na célula).
  const chaveGrupo = (i: ItemFicha) => (agrup === 'kit' ? (i.kit ?? 'Sem kit') : agrup === 'grupo' ? (i.grupo_atributos ?? 'Sem grupo de atributos') : null);
  const nomesGrupos = agrup === 'nenhum' ? [] : [...new Set(itens.map((i) => chaveGrupo(i) as string))];
  if (agrup === 'grupo') nomesGrupos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const grupos = nomesGrupos.map((k) => ({ chave: k, titulo: k }));   // a TabelaDados já mostra a contagem
  const colunas: ColunaTabela<ItemFicha>[] = [
    { chave: 'atributo', titulo: 'Atributo e origem do vínculo', tipo: 'texto', valor: (i) => i.rotulo, render: (i) => <CelAtributo i={i} aoHistorico={() => setHist(i)} /> },
    { chave: 'valor', titulo: 'Valor DSHOW', tipo: 'texto', valor: (i) => textoDoValor(i), render: (i) => <CelValor i={i} f={f} recarregar={recarregar} /> },
    { chave: 'estado', titulo: 'Estado e sugestão', tipo: 'texto', valor: (i) => estadoDe(i, pendentes.has(i.atributo_id)),
      render: (i) => <CelEstado i={i} f={f} pendente={pendentes.has(i.atributo_id)} recarregar={recarregar} /> },
    { chave: 'precifica', titulo: 'Referência do Precifica · somente leitura', tipo: 'texto', valor: (i) => (i.precifica ? fmtPrecifica(i.precifica.chave, i.precifica.valor) : null),
      render: (i) => <div data-atributo={i.atributo_id} className="at-attr__precifica">{i.precifica ? <><span className="at-fonte-mini">Precifica</span> {fmtPrecifica(i.precifica.chave, i.precifica.valor)}</> : <span className="at-fraco">—</span>}</div> },
  ];
  return (
    <section className="at-painel at-painel--ficha" aria-label="Atributos do produto">
      {/* UX-1b: filtros na MESMA linha das sub-abas (área fixa enxuta); o título fica logo acima da tabela */}
      {(() => { const filtros = (
      <div className="at-ficha__filtros" title={f.pode_editar ? 'Cada campo grava sozinho (Enter ou ao sair do campo). Clique no título da coluna para ordenar.' : undefined}>
        {!f.pode_editar && <Etiqueta>somente leitura</Etiqueta>}
          <div className="at-alternador" role="group" aria-label="Agrupar por">
            {([['kit', 'Por kit'], ['grupo', 'Por grupo'], ['nenhum', 'Todos juntos']] as ['kit' | 'grupo' | 'nenhum', string][]).map(([v, r]) => (
              <button key={v} type="button" className={agrup === v ? 'ativo' : ''} aria-pressed={agrup === v} onClick={() => setAgrup(v)}>{r}</button>))}
          </div>
          <div className="at-alternador" role="group" aria-label="Mostrar">
            {([['todos', `Todos (${f.itens.length})`], ['obrigatorios', `Obrigatórios pendentes (${pendentes.size})`], ['sugestoes', `Com sugestão (${f.itens.filter((i) => i.sugestoes.length).length})`]] as [FiltroAtr, string][]).map(([v, r]) => (
              <button key={v} type="button" className={filtro === v ? 'ativo' : ''} aria-pressed={filtro === v} onClick={() => setFiltro(v)}>{r}</button>))}
          </div>
          {f.pode_vincular && <Botao primario aoClicar={() => setAdicionar(true)}>Adicionar atributo a este produto</Botao>}
      </div>
      ); return slotFiltros ? createPortal(filtros, slotFiltros) : <CabecalhoTravado>{filtros}</CabecalhoTravado>; })()}
      <h3 className="at-ficha__titulo-tabela">Atributos deste produto</h3>
      <Dialogo titulo="Adicionar atributo a este produto" aberto={adicionar} aoFechar={() => setAdicionar(false)} largura={640}>
        <SeletorAdicionar f={f} aoFeito={(alvo) => { setAdicionar(false); setFocar(alvo); recarregar(); }} />
      </Dialogo>
      {itens.length === 0 ? <div className="at-bloco__vazio">Nada neste filtro.</div> : (
        <TabelaDados<ItemFicha> colunas={colunas} linhas={itens} chaveLinha={(i) => i.atributo_id} rolagem="container" className="at-tabela-ficha"
          ordenacao={ordenacao} aoOrdenar={setOrdenacao} legenda="Atributos deste produto"
          {...(agrup === 'nenhum' ? {} : { grupos, grupoDaLinha: (i: ItemFicha) => chaveGrupo(i) })}
          classeLinha={(i) => (pendentes.has(i.atributo_id) ? 'at-linha--pendente' : i.valor ? 'at-linha--preenchida' : undefined)} />)}
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

/** UX-1b: estado em palavras (coluna "Estado e sugestão"; também a chave de ordenação). */
function estadoDe(i: ItemFicha, pendente: boolean): string {
  return pendente ? 'Pendente' : !i.valor ? 'Sem valor' : i.valor.estado === 'nao_se_aplica' ? 'Não se aplica' : i.valor.estado === 'desconhecido' ? 'Desconhecido' : 'Preenchido';
}
/** UX-1b: texto do valor DSHOW para ordenar (vazio = sem valor → vai para o fim). */
function textoDoValor(i: ItemFicha): string | null {
  if (!i.valor) return null;
  if (i.valor.estado !== 'informado') return ESTADO[i.valor.estado] ?? i.valor.estado;
  const un = i.valor.unidade_id ? i.unidades.find((u) => u.id === i.valor?.unidade_id)?.simbolo ?? null : i.unidade_efetiva?.simbolo ?? null;
  return fmtValor(i.valor, un);
}

function CelAtributo({ i, aoHistorico }: { i: ItemFicha; aoHistorico: () => void }) {
  const imp = i.importancia ? IMPORTANCIA[i.importancia] : null;
  return (
    <div data-atributo={i.atributo_id} className={`at-attr__nome ${i.valor ? 'at-attr--preenchido' : i.obrigatorio ? 'at-attr--obrigatorio' : 'at-attr--modelo'}`}>
      <span className="at-attr__marca" aria-hidden />
      <div>
        <div className="at-attr__rotulo">{i.rotulo}{i.obrigatorio && <span className="at-obrig" title="Obrigatório">*</span>}{i.destaque && <span className="at-destaque" title="Destaque no app">★</span>}</div>
        <div className="at-attr__meta">
          {imp && <span className={`at-imp at-imp--${['Obrigatório', 'Importante'].includes(imp) ? 'forte' : 'fraca'}`}>{imp}</span>}
          {!i.visivel_app && <Etiqueta titulo="Não aparece no app (A5)">só na web</Etiqueta>}
          {i.codigo && <code className="at-codigo" title="Código estável (contrato com o app)">{i.codigo}</code>}
        </div>
        <div className="at-attr__origem">
          {i.valor && <Etiqueta tom={i.valor.origem === 'manual' ? 'verde' : 'neutro'} titulo={i.valor.legado_bruto ?? undefined}>{i.valor.origem === 'manual' ? 'manual' : 'importado'} · {dataHora(i.valor.atualizado_em)}{i.valor.atualizado_por ? ` · ${i.valor.atualizado_por.replace(/@.*/, '')}` : ''}</Etiqueta>}
          {/* UX-1b (ajuste 2): cadeado com explicação — o vínculo vem do kit (não se remove aqui), mas o valor DSHOW é editável */}
          {i.origens.map((o, k) => o.tipo === 'avulso'
            ? <span key={k} className="at-origem">avulso</span>
            : <span key={k} className="at-origem at-origem--kit" title={`Vínculo pelo kit ${o.grupo_nome}. Você pode preencher o valor DSHOW.`}>
                <Icone nome="lock" /><span className="bl-so-leitor">Vínculo pelo kit {o.grupo_nome}. Você pode preencher o valor DSHOW. </span>{o.grupo_nome} · {(o.motivos ?? []).map((x) => MOTIVO_KIT[x.tipo]).join(', ')}
              </span>)}
          {i.legado?.tp_unit && <span className="at-fraco" title="Unidade escrita no legado">legado: {i.legado.tp_unit}</span>}
          <button type="button" className="at-link" onClick={aoHistorico}>histórico</button>
        </div>
      </div>
    </div>
  );
}

function CelValor({ i, f, recarregar }: { i: ItemFicha; f: TFicha; recarregar: () => Promise<boolean> | void }) {
  return (
    <div data-atributo={i.atributo_id} className="at-attr__valor">
      {i.autoridade === 'precifica' && <span className="at-cadeado" title="Referência do Precifica · somente leitura"><Icone nome="lock" /> Referência do Precifica · somente leitura</span>}
      <EditorValor item={i} productId={f.produto.id} podeEditar={f.pode_editar} aoGravar={recarregar} aoRecarregar={recarregar} />
    </div>
  );
}

function CelEstado({ i, f, pendente, recarregar }: { i: ItemFicha; f: TFicha; pendente: boolean; recarregar: () => Promise<boolean> | void }) {
  return (
    <div data-atributo={i.atributo_id} className="at-attr__estado">
      <span className={`at-estado-txt ${pendente ? 'at-estado-txt--pendente' : ''}`}>{estadoDe(i, pendente)}</span>
      {i.sugestoes.map((s) => <SugestaoLinha key={s.id} s={s} i={i} f={f} recarregar={recarregar} />)}
    </div>
  );
}

function SugestaoLinha({ s, i, f, recarregar }: { s: Sugestao; i: ItemFicha; f: TFicha; recarregar: () => Promise<boolean> | void }) {
  const m = useModulo();
  const [trab, setTrab] = React.useState(false);
  const un = s.unidade_id ? i.unidades.find((u) => u.id === s.unidade_id)?.simbolo ?? '' : '';
  const decidir = (decisao: 'aceitar' | 'recusar') => {
    setTrab(true);
    enviar('sugestao', { id: s.id, versao: s.versao, decisao }).then(() => { m.aviso(decisao === 'aceitar' ? 'Sugestão aceita.' : 'Sugestão recusada.'); recarregar(); })
      .catch((e) => { m.aviso(e instanceof ErroApi ? e.message : 'Falha.', 'erro'); setTrab(false); });
  };
  if (s.tipo === 'conferencia') return <div className="at-sugestao" title={s.evidencia ?? ''}><span className="at-sugestao__rot">conferir ({FONTE_SUGESTAO[s.fonte]}):</span> {s.valor_proposto} {un} <button type="button" className="at-link" onClick={() => m.ir('conferencia')}>resolver na Conferência</button></div>;
  return (
    <div className="at-sugestao" title={s.evidencia ?? ''}>
      <span className="at-sugestao__rot" title={`Fonte: ${FONTE_SUGESTAO[s.fonte]}`}>Sugestão:</span> <span className="at-sugestao__val">{sugestaoTexto(s, i)}</span>
      {f.pode_editar && <>{i.valor ? <span className="at-fraco" title="Sugestão não sobrescreve (D10)"> campo já preenchido</span> : <button type="button" className="at-link" disabled={trab} onClick={() => decidir('aceitar')}>· Usar</button>} <button type="button" className="at-link at-link--fraco" disabled={trab} onClick={() => decidir('recusar')}>Recusar</button></>}
    </div>);
}

function SecaoFora({ f, recarregar }: { f: TFicha; recarregar: () => Promise<boolean> | void }) {
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
function AbaVinculos({ f, recarregar }: { f: TFicha; recarregar: () => Promise<boolean> | void }) {
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
  // Revisão UX-1 (P1): nenhuma ação confirma algo que não está visível. A seleção só vale se o item ainda está na lista exibida;
  // ao sair dos resultados (busca/filtro), ela é limpa. O botão e a confirmação conferem de novo.
  const escolhido = esc === null ? null : lista.find((a) => a.id === esc) ?? null;
  React.useEffect(() => { if (esc !== null && !escolhido) setEsc(null); }, [esc, escolhido]);
  const confirmar = () => { if (esc === null || !escolhido) return; setTrab(true); enviar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: esc, modo: 'incluir' }).then(() => { m.aviso('Atributo avulso adicionado.'); aoFeito(esc); }).catch((e) => m.aviso(e.message, 'erro')).finally(() => setTrab(false)); };
  return (
    <Dialogo titulo="Adicionar atributo avulso a este produto" aberto={aberto} aoFechar={aoFechar} largura={640}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><Botao primario desligado={!escolhido} trabalhando={trab} aoClicar={confirmar}>{escolhido ? `Adicionar ${escolhido.rotulo}` : 'Adicionar'}</Botao></>}>
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
