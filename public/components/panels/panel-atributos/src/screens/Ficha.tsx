// panel-atributos/src/screens/Ficha.tsx — ficha do produto (§11.3): ver e editar. Cabeçalho com galeria, identificação e preenchimento;
// abas Atributos · Vínculos · Fotos · Precifica · Histórico. Briefing §5: especificação técnica (DSHOW) × Precifica (só leitura) × preço.
import React from 'react';
import { createPortal } from 'react-dom';
import type { AtributoDicionario, EventoHistorico, Ficha as TFicha, ItemFicha, KitResumo, Sugestao } from '../lib/tipos';
import { ErroApi, obter } from '../lib/api';
import { campoPrecifica, dataHora, decimal, precifica as fmtPrecifica, pctDe, sugestaoTexto, valor as fmtValor } from '../lib/formatar';
import { ESTADO, FAMILIAS_PRECIFICA, FONTE_SUGESTAO, IMPORTANCIA, MOTIVO_KIT, rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Barra, Botao, CapsulaId, ChipKit, Carregando, Dialogo, Erro, Etiqueta, CabecalhoTravado, Foto, Vazio } from '../ui/Comuns';
import { Icone, type NomeIcone } from '../ui/Icones';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import type { Ordenacao } from '../lib/ordenar';
import { EditorValor, type ControleEditor } from '../ui/EditorValor';
import { EstadoVinculo, useGravacaoVinculo } from '../ui/GravacaoVinculo';
import { ROTULO_SITUACAO, situacaoDe } from '../lib/situacao';

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
  const [slotTitulo, setSlotTitulo] = React.useState<HTMLDivElement | null>(null);     // FICHA V3: título da tabela + ações, dentro do bloco travado
  const [fotoSel, setFotoSel] = React.useState(0);                                        // FICHA V3: foto mostrada no resumo compacto
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
  React.useEffect(() => { carregar(); setAba('atributos'); setAmpliar(null); setFiltro('todos'); setFotoSel(0); }, [carregar]);
  if (erro) return <div><button type="button" className="bl-botao" onClick={m.fecharProduto}>← Voltar</button><Erro mensagem={erro} aoTentar={() => carregar()} /></div>;
  if (!f) return <Carregando rotulo="Carregando a ficha" />;
  const p = f.produto; const capa = f.fotos.find((x) => x.capa) ?? f.fotos[0] ?? null;

  const nFotos = f.fotos.length; const fotoAtual = nFotos ? f.fotos[Math.min(fotoSel, nFotos - 1)] : capa;
  const irFoto = (k: number) => { if (!nFotos) return; const alvo = (k + nFotos) % nFotos; setFotoSel(alvo); trilho.current?.querySelectorAll<HTMLElement>('.at-resumo-v3__mini')[alvo]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); };
  return (
    <div className="at-ficha at-ficha--v3">
      {/* FICHA V3 (proposta do Jhony, 19/11): bloco travado ÚNICO — faixa de identificação + sub-abas/filtros + RESUMO COMPACTO + título da
          tabela com as ações; o cabeçalho das colunas gruda logo abaixo (TabelaDados rolagem="container"). Só as linhas rolam. */}
      <CabecalhoTravado>
        <div className="at-heroi-compacto at-ficha__faixa">
          <button type="button" className="bl-botao" onClick={m.fecharProduto}>← Produtos</button>
          <div className="at-heroi-compacto__foto"><Foto mediaId={capa?.id ?? null} cor={capa?.cor ?? null} proporcao="1 / 1" compacta ajuste="cover" /></div>
          <strong className="at-heroi-compacto__nome" title={p.nome}>{p.nome}</strong>
          <CapsulaId id={p.id} flutuante={false} />
          <span className="at-fraco at-ficha__classe">{rotuloCategoria(p.categoria)} / {rotuloSubcategoria(p.subcategoria)}</span>
          {!f.pode_editar && <Etiqueta>somente leitura</Etiqueta>}
          <Botao aoClicar={() => setDetalhes(true)}>Detalhes</Botao>
        </div>
        <div className="at-ficha__abas-linha">
        <div className="at-abas at-abas--icones" role="tablist" aria-label="Seções da ficha">
          {([['atributos', `Atributos (${f.itens.length})`, 'list'], ['vinculos', 'Vínculos', 'link'], ['fotos', `Fotos (${f.fotos.length})`, 'image'], ['precifica', 'Precifica', 'tag'], ['historico', 'Histórico', 'clock']] as [AbaFicha, string, NomeIcone][]).map(([a, r, ic]) => (
            <button key={a} type="button" role="tab" aria-selected={aba === a} className={aba === a ? 'ativo' : ''} onClick={() => setAba(a)}><Icone nome={ic} />{r}</button>))}
        </div>
        <div className="at-ficha__filtros-slot" ref={setSlotFiltros} />
        </div>
        {/* RESUMO COMPACTO: foto (ampliável), categoria, nome e carrossel de miniaturas com contador */}
        <div className="at-resumo-v3">
          <button type="button" className="at-resumo-v3__foto" onClick={() => nFotos && setAmpliar(Math.min(fotoSel, nFotos - 1))} disabled={!nFotos} aria-label={nFotos ? `Ampliar foto ${Math.min(fotoSel, nFotos - 1) + 1} de ${nFotos}` : 'Produto sem foto'}>
            <Foto mediaId={fotoAtual?.id ?? null} cor={fotoAtual?.cor ?? null} proporcao="4 / 3" compacta ajuste="contain" />
            {nFotos > 0 && <span className="at-resumo-v3__ampliar" aria-hidden><Icone nome="maximize-2" /></span>}
          </button>
          <div className="at-resumo-v3__texto">
            <div className="at-resumo-v3__classe">{rotuloCategoria(p.categoria)} · {rotuloSubcategoria(p.subcategoria)}</div>
            <div className="at-resumo-v3__nome">{p.nome}{!p.ativo && <> <Etiqueta tom="aviso">Inativo no catálogo</Etiqueta></>}</div>
            <div className="at-resumo-v3__carrossel" role="group" aria-label="Fotos do produto">
              <button type="button" className="at-resumo-v3__seta" aria-label="Foto anterior" disabled={nFotos <= 1} onClick={() => irFoto(fotoSel - 1)}><Icone nome="chevron-left" /></button>
              <div className="at-resumo-v3__trilho" ref={trilho}>
                {f.fotos.map((x, k) => (
                  <button key={x.id} type="button" className={`at-resumo-v3__mini ${k === Math.min(fotoSel, nFotos - 1) ? 'ativo' : ''}`} aria-pressed={k === Math.min(fotoSel, nFotos - 1)} aria-label={`Mostrar foto ${k + 1} de ${nFotos}`} onClick={() => irFoto(k)}>
                    <Foto mediaId={x.id} cor={x.cor} proporcao="1 / 1" compacta ajuste="cover" />
                  </button>))}
              </div>
              <span className="at-resumo-v3__contador" aria-live="polite">{nFotos ? `${Math.min(fotoSel, nFotos - 1) + 1} de ${nFotos}` : 'Sem fotos'}</span>
              <button type="button" className="at-resumo-v3__seta" aria-label="Próxima foto" disabled={nFotos <= 1} onClick={() => irFoto(fotoSel + 1)}><Icone nome="chevron-right" /></button>
            </div>
          </div>
        </div>
        <div className="at-ficha__titulo-slot" ref={setSlotTitulo} />
      </CabecalhoTravado>
      {aba === 'atributos' && <AbaAtributos f={f} recarregar={() => carregar(true)} focoInicial={m.atributoFoco} aoConsumirFoco={m.limparAtributoFoco} filtro={filtro} setFiltro={setFiltro} slotFiltros={slotFiltros} slotTitulo={slotTitulo} />}
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
function AbaAtributos({ f, recarregar, focoInicial = null, aoConsumirFoco, filtro, setFiltro, slotFiltros = null, slotTitulo = null }: { f: TFicha; recarregar: () => Promise<boolean> | void; focoInicial?: number | null; aoConsumirFoco?: () => void; filtro: FiltroAtr; setFiltro: (v: FiltroAtr) => void; slotFiltros?: HTMLElement | null; slotTitulo?: HTMLElement | null }) {
  const m = useModulo();
  const gLeg = useGravacaoVinculo(recarregar); const gExc = useGravacaoVinculo(recarregar);   // vínculos com chave + recibo (ui/GravacaoVinculo)
  const [agrup, setAgrup] = React.useState<'kit' | 'grupo' | 'nenhum'>('kit');
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao | null>(null);   // null = ordem da ficha (posição no kit)
  const pendentes = React.useMemo(() => new Set(f.completude.obrigatorios_vazios), [f]);   // UX-1: a MESMA lista do contador (servidor)
  const [hist, setHist] = React.useState<ItemFicha | null>(null);
  const [adicionar, setAdicionar] = React.useState(false);
  const [comparar, setComparar] = React.useState(false);                 // FICHA V3: referência do Precifica só sob demanda (somente leitura)
  const [detalheDe, setDetalheDe] = React.useState<ItemFicha | null>(null);
  // FICHA V3: a unidade de cada linha é desenhada na coluna própria (o editor da coluna Valor manda o seletor para cá por portal)
  const [slotsUnid, setSlotsUnid] = React.useState<Record<number, HTMLElement | null>>({});
  const refsUnid = React.useRef(new Map<number, (el: HTMLElement | null) => void>());
  const refUnid = (id: number) => { let r = refsUnid.current.get(id); if (!r) { r = (el) => setSlotsUnid((x) => (x[id] === el ? x : { ...x, [id]: el })); refsUnid.current.set(id, r); } return r; };
  // FICHA V3: o menu ⋯ muda o estado pelo editor da linha (mesmo caminho de gravação: chave, recibo, mensagens)
  const controles = React.useRef(new Map<number, React.MutableRefObject<ControleEditor | null>>());
  const controleDe = (id: number) => { let c = controles.current.get(id); if (!c) { c = { current: null }; controles.current.set(id, c); } return c; };
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
  const temUnidade = (i: ItemFicha) => (i.tipo === 'numero' || i.tipo === 'inteiro') && (i.unidades.length > 0 || !!i.unidade_efetiva);
  const colunas: ColunaTabela<ItemFicha>[] = [
    { chave: 'atributo', titulo: 'Atributo', tipo: 'texto', valor: (i) => i.rotulo, classe: 'at-v3-c-atr',
      render: (i) => <div data-atributo={i.atributo_id} className="at-v3-atr" title={i.rotulo}><span className="at-v3-atr__txt">{i.rotulo}</span>{i.obrigatorio && <span className="at-obrig" aria-label="obrigatório">*</span>}</div> },
    { chave: 'valor', titulo: 'Valor', tipo: 'texto', valor: (i) => textoDoValor(i), classe: 'at-v3-c-val',
      render: (i) => (
        <div data-atributo={i.atributo_id} className="at-attr__valor at-v3-val">
          {i.autoridade === 'precifica' && <span className="at-v3-cadeado" title="Referência do Precifica · somente leitura"><Icone nome="lock" /><span className="bl-so-leitor">Referência do Precifica · somente leitura</span></span>}
          <EditorValor item={i} productId={f.produto.id} podeEditar={f.pode_editar} aoGravar={recarregar} aoRecarregar={recarregar} linhaV3={{ slotUnidade: slotsUnid[i.atributo_id] ?? null, controle: controleDe(i.atributo_id) }} />
        </div>) },
    { chave: 'unidade', titulo: 'Unidade de medida', tipo: 'texto', ordenavel: false, classe: 'at-v3-c-uni',
      render: (i) => <div data-atributo={i.atributo_id} className="at-v3-uni" ref={refUnid(i.atributo_id)}>{!temUnidade(i) && <span className="at-v3-traco" aria-label="sem unidade">—</span>}</div> },
    { chave: 'situacao', titulo: 'Situação', tipo: 'texto', valor: (i) => ROTULO_SITUACAO[situacaoDe(i)], classe: 'at-v3-c-sit',
      render: (i) => <CelSituacao i={i} f={f} recarregar={recarregar} /> },
    { chave: 'menu', titulo: '', tipo: 'texto', ordenavel: false, classe: 'at-v3-c-menu',
      render: (i) => <MenuLinha i={i} f={f} controle={controleDe(i.atributo_id)} aoHistorico={() => setHist(i)} aoDetalhes={() => setDetalheDe(i)} /> },
    ...(comparar ? [{ chave: 'precifica', titulo: 'Precifica · somente leitura', tipo: 'texto' as const, classe: 'at-v3-c-pre', valor: (i: ItemFicha) => (i.precifica ? fmtPrecifica(i.precifica.chave, i.precifica.valor) : null),
      render: (i: ItemFicha) => <div data-atributo={i.atributo_id} className="at-attr__precifica">{i.precifica ? fmtPrecifica(i.precifica.chave, i.precifica.valor) : <span className="at-fraco">—</span>}</div> }] : []),
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
      </div>
      ); return slotFiltros ? createPortal(filtros, slotFiltros) : <CabecalhoTravado>{filtros}</CabecalhoTravado>; })()}
      {(() => { const titulo = (
        <div className="at-v3-titulo">
          <h3 className="at-ficha__titulo-tabela">Atributos deste produto</h3>
          {f.pode_vincular && <button type="button" className="bl-botao at-v3-btn-add" onClick={() => setAdicionar(true)}><Icone nome="plus" />Adicionar atributo a este produto</button>}
          <button type="button" className={`bl-botao at-v3-btn-comparar ${comparar ? 'ativo' : ''}`} aria-pressed={comparar} onClick={() => setComparar((c) => !c)}
            title={f.precifica.disponivel ? 'Mostra a referência do Precifica ao lado (somente leitura)' : 'Precifica indisponível nesta sessão'} disabled={!f.precifica.disponivel}><Icone nome="columns" />{comparar ? 'Ocultar Precifica' : 'Comparar com Precifica'}</button>
        </div>); return slotTitulo ? createPortal(titulo, slotTitulo) : titulo; })()}
      <Dialogo titulo="Adicionar atributo a este produto" aberto={adicionar} aoFechar={() => setAdicionar(false)} largura={640}>
        <SeletorAdicionar f={f} aoFeito={(alvo) => { setAdicionar(false); setFocar(alvo); recarregar(); }} />
      </Dialogo>
      {itens.length === 0 ? <div className="at-bloco__vazio">Nada neste filtro.</div> : (
        <TabelaDados<ItemFicha> colunas={colunas} linhas={itens} chaveLinha={(i) => i.atributo_id} rolagem="container" className="at-tabela-ficha at-tabela-ficha--v3"
          ordenacao={ordenacao} aoOrdenar={setOrdenacao} legenda="Atributos deste produto"
          {...(agrup === 'nenhum' ? {} : { grupos, grupoDaLinha: (i: ItemFicha) => chaveGrupo(i) })}
          classeLinha={(i) => `at-v3-linha at-v3-linha--${situacaoDe(i)}`} />)}
      {itens.some((i) => i.obrigatorio) && <p className="at-v3-legenda"><span className="at-obrig" aria-hidden>*</span> Campo obrigatório</p>}
      <DetalhesAtributo item={detalheDe} aoFechar={() => setDetalheDe(null)} aoHistorico={(i) => { setDetalheDe(null); setHist(i); }} />
      {f.fora_da_ficha.length > 0 && <SecaoFora f={f} recarregar={recarregar} />}
      {f.legado_nao_vinculado.length > 0 && (
        <div className="at-bloco at-bloco--legado">
          <div className="at-bloco__titulo"><strong>Do legado, sem vínculo</strong><span className="at-filtro__n">{f.legado_nao_vinculado.length}</span><span className="at-fraco at-bloco__desc">Atribuídos a este produto no sistema antigo, mas fora dos kits atuais (ex.: atributos cadastrais inativos).</span></div>
          <EstadoVinculo g={gLeg} />
          {f.legado_nao_vinculado.map((i) => (
            <div key={i.atributo_id} className="at-attr at-attr--legado">
              <div className="at-attr__nome"><span className="at-attr__marca" aria-hidden /><div><div className="at-attr__rotulo">{i.rotulo}</div><div className="at-attr__meta">{!i.atributo_ativo && <Etiqueta tom="aviso">inativo</Etiqueta>}{i.legado?.kit_origem && <ChipKit nome={`Legado: ${i.legado.kit_origem}`} pequeno />}</div></div></div>
              <div className="at-vazio">sem valor</div><div /><div>{f.pode_vincular && i.atributo_ativo && <Botao desligado={gLeg.travado} aoClicar={() => gLeg.gravar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: 'incluir' }, i.rotulo, 'Atributo vinculado a este produto.')}>Vincular a este produto</Botao>}</div>
            </div>))}
        </div>)}
      {f.excecoes.length > 0 && (
        <div className="at-bloco">
          <div className="at-bloco__titulo"><strong>Exceções deste produto</strong><span className="at-filtro__n">{f.excecoes.length}</span><span className="at-fraco at-bloco__desc">Atributos de kit excluídos só neste produto.</span></div>
          <EstadoVinculo g={gExc} />
          {f.excecoes.map((e) => (
            <div key={e.atributo_id} className="at-attr"><div className="at-attr__nome"><div><div className="at-attr__rotulo">{e.rotulo}</div><div className="at-attr__meta">motivo: {e.motivo ?? '—'}</div></div></div><div /><div />
              <div>{f.pode_vincular && <Botao desligado={gExc.travado} aoClicar={() => gExc.gravar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: e.atributo_id, modo: null }, e.rotulo, 'Exceção desfeita.')}>Desfazer exceção</Botao>}</div></div>))}
        </div>)}
      <HistoricoCampo produto={f.produto.id} item={hist} aoFechar={() => setHist(null)} />
    </section>
  );
}

