// panel-atributos/src/ui/EditorValor.tsx — campo de valor por tipo, com unidade, estado e gravação por campo (A10: sem interface otimista —
// "Salvo" só depois da resposta). Usado na ficha e na grade. Conflito de versão (409) → "Alguém alterou este campo. Recarregar".
import React from 'react';
import type { ItemFicha } from '../lib/tipos';
import { conferirGravacao, enviar, ErroApi, MSG_DESCONHECIDO, novaChaveOperacao, type ValorAtualConflito } from '../lib/api';
import { marcarPendencia } from '../lib/pendencias';
import { Contexto } from '../app/contexto';
import { decimal, numeroParaApi } from '../lib/formatar';
import { ESTADO } from '../lib/rotulos';
import { Dialogo, Botao } from './Comuns';

// "FOI SALVO OU NÃO": cada estado diz o que se SABE da gravação (contrato da ESQUERDA, docs/atributos/CONTRATO-FOI-SALVO.md)
type Situacao = { tipo: 'parado' } | { tipo: 'salvando'; reenvio?: boolean } | { tipo: 'salvo'; semMudanca?: boolean }
  | { tipo: 'salvoSemTela' }                                   // recibo válido, mas a releitura falhou → [Atualizar valor] (só leitura)
  | { tipo: 'recusada'; msg: string; podeRepetir?: boolean }   // recusa COMPROVADA: nada foi gravado; o rascunho fica
  | { tipo: 'conflito'; aoAbrir: string; rascunho: string; atual: string | null }
  | { tipo: 'desconhecido'; msg?: string; podeRepetir?: boolean }   // não sabemos o resultado → [Conferir gravação] (+ [Tentar de novo] com a MESMA chave)
  | { tipo: 'conferindo' } | { tipo: 'emAndamento' };

function rascunhoDe(it: ItemFicha): string {
  const v = it.valor;
  if (!v || v.estado !== 'informado') return '';
  if (it.tipo === 'numero' || it.tipo === 'inteiro') return v.numero !== null ? decimal(v.numero) : '';
  if (it.tipo === 'data') return v.data ?? '';
  if (it.tipo === 'opcao') return v.opcao_ids[0] ? String(v.opcao_ids[0]) : '';
  if (it.tipo === 'booleano') return v.booleano === null ? '' : v.booleano ? '1' : '0';
  return v.texto ?? '';
}

