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
  'as6.dock_classico': true,      // lote 831–840 — Asset Dock v3 do clássico §103–§105 (wheel→horizontal, drag, setas, cards visuais); off = trilho anterior byte a byte
  'as6.paineis_dock': true,       // lote 841–850 — abas de PAINEL (arquétipo/título/presets/coleções/conquistas/vitrine/IA/histórico/foto) abaixo do preview (pedido visual do Jhony 2026-08-08); off = lateral anterior byte a byte
  // ── MEGA ONDA VISUAL 851+ (decisão #88; ordem do Jhony: máximo de UI/UX, validação no final) ──
  'as6.paineis_cards': true,      // lote 851–860 — painéis do inferior em GRADES de cards (game UI): presets/arquétipos/títulos/coleções lado a lado; off = listas verticais
  'as6.sidebar_pro': true,        // lote 861–870 — sidebar do clássico com modo SÓ-ÍCONES persistido + tooltips + ativo mais claro; off = sidebar anterior
  'as6.visual_v2': true,          // lote 871–880 — elevação visual: palco sem cartão (§29/§43), profundidade no workspace, transição suave de aba; off = visual anterior
  'as6.workspace_fixo': true,     // lote 881–890 — workspace TRAVADO na viewport (zero scroll de página; nav e inferior com scroll próprio) + chips de filtro compactos no trilho; off = fluxo anterior
  'as6.meta_assets': true,        // lote 891–900 — METADADOS de asset §150–§153/§227: autor/origem/licença/versão + tags pesquisáveis (operador tag: e chips no drawer); off = ficha anterior byte a byte
  // ── MEGA ONDA 911–1110 (decisão #92) ──
  'as6.inspector': true,          // lote 921–930 — Inspector contextual §181–§189: accordion schema-driven por categoria (identidade/props/cores/compat/ações) com memória §186; off = seção Cores+Propriedades anterior byte a byte
  'as6.creator_v6': true,         // lote 931–940 — vestuário multi-peça §3393: categoria Sobrepeça (wrappers sob_* de renderCorpo existente; schema v2 com migração real); off = categoria oculta (config salvo segue aceito e renderizando)
  'as6.dock_mag': true,           // lote 941–950 — dock §104–§105: magnificação gaussiana no hover (CSS scale), momentum com atrito no drag e snap no card; off = interações do lote 831–840 byte a byte
  'as6.contexto': true,           // lote 951–960 — Workspace Context Engine §323–§325: trocar categoria coordena aba/busca/grupo do inspector/anúncio num evento só; off = troca de categoria anterior byte a byte
  'as6.diff_v6': true,            // lote 961–970 — diff campo a campo §350/§322: "Detalhes" na barra de salvamento com de→para legível + histórico local de salvamentos (ring ≤10); off = barra anterior byte a byte
  'as6.foto_projeto': true,       // lote 971–980 — Photo Project v2 §1417/§1226/§1227: schema versionado + snapshot do avatar-fonte + "atualizar p/ avatar atual"; off = projetos v1 byte a byte (antigos abrem sempre §1418)
  'as6.foto_camadas': true,       // lote 981–990 — Layer System da foto fase 1 §1215/§1217/§1219: ordem da pilha de fundo + lock + solo no painel de camadas; off = painel do lote 161-164 byte a byte
  'as6.virtual': true,          // lote 1011–1020 — virtualização REAL §276 v2: janela deslizante (card longe recicla p/ esqueleto; foco/hover/equipado nunca reciclam); off = promoção one-way anterior byte a byte
  'as6.quality': true,          // lote 1021–1030 — Quality Manager central (AS6 Parte 9): perfil Auto/Eco/Equilibrado/Alto consultado por 3D (dica de tier), shell ([data-qualidade] → CSS eco) e partículas; off = decisões locais anteriores byte a byte
  'as6.touch': true,            // lote 1031–1040 — touch+dnd (AS6 Parte 6): arrastar card ao palco equipa (HTML5 DnD, realce de alvo) + touch-action na dock; off = sem draggable/drop byte a byte
  'as6.derivados': true,        // lote 1051–1060 — derivados com reflow (AS6 Parte 11): posições manuais refluem p/ a célula de texto dos formatos wide com clamp (via opcoes.reflowPos) + painel de derivados ao vivo na Foto; off = wide anterior byte a byte
  'as6.cms_ro': true,           // lote 1061–1070 — CMS read-only (AS6 Parte 15): drawer admin que LISTA assets/licenças/auditoria via cms.php (GET + AdminGate fail-closed; zero escrita); off = sem comando/drawer
  'as6.vida_shell': true,       // lote 1071–1080 — VIDA no shell novo (regressão da auditoria FASE 0): respiração/piscada/balanço no viewport (receita do PalcoCinema); §297 respeitado; off = viewport estático anterior
  'as6.workers': true,          // lote 1091–1100 — worker pool (AS6 Parte 9): thumbs/miniaturas re-encodadas fora da main thread com TIMEOUT e fallback síncrono sempre; off = caminho síncrono anterior byte a byte
  'as6.dock_inferior': true,    // onda 1111 (pedido visual do Jhony 2026-08-09 — decisão #112): shell novo com a MESMA estrutura do clássico AAA — nav esquerda, preview central dominante com fit-to-view, biblioteca em DOCK HORIZONTAL inferior (reuso do DockAssets/trilho); off = coluna direita anterior byte a byte
  // ── onda 1121–1220 (decisão #113; padrão ON conforme #50) ──
  'as6.tour_v6': true,          // lote 1121–1130 — tour §568 v2 apresenta o layout do #112 (dock/alturas/Cenário/câmera); off = roteiro anterior byte a byte
  'as6.motion_v2': true,        // lote 1131–1140 — aceites §568 da Parte 7: altura da dock ANIMADA, troca de categoria com fade curto, animações CSS pausadas com a aba oculta; reduced-motion desliga tudo; off = cortes secos anteriores
  'as6.light_v6': true,         // lote 1141–1150 — Light Mode REAL §578 (direção própria, não dark invertido): rampa fria de estúdio sem branco puro, profundidade por luminosidade §577, sombras leves; off = claro do #112 byte a byte
  'as6.nav_dock': true,         // lote 1151–1160 — dock 100% operável por teclado (AS6 Parte 6): B foca a biblioteca, D cicla a altura, PageUp/Down paginam o trilho, foco navegado rola suave; off = navegação anterior
  'as6.workers_v2': true,       // lote 1161–1170 — workers fase 2 (AS6 Parte 9): ENCODE de export de foto (PNG/JPEG grandes) fora da main thread via ImageBitmap transferido; timeout+fallback síncrono sempre; off = toDataURL de sempre
  'as6.perf_baseline': true,    // lote 1171–1180 — baseline de RUNTIME local (AS6 Parte 9): marks/measures das interações-chave (troca de categoria, equipar) fechadas pós-paint + long tasks; window.__avstPerf p/ suíte/dev; off = zero marks
  'as6.cms_ro2': true,          // lote 1181–1190 — CMS RO fase 2 (AS6 Parte 15): busca sanitizada + filtro de categoria + ficha de detalhe + export CSV client-side no drawer; segue GET-only/AdminGate; off = drawer do #108
  'as6.ia_apply': true,         // lote 1191–1200 — IA apply PARCIAL (AS6 Parte 12): a sugestão vira lista de mudanças campo a campo com checkbox; aplica só o selecionado (merge determinístico + validarConfig + §636); off = botão "aplicar tudo" anterior
  'as6.contextos_v6': true,     // lote 1201–1210 — Universal Avatar Component fase 1 (AS6 Parte 13): montarAvatarUniversal (espelho §619 + live update + placeholder) exposto em window.AvatarStudioUniversal; drawer de contextos consome o MESMO caminho; off = mocks anteriores
  // ── onda 1221–1270 (decisão #124; padrão ON conforme #50) ──
  'as6.mobile_v6': true,        // lote 1241–1250 — telas estreitas: SWIPE vertical no topo da dock cicla altura/recolhe, alça visual, tooltips na nav estreita; off = interações anteriores byte a byte
  'as6.layouts': true,          // lote 1251–1260 — layouts nomeados do workspace (AS6 Parte 1): 3 slots A/B/C na paleta salvam/aplicam a geometria (nav, painel/dock, recolhido); off = sem comandos
  // ── onda 1291+ (decisões #133–#134; padrão ON conforme #50) ──
  'as6.dock_fit': true,         // onda 1291 — dimensionamento CAUSAL do workspace (briefing UX do Jhony 2026-08-10): altura real disponível medida (nunca 100vh−150px fixo), dock com altura relativa ao corpo (cqh) e cards que PREENCHEM a faixa (nunca cortados), divisor redimensionável com teclado + persistência v2 validada; off = geometria do #112 byte a byte
  'as6.ctx_barra': true,        // onda 1291 — a dica de contexto §323–§325 sai da pill de anúncio (fundo escuro fixo) e vira BARRA contextual legível por tokens, com título/texto orientado à ação e dispensa persistida; off = anúncio de sempre byte a byte
  'as6.corpo_preview': true,    // onda 1294 (pedido visual do Jhony 2026-08-10) — nas categorias Roupa/Sobrepeça (e no preset manual "Corpo") o PREVIEW e as THUMBS dos cards usam o render de CORPO INTEIRO 240×400 do motor (goldens g09/g16); off = busto de sempre byte a byte
  // ── mega onda 1301+ (briefings do Jhony 2026-08-11; decisões #140+) ──
  'as6.acess_v2': true,         // lote 1301–1310 — ACESSÓRIOS multi-slot: slots finos aditivos (olhos/orelha/costas/flutuante/companheiro) + registry de subcategorias em dados + conflitos declarados; equipar usa o slot fino do registry; off = 3 slots da decisão #41 byte a byte
  'as6.acess_hub': true,        // lote 1311–1330 — categoria-mãe: hub de subcategorias por região (contagens/equipados), breadcrumb, dock filtrada por subcategoria, equipados agrupado + resumo; off = grade única anterior byte a byte
  'as6.nav_grupos': true,       // lote 1331–1340 — navegação em MACROGRUPOS (Personagem/Vestuário/Expressão/Ambiente/Identidade) mapeando conteúdo existente; off = lista plana anterior byte a byte
  'as6.tax_v2': true,
  'as6.tax_cms': false,         // onda 1381 (#148) — hidrata a taxonomia do CMS (api/avatar/taxonomia.php); OFF até o RUNBOOK-BANCO popular avatar_category_groups; off/204 = registry estático byte a byte           // onda 1361+ (#145/#146) — TAXONOMIA v2: várias categorias-mãe (acordeão) + principais na sidebar, subcategorias na dock; "Acessório" deixa de ser botão único (segue como tipo técnico); off = navegação #143/#144 byte a byte
  // ── mega programa 1401+ (POPULAÇÃO + ELEVAÇÃO; decisões #150+; padrão ON conforme #50) ──
  'as6.thumb_item': true,       // onda 1401 — thumbnails MODO ITEM (elevação §12): card de acessório mostra o ASSET isolado (viewBox por bounds MEDIDOS baked em modoItem.ts, fundo neutro, ocupação ~78%); hover/toggle = Modo Aplicado; off = avatar com foco §39.19 byte a byte
  'as6.variantes': true,
  // ── frente AAA — MEGA_BRIEFING_01 (decisão #156: pai da árvore; cada filha nasce na onda que a consome) ──
  'as6.looks': false,           // onda 1408 — LOOKS do registry Looks3d (§1756–§1767, #161): luz do palco vem do registry (estudio@1 byte-idêntico; aliases quente→soft, fria→cool), chips Retrato/Dramática, tone mapping vira dev-only; OFF até validação visual; off = definirLuz legado byte a byte
  'as6.material_v2': false,     // onda 1408 — METADADOS de material do manifest v2 no pipeline (Parte 7, #160/#165a): canal pele das bases UBC por metadado (skin tint passa a valer), naoTingir, famílias declaradas; OFF até before/after aprovado; off = pipeline anterior byte a byte
  'as6.telemetria_assets': true, // onda 1409 — TELEMETRIA DE ASSET 3D (§2804, §2968–§2972): eventos avst:asset_* (carregou/falhou/lod_transicao/fallback/parte) no ring local + EventBus, com rate limit por slug e sem PII; dado/observabilidade (#156: tooling ON); off = zero eventos (callback ausente)
  'as6.classico_premium': false, // onda 1411 — trilho CLASSIC PREMIUM 2D (decisão #159, §2381–§2427): acabamento 'premium' no config liga sombra de contato + hooks das partes `_px_` (renderAtras/renderFrente/renderSombra/renderPlanos) + materiais2d; catálogo passa a listar as partes premium; off = motor clássico e catálogo byte a byte
  'as6.arte_v2': false,          // Golden V3.1 (#219-R1) — ARTE ELEVADA 2D (Golden V2/V3): corpo anatômico + rosto/olhos/nariz reconstruídos + cabelo por clumps + barba c/ fade + roupa autoral + material por dobra + estúdio FG vazio. svgDe só liga o premium quando classico_premium E arte_v2 ON; off = motor CLÁSSICO byte a byte. SEM rollout global até aprovação humana do Gate A (veredito 2026-08-23)
  'as6.hero_2d': false,          // Golden A+2 — HEROES 2D AUTORADOS: itens `_hx_` (engine/partes/heroes.ts) importados de SVG autorado (importarHeroAsset) entram no catálogo SÓ com esta flag (mais restrita que classico_premium); render elevado quando o trilho premium está ON. off = catálogo sem heroes, byte a byte. SEM rollout até veredito humano
  'as6.camera_v2': false,       // onda 1419 — CÂMERA V2 do palco 3D (#204, P8-B): presets Camera3d (FOV 24/28/33, headroom/eye-line), bookmarks Full/Bust/Face/Back, bounds-aware, transição 300ms interromível, guard #165d (nunca reseta) e limites de órbita; off = câmera anterior byte a byte
  'as6.sombras_v2': false,      // onda 1419 — SOMBRAS/AMBIENTE V2 (#205, P8-C): shadow map por tier (512/1024/2048), shadow camera justa no Box3, bias/softness e FOG por look, contact shadow procedural sempre; chão gloss/platform/grid e definirEnvironment(url) são APIs opt-in; off = sombras anteriores byte a byte
  'as6.pos_v2': false,          // onda 1420 — PÓS V2 por look (#206, P8-D §1965–§1977): cadeia Render→Bloom→ColorGrade(proteção de pele)→Vignette declarada em Look.pos, degradação por pass via QualityManager.passesPos, composer recriado em context loss, telemetria p3d_pos_fallback; estudio = pós NEUTRO (contrato); off = composer/CSS antigos byte a byte
  'as6.dev_iluminacao': false,  // onda 1420 — PAINEL DEV de iluminação (#206, §2015): sliders key/fill/rim/bloom sobre o look atual no palco 3D (ajustarLuzDev — nunca persiste, reaplicar o look restaura); dev-only; off = sem UI, render intocado
  'as6.foto_lentes': false,     // onda 1420 — LENTES do Photo 3D (#207, P8-E §2007–§2027): registry LentesFoto (Portrait/Full/Fashion/WideHero/Profile/Close-up, aspectos 4:5 e 9:16, look por lente, regra dos terços), captura alta com shadow↑ + pós só na captura e RESTAURO total, determinística; off = captura 960×960 anterior byte a byte
  'as6.corpo_v2': false,        // onda 1422 — BODY API v2 (#210/#211, P2-B/C/E): corpoV2 {preset, morfos} consumido no 3D (morph targets `corpo_*` quando o asset tiver, senão bone scaling por segmento clampado ao envelope) + perfis de postura 3D; o dado corpoV2 é aceito/persistido SEMPRE (forward-compat); off = escala §412 anterior byte a byte
  'as6.corpo_grounding': false, // onda 1422 — GROUNDING (#211, §P2-E): re-ancora os pés no chão (Box3.min.y → 0) após escala/morfos; off = posição anterior byte a byte
  'as6.ux3d_simples': false,    // onda 1423 — UI 3D SIMPLIFICADA (BRIEFING_CORRETIVO_01 §52–§70, #213): controles técnicos (qualidade, pós, tinta, turntable/ficha, exposição, movimento de câmera, dev) saem do fluxo principal p/ "Avançado"; o palco vira Character Creator (§53); off = UI anterior byte a byte; entra no Candidate Mode
  'as6.thumb_item_v2': false,   // onda 1425 — ASSET CLARITY (BRIEFING_COMPLEMENTAR_02, #217): card = peça ISOLADA em TODA categoria (não só acessório), fundo=environment, camadas do cabelo montadas (back+front), card NÃO troca no hover (só o palco recebe o preview), DetalheAsset com hero isolado + "no seu avatar"; off = thumbs anteriores byte a byte; entra no Candidate Mode
  'as6.cp_foto': false,         // onda 1418 — PHOTO MODE 2D do avatar (#202, P10-G): export em framings (full/bust/portrait/square/vertical) PNG/WebP/transparente com toggles de fundo/moldura/efeito; off = sem UI de export, render intocado
  'as6.acess_2d_premium': false, // onda 1416 — ACESSÓRIOS PREMIUM 2D (#196, P10-E/P6-A/P6-E): contador + "Remover todos" + conflito nomeado (AcessoriosRegistry §617) + aviso de paridade na UI; catálogo ace_px_ já é gated por classico_premium; off = UI anterior byte a byte
  'as6.roupa_premium': false,   // onda 1415 — VESTUÁRIO PREMIUM (#191, P10-D/P5-B/P5-C): categoria roupa_inferior (rin_*) na sidebar, conjuntos premium O01+ e swatch de material na UI; off = seção/outfits ocultos, configs salvos seguem renderizando (dado > UI)
  'as6.face_v2': false,         // onda 1414 — ROSTO V2 (#162, Partes 3/5): categoria nariz na sidebar, expressão semântica + idade + assimetria determinística aplicadas por wrappers SÓ nas artes v2, canais coresFace.sobrancelha/barba/labios na paleta, Face Idle Profiles; off = render/UI byte a byte (dados salvos seguem aceitos)
  'as6.barba_slot': false,      // onda 1414 — categoria BARBA visível (artes brb_*; compat máscara/cachecol em engine/compat-rosto.ts); off = seção oculta, config salvo segue renderizando
  'as6.brow_slot': false,       // onda 1414 — categoria SOBRANCELHA visível (artes sbr_* como overlay sobre o traço cozido); off = seção oculta, config salvo segue renderizando
  'as6.qa_route': false,        // onda 1410 — ROTA DE QA VISUAL (§2707–§2742): QaStudio (chunk lazy) na paleta — LOD forçado, looks, overlays, calibração, screenshot 1-click, inspector técnico (manifest/health/renderer.info); dev, nada persiste; off = sem comando/chunk, render intocado
  'as6.material_debug': false,  // onda 1410 — DEBUG DE MATERIAIS no QaStudio (§1686–§1690): lista materiais do personagem (tipo, roughness/metalness, mapas); off = bloco ausente
  'as6.qa_visual': false,       // onda 1408 — LABORATÓRIO de QA visual (§105, §107–§109, §141–§146): overlays clay/normals/wireframe/silhueta/grayscale + cena de calibração com color checker no palco 3D (dev); off = sem UI, render intocado
  'as6.avatar_visual_v2': false, // onda 1406 — QUALIDADE VISUAL como dado (§68–§69, #157): tag/ficha de qualidade no drawer, filtro "nunca prototype" no Estúdio 3D (PoC) e destaque; OFF até validação visual do Jhony (§2920); off = UI byte a byte (a derivação em dados existe sempre)
  'as6.slots_corpo': true,      // onda 1404 — SLOTS CORPORAIS (elevação §15/§16, decisão #154): pulso_e/d, mao_e/d, cintura, pernas, pes como extensão do #140; arte via renderCorpo (só no corpo inteiro; busto intocado); off = 8 slots do #140 byte a byte (aceitação de leitura segue incondicional p/ forward-compat)        // onda 1401 — VARIANTES DE COR por asset (registry em DADOS; aplicar = coresCamada §73 via comPaleta §74 — NADA novo persiste, §619/PHP intocados): seletor no detalhe + contagem no card; off = sem UI byte a byte
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
  // onda 1408 (frente AAA): tudo que fala com o Renderizador3d é filho do palco
  'as6.looks': ['as5.palco3d'],
  'as6.material_v2': ['as5.palco3d'],
  'as6.qa_visual': ['as5.palco3d'],
  'as6.telemetria_assets': ['as5.palco3d'],
  'as6.qa_route': ['as5.palco3d'],
  'as6.material_debug': ['as6.qa_route'],
  // onda 1419 (#204/#205): câmera/sombras v2 são do palco 3D
  'as6.camera_v2': ['as5.palco3d'],
  'as6.sombras_v2': ['as5.palco3d'],
  // onda 1420 (#206/#207): pós/lentes/dev-luz são do palco 3D
  'as6.pos_v2': ['as5.palco3d'],
  'as6.dev_iluminacao': ['as5.palco3d'],
  'as6.foto_lentes': ['as5.palco3d'],
  // onda 1422 (#210/#211): corpo v2/grounding são do palco 3D
  'as6.corpo_v2': ['as5.palco3d'],
  'as6.corpo_grounding': ['as5.palco3d'],
  // onda 1423 (#213): UX simples é do palco 3D
  'as6.ux3d_simples': ['as5.palco3d'],
  // onda 1414 (#186): slots faciais são filhos do rosto v2 — ligar/desligar
  // a família inteira de uma vez (§2917–§2926)
  'as6.barba_slot': ['as6.face_v2'],
  'as6.brow_slot': ['as6.face_v2'],
  // onda 1415 (#191): vestuário premium refina o trilho Classic Premium
  'as6.roupa_premium': ['as6.classico_premium'],
  'as6.arte_v2': ['as6.classico_premium'], // Golden V3.1 (#219-R1): arte v2 refina o trilho premium
  'as6.hero_2d': ['as6.classico_premium', 'as6.arte_v2'], // Golden A+2: heroes autorados exigem o trilho premium elevado
  'as6.acess_2d_premium': ['as6.classico_premium'], // onda 1416 (#196)
  'as6.cp_foto': ['as6.classico_premium'], // onda 1418 (#202)
  'as6.dock_classico': ['as5.classico_aaa'], // a dock v3 refina o trilho AAA
  'as6.paineis_dock': ['as5.classico_aaa'],  // painéis embaixo estendem o layout AAA
  'as6.paineis_cards': ['as6.paineis_dock'], // grades de cards refinam o inferior
  'as6.sidebar_pro': ['as5.classico_aaa'],   // sidebar compacta/só-ícones do clássico
  'as6.visual_v2': ['as5.classico_aaa'],     // elevação visual global do clássico
  'as6.workspace_fixo': ['as5.classico_aaa'], // trava de viewport estende o AAA
  'as6.dock_mag': ['as6.dock_classico'],     // magnificação/momentum refinam a dock v3
  'as6.dock_fit': ['as6.dock_inferior'],     // o fit corrige a GEOMETRIA da dock inferior (#112)
  'as6.ctx_barra': ['as6.contexto'],         // a barra apresenta a dica do Context Engine §323–§325
  'as6.acess_hub': ['as6.acess_v2'],         // o hub navega o registry de subcategorias (#140)
  'as6.tax_v2': ['as6.acess_hub'],           // a taxonomia v2 filtra pela mesma infra de subcategorias (#146)
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