/** UX-1b: estado em palavras (coluna "Estado e sugestão"; também a chave de ordenação). */
/** UX-1b: texto do valor DSHOW para ordenar (vazio = sem valor → vai para o fim). */
function textoDoValor(i: ItemFicha): string | null {
  if (!i.valor) return null;
  if (i.valor.estado !== 'informado') return ESTADO[i.valor.estado] ?? i.valor.estado;
  const un = i.valor.unidade_id ? i.unidades.find((u) => u.id === i.valor?.unidade_id)?.simbolo ?? null : i.unidade_efetiva?.simbolo ?? null;
  return fmtValor(i.valor, un);
}

/** FICHA V3 · coluna Situação: Pendente (vazio de verdade, pela regra de lib/situacao), Preenchido, Não se aplica, Desconhecido.
 *  As sugestões continuam aqui (texto curto + Usar/Recusar). */
function CelSituacao({ i, f, recarregar }: { i: ItemFicha; f: TFicha; recarregar: () => Promise<boolean> | void }) {
  const sit = situacaoDe(i);
  return (
    <div data-atributo={i.atributo_id} className="at-attr__estado at-v3-sit">
      <span className={`at-v3-situacao at-v3-situacao--${sit}`}>{sit === 'pendente' && <Icone nome="alert-triangle" />}{ROTULO_SITUACAO[sit]}</span>
      {i.sugestoes.map((s) => <SugestaoLinha key={s.id} s={s} i={i} f={f} recarregar={recarregar} />)}
    </div>
  );
}

