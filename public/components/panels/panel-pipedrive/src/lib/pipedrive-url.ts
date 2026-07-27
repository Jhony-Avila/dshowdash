// lib/pipedrive-url.ts — links diretos para o registro no Pipedrive (backlog #22).
// @version 1.0.0  @created 2026-07-22
//
// Monta URLs a partir do company_domain (ex.: "dshow" -> https://dshow.pipedrive.com/...).
// So gera link para tipos com deep-link estavel; retorna null quando nao ha dominio.
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from './api';
import type { PipeStatus } from '../shell/types';

/** Le o company_domain do /status (compartilha o cache da query global do App). */
export function useCompanyDomain(): string | null {
  const { data } = useQuery<PipeStatus>({
    queryKey: chaves.status,
    queryFn: ({ signal }) => apiGet<PipeStatus>('/status', undefined, signal),
    staleTime: 60_000,
  });
  return data?.company_domain ?? null;
}

const PATHS = {
  deal: (id: string | number) => `deal/${id}`,
  person: (id: string | number) => `person/${id}`,
  organization: (id: string | number) => `organization/${id}`,
  lead: (id: string | number) => `leads/inbox/${id}`,
  product: (id: string | number) => `products/details/${id}/overview`,
} as const;
export type PipeKind = keyof typeof PATHS;

export function pipedriveUrl(kind: PipeKind, id: string | number | null | undefined, domain: string | null): string | null {
  if (!domain || id == null || id === '') return null;
  const build = PATHS[kind];
  if (!build) return null;
  return `https://${domain}.pipedrive.com/${build(id)}`;
}
