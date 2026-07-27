// lib/format.ts — helpers de formatação (datas, iniciais, endereços).
// @version 1.0.0  @created 2026-07-21
import type { EmailAddress } from '../shell/types';

/** Data/hora relativa curta em pt-BR (ex.: "há 5 min", "14:32", "ontem", "12 mar"). */
export function dataRelativa(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const agora = new Date();
  const diffMs = agora.getTime() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;

  const mesmoDia = d.toDateString() === agora.toDateString();
  if (mesmoDia) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return 'ontem';

  const mesmoAno = d.getFullYear() === agora.getFullYear();
  return d.toLocaleDateString('pt-BR', mesmoAno
    ? { day: '2-digit', month: 'short' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Data/hora completa em pt-BR. */
export function dataCompleta(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Nome de exibição de um endereço, com fallback para o e-mail. */
export function nomeEndereco(a?: EmailAddress | null): string {
  if (!a) return '—';
  return (a.name && a.name.trim()) || a.address || '—';
}

/** Iniciais (1-2 letras) para avatar. */
export function iniciais(a?: EmailAddress | null): string {
  const base = nomeEndereco(a);
  if (base === '—') return '?';
  const partes = base.replace(/[<>"]/g, '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Cor determinística (HSL) a partir de uma string — para avatares/contas. */
export function corDeterministica(s?: string | null): string {
  const base = s || 'x';
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) % 360;
  return `hsl(${h} 55% 45%)`;
}
