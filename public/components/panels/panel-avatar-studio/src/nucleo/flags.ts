// nucleo/flags.ts — feature flags do painel (AS5 F1, §606.1).
// @version 1.0.0  @created 2026-07-31
//
// Fail-safe por construção: flag desconhecida = DESLIGADA; erro de rede =
// padrões; override local só para desenvolvimento (localStorage). O painel
// não inventa infraestrutura: consome /api/feature-flags se existir
// (INVESTIGAR na F2 a integração com o panel-feature-flags-admin do dash).
const PADROES: Record<string, boolean> = {
  'as5.novo_shell': true,        // F2 — LIGADA no rollout §650 (2026-08-04, veredito visual do Jhony); rollback §651 = voltar p/ false
  'as5.registry_api': false,     // F1 — catálogo servido pelo registry
  'as5.estado_api': false,       // F1 — persistência via §619 (leitura dual)
  'as5.undo_redo': true,         // F1 — pilhas de comando na UI
  'as5.photo_studio': false,     // F6
  'as5.ia_assistiva': false,     // F8
  'as5.palco3d': true,           // mega 7 — LIGADA no rollout §650 (o motor 3D segue opt-in: só carrega no clique do botão)
  'as5.hud3d': false,            // mega 28 — HUD de performance do palco 3D (dev)
  'as5.telemetria_painel': false, // mega 46 — viewer local de telemetria (dev)
  'as5.consultor': true,          // lote 121–130 — consultor de estilo POR REGRAS (client-only; §651 desliga)
  'as5.foto_galeria': true,       // lote 211–220 — galeria de templates de foto (filtro/favoritos/destaque §326); §651 desliga p/ lista simples
  // ── lote 221–230 (decisão #50: LIGADAS no padrão, rollback §651 = false) ──
  'as5.foto_canvas_pro': true,    // megas 221–225 — Photo Studio PRO: 3 regiões §323, canvas §324, snapping §324.2, título-componente §344, emblemas §345
  'as5.showcase_editor': true,    // megas 226–227 — editor de showcase §175 + modo automático §175.1 (palco 3D)
  'as5.timeline_shell': true,     // mega 228 — linha do tempo unificada §220 no shell
  'as5.favoritos_categorias': true, // mega 229 — favoritos rápidos/permanentes/por coleção §229
  'as5.vitrine_pessoal': true,    // mega 230 — Minha Vitrine §1076 + galerias locais §1077 (client-side)
  // ── onda 231–260 (decisão #53; padrão ON conforme #50) ──
  'as5.palco_v2': true,           // lote 231–240 — cenários §160 + horas §162 + propriedades §161 + poder §154 + preview §155 + editores §167–§172
  'as5.progressao_v2': true,      // lote 241–250 — coleções §207–§214 + conquistas §215–§221 + economia §226–§228 + comparação §231
  'as5.criacao_avancada': true,   // lote 251–260 — tipo corporal §102 + postura §118 + presets faciais §105 + idle 2D §119
  // ── onda 261–310 (decisão #55; padrão ON conforme #50) ──
  'as5.palco3d_v2': true,         // lote 261–270 — A5 sem UBC: vida §440–§441, ambiente §449, tone mapping §457–§458, partículas §444–§446, rim §452, enquadrar §454
  'as5.fundacoes_v2': true,       // lote 271–280 — A6: manifest §267, tokens §283–§289, logging §291 v2
  'as5.poderes_familia': true,    // lote 281–290 — poderes por família §153.1–.4 + partículas §156
  'as5.microinteracoes': true,    // lote 291–300 — progressão v3 + microinterações
  // ── onda 311–410 (decisão #57; padrão ON conforme #50) ──
  'as5.foto_fina': true,          // lote 311–320 — nitidez §333, formas §340–341, JPEG §369, marca §372, galeria §326 v2
  'as5.palco_sensorial': true,    // lote 321–330 — som ambiente §161/§178, crossfade §157.4, presença §157.5, luz avançada §164.3
  'as5.palco3d_cine': true,       // lote 331–340 — câmera §176, pós 3D §457/§177, poses v2 §443
  'as5.presets_v2': true,         // lote 341–350 — §197–§205
  'as5.efeitos_v2': true,         // lote 351–360 — categorias §157 + editor §158
  'as5.temporadas': true,         // lote 361–370 — §245/§248/§251/§252 local
  'as5.portabilidade': true,      // lote 371–380 — §254/§255/§309/§310
  'as5.orcamento_perf': true,     // lote 381–390 — §182–§184/§186.1/§274
  'as5.catalogo_v2': true,        // lote 391–400 — §61/§75/§88/§92/§94
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
