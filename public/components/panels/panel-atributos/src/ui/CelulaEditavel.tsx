// panel-atributos/src/ui/CelulaEditavel.tsx — UX-2b (DIREITA, 19/11): edição NA CÉLULA, sem modal (Atributos e Unidades).
// Clicou, edita; Enter ou sair da célula salva; Esc cancela. Cada gravação = UMA intenção com chave de operação própria
// (X-Chave-Operacao) e a versão do item; o desfecho do contrato "foi salvo" aparece num ícone pequeno ao lado do valor.
// Resposta perdida/sem recibo → "?" + "Conferir gravação" (GET com a MESMA chave; nada é reenviado às cegas).
// Regras puras em ./celula.ts. Os cliques dentro da célula não disparam o clique da linha (TabelaDados ignora campos/botões).
import React from 'react';
import { conferirGravacao, enviar, novaChaveOperacao } from '../lib/api';
import { marcarPendencia } from '../lib/pendencias';
import { CELULA0, estadoDaConferencia, estadoDaResposta, estadoDoErro, iconeDaFase, livre, podeConferir, type EstadoCelula } from './celula';
export type { EstadoCelula };

/**
 * Estados de TODAS as células de uma tela, por chave ("<id>:<campo>"). Cada gravação = UMA intenção com chave de operação própria.
 * `aoGravado` relê os dados (versão nova) ANTES de liberar a célula: a próxima edição da mesma linha já sai com a versão certa.
 */
export function useGravacoes(aoGravado: () => Promise<unknown>) {
  const [estados, setEstados] = React.useState<Record<string, EstadoCelula>>({});
  const ref = React.useRef(estados); ref.current = estados;
  const vivo = React.useRef(true);
  React.useEffect(() => () => { vivo.current = false; }, []);
  const por = (k: string, e: EstadoCelula) => { if (vivo.current) setEstados((m) => ({ ...m, [k]: e })); };
  const estadoDe = React.useCallback((k: string): EstadoCelula => estados[k] ?? CELULA0, [estados]);
  /** Devolve o estado final. `campo` = chave de meta.motivos para a mensagem da recusa. */
  const gravar = React.useCallback(async (k: string, rota: string, corpo: unknown, campo?: string): Promise<EstadoCelula & { dados?: unknown }> => {
    const chave = novaChaveOperacao();
    marcarPendencia(chave, true); por(k, { fase: 'salvando', mensagem: null, chave });
    let st: EstadoCelula; let dados: unknown;
    try {
      const r = await enviar<{ desfecho?: string; recibo?: { desfecho: 'aplicada' | 'sem_mudanca' } }>(rota, corpo, { chave });
      st = estadoDaResposta(r, chave); dados = r;
      try { await aoGravado(); } catch { /* a releitura falhou: o salvo vale (tem recibo); a tela mostra o aviso de recarga dela */ }
    } catch (e) { st = estadoDoErro(e, chave, campo); }
    if (!podeConferir(st.fase)) marcarPendencia(chave, false);
    por(k, st); return { ...st, dados };
  }, [aoGravado]);
  /** "Conferir gravação": GET com a MESMA chave; nada é reenviado. */
  const conferir = React.useCallback(async (k: string): Promise<EstadoCelula> => {
    const atual = ref.current[k]; const chave = atual?.chave; if (!chave) return atual ?? CELULA0;
    por(k, { ...atual, fase: 'conferindo' });
    let st: EstadoCelula;
    try { st = estadoDaConferencia(await conferirGravacao(chave), chave); }
    catch { st = { fase: 'desconhecido', mensagem: 'Não foi possível conferir agora. Tente de novo.', chave }; }
    if (!podeConferir(st.fase)) marcarPendencia(chave, false);
    if (st.fase === 'salvo') { try { await aoGravado(); } catch { /* idem */ } }
    por(k, st); return st;
  }, [aoGravado]);
  const limpar = React.useCallback((k: string) => { const c = ref.current[k]?.chave; if (c) marcarPendencia(c, false); setEstados((m) => { const x = { ...m }; delete x[k]; return x; }); }, []);
  return { estadoDe, gravar, conferir, limpar };
}

