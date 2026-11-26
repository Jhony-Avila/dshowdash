// v2/Conciliacao.tsx — "Conciliação Asaas × Precifica" dentro de Integrações (CIMA, 26/11).
// Contrato: ACIMA_ESQUERDA, GET /api/geral/v2/conciliacao-asaas.php?dias=30 (P31 c5451876; só leitura).
//   404 = flag global `geral_v2_conciliacao_asaas` desligada OU a pessoa sem `financeiro_asaas_leitura` → o bloco NÃO aparece.
//   { estado: ok|indisponivel, motivo, janela{de,ate}, tolerancia, precifica_em, divergencias,
//     empresas: [{ conta, nome, empresa_precifica, estado: ok|sem_par|indisponivel, motivo, divergencias, dias: [{ dia, asaas, asaas_liquido,
//                  precifica, diferenca, divergente, motivo }] }] | null }
// Desconhecido = null → "—", nunca 0. A tela não mostra CNPJ (o serviço não manda) nem chave.
import { useState } from 'react';
import { Scale } from 'lucide-react';
import { ErroV2, dinheiro, fmtDiaMes, fmtMoeda2, fmtQuando, lerConciliacao, type ConcEmpresa } from './servico';
import { Problema, useBloco } from './comuns';

const MOTIVO_GERAL: Record<string, string> = {
  sem_acesso_precifica: 'Sem acesso à leitura do Precifica.',
  precifica_sem_leitura: 'O Precifica ainda não tem uma leitura utilizável.',
  sem_identidade_asaas: 'Sem a identidade das contas do Asaas: não dá para casar empresa e conta.',
};
const fmtDif = (v: string | null) => { const n = dinheiro(v); return n === null ? '—' : `${n > 0 ? '+' : ''}${fmtMoeda2(n)}`; };

function estadoEmpresa(e: ConcEmpresa): [string, string] {
  if (e.estado === 'sem_par') return ['Sem par no Precifica', 'neutro'];
  if (e.estado === 'indisponivel') return ['Indisponível', 'neutro'];
  if (e.divergencias === null) return ['—', 'neutro'];
  return e.divergencias === 0 ? ['Conciliada', 'ok'] : [`${e.divergencias} ${e.divergencias === 1 ? 'dia divergente' : 'dias divergentes'}`, 'aviso'];
}

function Empresa({ e }: { e: ConcEmpresa }) {
  const [todos, setTodos] = useState(false);
  const [rot, cls] = estadoEmpresa(e);
  const dias = (e.dias ?? []).filter((d) => todos || d.divergente);
  const nome = e.nome ?? e.empresa_precifica ?? e.conta;
  return (
    <li className={`gv2-conc-emp gv2-integ--${cls}`} data-gv2-conc-empresa={e.conta}>
      <div className="gv2-conc-emp-cab">
        <span className="gv2-integ-nome">{nome}</span>
        <span className={`gv2-pilula gv2-pilula--${cls}`}>{rot}</span>
        {e.empresa_precifica && e.empresa_precifica !== nome && <span className="gv2-fraco">Precifica: {e.empresa_precifica}</span>}
        {e.dias && e.dias.length > 0 && (
          <button type="button" className="gv2-link gv2-dir" aria-pressed={todos} onClick={() => setTodos((v) => !v)}>
            {todos ? 'Só os dias divergentes' : `Todos os dias (${e.dias.length})`}
          </button>
        )}
      </div>
      {e.motivo && <span className="gv2-integ-passo">{e.motivo}</span>}
      {e.dias !== null && (dias.length === 0 ? (
        <span className="gv2-fraco">{e.dias.length === 0 ? 'Nenhum recebimento nos dois lados na janela.' : 'Todos os dias batem (diferença até a tolerância).'}</span>
      ) : (
        <div className="gv2-conc-rolar">
          <table className="gv2-conc-tab">
            <caption className="gv2-sr">Conciliação por dia · {nome}</caption>
            <thead><tr><th scope="col">Dia</th><th scope="col">Asaas</th><th scope="col">Precifica</th><th scope="col">Diferença</th><th scope="col">Motivo provável</th></tr></thead>
            <tbody>
              {dias.map((d) => (
                <tr key={d.dia} className={d.divergente ? 'gv2-conc-div' : undefined}>
                  <td>{fmtDiaMes(d.dia)}</td>
                  <td className="gv2-conc-num" title={d.asaas_liquido !== null ? `Líquido ${fmtMoeda2(dinheiro(d.asaas_liquido))}` : undefined}>{fmtMoeda2(dinheiro(d.asaas))}</td>
                  <td className="gv2-conc-num">{fmtMoeda2(dinheiro(d.precifica))}</td>
                  <td className="gv2-conc-num">{fmtDif(d.diferenca)}</td>
                  <td className="gv2-conc-motivo">{d.motivo ?? (d.divergente ? '—' : 'Bate')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </li>
  );
}

export function Conciliacao() {
  const b = useBloco((s) => lerConciliacao(s), []);
  const naoMostra = b.erro instanceof ErroV2 && (b.erro.http === 404 || b.erro.semAcesso) && !b.dados;
  if (naoMostra) return null;                                 // sem a flag ou sem financeiro_asaas_leitura: o bloco não existe para a pessoa
  if (b.carregando && !b.dados) return <div className="gv2-integ gv2-integ--osso" aria-busy><span className="gv2-osso" style={{ width: '30%' }} /><span className="gv2-osso" style={{ width: '55%' }} /></div>;
  const d = b.dados;
  const empresas = d?.empresas ?? null;
  return (
    <section className="gv2-sec gv2-conc" data-gv2-conciliacao aria-labelledby="gv2-conc-titulo">
      <div className="gv2-sec-cab">
        <h2 className="gv2-h2" id="gv2-conc-titulo"><Scale size={18} aria-hidden /> Conciliação Asaas × Precifica</h2>
        <span className="gv2-fraco gv2-dir">
          {d ? `${fmtDiaMes(d.janela.de)} a ${fmtDiaMes(d.janela.ate)} · ${d.divergencias === null || d.divergencias === undefined ? '—' : d.divergencias === 0 ? 'nenhum dia divergente' : `${d.divergencias} ${d.divergencias === 1 ? 'dia divergente' : 'dias divergentes'}`}${d.precifica_em ? ` · leitura do Precifica ${fmtQuando(d.precifica_em)}` : ''}` : '—'}
        </span>
      </div>
      {b.erro && (d
        ? <Problema motivo="A atualização da conciliação falhou; mostrando a última leitura." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />
        : <Problema motivo="Não foi possível ler a conciliação agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />)}
      {d && d.estado === 'indisponivel' && (
        <p className="gv2-fraco">— · {MOTIVO_GERAL[d.motivo ?? ''] ?? 'Conciliação indisponível agora.'} Nada é assumido como conciliado.</p>
      )}
      {d && d.estado === 'ok' && empresas !== null && (empresas.length === 0
        ? <p className="gv2-fraco">Nenhuma conta do Asaas informada pelo serviço.</p>
        : <ul className="gv2-integ-lista">{empresas.map((e) => <Empresa key={e.conta} e={e} />)}</ul>)}
      {d && <p className="gv2-fraco">Diverge quando a diferença do dia passa de R$ {d.tolerancia.replace('.', ',')}. Asaas = recebido bruto pela data de pagamento; Precifica = baixas do dia. O motivo é provável, não confirmado.</p>}
    </section>
  );
}
