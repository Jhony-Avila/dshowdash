// v2/Asaas.tsx — cartão "Asaas · financeiro" da Geral V2 + drill-down das vencidas (CIMA, 26/11).
// Contratos (ACIMA_ESQUERDA): GET /api/geral/v2/asaas.php (P21, GeralV2Asaas::cartao) e GET /api/asaas/?r=vencidas (P34, AsaasResumo::vencidas).
// 404/401/403 sem dados = sem a flag global `geral_v2_asaas` ou sem `financeiro_asaas_leitura` → o cartão NÃO aparece (nem a linha nas fontes).
// Regras do serviço que a tela respeita: total só com TODAS as empresas ok (senão "—" + por empresa); empresa sem leitura atual = "—" com o
// motivo, nunca R$ 0; valor bruto da cobrança (sem juros/multa). A tela nunca mostra chave nem CNPJ (o serviço não manda).
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Banknote } from 'lucide-react';
import { ErroV2, dinheiro, fmtData, fmtDiaMes, fmtMoeda2, fmtN, fmtQuando, lerVencidasAsaas, type AsaasCartao, type AsaasEmpresa, type Fonte } from './servico';
import { Problema, useBloco } from './comuns';

type BlocoAsaas = ReturnType<typeof useBloco<AsaasCartao>>;
/** O cartão não existe para a pessoa (sem a flag ou sem a permissão): o serviço responde 404 (ou 401/403 sem sessão). */
export const asaasOculto = (b: BlocoAsaas) => !b.dados && b.erro instanceof ErroV2 && (b.erro.http === 404 || b.erro.semAcesso);

const MOTIVO: Record<string, string> = {
  conta_divergente: 'conta trocada: números bloqueados',
  nunca_sincronizada: 'ainda não sincronizada',
  desatualizada: 'leitura com mais de 3 h',
};
export const textoMotivoAsaas = (m: string | null) => (m === null ? '' : MOTIVO[m] ?? (m.startsWith('erro:') ? 'a sincronização falhou' : m.startsWith('ultima_tentativa_falhou:') ? 'última tentativa falhou (valores da leitura anterior)' : m));
const nomeEmp = (e: { nome: string | null; conta: string }) => e.nome ?? e.conta;

type Estado = 'ok' | 'parcial' | 'desatualizado' | 'erro' | 'aguardando' | 'carregando';
function estadoCartao(b: BlocoAsaas): Estado {
  const d = b.dados;
  if (!d) return b.carregando ? 'carregando' : 'erro';
  if (d.empresas.length === 0) return 'aguardando';
  const ok = d.empresas.filter((e) => e.estado === 'ok').length;
  if (b.erro) return 'desatualizado';
  if (ok === d.empresas.length && d.total) return 'ok';
  if (ok > 0) return 'parcial';
  return d.empresas.some((e) => e.estado === 'desatualizado') ? 'desatualizado' : 'erro';
}
const SELO: Partial<Record<Estado, [string, string]>> = {
  parcial: ['Dados parciais', 'aviso'], desatualizado: ['Desatualizado', 'aviso'], erro: ['Com problema', 'erro'], aguardando: ['Aguardando conexão', 'neutro'], carregando: ['Carregando…', 'neutro'],
};
const maisAntigo = (xs: (string | null)[]) => xs.filter((x): x is string => !!x).sort()[0] ?? null;

