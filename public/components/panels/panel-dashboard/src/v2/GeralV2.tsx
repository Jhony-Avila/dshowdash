// v2/GeralV2.tsx — Geral V2 · Lançamento (CIMA, 23/11/2026). Mockups aprovados: /srv/dshow-docs/briefings/GERAL-V2/
// (01_GERAL_LANCAMENTO, 02_GERAL_ESTADOS, 02_GERAL_FLUXO_01_LISTA). O shell não muda: isto é só o miolo da Geral.
// Quatro blocos: Prioridades de hoje · Resultado comercial · Pedidos no período + Próximos compromissos · Fontes e atualização.
// Regras: períodos Ontem / Últimos 7 dias / Mês até ontem (dias completos, corte em Brasília); prioridades = situação de AGORA
// (não mudam com o período), no máximo 3, por gravidade e depois antiguidade; pedidos, ganhos e funil são conceitos SEPARADOS
// (nunca somados); sem "Comparação: período anterior"; texto mínimo de 12 px; falha nunca vira zero; estado sempre escrito.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Layers, Package, PlugZap, TrendingUp } from 'lucide-react';
import {
  ErroV2, fmtData, fmtDiaMes, fmtHora, fmtMoeda, fmtMoedaCurta, fmtN, fmtQuando, hojeExtenso,
  lerAgenda, lerFontes, lerPrioridades, lerResumo,
  type Agenda, type EstadoBloco, type Fonte, type IdPrioridade, type PedidosBling, type PeriodoV2, type Prioridade, type Prioridades, type Resumo,
} from './servico';
import { ListaPrioridade } from './ListaPrioridade';
import { Problema, useBloco } from './comuns';
import { NOME_FONTE, efetivo, fonteEfetiva, textoSemValor, type Efetivo, type FontesLidas, type IdIndicador } from './coerencia';
import './geral-v2.css';

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

  const resumo = useBloco((s) => lerResumo(periodo, s), [periodo]);
  const prioridades = useBloco((s) => lerPrioridades(s), []);
  const agenda = useBloco((s) => lerAgenda(s), []);
  const fontes = useBloco((s) => lerFontes(s), []);
  const topo = useRef<HTMLDivElement>(null);
  useEffect(() => { topo.current?.scrollIntoView({ block: 'start' }); }, [vista.tipo]);
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
function BlocoPrioridades({ b, fl, aoAbrir }: { b: ReturnType<typeof useBloco<Prioridades>>; fl: FontesLidas; aoAbrir: (id: IdPrioridade, q: number | null) => void }) {
  const [todas, setTodas] = useState(false);
  // estado EFETIVO por prioridade: "zero" só vale com a fonte daquela prioridade em dia (senão aparece, como não confirmado)
  const efs = useMemo(() => new Map((b.dados?.itens ?? []).map((p) => [p.id, efetivo(p.id, p, fl, !!b.erro, b.okEm)])), [b.dados, b.erro, b.okEm, fl]);
  const conferindo = [...efs.values()].some((e) => e.conferindo);
  const itens = useMemo(() => (b.dados?.itens ?? [])
    .filter((p) => { const e = efs.get(p.id)!; return p.quantidade === null || p.quantidade > 0 || (e.estado !== 'ok' && e.estado !== 'zero'); })   // quantidade desconhecida APARECE (nunca some como se fosse zero)
    .sort((x, y) => x.gravidade - y.gravidade || (x.desde ?? '9').localeCompare(y.desde ?? '9')), [b.dados, efs]);
  const acoes = itens.filter((p) => (p.quantidade ?? 0) > 0).length;
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
  if (itens.length === 0) return (   // SEM PENDÊNCIAS: bloco compacto de uma linha (só quando TODAS as fontes confirmaram zero)
    <section className="gv2-cartao gv2-prioridades gv2-prioridades--vazio" data-gv2-bloco="prioridades" data-gv2-estado="zero">
      <CheckCircle2 size={18} aria-hidden className="gv2-ok-ic" />
      <div><strong>Prioridades de hoje · Sem pendências</strong>
        <span className="gv2-fraco">Nenhuma pendência encontrada nas fontes consultadas e atualizadas{b.dados.gerado_em ? ` · ${fmtQuando(b.dados.gerado_em)}` : ''}</span></div>
    </section>
  );
  const vis = todas ? itens : itens.slice(0, 3);
  return (
    <section className="gv2-cartao gv2-prioridades" data-gv2-bloco="prioridades" data-gv2-estado={b.erro ? 'problema' : 'conectado'}>
      {cab(<span className="gv2-selo gv2-selo--aviso">{acoes} {acoes === 1 ? 'ação' : 'ações'}</span>)}
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
function CartaoNumero({ titulo, icone, estado, carregando, valor, linha, rodape, link, problema, data }: {
  titulo: string; icone: ReactNode; estado: EstadoBloco | 'carregando' | 'semacesso'; carregando: boolean; valor: string; linha: ReactNode;
  rodape: string; link: { rotulo: string; rota: string } | null; problema: ReactNode; data: string;
}) {
  return (
    <article className="gv2-cartao gv2-num ger-entra" data-gv2-cartao={data} data-gv2-estado={estado}>
      <header className="gv2-num-cab"><h3 className="gv2-h3">{titulo}</h3><SeloEstado estado={estado} /><span className="gv2-num-ic" aria-hidden>{icone}</span></header>
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
  if (e.estado === 'desatualizado' && e.zeroNaoConfirmado) return <span title={e.quando ? `Último sucesso ${fmtQuando(e.quando)}` : undefined}>{e.motivo}</span>;
  if (e.estado === 'desatualizado') return <>Último valor válido preservado{e.quando ? ` · ${fmtQuando(e.quando)}` : ''}</>;
  // todos sem valor (valor null): não há soma — "Nenhum valor informado"; alguns sem valor: soma dos informados
  if (e.estado === 'parcial' && e.semValor !== null) return <>{normal}<span className="gv2-aviso-linha" data-gv2-soma-parcial>{valor === null ? 'Nenhum valor informado' : 'Soma dos valores informados'} · {textoSemValor(e.semValor)}</span></>;
  if (e.estado === 'parcial') return <>{normal}<span className="gv2-aviso-linha">{e.motivo || 'Leitura incompleta.'}</span></>;
  return normal;
}
function BlocoResultado({ b, fl }: { b: ReturnType<typeof useBloco<Resumo>>; fl: FontesLidas }) {
  const r = b.dados; const car = b.carregando && !r;
  const ef = (id: IdIndicador, x: Resumo['pedidos_bling'] | Resumo['negocios_ganhos'] | undefined) => (x ? efetivo(id, x, fl, !!b.erro, b.okEm) : undefined);
  const ep = ef('pedidos_bling', r?.pedidos_bling), eg = ef('negocios_ganhos', r?.negocios_ganhos), eu = ef('funil_aberto', r?.funil_aberto);
  const est = (e: Efetivo | undefined): EstadoBloco | 'carregando' | 'semacesso' => (car || e?.conferindo ? 'carregando' : !r ? (semAcesso(b.erro) ? 'semacesso' : 'erro') : e!.estado);
  const valorDe = (e: Efetivo | undefined, v: number | null | undefined) => (e?.zeroNaoConfirmado ? '—' : fmtMoeda(v ?? null));
  const falhaGeral = !r && !car ? (semAcesso(b.erro) ? <p className="gv2-fraco">Seu nível de acesso não inclui este resultado.</p>
    : <Problema motivo="Não foi possível ler este resultado agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />) : null;
  const porBloco = (e: { estado: EstadoBloco; ultimo_sucesso: string | null; motivo: string | null } | undefined): ReactNode => {
    if (falhaGeral) return falhaGeral;
    if (!e) return null;
    if (e.estado === 'aguardando') return <><span className="gv2-num-valor gv2-num-valor--vazio">—</span><span className="gv2-num-linha">Sem valor disponível · nenhum número assumido</span></>;
    if (e.estado === 'erro') return <Problema motivo={e.motivo || 'A leitura desta fonte falhou.'} quando={e.ultimo_sucesso} onTentar={b.recarregar} tentando={b.atualizando} />;
    return null;
  };
  const p = r?.pedidos_bling, g = r?.negocios_ganhos, f = r?.funil_aberto;
  const plural = (n: number | null, um: string, varios: string) => `${fmtN(n)} ${n === 1 ? um : varios}`;
  return (
    <section className="gv2-sec" data-gv2-bloco="resultado">
      <div className="gv2-sec-cab gv2-sec-cab--solto">
        <h2 className="gv2-h2">Resultado comercial</h2>
        <span className="gv2-fraco gv2-dir">{r ? r.periodo.rotulo : car ? 'Carregando o período…' : 'Período indisponível'}</span>
      </div>
      {r && b.erro && <Problema motivo="A atualização falhou; os cartões mostram a última leitura válida." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />}
      <div className="gv2-tres">
        <CartaoNumero data="pedidos" titulo="Pedidos lançados no Bling" icone={<Package size={18} />} estado={est(ep)} carregando={car || !!ep?.conferindo}
          valor={valorDe(ep, p?.valor)} problema={porBloco(p)}
          linha={p && ep && linhaEstado(ep, <>{plural(p.quantidade, 'pedido', 'pedidos')} · pela data do pedido{p.inclui_canceladas && <span className="gv2-nota">Inclui vendas canceladas depois do lançamento.</span>}</>)}
          rodape="Bling · não é recebimento" link={{ rotulo: 'Ver pedidos', rota: '#/panel-bling' }} />
        <CartaoNumero data="ganhos" titulo="Negócios ganhos" icone={<TrendingUp size={18} />} estado={est(eg)} carregando={car || !!eg?.conferindo}
          valor={valorDe(eg, g?.valor)} problema={porBloco(g)}
          linha={g && eg && linhaEstado(eg, <>{plural(g.quantidade, 'negócio ganho', 'negócios ganhos')} · no período</>, g.valor)}
          rodape="Pipedrive · data do ganho" link={{ rotulo: 'Ver negócios', rota: '#/panel-pipedrive' }} />
        <CartaoNumero data="funil" titulo="Funil aberto agora" icone={<Layers size={18} />} estado={est(eu)} carregando={car || !!eu?.conferindo}
          valor={valorDe(eu, f?.valor)} problema={porBloco(f)}
          linha={f && eu && linhaEstado(eu, <>{plural(f.quantidade, 'negócio aberto', 'negócios abertos')}</>, f.valor)}
          rodape="Pipedrive · funil atual" link={{ rotulo: 'Abrir funil', rota: '#/panel-pipedrive' }} />
      </div>
    </section>
  );
}

// ── 3a. Pedidos no período (barras por dia; soma = cartão) ──────────
function Barras({ p }: { p: PedidosBling }) {
  // desenhado na LARGURA REAL do bloco (sem escalar o SVG): rótulos sempre com 12 px de verdade, em 2200 e em 1440
  const caixa = useRef<HTMLDivElement>(null); const [W, setW] = useState(0);
  useEffect(() => { const el = caixa.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width))); ro.observe(el); return () => ro.disconnect(); }, []);
  const dias = p.por_dia; const max = Math.max(1, ...dias.map((d) => d.valor ?? 0));
  const passo = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000].find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  const topo = passo * 4; const H = 210, E = 78, B = 26, T = 18;   // E = margem do eixo; B = rótulos embaixo; T = folga em cima
  const larg = (W - E) / Math.max(1, dias.length);
  const cabe = Math.max(1, Math.ceil(46 / Math.max(1, larg)));   // um rótulo de dia a cada N barras (≥ 46 px entre rótulos)
  const valorEmCima = larg >= 44;
  return (
    <div ref={caixa} className="gv2-barras-caixa">
      {W > 0 && (
        <svg className="gv2-barras" width={W} height={H + B} viewBox={`0 0 ${W} ${H + B}`} role="img" aria-label={`Pedidos por dia: ${dias.map((d) => `${fmtDiaMes(d.dia)} ${fmtMoeda(d.valor)}`).join('; ')}`}>
          {[0, 1, 2, 3, 4].map((k) => { const y = H - (k * passo / topo) * (H - T); return (
            <g key={k}><line x1={E} x2={W} y1={y} y2={y} className="gv2-grade" /><text x={E - 10} y={y + 4} textAnchor="end" className="gv2-eixo">{k === 0 ? '0' : `R$ ${fmtMoedaCurta(k * passo)}`}</text></g>); })}
          {dias.map((d, i) => {
            const v = d.valor; const h = v === null ? 0 : Math.max(v > 0 ? 3 : 0, (v / topo) * (H - T)); const w = Math.min(84, larg * 0.6); const x = E + i * larg + (larg - w) / 2;
            return (
              <g key={d.dia} data-gv2-dia={d.dia}>
                <title>{`${fmtData(d.dia)}: ${v === null ? 'sem dado' : `${fmtN(d.quantidade)} pedido(s) · ${fmtMoeda(v)}`}`}</title>
                {v === null ? <text x={x + w / 2} y={H - 4} textAnchor="middle" className="gv2-eixo">sem dado</text>
                  : <rect x={x} y={H - h} width={w} height={h} rx={4} className="gv2-barra" />}
                {v !== null && v > 0 && valorEmCima && <text x={x + w / 2} y={H - h - 6} textAnchor="middle" className="gv2-eixo">{fmtMoedaCurta(v)}</text>}
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
  const p0 = b.dados?.pedidos_bling; const e = p0 ? efetivo('pedidos_bling', p0, fl, !!b.erro, b.okEm) : null;
  const car = (b.carregando && !b.dados) || !!e?.conferindo;
  // o gráfico usa o estado EFETIVO (zero com o Bling atrasado não é "zero"; valor com o Bling atrasado é "Desatualizado")
  const p = p0 && e ? { ...p0, estado: e.estado } : p0;
  // soma dos dias COM dado (dia sem dado = null fica de fora e é contado à parte; ACIMA_DIREITA: "no desatualizado, 2 + 1 + 1 = 4 = cartão")
  const comDado = p ? p.por_dia.filter((d) => d.valor !== null) : [];
  const semDado = p ? p.por_dia.length - comDado.length : 0;
  const soma = comDado.length ? comDado.reduce((s, d) => s + (d.valor as number), 0) : null;
  const confere = p && soma !== null && p.valor !== null && Math.abs(soma - p.valor) < 0.5;
  return (
    <section className="gv2-cartao gv2-grafico" data-gv2-bloco="grafico" data-gv2-estado={car ? 'carregando' : p?.estado ?? 'erro'}>
      <div className="gv2-sec-cab">
        <div><h2 className="gv2-h2">Pedidos no período</h2><span className="gv2-fraco">Bling · pedidos lançados por dia, pela data do pedido</span></div>
        {p && p.quantidade !== null && p.estado !== 'aguardando' && p.estado !== 'erro' && !e?.zeroNaoConfirmado && <span className="gv2-selo gv2-selo--info gv2-dir">{fmtN(p.quantidade)} {p.quantidade === 1 ? 'pedido' : 'pedidos'}</span>}
        {(car || !p || p.estado === 'aguardando' || p.estado === 'erro' || p.estado === 'parcial' || p.estado === 'desatualizado') && <span className="gv2-dir"><SeloEstado estado={car ? 'carregando' : p?.estado ?? 'erro'} /></span>}
      </div>
      {car ? <div className="gv2-barras-osso" aria-hidden>{Array.from({ length: 7 }, (_, k) => <span key={k} className="ger-osso" style={{ height: `${30 + ((k * 37) % 60)}%` }} />)}</div>
        : !p ? <Problema motivo="Não foi possível ler os pedidos agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />
        : p.estado === 'aguardando' ? <p className="gv2-vazio"><PlugZap size={15} aria-hidden /> Bling ainda não conectado · nenhum número assumido.</p>
        : p.estado === 'erro' ? <Problema motivo={p.motivo || 'A leitura do Bling falhou.'} quando={p.ultimo_sucesso} onTentar={b.recarregar} tentando={b.atualizando} />
        : e?.zeroNaoConfirmado ? <p className="gv2-vazio" data-gv2-zero-nao-confirmado>{e.motivo}{e.quando ? ` · último sucesso ${fmtQuando(e.quando)}` : ''}. Nenhum zero assumido.</p>
        : p.estado === 'zero' ? <p className="gv2-vazio" data-gv2-zero><CheckCircle2 size={15} aria-hidden className="gv2-ok-ic" /> Zero pedidos lançados no período — consulta completa, com a fonte em dia.</p>
        : (
          <>
            <Barras p={p} />
            <p className="gv2-fraco gv2-grafico-rodape">
              Valor total: <strong>{fmtMoeda(p.valor)}</strong>{confere ? (semDado ? ' · soma dos dias com dado igual ao cartão' : ' · soma igual ao cartão acima') : ' · ⚠ a soma dos dias não confere com o cartão'}
              {semDado > 0 && ` · ${semDado} ${semDado === 1 ? 'dia' : 'dias'} sem dado`}
              {p.inclui_canceladas && ' · inclui vendas canceladas depois do lançamento'}
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
function textoFonte(f: Fonte, ef: { estado: Fonte['estado']; por: string[] }): string {
  if (ef.estado === 'aguardando') return 'Aguardando conexão';
  const q = f.ultimo_sucesso ? `atualizado ${fmtQuando(f.ultimo_sucesso)}` : 'sem horário de atualização';
  if (ef.estado !== f.estado && ef.por.length) return `${ef.estado === 'problema' ? 'Com problema' : 'Desatualizado'} · ${ef.por.join(', ')}`;
  if (ef.estado === 'problema') return 'Com problema';
  return ef.estado === 'desatualizada' ? `Desatualizado · ${q}` : q.charAt(0).toUpperCase() + q.slice(1);
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