/** FICHA V3 · menu ⋯ da linha: detalhes (origem, código, histórico) e os ESTADOS que saíram da linha (nenhum é apagado ou reinterpretado). */
function MenuLinha({ i, f, controle, aoHistorico, aoDetalhes }: { i: ItemFicha; f: TFicha; controle: React.MutableRefObject<ControleEditor | null>; aoHistorico: () => void; aoDetalhes: () => void }) {
  const [aberto, setAberto] = React.useState(false);
  const raiz = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(false); raiz.current?.querySelector<HTMLElement>('button')?.focus(); } };
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', esc);
    raiz.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);
  const estado = i.valor?.estado ?? null;
  const edita = f.pode_editar && i.autoridade !== 'precifica';
  const item = (rotulo: string, acao: () => void, perigo = false) => <button type="button" role="menuitem" className={`at-v3-menu__item ${perigo ? 'at-v3-menu__item--perigo' : ''}`} onClick={() => { setAberto(false); acao(); }}>{rotulo}</button>;
  return (
    <div className="at-v3-menu" ref={raiz} data-atributo={i.atributo_id}>
      <button type="button" className="at-v3-menu__botao" aria-haspopup="menu" aria-expanded={aberto} aria-label={`Mais ações de ${i.rotulo}`} onClick={() => setAberto((a) => !a)}><Icone nome="more-horizontal" /></button>
      {aberto && (
        <div className="at-v3-menu__lista" role="menu" aria-label={`Ações de ${i.rotulo}`}>
          {item('Detalhes do atributo (origem, código)', aoDetalhes)}
          {item('Histórico do campo', aoHistorico)}
          {edita && <div className="at-v3-menu__sep" role="separator" />}
          {edita && i.aceita_nao_se_aplica && estado !== 'nao_se_aplica' && item('Marcar como “Não se aplica”', () => controle.current?.marcarEstado('nao_se_aplica'))}
          {edita && estado !== 'desconhecido' && item('Marcar como “Desconhecido”', () => controle.current?.marcarEstado('desconhecido'))}
          {edita && estado !== null && estado !== 'informado' && item('Voltar para sem valor', () => controle.current?.voltarParaSemValor())}
          {edita && estado === 'informado' && item('Limpar valor…', () => controle.current?.limparValor(), true)}
        </div>)}
    </div>
  );
}