export function EditorValor({ item, productId, podeEditar, compacto = false, aoGravar, aoRecarregar, autoFoco = false, rotuloVazio, aoConfirmarEnter }: {
  item: ItemFicha; productId: number; podeEditar: boolean; compacto?: boolean; /** "foi salvo ou não": podem devolver Promise<boolean> — false = a releitura falhou (a tela mostra "Atualizar valor") */ aoGravar: () => void | boolean | Promise<boolean | void>; aoRecarregar: () => void | boolean | Promise<boolean | void>; autoFoco?: boolean;
  /** UX-1: texto do campo vazio editável (a grade do Preencher usa "Preencher"); sem ele, o de sempre */ rotuloVazio?: string;
  /** UX-1: Enter num campo de texto — chamado SÓ quando a gravação confirmou (ou quando não havia nada para gravar). Erro/conflito: o foco fica. */ aoConfirmarEnter?: () => void;
}) {
  const [txt, setTxt] = React.useState(() => rascunhoDe(item));
  const [sit, setSit] = React.useState<Situacao>({ tipo: 'parado' });
  // "foi salvo ou não": com o resultado de uma tentativa ainda INCERTO (desconhecido / em andamento / conferindo), sair do campo, Enter ou
  // clique NÃO iniciam outra gravação da mesma edição (seria um 2º efeito com outra chave). Primeiro "Conferir gravação".
  const incerto = sit.tipo === 'desconhecido' || sit.tipo === 'emAndamento' || sit.tipo === 'conferindo';
  const [trocaUnidade, setTrocaUnidade] = React.useState<number | null>(null);
  // unidade escolhida ANTES do número num campo vazio: faz parte do RASCUNHO da célula e vai junto na 1ª gravação (Cima, 18/11)
  const [unidRascunho, setUnidRascunho] = React.useState<number | null>(null);
  // apagar o texto de um campo PREENCHIDO não limpa sozinho: pede confirmação mostrando o valor salvo (Cima, 18/11); Esc/Cancelar restaura
  const [confirmarLimpar, setConfirmarLimpar] = React.useState(false);
  const original = React.useRef(rascunhoDe(item));
  const ocupado = React.useRef(false);
  const pelaTecla = React.useRef(false);                                // a gravação em curso veio de um Enter (desce só se confirmar)                                   // uma gravação por vez (Enter + sair do campo não grava 2×)
  // DSHOW-078: "Tentar de novo" reenvia EXATAMENTE este envelope (capturado na 1ª tentativa: produto, atributo, valor/estado,
  // unidade, versão da linha, revisão do conjunto). Nada é recalculado; se os dados mudaram, o servidor responde 409.
  // "foi salvo ou não": a CHAVE DE OPERAÇÃO nasce com o envelope (uma por intenção) e vai junto em todo reenvio → o servidor aplica uma vez só
  const ultimo = React.useRef<{ rota: string; envelope: Readonly<Record<string, unknown>>; texto?: string; chave: string } | null>(null);   // "Tentar de novo" repete esta
  const m = React.useContext(Contexto);
  const manterRascunho = React.useRef<string | null>(null);   // "Revisar meu valor" no conflito: a releitura não apaga o que foi digitado
  const [esperando, setEsperando] = React.useState(false);              // gravou; aguardando a recarga trazer a versão nova
  React.useEffect(() => { const r = rascunhoDe(item); original.current = r; setTxt(manterRascunho.current ?? r); manterRascunho.current = null; setEsperando(false); setUnidRascunho(null); }, [item.valor?.versao, item.versao_conjunto, item.valor?.versao_conjunto, item.valor?.estado, item.atributo_id]);
  React.useEffect(() => { if (!esperando) return; const t = window.setTimeout(() => setEsperando(false), 3000); return () => window.clearTimeout(t); }, [esperando]);
  const estado = item.valor?.estado ?? null;
  const unidadeAtual = unidRascunho ?? item.valor?.unidade_id ?? item.unidade_efetiva?.id ?? null;
  const numerico = item.tipo === 'numero' || item.tipo === 'inteiro';
  const ro = !podeEditar || item.autoridade === 'precifica';
  const id = `campo-${productId}-${item.atributo_id}`;

  const chamar = (rota: string, corpo: Record<string, unknown>, texto?: string) => {
    if (ocupado.current || esperando || incerto) return;   // incerto: ver confirmarTexto
    // DSHOW-034: a versão do CONJUNTO vai em toda gravação (limpar/mudar estado da multiopção a exigem; o servidor ignora nos demais)
    const envelope = Object.freeze({ product_id: productId, atributo_id: item.atributo_id, versao_conjunto: item.versao_conjunto ?? item.valor?.versao_conjunto, ...corpo });
    return executar({ rota, envelope, texto, chave: novaChaveOperacao() });
  };
  /** Gravação confirmada por recibo: "Salvo" + anúncio educado; a releitura decide se a tela já mostra o valor (falhou → Atualizar valor). */
  const confirmado = async (texto: string | undefined, semMudanca: boolean, releituraFalhou: boolean) => {
    if (texto !== undefined) original.current = texto;                  // já gravado: sair do campo não reenvia
    setSit({ tipo: 'salvo', semMudanca }); setEsperando(true);
    m?.anunciar(`Produto ${productId}, ${item.rotulo} ${semMudanca ? 'sem mudança' : 'salvo'}`);
    if (pelaTecla.current) { pelaTecla.current = false; aoConfirmarEnter?.(); }
    const ok = releituraFalhou ? false : await Promise.resolve(aoGravar()).then((r) => r !== false, () => false);
    if (!ok) { setEsperando(false); setSit({ tipo: 'salvoSemTela' }); return; }
    window.setTimeout(() => setSit((s) => (s.tipo === 'salvo' ? { tipo: 'parado' } : s)), 2500);
  };
  const falhou = (e: unknown, envelope: Readonly<Record<string, unknown>>) => {
    pelaTecla.current = false;   // erro/conflito/desconhecido: o foco fica no valor digitado
    if (!(e instanceof ErroApi)) { setSit({ tipo: 'desconhecido' }); return; }
    if (e.desconhecido) { setSit({ tipo: 'desconhecido' }); return; }
    if (e.emAndamento) { setSit({ tipo: 'emAndamento' }); return; }
    if (e.conflito) { setSit({ tipo: 'conflito', aoAbrir: textoCampo(item, original.current, item.valor?.unidade_id ?? null), rascunho: textoEnvelope(item, envelope), atual: textoAtual(item, e.extra.atual) }); return; }
    const motivo = e.extra.motivos ? Object.values(e.extra.motivos).join(' ') : e.message;
    setSit({ tipo: 'recusada', msg: motivo || e.message, podeRepetir: e.http >= 500 });
  };
  const executar = async (u: { rota: string; envelope: Readonly<Record<string, unknown>>; texto?: string; chave: string }, reenvio = false) => {
    if (ocupado.current) return;
    ocupado.current = true; ultimo.current = u;
    const { rota, envelope, texto, chave } = u;
    setSit({ tipo: 'salvando', reenvio });
    try {
      const d = await enviar<{ desfecho?: string; releitura?: string }>(rota, envelope, { chave });
      await confirmado(texto, d?.desfecho === 'sem_mudanca', d?.releitura === 'falhou');
    } catch (e) { falhou(e, envelope); } finally { ocupado.current = false; }
  };
  // DSHOW-078 + chave de operação: o MESMO envelope com a MESMA chave → se a 1ª já gravou, o servidor devolve o recibo original (efeito único)
  const tentarDeNovo = () => { const u = ultimo.current; if (u) executar(u, true); };
  /** Conferir gravação (GET, não grava): pergunta ao servidor o que aconteceu com ESTA chave. */
  const conferir = async () => {
    const u = ultimo.current; if (!u || ocupado.current) return;
    ocupado.current = true; setSit({ tipo: 'conferindo' });
    try {
      const c = await conferirGravacao(u.chave);
      if (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca') { ocupado.current = false; await confirmado(u.texto, c.resultado === 'sem_mudanca', false); return; }
      if (c.resultado === 'em_andamento') setSit({ tipo: 'emAndamento' });
      else if (c.resultado === 'nao_aplicada') setSit({ tipo: 'recusada', msg: c.erro?.mensagem ?? 'O servidor não aplicou esta alteração.' });
      else if (c.resultado === 'interrompida') setSit({ tipo: 'recusada', msg: 'A gravação foi interrompida antes de concluir. Nada foi gravado.', podeRepetir: true });
      else setSit({ tipo: 'desconhecido', msg: 'Ainda não encontramos o resultado desta gravação.', podeRepetir: true });   // DSHOW-099: nao_encontrada NÃO prova "não salvo"
    } catch { setSit({ tipo: 'desconhecido', msg: 'Não foi possível conferir agora.' }); } finally { ocupado.current = false; }
  };
  const atualizarValor = () => { Promise.resolve(aoRecarregar()).then((r) => { if (r !== false) setSit({ tipo: 'parado' }); }, () => undefined); };
  // item 5: beforeunload só com rascunho não enviado ou operação pendente
  const pendente = (!ro && txt !== original.current) || ['salvando', 'desconhecido', 'conferindo', 'emAndamento'].includes(sit.tipo);
  React.useEffect(() => { const k = `${productId}:${item.atributo_id}`; marcarPendencia(k, pendente); return () => marcarPendencia(k, false); }, [pendente, productId, item.atributo_id]);
  const travado = sit.tipo === 'salvando' || sit.tipo === 'conferindo' || esperando;
  const versao = item.valor?.versao;
  const gravar = (valor: unknown, extra: Record<string, unknown> = {}, texto?: string) => chamar('valor', { valor, estado: 'informado', versao, ...(numerico && unidadeAtual ? { unidade_id: unidadeAtual } : {}), ...extra }, texto);
  const confirmarTexto = () => {
    if (ro || txt === original.current || ocupado.current || esperando || confirmarLimpar || incerto) return;
    if (txt.trim() === '') { if (item.valor && !confirmarLimpar) setConfirmarLimpar(true); return; }
    gravar(numerico ? numeroParaApi(txt) : txt, {}, txt);
  };

  // item 4: o sucesso é anunciado na região role="status" do módulo; aqui, role="alert" SÓ para o que exige atenção
  const link = (r: string, f: () => void) => <button type="button" className="at-link" onClick={f}>{r}</button>;
  const status = sit.tipo === 'salvando' ? <span className="at-salvo at-salvo--andando">{sit.reenvio ? 'Reenviando a mesma alteração…' : 'Salvando…'}</span>
    : sit.tipo === 'conferindo' ? <span className="at-salvo at-salvo--andando">Conferindo a gravação…</span>
    : sit.tipo === 'salvo' ? <span className="at-salvo at-salvo--ok">{sit.semMudanca ? 'Nada mudou' : 'Salvo'}</span>
    : sit.tipo === 'salvoSemTela' ? <span className="at-salvo at-salvo--aviso" role="alert">Salvo. Não foi possível atualizar o valor na tela. {link('Atualizar valor', atualizarValor)}</span>
    : sit.tipo === 'recusada' ? <span className="at-salvo at-salvo--erro" role="alert">Não foi salvo. <em className="at-salvo__motivo">{sit.msg}</em>{sit.podeRepetir && <> {link('Tentar de novo', tentarDeNovo)}</>}</span>
    : sit.tipo === 'desconhecido' ? <span className="at-salvo at-salvo--erro" role="alert">{MSG_DESCONHECIDO}{sit.msg ? ` ${sit.msg}` : ''} {link(sit.podeRepetir ? 'Consultar de novo' : 'Conferir gravação', conferir)}{sit.podeRepetir && <> · {link('Tentar de novo com segurança', tentarDeNovo)}</>}</span>
    : sit.tipo === 'emAndamento' ? <span className="at-salvo at-salvo--aviso" role="alert">A gravação ainda está em andamento. {link('Conferir gravação', conferir)}</span>
    : sit.tipo === 'conflito' ? (
      <span className="at-salvo at-salvo--erro at-conflito" role="alert">
        O valor mudou desde que você começou.
        <span className="at-conflito__linhas"><span>Valor ao abrir: <strong>{sit.aoAbrir}</strong></span><span>Seu rascunho: <strong>{sit.rascunho}</strong></span><span>Valor atual: <strong>{sit.atual ?? 'não foi possível ler'}</strong></span></span>
        {link('Usar valor atual', () => { setSit({ tipo: 'parado' }); manterRascunho.current = null; aoRecarregar(); })}{' · '}
        {link('Revisar meu valor', () => { manterRascunho.current = txt; setSit({ tipo: 'parado' }); aoRecarregar(); })}
      </span>)
    : null;

  let campo: React.ReactNode;
  if (estado && estado !== 'informado') {
    campo = <span className={`at-estado-fixo at-estado-fixo--${estado}`}>{ESTADO[estado]}</span>;
  } else if (item.tipo === 'booleano') {
    campo = (
      <div className="at-segmentado" role="radiogroup" aria-label={item.rotulo}>
        {[['1', 'Sim'], ['0', 'Não'], ['', 'Sem resposta']].map(([v, r]) => (
          <button key={r} type="button" role="radio" aria-checked={txt === v} disabled={ro || travado} className={txt === v ? 'ativo' : ''}
            onClick={() => { if (v === txt) return; setTxt(v); if (v === '') { if (item.valor) chamar('valor_limpar', { versao }); } else gravar(v === '1'); }}>{r}</button>))}
      </div>);
  } else if (item.tipo === 'opcao') {
    campo = (
      <select id={id} className="at-campo" value={txt} disabled={ro || travado} aria-label={item.rotulo} autoFocus={autoFoco}
        onChange={(e) => { setTxt(e.target.value); if (e.target.value === '') { if (item.valor) chamar('valor_limpar', { versao }); } else gravar(Number(e.target.value)); }}>
        <option value="">{rotuloVazio ?? '—'}</option>
        {item.opcoes.filter((o) => o.ativo || String(o.id) === txt).map((o) => <option key={o.id} value={o.id}>{o.rotulo}{o.ativo ? '' : ' (desativada)'}</option>)}
      </select>);
  } else if (item.tipo === 'multiopcao') {
    const marcadas = new Set(item.valor?.opcao_ids ?? []);
    campo = (
      <div className="at-multi">{item.opcoes.filter((o) => o.ativo || marcadas.has(o.id)).map((o) => (
        <label key={o.id} className="at-check"><input type="checkbox" checked={marcadas.has(o.id)} disabled={ro || travado}
          onChange={(e) => e.target.checked ? gravar(o.id) : chamar('valor_opcao_remover', { opcao_id: o.id, versao })} />{o.rotulo}</label>))}</div>);
  } else {
    campo = (
      <input id={id} className={`at-campo ${numerico ? 'at-campo--num' : ''}`} type={item.tipo === 'data' ? 'date' : 'text'} inputMode={numerico ? 'decimal' : undefined}
        value={txt} readOnly={ro} aria-label={item.rotulo} autoFocus={autoFoco} placeholder={ro ? '' : rotuloVazio ?? (numerico ? '—' : item.tipo === 'data' ? '' : 'Digite…')}
        onChange={(e) => setTxt(e.target.value)} onBlur={confirmarTexto}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (txt === original.current) { aoConfirmarEnter?.(); return; } pelaTecla.current = true; confirmarTexto(); if (!ocupado.current) pelaTecla.current = false; } if (e.key === 'Escape') { setTxt(original.current); setUnidRascunho(null); } }} />);   // Esc cancela o rascunho inteiro (texto e unidade)
  }

  return (
    <div className={`at-editor ${compacto ? 'at-editor--compacto' : ''}`}>
      <div className="at-editor__linha">
        {campo}
        {numerico && item.unidades.length > 0 && (
          <select className="at-campo at-campo--unid" aria-label={`Unidade de ${item.rotulo}`} disabled={ro || travado || (estado !== null && estado !== 'informado')} value={unidadeAtual ?? ''}
            onChange={(e) => {
              const u = Number(e.target.value);
              if (item.valor?.numero != null && item.valor.estado === 'informado') setTrocaUnidade(u);   // H5: pergunta converter × só trocar
              else if (txt.trim() !== '') gravar(numeroParaApi(txt), { unidade_id: u }, txt);
              else setUnidRascunho(u);   // campo vazio: guarda a escolha; vai junto com o número na 1ª gravação
            }}>
            {item.unidades.map((u) => <option key={u.id} value={u.id}>{u.simbolo}</option>)}
          </select>)}
        {numerico && item.unidades.length === 0 && item.unidade_efetiva && <span className="at-unid-fixa">{item.unidade_efetiva.simbolo}</span>}
        {!ro && !compacto && (
          <select className="at-campo at-campo--estado" aria-label={`Estado de ${item.rotulo}`} value={estado ?? ''} disabled={travado}
            onChange={(e) => { const v = e.target.value; if (v === 'informado' || v === '') { if (estado && estado !== 'informado') chamar('valor_limpar', { versao }); return; } chamar('valor', { estado: v, versao }); }}>
            <option value="">{estado === 'informado' ? 'Informado' : 'Sem valor'}</option>
            {item.aceita_nao_se_aplica && <option value="nao_se_aplica">Não se aplica</option>}
            <option value="desconhecido">Desconhecido</option>
          </select>)}
      </div>
      {status}
      <Dialogo titulo="Limpar o valor?" aberto={confirmarLimpar} aoFechar={() => { setConfirmarLimpar(false); setTxt(original.current); }}
        rodape={<>
          <Botao aoClicar={() => { setConfirmarLimpar(false); setTxt(original.current); }}>Cancelar</Botao>
          <Botao perigo aoClicar={() => { setConfirmarLimpar(false); chamar('valor_limpar', { versao }, ''); }}>Limpar valor</Botao>
        </>}>
        <p>O valor salvo de <strong>{item.rotulo}</strong> é <strong>{original.current}{numerico && unidadeAtual ? ` ${item.unidades.find((u) => u.id === unidadeAtual)?.simbolo ?? item.unidade_efetiva?.simbolo ?? ''}` : ''}</strong>. Limpar apaga o valor (fica no histórico).</p>
      </Dialogo>
      <Dialogo titulo="Trocar a unidade" aberto={trocaUnidade !== null} aoFechar={() => setTrocaUnidade(null)}
        rodape={<>
          <Botao aoClicar={() => setTrocaUnidade(null)}>Cancelar</Botao>
          <Botao aoClicar={() => { const u = trocaUnidade; setTrocaUnidade(null); chamar('valor_unidade', { unidade_id: u, converter: false, versao }); }}>Só trocar a unidade</Botao>
          <Botao primario aoClicar={() => { const u = trocaUnidade; setTrocaUnidade(null); chamar('valor_unidade', { unidade_id: u, converter: true, versao }); }}>Converter o número</Botao>
        </>}>
        <p>O valor atual é <strong>{item.valor?.numero ? decimal(item.valor.numero) : ''} {item.unidades.find((u) => u.id === unidadeAtual)?.simbolo}</strong>. Para <strong>{item.unidades.find((u) => u.id === trocaUnidade)?.simbolo}</strong>:</p>
        <ul className="at-lista-simples"><li><strong>Converter o número</strong>: recalcula pelo fator da unidade (ex.: 1500 mm → 150 cm).</li><li><strong>Só trocar a unidade</strong>: mantém o número e corrige a unidade (quando o número já estava na unidade nova).</li></ul>
      </Dialogo>
    </div>
  );
}

