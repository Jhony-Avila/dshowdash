// panel-atributos/src/screens/kits/ListaKits.tsx — KITS V2 · LISTA (MOCKUP-KITS-LISTA, versão compacta com linhas uniformes).
// Barra: + Criar kit → busca → contagem → Situação → Agrupar → Colunas (no <CabecalhoTravado>: da barra verde até o cabeçalho das colunas
// fica travado; só as linhas rolam). Grade = TabelaDados (ESQUERDA, idêntica) com: Kit | Atributos | Escopo configurado ("Controladoras +3",
// completo no popover) | Aplica a todos | Produtos alcançados | Situação | Ações (lápis = nome/descrição NA LINHA; duplicar; liga/desliga com
// confirmação NA LINHA). Todas as escritas pelo contrato "foi salvo". Nenhum número novo: itens, escopos, aplica_a_todos, diretos e alcance
// vêm de GET kits. Voltar do detalhe mantém busca, situação, ordenação, agrupamento e colunas.
import React from 'react';
import { obter } from '../../lib/api';
import type { KitResumo } from '../../lib/tipos';
import {
  alternarColuna, CHAVE_COLUNAS_LISTA, COLUNAS_LISTA, colunasPadrao, colunasValidas, filtrarKits, grupoDoKit, gruposKits, normalizar, plural, resumoEscopo,
  type Agrupamento, type ColunaLista, type Situacao,
} from '../../lib/kits';
import type { Ordenacao } from '../../lib/ordenar';
import { useModulo } from '../../app/contexto';
import { CabecalhoTravado, Carregando, Dialogo, Botao, Erro } from '../../ui/Comuns';
import { TabelaDados, type ColunaTabela } from '../../ui/TabelaDados';
import { BotaoIcone, Ic, MenuEscolha, PilulaSituacao, SeletorColunas, usePopover, usePreferencia } from './comuns';
import { EstadoGravacao, useGravacao } from './gravacao';

interface RespKits { kits: KitResumo[]; pode_editar: boolean }
type KitBasico = { id: number; nome: string; versao: number; ativo: boolean };

/** Contexto da lista sobrevive à ida ao detalhe (mesma visita). */
const memoria: { busca: string; situacao: Situacao; agrupar: Agrupamento; ordenacao: Ordenacao | null } = { busca: '', situacao: 'ativos', agrupar: 'nenhum', ordenacao: null };