/** FICHA V3 · o que saiu da linha (importância, "só na web", código, origem do vínculo com o cadeado, quem gravou, legado) fica aqui. */
function DetalhesAtributo({ item: i, aoFechar, aoHistorico }: { item: ItemFicha | null; aoFechar: () => void; aoHistorico: (i: ItemFicha) => void }) {
  return (
    <Dialogo titulo={i ? `Detalhes · ${i.rotulo}` : 'Detalhes'} aberto={i !== null} aoFechar={aoFechar} largura={560}
      rodape={i ? <><Botao aoClicar={() => aoHistorico(i)}>Histórico do campo</Botao><Botao primario aoClicar={aoFechar}>Fechar</Botao></> : undefined}>
      {i && (
        <dl className="at-v3-detalhes">
          <div><dt>Código</dt><dd>{i.codigo ? <code className="at-codigo">{i.codigo}</code> : '—'}</dd></div>
          <div><dt>Importância</dt><dd>{i.importancia ? IMPORTANCIA[i.importancia] : '—'}{i.obrigatorio ? ' · obrigatório neste produto' : ''}{i.destaque ? ' · destaque no app' : ''}</dd></div>
          <div><dt>No app</dt><dd>{i.visivel_app ? 'Aparece no app' : 'Só na web (não aparece no app)'}</dd></div>
          <div><dt>Origem do vínculo</dt><dd>{i.origens.length ? i.origens.map((o, k) => (
            <div key={k}>{o.tipo === 'avulso' ? 'Avulso (só neste produto)' : <><Icone nome="lock" /> Kit {o.grupo_nome} · {(o.motivos ?? []).map((x) => MOTIVO_KIT[x.tipo]).join(', ')} <span className="at-fraco">(o vínculo vem do kit; o valor DSHOW é editável)</span></>}</div>)) : '—'}</dd></div>
          <div><dt>Valor</dt><dd>{i.valor ? <>{i.valor.estado === 'informado' ? 'Informado' : ESTADO[i.valor.estado]} · {i.valor.origem === 'manual' ? 'manual' : 'importado'} · {dataHora(i.valor.atualizado_em)}{i.valor.atualizado_por ? ` · ${i.valor.atualizado_por.replace(/@.*/, '')}` : ''}{i.valor.legado_bruto ? <> · <span className="at-fraco" title="Texto do legado">legado: {i.valor.legado_bruto}</span></> : null}</> : 'Sem valor'}</dd></div>
          {i.legado?.tp_unit && <div><dt>Unidade no legado</dt><dd>{i.legado.tp_unit}</dd></div>}
          {i.descricao && <div><dt>Descrição</dt><dd>{i.descricao}</dd></div>}
          {i.precifica && <div><dt>Precifica (somente leitura)</dt><dd>{fmtPrecifica(i.precifica.chave, i.precifica.valor)}</dd></div>}
        </dl>)}
    </Dialogo>
  );
}

