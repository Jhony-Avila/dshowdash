// App Core: Config Wrapper
// Reexporta de public/config/app.config.js e public/assets/js/core/config-loader
// Versão: 1.0.0-ENTERPRISE
// Migrado para TypeScript: 2026-02-25

export interface AppConfig {
  app?: {
    debug?: boolean;
    environment?: string;
    [key: string]: unknown;
  };
  api?: {
    baseUrl?: string;
    [key: string]: unknown;
  };
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

interface ConfigLoaderInstance {
  [key: string]: unknown;
}

const _getConfigLoaderInstance = (): ConfigLoaderInstance | null => (window.ConfigLoader as ConfigLoaderInstance | undefined) || null;
const getAppConfig = (): AppConfig => (window.APP_CONFIG as AppConfig | undefined) || {};

export function getConfig(key: string | null = null): unknown {
  const config = getAppConfig();
  if (!key) return config;
  return key.split('.').reduce((obj: unknown, k: string) => (obj as Record<string, unknown>)?.[k], config as unknown);
}

export function getConfigLoader(): ConfigLoaderInstance | null {
  return _getConfigLoaderInstance();
}

export function isDebug(): boolean {
  return getConfig('app.debug') === true;
}

export function getEnvironment(): string {
  return (getConfig('app.environment') as string) || 'production';
}

export function getApiBaseUrl(): string {
  return (getConfig('api.baseUrl') as string) || '/api';
}

export function getFeatureFlag(flag: string): boolean {
  return (getConfig(`features.${flag}`) as boolean) || false;
}

export default { getConfig, getConfigLoader, isDebug, getEnvironment, getApiBaseUrl, getFeatureFlag };