function EscopoResumo({ k }: { k: KitResumo }) {
  const r = resumoEscopo(k.escopos);
  const p = usePopover(); const id = React.useId();
  if (r.vazio) return <span className="at-kv__fraco" title="Nenhuma subcategoria configurada">—</span>;
  const titulo = r.completo.join(' · ');
  return (
    <div className="at-kv__pop at-kv__escopo" ref={p.raiz} data-escopo>
      <span className="at-kv__escopo-txt" title={titulo}>{r.curto}</span>
      {r.extras > 0 && (
        <button ref={p.botao} type="button" className="at-kv__mais" aria-expanded={p.aberto} aria-controls={id} onClick={() => p.setAberto(!p.aberto)}
          aria-label={`Ver o escopo completo de ${k.nome}: ${r.completo.length} itens`} title={titulo} data-escopo-mais>+{r.extras}</button>)}
      {p.aberto && (
        <div id={id} className="at-kv__menu at-kv__menu--escopo" role="dialog" aria-label={`Escopo configurado de ${k.nome}`} data-escopo-completo>
          <strong>Escopo configurado · {r.completo.length}</strong>
          <ul>{r.completo.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>)}
    </div>);
}

// ── edição na linha (lápis): nome e descrição ───────────────────────────────────────────────────────────────────────────────────────────
function EdicaoNaLinha({ k, serial, aoFechar, aoSalvo }: { k: KitResumo; serial: React.MutableRefObject<boolean>; aoFechar: () => void; aoSalvo: () => void }) {
  const [nome, setNome] = React.useState(k.nome);
  const [descricao, setDescricao] = React.useState(k.descricao ?? '');
  const g = useGravacao(`lista-${k.id}`, serial);
  const sujo = nome.trim() !== k.nome || descricao.trim() !== (k.descricao ?? '').trim();
  const salvar = () => {
    if (!nome.trim()) return;
    void g.gravar('kit', { id: k.id, versao: k.versao, nome: nome.trim(), descricao: descricao.trim() || null }, () => aoSalvo());
  };
  return (
    <form className="at-kv-linha-edicao" onSubmit={(e) => { e.preventDefault(); salvar(); }} onKeyDown={(e) => { if (e.key === 'Escape' && !g.ocupada) { e.stopPropagation(); aoFechar(); } }} data-edicao-linha={k.id}>
      <label className="at-kv__campo at-kv__campo--nome"><span>Nome</span>
        <input className="at-campo" value={nome} maxLength={160} autoFocus onChange={(e) => setNome(e.target.value)} aria-invalid={!nome.trim()} />
      </label>
      <label className="at-kv__campo at-kv__campo--larga"><span>Descrição</span>
        <input className="at-campo" value={descricao} maxLength={500} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <div className="at-kv__acoes-form">
        <EstadoGravacao g={g} aoRecarregar={aoSalvo} rotuloRecarregar="Recarregar a lista" />
        <Botao aoClicar={aoFechar} desligado={g.ocupada}>Cancelar</Botao>
        <Botao primario tipo="submit" desligado={!sujo || !nome.trim() || g.incerta} trabalhando={g.sit.fase === 'salvando'}>Salvar</Botao>
      </div>
    </form>);
}

// ── liga/desliga com confirmação na linha ───────────────────────────────────────────────────────────────────────────────────────────────
function AtivoNaLinha({ k, serial, aoFechar, aoSalvo }: { k: KitResumo; serial: React.MutableRefObject<boolean>; aoFechar: () => void; aoSalvo: () => void }) {
  const [motivo, setMotivo] = React.useState('');
  const g = useGravacao(`ativo-${k.id}`, serial);
  const desativar = !!k.ativo;
  const confirmar = () => void g.gravar('kit_ativo', { id: k.id, versao: k.versao, ativo: desativar ? 0 : 1, motivo: motivo.trim() || undefined }, () => aoSalvo());
  return (
    <div className="at-kv-linha-edicao" role="group" aria-label={desativar ? `Desativar ${k.nome}` : `Ativar ${k.nome}`} data-ativo-linha={k.id}>
      <p className="at-kv__antes-depois">
        <strong>{desativar ? 'Desativar' : 'Ativar'} o kit</strong> · situação <PilulaSituacao ativo={desativar} /> → <PilulaSituacao ativo={!desativar} />
        <span className="at-kv__fraco">{desativar
          ? ` Deixa de valer para os ${k.alcance.toLocaleString('pt-BR')} produtos alcançados hoje. Nada é apagado: atributos, escopo e valores ficam guardados.`
          : ' Volta a valer para o escopo, os avulsos e o "aplica a todos" que estavam configurados.'}</span>
      </p>
      <label className="at-kv__campo at-kv__campo--larga"><span>Motivo (opcional)</span>
        <input className="at-campo" value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} />
      </label>
      <div className="at-kv__acoes-form">
        <EstadoGravacao g={g} aoRecarregar={aoSalvo} rotuloRecarregar="Recarregar a lista" />
        <Botao aoClicar={aoFechar} desligado={g.ocupada}>Cancelar</Botao>
        <Botao primario={!desativar} perigo={desativar} desligado={g.incerta} trabalhando={g.sit.fase === 'salvando'} aoClicar={confirmar}>{desativar ? 'Desativar' : 'Ativar'}</Botao>
      </div>
    </div>);
}

// ── duplicar (operação existente: atributos sempre; escopo se pedido; avulsos nunca) ───────────────────────────────────────────────────
export function DialogoDuplicar({ kit, serial, aoFechar, aoDuplicado }: { kit: { id: number; nome: string } | null; serial: React.MutableRefObject<boolean>; aoFechar: () => void; aoDuplicado: (id: number | null, nome: string) => void }) {
  const [nome, setNome] = React.useState('');
  const [comEscopos, setComEscopos] = React.useState(false);
  const g = useGravacao<{ kit?: KitBasico }>(`duplicar-${kit?.id ?? 0}`, serial);
  React.useEffect(() => { if (kit) { setNome(`${kit.nome} (cópia)`); setComEscopos(false); g.limpar(); } }, [kit]);   // eslint-disable-line react-hooks/exhaustive-deps
  const duplicar = () => { if (kit && nome.trim()) void g.gravar('kit_duplicar', { id: kit.id, nome: nome.trim(), com_escopos: comEscopos ? 1 : 0 }, (d) => aoDuplicado(d?.kit?.id ?? null, nome.trim())); };
  return (
    <Dialogo titulo={kit ? `Duplicar "${kit.nome}"` : 'Duplicar kit'} aberto={!!kit} aoFechar={() => { if (!g.ocupada) aoFechar(); }}
      rodape={<><EstadoGravacao g={g} /><Botao aoClicar={aoFechar} desligado={g.ocupada}>Cancelar</Botao><Botao primario desligado={!nome.trim() || g.incerta} trabalhando={g.sit.fase === 'salvando'} aoClicar={duplicar}>Criar cópia</Botao></>}>
      <form className="at-kv-form" onSubmit={(e) => { e.preventDefault(); duplicar(); }}>
        <label className="at-kv__campo"><span>Nome do novo kit</span><input className="at-campo" value={nome} maxLength={160} onChange={(e) => setNome(e.target.value)} required /></label>
        <label className="at-check"><input type="checkbox" checked={comEscopos} onChange={(e) => setComEscopos(e.target.checked)} /> Copiar também o escopo (subcategorias)</label>
        <p className="at-kv__fraco">Os atributos e suas configurações são copiados. Produtos avulsos não são copiados.</p>
      </form>
    </Dialogo>);
}

