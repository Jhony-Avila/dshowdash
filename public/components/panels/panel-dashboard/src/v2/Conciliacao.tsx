// v2/Conciliacao.tsx — "Conciliação Asaas × Precifica" dentro de Integrações (CIMA, 26/11; v2 sobre a P38 da ACIMA_ESQUERDA).
// Contrato: GET /api/geral/v2/conciliacao-asaas.php?dias=30 (P31 + P38: casamento por valor exato da sobra do dia, ±3 dias úteis).
//   404 = flag global `geral_v2_conciliacao_asaas` desligada OU a pessoa sem `financeiro_asaas_leitura` → o bloco NÃO aparece.
// Pedido do Jhony (validou a v1 com dados reais; ficou longa): (1) quadro-resumo no topo, 1 linha por empresa com selo; (2) detalhe por dia
// RECOLHIDO, abre ao clicar na empresa, maiores diferenças primeiro; (3) motivos curtos + legenda; (4) conciliados com atraso em cinza,
// separados das divergências reais. Selo (a tela deriva dos números do serviço): Divergente = ≥1 dia sem par; Atenção = só atraso, ligação
// a confirmar ou valor desconhecido; Conciliada = nada sobra. Desconhecido = "—", nunca 0. A tela não mostra CNPJ nem chave.
import { useState } from 'react';
import { ChevronRight, Scale } from 'lucide-react';
import { ErroV2, dinheiro, fmtDiaMes, fmtMoeda2, fmtN, fmtQuando, lerConciliacao, type ConcDia, type ConcEmpresa } from './servico';
import { Problema, useBloco } from './comuns';

const MOTIVO_GERAL: Record<string, string> = {
  sem_acesso_precifica: 'Sem acesso à leitura do Precifica.',
  precifica_sem_leitura: 'O Precifica ainda não tem uma leitura utilizável.',
  sem_identidade_asaas: 'Sem a identidade das contas do Asaas: não dá para casar empresa e conta.',
};
const du = (n: number) => `${Math.abs(n)} d.u.`;
/** Motivo do serviço → rótulo curto (a frase inteira fica na legenda e no title). */
export function motivoCurto(m: string | null): string {
  if (!m) return '—';
  if (m === 'sem baixa no Precifica') return 'Sem baixa';
  if (m === 'sem recebimento no Asaas') return 'Sem recebimento';
  if (m.startsWith('valor diferente: tarifa')) return 'Tarifa';
  if (m.startsWith('valor diferente')) return 'Juros/multa/desc.';
  if (m.startsWith('valor do Precifica desconhecido')) return 'Precifica “—”';
  const a = /^conciliado com atraso de (\d+)/.exec(m); if (a) return `Atraso ${du(Number(a[1]))}`;
  const b = /^conciliado: baixa (\d+)/.exec(m); if (b) return `Baixa ${du(Number(b[1]))} antes`;
  if (m.startsWith('conciliado com diferença de data')) return 'Fim de semana';
  return m;
}
const LEGENDA: [string, string][] = [
  ['Sem baixa', 'recebido no Asaas, sem baixa no Precifica dentro da janela'],
  ['Sem recebimento', 'baixa no Precifica, sem recebimento no Asaas dentro da janela'],
  ['Tarifa', 'o Precifica lançou o valor líquido do Asaas (a diferença é a tarifa)'],
  ['Juros/multa/desc.', 'valores diferentes no dia: provável juros, multa ou desconto'],
  ['Precifica “—”', 'baixa do Precifica com valor desconhecido: nunca é casada'],
  ['Atraso N d.u.', 'conciliado: a baixa saiu N dias úteis depois do recebimento'],
  ['Baixa N d.u. antes', 'conciliado: a baixa saiu N dias úteis antes do recebimento'],
  ['Fim de semana', 'conciliado: só a data muda (fim de semana)'],
];

type Selo = ['Conciliada' | 'Atenção' | 'Divergente' | 'Sem par no Precifica' | 'Indisponível', 'ok' | 'aviso' | 'erro' | 'neutro'];
function selo(e: ConcEmpresa): Selo {
  if (e.estado === 'sem_par') return ['Sem par no Precifica', 'neutro'];
  if (e.estado === 'indisponivel') return ['Indisponível', 'neutro'];
  const r = e.resumo; const sem = r?.itens_sem_par ?? e.divergencias;
  if (e.ligacao_a_confirmar) return ['Atenção', 'aviso'];
  if (sem === null || sem === undefined) return ['Atenção', 'aviso'];
  if (sem > 0) return ['Divergente', 'erro'];
  if ((r?.conciliados_com_atraso ?? 0) > 0) return ['Atenção', 'aviso'];
  return ['Conciliada', 'ok'];
}
const m2 = (v: string | null | undefined) => fmtMoeda2(v === undefined ? null : dinheiro(v));
const mDif = (v: string | null | undefined) => { const n = v === undefined ? null : dinheiro(v); return n === null ? '—' : `${n > 0 ? '+' : ''}${fmtMoeda2(n)}`; };
const absNum = (d: ConcDia) => { const n = dinheiro(d.restante ?? d.diferenca); return n === null ? Number.POSITIVE_INFINITY : Math.abs(n); };   // desconhecido primeiro

