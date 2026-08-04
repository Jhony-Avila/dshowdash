// services/Backup.ts — EXPORT/IMPORT do estúdio (AS5 · mega 38).
// @version 1.0.0  @created 2026-08-04
//
// Governança/reversibilidade: o usuário leva TUDO que é dele num JSON
// versionado (config atual + presets pessoais + cenas 3D) e traz de volta
// em outro navegador. Import com validação ESTRITA (§636-like): formato e
// versão conferidos, config SANITIZADO pelo catálogo (ID inválido nunca
// entra), presets/cenas filtrados por forma — lixo é DESCARTADO e contado
// nos avisos, nunca aplicado. interpretarBackup é pura (testável em node).
import type { AvatarConfig } from '../domain/types';
import { validarConfig } from './AvatarCatalog';
import { listarPresets, substituirPresets } from './PresetsPessoais';
import type { PresetPessoal } from './PresetsPessoais';
import { listarCenas, sanitizarCena, substituirCenas } from './Cenas3d';
import type { Cena3d } from './Cenas3d';

export const FORMATO_BACKUP = 'dshow-avatar-backup';
export const VERSAO_BACKUP = 1;

export interface BackupAvatar {
  formato: typeof FORMATO_BACKUP;
  versao: number;
  criadoEm: string;
  config: AvatarConfig;
  presets: PresetPessoal[];
  cenas3d: Cena3d[];
}

export interface ResultadoImport {
  ok: boolean;
  erro?: string;
  config?: AvatarConfig;
  presets?: PresetPessoal[];
  cenas?: Cena3d[];
  avisos: string[];
}

/** Snapshot completo do que é do usuário (só dados locais — sem flags). */
export function montarBackup(configAtual: AvatarConfig): BackupAvatar {
  return {
    formato: FORMATO_BACKUP,
    versao: VERSAO_BACKUP,
    criadoEm: new Date().toISOString(),
    config: validarConfig(configAtual),
    presets: listarPresets(),
    cenas3d: listarCenas(),
  };
}

/** Baixa o backup como JSON legível (diff-ável, auditável). */
export function exportarBackup(configAtual: AvatarConfig): void {
  const backup = montarBackup(configAtual);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dshow-avatar-backup-${backup.criadoEm.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** PURA: texto → conteúdo validado (nunca toca storage; quem aplica decide). */
export function interpretarBackup(texto: string): ResultadoImport {
  const avisos: string[] = [];
  let bruto: unknown;
  try { bruto = JSON.parse(texto); } catch { return { ok: false, erro: 'O arquivo não é um JSON válido.', avisos }; }
  if (!bruto || typeof bruto !== 'object') return { ok: false, erro: 'Estrutura inesperada.', avisos };
  const b = bruto as Record<string, unknown>;
  if (b.formato !== FORMATO_BACKUP) return { ok: false, erro: 'Este arquivo não é um backup do Avatar Studio.', avisos };
  if (typeof b.versao !== 'number' || b.versao > VERSAO_BACKUP) {
    return { ok: false, erro: `Versão de backup não suportada (${String(b.versao)}).`, avisos };
  }

  // config: sanitizado pelo catálogo — IDs inválidos caem no padrão, nunca inventados
  const config = b.config && typeof b.config === 'object'
    ? validarConfig(b.config as AvatarConfig)
    : undefined;
  if (!config) avisos.push('Backup sem config — o look atual será mantido.');

  // presets: forma estrita + config de cada um re-sanitizado
  const presetsBrutos = Array.isArray(b.presets) ? b.presets : [];
  const presets = presetsBrutos
    .filter((p): p is PresetPessoal =>
      !!p && typeof p === 'object'
      && typeof (p as PresetPessoal).id === 'string'
      && typeof (p as PresetPessoal).nome === 'string'
      && !!(p as PresetPessoal).config)
    .slice(0, 40)
    .map((p) => ({
      ...p,
      nome: p.nome.slice(0, 48),
      tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string').slice(0, 6) : [],
      favorito: p.favorito === true,
      criadoEm: typeof p.criadoEm === 'string' ? p.criadoEm : new Date(0).toISOString(),
      renderizador: p.renderizador === '3d' ? '3d' as const : '2d' as const,
      config: validarConfig(p.config),
    }));
  if (presets.length < presetsBrutos.length) {
    avisos.push(`${presetsBrutos.length - presets.length} preset(s) malformado(s) descartado(s).`);
  }

  // cenas 3D: sanitização de domínio (campo fora da lista cai no padrão)
  const cenasBrutas = Array.isArray(b.cenas3d) ? b.cenas3d : [];
  const cenas = cenasBrutas.map(sanitizarCena).filter((c): c is Cena3d => c !== null).slice(0, 8);
  if (cenas.length < cenasBrutas.length) {
    avisos.push(`${cenasBrutas.length - cenas.length} cena(s) malformada(s) descartada(s).`);
  }

  return { ok: true, config, presets, cenas, avisos };
}

/** Aplica ao storage o que o import validou (config fica com o chamador —
 *  vira COMANDO com undo no shell). */
export function aplicarBackup(r: ResultadoImport): void {
  if (!r.ok) return;
  if (r.presets) substituirPresets(r.presets);
  if (r.cenas) substituirCenas(r.cenas);
}

// ── mega 97 (§373-lite): CÓDIGO DO LOOK — compartilhar por texto ────
// base64url de {f,v,c}: cola em chat/e-mail e o colega aplica. A leitura
// SANITIZA pelo catálogo (mesma regra do import — ID inventado não entra).

export function codigoDoLook(config: AvatarConfig): string {
  const json = JSON.stringify({ f: 'dshow-look', v: 1, c: validarConfig(config) });
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `DSHOW-${b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function lerCodigoDoLook(texto: string): AvatarConfig | null {
  try {
    const cru = texto.trim().replace(/^DSHOW-/, '').replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(cru)));
    const bruto = JSON.parse(json) as { f?: string; v?: number; c?: AvatarConfig };
    if (bruto.f !== 'dshow-look' || bruto.v !== 1 || !bruto.c) return null;
    return validarConfig(bruto.c); // sanitizado — nunca aplica lixo
  } catch { return null; }
}