// ---- textos do conflito (valor ao abrir / seu rascunho / valor atual), sempre com a unidade ------------------------------------------
function simbolo(item: ItemFicha, uid: number | null | undefined): string {
  if (!uid) return item.unidade_efetiva?.simbolo ?? '';
  return item.unidades.find((u) => u.id === uid)?.simbolo ?? item.unidade_efetiva?.simbolo ?? '';
}
function textoCampo(item: ItemFicha, bruto: string, uid: number | null): string {
  if (bruto === '') return item.valor && item.valor.estado !== 'informado' ? ESTADO[item.valor.estado] ?? item.valor.estado : 'vazio';
  if (item.tipo === 'opcao') return item.opcoes.find((o) => String(o.id) === bruto)?.rotulo ?? bruto;
  if (item.tipo === 'booleano') return bruto === '1' ? 'Sim' : 'Não';
  const u = item.tipo === 'numero' || item.tipo === 'inteiro' ? simbolo(item, uid) : '';
  return u ? `${bruto} ${u}` : bruto;
}
function textoEnvelope(item: ItemFicha, env: Readonly<Record<string, unknown>>): string {
  if (env.estado && env.estado !== 'informado') return ESTADO[String(env.estado)] ?? String(env.estado);
  const v = env.valor;
  if (v === undefined || v === null || v === '') return 'vazio';
  if (item.tipo === 'opcao' || item.tipo === 'multiopcao') return item.opcoes.find((o) => o.id === Number(v))?.rotulo ?? String(v);
  if (item.tipo === 'booleano') return v === true || v === 1 || v === '1' ? 'Sim' : 'Não';
  if (item.tipo === 'numero' || item.tipo === 'inteiro') { const u = simbolo(item, (env.unidade_id as number | undefined) ?? null); return `${decimal(String(v))}${u ? ` ${u}` : ''}`; }
  return String(v);
}
function textoAtual(item: ItemFicha, atual: ValorAtualConflito | undefined): string | null {
  if (!atual) return null;
  const vivos = (atual.valores ?? []).filter((x) => !x.excluido);
  if (vivos.length === 0) return 'vazio';
  const x = vivos[0];
  if (x.estado !== 'informado') return ESTADO[x.estado] ?? x.estado;
  if (item.tipo === 'multiopcao' || item.tipo === 'opcao') return vivos.map((y) => item.opcoes.find((o) => o.id === y.opcao_id)?.rotulo ?? String(y.opcao_id)).join(', ');
  if (item.tipo === 'booleano') return x.valor_bool === null ? 'vazio' : Number(x.valor_bool) ? 'Sim' : 'Não';
  if (item.tipo === 'numero' || item.tipo === 'inteiro') { const u = simbolo(item, x.unidade_id); return x.valor_num === null ? 'vazio' : `${decimal(x.valor_num)}${u ? ` ${u}` : ''}`; }
  if (item.tipo === 'data') return x.valor_data ?? 'vazio';
  return x.valor_texto ?? 'vazio';
}
