// panel-atributos/src/screens/Unidades.tsx — tela "Unidades" (missão 18/11 §11.7).
// Lista agrupada por grandeza com fator de conversão e uso; criar (idempotente no servidor), editar (o símbolo não muda),
// desativar/reativar com confirmação. Fator: valor × fator = valor na unidade base da grandeza. Sem interface otimista.
import React from 'react';
import { obter, enviar, ErroApi } from '../lib/api';
import type { Unidade } from '../lib/tipos';
import { decimal, numeroParaApi } from '../lib/formatar';
import { Botao, Dialogo, Etiqueta, Carregando, Vazio, Erro } from '../ui/Comuns';
import { useModulo } from '../app/contexto';
import { decidirFechar, fotografiaUnidade, iniciarGravacao } from '../lib/integridade';
import '../styles/dicionario.css';

type UnidadeUso = Unidade & { atributos: number; valores: number };
interface RespUnidades { unidades: UnidadeUso[]; pode_administrar: boolean }
interface RespGravacao { ja_existia?: boolean; sem_mudanca?: boolean; id?: number }

const SEM_GRANDEZA = 'Sem grandeza';
const CAMPOS: Record<string, string> = { simbolo: 'Símbolo', nome: 'Nome', grandeza: 'Grandeza', fator_base: 'Fator' };
const ligado = (v: unknown) => v === true || Number(v) === 1;
const n = (x: number) => x.toLocaleString('pt-BR');
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ehBase = (u: Unidade) => u.fator_base !== null && /^1(\.0*)?$/.test(u.fator_base);
function mensagemErro(e: unknown): string {
  if (e instanceof ErroApi) {
    const c = e.campos.map((k) => CAMPOS[k] ?? k);
    return c.length ? `${e.message} (${c.join(', ')})` : e.message;
  }
  return 'Falha de comunicação com o servidor.';
}

type EstadoEditor = null | { modo: 'novo' } | { modo: 'editar'; u: UnidadeUso };

