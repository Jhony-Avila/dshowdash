// shell/useLookups.ts — catálogos auxiliares (ambientes, servidores, apps).
// @version 1.0.0  @created 2026-07-20
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';

export interface Ambiente { id: number; env_key: string; label: string; color: string | null }
export interface Lookups {
  environments: Ambiente[];
  servers: { id: number; name: string; identifier: string; status: string }[];
  applications: { id: number; app_key: string; label: string }[];
  sensitivity_kinds: { k: string; n: number }[];
}

export function useLookups() {
  return useQuery({
    queryKey: chaves.lookups,
    queryFn: ({ signal }) => apiGet<Lookups>('/lookups', undefined, signal),
    staleTime: 5 * 60 * 1000,   // muda pouco; evita refetch a cada abertura de form
  });
}