// ── criar: rascunho no topo (nome/descrição) → configuração da composição após a criação confirmada ───────────────────────────────────
function RascunhoCriar({ serial, aoCancelar, aoCriado }: { serial: React.MutableRefObject<boolean>; aoCancelar: () => void; aoCriado: (id: number | null, nome: string) => void }) {
  const [nome, setNome] = React.useState(''); const [descricao, setDescricao] = React.useState('');
  const g = useGravacao<{ kit?: KitBasico }>('criar', serial);
  const criar = () => { if (nome.trim()) void g.gravar('kit', { nome: nome.trim(), descricao: descricao.trim() || null, aplica_a_todos: 0 }, (d) => aoCriado(d?.kit?.id ?? null, nome.trim())); };
  return (
    <form className="at-kv-rascunho" onSubmit={(e) => { e.preventDefault(); criar(); }} onKeyDown={(e) => { if (e.key === 'Escape' && !g.ocupada) aoCancelar(); }} aria-label="Novo kit (rascunho)" data-rascunho-kit>
      <span className="at-kv__rascunho-rotulo">Novo kit</span>
      <label className="at-kv__campo at-kv__campo--nome"><span>Nome</span><input className="at-campo" value={nome} maxLength={160} autoFocus onChange={(e) => setNome(e.target.value)} /></label>
      <label className="at-kv__campo at-kv__campo--larga"><span>Descrição (opcional)</span><input className="at-campo" value={descricao} maxLength={500} onChange={(e) => setDescricao(e.target.value)} /></label>
      <div className="at-kv__acoes-form">
        <EstadoGravacao g={g} />
        <Botao aoClicar={aoCancelar} desligado={g.ocupada}>Cancelar</Botao>
        <Botao primario tipo="submit" desligado={!nome.trim() || g.incerta} trabalhando={g.sit.fase === 'salvando'}>Criar kit</Botao>
      </div>
    </form>);
}