// ── BRIEFING_CORRETIVO_01 §11–§16/§112–§113 (decisão #212): VISUAL
//    CANDIDATE MODE + MATRIZ DE FLAGS EFETIVAS ─────────────────────────
// Candidate Mode = PRESET do mecanismo de flags existente (nada de
// arquitetura nova — §12): liga a experiência candidata INTEIRA (2D
// premium + stack 3D v2 + UX simplificada) via override local, p/ QA e
// homologação. Interno: usuário final nunca vê (§13); flags DEV ficam
// de fora (§12). Desligar remove SÓ os overrides do preset (outros
// overrides locais do dev sobrevivem).

/** Flags da experiência CANDIDATA (§12 + UX §87.5). */
export const FLAGS_CANDIDATE: readonly string[] = [
  // 2D
  'as6.classico_premium', 'as6.arte_v2', 'as6.face_v2', 'as6.barba_slot', 'as6.brow_slot',
  'as6.roupa_premium', 'as6.acess_2d_premium', 'as6.cp_foto',
  // 3D
  'as6.looks', 'as6.material_v2', 'as6.camera_v2', 'as6.sombras_v2',
  'as6.pos_v2', 'as6.foto_lentes',
  // UX (simplificação provisória da UI 3D — §87.5/#213)
  'as6.ux3d_simples',
  // Asset Clarity (BRIEFING_COMPLEMENTAR_02 #217): cards = peças isoladas
  'as6.thumb_item_v2',
];

