// panel-atributos/src/screens/Kits.tsx — Kits (missão §11.5): lista (criar, duplicar, desativar/reativar; nunca apagar) e editor
// (nome/descrição, itens com reordenação, escopo com efeito antes de salvar, "aplica a todos", produtos avulsos e alcançados).
// Gravação sem interface otimista: só diz "salvo" depois da resposta; cada gravação recarrega o kit para usar a versão nova (409 = conflito).
import React from 'react';
import '../styles/kits.css';
import { obter, enviar, ErroApi } from '../lib/api';
import type { KitResumo, KitDetalhe, ItemKit, Importancia, Unidade, AtributoDicionario, TipoAtributo } from '../lib/tipos';
import { IMPORTANCIA, IMPORTANCIAS, TIPO, rotuloCategoria, rotuloSubcategoria } from '../lib/rotulos';
import { Botao, Dialogo, ChipKit, Etiqueta, Carregando, Vazio, Erro } from '../ui/Comuns';
import { useModulo } from '../app/contexto';

const MAX_DESTAQUES = 4;
interface Escopo { categoria: string; subcategoria: string }
interface SubcatAtivos { categoria: string; subcategoria: string; ativos: number }
interface RespKits { kits: KitResumo[]; subcategorias: SubcatAtivos[]; pode_editar: boolean }
interface ProdutoVitrine { id: number; nome: string; categoria: string; subcategoria: string | null; ativo: boolean }

const msgErro = (e: unknown) => (e instanceof ErroApi ? e.message : e instanceof Error ? e.message : 'Falha inesperada.');
const chaveEscopo = (e: Escopo) => `${e.categoria}|${e.subcategoria}`;
const rotuloEscopo = (e: Escopo) => (e.subcategoria === '' ? `Todas as subcategorias de ${rotuloCategoria(e.categoria)}` : rotuloSubcategoria(e.subcategoria));
const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const MOTIVO: Record<string, string> = { escopo: 'pela subcategoria', direto: 'avulso', todos: 'todos os produtos' };

