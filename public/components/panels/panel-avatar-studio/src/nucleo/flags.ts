// nucleo/flags.ts — feature flags do painel (AS5 F1, §606.1).
// @version 1.0.0  @created 2026-07-31
//
// Fail-safe por construção: flag desconhecida = DESLIGADA; erro de rede =
// padrões; override local só para desenvolvimento (localStorage). O painel
// não inventa infraestrutura: consome /api/feature-flags se existir
// (INVESTIGAR na F2 a integração com o panel-feature-flags-admin do dash).
const PADROES: Record<string, boolean> = {
  'as5.novo_shell': false,       // F2 — corte do shell novo
  'as5.registry_api': false,     // F1 — catálogo servido pelo registry
  'as5.estado_api': false,       // F1 — persistência via §619 (leitura dual)
  'as5.undo_redo': true,         // F1 — pilhas de comando na UI
  'as5.photo_studio': false,     // F6
  'as5.ia_assistiva': false,     // F8
};

const CHAVE_LOCAL = 'dshow.avst.flags.v1';
let _remotas: Record<string, boolean> | null = null;

export async function carregarFlags(): Promise<void> {
  try {
    const r = await fetch('/api/feature-flags', { credentials: 'include', cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json();
      const dados = corpo?.data?.flags ?? corpo?.flags;
      if (dados && typeof dados === 'object') _remotas = dados as Record<string, boolean>;
    }
  } catch { /* sem endpoint → padrões */ }
}

export function flag(nome: keyof typeof PADROES | string): boolean {
  try {
    const local = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '{}') as Record<string, boolean>;
    if (nome in local) return !!local[nome];
  } catch { /* storage inválido */ }
  if (_remotas && nome in _remotas) return !!_remotas[nome];
  return PADROES[nome] ?? false; // desconhecida = desligada (fail-safe)
}
