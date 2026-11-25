// v2/GeralV2.tsx — Geral V2 · Lançamento (CIMA, 23/11/2026). Mockups aprovados: /srv/dshow-docs/briefings/GERAL-V2/
// (01_GERAL_LANCAMENTO, 02_GERAL_ESTADOS, 02_GERAL_FLUXO_01_LISTA). O shell não muda: isto é só o miolo da Geral.
// Quatro blocos: Prioridades de hoje · Resultado comercial · Pedidos no período + Próximos compromissos · Fontes e atualização.
// Regras: períodos Ontem / Últimos 7 dias / Mês até ontem (dias completos, corte em Brasília); prioridades = situação de AGORA
// (não mudam com o período), no máximo 3, por gravidade e depois antiguidade; pedidos, ganhos e funil são conceitos SEPARADOS
// (nunca somados); sem "Comparação: período anterior"; texto mínimo de 12 px; falha nunca vira zero; estado sempre escrito.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Layers, Package, PlugZap, TrendingUp, Wallet } from 'lucide-react';
import {
  ErroV2, fmtData, fmtDiaMes, fmtHora, fmtMoeda, fmtN, fmtQuando, hojeExtenso,
  lerPainel, type Painel,
  type Agenda, type EstadoBloco, type Fonte, type IdPrioridade, type PedidosBling, type PeriodoV2, type Prioridade, type Prioridades, type Resumo,
} from './servico';
import { ListaPrioridade } from './ListaPrioridade';
import { Problema, useBloco } from './comuns';
import { FONTE_DO_INDICADOR, NOME_FONTE, efetivo, fonteEfetiva, textoSemValor, type Efetivo, type FontesLidas, type IdIndicador } from './coerencia';
import './geral-v2.css';

/** Leva ao topo o contêiner que de fato rola (o miolo do shell), sem alinhar nada por baixo da barra fixa. */
function rolarAoTopo(el: HTMLElement | null) {
  for (let n = el?.parentElement ?? null; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) { n.scrollTop = 0; return; }
  }
  window.scrollTo(0, 0);
}
const semAcesso = (e: unknown) => e instanceof ErroV2 && e.semAcesso;
function navegar(rota: string) { window.location.hash = rota; }
const K_PERIODO = 'dshow.geral.v2.periodo';
const PERIODOS: { id: PeriodoV2; rotulo: string }[] = [{ id: 'ontem', rotulo: 'Ontem' }, { id: '7d', rotulo: 'Últimos 7 dias' }, { id: 'mes', rotulo: 'Mês até ontem' }];

const ROTULO_ESTADO: Partial<Record<EstadoBloco, [string, string]>> = {
  zero: ['Zero real', 'ok'], desatualizado: ['Desatualizado', 'aviso'], parcial: ['Dados parciais', 'aviso'], aguardando: ['Aguardando conexão', 'neutro'], erro: ['Com problema', 'erro'],
};
function SeloEstado({ estado }: { estado: EstadoBloco | 'carregando' | 'semacesso' }) {
  if (estado === 'carregando') return <span className="gv2-selo gv2-selo--neutro">Carregando…</span>;
  if (estado === 'semacesso') return <span className="gv2-selo gv2-selo--neutro">Sem acesso</span>;
  const r = ROTULO_ESTADO[estado]; if (!r) return null;
  return <span className={`gv2-selo gv2-selo--${r[1]}`} data-gv2-selo={estado}>{r[0]}</span>;
}
function Osso({ l, a = 12 }: { l: string; a?: number }) { return <span className="ger-osso gv2-osso" style={{ width: l, height: a }} aria-hidden />; }

