// lib/format.ts — formatacao pt-BR. Portado do painel vanilla (ja validado).
// @version 1.0.0  @created 2026-07-20

export function fmtBytes(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, x = v;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return `${x >= 100 || i === 0 ? Math.round(x) : x.toFixed(1)} ${u[i]}`;
}

export function fmtInt(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString('pt-BR');
}

export function fmtData(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(String(s).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

/** Duração humana curta: 45s, 12min, 3h, 2d. */
export function fmtDuracao(seg: number | null | undefined): string {
  const s = Number(seg) || 0;
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** "há 2 minutos" — para "última verificação". */
export function fmtRelativo(s: string | null | undefined): string {
  if (!s) return 'nunca';
  const d = new Date(String(s).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seg < 45) return 'agora há pouco';
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `há ${Math.floor(seg / 3600)} h`;
  return `há ${Math.floor(seg / 86400)} d`;
}

export function fmtPct(n: number | null | undefined, casas = 1): string {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(casas)}%`;
}
