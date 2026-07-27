// shell/types.ts — contratos entre o app-shell e o painel React.
// @version 1.0.0  @created 2026-07-20

/** Config que o PanelLifecycleController entrega no mount(contentEl, config). */
export interface ShellConfig {
  /** Sempre "primary" no container-main. */
  containerId?: string;
  /** AbortSignal da navegacao — abortado se o usuario sair antes de terminar. */
  signal?: AbortSignal;
  title?: string;
  icon?: string;
  layout?: string;
  dockRegion?: string;
  dockSlot?: string;
  /** Injetado pelo adaptador: decisao ja resolvida da feature flag. */
  flag?: FlagDecision;
}

/** Resposta de GET /api/feature-flags/?action=check&flag=<key>. */
export interface FlagDecision {
  key: string;
  enabled: boolean;
  /** Origem da decisao: global|user_override|rollout|disabled|not_found|expired|... */
  source: string;
  environment: string | null;
  rollout_percentage: number | null;
  payload: FlagPayload;
  starts_at: string | null;
  ends_at: string | null;
}

/** Payload da flag do piloto — controla o estagio da migracao sem criar flag nova. */
export interface FlagPayload {
  /** off | pilot | full */
  mode?: 'off' | 'pilot' | 'full';
  /** Rotas que a versao React atende; o resto cai no legado. */
  react_routes?: string[];
  /** Mostra a acao discreta de alternar entre legado e React. */
  allow_legacy_switch?: boolean;
}

export type Theme = 'light' | 'dark';

/** Envelope padrao de TODA resposta do backend do DShowDash. */
export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error: string | null;
  meta?: Record<string, unknown> & { message?: string; timestamp?: string };
}