export function Unidades() {
  const { aviso } = useModulo();
  const [dados, setDados] = React.useState<RespUnidades | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [busca, setBusca] = React.useState('');
  const [editor, setEditor] = React.useState<EstadoEditor>(null);
  const [confirmar, setConfirmar] = React.useState<UnidadeUso | null>(null);
  const [alternando, setAlternando] = React.useState(false);

  const carregar = React.useCallback(async (sinal?: AbortSignal) => {
    setErro(null);
    try { const r = await obter<RespUnidades>('unidades', {}, sinal); setDados(r); return r; }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setErro(mensagemErro(e)); return null; }
  }, []);
  React.useEffect(() => { const c = new AbortController(); void carregar(c.signal); return () => c.abort(); }, [carregar]);
  const fecharEditor = React.useCallback(() => setEditor(null), []);
  const fecharConfirmar = React.useCallback(() => setConfirmar(null), []);
  const recarregar = React.useCallback(async () => { await carregar(); }, [carregar]);
  // DSHOW-071: "Fechar e reabrir" depois de um 409 — fecha, relê e abre o editor com a unidade atual (nova fotografia)
  const reabrir = React.useCallback(async (id: number) => {
    setEditor(null);
    const r = await carregar();
    const u = r?.unidades.find((x) => x.id === id);
    if (u) setEditor({ modo: 'editar', u });
  }, [carregar]);

  const grandezas = React.useMemo(() => [...new Set((dados?.unidades ?? []).map((u) => u.grandeza).filter((g): g is string => !!g))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [dados]);
  const grupos = React.useMemo(() => {
    const t = semAcento(busca.trim());
    const m = new Map<string, UnidadeUso[]>();
    for (const u of dados?.unidades ?? []) {
      if (t && !semAcento(`${u.simbolo} ${u.nome} ${u.grandeza ?? ''}`).includes(t)) continue;
      const g = u.grandeza ?? SEM_GRANDEZA;
      m.set(g, [...(m.get(g) ?? []), u]);
    }
    const ordemFator = (u: Unidade) => (u.fator_base === null ? Number.POSITIVE_INFINITY : Number(u.fator_base));
    return [...m.entries()]
      .sort(([a], [b]) => (a === SEM_GRANDEZA ? 1 : b === SEM_GRANDEZA ? -1 : a.localeCompare(b, 'pt-BR')))
      .map(([g, lista]) => ({ g, lista: lista.sort((a, b) => ordemFator(a) - ordemFator(b) || a.simbolo.localeCompare(b.simbolo, 'pt-BR')), base: lista.find(ehBase) ?? null }));
  }, [dados, busca]);

  async function alternar() {
    if (!confirmar) return;
    const at = ligado(confirmar.ativo);
    setAlternando(true);
    try {
      await enviar('unidade_ativa', { id: confirmar.id, ativo: !at });
      aviso(at ? `Unidade "${confirmar.simbolo}" desativada.` : `Unidade "${confirmar.simbolo}" reativada.`);
      await carregar();
      setConfirmar(null);
    } catch (e) { aviso(mensagemErro(e), 'erro'); }
    finally { setAlternando(false); }
  }

  if (erro && !dados) return <Erro mensagem={erro} aoTentar={() => void carregar()} />;
  if (!dados) return <Carregando rotulo="Carregando as unidades" />;
  const pode = dados.pode_administrar;
  const total = grupos.reduce((s, x) => s + x.lista.length, 0);

  return (
    <div>
      <div className="at-titulo-tela">
        <div>
          <h2>Unidades</h2>
          <p>Unidades de medida usadas nos atributos numéricos, agrupadas por grandeza. <strong>Fator:</strong> valor × fator = valor na unidade base da grandeza (ex.: 25 cm × 0,01 = 0,25 m).{!pode && ' Seu nível permite apenas consultar.'}</p>
        </div>
        {pode && <div className="at-acoes"><Botao primario aoClicar={() => setEditor({ modo: 'novo' })}>Nova unidade</Botao></div>}
      </div>

      <div className="at-dic-filtros" role="search">
        <label className="at-busca">
          <span className="bl-so-leitor">Buscar unidade</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" placeholder="Buscar por símbolo, nome ou grandeza" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>
      <div className="at-dic-contagem" aria-live="polite">
        <span>{n(total)} de {n(dados.unidades.length)} unidades · {n(grupos.length)} grandeza{grupos.length === 1 ? '' : 's'}</span>
        {erro && <span className="at-alerta" role="alert">{erro}</span>}
      </div>

      {total === 0 ? (
        <Vazio titulo={busca ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'} acao={busca ? <Botao aoClicar={() => setBusca('')}>Limpar busca</Botao> : undefined}>
          {busca ? 'Nenhuma unidade corresponde à busca.' : 'Cadastre a primeira unidade de medida.'}
        </Vazio>
      ) : (
        <div className="at-dic-moldura">
          <div className="bl-rola-x">
            <table className="at-tabela at-dic-tabela at-dic-tabela--estatica">
              <thead>
                <tr>
                  <th scope="col">Símbolo</th><th scope="col">Nome</th><th scope="col">Grandeza</th><th scope="col" className="at-dic-num">Fator</th>
                  <th scope="col">Onde é usada</th><th scope="col">Situação</th>{pode && <th scope="col"><span className="bl-so-leitor">Ações</span></th>}
                </tr>
              </thead>
              {grupos.map(({ g, lista, base }) => (
                <tbody key={g}>
                  <tr className="at-dic-grupo"><th scope="rowgroup" colSpan={pode ? 7 : 6}>{g}<span>{n(lista.length)} unidade{lista.length === 1 ? '' : 's'}{base ? ` · base: ${base.simbolo}` : ''}</span></th></tr>
                  {lista.map((u) => {
                    const at = ligado(u.ativo);
                    return (
                      <tr key={u.id} className={at ? '' : 'at-linha--inativa'}>
                        <td className="at-dic-simbolo">{u.simbolo}</td>
                        <td>{u.nome}</td>
                        <td>{u.grandeza ?? <span className="at-dic-zero">—</span>}</td>
                        <td className="at-dic-num">
                          {u.fator_base === null ? <span className="at-dic-zero" title="Sem fator: não converte">—</span> : decimal(u.fator_base)}
                          {u.fator_base !== null && base && base.id !== u.id && <span className="at-dic-auxiliar">1 {u.simbolo} = {decimal(u.fator_base)} {base.simbolo}</span>}
                        </td>
                        <td>
                          <span className={u.atributos ? '' : 'at-dic-zero'}>{n(u.atributos)} atributo{u.atributos === 1 ? '' : 's'}</span>
                          <span className="at-dic-auxiliar">{n(u.valores)} valor{u.valores === 1 ? '' : 'es'} gravado{u.valores === 1 ? '' : 's'}</span>
                        </td>
                        <td>{at ? <Etiqueta tom="sucesso">Ativa</Etiqueta> : <Etiqueta>Inativa</Etiqueta>}</td>
                        {pode && (
                          <td>
                            <span className="at-dic-acoes-linha">
                              <button type="button" className="bl-botao" aria-label={`Editar ${u.simbolo}`} onClick={() => setEditor({ modo: 'editar', u })}>Editar</button>
                              <button type="button" className={`bl-botao ${at ? 'at-botao--perigo' : ''}`} aria-label={`${at ? 'Desativar' : 'Reativar'} ${u.simbolo}`} onClick={() => setConfirmar(u)}>{at ? 'Desativar' : 'Reativar'}</button>
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      )}

      {editor && <EditorUnidade key={editor.modo === 'novo' ? 'novo' : `e${editor.u.id}`} unidade={editor.modo === 'editar' ? editor.u : null} grandezas={grandezas} aoFechar={fecharEditor} aoRecarregar={recarregar} aoReabrir={reabrir} />}

      {confirmar && (
        <Dialogo titulo={ligado(confirmar.ativo) ? `Desativar a unidade ${confirmar.simbolo}?` : `Reativar a unidade ${confirmar.simbolo}?`} aberto aoFechar={fecharConfirmar}
          rodape={<>
            <Botao aoClicar={fecharConfirmar} desligado={alternando}>Cancelar</Botao>
            <Botao perigo={ligado(confirmar.ativo)} primario={!ligado(confirmar.ativo)} trabalhando={alternando} aoClicar={() => void alternar()}>{ligado(confirmar.ativo) ? 'Desativar' : 'Reativar'}</Botao>
          </>}>
          {ligado(confirmar.ativo) ? (
            <p style={{ margin: 0 }}>
              <strong>{confirmar.simbolo}</strong> ({confirmar.nome}) deixa de ser oferecida em novas escolhas.
              {confirmar.atributos || confirmar.valores
                ? ` Hoje ela é usada em ${n(confirmar.atributos)} atributo${confirmar.atributos === 1 ? '' : 's'} e ${n(confirmar.valores)} valor${confirmar.valores === 1 ? '' : 'es'}; nada disso é apagado nem convertido.`
                : ' Nenhum atributo ou valor a usa hoje.'}
            </p>
          ) : <p style={{ margin: 0 }}><strong>{confirmar.simbolo}</strong> ({confirmar.nome}) volta a ser oferecida nas escolhas de unidade.</p>}
        </Dialogo>
      )}
    </div>
  );
}

// ── Editor de unidade ────────────────────────────────────────────────────────────────────────────────────────────────────────
function EditorUnidade({ unidade, grandezas, aoFechar, aoRecarregar, aoReabrir }: { unidade: UnidadeUso | null; grandezas: string[]; aoFechar: () => void; aoRecarregar: () => Promise<void>; aoReabrir: (id: number) => Promise<void> }) {
  const { aviso } = useModulo();
  const fatorInicial = unidade?.fator_base ? decimal(unidade.fator_base) : '';
  const [simbolo, setSimbolo] = React.useState(unidade?.simbolo ?? '');
  const [nome, setNome] = React.useState(unidade?.nome ?? '');
  const [grandeza, setGrandeza] = React.useState(unidade?.grandeza ?? '');
  const [fator, setFator] = React.useState(fatorInicial);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<{ texto: string; campos: string[]; conflito?: boolean } | null>(null);
  // DSHOW-071: trava síncrona da gravação (Enter/duplo clique) e fotografia do que foi aberto (o servidor compara com a linha travada)
  const salvandoRef = React.useRef(false);
  const fotografia = React.useRef(unidade ? fotografiaUnidade(unidade) : null);
  const aoFecharSeguro = React.useCallback(() => { if (decidirFechar(salvandoRef.current)) aoFechar(); }, [aoFechar]);
  const idLista = React.useId();
  const invalido = (c: string) => (erro?.campos.includes(c) ? true : undefined);
  const fatorApi = fator.trim() ? numeroParaApi(fator) : '';

  async function salvar() {
    if (salvandoRef.current) return;
    if (!simbolo.trim()) { setErro({ texto: 'Informe o símbolo.', campos: ['simbolo'] }); return; }
    if (!nome.trim()) { setErro({ texto: 'Informe o nome.', campos: ['nome'] }); return; }
    if (fatorApi && (!/^\d+(\.\d+)?$/.test(fatorApi) || !/[1-9]/.test(fatorApi))) { setErro({ texto: 'Fator: número maior que zero (use vírgula para decimais).', campos: ['fator_base'] }); return; }
    if (!iniciarGravacao(salvandoRef)) return;
    setSalvando(true); setErro(null);
    try {
      let r: RespGravacao;
      if (unidade === null) {
        const corpo: Record<string, unknown> = { simbolo: simbolo.trim(), nome: nome.trim(), grandeza: grandeza.trim() || null };
        if (fatorApi) corpo.fator_base = fatorApi;
        r = await enviar<RespGravacao>('unidade', corpo);
        aviso(r.ja_existia ? `A unidade "${simbolo.trim()}" já existia com esses dados.` : `Unidade "${simbolo.trim()}" criada.`, r.ja_existia ? 'info' : 'sucesso');
      } else {
        const corpo: Record<string, unknown> = { id: unidade.id, nome: nome.trim(), grandeza: grandeza.trim() || null, antes: fotografia.current };
        if (fator.trim() !== fatorInicial) corpo.fator_base = fatorApi || null;
        r = await enviar<RespGravacao>('unidade', corpo);
        aviso(r.sem_mudanca ? 'Nada mudou.' : `Unidade "${unidade.simbolo}" salva.`, r.sem_mudanca ? 'info' : 'sucesso');
      }
      await aoRecarregar();
      aoFechar();
    } catch (e) {
      // DSHOW-071: 409 = alguém mudou a unidade; o editor fica aberto com a mensagem, a lista é relida e há "Fechar e reabrir". Rede/5xx: fica aberto.
      const conflito = e instanceof ErroApi && e.http === 409;
      setErro({ texto: conflito ? (e as ErroApi).message : mensagemErro(e), campos: e instanceof ErroApi ? e.campos : [], conflito });
      if (conflito) void aoRecarregar();
    } finally { salvandoRef.current = false; setSalvando(false); }
  }

  return (
    <Dialogo titulo={unidade ? `Editar unidade ${unidade.simbolo}` : 'Nova unidade'} aberto aoFechar={aoFecharSeguro} largura={600}
      rodape={<>
        <Botao aoClicar={aoFecharSeguro} desligado={salvando}>Cancelar</Botao>
        <Botao primario trabalhando={salvando} aoClicar={() => void salvar()}>{unidade ? 'Salvar' : 'Criar unidade'}</Botao>
      </>}>
      <form className="at-dic-editor" onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
        {erro && <div className="at-dic-caixa at-dic-caixa--erro" role="alert"><p>{erro.texto}</p>
          {erro.conflito && unidade && <Botao aoClicar={() => void aoReabrir(unidade.id)}>Fechar e reabrir</Botao>}</div>}
        <div className="at-dic-form">
          <label className="at-rotulo-campo">Símbolo
            <input className="at-campo" value={simbolo} maxLength={20} readOnly={unidade !== null} aria-readonly={unidade !== null} aria-invalid={invalido('simbolo')} onChange={(e) => { setSimbolo(e.target.value); setErro(null); }} />
            <span className="at-dic-dica">{unidade ? 'O símbolo é a identidade da unidade e não muda.' : 'Ex.: mm, kg, W. Não poderá ser mudado depois.'}</span>
          </label>
          <label className="at-rotulo-campo">Nome
            <input className="at-campo" value={nome} maxLength={80} aria-invalid={invalido('nome')} onChange={(e) => { setNome(e.target.value); setErro(null); }} />
          </label>
          <label className="at-rotulo-campo">Grandeza
            <input className="at-campo" value={grandeza} maxLength={40} list={idLista} aria-invalid={invalido('grandeza')} placeholder="ex.: comprimento" onChange={(e) => { setGrandeza(e.target.value); setErro(null); }} />
            <datalist id={idLista}>{grandezas.map((g) => <option key={g} value={g} />)}</datalist>
            <span className="at-dic-dica">Escolha uma existente para converter entre unidades da mesma grandeza.</span>
          </label>
          <label className="at-rotulo-campo">Fator para a unidade base
            <input className="at-campo" inputMode="decimal" value={fator} aria-invalid={invalido('fator_base')} placeholder="sem fator" onChange={(e) => { setFator(e.target.value); setErro(null); }} />
            <span className="at-dic-dica">Valor × fator = valor na unidade base (ex.: m = 1; cm = 0,01; mm = 0,001). Vazio = não converte.</span>
          </label>
        </div>
        {unidade && (unidade.atributos > 0 || unidade.valores > 0) && fator.trim() !== fatorInicial && (
          <div className="at-dic-caixa at-dic-caixa--aviso">Esta unidade é usada em {n(unidade.atributos)} atributo{unidade.atributos === 1 ? '' : 's'} e {n(unidade.valores)} valor{unidade.valores === 1 ? '' : 'es'}. Mudar o fator altera as conversões futuras; os valores gravados não mudam.</div>
        )}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Dialogo>
  );
}