// ════════════════════════════════════════════════════════════════════
export function GeralV2() {
  const [periodo, setPeriodo] = useState<PeriodoV2>(() => { try { const p = localStorage.getItem(K_PERIODO); return p === 'ontem' || p === 'mes' ? p : '7d'; } catch { return '7d'; } });
  const [vista, setVista] = useState<{ tipo: 'geral' } | { tipo: 'lista'; id: IdPrioridade; quantidade: number | null }>({ tipo: 'geral' });
  const trocarPeriodo = (p: PeriodoV2) => { setPeriodo(p); try { localStorage.setItem(K_PERIODO, p); } catch { /* sem storage */ } };

  // uma leitura só (painel.php): cada bloco é uma VISTA dela, com o mesmo erro, o mesmo "Tentar de novo" e o mesmo instante
  const painel = useBloco((s) => lerPainel(periodo, s), [periodo]);
  const vistaDe = <K extends 'resumo' | 'prioridades' | 'agenda' | 'fontes'>(k: K) =>
    ({ dados: painel.dados ? painel.dados[k] : null, erro: painel.erro, carregando: painel.carregando, atualizando: painel.atualizando,
       recarregar: painel.recarregar, okEm: painel.okEm }) as ReturnType<typeof useBloco<Painel[K]>>;
  // Parecer R3 item 2 (25/11): na TROCA de período, enquanto o período novo não chega, o resultado e o gráfico NÃO mostram os números
  // do período anterior como se fossem atuais: ficam em "Carregando o período…". Prioridades, agenda e fontes não dependem do período
  // e seguem na tela (aprovado). Se a troca falhar, vale o comportamento aprovado: última leitura válida + "a atualização falhou".
  const trocando = painel.atualizando && !!painel.dados && painel.dados.resumo?.periodo?.id !== periodo;
  const resumo0 = vistaDe('resumo');
  const resumo = trocando ? ({ ...resumo0, dados: null, erro: null, carregando: true } as typeof resumo0) : resumo0;
  const prioridades = vistaDe('prioridades'), agenda = vistaDe('agenda'), fontes = vistaDe('fontes');
  const topo = useRef<HTMLDivElement>(null);
  // Retorno do mockup (P10, 2ª rodada): NÃO rolar ao montar — o scrollIntoView alinhava a página ao topo da JANELA, por baixo da barra
  // fixa do shell (título "Geral" e períodos escondidos em 1440). Ao trocar de vista (lista ↔ geral), o contêiner que rola volta ao topo.
  const montou = useRef(false);
  useEffect(() => { if (!montou.current) { montou.current = true; return; } rolarAoTopo(topo.current); }, [vista.tipo]);
  // coerência por indicador (24/11): a confirmação de "zero" e o estado das fontes vêm do fontes.php
  const fl: FontesLidas = fontes.carregando && !fontes.dados ? 'carregando' : fontes.dados ?? null;
  const efs = indicadoresEfetivos(resumo, prioridades, agenda, fl);

  if (vista.tipo === 'lista') {
    return <div ref={topo} className="gv2" data-gv2-vista="lista"><ListaPrioridade id={vista.id} quantidadeGeral={vista.quantidade} aoVoltar={() => setVista({ tipo: 'geral' })} /></div>;
  }
  return (
    <div ref={topo} className="gv2" data-gv2-vista="geral">
      <header className="gv2-topo">
        <div>
          <h1 className="gv2-h1">Geral</h1>
          <p className="gv2-sub">Painel executivo · ações e resultados com origem verificável</p>
        </div>
        <div className="gv2-periodos" role="tablist" aria-label="Período dos resultados">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={periodo === p.id} className={`gv2-periodo${periodo === p.id ? ' is-on' : ''}`} onClick={() => trocarPeriodo(p.id)}>{p.rotulo}</button>
          ))}
        </div>
      </header>

      <BlocoPrioridades b={prioridades} fl={fl} aoAbrir={(id, q) => (id === 'conflito_agenda' ? navegar(agenda.dados?.url_agenda || '#/panel-google-calendar') : setVista({ tipo: 'lista', id, quantidade: q }))} />
      <BlocoResultado b={resumo} fl={fl} />
      <div className="gv2-dupla">
        <BlocoPedidosGrafico b={resumo} fl={fl} />
        <BlocoAgenda b={agenda} fl={fl} />
      </div>
      <BlocoFontes b={fontes} efs={efs} />
    </div>
  );
}

type B<T> = ReturnType<typeof useBloco<T>>;
/** Todos os indicadores da página com o estado EFETIVO (para a linha de fontes não contradizer os cartões). */
function indicadoresEfetivos(r: B<Resumo>, p: B<Prioridades>, a: B<Agenda>, fl: FontesLidas): { id: IdIndicador; e: Efetivo }[] {
  const out: { id: IdIndicador; e: Efetivo }[] = [];
  // bloco que NÃO pôde ser lido nesta tela (sem leitura válida): a fonte dele não pode aparecer como "Atualizado"
  const naoLido = (bl: B<unknown>, ids: IdIndicador[]) => {
    if (bl.dados || !bl.erro || semAcesso(bl.erro)) return;
    for (const id of ids) out.push({ id, e: { estado: 'erro', zeroNaoConfirmado: false, conferindo: false, semValor: null, motivo: 'Não lido nesta tela', quando: null, fonte: FONTE_DO_INDICADOR[id] } });
  };
  naoLido(r, ['pedidos_bling', 'negocios_ganhos', 'funil_aberto']);
  naoLido(p, ['atividade_vencida', 'sem_proxima_atividade', 'conflito_agenda']);
  naoLido(a, ['agenda']);
  if (r.dados) {
    const falhou = !!r.erro;
    out.push({ id: 'pedidos_bling', e: efetivo('pedidos_bling', r.dados.pedidos_bling, fl, falhou, r.okEm) });
    out.push({ id: 'negocios_ganhos', e: efetivo('negocios_ganhos', r.dados.negocios_ganhos, fl, falhou, r.okEm) });
    out.push({ id: 'funil_aberto', e: efetivo('funil_aberto', r.dados.funil_aberto, fl, falhou, r.okEm) });
  }
  for (const x of p.dados?.itens ?? []) out.push({ id: x.id, e: efetivo(x.id, x, fl, !!p.erro, p.okEm) });
  if (a.dados) out.push({ id: 'agenda', e: efetivo('agenda', a.dados, fl, !!a.erro, a.okEm) });
  return out;
}