/** Produtos ativos cobertos por um conjunto de escopos (sem contar duas vezes subcategoria + categoria inteira). */
function contarCobertos(escopos: Set<string>, subcats: SubcatAtivos[], todos: boolean): number {
  let n = 0;
  for (const s of subcats) if (todos || escopos.has(`${s.categoria}|`) || (s.subcategoria !== '' && escopos.has(`${s.categoria}|${s.subcategoria}`))) n += s.ativos;
  return n;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export function Kits(_: Record<string, unknown> = {}) {
  const nav = useModulo();
  const id = nav.aba === 'kits' ? nav.kit : null;
  const abrir = (k: number | null) => nav.ir('kits', { kit: k });
  return id ? <EditorKit key={id} id={id} aoVoltar={() => abrir(null)} aoAbrir={abrir} /> : <ListaKits aoAbrir={abrir} />;
}

// ── Lista ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function ListaKits({ aoAbrir }: { aoAbrir: (id: number) => void }) {
  const nav = useModulo();
  const [dados, setDados] = React.useState<RespKits | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [inativos, setInativos] = React.useState(false);
  const [busca, setBusca] = React.useState('');
  const [criando, setCriando] = React.useState(false);
  const [duplicando, setDuplicando] = React.useState<KitResumo | null>(null);
  const [mudandoAtivo, setMudandoAtivo] = React.useState<KitResumo | null>(null);

  const carregar = React.useCallback(() => {
    setErro(null);
    obter<RespKits>('kits').then(setDados).catch((e) => setErro(msgErro(e)));
  }, []);
  React.useEffect(() => { carregar(); }, [carregar, nav.versao]);

  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!dados) return <Carregando rotulo="Carregando kits" />;

  const nInativos = dados.kits.filter((k) => !k.ativo).length;
  const termo = normalizar(busca.trim());
  const visiveis = dados.kits.filter((k) => (inativos || k.ativo) && (!termo || normalizar(k.nome).includes(termo)));
  const pode = dados.pode_editar;

  return (
    <div className="at-kits-pilha">
      <div className="at-titulo-tela">
        <div>
          <h2>Kits de atributos</h2>
          <p>Cada kit é um conjunto de atributos que vale para as subcategorias escolhidas, para produtos avulsos ou para todos os produtos. Kits não são apagados: só desativados.</p>
        </div>
        {pode && <div className="at-acoes"><Botao primario aoClicar={() => setCriando(true)}>+ Criar kit</Botao></div>}
      </div>

      <div className="at-barra-ferramentas">
        <label className="at-busca">
          <span aria-hidden>⌕</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar kit pelo nome" aria-label="Buscar kit pelo nome" />
        </label>
        <button type="button" className={`at-filtro ${inativos ? 'at-filtro--ativo' : ''}`} aria-pressed={inativos} onClick={() => setInativos((v) => !v)}>
          Mostrar inativos <span className="at-filtro__n">{nInativos}</span>
        </button>
        <span className="at-filtros__total">{plural(visiveis.length, 'kit', 'kits')}</span>
      </div>

      {visiveis.length === 0 ? (
        <Vazio titulo={termo ? 'Nenhum kit com esse nome.' : 'Nenhum kit ativo.'}>
          {!inativos && nInativos > 0 ? 'Há kits inativos ocultos; ligue "Mostrar inativos" para vê-los.' : pode ? 'Crie um kit para começar.' : null}
        </Vazio>
      ) : (
        <div className="at-painel bl-rola-x">
          <table className="at-tabela at-kits-tabela">
            <thead>
              <tr>
                <th scope="col">Kit</th><th scope="col" className="at-kits-num">Atributos</th><th scope="col">Escopo</th><th scope="col">Aplica a todos</th>
                <th scope="col" className="at-kits-num">Avulsos</th><th scope="col" className="at-kits-num">Produtos alcançados</th><th scope="col">Situação</th>
                <th scope="col" className="at-kits-col-acoes"><span className="bl-so-leitor">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((k) => (
                <tr key={k.id} className={k.ativo ? '' : 'at-kits-linha--inativa'} onClick={() => aoAbrir(k.id)}>
                  <td className="at-kits-nome">
                    <ChipKit nome={k.nome} />
                    {k.descricao && <span className="at-kits-nome__desc">{k.descricao}</span>}
                  </td>
                  <td className="at-kits-num">{k.itens}</td>
                  <td>
                    <div className="at-kits-escopos">
                      {k.escopos.length === 0 ? <span className="at-fraco">—</span>
                        : k.escopos.map((e) => <Etiqueta key={chaveEscopo(e)} titulo={`${e.produtos} produtos ativos`}>{rotuloEscopo(e)}</Etiqueta>)}
                    </div>
                  </td>
                  <td>{k.aplica_a_todos ? <Etiqueta tom="info">Sim</Etiqueta> : <span className="at-fraco">Não</span>}</td>
                  <td className="at-kits-num">{k.diretos}</td>
                  <td className="at-kits-num">{k.alcance.toLocaleString('pt-BR')}</td>
                  <td>{k.ativo ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta>Inativo</Etiqueta>}</td>
                  <td className="at-kits-col-acoes" onClick={(e) => e.stopPropagation()}>
                    <div className="at-acoes">
                      <Botao aoClicar={() => aoAbrir(k.id)} titulo={`Abrir o kit ${k.nome}`}>{pode ? 'Editar' : 'Ver'}</Botao>
                      {pode && <Botao aoClicar={() => setDuplicando(k)} titulo={`Criar um kit a partir de ${k.nome}`}>Duplicar</Botao>}
                      {pode && <Botao perigo={k.ativo} aoClicar={() => setMudandoAtivo(k)}>{k.ativo ? 'Desativar' : 'Reativar'}</Botao>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DialogoCriar aberto={criando} aoFechar={() => setCriando(false)} aoCriar={(novo) => { setCriando(false); nav.aviso(`Kit "${novo.nome}" criado.`); aoAbrir(novo.id); }} />
      <DialogoDuplicar kit={duplicando} aoFechar={() => setDuplicando(null)}
        aoDuplicar={(novo) => { setDuplicando(null); nav.aviso(`Kit "${novo.nome}" criado a partir de outro.`); aoAbrir(novo.id); }} />
      <DialogoAtivo kit={mudandoAtivo} aoFechar={() => setMudandoAtivo(null)}
        aoMudar={(k) => { setMudandoAtivo(null); nav.aviso(k.ativo ? `Kit "${k.nome}" reativado.` : `Kit "${k.nome}" desativado.`); carregar(); }} />
    </div>
  );
}

// ── Diálogos ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
type KitBasico = { id: number; nome: string; versao: number; ativo: boolean };

function DialogoCriar({ aberto, aoFechar, aoCriar }: { aberto: boolean; aoFechar: () => void; aoCriar: (k: KitBasico) => void }) {
  const [nome, setNome] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [todos, setTodos] = React.useState(false);
  const [gravando, setGravando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  React.useEffect(() => { if (aberto) { setNome(''); setDescricao(''); setTodos(false); setErro(null); } }, [aberto]);
  const criar = async () => {
    if (!nome.trim()) { setErro('Informe o nome do kit.'); return; }
    setGravando(true); setErro(null);
    try {
      const r = await enviar<{ kit: KitBasico }>('kit', { nome: nome.trim(), descricao: descricao.trim() || null, aplica_a_todos: todos ? 1 : 0 });
      aoCriar(r.kit);
    } catch (e) { setErro(msgErro(e)); } finally { setGravando(false); }
  };
  return (
    <Dialogo titulo="Criar kit" aberto={aberto} aoFechar={aoFechar}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><Botao primario trabalhando={gravando} aoClicar={criar}>Criar kit</Botao></>}>
      <form className="at-kits-pilha" onSubmit={(e) => { e.preventDefault(); void criar(); }}>
        {erro && <p className="at-kits-erro" role="alert">{erro}</p>}
        <label className="at-rotulo-campo">Nome
          <input className="at-campo" value={nome} maxLength={160} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label className="at-rotulo-campo">Descrição (opcional)
          <textarea className="at-campo" rows={3} value={descricao} maxLength={500} onChange={(e) => setDescricao(e.target.value)} />
        </label>
        <label className="at-check"><input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} /> Aplica a todos os produtos</label>
        <p className="at-kits-dica">Depois de criar, você escolhe os atributos, o escopo e os produtos avulsos.</p>
      </form>
    </Dialogo>
  );
}

function DialogoDuplicar({ kit, aoFechar, aoDuplicar }: { kit: { id: number; nome: string } | null; aoFechar: () => void; aoDuplicar: (k: KitBasico) => void }) {
  const [nome, setNome] = React.useState('');
  const [comEscopos, setComEscopos] = React.useState(false);
  const [gravando, setGravando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  React.useEffect(() => { if (kit) { setNome(`${kit.nome} (cópia)`); setComEscopos(false); setErro(null); } }, [kit]);
  const duplicar = async () => {
    if (!kit) return;
    if (!nome.trim()) { setErro('Informe o nome do novo kit.'); return; }
    setGravando(true); setErro(null);
    try { const r = await enviar<{ kit: KitBasico }>('kit_duplicar', { id: kit.id, nome: nome.trim(), com_escopos: comEscopos ? 1 : 0 }); aoDuplicar(r.kit); }
    catch (e) { setErro(msgErro(e)); } finally { setGravando(false); }
  };
  return (
    <Dialogo titulo={kit ? `Criar a partir de "${kit.nome}"` : 'Duplicar kit'} aberto={!!kit} aoFechar={aoFechar}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><Botao primario trabalhando={gravando} aoClicar={duplicar}>Criar cópia</Botao></>}>
      <form className="at-kits-pilha" onSubmit={(e) => { e.preventDefault(); void duplicar(); }}>
        {erro && <p className="at-kits-erro" role="alert">{erro}</p>}
        <label className="at-rotulo-campo">Nome do novo kit
          <input className="at-campo" value={nome} maxLength={160} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label className="at-check"><input type="checkbox" checked={comEscopos} onChange={(e) => setComEscopos(e.target.checked)} /> Copiar também o escopo (subcategorias)</label>
        <p className="at-kits-dica">Os atributos e suas configurações são copiados. Produtos avulsos não são copiados.</p>
      </form>
    </Dialogo>
  );
}

function DialogoAtivo({ kit, aoFechar, aoMudar }: { kit: KitBasico | null; aoFechar: () => void; aoMudar: (k: KitBasico) => void }) {
  const [motivo, setMotivo] = React.useState('');
  const [gravando, setGravando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  React.useEffect(() => { if (kit) { setMotivo(''); setErro(null); } }, [kit]);
  const desativar = !!kit?.ativo;
  const confirmar = async () => {
    if (!kit) return;
    setGravando(true); setErro(null);
    try {
      const r = await enviar<{ kit: KitBasico }>('kit_ativo', { id: kit.id, versao: kit.versao, ativo: desativar ? 0 : 1, motivo: motivo.trim() || undefined });
      aoMudar({ ...r.kit, ativo: Boolean(Number(r.kit.ativo)) });
    } catch (e) { setErro(e instanceof ErroApi && e.conflito ? 'Este kit foi alterado por outra pessoa. Feche, recarregue e tente de novo.' : msgErro(e)); }
    finally { setGravando(false); }
  };
  return (
    <Dialogo titulo={desativar ? 'Desativar kit' : 'Reativar kit'} aberto={!!kit} aoFechar={aoFechar}
      rodape={<><Botao aoClicar={aoFechar}>Cancelar</Botao><Botao primario={!desativar} perigo={desativar} trabalhando={gravando} aoClicar={confirmar}>{desativar ? 'Desativar' : 'Reativar'}</Botao></>}>
      <div className="at-kits-pilha">
        {erro && <p className="at-kits-erro" role="alert">{erro}</p>}
        <p style={{ margin: 0 }}>
          {desativar
            ? <>O kit <strong>{kit?.nome}</strong> deixa de valer para os produtos. Nada é apagado: atributos, escopo e valores já preenchidos continuam guardados e o kit pode ser reativado.</>
            : <>O kit <strong>{kit?.nome}</strong> volta a valer para o escopo, os produtos avulsos e o "aplica a todos" que estavam configurados.</>}
        </p>
        <label className="at-rotulo-campo">Motivo (opcional)
          <input className="at-campo" value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} />
        </label>
      </div>
    </Dialogo>
  );
}

// ── Editor ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Secao = 'dados' | 'itens' | 'escopo' | 'avulsos';
type ItemRascunho = ItemKit & { novo?: boolean };

const ordenarItens = (l: ItemKit[]) => [...l].sort((a, b) => a.posicao - b.posicao);
const assinaturaItens = (l: ItemKit[]) => JSON.stringify(l.map((i) => [i.atributo_id, +i.obrigatorio, +i.visivel, +i.destaque, i.importancia ?? null, i.unidade_id ?? null]));

function EditorKit({ id, aoVoltar, aoAbrir }: { id: number; aoVoltar: () => void; aoAbrir: (id: number) => void }) {
  const nav = useModulo();
  const [det, setDet] = React.useState<KitDetalhe | null>(null);
  const [erroCarga, setErroCarga] = React.useState<string | null>(null);
  const [erros, setErros] = React.useState<Partial<Record<Secao, { msg: string; conflito: boolean }>>>({});
  const [gravando, setGravando] = React.useState<Secao | null>(null);
  const gravandoRef = React.useRef(false);
  // rascunhos locais por seção (só gravam no botão da seção)
  const [nome, setNome] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [itens, setItens] = React.useState<ItemRascunho[]>([]);
  const [todos, setTodos] = React.useState(false);
  const [escopos, setEscopos] = React.useState<Set<string>>(new Set());
  const [alcanceAntes, setAlcanceAntes] = React.useState<number | null>(null);
  const [duplicando, setDuplicando] = React.useState(false);
  const [mudandoAtivo, setMudandoAtivo] = React.useState(false);

  const iniciar = React.useCallback((d: KitDetalhe, secoes: Secao[]) => {
    if (secoes.includes('dados')) { setNome(d.kit.nome); setDescricao(d.kit.descricao ?? ''); }
    if (secoes.includes('itens')) setItens(ordenarItens(d.kit.atributos));
    if (secoes.includes('escopo')) { setTodos(!!d.kit.aplica_a_todos); setEscopos(new Set(d.kit.escopos.map(chaveEscopo))); }
  }, []);

  /** Busca o kit (sempre depois de gravar: a versão muda) e reinicia só os rascunhos das seções indicadas. */
  const carregar = React.useCallback(async (secoes: Secao[] = ['dados', 'itens', 'escopo']): Promise<KitDetalhe | null> => {
    setErroCarga(null);
    try { const d = await obter<KitDetalhe>('kit', { id }); setDet(d); iniciar(d, secoes); return d; }
    catch (e) { setErroCarga(msgErro(e)); return null; }
  }, [id, iniciar]);
  React.useEffect(() => { void carregar(); }, [carregar]);

  if (erroCarga && !det) return <div className="at-kits-pilha"><BotaoVoltar aoVoltar={aoVoltar} /><Erro mensagem={erroCarga} aoTentar={() => void carregar()} /></div>;
  if (!det) return <Carregando rotulo="Carregando kit" />;

  const k = det.kit;
  const pode = det.pode_editar;
  const sujoDados = nome.trim() !== k.nome || descricao.trim() !== (k.descricao ?? '').trim();
  const sujoItens = assinaturaItens(itens) !== assinaturaItens(ordenarItens(k.atributos));
  const escoposSalvos = new Set(k.escopos.map(chaveEscopo));
  const mudouEscopos = escopos.size !== escoposSalvos.size || [...escopos].some((x) => !escoposSalvos.has(x));
  const sujoEscopo = todos !== !!k.aplica_a_todos || mudouEscopos;
  const algoSujo = sujoDados || sujoItens || sujoEscopo;

  const falhar = (s: Secao, e: unknown) => {
    const conflito = e instanceof ErroApi && e.conflito;
    const msg = conflito ? 'Este kit foi alterado por outra pessoa. Recarregue para ver a versão atual (as alterações desta seção serão descartadas).' : msgErro(e);
    setErros((x) => ({ ...x, [s]: { msg, conflito } }));
    nav.aviso(conflito ? 'Kit alterado por outra pessoa: recarregue.' : msg, 'erro');
  };
  const limparErro = (s: Secao) => setErros((x) => { const y = { ...x }; delete y[s]; return y; });
  /** Ação que sai do editor: confirma se houver rascunho não salvo. */
  const sair = (acao: () => void) => {
    if (algoSujo && !window.confirm('Há alterações não salvas neste kit. Sair mesmo assim e descartá-las?')) return;
    acao();
  };

  // ── gravações ──
  const salvarDados = async () => {
    if (!nome.trim()) { setErros((x) => ({ ...x, dados: { msg: 'O nome não pode ficar vazio.', conflito: false } })); return; }
    if (gravandoRef.current) return;   // uma seção por vez: cada gravação sobe a versão do kit
    gravandoRef.current = true; setGravando('dados'); limparErro('dados');
    try {
      await enviar('kit', { id: k.id, versao: k.versao, nome: nome.trim(), descricao: descricao.trim() || null });
      await carregar(['dados']); nav.aviso('Nome e descrição salvos.');
    } catch (e) { falhar('dados', e); } finally { gravandoRef.current = false; setGravando(null); }
  };

  const salvarItens = async () => {
    if (itens.filter((i) => +i.destaque).length > MAX_DESTAQUES) { setErros((x) => ({ ...x, itens: { msg: `No máximo ${MAX_DESTAQUES} destaques por kit.`, conflito: false } })); return; }
    if (gravandoRef.current) return;   // uma seção por vez: cada gravação sobe a versão do kit
    gravandoRef.current = true; setGravando('itens'); limparErro('itens');
    try {
      await enviar('kit_itens', {
        id: k.id, versao: k.versao,
        itens: itens.map((i, n) => ({ atributo_id: i.atributo_id, posicao: n + 1, obrigatorio: +i.obrigatorio ? 1 : 0, visivel: +i.visivel ? 1 : 0, destaque: +i.destaque ? 1 : 0,
          importancia: i.importancia ?? null, unidade_id: i.unidade_id ?? null })),
      });
      await carregar(['itens']); nav.aviso('Itens do kit salvos.');
    } catch (e) { falhar('itens', e); } finally { gravandoRef.current = false; setGravando(null); }
  };

  const salvarEscopo = async () => {
    if (gravandoRef.current) return;   // uma seção por vez: cada gravação sobe a versão do kit
    gravandoRef.current = true; setGravando('escopo'); limparErro('escopo');
    const antes = det.alcance.filter((p) => p.ativo).length;
    try {
      let versao = k.versao;
      if (todos !== !!k.aplica_a_todos) {
        const r = await enviar<{ kit: { versao: number } }>('kit', { id: k.id, versao, aplica_a_todos: todos ? 1 : 0 });
        versao = Number(r.kit.versao);
      }
      if (mudouEscopos) {
        const lista = [...escopos].map((c) => { const [categoria, subcategoria = ''] = c.split('|'); return { categoria, subcategoria }; });
        await enviar('kit_escopos', { id: k.id, versao, escopos: lista });
      }
      const d = await carregar(['escopo']);
      setAlcanceAntes(antes);
      const depois = d ? d.alcance.filter((p) => p.ativo).length : null;
      nav.aviso(depois !== null ? `Escopo salvo: o kit vale para ${plural(depois, 'produto ativo', 'produtos ativos')}.` : 'Escopo salvo.');
    } catch (e) {
      falhar('escopo', e);
      await carregar([]); // "aplica a todos" pode ter gravado antes do escopo falhar: atualiza a versão sem perder o rascunho
    } finally { gravandoRef.current = false; setGravando(null); }
  };

  const mudarAvulsos = async (adicionar: number[], remover: number[]): Promise<boolean> => {
    if (gravandoRef.current) return false;   // uma seção por vez: cada gravação sobe a versão do kit
    gravandoRef.current = true; setGravando('avulsos'); limparErro('avulsos');
    try {
      const r = await enviar<{ adicionados: number; removidos: number }>('kit_produtos', { id: k.id, versao: k.versao, adicionar, remover });
      await carregar([]);
      nav.aviso(r.adicionados ? `${plural(r.adicionados, 'produto avulso adicionado', 'produtos avulsos adicionados')}.`
        : r.removidos ? `${plural(r.removidos, 'produto avulso removido', 'produtos avulsos removidos')}.` : 'Nada mudou.');
      return true;
    } catch (e) { falhar('avulsos', e); return false; } finally { gravandoRef.current = false; setGravando(null); }
  };

  const erroSecao = (s: Secao, recarregarSecoes: Secao[]) => {
    const e = erros[s];
    if (!e) return null;
    return (
      <p className="at-kits-erro" role="alert">
        {e.msg}
        {e.conflito && <Botao aoClicar={() => { limparErro(s); void carregar(recarregarSecoes); }}>Recarregar</Botao>}
      </p>
    );
  };

  return (
    <div className="at-kits-pilha">
      <BotaoVoltar aoVoltar={() => sair(aoVoltar)} />
      <div className="at-kits-topo">
        <h2>{k.nome}</h2>
        <ChipKit nome={k.nome} pequeno />
        {k.ativo ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta>Inativo</Etiqueta>}
        {!pode && <Etiqueta tom="info" titulo="Seu nível permite ver, não alterar">Somente leitura</Etiqueta>}
        {algoSujo && <span className="at-kits-pendente" role="status">Alterações não salvas</span>}
        {pode && (
          <div className="at-acoes at-kits-topo__resto">
            <Botao aoClicar={() => setDuplicando(true)}>Duplicar</Botao>
            <Botao perigo={k.ativo} aoClicar={() => setMudandoAtivo(true)}>{k.ativo ? 'Desativar kit' : 'Reativar kit'}</Botao>
          </div>
        )}
      </div>
      {!k.ativo && <p className="at-kits-dica">Este kit está desativado e não vale para nenhum produto enquanto estiver assim.</p>}

      <section className="at-painel" aria-labelledby="kit-dados">
        <div className="at-painel__cabeca">
          <h3 id="kit-dados">Nome e descrição</h3>
          {sujoDados && <span className="at-kits-pendente">Alterações não salvas</span>}
        </div>
        <div className="at-painel__corpo">
          {erroSecao('dados', ['dados'])}
          <div className="at-kits-dados">
            <label className="at-rotulo-campo">Nome
              <input className="at-campo" value={nome} maxLength={160} readOnly={!pode} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label className="at-rotulo-campo">Descrição
              <textarea className="at-campo" rows={2} value={descricao} maxLength={500} readOnly={!pode} onChange={(e) => setDescricao(e.target.value)} />
            </label>
          </div>
          {pode && (
            <div className="at-acoes" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
              {sujoDados && <Botao aoClicar={() => iniciar(det, ['dados'])}>Descartar</Botao>}
              <Botao primario desligado={!sujoDados} trabalhando={gravando === 'dados'} aoClicar={salvarDados}>Salvar</Botao>
            </div>
          )}
        </div>
      </section>

      <PainelItens itens={itens} setItens={setItens} unidades={det.unidades} pode={pode} sujo={sujoItens} gravando={gravando === 'itens'}
        erro={erroSecao('itens', ['itens'])} aoSalvar={salvarItens} aoDescartar={() => iniciar(det, ['itens'])} />

      <div className="at-kits-duas">
        <PainelEscopo det={det} todos={todos} setTodos={setTodos} escopos={escopos} setEscopos={setEscopos} pode={pode} sujo={sujoEscopo}
          gravando={gravando === 'escopo'} erro={erroSecao('escopo', ['escopo'])} alcanceAntes={alcanceAntes}
          aoSalvar={salvarEscopo} aoDescartar={() => iniciar(det, ['escopo'])} />
        <PainelAvulsos det={det} pode={pode} gravando={gravando === 'avulsos'} erro={erroSecao('avulsos', [])} aoMudar={mudarAvulsos}
          aoAbrirProduto={(pid) => sair(() => nav.abrirProduto(pid))} />
      </div>

      <PainelAlcance det={det} aoAbrirProduto={(pid) => sair(() => nav.abrirProduto(pid))} />

      <DialogoDuplicar kit={duplicando ? k : null} aoFechar={() => setDuplicando(false)}
        aoDuplicar={(novo) => { setDuplicando(false); nav.aviso(`Kit "${novo.nome}" criado a partir de "${k.nome}".`); sair(() => aoAbrir(novo.id)); }} />
      <DialogoAtivo kit={mudandoAtivo ? { id: k.id, nome: k.nome, versao: k.versao, ativo: k.ativo } : null} aoFechar={() => setMudandoAtivo(false)}
        aoMudar={(r) => { setMudandoAtivo(false); nav.aviso(r.ativo ? 'Kit reativado.' : 'Kit desativado.'); void carregar([]); }} />
    </div>
  );
}

function BotaoVoltar({ aoVoltar }: { aoVoltar: () => void }) {
  return <div><button type="button" className="at-link" onClick={aoVoltar}>← Voltar para a lista de kits</button></div>;
}

// ── Itens ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function PainelItens({ itens, setItens, unidades, pode, sujo, gravando, erro, aoSalvar, aoDescartar }: {
  itens: ItemRascunho[]; setItens: React.Dispatch<React.SetStateAction<ItemRascunho[]>>; unidades: Unidade[]; pode: boolean; sujo: boolean; gravando: boolean;
  erro: React.ReactNode; aoSalvar: () => void; aoDescartar: () => void;
}) {
  const [adicionando, setAdicionando] = React.useState(false);
  const [anuncio, setAnuncio] = React.useState('');
  const [focar, setFocar] = React.useState<{ aid: number; dir: 'sobe' | 'desce' } | null>(null);
  const [arrastado, setArrastado] = React.useState<number | null>(null);
  const [alvo, setAlvo] = React.useState<number | null>(null);
  const corpo = React.useRef<HTMLTableSectionElement>(null);
  const nDest = itens.filter((i) => +i.destaque).length;

  // Depois de mover pelo teclado, devolve o foco ao mesmo botão (ou ao outro, se chegou na ponta).
  React.useEffect(() => {
    if (!focar || !corpo.current) return;
    const outro = focar.dir === 'sobe' ? 'desce' : 'sobe';
    const b = corpo.current.querySelector<HTMLButtonElement>(`[data-mover="${focar.aid}-${focar.dir}"]:not(:disabled)`)
      ?? corpo.current.querySelector<HTMLButtonElement>(`[data-mover="${focar.aid}-${outro}"]`);
    b?.focus(); setFocar(null);
  }, [focar, itens]);

  const mover = (de: number, para: number, viaTeclado?: 'sobe' | 'desce') => {
    if (para < 0 || para >= itens.length || de === para) return;
    const l = [...itens]; const [x] = l.splice(de, 1); l.splice(para, 0, x);
    setItens(l); setAnuncio(`${x.rotulo} movido para a posição ${para + 1} de ${l.length}.`);
    if (viaTeclado) setFocar({ aid: x.atributo_id, dir: viaTeclado });
  };
  const alterar = (aid: number, campo: Partial<ItemKit>) => setItens((l) => l.map((i) => (i.atributo_id === aid ? { ...i, ...campo } : i)));
  const remover = (i: ItemKit) => { setItens((l) => l.filter((x) => x.atributo_id !== i.atributo_id)); setAnuncio(`${i.rotulo} removido do rascunho.`); };

  /** Unidades oferecidas: as da mesma grandeza da unidade padrão do atributo; sem unidade padrão, todas (agrupadas por grandeza). */
  const opcoesUnidade = (i: ItemKit): { grupo: string; lista: Unidade[] }[] => {
    const padrao = i.unidade_padrao_id != null ? unidades.find((u) => u.id === Number(i.unidade_padrao_id)) : undefined;
    const usaveis = unidades.filter((u) => Number(u.ativo) === 1 || u.id === i.unidade_id);
    if (padrao?.grandeza) return [{ grupo: padrao.grandeza, lista: usaveis.filter((u) => u.grandeza === padrao.grandeza) }];
    if (padrao) return [{ grupo: 'unidade', lista: usaveis.filter((u) => u.id === padrao.id || u.id === i.unidade_id) }];
    const grupos = new Map<string, Unidade[]>();
    for (const u of usaveis) { const g = u.grandeza ?? 'outras'; grupos.set(g, [...(grupos.get(g) ?? []), u]); }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([grupo, lista]) => ({ grupo, lista }));
  };

  return (
    <section className="at-painel" aria-labelledby="kit-itens">
      <div className="at-painel__cabeca">
        <div>
          <h3 id="kit-itens">Atributos do kit <span className="at-fraco">({itens.length})</span></h3>
          <p className="at-kits-dica">
            Destaques: {nDest} de {MAX_DESTAQUES}.{pode ? ' Reordene com os botões ▲ ▼ (ou arrastando a linha). As mudanças só valem depois de "Salvar itens".' : ''}
          </p>
        </div>
        <div className="at-acoes">
          {sujo && <span className="at-kits-pendente" role="status">Alterações não salvas</span>}
          {pode && <Botao aoClicar={() => setAdicionando(true)}>+ Adicionar atributos</Botao>}
          {pode && sujo && <Botao aoClicar={aoDescartar}>Descartar</Botao>}
          {pode && <Botao primario desligado={!sujo} trabalhando={gravando} aoClicar={aoSalvar}>Salvar itens</Botao>}
        </div>
      </div>
      <div className="at-painel__corpo">
        {erro}
        <span className="bl-so-leitor" aria-live="polite">{anuncio}</span>
        {itens.length === 0 ? (
          <Vazio titulo="Este kit ainda não tem atributos.">{pode ? 'Use "Adicionar atributos" para escolher no dicionário.' : null}</Vazio>
        ) : (
          <div className="bl-rola-x">
            <table className="at-tabela at-kits-itens">
              <thead>
                <tr>
                  <th scope="col">Ordem</th><th scope="col">Atributo</th><th scope="col" className="at-kits-centro">Obrigatório</th>
                  <th scope="col" className="at-kits-centro">Visível no app</th><th scope="col" className="at-kits-centro">Destaque</th>
                  <th scope="col">Importância</th><th scope="col">Unidade do kit</th>{pode && <th scope="col"><span className="bl-so-leitor">Remover</span></th>}
                </tr>
              </thead>
              <tbody ref={corpo}>
                {itens.map((i, n) => {
                  const numerico = i.tipo === 'numero' || i.tipo === 'inteiro';
                  const travaDest = !+i.destaque && nDest >= MAX_DESTAQUES;
                  const cls = [arrastado === n ? 'at-kits-arrastando' : '', alvo === n && arrastado !== null && arrastado !== n ? 'at-kits-alvo' : '', i.novo ? 'at-kits-novo' : ''].join(' ').trim();
                  return (
                    <tr key={i.atributo_id} className={cls || undefined} draggable={pode}
                      onDragStart={(e) => { setArrastado(n); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i.atributo_id)); }}
                      onDragOver={(e) => { if (arrastado === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (alvo !== n) setAlvo(n); }}
                      onDrop={(e) => { e.preventDefault(); if (arrastado !== null) mover(arrastado, n); setArrastado(null); setAlvo(null); }}
                      onDragEnd={() => { setArrastado(null); setAlvo(null); }}>
                      <td>
                        <div className="at-kits-ordem">
                          {pode && <span className="at-kits-pega" aria-hidden title="Arraste para reordenar">⠿</span>}
                          <span className="at-kits-ordem__n">{n + 1}</span>
                          {pode && <>
                            <button type="button" className="bl-botao bl-botao--icone" data-mover={`${i.atributo_id}-sobe`} disabled={n === 0}
                              aria-label={`Subir ${i.rotulo}`} title="Subir" onClick={() => mover(n, n - 1, 'sobe')}>▲</button>
                            <button type="button" className="bl-botao bl-botao--icone" data-mover={`${i.atributo_id}-desce`} disabled={n === itens.length - 1}
                              aria-label={`Descer ${i.rotulo}`} title="Descer" onClick={() => mover(n, n + 1, 'desce')}>▼</button>
                          </>}
                        </div>
                      </td>
                      <td className="at-kits-attr">
                        <strong>{i.rotulo}</strong>
                        <div className="at-kits-attr__meta">
                          <span className="at-codigo">{i.codigo}</span>
                          <Etiqueta>{TIPO[i.tipo] ?? i.tipo}</Etiqueta>
                          {!Number(i.atributo_ativo) && <Etiqueta tom="aviso" titulo="Atributo desativado no dicionário: não aparece nas fichas">Atributo inativo</Etiqueta>}
                          {i.novo && <Etiqueta tom="verde">Novo</Etiqueta>}
                        </div>
                      </td>
                      <td className="at-kits-centro">
                        <input type="checkbox" checked={!!+i.obrigatorio} disabled={!pode} aria-label={`${i.rotulo}: obrigatório`}
                          onChange={(e) => alterar(i.atributo_id, { obrigatorio: e.target.checked ? 1 : 0 })} />
                      </td>
                      <td className="at-kits-centro">
                        <input type="checkbox" checked={!!+i.visivel} disabled={!pode} aria-label={`${i.rotulo}: visível no app`}
                          onChange={(e) => alterar(i.atributo_id, { visivel: e.target.checked ? 1 : 0 })} />
                      </td>
                      <td className="at-kits-centro">
                        <input type="checkbox" checked={!!+i.destaque} disabled={!pode || travaDest} aria-label={`${i.rotulo}: destaque`}
                          title={travaDest ? `Já há ${MAX_DESTAQUES} destaques; desmarque um para escolher outro.` : undefined}
                          onChange={(e) => alterar(i.atributo_id, { destaque: e.target.checked ? 1 : 0 })} />
                      </td>
                      <td>
                        <select className="at-campo" value={i.importancia ?? ''} disabled={!pode} aria-label={`${i.rotulo}: importância`}
                          onChange={(e) => alterar(i.atributo_id, { importancia: (e.target.value || null) as Importancia | null })}>
                          <option value="">Padrão{i.importancia_padrao ? ` (${IMPORTANCIA[i.importancia_padrao] ?? i.importancia_padrao})` : ''}</option>
                          {IMPORTANCIAS.map((v) => <option key={v} value={v}>{IMPORTANCIA[v]}</option>)}
                        </select>
                      </td>
                      <td>
                        {numerico ? (
                          <select className="at-campo" value={i.unidade_id ?? ''} disabled={!pode} aria-label={`${i.rotulo}: unidade do kit`}
                            onChange={(e) => alterar(i.atributo_id, { unidade_id: e.target.value ? Number(e.target.value) : null })}>
                            <option value="">Padrão do atributo{i.unidade_padrao ? ` (${i.unidade_padrao})` : ''}</option>
                            {opcoesUnidade(i).map((g) => (
                              <optgroup key={g.grupo} label={g.grupo}>
                                {g.lista.map((u) => <option key={u.id} value={u.id}>{u.simbolo} — {u.nome}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        ) : <span className="at-fraco">—</span>}
                      </td>
                      {pode && <td><Botao perigo aoClicar={() => remover(i)} titulo={`Tirar ${i.rotulo} do kit (no rascunho)`}>Remover</Botao></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <DialogoAdicionar aberto={adicionando} aoFechar={() => setAdicionando(false)} jaNoKit={new Set(itens.map((i) => i.atributo_id))}
        aoAdicionar={(lista) => {
          setAdicionando(false);
          setItens((l) => [...l, ...lista.map((a): ItemRascunho => ({
            atributo_id: a.id, rotulo: a.rotulo, codigo: a.codigo, tipo: a.tipo, atributo_ativo: Number(a.ativo), posicao: 0, obrigatorio: 0, visivel: 1, destaque: 0,
            importancia: null, unidade_id: null, unidade: null, unidade_padrao: a.unidade, unidade_padrao_id: a.unidade_id, importancia_padrao: a.importancia_padrao,
            legado_id: null, versao: 0, novo: true,
          }))]);
          setAnuncio(`${plural(lista.length, 'atributo adicionado', 'atributos adicionados')} ao rascunho. Salve os itens para gravar.`);
        }} />
    </section>
  );
}

function DialogoAdicionar({ aberto, aoFechar, jaNoKit, aoAdicionar }: { aberto: boolean; aoFechar: () => void; jaNoKit: Set<number>; aoAdicionar: (l: AtributoDicionario[]) => void }) {
  const [dic, setDic] = React.useState<AtributoDicionario[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [busca, setBusca] = React.useState('');
  const [tipo, setTipo] = React.useState<TipoAtributo | ''>('');
  const [marcados, setMarcados] = React.useState<Set<number>>(new Set());
  const LIMITE = 200;

  const carregar = React.useCallback(() => {
    setErro(null);
    obter<{ atributos: AtributoDicionario[] }>('dicionario').then((d) => setDic(d.atributos)).catch((e) => setErro(msgErro(e)));
  }, []);
  const carregado = dic !== null;
  React.useEffect(() => {
    if (!aberto) return;
    setBusca(''); setTipo(''); setMarcados(new Set());
    if (!carregado) carregar();
  }, [aberto, carregado, carregar]);

  const termo = normalizar(busca.trim());
  const candidatos = (dic ?? []).filter((a) => Number(a.ativo) === 1 && !jaNoKit.has(a.id) && (!tipo || a.tipo === tipo)
    && (!termo || normalizar(a.rotulo).includes(termo) || normalizar(a.codigo).includes(termo)));
  const mostrados = candidatos.slice(0, LIMITE);
  const alternar = (aid: number) => setMarcados((s) => { const n = new Set(s); if (n.has(aid)) n.delete(aid); else n.add(aid); return n; });

  return (
    <Dialogo titulo="Adicionar atributos do dicionário" aberto={aberto} aoFechar={aoFechar} largura={760}
      rodape={<>
        <span className="at-kits-dic-rodape">{plural(marcados.size, 'selecionado', 'selecionados')}</span>
        <Botao aoClicar={aoFechar}>Cancelar</Botao>
        <Botao primario desligado={marcados.size === 0} aoClicar={() => dic && aoAdicionar(dic.filter((a) => marcados.has(a.id)))}>Adicionar ao kit</Botao>
      </>}>
      {erro ? <Erro mensagem={erro} aoTentar={carregar} /> : !dic ? <Carregando rotulo="Carregando dicionário" /> : (
        <>
          <div className="at-kits-dic-filtros">
            <input className="at-campo" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por rótulo ou código" aria-label="Buscar por rótulo ou código" />
            <select className="at-campo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAtributo | '')} aria-label="Filtrar por tipo">
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
          <p className="at-kits-dica" style={{ marginBottom: 8 }}>
            {plural(candidatos.length, 'atributo disponível', 'atributos disponíveis')} (os que já estão no kit e os inativos não aparecem)
            {candidatos.length > LIMITE ? `; mostrando os ${LIMITE} primeiros, refine a busca.` : '.'}
          </p>
          {mostrados.length === 0 ? <Vazio titulo="Nenhum atributo encontrado." /> : (
            <div className="at-kits-dic-lista" role="group" aria-label="Atributos disponíveis">
              {mostrados.map((a) => (
                <label key={a.id} className="at-kits-dic-item">
                  <input type="checkbox" checked={marcados.has(a.id)} onChange={() => alternar(a.id)} />
                  <span className="at-kits-dic-item__txt">
                    <strong>{a.rotulo}</strong>
                    <span className="at-kits-dic-item__meta">
                      <span className="at-codigo">{a.codigo}</span>
                      <Etiqueta>{TIPO[a.tipo] ?? a.tipo}</Etiqueta>
                      {a.unidade && <Etiqueta tom="info">{a.unidade}</Etiqueta>}
                      {a.grupo_atributos && <span className="at-fraco">{a.grupo_atributos}</span>}
                      <span className="at-fraco">· em {plural(Number(a.em_kits) || 0, 'kit', 'kits')}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </Dialogo>
  );
}

// ── Escopo + aplica a todos ────────────────────────────────────────────────────────────────────────────────────────────────
function PainelEscopo({ det, todos, setTodos, escopos, setEscopos, pode, sujo, gravando, erro, alcanceAntes, aoSalvar, aoDescartar }: {
  det: KitDetalhe; todos: boolean; setTodos: (v: boolean) => void; escopos: Set<string>; setEscopos: React.Dispatch<React.SetStateAction<Set<string>>>;
  pode: boolean; sujo: boolean; gravando: boolean; erro: React.ReactNode; alcanceAntes: number | null; aoSalvar: () => void; aoDescartar: () => void;
}) {
  // categorias → subcategorias (dos `subcategorias` da resposta + escopos salvos que não estejam lá)
  const subcats: SubcatAtivos[] = React.useMemo(() => {
    const m = new Map<string, SubcatAtivos>();
    for (const s of det.subcategorias) m.set(`${s.categoria}|${s.subcategoria}`, s);
    for (const e of det.kit.escopos) if (e.subcategoria !== '' && !m.has(chaveEscopo(e))) m.set(chaveEscopo(e), { categoria: e.categoria, subcategoria: e.subcategoria, ativos: e.produtos });
    return [...m.values()];
  }, [det]);
  const categorias = React.useMemo(() => {
    const m = new Map<string, SubcatAtivos[]>();
    for (const s of subcats) m.set(s.categoria, [...(m.get(s.categoria) ?? []), s]);
    for (const e of det.kit.escopos) if (!m.has(e.categoria)) m.set(e.categoria, []);
    return [...m.entries()].map(([categoria, l]) => ({
      categoria, total: l.reduce((t, s) => t + s.ativos, 0), semSub: l.filter((s) => s.subcategoria === '').reduce((t, s) => t + s.ativos, 0),
      subs: l.filter((s) => s.subcategoria !== '').sort((a, b) => rotuloSubcategoria(a.subcategoria).localeCompare(rotuloSubcategoria(b.subcategoria), 'pt-BR')),
    })).sort((a, b) => rotuloCategoria(a.categoria).localeCompare(rotuloCategoria(b.categoria), 'pt-BR'));
  }, [subcats, det]);

  const alternar = (c: string) => setEscopos((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const previsto = contarCobertos(escopos, subcats, todos);
  const real = det.alcance.filter((p) => p.ativo).length;
  const diretos = det.produtos_diretos.length;
  const totalAtivos = subcats.reduce((t, s) => t + s.ativos, 0);
  const salvoPrevisto = contarCobertos(new Set(det.kit.escopos.map(chaveEscopo)), subcats, !!det.kit.aplica_a_todos);

  return (
    <section className="at-painel" aria-labelledby="kit-escopo">
      <div className="at-painel__cabeca">
        <h3 id="kit-escopo">Onde o kit vale</h3>
        <div className="at-acoes">
          {sujo && <span className="at-kits-pendente" role="status">Alterações não salvas</span>}
          {pode && sujo && <Botao aoClicar={aoDescartar}>Descartar</Botao>}
          {pode && <Botao primario desligado={!sujo} trabalhando={gravando} aoClicar={aoSalvar}>Salvar escopo</Botao>}
        </div>
      </div>
      <div className="at-painel__corpo">
        {erro}
        <label className="at-kits-op">
          <input type="checkbox" checked={todos} disabled={!pode} onChange={(e) => setTodos(e.target.checked)} />
          <span><strong>Aplica a todos os produtos</strong><em>{plural(totalAtivos, 'ativo', 'ativos')}</em></span>
        </label>

        <div className={`at-kits-efeito ${sujo ? 'at-kits-efeito--mudou' : ''}`} aria-live="polite">
          {sujo ? (
            <>
              <strong>Ao salvar, este kit passa a valer para {plural(previsto, 'produto ativo', 'produtos ativos')}{todos ? ' (todos)' : ' pelas subcategorias'}.</strong>
              <span>
                {diretos > 0 ? `Mais ${plural(diretos, 'produto avulso', 'produtos avulsos')}, contados à parte (algum pode já estar no escopo). ` : ''}
                Hoje vale para {plural(real, 'produto ativo', 'produtos ativos')}.
              </span>
            </>
          ) : (
            <>
              <strong>Hoje este kit vale para {plural(real, 'produto ativo', 'produtos ativos')}.</strong>
              <span>
                {alcanceAntes !== null && alcanceAntes !== real ? `Antes da última gravação eram ${alcanceAntes.toLocaleString('pt-BR')}. ` : ''}
                {todos ? 'Vale para todos os produtos.' : `${plural(salvoPrevisto, 'produto', 'produtos')} pelas subcategorias${diretos > 0 ? ` e ${plural(diretos, 'avulso', 'avulsos')}` : ''}.`}
                {!det.kit.ativo ? ' O kit está desativado: não vale para nenhum produto enquanto estiver assim.' : ''}
              </span>
            </>
          )}
        </div>

        {todos && <p className="at-kits-dica" style={{ marginBottom: 8 }}>Com "aplica a todos" ligado, as subcategorias abaixo ficam guardadas mas não mudam o alcance.</p>}
        {categorias.length === 0 ? <Vazio titulo="Nenhuma categoria no catálogo." /> : categorias.map((c) => {
          const inteira = escopos.has(`${c.categoria}|`);
          return (
            <fieldset key={c.categoria} className="at-kits-cat" disabled={!pode}>
              <legend className="bl-so-leitor">{rotuloCategoria(c.categoria)}</legend>
              <div className="at-kits-cat__cabeca">
                <strong>{rotuloCategoria(c.categoria)} <span className="at-fraco">· {plural(c.total, 'ativo', 'ativos')}</span></strong>
                <label className="at-kits-op">
                  <input type="checkbox" checked={inteira} onChange={() => alternar(`${c.categoria}|`)} />
                  <span>Categoria inteira</span>
                </label>
              </div>
              <div className="at-kits-subs">
                {c.subs.map((s) => {
                  const ch = `${s.categoria}|${s.subcategoria}`;
                  return (
                    <label key={ch} className={`at-kits-op ${inteira ? 'at-kits-op--coberto' : ''}`} title={inteira ? 'Já incluída pela categoria inteira' : undefined}>
                      <input type="checkbox" checked={inteira || escopos.has(ch)} disabled={inteira} onChange={() => alternar(ch)} />
                      <span>{rotuloSubcategoria(s.subcategoria)}<em>{s.ativos}</em></span>
                    </label>
                  );
                })}
              </div>
              {c.semSub > 0 && <p className="at-kits-dica" style={{ marginTop: 6 }}>{plural(c.semSub, 'produto ativo sem subcategoria só entra', 'produtos ativos sem subcategoria só entram')} com a categoria inteira.</p>}
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}

// ── Produtos avulsos ───────────────────────────────────────────────────────────────────────────────────────────────────────
function PainelAvulsos({ det, pode, gravando, erro, aoMudar, aoAbrirProduto }: {
  det: KitDetalhe; pode: boolean; gravando: boolean; erro: React.ReactNode; aoMudar: (adicionar: number[], remover: number[]) => Promise<boolean>; aoAbrirProduto: (id: number) => void;
}) {
  const [vitrine, setVitrine] = React.useState<ProdutoVitrine[] | null>(null);
  const [erroVit, setErroVit] = React.useState<string | null>(null);
  const [pedido, setPedido] = React.useState(false);
  const [busca, setBusca] = React.useState('');
  const carregarVitrine = React.useCallback(() => {
    setErroVit(null); setPedido(true);
    obter<{ produtos: ProdutoVitrine[] }>('vitrine').then((d) => setVitrine(d.produtos)).catch((e) => { setErroVit(msgErro(e)); setPedido(false); });
  }, []);
  const garantirVitrine = () => { if (!vitrine && !pedido) carregarVitrine(); };

  const diretos = new Set(det.produtos_diretos.map((p) => p.id));
  const termo = normalizar(busca.trim());
  const idBusca = termo.replace(/^(id\s*:?\s*|#)/, '');
  const resultados = termo && vitrine
    ? vitrine.filter((p) => !diretos.has(p.id) && (String(p.id) === idBusca || normalizar(p.nome).includes(termo)))
      .sort((a, b) => Number(b.ativo) - Number(a.ativo)).slice(0, 15)
    : [];

  return (
    <section className="at-painel" aria-labelledby="kit-avulsos">
      <div className="at-painel__cabeca">
        <h3 id="kit-avulsos">Produtos avulsos <span className="at-fraco">({det.produtos_diretos.length})</span></h3>
      </div>
      <div className="at-painel__corpo">
        {erro}
        <p className="at-kits-dica" style={{ marginBottom: 8 }}>Produtos que recebem o kit diretamente, mesmo fora do escopo.{pode ? ' Adicionar ou remover grava na hora.' : ''}</p>
        {det.produtos_diretos.length === 0 ? <p className="at-vazio">Nenhum produto avulso.</p> : (
          <ul className="at-kits-lista at-kits-rolavel">
            {det.produtos_diretos.map((p) => (
              <li key={p.id}>
                <span className="at-kits-lista__nome">
                  <button type="button" className="at-link" onClick={() => aoAbrirProduto(p.id)}>{p.nome}</button>
                  <small>ID {p.id} · {rotuloSubcategoria(p.subcategoria)}</small>
                </span>
                {pode && <Botao perigo desligado={gravando} aoClicar={() => void aoMudar([], [p.id])} titulo={`Tirar ${p.nome} dos avulsos`}>Remover</Botao>}
              </li>
            ))}
          </ul>
        )}

        {pode && (
          <div style={{ marginTop: 12 }}>
            <label className="at-rotulo-campo">Adicionar produto (nome ou ID)
              <input className="at-campo" type="search" value={busca} onFocus={garantirVitrine} onChange={(e) => { setBusca(e.target.value); garantirVitrine(); }}
                placeholder="Ex.: Cabo DVI ou 148" />
            </label>
            {erroVit && <p className="at-kits-erro" role="alert" style={{ marginTop: 8 }}>{erroVit} <Botao aoClicar={carregarVitrine}>Tentar de novo</Botao></p>}
            {termo && !vitrine && !erroVit && <Carregando rotulo="Carregando produtos" />}
            {termo && vitrine && (resultados.length === 0 ? <p className="at-vazio" style={{ marginTop: 8 }}>Nenhum produto encontrado (ou já é avulso deste kit).</p> : (
              <ul className="at-kits-lista" style={{ marginTop: 6 }} aria-label="Resultados da busca de produtos">
                {resultados.map((p) => (
                  <li key={p.id}>
                    <span className="at-kits-lista__nome">{p.nome}<small>ID {p.id} · {rotuloSubcategoria(p.subcategoria)}{p.ativo ? '' : ' · inativo'}</small></span>
                    <Botao desligado={gravando} aoClicar={() => void aoMudar([p.id], []).then((ok) => { if (ok) setBusca(''); })}>Adicionar</Botao>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Produtos alcançados ────────────────────────────────────────────────────────────────────────────────────────────────────
function PainelAlcance({ det, aoAbrirProduto }: { det: KitDetalhe; aoAbrirProduto: (id: number) => void }) {
  const [inativos, setInativos] = React.useState(false);
  const [busca, setBusca] = React.useState('');
  const [limite, setLimite] = React.useState(100);
  const termo = normalizar(busca.trim());
  const nInativos = det.alcance.filter((p) => !p.ativo).length;
  const lista = det.alcance.filter((p) => (inativos || p.ativo) && (!termo || String(p.id) === termo || normalizar(p.nome).includes(termo)));
  return (
    <section className="at-painel" aria-labelledby="kit-alcance">
      <div className="at-painel__cabeca">
        <h3 id="kit-alcance">Produtos alcançados <span className="at-fraco">({plural(det.alcance.length - nInativos, 'ativo', 'ativos')})</span></h3>
        <div className="at-acoes">
          <input className="at-campo" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por nome ou ID" aria-label="Filtrar produtos alcançados" />
          <button type="button" className={`at-filtro ${inativos ? 'at-filtro--ativo' : ''}`} aria-pressed={inativos} onClick={() => setInativos((v) => !v)}>
            Mostrar inativos <span className="at-filtro__n">{nInativos}</span>
          </button>
        </div>
      </div>
      <div className="at-painel__corpo">
        {lista.length === 0 ? <Vazio titulo={det.alcance.length ? 'Nenhum produto com esse filtro.' : 'Este kit ainda não alcança nenhum produto.'} /> : (
          <>
            <div className="bl-rola-x at-kits-rolavel" style={{ maxHeight: 480 }}>
              <table className="at-tabela at-kits-alcance">
                <thead><tr><th scope="col" className="at-kits-num">ID</th><th scope="col">Produto</th><th scope="col">Subcategoria</th><th scope="col">Por quê</th><th scope="col">Situação</th></tr></thead>
                <tbody>
                  {lista.slice(0, limite).map((p) => (
                    <tr key={p.id} className={p.ativo ? undefined : 'at-linha--inativa'}>
                      <td className="at-kits-num">{p.id}</td>
                      <td><button type="button" className="at-link" onClick={() => aoAbrirProduto(p.id)}>{p.nome}</button></td>
                      <td>{rotuloSubcategoria(p.subcategoria)}</td>
                      <td><div className="at-kits-motivos">{p.motivos.map((m) => <Etiqueta key={m} tom={m === 'direto' ? 'verde' : m === 'todos' ? 'info' : 'neutro'}>{MOTIVO[m] ?? m}</Etiqueta>)}</div></td>
                      <td>{p.ativo ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta>Inativo</Etiqueta>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lista.length > limite && (
              <div className="at-acoes" style={{ marginTop: 10 }}>
                <span className="at-fraco">Mostrando {limite} de {lista.length}.</span>
                <Botao aoClicar={() => setLimite((l) => l + 200)}>Mostrar mais</Botao>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