export function ListaKits({ aoAbrir, aoCriado }: { aoAbrir: (id: number) => void; aoCriado: (id: number) => void }) {
  const nav = useModulo();
  const [dados, setDados] = React.useState<RespKits | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [busca, setBusca] = React.useState(memoria.busca);
  const [situacao, setSituacao] = React.useState<Situacao>(memoria.situacao);
  const [agrupar, setAgrupar] = React.useState<Agrupamento>(memoria.agrupar);
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao | null>(memoria.ordenacao);
  const [colunas, setColunas] = usePreferencia<ColunaLista>(CHAVE_COLUNAS_LISTA, (v) => colunasValidas(COLUNAS_LISTA, v));
  const [aberta, setAberta] = React.useState<{ id: number; modo: 'editar' | 'ativo' } | null>(null);
  const [criando, setCriando] = React.useState(false);
  const [duplicando, setDuplicando] = React.useState<KitResumo | null>(null);
  const serial = React.useRef(false);
  React.useEffect(() => { Object.assign(memoria, { busca, situacao, agrupar, ordenacao }); }, [busca, situacao, agrupar, ordenacao]);

  const carregar = React.useCallback(async () => {
    setErro(null);
    try { const d = await obter<RespKits>('kits'); setDados(d); return d; } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao carregar os kits.'); return null; }
  }, []);
  React.useEffect(() => { void carregar(); }, [carregar, nav.versao]);
  /** Depois de criar/duplicar: abre pelo id do recibo; sem resposta (confirmado pelo "Conferir gravação") acha pelo nome na lista relida. */
  const abrirCriado = async (id: number | null, nome: string, recem: boolean) => {
    let alvo = id;
    if (alvo == null) { const d = await carregar(); alvo = d?.kits.find((k) => normalizar(k.nome) === normalizar(nome))?.id ?? null; }
    if (alvo == null) { nav.aviso('Kit criado. Não foi possível abri-lo agora: procure-o na lista.', 'erro'); return; }
    nav.aviso(`Kit "${nome}" criado.`);
    if (recem) aoCriado(alvo); else aoAbrir(alvo);
  };

  const pode = !!dados?.pode_editar;
  const visiveis = dados ? filtrarKits(dados.kits, situacao, busca) : [];
  const total = dados?.kits.length ?? 0;
  const grupos = gruposKits(agrupar);

  const cols = React.useMemo<ColunaTabela<KitResumo>[]>(() => {
    const todas: Record<ColunaLista, ColunaTabela<KitResumo>> = {
      kit: { chave: 'kit', titulo: 'Kit', tipo: 'texto', valor: (k) => k.nome, classe: 'at-kv__col-kit',
        render: (k) => <button type="button" className="at-kv__nome" onClick={() => aoAbrir(k.id)} title={k.nome} data-abrir-kit={k.id}>{k.nome}</button> },
      descricao: { chave: 'descricao', titulo: 'Descrição', tipo: 'texto', valor: (k) => k.descricao, classe: 'at-kv__col-desc',
        render: (k) => (k.descricao ? <span className="at-kv__corta" title={k.descricao}>{k.descricao}</span> : <span className="at-kv__fraco">—</span>) },
      itens: { chave: 'itens', titulo: 'Atributos', tipo: 'numero', valor: (k) => Number(k.itens) },
      escopo: { chave: 'escopo', titulo: 'Escopo configurado', tipo: 'texto', valor: (k) => (resumoEscopo(k.escopos).vazio ? null : resumoEscopo(k.escopos).completo.join(' ')),
        classe: 'at-kv__col-escopo', render: (k) => <EscopoResumo k={k} /> },
      aplica_a_todos: { chave: 'aplica_a_todos', titulo: 'Aplica a todos', tipo: 'texto', alinhamento: 'centro', valor: (k) => (k.aplica_a_todos ? 'Sim' : 'Não'),
        render: (k) => (k.aplica_a_todos ? <span className="at-kv__pilula at-kv__pilula--info">Sim</span> : <span className="at-kv__nao">Não</span>) },
      diretos: { chave: 'diretos', titulo: 'Avulsos', tipo: 'numero', valor: (k) => Number(k.diretos) },
      alcance: { chave: 'alcance', titulo: 'Produtos alcançados', tipo: 'numero', valor: (k) => Number(k.alcance), render: (k) => Number(k.alcance).toLocaleString('pt-BR') },
      situacao: { chave: 'situacao', titulo: 'Situação', tipo: 'texto', alinhamento: 'centro', valor: (k) => (k.ativo ? 'Ativo' : 'Inativo'), render: (k) => <PilulaSituacao ativo={!!k.ativo} /> },
      acoes: { chave: 'acoes', titulo: 'Ações', tipo: 'texto', alinhamento: 'centro', ordenavel: false, classe: 'at-kv__col-acoes',
        render: (k) => (
          <span className="at-kv__acoes">
            {pode && <BotaoIcone nome="lapis" rotulo={`Editar nome e descrição de ${k.nome}`} aoClicar={() => setAberta({ id: k.id, modo: 'editar' })} data-acao="editar" />}
            {pode && <BotaoIcone nome="copiar" rotulo={`Duplicar ${k.nome}`} aoClicar={() => setDuplicando(k)} data-acao="duplicar" />}
            {pode && <BotaoIcone nome="energia" tom={k.ativo ? 'aviso' : undefined} rotulo={k.ativo ? `Desativar ${k.nome}` : `Ativar ${k.nome}`} aoClicar={() => setAberta({ id: k.id, modo: 'ativo' })} data-acao="ativo" />}
            {!pode && <button type="button" className="at-link" onClick={() => aoAbrir(k.id)}>Ver</button>}
          </span>) },
    };
    return colunas.map((c) => todas[c]);
  }, [colunas, pode, aoAbrir]);

  if (erro && !dados) return <Erro mensagem={erro} aoTentar={() => void carregar()} />;
  const filtrando = !!busca.trim() || situacao !== 'ativos';
  return (
    <div className="at-kv at-kv--lista">
      <CabecalhoTravado>
        <div className="at-kv__barra" data-barra-kits>
          {pode && <button type="button" className="at-kv__primario" onClick={() => setCriando(true)} disabled={criando} data-criar-kit><Ic nome="mais" />Criar kit</button>}
          <label className="at-kv__busca"><Ic nome="busca" />
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar kit pelo nome" aria-label="Buscar kit pelo nome" />
          </label>
          <span className="at-kv__contagem" aria-live="polite" data-contagem>{dados ? plural(visiveis.length, 'kit', 'kits') : 'Carregando…'}</span>
          <span className="at-kv__espaco" />
          <MenuEscolha rotulo="Situação" valor={situacao} aoEscolher={setSituacao} data-menu="situacao"
            opcoes={[{ valor: 'ativos', rotulo: 'Ativos' }, { valor: 'inativos', rotulo: 'Inativos' }, { valor: 'todos', rotulo: 'Todos' }]} />
          <MenuEscolha rotulo="Agrupar" valor={agrupar} aoEscolher={setAgrupar} data-menu="agrupar" resumo={(v) => (v === 'situacao' ? 'Por situação' : v === 'aplica_a_todos' ? 'Por "aplica a todos"' : '')}
            opcoes={[{ valor: 'nenhum', rotulo: 'Sem agrupamento' }, { valor: 'situacao', rotulo: 'Por situação' }, { valor: 'aplica_a_todos', rotulo: 'Por "aplica a todos"' }]} />
          <SeletorColunas catalogo={COLUNAS_LISTA} visiveis={colunas} legenda="Colunas visíveis da lista de kits"
            aoMudar={(id) => setColunas(alternarColuna(COLUNAS_LISTA, colunas, id))} aoRestaurar={() => setColunas(colunasPadrao(COLUNAS_LISTA))} />
        </div>
      </CabecalhoTravado>

      {criando && <RascunhoCriar serial={serial} aoCancelar={() => setCriando(false)} aoCriado={(id, nome) => { setCriando(false); void abrirCriado(id, nome, true); }} />}
      {agrupar !== 'nenhum' && <p className="at-kv__agrupado" data-agrupado>Agrupado {agrupar === 'situacao' ? 'por situação' : 'por "aplica a todos"'} · <button type="button" className="at-link" onClick={() => setAgrupar('nenhum')}>voltar à lista plana</button></p>}

      <section className="at-kv__cartao" aria-label="Lista de kits">
        {!dados ? <Carregando rotulo="Carregando kits" />
          : visiveis.length === 0 ? (
            <div className="at-kv__vazio" data-vazio>
              {total === 0 ? <><strong>Nenhum kit cadastrado.</strong>{pode && <span> Crie o primeiro com “Criar kit”.</span>}</>
                : <><strong>Nenhum kit com esses filtros.</strong> <button type="button" className="at-link" onClick={() => { setBusca(''); setSituacao('ativos'); }}>Limpar filtros</button>
                  {situacao === 'ativos' && dados.kits.some((k) => !k.ativo) ? <span className="at-kv__fraco"> Há kits inativos: escolha “Situação: Todos”.</span> : null}</>}
            </div>
          ) : (
            <TabelaDados<KitResumo> colunas={cols} linhas={visiveis} chaveLinha={(k) => k.id} rolagem="container" className="at-kv__tabela at-kv__tabela--lista"
              legenda="Kits de atributos" ordenacao={ordenacao} aoOrdenar={setOrdenacao}
              grupos={grupos ?? undefined} grupoDaLinha={grupos ? (k) => grupoDoKit(agrupar, k) : undefined}
              classeLinha={(k) => (k.ativo ? undefined : 'at-kv__linha--inativa')}
              expandida={aberta?.id ?? null} aoAlternarExpansao={() => setAberta(null)}
              renderExpansao={(k) => (aberta?.modo === 'ativo'
                ? <AtivoNaLinha k={k} serial={serial} aoFechar={() => setAberta(null)} aoSalvo={() => { setAberta(null); nav.aviso(k.ativo ? `Kit "${k.nome}" desativado.` : `Kit "${k.nome}" ativado.`); void carregar(); }} />
                : <EdicaoNaLinha k={k} serial={serial} aoFechar={() => setAberta(null)} aoSalvo={() => { setAberta(null); nav.aviso(`Kit "${k.nome}": nome e descrição salvos.`); void carregar(); }} />)} />
          )}
        {filtrando && dados && visiveis.length > 0 && <p className="bl-so-leitor">{plural(visiveis.length, 'kit exibido', 'kits exibidos')} de {total}.</p>}
      </section>

      <DialogoDuplicar kit={duplicando} serial={serial} aoFechar={() => setDuplicando(null)} aoDuplicado={(id, nome) => { setDuplicando(null); void abrirCriado(id, nome, false); }} />
    </div>);
}