// ── 1. Prioridades de hoje ───────────────────────────────────────────
const COR_GRAVIDADE: Record<1 | 2 | 3, string> = { 1: 'alta', 2: 'media', 3: 'baixa' };
function textoPrioridade(p: Prioridade): { titulo: string; sub: string; meio: string; quando: string; acao: string } {
  const n = p.quantidade;
  const q = fmtN(n);
  if (p.id === 'atividade_vencida') return {
    titulo: `${q} ${n === 1 ? 'negócio aberto' : 'negócios abertos'} com atividade vencida`,
    sub: `Pipedrive · ${q} ${n === 1 ? 'negócio distinto' : 'negócios distintos'}`,
    meio: p.responsaveis === null ? 'Responsáveis: —' : p.responsaveis === 1 ? 'Com 1 responsável' : `Distribuído entre ${p.responsaveis} responsáveis`,
    quando: p.desde ? `Desde ${fmtDiaMes(p.desde)}` : '', acao: n === null ? 'Ver negócios' : `Ver ${q} ${n === 1 ? 'negócio' : 'negócios'}`,
  };
  if (p.id === 'sem_proxima_atividade') {
    const ate = new Date(Date.now() + 7 * 864e5).toISOString();
    return {
      titulo: `${q} ${n === 1 ? 'negociação' : 'negociações'} sem próxima atividade`,
      sub: `Fechamento previsto até ${fmtDiaMes(ate)} · inclui vencidos`,
      meio: 'Revisar etapa e responsável', quando: `Até ${fmtDiaMes(ate)}`, acao: n === null ? 'Ver negócios' : `Ver ${q} ${n === 1 ? 'negócio' : 'negócios'}`,
    };
  }
  return {
    titulo: `${q} ${n === 1 ? 'compromisso' : 'compromissos'} com horários conflitantes`,
    sub: 'Google Calendar · sua agenda de hoje', meio: 'Eventos no mesmo intervalo',
    quando: p.desde ? `Hoje, ${fmtHora(p.desde)}` : 'Hoje', acao: 'Abrir agenda',
  };
}
/** Verificação decidida pelo serviço → texto. null = completa (nada a dizer). Nome da fonte pelo id, igual ao da linha de fontes. */
function textoVerificacao(v: Prioridades['verificacao']): { estado: 'parcial' | 'nao-verificada'; texto: string } | null {
  if (v?.estado === 'completa') return null;
  const pend = (v?.fontes ?? []).filter((x) => x.estado !== 'ok');
  const nome = (x: { fonte: string; rotulo: string }) => NOME_FONTE[x.fonte as keyof typeof NOME_FONTE] ?? x.rotulo;
  if (v?.estado === 'parcial') return { estado: 'parcial', texto: `Verificação parcial · ${pend.map(nome).join(', ') || 'fonte não informada'}` };
  return { estado: 'nao-verificada', texto: `Prioridades não verificadas · ${pend.length ? pend.map((x) => `${nome(x)} ${x.rotulo_estado.toLowerCase()}`).join(', ') : 'o serviço não informou a verificação'}` };
}
function BlocoPrioridades({ b, fl, aoAbrir }: { b: ReturnType<typeof useBloco<Prioridades>>; fl: FontesLidas; aoAbrir: (id: IdPrioridade, q: number | null) => void }) {
  const [todas, setTodas] = useState(false);
  // estado EFETIVO por prioridade: "zero" só vale com a fonte daquela prioridade em dia (senão aparece, como não confirmado)
  const efs = useMemo(() => new Map((b.dados?.itens ?? []).map((p) => [p.id, efetivo(p.id, p, fl, !!b.erro, b.okEm)])), [b.dados, b.erro, b.okEm, fl]);
  const conferindo = [...efs.values()].some((e) => e.conferindo);
  const itens = useMemo(() => (b.dados?.itens ?? [])
    .filter((p) => { const e = efs.get(p.id)!; return p.quantidade === null || p.quantidade > 0 || (e.estado !== 'ok' && e.estado !== 'zero'); })   // quantidade desconhecida APARECE (nunca some como se fosse zero)
    .sort((x, y) => x.gravidade - y.gravidade || (x.desde ?? '9').localeCompare(y.desde ?? '9')), [b.dados, efs]);
  const acoes = itens.filter((p) => (p.quantidade ?? 0) > 0).length;
  // Ausência ≠ zero (achado na captura R4 do 3g): prioridade sem contagem (quantidade null) não entra como 0 — sem o selo "N ações",
  // que afirmaria um total; o selo da verificação e cada linha ("Não foi possível contar…") dizem o que falta.
  const acoesDesconhecidas = itens.some((p) => p.quantidade === null || p.quantidade === undefined);
  const cab = (extra?: ReactNode) => (
    <div className="gv2-sec-cab">
      <h2 className="gv2-h2">Prioridades de hoje</h2>
      {extra}
      <span className="gv2-fraco gv2-dir">{hojeExtenso()} · situação atual</span>
    </div>
  );
  if ((b.carregando && !b.dados) || (conferindo && itens.length === 0)) return (
    <section className="gv2-cartao gv2-prioridades" data-gv2-bloco="prioridades" data-gv2-estado="carregando" aria-busy="true">
      {cab(<SeloEstado estado="carregando" />)}
      {[0, 1, 2].map((k) => <div key={k} className="gv2-prio gv2-prio--osso"><span className="gv2-prio-barra" /><div className="gv2-prio-txt"><Osso l="38%" a={14} /><Osso l="22%" /></div><Osso l="18%" /><Osso l="8%" /><Osso l="9%" /></div>)}
    </section>
  );
  if (!b.dados) return (
    <section className="gv2-cartao gv2-prioridades" data-gv2-bloco="prioridades" data-gv2-estado={semAcesso(b.erro) ? 'semacesso' : 'problema'}>
      {cab(<SeloEstado estado={semAcesso(b.erro) ? 'semacesso' : 'erro'} />)}
      {semAcesso(b.erro) ? <p className="gv2-fraco">Seu nível de acesso não inclui as prioridades comerciais.</p>
        : <Problema motivo="Não foi possível verificar as prioridades agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando || b.carregando} />}
    </section>
  );
  if (itens.length === 0) {
    // Nenhuma pendência na lista: o que a tela diz é a VERIFICAÇÃO decidida pelo serviço (retorno do mockup P10, 2ª rodada).
    // Sem o campo (serviço antigo) a tela não afirma "Sem pendências": não há como saber se tudo foi verificado.
    const v = b.dados.verificacao;
    const tv = textoVerificacao(v);
    if (!tv && b.dados.sem_pendencias !== false) return (
      <section className="gv2-cartao gv2-prioridades gv2-prioridades--vazio" data-gv2-bloco="prioridades" data-gv2-estado="zero" data-gv2-verificacao="completa">
        <CheckCircle2 size={18} aria-hidden className="gv2-ok-ic" />
        <div><strong>Prioridades de hoje · Sem pendências</strong>
          <span className="gv2-fraco">Nenhuma pendência encontrada nas fontes consultadas e atualizadas{b.dados.gerado_em ? ` · ${fmtQuando(b.dados.gerado_em)}` : ''}</span></div>
      </section>
    );
    const parcial = tv?.estado === 'parcial';
    const titulo = tv ? tv.texto : 'Prioridades não verificadas · o serviço não confirmou "sem pendências"';
    return (
      <section className="gv2-cartao gv2-prioridades gv2-prioridades--vazio" data-gv2-bloco="prioridades" data-gv2-estado={parcial ? 'parcial' : 'nao-verificada'} data-gv2-verificacao={v?.estado ?? 'ausente'}>
        <AlertTriangle size={18} aria-hidden className="gv2-aviso-ic" />
        <div><strong>Prioridades de hoje · {titulo}</strong>
          <span className="gv2-fraco">{parcial ? 'Nenhuma pendência nas fontes verificadas; as demais não foram lidas por completo.' : 'Não dá para afirmar que não há pendências.'}{b.dados.gerado_em ? ` · ${fmtQuando(b.dados.gerado_em)}` : ''}</span></div>
      </section>
    );
  }
  const vis = todas ? itens : itens.slice(0, 3);
  return (
    <section className="gv2-cartao gv2-prioridades" data-gv2-bloco="prioridades" data-gv2-estado={b.erro ? 'problema' : 'conectado'}>
      {cab(<>
        {!acoesDesconhecidas && <span className="gv2-selo gv2-selo--aviso" data-gv2-acoes>{acoes} {acoes === 1 ? 'ação' : 'ações'}</span>}
        {/* verificação não completa: dita no cabeçalho mesmo com itens na lista (o que falta verificar não vira "só estas") */}
        {(() => { const tv = textoVerificacao(b.dados!.verificacao); return tv && b.dados!.verificacao ? <span className="gv2-selo gv2-selo--aviso" data-gv2-verificacao={tv.estado}>{tv.texto}</span> : null; })()}
      </>)}
      {b.erro && <Problema motivo="A atualização das prioridades falhou; abaixo, a última leitura válida." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />}
      <ul className="gv2-prio-lista">
        {vis.map((p, k) => {
          const e = efs.get(p.id)!; const t = textoPrioridade(p);
          // com número: ok, parcial ou desatualizado COM último valor (o selo diz que é desatualizado)
          const ok = (e.estado === 'ok' || e.estado === 'zero' || (e.estado === 'desatualizado' && !e.zeroNaoConfirmado)) && p.quantidade !== null;
          const velho = e.estado === 'desatualizado';
          return (
            <li key={p.id} className={`gv2-prio gv2-prio--${COR_GRAVIDADE[p.gravidade]} ger-entra`} style={{ ['--ger-ordem' as string]: k }} data-gv2-prio={p.id}>
              <span className="gv2-prio-barra" aria-hidden />
              <div className="gv2-prio-txt">
                <strong>{ok ? t.titulo : `${e.estado === 'aguardando' ? 'Aguardando conexão' : e.zeroNaoConfirmado ? 'Não foi possível confirmar' : 'Não foi possível contar'}: ${p.id === 'conflito_agenda' ? 'conflitos na agenda' : p.id === 'atividade_vencida' ? 'negócios com atividade vencida' : 'negociações sem próxima atividade'}`}</strong>
                <span className="gv2-fraco">{ok ? (velho ? `${e.motivo ?? 'Desatualizado'}${e.quando ? ` · último sucesso ${fmtQuando(e.quando)}` : ''}` : t.sub) : (e.motivo || 'Fonte indisponível agora.')}</span>
              </div>
              <span className="gv2-prio-meio">{ok && !velho ? t.meio : <SeloEstado estado={e.estado === 'ok' || e.estado === 'zero' ? 'parcial' : e.estado} />}</span>
              <span className="gv2-prio-quando">{ok && t.quando}</span>
              {ok && <button type="button" className="gv2-link" onClick={() => aoAbrir(p.id, p.quantidade)}>{t.acao} <ArrowRight size={13} aria-hidden /></button>}
            </li>
          );
        })}
      </ul>
      {itens.length > 3 && <button type="button" className="gv2-link gv2-ver-todas" onClick={() => setTodas((v) => !v)}>{todas ? 'Mostrar só as 3 principais' : `Ver todas (${itens.length})`}</button>}
    </section>
  );
}

// ── 2. Resultado comercial (3 cartões — conceitos separados, nunca somados) ──
function CartaoNumero({ titulo, marcador, icone, estado, carregando, valor, linha, rodape, link, problema, data, dica }: {
  titulo: string; marcador: string; icone: ReactNode; estado: EstadoBloco | 'carregando' | 'semacesso'; carregando: boolean; valor: string; linha: ReactNode;
  rodape: string; link: { rotulo: string; rota: string } | null; problema: ReactNode; data: string; dica?: string;
}) {
  return (
    <article className="gv2-cartao gv2-num ger-entra" data-gv2-cartao={data} data-gv2-estado={estado} title={dica}>
      <span className="gv2-marcador" data-gv2-marcador>{marcador}</span>
      <header className="gv2-num-cab"><h3 className="gv2-h3">{titulo}</h3><span className="gv2-num-ic" aria-hidden>{icone}</span></header>
      {/* 116: o selo fica numa linha PRÓPRIA (com 4 cartões em 1440 ele empurrava o título para 2 linhas) */}
      <div className="gv2-num-estado"><SeloEstado estado={estado} /></div>
      {carregando ? <><Osso l="62%" a={34} /><Osso l="44%" /></> : problema ?? (
        <>
          <span key={valor} className={`gv2-num-valor ger-num-entra${estado === 'desatualizado' ? ' is-desatualizado' : ''}`}>{valor}</span>
          <span className="gv2-num-linha">{linha}</span>
        </>
      )}
      <footer className="gv2-num-rodape">
        <span className="gv2-fraco">{rodape}</span>
        {link && <button type="button" className="gv2-link" onClick={() => navegar(link.rota)}>{link.rotulo} <ArrowRight size={13} aria-hidden /></button>}
      </footer>
    </article>
  );
}
/** Linha do cartão pelo estado EFETIVO (coerencia.ts): zero não confirmado, desatualizado, soma parcial. */
function linhaEstado(e: Efetivo, normal: ReactNode, valor: number | null = 0): ReactNode {
  // no cartão, só o motivo (cabe numa linha em 1440); o horário do último sucesso fica no gráfico e na linha de fontes
  // zero não confirmado (desatualizado ou parcial): só o motivo — nunca "0 pedidos" nem "R$ 0"
  if (e.zeroNaoConfirmado) return <span data-gv2-zero-nc title={e.quando ? `Último sucesso ${fmtQuando(e.quando)}` : undefined}>{e.motivo || 'Zero não confirmado'}</span>;
  if (e.estado === 'desatualizado') return <>Último valor válido preservado{e.quando ? ` · ${fmtQuando(e.quando)}` : ''}</>;
  // todos sem valor (valor null): não há soma — "Nenhum valor informado"; alguns sem valor: soma dos informados
  if (e.estado === 'parcial' && e.semValor !== null) return <>{normal}<span className="gv2-aviso-linha" data-gv2-soma-parcial>{valor === null ? 'Nenhum valor informado' : 'Soma dos valores informados'} · {textoSemValor(e.semValor)}</span></>;
  if (e.estado === 'parcial') return <>{normal}<span className="gv2-aviso-linha">{e.motivo || 'Leitura incompleta.'}</span></>;
  return normal;
}
/**
 * Contagem completa apesar de `parcial` (decisões de 25/11): a QUANTIDADE não depende do valor dos negócios ganhos (sem valor / outra
 * moeda) nem do canal dos pedidos/OS (OS lançada à mão não tem canal). Só essas lacunas "conhecidas"; qualquer outra mantém o parcial.
 */
function contagemCompleta(e: Efetivo | undefined, lacunas: string[] | undefined, deValor: readonly string[]): Efetivo | undefined {
  if (!e || e.estado !== 'parcial') return e;
  const l = lacunas ?? (e.semValor !== null ? ['sem_valor'] : []);
  return l.length > 0 && l.every((x) => deValor.includes(x)) ? { ...e, estado: 'ok', semValor: null, motivo: null } : e;
}
// ── 2. Indicadores do negócio (4 cartões, decisão de 25/11 — conceitos separados, nunca somados) ──
function BlocoResultado({ b, fl }: { b: ReturnType<typeof useBloco<Resumo>>; fl: FontesLidas }) {
  const r = b.dados; const car = b.carregando && !r;
  const ef = (id: IdIndicador, x: Resumo['pedidos_bling'] | Resumo['negocios_ganhos'] | Resumo['funil_aberto'] | undefined) => (x ? efetivo(id, x, fl, !!b.erro, b.okEm) : undefined);
  const p = r?.pedidos_bling, g = r?.negocios_ganhos, f = r?.funil_aberto;
  const ep = contagemCompleta(ef('pedidos_bling', p), p?.lacunas, ['sem_canal']);
  const eg = contagemCompleta(ef('negocios_ganhos', g), g?.lacunas, ['sem_valor', 'fora_brl']);
  const eu = ef('funil_aberto', f);
  const est = (e: Efetivo | undefined): EstadoBloco | 'carregando' | 'semacesso' => (car || e?.conferindo ? 'carregando' : !r ? (semAcesso(b.erro) ? 'semacesso' : 'erro') : e!.estado);
  const qtd = (e: Efetivo | undefined, v: number | null | undefined) => (e?.zeroNaoConfirmado || v === null || v === undefined ? '—' : fmtN(v));
  const moeda = (e: Efetivo | undefined, v: number | null | undefined) => (e?.zeroNaoConfirmado ? '—' : fmtMoeda(v ?? null));
  const falhaGeral = !r && !car ? (semAcesso(b.erro) ? <p className="gv2-fraco">Seu nível de acesso não inclui este resultado.</p>
    : <Problema motivo="Não foi possível ler este resultado agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />) : null;
  const porBloco = (e: { estado: EstadoBloco; ultimo_sucesso: string | null; motivo: string | null } | undefined): ReactNode => {
    if (falhaGeral) return falhaGeral;
    if (!e) return null;
    if (e.estado === 'aguardando') return <><span className="gv2-num-valor gv2-num-valor--vazio">—</span><span className="gv2-num-linha">Sem valor disponível · nenhum número assumido</span></>;
    if (e.estado === 'erro') return <Problema motivo={e.motivo || 'A leitura desta fonte falhou.'} quando={e.ultimo_sucesso} onTentar={b.recarregar} tentando={b.atualizando} />;
    return null;
  };
  const plural = (n: number | null, um: string, varios: string) => `${fmtN(n)} ${n === 1 ? um : varios}`;
  const foto = f ? (f.fotografia_em ?? f.valor_em ?? f.ultimo_sucesso ?? null) : null;
  // Recebido no período (Precifica): no 116 SEMPRE "— · Aguardando conexão" — não existe leitura de recebimentos. Nunca número, nunca R$ 0.
  const recebido = (
    <><span className="gv2-num-valor gv2-num-valor--vazio" data-gv2-recebido-valor>—</span>
      <span className="gv2-num-linha">Aguardando conexão · valor desconhecido, não é R$ 0</span></>);
  return (
    <section className="gv2-sec" data-gv2-bloco="resultado">
      <div className="gv2-sec-cab gv2-sec-cab--solto">
        <h2 className="gv2-h2">Indicadores do negócio</h2>
        <span className="gv2-fraco gv2-dir">{r ? `${r.periodo.rotulo} · funil é fotografia atual` : car ? 'Carregando o período…' : 'Período indisponível'}</span>
      </div>
      {r && b.erro && <Problema motivo="A atualização falhou; os cartões mostram a última leitura válida." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />}
      <div className="gv2-quatro">
        <CartaoNumero data="ganhos" marcador="Comercial · Pipedrive" titulo="Negócios ganhos" icone={<TrendingUp size={18} />} estado={est(eg)} carregando={car || !!eg?.conferindo}
          valor={qtd(eg, g?.quantidade)} problema={porBloco(g)}
          linha={g && eg && linhaEstado(eg, <>Fechados no período{typeof g.sem_valor === 'number' && g.sem_valor > 0 ? ` · ${fmtN(g.sem_valor)} sem valor` : ''}</>)}
          rodape="Pipedrive · contagem" link={{ rotulo: 'Ver ganhos', rota: '#/panel-pipedrive' }} dica="Quantidade de negócios ganhos no período. Não é receita." />
        <CartaoNumero data="funil" marcador="Comercial · Pipedrive" titulo="Funil aberto agora" icone={<Layers size={18} />} estado={est(eu)} carregando={car || !!eu?.conferindo}
          valor={moeda(eu, f?.valor)} problema={porBloco(f)}
          linha={f && eu && linhaEstado(eu, <>{plural(f.quantidade, 'negócio aberto', 'negócios abertos')}{foto && <span className="gv2-num-sub" data-gv2-fotografia>Fotografia {/^às /.test(fmtQuando(foto)) ? `de hoje ${fmtQuando(foto)}` : `de ${fmtQuando(foto)}`}</span>}</>, f.valor)}
          rodape="Pipedrive · valor potencial" link={{ rotulo: 'Abrir funil', rota: '#/panel-pipedrive' }} dica="Soma dos valores informados nos negócios abertos agora. Fotografia atual: não filtra pelo período." />
        <CartaoNumero data="pedidos" marcador="Operação · Bling" titulo="Pedidos / OS lançados" icone={<Package size={18} />} estado={est(ep)} carregando={car || !!ep?.conferindo}
          valor={qtd(ep, p?.quantidade)} problema={porBloco(p)} dica={`Bling principal${p?.conta ? ` (conta ${p.conta})` : ''} · ${p?.universo ?? 'pedidos de venda lançados no período'}. Não é faturamento nem recebimento.`}
          linha={p && ep && linhaEstado(ep, <>Quantidade no período · não é faturamento{p.inclui_canceladas && <span className="gv2-nota">Inclui pedidos cancelados depois do lançamento.</span>}</>)}
          rodape="Bling · unidades de OS" link={{ rotulo: 'Ver registros', rota: '#/panel-bling' }} />
        <CartaoNumero data="recebido" marcador="Financeiro · Precifica" titulo="Recebido no período" icone={<Wallet size={18} />} estado={car ? 'carregando' : falhaGeral ? (semAcesso(b.erro) ? 'semacesso' : 'erro') : 'aguardando'} carregando={car}
          valor="—" problema={falhaGeral ?? recebido} linha={null}
          rodape="Precifica · recebido" link={null} dica="Recebido no período vem só do Precifica (fonte financeira oficial). Ainda não conectado: valor desconhecido." />
      </div>
    </section>
  );
}

// ── 3a. Pedidos / OS no período (barras = QUANTIDADE por dia; soma = cartão; nenhum R$ — decisão de 25/11) ──
function Barras({ p }: { p: PedidosBling }) {
  // desenhado na LARGURA REAL do bloco (sem escalar o SVG): rótulos sempre com 12 px de verdade, em 2200 e em 1440
  const caixa = useRef<HTMLDivElement>(null); const [W, setW] = useState(0);
  useEffect(() => { const el = caixa.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width))); ro.observe(el); return () => ro.disconnect(); }, []);
  const dias = p.por_dia; const max = Math.max(1, ...dias.map((d) => d.quantidade ?? 0));
  const passo = [1, 2, 5, 10, 20, 25, 50, 100, 250, 500, 1000].find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  const topo = passo * 4; const H = 210, E = 118, B = 26, T = 18;   // E = margem do eixo (cabe "1.000 pedidos/OS" em 12 px); B = rótulos embaixo; T = folga em cima
  const larg = (W - E) / Math.max(1, dias.length);
  const cabe = Math.max(1, Math.ceil(46 / Math.max(1, larg)));   // um rótulo de dia a cada N barras (≥ 46 px entre rótulos)
  const numEmCima = larg >= 28;
  return (
    <div ref={caixa} className="gv2-barras-caixa">
      {W > 0 && (
        <svg className="gv2-barras" width={W} height={H + B} viewBox={`0 0 ${W} ${H + B}`} role="img" aria-label={`Pedidos e OS por dia: ${dias.map((d) => `${fmtDiaMes(d.dia)} ${d.quantidade === null ? 'sem dado' : fmtN(d.quantidade)}`).join('; ')}`}>
          {[0, 1, 2, 3, 4].map((k) => { const y = H - (k * passo / topo) * (H - T); return (
            <g key={k}><line x1={E} x2={W} y1={y} y2={y} className="gv2-grade" /><text x={E - 10} y={y + 4} textAnchor="end" className="gv2-eixo" data-gv2-eixo-y>{k === 0 ? '0' : `${fmtN(k * passo)} ${k * passo === 1 ? 'pedido/OS' : 'pedidos/OS'}`}</text></g>); })}
          {dias.map((d, i) => {
            const q = d.quantidade; const h = q === null ? 0 : Math.max(q > 0 ? 3 : 0, (q / topo) * (H - T)); const w = Math.min(84, larg * 0.6); const x = E + i * larg + (larg - w) / 2;
            return (
              <g key={d.dia} data-gv2-dia={d.dia}>
                <title>{`${fmtData(d.dia)}: ${q === null ? 'sem dado' : `${fmtN(q)} ${q === 1 ? 'pedido/OS' : 'pedidos/OS'}`}`}</title>
                {q === null ? <text x={x + w / 2} y={H - 4} textAnchor="middle" className="gv2-eixo">sem dado</text>
                  : <rect x={x} y={H - h} width={w} height={h} rx={4} className="gv2-barra" />}
                {q !== null && q > 0 && numEmCima && <text x={x + w / 2} y={H - h - 6} textAnchor="middle" className="gv2-eixo">{fmtN(q)}</text>}
                {i % cabe === 0 && <text x={x + w / 2} y={H + 18} textAnchor="middle" className="gv2-eixo">{fmtDiaMes(d.dia)}</text>}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
function BlocoPedidosGrafico({ b, fl }: { b: ReturnType<typeof useBloco<Resumo>>; fl: FontesLidas }) {
  const p0 = b.dados?.pedidos_bling; const e = p0 ? contagemCompleta(efetivo('pedidos_bling', p0, fl, !!b.erro, b.okEm), p0.lacunas, ['sem_canal']) : null;
  const car = (b.carregando && !b.dados) || !!e?.conferindo;
  // o gráfico usa o estado EFETIVO (zero com o Bling atrasado não é "zero"; valor com o Bling atrasado é "Desatualizado")
  const p = p0 && e ? { ...p0, estado: e.estado } : p0;
  // soma dos dias COM dado (dia sem dado = null fica de fora e é contado à parte)
  const comDado = p ? p.por_dia.filter((d) => d.quantidade !== null) : [];
  const semDado = p ? p.por_dia.length - comDado.length : 0;
  const soma = comDado.length ? comDado.reduce((s, d) => s + (d.quantidade as number), 0) : null;
  const confere = p && soma !== null && p.quantidade !== null && soma === p.quantidade;
  return (
    <section className="gv2-cartao gv2-grafico" data-gv2-bloco="grafico" data-gv2-estado={car ? 'carregando' : p?.estado ?? 'erro'}>
      <div className="gv2-sec-cab">
        <div><h2 className="gv2-h2">Pedidos / OS no período</h2><span className="gv2-fraco">Bling · quantidade lançada por dia · sem valor monetário</span></div>
        {p && p.quantidade !== null && p.estado !== 'aguardando' && p.estado !== 'erro' && !e?.zeroNaoConfirmado && <span className="gv2-selo gv2-selo--info gv2-dir">{fmtN(p.quantidade)} {p.quantidade === 1 ? 'registro' : 'registros'}</span>}
        {(car || !p || p.estado === 'aguardando' || p.estado === 'erro' || p.estado === 'parcial' || p.estado === 'desatualizado') && <span className="gv2-dir"><SeloEstado estado={car ? 'carregando' : p?.estado ?? 'erro'} /></span>}
      </div>
      {car ? <div className="gv2-barras-osso" aria-hidden>{Array.from({ length: 7 }, (_, k) => <span key={k} className="ger-osso" style={{ height: `${30 + ((k * 37) % 60)}%` }} />)}</div>
        : !p ? <Problema motivo="Não foi possível ler os pedidos/OS agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />
        : p.estado === 'aguardando' ? <p className="gv2-vazio"><PlugZap size={15} aria-hidden /> Bling ainda não conectado · nenhum número assumido.</p>
        : p.estado === 'erro' ? <Problema motivo={p.motivo || 'A leitura do Bling falhou.'} quando={p.ultimo_sucesso} onTentar={b.recarregar} tentando={b.atualizando} />
        : e?.zeroNaoConfirmado ? <p className="gv2-vazio" data-gv2-zero-nao-confirmado>{e.motivo}{e.quando ? ` · último sucesso ${fmtQuando(e.quando)}` : ''}. Nenhum zero assumido.</p>
        : p.estado === 'zero' ? <p className="gv2-vazio" data-gv2-zero><CheckCircle2 size={15} aria-hidden className="gv2-ok-ic" /> Zero pedidos/OS lançados no período — consulta completa, com a fonte em dia.</p>
        : (
          <>
            <Barras p={p} />
            <p className="gv2-fraco gv2-grafico-rodape">
              Total: <strong>{fmtN(p.quantidade)} {p.quantidade === 1 ? 'pedido/OS' : 'pedidos/OS'}</strong>{confere ? (semDado ? ' · soma dos dias com dado igual ao cartão' : ' · soma igual ao cartão acima') : ' · ⚠ a soma dos dias não confere com o cartão'}
              {semDado > 0 && ` · ${semDado} ${semDado === 1 ? 'dia' : 'dias'} sem dado`}
              {p.inclui_canceladas && ' · inclui pedidos cancelados depois do lançamento'}
            </p>
          </>
        )}
    </section>
  );
}

// ── 3b. Próximos compromissos ───────────────────────────────────────
function BlocoAgenda({ b, fl }: { b: ReturnType<typeof useBloco<Agenda>>; fl: FontesLidas }) {
  const a = b.dados; const car = b.carregando && !a;
  const ea = a ? efetivo('agenda', a, fl, !!b.erro, b.okEm) : null;
  return (
    <section className="gv2-cartao gv2-agenda" data-gv2-bloco="agenda" data-gv2-estado={car ? 'carregando' : a?.estado ?? 'erro'}>
      <div className="gv2-sec-cab">
        <div><h2 className="gv2-h2">Próximos compromissos</h2><span className="gv2-fraco">Hoje · sua agenda · horários de Brasília</span></div>
        {car && <SeloEstado estado="carregando" />}
        <button type="button" className="gv2-link gv2-dir" onClick={() => navegar(a?.url_agenda || '#/panel-google-calendar')}>Ver agenda <ArrowRight size={13} aria-hidden /></button>
      </div>
      {car ? [0, 1, 2].map((k) => <div key={k} className="gv2-evento"><Osso l="46px" a={16} /><div className="gv2-evento-txt"><Osso l="60%" a={14} /><Osso l="35%" /></div></div>)
        : !a ? (semAcesso(b.erro) ? <p className="gv2-fraco">Sua agenda não está disponível para o seu usuário.</p> : <Problema motivo="Não foi possível ler a sua agenda agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />)
        : a.estado === 'aguardando' ? <p className="gv2-vazio"><PlugZap size={15} aria-hidden /> Google Calendar ainda não conectado para o seu usuário.</p>
        : a.estado === 'erro' ? <Problema motivo={a.motivo || 'A leitura da agenda falhou.'} quando={a.ultimo_sucesso} onTentar={b.recarregar} tentando={b.atualizando} />
        : (
          <>
            {ea && (ea.estado === 'desatualizado' || ea.estado === 'parcial') && <p className="gv2-aviso-linha" data-gv2-agenda-estado={ea.estado}><SeloEstado estado={ea.estado} /> {ea.motivo || ''}{ea.quando ? `${ea.motivo ? ' · ' : ''}última sincronização ${fmtQuando(ea.quando)}` : ''}</p>}
            {a.itens.length === 0 ? <p className="gv2-vazio"><CalendarDays size={15} aria-hidden /> Nenhum compromisso no resto do dia.</p> : (
              <ul className="gv2-eventos">
                {a.itens.map((e) => (
                  <li key={`${e.inicio}-${e.titulo}`} className="gv2-evento" data-gv2-conflito={e.conflito ? '1' : '0'}>
                    <span className="gv2-evento-hora">{fmtHora(e.inicio)}</span>
                    <div className="gv2-evento-txt">
                      <strong className="gv2-reticencias" title={e.titulo}>{e.titulo}</strong>
                      <span className="gv2-fraco">Google Calendar{e.duracao_min !== null ? ` · ${e.duracao_min} min` : ''}{e.conflito && <span className="gv2-selo gv2-selo--erro gv2-selo--mini">Conflito de horário</span>}</span>
                    </div>
                    {/* em larguras menores o botão vira só o ícone (com nome acessível), para o título do compromisso caber inteiro */}
                    {e.url_evento && <a className="gv2-btn gv2-btn--evento" href={e.url_evento} target="_blank" rel="noopener noreferrer" aria-label={`Abrir evento: ${e.titulo}`} title="Abrir evento"><span className="gv2-btn-rotulo">Abrir evento</span> <ExternalLink size={12} aria-hidden /></a>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
    </section>
  );
}

// ── 4. Fontes e atualização ─────────────────────────────────────────
/** Texto da fonte pelo estado EFETIVO: nunca "Atualizado" se um indicador dela está desatualizado ou com problema. */
function textoFonte(f: Fonte, ef: ReturnType<typeof fonteEfetiva>): string {
  const q = f.ultimo_sucesso ? `atualizado ${fmtQuando(f.ultimo_sucesso)}` : 'sem horário de atualização';
  if (ef.rotulo === 'Atualizado') return q.charAt(0).toUpperCase() + q.slice(1);
  const partes = ef.partes.length ? ` (${ef.partes.join(', ')})` : '';
  return `${ef.rotulo}${partes}${ef.estado === 'desatualizada' && f.ultimo_sucesso ? ` · último sucesso ${fmtQuando(f.ultimo_sucesso)}` : ''}`;
}
function BlocoFontes({ b, efs }: { b: ReturnType<typeof useBloco<Fonte[]>>; efs: { id: IdIndicador; e: Efetivo }[] }) {
  const [aberto, setAberto] = useState(false); const car = b.carregando && !b.dados;
  return (
    <section className="gv2-cartao gv2-fontes" data-gv2-bloco="fontes" data-gv2-estado={car ? 'carregando' : b.dados ? 'conectado' : 'problema'}>
      <div className="gv2-fontes-linha">
        <h2 className="gv2-h2 gv2-fontes-tit">Fontes e atualização</h2>
        {car ? <span className="gv2-fontes-osso"><SeloEstado estado="carregando" />{[0, 1, 2, 3].map((k) => <Osso key={k} l="140px" />)}</span> : !b.dados ? <Problema motivo="Não foi possível ler o estado das fontes agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} /> : (
          <ul className="gv2-fontes-lista">
            {b.dados.map((f) => { const ef = fonteEfetiva(f, efs); return (
              <li key={f.fonte} className={`gv2-fonte gv2-fonte--${ef.estado}`} data-gv2-fonte={f.fonte} data-gv2-fonte-estado={ef.estado}>
                <span className="gv2-ponto" aria-hidden /><strong>{NOME_FONTE[f.fonte]}</strong> <span>{textoFonte(f, ef)}</span>
              </li>
            ); })}
          </ul>
        )}
        {b.dados && <button type="button" className="gv2-link gv2-dir" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>{aberto ? 'Fechar detalhes' : 'Detalhes'} <ArrowRight size={13} aria-hidden className={aberto ? 'gv2-gira90' : undefined} /></button>}
      </div>
      {aberto && b.dados && (
        <dl className="gv2-fontes-det">
          {b.dados.map((f) => (
            <div key={f.fonte}><dt>{NOME_FONTE[f.fonte]}</dt><dd>{textoFonte(f, fonteEfetiva(f, efs))}{f.motivo ? ` — ${f.motivo}` : ''}</dd></div>
          ))}
        </dl>
      )}
    </section>
  );
}