/** Linha do Asaas em "Fontes e atualização" (o painel.php não traz o Asaas: ele vem desta leitura). null = não mostra. */
export function fonteAsaas(b: BlocoAsaas): Fonte | null {
  if (asaasOculto(b) || (b.carregando && !b.dados)) return null;
  const d = b.dados;
  if (!d) return { fonte: 'asaas', estado: 'problema', ultimo_sucesso: null, motivo: 'Não foi possível ler o Asaas agora.', rotulo_estado: 'Com problema' };
  const ok = d.empresas.filter((e) => e.estado === 'ok');
  const quando = maisAntigo(ok.map((e) => e.atualizado_em)) ?? maisAntigo(d.empresas.map((e) => e.atualizado_em));
  const fora = d.empresas.filter((e) => e.estado !== 'ok').map((e) => `${nomeEmp(e)}: ${textoMotivoAsaas(e.motivo)}`).join(' · ') || null;
  if (d.empresas.length === 0) return { fonte: 'asaas', estado: 'aguardando', ultimo_sucesso: null, motivo: 'Nenhuma conta do Asaas configurada.', rotulo_estado: 'Aguardando conexão' };
  if (b.erro) return { fonte: 'asaas', estado: 'desatualizada', ultimo_sucesso: quando, motivo: 'A atualização falhou; vale a última leitura.', rotulo_estado: 'Desatualizado' };
  if (ok.length === d.empresas.length) return { fonte: 'asaas', estado: 'conectada', ultimo_sucesso: quando, motivo: null, rotulo_estado: 'Atualizado' };
  if (ok.length > 0) return { fonte: 'asaas', estado: 'desatualizada', ultimo_sucesso: quando, motivo: fora, rotulo_estado: `Dados parciais (${ok.length} de ${d.empresas.length} empresas)` };
  return { fonte: 'asaas', estado: d.empresas.some((e) => e.estado === 'desatualizado') ? 'desatualizada' : 'problema', ultimo_sucesso: quando, motivo: fora,
           rotulo_estado: d.empresas.some((e) => e.estado === 'desatualizado') ? 'Desatualizado' : 'Com problema' };
}

function Valor({ rotulo, valor, linha, dado }: { rotulo: string; valor: string; linha: ReactNode; dado: string }) {
  return (
    <>
      <span className="gv2-asaas-rot">{rotulo}</span>
      <span className={`gv2-num-valor${valor === '—' ? ' gv2-num-valor--vazio' : ''}`} data-gv2-asaas-valor={dado}>{valor}</span>
      <span className="gv2-num-linha">{linha}</span>
    </>
  );
}

export function CartaoAsaas({ b, aoVencidas }: { b: BlocoAsaas; aoVencidas: () => void }) {
  const [aberto, setAberto] = useState(false);
  if (asaasOculto(b)) return null;
  const d = b.dados; const est = estadoCartao(b); const selo = SELO[est];
  const t = d?.total ?? null;
  const m = (v: string | undefined | null) => fmtMoeda2(v === undefined ? null : dinheiro(v));
  const qtd = t ? t.vencidas_qtd : null;
  const semLeitura = d ? d.empresas.filter((e) => e.estado !== 'ok').length : 0;
  return (
    <article className="gv2-cartao gv2-num gv2-asaas ger-entra" data-gv2-cartao="asaas" data-gv2-estado={est}>
      <span className="gv2-marcador">Financeiro · Asaas</span>
      <header className="gv2-num-cab"><h3 className="gv2-h3">Asaas · financeiro</h3><span className="gv2-num-ic" aria-hidden><Banknote size={18} /></span></header>
      <div className="gv2-num-estado">{selo && <span className={`gv2-selo gv2-selo--${selo[1]}`} data-gv2-selo={est}>{selo[0]}</span>}</div>
      {est === 'carregando' ? (
        <div className="gv2-asaas-tres" aria-busy>{[0, 1, 2].map((k) => <div key={k} className="gv2-asaas-item"><span className="ger-osso gv2-osso" style={{ width: '50%', height: 12 }} /><span className="ger-osso gv2-osso" style={{ width: '70%', height: 30 }} /></div>)}</div>
      ) : !d ? (
        <Problema motivo="Não foi possível ler o Asaas agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />
      ) : (
        <>
          {b.erro && <Problema motivo="A atualização falhou; os valores são da última leitura válida." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />}
          <div className="gv2-asaas-tres">
            <div className="gv2-asaas-item" data-gv2-asaas="recebido_hoje">
              <Valor dado="recebido_hoje" rotulo="Recebido hoje" valor={m(t?.recebido_hoje)} linha={<>Pagamentos de hoje · {fmtDiaMes(d.janela.hoje)}</>} />
            </div>
            <div className="gv2-asaas-item" data-gv2-asaas="a_receber_7d">
              <Valor dado="a_receber_7d" rotulo="A receber em 7 dias" valor={m(t?.a_receber_7d)} linha={<>Vencimento de {fmtDiaMes(d.janela.hoje)} a {fmtDiaMes(d.janela.a_receber_ate)}</>} />
            </div>
            <button type="button" className="gv2-asaas-item gv2-asaas-item--acao" data-gv2-asaas="vencidas" onClick={aoVencidas}>
              <Valor dado="vencidas" rotulo="Vencidas" valor={m(t?.vencidas)}
                linha={<>{qtd === null ? 'Quantidade: —' : `${fmtN(qtd)} ${qtd === 1 ? 'cobrança vencida' : 'cobranças vencidas'}`}<span className="gv2-asaas-ver">Ver vencidas <ArrowRight size={13} aria-hidden /></span></>} />
            </button>
          </div>
          {d.empresas.length === 0 ? <p className="gv2-fraco">Nenhuma conta do Asaas configurada · nenhum número assumido.</p>
            : !t && <p className="gv2-aviso-linha" data-gv2-asaas-parcial>Sem total: {semLeitura} de {d.empresas.length} {d.empresas.length === 1 ? 'empresa' : 'empresas'} sem leitura atual (a soma parcial nunca é mostrada). Veja por empresa.</p>}
        </>
      )}
      <footer className="gv2-num-rodape">
        <span className="gv2-fraco">Asaas · cobranças, valor bruto (sem juros/multa)</span>
        {d && d.empresas.length > 0 && <button type="button" className="gv2-link" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>{aberto ? 'Fechar' : 'Por empresa'} <ArrowRight size={13} aria-hidden className={aberto ? 'gv2-gira90' : undefined} /></button>}
      </footer>
      {aberto && d && <PorEmpresa empresas={d.empresas} />}
    </article>
  );
}

