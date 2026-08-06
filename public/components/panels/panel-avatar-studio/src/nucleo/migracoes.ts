// nucleo/migracoes.ts — MIGRAÇÕES de storage client (megas 587–589 ·
// §299–§300, lote 581–590, flag as5.infra_v3).
// @version 1.0.0  @created 2026-08-06
//
// §299: toda chave de storage é VERSIONADA e vive no namespace avst5.
// §300: sistema de migração — regras invioláveis do projeto aplicadas ao
// client: a chave ANTIGA nunca é apagada (ela É o backup; espelho da
// regra /backup do servidor), a migração é IDEMPOTENTE (nova chave já
// existente = no-op) e falha de storage nunca propaga. Leitores fazem
// leitura DUAL (nova → antiga) para nunca quebrar estado antigo.
//
// §300 "asset removido → substituir automaticamente": registrado que a
// substituição automática NÃO liga hoje — nenhum asset foi removido do
// catálogo e trocar render de avatar salvo violaria a byte-stability; o
// validarConfig já degrada com segurança (camada desconhecida é omitida,
// base desconhecida cai no padrão). O mapa de sucessores nasce aqui
// quando o primeiro asset for de fato removido.
import { flag } from './flags';

export interface MigracaoStorage {
  id: string;
  de: string;
  para: string;
  area: 'local' | 'session';
}

/** Registro §300 — ordem importa; cada entrada documenta o porquê. */
export const MIGRACOES: MigracaoStorage[] = [
  // §299: id de aba sem versão → .v1 (única chave não versionada do painel)
  { id: 'aba-v1', de: 'dshow.avst5.aba', para: 'dshow.avst5.aba.v1', area: 'session' },
  // §299: preferência de som da era AS3 → namespace avst5 (o modo clássico
  // segue lendo a antiga — por isso ela permanece e o Som escreve nas duas)
  { id: 'som-ns', de: 'dshow.avatar.som.v1', para: 'dshow.avst5.som.v1', area: 'local' },
];

function armazem(area: 'local' | 'session'): Storage | null {
  try { return area === 'local' ? localStorage : sessionStorage; } catch { return null; }
}

/** Roda as migrações pendentes; devolve os ids aplicados AGORA. */
export function rodarMigracoes(): string[] {
  if (!flag('as5.infra_v3')) return []; // §651: flag off = nada acontece
  const aplicadas: string[] = [];
  for (const m of MIGRACOES) {
    try {
      const st = armazem(m.area);
      if (!st) continue;
      if (st.getItem(m.para) !== null) continue;       // idempotente
      const antigo = st.getItem(m.de);
      if (antigo === null) continue;                    // nada a migrar
      st.setItem(m.para, antigo);                       // antiga PERMANECE (backup)
      aplicadas.push(m.id);
    } catch { /* melhor esforço — nunca propaga */ }
  }
  return aplicadas;
}

/** Leitura DUAL §300 (nova → antiga) p/ os leitores migrados. */
export function lerMigrado(m: Pick<MigracaoStorage, 'de' | 'para' | 'area'>): string | null {
  try {
    const st = armazem(m.area);
    if (!st) return null;
    return st.getItem(m.para) ?? st.getItem(m.de);
  } catch { return null; }
}