function Detalhe({ e, id }: { e: ConcEmpresa; id: string }) {
  const dias = e.dias ?? [];
  const div = dias.filter((d) => d.divergente).sort((a, b) => absNum(b) - absNum(a));
  const atraso = dias.filter((d) => !d.divergente && (d.conciliado_com?.length ?? 0) > 0).sort((a, b) => a.dia.localeCompare(b.dia));
  const batem = dias.length - div.length - atraso.length;
  return (
    <div className="gv2-conc-det" id={id} data-gv2-conc-detalhe={e.conta}>
      {e.motivo && <p className="gv2-aviso-linha">{e.motivo}</p>}
      {div.length > 0 ? (
        <div className="gv2-conc-rolar">
          <table className="gv2-conc-tab">
            <caption className="gv2-conc-cap">Divergências · maiores diferenças primeiro</caption>
            <thead><tr><th scope="col">Dia</th><th scope="col">Asaas</th><th scope="col">Precifica</th><th scope="col">Sobra</th><th scope="col">Motivo</th></tr></thead>
            <tbody>{div.map((d) => (
              <tr key={d.dia} className="gv2-conc-div">
                <td>{fmtDiaMes(d.dia)}</td><td className="gv2-conc-num">{m2(d.asaas)}</td><td className="gv2-conc-num">{m2(d.precifica)}</td>
                <td className="gv2-conc-num gv2-conc-sobra">{mDif(d.restante ?? d.diferenca)}</td>
                <td className="gv2-conc-motivo" title={d.motivo ?? undefined}>{motivoCurto(d.motivo)}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      ) : <p className="gv2-fraco">Nenhuma divergência real na janela.</p>}
      {atraso.length > 0 && (
        <div className="gv2-conc-rolar gv2-conc-atraso">
          <table className="gv2-conc-tab">
            <caption className="gv2-conc-cap">Conciliados com atraso · {fmtN(atraso.length)}</caption>
            <thead><tr><th scope="col">Dia</th><th scope="col">Asaas</th><th scope="col">Precifica</th><th scope="col" className="gv2-conc-esq">Par</th><th scope="col">Motivo</th></tr></thead>
            <tbody>{atraso.map((d) => (
              <tr key={d.dia}>
                <td>{fmtDiaMes(d.dia)}</td><td className="gv2-conc-num">{m2(d.asaas)}</td><td className="gv2-conc-num">{m2(d.precifica)}</td>
                <td>{(d.conciliado_com ?? []).map((p) => `${fmtDiaMes(p.dia)} (${m2(p.valor)})`).join(' · ')}</td>
                <td className="gv2-conc-motivo" title={d.motivo ?? undefined}>{motivoCurto(d.motivo)}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}
      {batem > 0 && <p className="gv2-fraco">{fmtN(batem)} {batem === 1 ? 'dia bate' : 'dias batem'} (diferença até a tolerância) e não {batem === 1 ? 'aparece' : 'aparecem'} aqui.</p>}
    </div>
  );
}

function LinhaEmpresa({ e }: { e: ConcEmpresa }) {
  const [aberto, setAberto] = useState(false);
  const [rot, cls] = selo(e);
  const nome = e.nome ?? e.empresa_precifica ?? e.conta;
  const r = e.resumo ?? null; const temDetalhe = (e.dias?.length ?? 0) > 0 || !!e.motivo;
  const id = `gv2-conc-det-${e.conta.replace(/[^A-Za-z0-9_-]/g, '_')}`;
  const n = (v: number | null | undefined) => (v === undefined || v === null ? '—' : fmtN(v));
  return (
    <>
      <tr className={`gv2-conc-linha gv2-conc-linha--${cls}`} data-gv2-conc-empresa={e.conta} data-gv2-conc-selo={rot}>
        <th scope="row" data-rotulo="Empresa">
          {temDetalhe ? (
            <button type="button" className="gv2-conc-abrir" aria-expanded={aberto} aria-controls={id} onClick={() => setAberto((v) => !v)}>
              <ChevronRight size={14} aria-hidden className={aberto ? 'gv2-gira90' : undefined} />{nome}
            </button>
          ) : <span className="gv2-conc-nome">{nome}</span>}
          {e.empresa_precifica && e.empresa_precifica !== nome && <span className="gv2-fraco gv2-conc-pcf">Precifica: {e.empresa_precifica}</span>}
        </th>
        <td className="gv2-conc-num" data-rotulo="Asaas">{m2(r?.asaas)}</td>
        <td className="gv2-conc-num" data-rotulo="Precifica">{m2(r?.precifica)}</td>
        <td className="gv2-conc-num" data-rotulo="Diferença">{mDif(r?.diferenca)}</td>
        <td className="gv2-conc-num" data-rotulo="Sem par">{n(r?.itens_sem_par)}</td>
        <td className="gv2-conc-num gv2-conc-cinza" data-rotulo="Com atraso">{n(r?.conciliados_com_atraso)}</td>
        <td data-rotulo="Situação"><span className={`gv2-pilula gv2-pilula--${cls}`}>{rot}</span>{e.ligacao_a_confirmar && <span className="gv2-fraco gv2-conc-lig">ligação a confirmar</span>}</td>
      </tr>
      {aberto && <tr className="gv2-conc-det-linha"><td colSpan={7}><Detalhe e={e} id={id} /></td></tr>}
    </>
  );
}

export function Conciliacao() {
  const b = useBloco((s) => lerConciliacao(s), []);
  const [legenda, setLegenda] = useState(false);
  const naoMostra = b.erro instanceof ErroV2 && (b.erro.http === 404 || b.erro.semAcesso) && !b.dados;
  if (naoMostra) return null;                                 // sem a flag ou sem financeiro_asaas_leitura: o bloco não existe para a pessoa
  if (b.carregando && !b.dados) return <div className="gv2-integ gv2-integ--osso" aria-busy><span className="gv2-osso" style={{ width: '30%' }} /><span className="gv2-osso" style={{ width: '55%' }} /></div>;
  const d = b.dados; const empresas = d?.empresas ?? null;
  const cab = d ? [
    `${fmtDiaMes(d.janela.de)} a ${fmtDiaMes(d.janela.ate)}`,
    d.divergencias === null || d.divergencias === undefined ? 'divergências: —' : d.divergencias === 0 ? 'nenhum dia divergente' : `${fmtN(d.divergencias)} ${d.divergencias === 1 ? 'dia divergente' : 'dias divergentes'}`,
    d.conciliados_com_atraso ? `${fmtN(d.conciliados_com_atraso)} com atraso` : null,
    d.ligacoes_a_confirmar ? `${fmtN(d.ligacoes_a_confirmar)} ${d.ligacoes_a_confirmar === 1 ? 'ligação' : 'ligações'} a confirmar` : null,
    d.precifica_em ? `leitura do Precifica ${fmtQuando(d.precifica_em)}` : null,
  ].filter(Boolean).join(' · ') : '—';
  return (
    <section className="gv2-sec gv2-conc" data-gv2-conciliacao aria-labelledby="gv2-conc-titulo">
      <div className="gv2-sec-cab">
        <h2 className="gv2-h2" id="gv2-conc-titulo"><Scale size={18} aria-hidden /> Conciliação Asaas × Precifica</h2>
        <span className="gv2-fraco gv2-dir">{cab}</span>
      </div>
      {b.erro && (d
        ? <Problema motivo="A atualização da conciliação falhou; mostrando a última leitura." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />
        : <Problema motivo="Não foi possível ler a conciliação agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />)}
      {d && d.estado === 'indisponivel' && (
        <p className="gv2-fraco">— · {MOTIVO_GERAL[d.motivo ?? ''] ?? 'Conciliação indisponível agora.'} Nada é assumido como conciliado.</p>
      )}
      {d && d.estado === 'ok' && empresas !== null && (empresas.length === 0
        ? <p className="gv2-fraco">Nenhuma conta do Asaas informada pelo serviço.</p>
        : (
          <div className="gv2-conc-rolar">
            <table className="gv2-conc-tab gv2-conc-resumo" data-gv2-conc-resumo>
              <caption className="gv2-sr">Resumo da conciliação por empresa · clique na empresa para ver os dias</caption>
              <thead><tr><th scope="col">Empresa</th><th scope="col">Asaas</th><th scope="col">Precifica</th><th scope="col">Diferença</th><th scope="col">Sem par</th><th scope="col">Com atraso</th><th scope="col">Situação</th></tr></thead>
              <tbody>{empresas.map((e) => <LinhaEmpresa key={e.conta} e={e} />)}</tbody>
            </table>
          </div>
        ))}
      {d && (
        <div className="gv2-conc-rodape">
          <p className="gv2-fraco">
            Casamento pelo valor exato da sobra do dia, em até {d.casamento?.dias_uteis ?? 3} dias úteis (feriados não descontados). Diverge o que sobra acima de R$ {d.tolerancia.replace('.', ',')}. O motivo é provável, não confirmado.
          </p>
          <button type="button" className="gv2-link" aria-expanded={legenda} aria-controls="gv2-conc-legenda" onClick={() => setLegenda((v) => !v)}>{legenda ? 'Fechar legenda' : 'Legenda dos motivos'}</button>
          {legenda && (
            <dl className="gv2-conc-legenda" id="gv2-conc-legenda">
              {LEGENDA.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              <div><dt>Situação</dt><dd>Divergente = há dia sem par · Atenção = só atraso, ligação a confirmar ou valor desconhecido · Conciliada = nada sobra</dd></div>
            </dl>
          )}
        </div>
      )}
    </section>
  );
}