function PorEmpresa({ empresas }: { empresas: AsaasEmpresa[] }) {
  const m = (v: string | undefined) => fmtMoeda2(v === undefined ? null : dinheiro(v));
  return (
    <div className="gv2-asaas-rolar">
      <table className="gv2-asaas-tab" data-gv2-asaas-empresas>
        <caption className="gv2-sr">Asaas por empresa</caption>
        <thead><tr><th scope="col">Empresa</th><th scope="col">Recebido hoje</th><th scope="col">A receber 7 dias</th><th scope="col">Vencidas</th><th scope="col">Leitura</th></tr></thead>
        <tbody>
          {empresas.map((e) => { const v = e.estado === 'ok' ? e.valores : null; return (
            <tr key={e.conta} data-gv2-asaas-empresa={e.conta}>
              <th scope="row">{nomeEmp(e)}</th>
              <td className="gv2-conc-num">{m(v?.recebido_hoje)}</td>
              <td className="gv2-conc-num">{m(v?.a_receber_7d)}</td>
              <td className="gv2-conc-num">{v ? `${m(v.vencidas)} · ${fmtN(v.vencidas_qtd)}` : '—'}</td>
              <td className="gv2-asaas-leitura">{e.estado === 'ok' ? `${e.atualizado_em ? `Atualizada ${fmtQuando(e.atualizado_em)}` : 'Atualizada'}${e.motivo ? ` · ${textoMotivoAsaas(e.motivo)}` : ''}` : `— · ${textoMotivoAsaas(e.motivo) || 'sem leitura'}${e.atualizado_em ? ` · última ${fmtQuando(e.atualizado_em)}` : ''}`}</td>
            </tr>
          ); })}
        </tbody>
      </table>
    </div>
  );
}