/**
 * Ícone pequeno do desfecho. Desconhecido/em andamento viram botão "Conferir gravação".
 * `compacto` (grades): o botão é só o ícone (nome acessível e dica com o texto completo) — o aviso fica DENTRO da célula, num espaço
 * reservado, sem mudar a largura nem a posição das colunas (parecer do Jhony, 19/11).
 */
export function IconeEstado({ estado, aoConferir, compacto = false }: { estado: EstadoCelula; aoConferir?: () => void; compacto?: boolean }) {
  const ic = iconeDaFase(estado.fase); if (!ic) return null;
  const titulo = estado.mensagem && estado.fase !== 'salvo' ? `${ic.rotulo}. ${estado.mensagem}` : ic.rotulo;
  if (podeConferir(estado.fase) && aoConferir && compacto) {
    // na grade: mensagem curta VISÍVEL sobre a própria célula (posição absoluta no espaço da célula: as colunas não se movem)
    return (
      <span className={`at-cel__alerta at-cel__alerta--${ic.tom}`} role="status" data-fase={estado.fase} title={titulo}>
        <span className="at-cel__alerta-txt"><span aria-hidden>{ic.simbolo} </span>Não conseguimos confirmar</span>
        <button type="button" className={`at-cel__estado at-cel__estado--${ic.tom} at-cel__conferir at-cel__conferir--compacto`} data-fase={estado.fase}
          title={`${titulo} Clique para conferir a gravação.`} aria-label="Conferir gravação" onClick={(e) => { e.stopPropagation(); aoConferir(); }}>Conferir</button>
      </span>);
  }
  if (podeConferir(estado.fase) && aoConferir) {
    return (
      <button type="button" className={`at-cel__estado at-cel__estado--${ic.tom} at-cel__conferir ${compacto ? 'at-cel__conferir--compacto' : ''}`} data-fase={estado.fase}
        title={`${titulo} Clique para conferir a gravação.`} aria-label="Conferir gravação" onClick={(e) => { e.stopPropagation(); aoConferir(); }}>
        <span aria-hidden>{compacto ? '↻' : ic.simbolo}</span>{!compacto && ' Conferir gravação'}
      </button>);
  }
  return <span className={`at-cel__estado at-cel__estado--${ic.tom}`} data-fase={estado.fase} title={titulo} role="img" aria-label={titulo}>{ic.simbolo}</span>;
}

/** Mensagem da recusa/conflito logo abaixo do valor (some ao editar de novo). */
function Aviso({ estado }: { estado: EstadoCelula }) {
  if (estado.fase !== 'recusada' && estado.fase !== 'conflito' && estado.fase !== 'desconhecido') return null;
  return <span className={`at-cel__aviso ${estado.fase === 'recusada' ? 'at-cel__aviso--erro' : ''}`} role={estado.fase === 'recusada' ? 'alert' : 'status'}>{estado.mensagem}</span>;
}

/**
 * Célula de texto: mostra o valor; clique (ou Enter/F2 no foco) abre o campo; Enter ou sair salva; Esc cancela.
 * `aoSalvar(texto)` faz a gravação (com `useGravacoes`) e devolve true se salvou; com recusa o rascunho fica no campo.
 */