function SugestaoLinha({ s, i, f, recarregar }: { s: Sugestao; i: ItemFicha; f: TFicha; recarregar: () => Promise<boolean> | void }) {
  const m = useModulo();
  const g = useGravacaoVinculo(recarregar);   // chave por intenção + recibo + "Conferir gravação" (ui/GravacaoVinculo)
  const trab = g.travado;
  const un = s.unidade_id ? i.unidades.find((u) => u.id === s.unidade_id)?.simbolo ?? '' : '';
  const decidir = (decisao: 'aceitar' | 'recusar') => {
    const ok = decisao === 'aceitar' ? 'Sugestão aceita.' : 'Sugestão recusada.';
    g.gravar('sugestao', { id: s.id, versao: s.versao, decisao }, `Sugestão de ${i.rotulo}`, ok, () => m.aviso(ok));
  };
  if (s.tipo === 'conferencia') return <div className="at-sugestao" title={s.evidencia ?? ''}><span className="at-sugestao__rot">conferir ({FONTE_SUGESTAO[s.fonte]}):</span> {s.valor_proposto} {un} <button type="button" className="at-link" onClick={() => m.ir('conferencia')}>resolver na Conferência</button></div>;
  return (
    <div className="at-sugestao" title={s.evidencia ?? ''}>
      <span className="at-sugestao__rot" title={`Fonte: ${FONTE_SUGESTAO[s.fonte]}`}>Sugestão:</span> <span className="at-sugestao__val">{sugestaoTexto(s, i)}</span>
      {f.pode_editar && <>{i.valor ? <span className="at-fraco" title="Sugestão não sobrescreve (D10)"> · campo já preenchido</span> : <> · <button type="button" className="at-link" disabled={trab} onClick={() => decidir('aceitar')}>Usar</button></>} · <button type="button" className="at-link at-link--fraco" disabled={trab} onClick={() => decidir('recusar')}>Recusar</button></>}
      <EstadoVinculo g={g} />
    </div>);
}