/** Drill-down "Vencidas do Asaas": empresa, cliente, vencimento, valor e dias de atraso (P34). */
export function VencidasAsaas({ aoVoltar }: { aoVoltar: () => void }) {
  const b = useBloco((s) => lerVencidasAsaas(s), []);
  const d = b.dados;
  const linhas = (d?.contas ?? []).flatMap((c) => (c.cobrancas ?? []).map((x) => ({ c, x })));
  const fora = (d?.contas ?? []).filter((c) => !c.disponivel);
  const truncadas = (d?.contas ?? []).filter((c) => c.truncada);
  const qtd = (d?.contas ?? []).reduce((s, c) => s + (c.disponivel && c.qtd !== null ? c.qtd : 0), 0);
  const soma = (d?.contas ?? []).reduce((s, c) => s + (c.disponivel ? dinheiro(c.total) ?? 0 : 0), 0);
  return (
    <div className="gv2-lista" data-gv2-vencidas-asaas>
      <nav className="gv2-trilha" aria-label="Você está em">
        <button type="button" className="gv2-link" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button>
        <span aria-hidden>›</span><span>Vencidas do Asaas</span>
      </nav>
      <section className="gv2-sec">
        <div className="gv2-sec-cab">
          <h2 className="gv2-h2">Cobranças vencidas · Asaas</h2>
          <span className="gv2-fraco gv2-dir">
            {d ? `${fmtN(qtd)} ${qtd === 1 ? 'cobrança' : 'cobranças'} · ${fmtMoeda2(soma)}${fora.length ? ` nas empresas com leitura (${fora.length} sem leitura)` : ''} · conferido ${fmtQuando(d.gerado_em)}` : b.carregando ? 'Carregando…' : '—'}
          </span>
        </div>
        {b.carregando && !d ? (
          <ul className="gv2-integ-lista" aria-busy>{[0, 1, 2, 3].map((k) => <li key={k} className="gv2-integ gv2-integ--osso"><span className="gv2-osso" style={{ width: '30%' }} /><span className="gv2-osso" style={{ width: '55%' }} /></li>)}</ul>
        ) : b.erro instanceof ErroV2 && (b.erro.http === 404 || b.erro.semAcesso) && !d ? (
          <p className="gv2-fraco">Seu acesso não inclui as cobranças do Asaas.</p>
        ) : !d ? (
          <Problema motivo="Não foi possível ler as cobranças vencidas agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />
        ) : (
          <>
            {b.erro && <Problema motivo="A atualização falhou; mostrando a última leitura." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />}
            {fora.map((c) => <p key={c.conta} className="gv2-aviso-linha" data-gv2-vencidas-sem-leitura={c.conta}>{nomeEmp(c)}: — · {textoMotivoAsaas(c.motivo) || 'sem leitura'} · vencidas desconhecidas, não é zero.</p>)}
            {truncadas.map((c) => <p key={`t-${c.conta}`} className="gv2-fraco">{nomeEmp(c)}: mostrando as {fmtN(d.limite_por_empresa)} mais antigas de {fmtN(c.qtd)}.</p>)}
            {linhas.length === 0 ? (
              <p className="gv2-fraco">{fora.length ? 'Nenhuma cobrança vencida nas empresas com leitura.' : 'Nenhuma cobrança vencida.'}</p>
            ) : (
              <div className="gv2-asaas-rolar">
                <table className="gv2-asaas-tab gv2-venc-tab">
                  <caption className="gv2-sr">Cobranças vencidas do Asaas</caption>
                  <thead><tr><th scope="col">Empresa</th><th scope="col">Cliente (código Asaas)</th><th scope="col">Vencimento</th><th scope="col">Valor</th><th scope="col">Dias de atraso</th></tr></thead>
                  <tbody>
                    {linhas.map(({ c, x }) => (
                      <tr key={`${c.conta}:${x.cobranca}`}>
                        <td>{nomeEmp(c)}</td>
                        <td>{x.cliente ?? '—'}</td>
                        <td>{x.vencimento ? fmtData(x.vencimento) : '—'}</td>
                        <td className="gv2-conc-num">{fmtMoeda2(dinheiro(x.valor))}</td>
                        <td className="gv2-conc-num">{x.dias_atraso === null ? '—' : fmtN(x.dias_atraso)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="gv2-fraco">Valor bruto da cobrança, sem juros nem multa. O serviço informa o cliente pelo código do Asaas.</p>
          </>
        )}
      </section>
    </div>
  );
}