export function CelulaTexto({ valor, rotulo, pode, validar, aoSalvar, estado, aoConferir, multilinha = false, vazio = '—', classe }: {
  valor: string | null; rotulo: string; pode: boolean; validar?: (v: string) => string | null; aoSalvar: (v: string) => Promise<boolean>;
  estado: EstadoCelula; aoConferir: () => void; multilinha?: boolean; vazio?: string; classe?: string;
}) {
  const [rascunho, setRascunho] = React.useState<string | null>(null);
  const [erroLocal, setErroLocal] = React.useState<string | null>(null);
  const campo = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const saindo = React.useRef(false);
  React.useEffect(() => { if (rascunho !== null) { campo.current?.focus(); campo.current?.select(); } }, [rascunho !== null]);   // eslint-disable-line react-hooks/exhaustive-deps
  // "Conferir gravação" confirmou (salvo/nada mudou) com o campo ainda aberto → fecha o rascunho: o valor salvo vem da releitura
  React.useEffect(() => { if ((estado.fase === 'salvo' || estado.fase === 'sem_mudanca') && !saindo.current) setRascunho(null); }, [estado.fase]);
  const abrir = () => { if (pode && livre(estado.fase)) { setErroLocal(null); setRascunho(valor ?? ''); } };
  const cancelar = () => { saindo.current = true; setRascunho(null); setErroLocal(null); };
  const confirmar = async () => {
    if (rascunho === null || saindo.current) { saindo.current = false; return; }
    if (rascunho.trim() === (valor ?? '').trim()) { setRascunho(null); return; }
    const err = validar?.(rascunho) ?? null; if (err) { setErroLocal(err); return; }
    saindo.current = true;
    const ok = await aoSalvar(rascunho);
    saindo.current = false;
    if (ok) setRascunho(null);   // recusa/conflito/desconhecido: o rascunho fica para a pessoa revisar
  };
  if (rascunho !== null) {
    const props = {
      ref: campo, value: rascunho, 'aria-label': rotulo, className: 'at-cel__campo', disabled: estado.fase === 'salvando',
      'aria-invalid': erroLocal ? true : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => { setRascunho(e.target.value); setErroLocal(null); },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar(); }
        else if (e.key === 'Enter' && !(multilinha && e.shiftKey)) { e.preventDefault(); e.stopPropagation(); void confirmar(); }
      },
      onBlur: () => { void confirmar(); },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    };
    return (
      <div className={`at-cel at-cel--editando ${classe ?? ''}`}>
        {multilinha ? <textarea rows={2} {...props} /> : <input type="text" {...props} />}
        {/* mede a coluna com o MESMO texto e o mesmo estilo do modo de leitura: abrir o campo ou mostrar um aviso não muda a largura */}
        <span className="at-cel__valor at-cel__medida" aria-hidden><span className="at-cel__texto">{rascunho || vazio}</span></span>
        <IconeEstado estado={estado} aoConferir={aoConferir} compacto />
        {erroLocal ? <span className="at-cel__aviso at-cel__aviso--erro" role="alert">{erroLocal}</span> : <Aviso estado={estado} />}
      </div>);
  }
  return (
    <div className={`at-cel ${classe ?? ''}`}>
      {pode ? (
        <button type="button" className="at-cel__valor" aria-label={`${rotulo}: ${valor || 'vazio'}. Editar`} onClick={(e) => { e.stopPropagation(); abrir(); }}
          disabled={!livre(estado.fase)}>
          {valor ? <span className="at-cel__texto" title={valor}>{valor}</span> : <span className="at-dic-zero">{vazio}</span>}
        </button>
      ) : (valor ? <span className="at-cel__texto">{valor}</span> : <span className="at-dic-zero">{vazio}</span>)}
      <IconeEstado estado={estado} aoConferir={aoConferir} compacto />
      <Aviso estado={estado} />
    </div>);
}

/**
 * Célula de escolha. ATRIBUTOS V3 (19/11): em REPOUSO mostra só o texto (ex.: o símbolo da unidade — `repouso`); o select aparece ao clicar
 * (Enter/Espaço no foco) e some ao escolher, ao sair ou com Esc. `aoEscolher` decide: grava direto (importância) ou abre a confirmação na
 * linha (tipo/unidade). Uma grade em repouso não exibe centenas de selects.
 */