export function candidateAtivo(): boolean {
  return FLAGS_CANDIDATE.every((f) => flag(f));
}

/** Liga/desliga o preset no override LOCAL (QA da própria máquina). */
export function definirCandidate(ligado: boolean): void {
  try {
    const local = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '{}') as Record<string, boolean>;
    for (const f of FLAGS_CANDIDATE) {
      if (ligado) local[f] = true;
      else delete local[f];
    }
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(local));
  } catch { /* storage indisponível — sem candidate */ }
}

/** Boot (§112): `?avst_candidate=1|0` na URL aplica/remove o preset ANTES
 *  do 1º render — jeito mais simples de homologar em produção logado,
 *  sem UI nova. Devolve true se mexeu (caller pode logar). */
export function aplicarCandidateDaUrl(): boolean {
  try {
    const v = new URLSearchParams(window.location.search).get('avst_candidate');
    if (v === '1' || v === '0') {
      definirCandidate(v === '1');
      return true;
    }
  } catch { /* sem URL/DOM */ }
  return false;
}

/** Linha da MATRIZ de flags efetivas (§16/§113 — Dev Mode). */
export interface LinhaFlagEfetiva {
  nome: string;
  padrao: boolean;
  remota: boolean | null;
  local: boolean | null;
  efetiva: boolean;
  origem: 'local' | 'remota' | 'padrao';
  dependencias: string[];
  candidate: boolean;
}

/** Matriz completa default/remote/local/efetiva/origem/dependências —
 *  consumida pelo QaStudio (dev). Nunca exposta no produto normal. */
export function matrizFlags(): LinhaFlagEfetiva[] {
  let local: Record<string, boolean> = {};
  try { local = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '{}') as Record<string, boolean>; } catch { /* ok */ }
  const nomes = new Set<string>([...Object.keys(PADROES), ...Object.keys(local), ...Object.keys(_remotas ?? {})]);
  return [...nomes].sort().map((nome) => ({
    nome,
    padrao: PADROES[nome] ?? false,
    remota: _remotas && nome in _remotas ? !!_remotas[nome] : null,
    local: nome in local ? !!local[nome] : null,
    efetiva: flag(nome),
    origem: nome in local ? 'local' : _remotas && nome in _remotas ? 'remota' : 'padrao',
    dependencias: DEPENDENCIAS_FLAGS[nome] ?? [],
    candidate: FLAGS_CANDIDATE.includes(nome),
  }));
}
