// services/EstadoService.ts — cliente da API DE ESTADO §619 (AS5 F1 Inc.5).
// @version 1.0.0  @created 2026-07-31
//
// Fica atrás da flag as5.estado_api; qualquer falha devolve null e o
// chamador permanece no caminho legado (AvatarService/studio.php) — o
// corte é gradual e reversível por flag, como definido na F0.
import { flag } from '../nucleo/flags';
import type { Envelope, EstadoAvatar } from '../nucleo/contratos';

const URL = '/api/avatar/estado.php';
const URL_SESSAO = '/api/auth/check.php';

let _csrf: string | null = null;
async function csrf(): Promise<string | null> {
  if (_csrf) return _csrf;
  try {
    const r = await fetch(URL_SESSAO, { credentials: 'include', cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json();
      _csrf = corpo?.data?.session?.csrf_token ?? corpo?.session?.csrf_token ?? null;
    }
  } catch { /* POST cai no fallback */ }
  return _csrf;
}

export function estadoApiAtivo(): boolean { return flag('as5.estado_api'); }

export interface CargaEstado {
  perfilId: number;
  estado: EstadoAvatar | null;
  checksum: string | null;
  versoes: Array<{ version_number: number; change_summary: string | null;
    source: string; is_published: number; created_at: string }>;
}

export async function carregarEstado(): Promise<CargaEstado | null> {
  try {
    const r = await fetch(URL, { credentials: 'include', cache: 'no-store' });
    if (!r.ok) return null;
    const corpo = (await r.json()) as Envelope<{
      perfil: { id: number }; estado: EstadoAvatar | null; checksum: string | null;
      versoes: CargaEstado['versoes'];
    }>;
    if (!corpo.success || !corpo.data) return null;
    return {
      perfilId: corpo.data.perfil.id,
      estado: corpo.data.estado,
      checksum: corpo.data.checksum,
      versoes: corpo.data.versoes,
    };
  } catch { return null; }
}

async function post(corpo: Record<string, unknown>): Promise<Envelope<Record<string, unknown>> | null> {
  try {
    const cab: Record<string, string> = { 'Content-Type': 'application/json' };
    const t = await csrf();
    if (t) cab['X-CSRF-Token'] = t;
    const r = await fetch(URL, { method: 'POST', credentials: 'include', headers: cab, body: JSON.stringify(corpo) });
    return (await r.json()) as Envelope<Record<string, unknown>>;
  } catch { return null; }
}

/** upsert do draft; 'conflito' = outra aba mexeu (§619.1). */
export async function salvarDraft(estado: EstadoAvatar, checksumBase: string | null):
  Promise<{ ok: boolean; checksum?: string; conflito?: boolean }> {
  const r = await post({ draft: estado, checksum_base: checksumBase ?? '' });
  if (!r) return { ok: false };
  if (!r.success) return { ok: false, conflito: r.errors?.[0]?.code === 'CONFLITO' };
  return { ok: true, checksum: String(r.data?.checksum ?? '') };
}

export async function salvarVersao(resumo?: string, publicar = false):
  Promise<{ ok: boolean; versao?: number; reaproveitada?: boolean }> {
  const r = await post({ salvar: { resumo, publicar } });
  if (!r?.success) return { ok: false };
  return { ok: true, versao: Number(r.data?.versao), reaproveitada: !!r.data?.reaproveitada };
}

export async function restaurarVersao(versao: number): Promise<{ ok: boolean; versao?: number }> {
  const r = await post({ restaurar: { versao } });
  if (!r?.success) return { ok: false };
  return { ok: true, versao: Number(r.data?.versao) };
}