function SecaoFora({ f, recarregar }: { f: TFicha; recarregar: () => Promise<boolean> | void }) {
  const gFora = useGravacaoVinculo(recarregar);
  const [paraKit, setParaKit] = React.useState<ItemFicha | null>(null);
  return (
    <div className="at-bloco at-bloco--fora">
      <div className="at-bloco__titulo"><strong>Fora da ficha</strong><span className="at-filtro__n">{f.fora_da_ficha.length}</span><span className="at-fraco at-bloco__desc">Há valor gravado, mas o atributo não está vinculado a este produto (nem por kit nem avulso).</span></div>
      <EstadoVinculo g={gFora} />
      {f.fora_da_ficha.map((i) => (
        <div key={i.atributo_id} className="at-attr at-attr--fora">
          <div className="at-attr__nome"><span className="at-attr__marca" aria-hidden /><div><div className="at-attr__rotulo">{i.rotulo}</div><div className="at-attr__meta">{!i.atributo_ativo && <Etiqueta tom="aviso">inativo</Etiqueta>}{i.codigo && <code className="at-codigo">{i.codigo}</code>}</div></div></div>
          <div className="at-attr__valor"><strong>{i.valor ? fmtValor(i.valor, i.unidades.find((u) => u.id === i.valor?.unidade_id)?.simbolo ?? i.unidade_efetiva?.simbolo ?? null) : '—'}</strong></div>
          <div className="at-attr__precifica">{i.precifica ? fmtPrecifica(i.precifica.chave, i.precifica.valor) : <span className="at-fraco">—</span>}</div>
          <div className="at-attr__origem">{f.pode_vincular && i.atributo_ativo && <>
            <Botao desligado={gFora.travado} aoClicar={() => gFora.gravar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: 'incluir' }, i.rotulo, 'Vinculado a este produto.')}>Vincular a este produto</Botao>
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
  const g = useGravacaoVinculo(() => undefined);   // quem recarrega é o aoFeito (depois do recibo)
  const kits = f.kits.filter((k) => !k.motivos.some((x) => x.tipo === 'todos'));
  const confirmar = async () => {
    if (!item || kit === '' || g.travado) return;
    setTrab(true);
    try {
      const d = await obter<{ kit: { id: number; versao: number; atributos: { atributo_id: number; posicao: number; obrigatorio: number; visivel: number; destaque: number; importancia: string | null; unidade_id: number | null }[] } }>('kit', { id: kit });
      const itens = d.kit.atributos.map((a) => ({ atributo_id: a.atributo_id, posicao: a.posicao, obrigatorio: a.obrigatorio, visivel: a.visivel, destaque: a.destaque, importancia: a.importancia, unidade_id: a.unidade_id }));
      itens.push({ atributo_id: item.atributo_id, posicao: Math.max(0, ...itens.map((x) => x.posicao)) + 1, obrigatorio: 0, visivel: 1, destaque: 0, importancia: null, unidade_id: null });
      // a LEITURA do kit não grava nada; a gravação é UMA intenção: corpo montado e congelado com a sua chave ("Tentar de novo" reenvia igual)
      const ok = `"${item.rotulo}" adicionado ao kit.`; const nome = kits.find((k) => k.id === kit)?.nome ?? `Kit ${kit}`;
      await g.gravar('kit_itens', { id: kit, versao: d.kit.versao, itens }, `Kit ${nome}`, ok, () => { m.aviso(ok); aoFeito(); });
    } catch (e) { m.aviso(e instanceof ErroApi ? `Não foi possível ler o kit agora (${e.message}). Nada foi gravado.` : 'Não foi possível ler o kit agora. Nada foi gravado.', 'erro'); } finally { setTrab(false); }
  };
  return (
    <Dialogo titulo={`Adicionar "${item?.rotulo ?? ''}" a um kit`} aberto={item !== null} aoFechar={aoFechar}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><EstadoVinculo g={g} /><Botao primario desligado={kit === '' || g.travado} trabalhando={trab} aoClicar={confirmar}>Adicionar ao kit</Botao></>}>
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
  // chave de operação por intenção + recibo + "Conferir gravação" (ui/GravacaoVinculo), como no editor de valor
  const gKits = useGravacaoVinculo(recarregar); const gAtr = useGravacaoVinculo(recarregar);
  const pode = f.pode_vincular;
  return (
    <div className="at-vinculos">
      <section className="at-painel">
        <div className="at-painel__cabeca"><h3>Kits deste produto</h3><span className="at-fraco">de onde vem cada atributo</span></div>
        <EstadoVinculo g={gKits} />
        <div className="at-painel__corpo">
          {f.kits.length === 0 ? <p className="at-fraco">Nenhum kit vale para este produto.</p> : (
            <ul className="at-kits-produto">{f.kits.map((k) => (
              <li key={k.id}><ChipKit nome={k.nome} /><span>{k.motivos.map((x) => x.tipo === 'escopo' ? `pela subcategoria ${rotuloSubcategoria(x.subcategoria || null)}${x.subcategoria ? '' : ' (categoria inteira)'}` : MOTIVO_KIT[x.tipo]).join(' · ')}</span>
                {pode && k.motivos.some((x) => x.tipo === 'direto') && <Botao desligado={gKits.travado} aoClicar={() => gKits.gravar('produto_kit', { product_id: pid, versao_vinculos: f.versao_vinculos, grupo_id: k.id, ativo: 0 }, `Kit ${k.nome}`, 'Kit removido deste produto.')}>Remover kit direto</Botao>}
                <button type="button" className="at-link" onClick={() => m.ir('kits', { kit: k.id })}>abrir kit</button></li>))}</ul>)}
          {pode && <div style={{ marginTop: 12 }}><SeletorAdicionar f={f} aoFeito={() => recarregar()} /></div>}
        </div>
      </section>
      <section className="at-painel">
        <div className="at-painel__cabeca"><h3>Atributos e origem</h3><span className="at-fraco">exclua um atributo só aqui (exceção ao kit) ou defina a unidade deste produto</span></div>
        <EstadoVinculo g={gAtr} />
        <div className="bl-rola-x">
          <table className="at-tabela">
            <thead><tr><th>Atributo</th><th>Vem de</th><th>Unidade deste produto</th><th>Ações</th></tr></thead>
            <tbody>{f.itens.map((i) => (
              <tr key={i.atributo_id}>
                <td>{i.rotulo}{i.obrigatorio && <span className="at-obrig">*</span>}</td>
                <td>{i.origens.map((o, k) => <span key={k} className="at-origem">{o.tipo === 'avulso' ? 'avulso' : `${o.grupo_nome} (${(o.motivos ?? []).map((x) => MOTIVO_KIT[x.tipo]).join(', ')})`}</span>)}</td>
                <td>{(i.tipo === 'numero' || i.tipo === 'inteiro') && i.unidades.length > 0 ? (
                  <select className="at-campo at-campo--unid" aria-label={`Unidade deste produto para ${i.rotulo}`} disabled={!pode || gAtr.travado} value={i.unidade_produto_id ?? ''}
                    onChange={(e) => { const u = e.target.value ? Number(e.target.value) : null; const avul = i.origens.some((o) => o.tipo === 'avulso');
                      gAtr.gravar('produto_atributo', { product_id: pid, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: u === null ? (avul ? 'incluir' : null) : (avul ? 'incluir' : 'ajustar'), unidade_id: u }, `Unidade de ${i.rotulo}`, 'Unidade deste produto definida.'); }}>
                    <option value="">padrão ({i.unidades.find((u) => u.padrao)?.simbolo ?? i.unidade_efetiva?.simbolo ?? '—'})</option>
                    {i.unidades.map((u) => <option key={u.id} value={u.id}>{u.simbolo}</option>)}
                  </select>) : <span className="at-fraco">—</span>}</td>
                <td>{pode && (i.origens.every((o) => o.tipo === 'avulso')
                  ? <Botao desligado={gAtr.travado} aoClicar={() => gAtr.gravar('produto_atributo', { product_id: pid, versao_vinculos: f.versao_vinculos, atributo_id: i.atributo_id, modo: null }, i.rotulo, 'Atributo avulso removido.')}>Remover avulso</Botao>
                  : <Botao aoClicar={() => { setExcluir(i); setMotivo(''); }}>Excluir só neste produto</Botao>)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>
      <Dialogo titulo={`Excluir "${excluir?.rotulo ?? ''}" só neste produto`} aberto={excluir !== null} aoFechar={() => setExcluir(null)}
        rodape={<><Botao aoClicar={() => setExcluir(null)}>Cancelar</Botao><Botao primario desligado={motivo.trim().length < 3} aoClicar={() => { if (excluir) gAtr.gravar('produto_atributo', { product_id: pid, versao_vinculos: f.versao_vinculos, atributo_id: excluir.atributo_id, modo: 'excluir', motivo }, excluir.rotulo, 'Exceção registrada: o atributo some só neste produto.'); setExcluir(null); }}>Excluir neste produto</Botao></>}>
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
  const g = useGravacaoVinculo(() => undefined);   // quem recarrega é o aoFeito (depois do recibo)
  React.useEffect(() => { obter<{ kits: KitResumo[] }>('kits').then((d) => setKits(d.kits.filter((k) => k.ativo && k.itens > 0))).catch(() => setKits([])); }, []);
  const aplicarKit = () => {
    if (kitNovo === '' || g.travado) return; const k = kitNovo; const nome = kits.find((x) => x.id === k)?.nome ?? `Kit ${k}`; setTrab(true);
    g.gravar('produto_kit', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, grupo_id: k, ativo: 1 }, `Kit ${nome}`, 'Kit aplicado a este produto.', () => { setKitNovo(''); aoFeito({ kit: k }); })
      .finally(() => setTrab(false));
  };
  return (
    <div className="at-acoes">
      <select className="at-campo" aria-label="Kit para aplicar" value={kitNovo} onChange={(e) => setKitNovo(e.target.value ? Number(e.target.value) : '')}>
        <option value="">Aplicar um kit a este produto…</option>{kits.filter((k) => !f.kits.some((x) => x.id === k.id)).map((k) => <option key={k.id} value={k.id}>{k.nome} ({k.itens} atributos)</option>)}
      </select>
      <Botao primario desligado={kitNovo === '' || g.travado} trabalhando={trab} aoClicar={aplicarKit}>Aplicar kit</Botao>
      <Botao aoClicar={() => setAvulso(true)}>Adicionar atributo avulso</Botao>
      <BuscaAvulso aberto={avulso} f={f} aoFechar={() => setAvulso(false)} aoFeito={(aid) => { setAvulso(false); aoFeito({ atributo: aid }); }} />
      <EstadoVinculo g={g} />
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
  const g = useGravacaoVinculo(() => undefined);   // quem recarrega é o aoFeito (depois do recibo)
  const confirmar = () => { if (esc === null || !escolhido || g.travado) return; const aid = esc; setTrab(true); g.gravar('produto_atributo', { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, atributo_id: aid, modo: 'incluir' }, escolhido.rotulo, 'Atributo avulso adicionado.', () => { m.aviso('Atributo avulso adicionado.'); aoFeito(aid); }).finally(() => setTrab(false)); };
  return (
    <Dialogo titulo="Adicionar atributo avulso a este produto" aberto={aberto} aoFechar={aoFechar} largura={640}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><EstadoVinculo g={g} /><Botao primario desligado={!escolhido || g.travado} trabalhando={trab} aoClicar={confirmar}>{escolhido ? `Adicionar ${escolhido.rotulo}` : 'Adicionar'}</Botao></>}>
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