export function CelulaEscolha({ valor, opcoes, rotulo, pode, aoEscolher, estado, aoConferir, vazio = '—', repouso }: {
  valor: string; opcoes: { valor: string; rotulo: string }[]; rotulo: string; pode: boolean; aoEscolher: (v: string) => void;
  estado: EstadoCelula; aoConferir: () => void; vazio?: string; repouso?: string | null;
}) {
  const [aberto, setAberto] = React.useState(false);
  const atual = opcoes.find((o) => o.valor === valor)?.rotulo;
  const texto = repouso !== undefined ? repouso : (valor !== '' ? atual : null);
  const titulo = atual && valor !== '' ? atual : undefined;
  return (
    <div className="at-cel">
      {pode && aberto ? (
        <select className="at-cel__select" aria-label={rotulo} value={valor} autoFocus disabled={!livre(estado.fase)} onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setAberto(false); } }} onBlur={() => setAberto(false)}
          onChange={(e) => { setAberto(false); if (e.target.value !== valor) aoEscolher(e.target.value); }}>
          {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
      ) : pode ? (
        <button type="button" className="at-cel__valor" aria-label={`${rotulo}: ${titulo ?? 'vazio'}. Alterar`} title={titulo} disabled={!livre(estado.fase)}
          onClick={(e) => { e.stopPropagation(); setAberto(true); }}>
          {texto ? <span className="at-cel__texto">{texto}</span> : <span className="at-dic-zero">{vazio}</span>}
        </button>
      ) : (texto ? <span className="at-cel__texto" title={titulo}>{texto}</span> : <span className="at-dic-zero">{vazio}</span>)}
      <IconeEstado estado={estado} aoConferir={aoConferir} compacto />
      <Aviso estado={estado} />
    </div>);
}

/** Liga/desliga (ícone). O clique só PEDE a confirmação na linha; não grava. */
export function BotaoLigaDesliga({ ativo, rotulo, pode, aoPedir, estado, aoConferir }: {
  ativo: boolean; rotulo: string; pode: boolean; aoPedir: () => void; estado: EstadoCelula; aoConferir: () => void;
}) {
  return (
    <div className="at-cel at-cel--icones">
      <button type="button" className={`at-liga ${ativo ? 'at-liga--on' : ''}`} role="switch" aria-checked={ativo} disabled={!pode || !livre(estado.fase)}
        aria-label={`${ativo ? 'Desativar' : 'Reativar'} ${rotulo}`} title={ativo ? 'Ativo — clique para desativar' : 'Inativo — clique para reativar'}
        onClick={(e) => { e.stopPropagation(); aoPedir(); }}>
        <span className="at-liga__trilho" aria-hidden><span className="at-liga__botao" /></span>
      </button>
      <IconeEstado estado={estado} aoConferir={aoConferir} compacto />
    </div>);
}

/** Barra amarela de confirmação NA PRÓPRIA LINHA (vai na linha expansível da TabelaDados). */
export function BarraConfirmacao({ texto, motivo, aoMotivo, rotuloConfirmar = 'Confirmar', aoConfirmar, aoCancelar, trabalhando = false, erro = null }: {
  texto: string; motivo?: string; aoMotivo?: (v: string) => void; rotuloConfirmar?: string; aoConfirmar: () => void; aoCancelar: () => void;
  trabalhando?: boolean; erro?: string | null;
}) {
  const pedeMotivo = aoMotivo !== undefined;
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { (ref.current?.querySelector('input, button') as HTMLElement | null)?.focus(); }, []);
  return (
    <div ref={ref} className="at-barra-conf" role="group" aria-label="Confirmar alteração" data-at-barra-conf
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); aoCancelar(); } }}>
      <span className="at-barra-conf__texto">{texto}</span>
      {pedeMotivo && (
        <label className="at-barra-conf__motivo">Motivo
          <input type="text" className="at-cel__campo" value={motivo ?? ''} onChange={(e) => aoMotivo!(e.target.value)} placeholder="Por que trocar?"
            onKeyDown={(e) => { if (e.key === 'Enter' && (motivo ?? '').trim()) { e.preventDefault(); aoConfirmar(); } }} />
        </label>)}
      <span className="at-barra-conf__acoes">
        <button type="button" className="bl-botao bl-botao--primario" disabled={trabalhando || (pedeMotivo && !(motivo ?? '').trim())} aria-busy={trabalhando} onClick={aoConfirmar}>{rotuloConfirmar}</button>
        <button type="button" className="bl-botao" disabled={trabalhando} onClick={aoCancelar}>Cancelar</button>
      </span>
      {erro && <span className="at-barra-conf__erro" role="alert">{erro}</span>}
    </div>);
}
