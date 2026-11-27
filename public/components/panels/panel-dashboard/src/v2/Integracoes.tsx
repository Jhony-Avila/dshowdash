// v2/Integracoes.tsx — "Integrações": o estado de cada conector, numa lista simples (CIMA, 25/11 noite).
// Contrato: ACIMA_ESQUERDA, GET /api/geral/v2/integracoes.php (P22 3ffa6615/62b6e471; nível ≥ 80, só leitura):
//   { gerado_em, integracoes: [{ id, nome, estado: ok|atrasado|com_problema|aguardando|sem_acesso|nao_integrado,
//                                ultima_sincronizacao, erro (1 linha, texto nosso), proximo_passo }] }
// A tela nunca mostra chave/token; só o que o contrato manda. Estados da tela: carregando (osso), sem acesso (403),
// problema com "Tentar novamente", vazio ("nenhuma integração informada") e a lista.
import { Suspense, lazy } from 'react';
import { ArrowLeft, Plug } from 'lucide-react';
import { ErroV2, fmtQuando, lerIntegracoes, lerIntegracoesV2, type Integracao, type IntegracoesV2, type RespostaIntegracoes } from './servico';
// INT-001 (Fase 2): a Central carrega sob demanda; só com o contrato v2 do serviço (senão, a lista de hoje)
const IntegracoesCentral = lazy(() => import('./IntegracoesCentral'));
import { Problema, useBloco } from './comuns';
import { DSWorkspaceTop } from '@shared/des/DSWorkspaceTop';
import { Conciliacao } from './Conciliacao';

const ESTADO: Record<Integracao['estado'], [string, string]> = {
  ok: ['Em dia', 'ok'], atrasado: ['Atrasada', 'aviso'], com_problema: ['Com problema', 'erro'],
  aguardando: ['Aguardando conexão', 'neutro'], sem_acesso: ['Sem acesso', 'neutro'], nao_integrado: ['Não integrada', 'neutro'],
};
const ORDEM: Integracao['estado'][] = ['com_problema', 'atrasado', 'sem_acesso', 'aguardando', 'nao_integrado', 'ok'];

/** pagina = rota própria #/panel-integracoes (26/11, Fase 1): página inteira com o DSWorkspaceTop; sem a trilha nem o título da vista antiga. */
export function Integracoes({ aoVoltar, pagina }: { aoVoltar: () => void; pagina?: boolean }) {
  const b = useBloco<RespostaIntegracoes>((s) => (pagina ? lerIntegracoesV2(s) : lerIntegracoes(s)), [pagina]);
  if (pagina && b.dados && (b.dados as { versao?: number }).versao === 2) return (
    <div className="gv2-lista" data-gv2-integracoes="pagina">
      <Suspense fallback={<p className="gv2-fraco" aria-busy>Abrindo a Central de Integrações…</p>}>
        <IntegracoesCentral dados={b.dados as IntegracoesV2} aoVoltar={aoVoltar} aoAtualizar={b.recarregar} atualizando={b.atualizando} />
      </Suspense>
      <Conciliacao />
    </div>);
  const lista = [...((b.dados?.integracoes ?? []) as Integracao[])].sort((x, y) => ORDEM.indexOf(x.estado) - ORDEM.indexOf(y.estado));
  const semAcesso = b.erro instanceof ErroV2 && b.erro.semAcesso;
  const pendentes = lista.filter((x) => x.estado === 'com_problema' || x.estado === 'atrasado').length;
  return (
    <div className="gv2-lista" data-gv2-integracoes={pagina ? 'pagina' : 'vista'}>
      {pagina && (
        <div className="des-escopo">
          <DSWorkspaceTop titulo="Integrações" icone={<Plug size={18} aria-hidden />} dados={{ 'data-gv2-integ-topo': '1' }}
            trilha={<button type="button" className="gv2-link" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button>}
            controles={<><span className="des-wt__mola" /><span className="gv2-fraco" data-gv2-integ-resumo>{b.dados ? `${lista.length} conectores · ${pendentes ? `${pendentes} pedem atenção` : 'nenhum pede atenção'} · conferido ${fmtQuando(b.dados.gerado_em)}` : b.carregando ? 'Carregando…' : '—'}</span></>} />
        </div>
      )}
      {!pagina && <nav className="gv2-trilha" aria-label="Você está em">
        <button type="button" className="gv2-link" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button>
        <span aria-hidden>›</span><span>Integrações</span>
      </nav>}
      <section className="gv2-sec">
        <div className="gv2-sec-cab" hidden={pagina}>
          <h2 className="gv2-h2"><Plug size={18} aria-hidden /> Integrações</h2>
          <span className="gv2-fraco gv2-dir">
            {b.dados ? `${lista.length} conectores · ${pendentes ? `${pendentes} pedem atenção` : 'nenhum pede atenção'} · conferido ${fmtQuando(b.dados.gerado_em)}` : b.carregando ? 'Carregando…' : '—'}
          </span>
        </div>
        {b.carregando && !b.dados ? (
          <ul className="gv2-integ-lista" aria-busy>{[0, 1, 2, 3].map((k) => <li key={k} className="gv2-integ gv2-integ--osso"><span className="gv2-osso" style={{ width: '22%' }} /><span className="gv2-osso" style={{ width: '40%' }} /></li>)}</ul>
        ) : semAcesso ? (
          <p className="gv2-fraco">Seu nível de acesso não inclui o estado das integrações.</p>
        ) : b.erro && !b.dados ? (
          <Problema motivo="Não foi possível ler o estado das integrações agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} />
        ) : lista.length === 0 ? (
          <p className="gv2-fraco">Nenhuma integração informada pelo serviço — nada é assumido como “em dia”.</p>
        ) : (
          <ul className="gv2-integ-lista">
            {lista.map((x) => { const [rot, cls] = ESTADO[x.estado] ?? ['—', 'neutro'];
              return (
                <li key={x.id} className={`gv2-integ gv2-integ--${cls}`} data-gv2-integracao={x.id}>
                  <span className="gv2-integ-nome">{x.nome}</span>
                  <span className={`gv2-pilula gv2-pilula--${cls}`}>{rot}</span>
                  <span className="gv2-integ-quando gv2-fraco">{x.ultima_sincronizacao ? `Última sincronização ${fmtQuando(x.ultima_sincronizacao)}` : 'Nunca sincronizada'}</span>
                  {x.erro && <span className="gv2-integ-erro" title={x.erro}>{x.erro}</span>}
                  {x.proximo_passo && <span className="gv2-integ-passo"><strong>Próximo passo:</strong> {x.proximo_passo}</span>}
                </li>
              ); })}
          </ul>
        )}
      </section>
      <Conciliacao />
    </div>
  );
}
