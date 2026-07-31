// screens/Estados.tsx — estados de interface reutilizáveis (§72).
// @version 1.0.0  @created 2026-07-29
//
// Loading não bloqueia a página: skeleton local, agenda preservada.
// Erro mostra mensagem amigável + retry + detalhe recolhível + horário.
import { useState, type ReactNode } from 'react';
import { ApiError } from '../lib/api';

export function SkeletonBloco({ linhas = 5, altura = 18 }: { linhas?: number; altura?: number }) {
  return (
    <div className="gc-skel" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="gc-skel-linha" style={{ height: altura, width: `${100 - (i % 4) * 7}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCards({ n = 4 }: { n?: number }) {
  return (
    <div className="gc-kpis" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <div key={i} className="gc-kpi gc-skel-card" />)}
    </div>
  );
}

export function EstadoErro({ erro, onRetry }: { erro: unknown; onRetry?: () => void }) {
  const [aberto, setAberto] = useState(false);
  const api = erro instanceof ApiError ? erro : null;
  const indisponivel = api?.ehIndisponivel ?? false;
  const pendencias = (api?.meta?.pendencias as string[] | undefined) ?? [];
  const quando = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .format(new Date());

  return (
    <div className={`gc-estado gc-estado-erro${indisponivel ? ' is-pendente' : ''}`} role="alert">
      <strong className="gc-estado-titulo">
        {indisponivel ? 'Integração ainda não provisionada' : 'Não foi possível carregar'}
      </strong>
      <p className="gc-estado-msg">
        {api?.message ?? 'Ocorreu um erro inesperado.'}
      </p>
      {pendencias.length > 0 && (
        <ul className="gc-estado-pend">
          {pendencias.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      <div className="gc-estado-acoes">
        {onRetry && (
          <button type="button" className="gc-btn gc-btn-primario" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
        <button type="button" className="gc-btn gc-btn-fantasma" onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}>
          {aberto ? 'Ocultar detalhes' : 'Detalhes'}
        </button>
      </div>
      {aberto && (
        <dl className="gc-estado-detalhe">
          <dt>Código</dt><dd>{api?.code ?? 'DESCONHECIDO'}</dd>
          <dt>HTTP</dt><dd>{api?.status ?? '—'}</dd>
          <dt>Horário</dt><dd>{quando}</dd>
        </dl>
      )}
    </div>
  );
}

export function EstadoVazio({ titulo, mensagem, acao }: {
  titulo: string; mensagem: string; acao?: ReactNode;
}) {
  return (
    <div className="gc-estado gc-estado-vazio">
      <strong className="gc-estado-titulo">{titulo}</strong>
      <p className="gc-estado-msg">{mensagem}</p>
      {acao && <div className="gc-estado-acoes">{acao}</div>}
    </div>
  );
}

/**
 * Faixa de ambiente de demonstração (§72).
 *
 * Fica sempre visível enquanto o provedor for mock. Sem ela, uma agenda
 * plausível vira decisão real — alguém confia num horário que não existe.
 */
export function FaixaMock({ mensagem }: { mensagem?: string }) {
  return (
    <div className="gc-faixa-mock" role="status">
      <span className="gc-faixa-ponto" aria-hidden="true" />
      {mensagem ?? 'Ambiente de demonstração — os compromissos exibidos são simulados.'}
    </div>
  );
}
