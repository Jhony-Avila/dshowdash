// shell/ErrorBoundary.tsx — isolamento de erro em dois niveis.
// @version 1.1.0  @created 2026-07-20
//
// REQUISITO DO DONO: "erros no novo modulo nao poderao quebrar o app-shell" e
// "um erro em um grafico nao podera derrubar toda a tela".
//
// Dois niveis:
//   <ErrorBoundary variant="module">  -> envolve o CONTEUDO da rota (o <main>),
//                                        NAO o header/navegacao (v1.1.0) — assim
//                                        um erro de rota nunca prende a navegacao.
//   <ErrorBoundary variant="widget">  -> envolve cada card/grafico
//
// React so captura erro de RENDER. Erro em handler assincrono nao passa por
// aqui — por isso o TanStack Query trata falha de request separadamente.
//
// v1.1.0 — BOTAO FUNCIONAL PARA ERRO DE CHUNK: quando a falha e de carregamento
// de chunk (ex.: "Unable to preload CSS" — asset hasheado apagado por rebuild),
// re-renderizar re-lança o MESMO erro (o React.lazy cacheia a rejeicao e o asset
// nao existe mais). Nesse caso o botao RECARREGA a pagina — acao explicita do
// usuario, que traz o build novo — em vez de um reset que nao recupera. Para
// erros de render comuns (nao-chunk), mantem o reset suave de antes.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ehErroDeChunk } from './lazyComRetry';
import css from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  variant?: 'module' | 'widget';
  /** Rotulo do widget, para a mensagem dizer O QUE falhou. */
  label?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
  tentativas: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, tentativas: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const escopo = this.props.variant === 'widget'
      ? `widget:${this.props.label ?? '?'}`
      : 'module';

    // O shell tem console proprio; prefixo identificavel facilita o diagnostico.
    console.error(`[datatables:${escopo}]`, error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private tentarNovamente = (): void => {
    this.setState((s) => ({ error: null, tentativas: s.tentativas + 1 }));
  };

  private recarregar = (): void => {
    // Erro de chunk num boundary de modulo: o asset antigo nao existe mais, so um
    // reload (manifest/entry novos) recupera. Preserva o hash -> mantem a aba.
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const ehWidget = this.props.variant === 'widget';
    // Reload so faz sentido no boundary de MODULO e quando o erro e de chunk;
    // um widget que falha nao deve recarregar a pagina inteira.
    const recarregaNoChunk = !ehWidget && ehErroDeChunk(error);

    return (
      <div className={ehWidget ? css.widget : css.module} role="alert">
        <div className={css.icone} aria-hidden="true">{ehWidget ? '⚠' : '✕'}</div>
        <div className={css.corpo}>
          <strong className={css.titulo}>
            {ehWidget
              ? `Não foi possível exibir ${this.props.label ?? 'este item'}`
              : 'O DataTables encontrou um erro'}
          </strong>
          <p className={css.texto}>
            {ehWidget
              ? 'O restante da tela continua funcionando.'
              : 'O restante do Dshow Dash não foi afetado. Você pode tentar novamente ou navegar para outro módulo.'}
          </p>
          {/* Mensagem tecnica visivel: o publico do modulo e a equipe de dev (§4). */}
          <code className={css.detalhe}>{error.message}</code>
          <button
            type="button"
            className={css.botao}
            onClick={recarregaNoChunk ? this.recarregar : this.tentarNovamente}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}
