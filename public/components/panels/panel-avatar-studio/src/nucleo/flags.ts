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
  // ── onda 411–510 (decisão #59; padrão ON conforme #50) ──
  'as5.i18n': true,               // lote 411–420 — §296 fundação PT/EN
  'as5.busca_v2': true,           // lote 421–430 — §57.1–.3/§58
  'as5.cards_v2': true,           // lote 431–440 — §60.9–.10/§66
  'as5.editor_efeitos': true,     // lote 441–450 — §158/§158.1
  'as5.pos3d_real': true,         // lote 451–460 — §457/§177 composer
  'as5.analytics_local': true,    // lote 461–470 — §292–§294 local
  'as5.luz_contextual': true,     // lote 471–480 — §164.2/§165
  'as5.memorias_v2': true,        // lote 481–490 — §203/§244/§247
  'as5.a11y_v2': true,            // lote 491–500 — §297 setas/live
  // ── onda 511–610 (decisão #61; padrão ON conforme #50) ──
  // (i18n de cobertura usa a as5.i18n existente — decisão #62)
  'as5.foto_entrada': true,       // lote 531–540 — §321.1–.2 avatar/preset → foto
  'as5.foto_pro2': true,          // lote 541–550 — §335–§348/§359–§371 restos
  'as5.roupas_camada': true,      // lote 551–560 — §72–§74
  'as5.criacao_fina': true,       // lote 561–570 — §102.2/§340–341/§68
  'as5.palco_v3': true,           // lote 571–580 — §176.1/§178.2/§157 restos
  'as5.infra_v3': true,           // lote 581–590 — §268/§277/§299–300
  'as5.ux_final': true,           // lote 591–600 — §59.1/§60/§64.2/§545+
  // ── onda 611–710 (decisão #64; padrão ON conforme #50) ──
  'as5.assembler3d': true,        // lote 621–630 — Character Assembler §406 + partes §423
  'as5.roupas3d': true,           // lote 631–640 — roupas §415–§417 (body masking §415.2)
  'as5.materiais3d': true,        // lote 641–650 — Material Manager §419 + canais §73→3D (§420–§421)
  'as5.cabelo3d': true,           // lote 651–660 — barba como slot próprio §425 + combinações cabelo+barba + famílias §423
  'as5.morfos3d': true,           // lote 651–660 — morfos estruturais §412–§414 via escala (tipo §102 + fino §102.2 no 3D)
  'as5.animacao3d': true,         // lote 661–670 — animation manager §432 + máquina §433 + pacote UAL §436 + olhar §439
  'as5.classico_aaa': true,       // lote 671–680 — layout AAA do Modo Clássico (briefing complementar; decisão #68); off = layout anterior byte a byte
  'as5.progressivo3d': true,      // lote 681–690 — LOD por tela §462 + lod2-primeiro §470 + IndexedDB §475 + loading manager §472
  'as5.quality3d_v2': true,       // lote 691–700 — perfis ultra/cine §482.1 + DPR dinâmico §483
  'as5.captura3d_v2': true,       // lote 691–700 — captura §506/§329: LOD alto + supersampling + formatos + indicador §329.3
  // ── onda 721+ (decisão #72; padrão ON conforme #50) ──
  'as5.foto3d': true,             // lote 721–730 — Foto×3D §329: captura com o ESTADO do usuário (cores §420 + corpo §414 + pose Idle UAL) + super 2× + fases §329.3
  'as5.ual_extra': true,          // lote 731–740 — multi-pacote §432: ual_extra (emotes UAL2: Yes/FoldArms/TalkingPhone/Carry/ChestOpen) soma ao básico
  // ── programa AS6 (decisões #74–#76; numeração § do AVATAR_STUDIO_6.md) ──
  'as6.estado_vnext': true,       // lote 751–760 — L0: migrações de schema (§3393) + capability registry (§3396) + dependências de flags (§3398); off = flag() plano como antes
  'as6.viewport': true,           // lote 781–790 — L2: presets manuais de câmera 2D §52/§84 (Auto/Rosto/Busto/Corpo persistidos); off = só o enquadramento automático R2, byte a byte
  'as6.dock': true,               // lote 791–800 — L2: estados de card v2 §644/§111 (selo EQUIPADO ≠ foco ≠ prévia, hover elevado por token); off = cards anteriores byte a byte
  'as6.color_studio': true,       // lote 811–820 — L3: Color Studio §206–§212 (HSL por slot + harmonias derivadas); off = swatches anteriores byte a byte
};

/**
 * DEPENDÊNCIAS entre flags (AS6 §3398): filho só é efetivo com TODOS os
 * pais ligados. Formaliza o que o código já fazia por construção (ex.:
 * as5.ual_extra só é consultada dentro do fluxo do palco 3D) e torna o
 * rollback §651 transitivo: desligar `as5.palco3d` desliga a árvore 3D
 * inteira de uma vez, sem estados órfãos. Grafo acíclico por revisão —
 * cadeias curtas (≤2 níveis), sem ciclos.
 */
export const DEPENDENCIAS_FLAGS: Record<string, string[]> = {
  // Consultadas SOMENTE em shell/Palco3d.tsx → filhas do palco. As flags
  // de motor com DUPLA entrada (palco E Foto §329: as5.materiais3d,
  // as5.morfos3d, as5.animacao3d, as5.foto3d) NÃO têm pai — o fluxo 3D
  // da Foto funciona com o palco desligado (provado pelo foto329.mjs).
  'as5.assembler3d': ['as5.palco3d'],
  'as5.roupas3d': ['as5.assembler3d'],   // partes exigem o assembler §406
  'as5.cabelo3d': ['as5.assembler3d'],
  'as5.ual_extra': ['as5.animacao3d', 'as5.palco3d'], // extra soma ao pacote §432 e só existe no palco
  'as5.progressivo3d': ['as5.palco3d'],
  'as5.quality3d_v2': ['as5.palco3d'],
  'as5.captura3d_v2': ['as5.palco3d'],
  'as5.hud3d': ['as5.palco3d'],
  'as5.palco3d_v2': ['as5.palco3d'],
  'as5.palco3d_cine': ['as5.palco3d'],
  'as5.pos3d_real': ['as5.palco3d'],
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

/** Valor "cru" da flag (local → remoto → padrão), sem dependências. */
function flagCrua(nome: string): boolean {
  try {
    const local = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '{}') as Record<string, boolean>;
    if (nome in local) return !!local[nome];
  } catch { /* storage inválido */ }
  if (_remotas && nome in _remotas) return !!_remotas[nome];
  return PADROES[nome] ?? false; // desconhecida = desligada (fail-safe)
}

export function flag(nome: keyof typeof PADROES | string): boolean {
  const cru = flagCrua(nome);
  // AS6 §3398 (as6.estado_vnext): filho desliga junto com o pai — rollback
  // §651 transitivo. Guarda de recursão: a própria as6.estado_vnext e
  // flags sem dependência resolvem direto. Com a flag OFF, comportamento
  // idêntico ao anterior (byte a byte).
  if (!cru || nome === 'as6.estado_vnext') return cru;
  const pais = DEPENDENCIAS_FLAGS[nome];
  if (!pais || !flagCrua('as6.estado_vnext')) return cru;
  return pais.every((p) => flag(p));
}
