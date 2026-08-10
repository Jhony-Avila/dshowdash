# Decisões numeradas — Avatar Studio (consolidado no repo)

> Registro completo nos docs do projeto Claude "Avatar Studio". Aqui, o
> resumo operacional das decisões EM VIGOR. Numeração contínua.

- **#45 (2026-07-30) — Regime de execução**: autonomia TOTAL com registro;
  suíte verde antes de cada entrega; ações irreversíveis/credenciais nunca
  autônomas (lista "precisa do Jhony"); sessão esgotou → estado nos docs;
  "prossiga" retoma.
- **#46 (2026-07-30) — Topologia do servidor**: produção vive em
  `feat/pipedrive-modulo-completo`; deploy = merge de origin/main nela;
  `public/index.html` é versionado NELA (na main não); blocos de servidor
  sempre com `&&` estrito.
- **#47 (2026-08-05) — Auto-deploy por webhook**: push no main → webhook
  HMAC (só enfileira) → runner root 1/min → deploy-as5.sh blindado.
  Secret a rotacionar ao sair de testes.
- **#48 (2026-08-05) — Migração para o projeto Claude dedicado** "Avatar
  Studio" (docs 01–09 lá).
- **#49 (2026-08-05) — Escopo do lote 221–230**: trilho canvas PRO
  (§323/§324, megas 221–223), título-componente + emblemas (§344/§345,
  224), templates assinatura (225), editor de showcase (§175/§175.1,
  226–227), timeline no shell (§220, 228), favoritos em categorias (§229,
  229), Minha Vitrine + galerias (§1076/§1077 recorte client-side, 230).
  Justificativa: A1 = maior densidade de valor sem bloqueio externo.
- **#50 (2026-08-05) — Flags do lote LIGADAS por padrão** (`as5.foto_canvas_pro`,
  `as5.showcase_editor`, `as5.timeline_shell`, `as5.favoritos_categorias`,
  `as5.vitrine_pessoal`), seguindo o padrão do rollout §650; rollback §651 =
  desligar a flag individual.
- **#51 (2026-08-05) — 3 regiões do Photo PRO por container query**: o grid
  ferramentas▏canvas▏propriedades (§323) engaja só com ≥700px de largura do
  contêiner `.avst-foto` (o aside clássico tem ~390px e o grid colapsaria —
  comprovado pelo teste onda-200); abaixo disso, fluxo empilhado com TODAS
  as ferramentas do canvas.
- **#52 (2026-08-05) — Teto do chunk `entry` 340→385KB** no gate de peso
  (crescimento intencional do lote 221–230: canvas PRO + editor showcase +
  timeline + vitrine, +40KB reais); margem ~10% preservada.

- **#53 (2026-08-05) — Escopo da onda 231–260** (pedido do Jhony: "231 a
  260"): lote 231–240 A2 palco (§160–§172, flag `as5.palco_v2`), lote
  241–250 A4 progressão (§207–§231, flag `as5.progressao_v2`), lote
  251–260 A1 restante + A3 criação 2D (§102/§105/§118/§119/§120 v2 +
  §349/§361/§364/§369, flag `as5.criacao_avancada`). Campos novos de
  config `corpo`/`postura` com espelho PHP + roundtrip no núcleo
  (body.tipo/postura opcionais — checksum preservado).
- **#54 (2026-08-05) — Teto do chunk `entry` 385→410KB** (onda 231–260:
  +22KB reais, entry em 369KB; margem ~10% restaurada).
- **#55 (2026-08-05) — Escopo da onda 261–310** (pedido: "50 mega lotes de
  uma única vez"): 261–270 A5 3D (`as5.palco3d_v2`) · 271–280 A6 fundações
  (`as5.fundacoes_v2`) · 281–290 poderes/partículas (`as5.poderes_familia`)
  · 291–300 progressão v3 + microinterações (`as5.microinteracoes`) ·
  301–310 A11y/QA/consolidação. Mapa completo no doc 12 do projeto.
- **#56 (2026-08-06) — Adaptações da onda vs. mapa** (autonomia #45, por
  auditoria de código): (a) 271–280 trocou prefetch §274/funil §294/
  skeletons §557 (já existentes ou de baixo valor) por manifest §267 REAL
  + cache multinível §277 + lazy §275 em 8 painéis + tokens §283 v2 +
  crítico §291 v2 — mais denso; (b) 281–290 dedicou o lote inteiro a
  §153.1–.4 + §156 (biblioteca de partículas própria) e ADIOU a foto fina
  (§333/§340–341/§369/§372 → backlog 311+); (c) gate: Renderizador3d
  20→24KB e tetos p/ os 8 chunks lazy novos; (d) trap de foco P10 é
  delegado (um listener) e desliga com `as5.microinteracoes` (§651).

- **#57 (2026-08-06) — Escopo da onda 311–410** (pedido: "100 mega lotes
  de uma única vez"): 10 lotes, cada um com flag própria (ON, #50):
  311–320 foto fina (`as5.foto_fina`) · 321–330 palco sensorial
  (`as5.palco_sensorial`) · 331–340 3D cine (`as5.palco3d_cine`) ·
  341–350 presets v2 (`as5.presets_v2`) · 351–360 efeitos funcionais
  (`as5.efeitos_v2`) · 361–370 temporadas local (`as5.temporadas`) ·
  371–380 portabilidade (`as5.portabilidade`) · 381–390 orçamento perf
  (`as5.orcamento_perf`) · 391–400 catálogo polish (`as5.catalogo_v2`) ·
  401–410 QA/consolidação. Mapa: doc 14 do projeto Claude.
- **#58 (2026-08-06) — Escolhas técnicas da onda 311–410**: §457 pós 3D
  como filter no canvas (composer real adiado — peso do motor3d);
  temporadas/desafios/recordes 100% locais e determinísticos (social
  server-side segue P14); §158 gatilho de efeito = celebração no salvar
  com partículas §156 na cor de destaque; import completo §309 valida
  tudo ANTES de aplicar (duas etapas); recência §88 reativa por evento
  (grade não espera remontagem).

- **#59 (2026-08-06) — Escopo da onda 411–510** (pedido: "100 Mega Lotes
  de uma vez", 2ª onda de 100): 411–420 i18n §296 (`as5.i18n`) · 421–430
  busca v2 §57 (`as5.busca_v2`) · 431–440 cards v2 §60/§66
  (`as5.cards_v2`) · 441–450 editor de efeitos §158 (`as5.editor_efeitos`)
  · 451–460 pós 3D real §457 (`as5.pos3d_real`) · 461–470 analytics local
  §292–294 (`as5.analytics_local`) · 471–480 luz contextual §164–165
  (`as5.luz_contextual`) · 481–490 memórias v2 §203/§244/§247
  (`as5.memorias_v2`) · 491–500 a11y §297 (`as5.a11y_v2`) · 501–510 QA.
  Mapa: doc 15 do projeto Claude.
- **#60 (2026-08-06) — Escolhas técnicas da onda 411–510**: PT é o idioma
  CANÔNICO do i18n (chave = texto atual; flag off FORÇA PT); ordenação
  §58 já existia → só 'Novos primeiro' somado (não duplicar módulo);
  §60.9 muda filtro→indisponível-visível SÓ com flag; efeito entra nos
  params §71 EXISTENTES (wrappers genéricos; params seguem locais);
  composer real com fallback hierárquico p/ o filter CSS e capturar()
  legado; heatmap/analytics 100% locais; luz AUTO desliga no preset
  manual; roving tabindex gerenciado no DOM (MutationObserver rearma na
  virtualização).

- **#61 (2026-08-06) — Escopo da onda 511–610** (pedido: "todos os mega
  lotes que NÃO dependem de mim + validação 1 por 1"): 511–520 i18n
  catálogo · 521–530 i18n painéis (ambos via `as5.i18n`, ver #62) ·
  531–540 foto entrada §321 (`as5.foto_entrada`) · 541–550 foto pro2
  (`as5.foto_pro2`) · 551–560 conjuntos §72 (`as5.roupas_camada`) ·
  561–570 criação fina §102.2/§340–341 (`as5.criacao_fina`) · 571–580
  palco/som v3 §176.1/§178.2/§157.4 (`as5.palco_v3`) · 581–590 infra v3
  §268/§277/§299–300 (`as5.infra_v3`) · 591–600 ux final §59.1/§60/
  §64.2/§545 (`as5.ux_final`) · 601–610 validação 1-por-1 + entrega.
  Esta onda ESGOTA o trilho A. Mapa: doc 16 do projeto Claude.
- **#62 (2026-08-06) — i18n de cobertura sem flag própria**: lotes que só
  AMPLIAM a cobertura do `t()` não ganham flag — o `t()` é inerte em PT
  (chave = texto canônico) e `as5.i18n` já governa o EN globalmente; flag
  extra = superfície de rollback falsa.
- **#63 (2026-08-06) — Escolhas técnicas da onda 511–610**: §300
  substituição automática de asset removido DESLIGADA (conflita com
  byte-stability; nenhum asset removido; validarConfig degrada seguro;
  mapa de sucessores nasce na 1ª remoção real) · migrações de storage
  NUNCA apagam a chave antiga (ela é o backup — espelho da regra /backup)
  e leitores fazem leitura dual · som migrado escreve nas DUAS chaves (o
  modo clássico segue lendo a antiga) · §178.2 preview responde só ao
  liga/desliga geral (é o botão de conferir timbre) · §176.1 órbita com
  ângulo em seno (amplitude limitada = zero deriva, §176.3) · §64.2 com
  janela de graça de 380ms p/ alcançar o botão Fixar · §59.1 medida só em
  cards renderizados (content-visibility reporta placeholder fora do
  viewport) · corpoFino MULTIPLICA o preset §102 (arredondado a 3 casas;
  1 omitido) · borda §340 = máscara plumada que substitui o clip só
  quando > 0 · conjuntos §72.1 = curadoria fixa sobre itens existentes
  (peças reais pedem arte → trilho B) · §60.6 mecanismo pronto porém
  inerte (nenhum item declara incompativelCom hoje).
- **#64 (2026-08-07) — Onda 611–710 = trilho B (UBC)**: com o trilho A
  esgotado e os 4 packs Quaternius CC0 no servidor, a onda ataca F5/P8
  (§398–§537): pipeline de assets v2 (texturas por LOD) → bases UBC →
  Character Assembler §406 → roupas §415–§417 → materiais §418–§421 →
  cabelo/morphs → animação → LOD → captura → homologação. Mapa vivo:
  doc 18 do projeto Claude.
- **#65 (2026-08-07) — Canais de cor 3D = vocabulário §73 (lote 641–650)**:
  §420 pede canais semânticos; em vez de inventar primary/secondary, o 3D
  fala os MESMOS canais do 2D (pele/cabelo/roupa/destaque) — zero
  tradução na UI. Regras: cor NO PADRÃO = arte original do asset (nada de
  tingir por default — o visual publicado não muda com a flag ligada);
  cor personalizada = tint multiplicativo em material.color (§421 — nunca
  gerar textura nova; preserva o detalhe do albedo; não clareia base
  escura — limite documentado); canal por categoria da parte (§406 passo
  10) ou por NOME de material (hair/beard cobre o cabelo embutido das
  bases; PELE só por nome explícito skin/pele — nunca chutar o material
  do corpo); pipeline único no Material Manager (restaura → canais →
  tinta mega 81 → teto de emissivo §418.2), idempotente por construção.
  Bônus a11y: vida §440 agora respeita prefers-reduced-motion (§297) —
  idle e câmera já respeitavam; o teste determinístico expôs o gap.

- **#66 (2026-08-07) — Cabelo/barba/morfos 3D (lote 651–660)**: barba vira
  slot PRÓPRIO combinável com cabelo (§425 — mesmo esqueleto pós-rebind);
  rollback §651 devolve a barba à lista de cabelos (comportamento 621–630
  byte a byte). Famílias §423 DECLARADAS no manifest (`familia`) — todo o
  farm CC0 é `economico` (hair cards rígidos); publicador estampa por
  padrão em cabelo/barba. Física §424: os assets não trazem spring bones →
  rígido no tier econômico ("responder a movimento" = ancoragem no head
  bone); física real fica como pendência premium até assets com bones de
  cabelo. §425 checklist: material da barba = canal cabelo (tinge junto);
  mandíbula n/a (rig ubc-v1 sem jaw bone). Morfos §412–§414: GLBs sem
  morph targets → ESTRUTURAIS via escala do objeto raiz com a MESMA
  tabela §102 do 2D (engine/render), fino §102.2 MULTIPLICA o preset
  (espelho da #63); base+cabelo+barba+roupas escalam JUNTAS (mesmo
  esqueleto — §413 "respeita roupas/rig"); neutro = escala 1 = render
  idêntico; expressivos (piscar §440) ficam na animação, lote 661+.
  Sobrancelhas: já cobertas pelo canal cabelo (materiais MI_Hair da base).

- **#67 (2026-08-07) — Animação 3D (lote 661–670)**: retargeting §436 é
  REUSO DIRETO — a UAL usa o MESMO rig ubc-v1 das bases, então os tracks
  aplicam por nome de bone, sem pipeline de conversão (validação §436.1 =
  suíte). Pacotes de clipes = GLB SLIM (esqueleto+animações, sem malhas —
  publicar-animacoes.mjs); root motion §437 removido no CARREGAMENTO
  (fonte preservada). Máquina §433 com o estado restritivo na CAPTURA
  (emote nunca quebra o frame §508); pose é persistente por construção.
  §439 olhar IMPLEMENTADO (head bone segue o cursor: amplitude limitada,
  suavizado, desliga em reduced-motion/flag off, volta ao centro; nunca
  acumula rotação — só aplica quando idle/vida/clipe repõem o Head ou
  repõe sozinho). PISCAR §440 fica como pendência de ASSET: o farm CC0
  não tem morph targets nem eye bones — entra quando houver asset com
  blendshapes (registrado no lugar de um fake). §441 completada no rig
  ubc: spine_02/03 respiram (nomes legados seguem p/ androide/manequim).
  Pacote UAL: publicação em bloco de servidor (consulta de clipes + 
  curadoria) — o palco degrada §481 até lá.

- **#68 (2026-08-07) — Briefing complementar assume o lote 671–680**:
  Jhony enviou o briefing "Reestruturação completa do layout do Avatar
  Studio (Modo Clássico)" com prioridade imediata → o lote 671–680 vira
  **CLÁSSICO AAA** (layout puro: viewport dominante, carrossel horizontal
  de assets, sidebar compacta, cores junto ao canvas, prévias em linha,
  toolbar/status discretos, grid 8px, hover/seleção ricos, scrolls
  independentes). O restante do trilho UBC desliza: LOD/progressivo →
  681–690 · quality/captura → 691–700 · homologação+gate → 701–710 ·
  validação final da onda → 711–720 (onda estendida p/ 611–720).
  Regras: flag `as5.classico_aaa` (ON por #50; off = layout anterior
  byte a byte); ZERO mudança de funcionalidade (componentes mudam de
  posição/estilo, nunca de código de comportamento); mobile ≤1023px
  mantém o layout atual; modo 3D/shell novo intocados; arquitetura
  (trilho/tokens) reutilizável pelo shell no futuro. Análise + proposta:
  docs/AVATAR-STUDIO-5/classico-aaa.md.

- **#69 (2026-08-07) — LOD/progressivo (lote 681–690)**: o que o pipeline
  v2 JÁ cobria fica registrado como atendido (§461 LODs por asset · §463
  hysteresis 30/55 + swap atômico · §464 meshopt (Draco descartado: carga
  de decoder sem ganho no nosso tamanho de malha) · §465 WebP no lugar de
  KTX2 (decisão de pipeline: sem decoder extra; revisita se a GPU pedir)
  · §466 partículas já instanciadas (THREE.Points) · §468/§469 orçamentos
  por LOD no gate §631 · §477 hashes sha256 · §478 manifests §517). O
  lote entrega o que faltava no CLIENTE: §473 cancelamento por GERAÇÃO
  de carga (bugfix de corrida, SEM flag — corretude não é feature); §470
  progressivo lod2-primeiro (alvo baixa em paralelo; stand-in só se o
  alvo não chegou); §462 LOD por TAMANHO DE TELA (canvas < 420px rebaixa
  um tier); §471 preloader de PARTES no hover; §472 loading manager com
  fases reais (metadados→baixando→modelo_rapido→montando→pronto) e badge
  discreto; §474 LRU real com PIN do personagem atual; §475 IndexedDB
  por hash (imutável com hash; sem hash expira em 7d; teto 96MB com
  despejo LRU; qualquer erro degrada p/ rede); §467 draw calls no HUD
  dev. §476 (CDN/URLs versionadas) é INFRA — pendência registrada p/ o
  Jhony decidir fora do painel. Flag do lote: `as5.progressivo3d`.

- **#70 (2026-08-07) — Quality/Captura (lote 691–700)**: §482.1 perfis
  ULTRA (LOD alto + DPR 3) e CINE (ultra + pós real) como camada sobre os
  tiers existentes — perfil não vira tier novo (LODs continuam 0/1/2; o
  perfil regula DPR/pós); §483 DPR DINÂMICO suave (passoDpr puro: -15%
  por janela de FPS baixo, piso 70% da base, recuperação gradual — nunca
  abrupto) como ÚLTIMO recurso depois do tier adaptativo; §506 captura
  ganha supersampling 2×, formatos png/jpeg/webp, câmera específica com
  restauração; §507 atendido pelo redimensiona-e-restaura (independe da
  viewport — offscreen dedicado só se aparecer glitch real); §329.2 a
  captura v2 FORÇA LOD alto (recarrega, captura com super 2×, devolve o
  tier) com indicador §329.3; §509 thumbnails ficam no renderer
  build-time (gerar-thumbs-3d §508 — determinístico, com cache no git);
  §510 contratos de captura já suportam evolução server-side (dataUri →
  §325 re-encode no servidor); §484/§485 monitor/painel = HUD dev
  (fps/tier/△/dc) — suficiente p/ dev, painel completo se o Jhony pedir.
  §421.1 emblemas/decals: CONTINUA pendência de arte/infra (decals reais
  exigem UV/atlas; nada de fake). Flags: `as5.quality3d_v2` +
  `as5.captura3d_v2`.

- **#71 (2026-08-07) — Homologação (lote 701–710)**: sem flag — homologar
  é VERIFICAR, não mudar comportamento (nada a desligar). Validador §487
  ampliado com regras novas como RESSALVA (licença §511, UV, escala,
  materiais) — nunca reprovação retroativa de asset publicado; relatório
  §488 com três status (aprovado/com ressalvas/reprovado; reprovado nunca
  publica). Homologação EXECUTÁVEL (homologacao.mjs na suíte): varre os
  34 assets reais (0 reprovados; UBC obrigatoriamente LIMPO), confere o
  pacote UAL por hash §477, mede o gate §631 no dist local e roda os
  checklists §489/§490/§493 no palco com evidências. N/A honestos
  registrados no doc (boné/capacete §491, acessórios §492, cenário §494 e
  poder §495 = F9 com arte; origem/orientação §487 = preview visual).
  Doc: docs/AVATAR-STUDIO-5/homologacao-onda-611.md.

- **#72 (2026-08-07) — Onda 721+ abre pelo Photo Studio 3D**: "prossiga"
  do Jhony sem escolha explícita → decisão minha pelo critério de
  alavancagem: a captura v2 (lote 691) deixou o §329 pronto — o lote
  721–730 transforma a entrada 3D da Foto (mega 12/47, que capturava o
  personagem PELADO com estadoVazio) na captura ALTA §329: estado REAL
  do usuário (cores personalizadas §420 + corpo §414 — mesma regra do
  palco), pose Idle via pacote UAL (§329.2 passo 4, com estabilização
  §508; 404 degrada §481), DPR 2 + supersampling §506 e fases §329.3 no
  indicador. Partes 3D (cabelo/roupa do palco) NÃO entram: são seleção
  efêmera de sessão do palco, não persistidas no estado — entram quando
  a receita §407 for serializada (registrado como pendência de design).
  Flag `as5.foto3d` (off = fluxo anterior byte a byte). Próximos
  candidatos da onda: ual_extra multi-pacote · polish AAA pós-veredito ·
  F8 IA (com a chave).

- **#73 (2026-08-07) — Multi-pacote e ual_extra (lote 731–740)**: o
  renderer aceita LISTA de pacotes §432 (definirPacotesAnimacoes;
  definirPacoteAnimacoes delega — Foto §329 intacta); a MESCLA é
  first-wins (o básico define o Idle canônico; extras só SOMAM — função
  pura mesclarClipes, testada); falha de um pacote degrada §481 sem
  derrubar os demais. Curadoria do `ual_extra` (UAL2, CC0): Yes ·
  Idle_FoldArms_Loop · Idle_TalkingPhone_Loop · Walk_Carry_Loop ·
  Chest_Open (emotes neutros de escritório/apresentação; armas/zumbi
  seguem fora do tom). Teto de chips de animação sobe p/ 9 SÓ com a flag
  (`as5.ual_extra`; off = 6, byte). Publicação do pacote no MESMO bloco
  de entrega (patch + npm i no worktree + publicar + push).

- **#74 (2026-08-08) — AS6 assume o programa (onda 741+)**: o briefing
  AVATAR STUDIO 6.0 (`docs/AVATAR_STUDIO_6.md`, commit a9eecfbb, 44.303
  linhas, 18 partes, §1–§3672 com numeração PRÓPRIA) é a fonte de
  verdade das ondas 741+. O BRF AS5 (006a394b) segue como referência das
  features existentes e das regras invioláveis (byte-stability, §651,
  wrappers, espelho PHP), que continuam absolutas. Fila anterior
  ABSORVIDA: polish AAA → Partes 1–3/7–8 · F8 IA → Parte 12 · trilho C
  → Parte 15.

- **#75 (2026-08-08) — Execução = roadmap mestre do próprio AS6 (Parte
  18)**: camadas §3388 (L0 Fundação → L1 Core → L2 Workspace → L3
  Conteúdo → L4 Photo/IA/Social → L5 Gamificação → L6 CMS/QA/Security →
  L7 Escala), caminho crítico §3463 (State → Registry → Renderer →
  Workspace → Creator), prioridades P0–P3 (§3450). Nada de "implementar
  por tela" (§3387). FASE 0 (auditoria §3537) CONCLUÍDA no lote 741–750:
  `docs/AVATAR-STUDIO-6/auditoria-fase0.md` (18 partes × 740 megas,
  clusters § a § com veredito e peso). Mapa de ondas 741–840 no doc 21
  do projeto Claude.

- **#76 (2026-08-08) — Namespace `as6.*`**: features do AS6 nascem
  atrás de flags `as6.*` (mesma mecânica §651). As 60 flags `as5.*` NÃO
  são renomeadas (byte-stability de storage/testes). O serviço de flags
  ganhará metadados de dependência (§3398 do AS6) na L0.

- **#77 (2026-08-08) — Avatar State vNext (lote 751–760, AS6 L0)**:
  §3390–§3392 mapeiam para o que JÁ existe (schemaVersion =
  AvatarConfig.versao / EstadoAvatar.schemaVersion; avatarVersion =
  base_version §619; updatedAt = atualizadoEm) — NENHUM campo novo
  persistido (byte-stability). O que faltava virou
  `nucleo/estado-vnext.ts`: motor de migrações de schema §3393 (cadeia
  linear, pura, determinística, nunca lança; registros de config/estado
  nascem VAZIOS na v1 — o gancho no validarConfig é identidade) +
  Renderer Capability Registry §3396 (2d/3d/foto declaram 8
  capacidades). Dependências de flags §3398 em `DEPENDENCIAS_FLAGS`:
  filho desliga com o pai (rollback §651 transitivo), gated por
  `as6.estado_vnext`. LIÇÃO DE TESTE: as flags de motor com DUPLA
  entrada (as5.materiais3d/morfos3d/animacao3d/foto3d — palco E Foto
  §329) NÃO podem depender de as5.palco3d — o foto329.mjs pegou a
  dependência errada na primeira rodada (fluxo da Foto roda com o palco
  desligado). Espelho PHP: sem mudança (nenhum campo novo trafega).

- **#78 (2026-08-08) — Tokens semânticos SEM flag (lote 761–770, AS6
  L0)**: §576–§586 (cor semântica) e §561 (motion registry) entraram
  como REFATORAÇÃO BYTE-IDÊNTICA: 11 hex consolidados (~380 ocorrências
  do estudio.css) viraram tokens `--as6-*` no tokens.css com os MESMOS
  valores — pixel a pixel igual por construção, e CSS custom property
  não é gateável por flag. Interpretação registrada da regra §651:
  "toda FEATURE nova atrás de flag" — refatoração sem mudança de
  comportamento não é feature; o rollback é `git revert` e o guardrail
  é a suíte de screenshots + o teste tokens-as6.mjs (doutrina: hex
  consolidado que voltar solto = vermelho; @keyframes sem entrada no
  REGISTRO_ANIMACOES = vermelho, nos dois sentidos). A flag `as6.tokens`
  prevista no doc 21 fica RESERVADA para quando tokens mudarem VALOR
  (light mode com direção própria §577+, temas) — aí muda pixel e aí
  tem flag. Os tokens são constantes de tema escuro por enquanto: os
  hex soltos de hoje também não reagiam ao tema claro (comportamento
  preservado, lacuna já registrada na auditoria P8).

- **#79 (2026-08-08) — Componentização do workspace em FASES (lote
  771–780, AS6 L2 §32/§39)**: o ShellStudio (1.979 linhas, 58 useState)
  não se componentiza de uma vez com segurança — extração VERBATIM por
  região, uma fase por lote, DOM byte a byte (fronteira de componente
  React não muda markup; refatoração sem flag conforme #78). FASE 1
  (este lote): `workspace/BarraTopo.tsx` (header §626 inteiro, com os
  estados que só ele usa — menu do aleatório §90 e prefs de som §178.2 —
  morando no componente) + `workspace/TrilhoCategorias.tsx` (sidebar de
  categorias). Módulos puros (t/flag/idioma/sons) importados direto pelo
  componente; prop só para ESTADO do estúdio. ShellStudio: 1.979 → 1.866
  linhas. Guardrails: teste workspace-fase1.mjs (fronteira sem
  dependência circular §3470, markup extraído não volta inline, estado
  migrado não sobra duplicado) + os testes de shell existentes que
  exercitam cada data-teste do header/nav. FASES SEGUINTES: viewport
  (lote 781–790, junto da câmera cinematográfica) e painel/aside →
  Inspector (lote 801–810).

- **#80 (2026-08-08) — MEGA ONDA com entregas consolidadas (ordem do
  Jhony)**: "vamos implementar um mega onde com 100 lotes de uma vez
  para sermos mais produtivos". Interpretação registrada: o gargalo é a
  colagem de um bloco SSH a cada lote — a partir do 781, os lotes são
  produzidos em SEQUÊNCIA local (um commit temático por lote; suíte
  verde e typecheck a cada lote — o rigor por lote NÃO relaxa) e
  entregues em BLOCOS CONSOLIDADOS de ~5–10 lotes por colagem
  (format-patch de série; git am aplica os commits um a um no worktree).
  Mega onda alvo: 781+ contínua pelas camadas do doc 21 (L2 → L3 → QA
  foundation), com o mapa rolando à frente. Tripwires do #45 seguem
  valendo; qualquer vermelho para o trem no lote anterior.

- **#81 (2026-08-08) — Presets de câmera 2D (lote 781–790, AS6 §52/§84,
  flag as6.viewport)**: a auditoria previa "câmera 2D não viaja", mas o
  shell JÁ tem enquadramento automático por categoria (R2) com transição
  suave e idle §119 — o que faltava do AS6 eram os presets MANUAIS.
  Entregue: chips Auto/Rosto/Busto/Corpo na viewport (preset sobrepõe o
  auto; 'corpo' = quadro cheio; persiste em dshow.avst6.cam.v1 §84/§299).
  Flag off = sem chips + enquadramento automático byte a byte (o preset
  salvo NÃO vaza — testado). A fase 2 da componentização (extrair a
  viewport) ficou para lote posterior — feature e cirurgia grande no
  mesmo lote elevam o risco sem necessidade.

- **#82 (2026-08-08) — Estados de card v2 (lote 791–800, AS6 §644/§111,
  flag as6.dock)**: EQUIPADO deixa de depender só do anel+check — selo
  textual próprio no card ativo (i18n PT/EN), hover com elevação por
  token e foco de teclado com anel DISTINTO do anel de equipado, tudo
  escopado em [data-dock6] (flag off = atributo ausente = visual
  anterior byte a byte). Magnificação/momentum do dock (§104–§105) e
  metadados de asset (§150–§153) ficam para lotes próprios — o selo era
  a ambiguidade FUNCIONAL apontada pela auditoria (P7–P8 top 4).

- **#83 (2026-08-08) — Regressão de layout por baseline de GEOMETRIA
  (lote 801–810, AS6 §2676–§2687)**: antecipação da QA foundation. Em
  vez de baseline de pixels (binários no git + lib de diff), a suíte
  ganha baseline de ASSINATURA DE LAYOUT: bounding box arredondada a
  2px + visibilidade dos elementos ESTRUTURAIS de 4 estados canônicos
  (shell edição/foco, clássico AAA itens, clássico foto) em
  docs/AVATAR-STUDIO-6/baseline-layout.json — JSON textual cujo diff se
  revisa no git. Pega a classe de defeito nominal do briefing (§3041:
  componente sobreposto/deslocado/sumido). Desvio intencional = rodar
  gerar-baseline-layout.mjs e revisar o diff no commit. Infra:
  navegador.mjs ganhou initArg (dado serializável p/ o init).
  Regressão de PIXELS de verdade fica para quando houver runner com GPU
  (auditoria P16, infra com o Jhony).

- **#84 (2026-08-08) — Color Studio (lote 811–820, AS6 §206–§212, flag
  as6.color_studio)**: ajuste fino HSL por slot de cor (Matiz/Saturação/
  Luminosidade com output numérico) + 5 harmonias derivadas da cor atual
  (complementar/análogas/tríades — sugestões de 1 clique, nunca
  imposição). Matemática pura em engine/cor-hsl.ts (hex↔HSL clampado,
  determinístico, hex canônico minúsculo — mesma normalização do
  validarConfig, byte-estável). UI atrás do botão "HSL" em cada slot do
  <Cores/> (shell E clássico usam o mesmo componente). Roda de cor
  visual (§207) fica p/ polish futuro — sliders entregam o valor
  funcional sem canvas novo. Flag off = swatches anteriores byte a byte.

- **#85 (2026-08-08) — Componentização fase 2 (lote 821–830)**: o
  <aside> do painel direito virou workspace/PainelCatalogo.tsx (extração
  verbatim, DOM byte a byte, mesmo protocolo da #79). Estados exclusivos
  (propriedades/mostrarTopo/refPainel) moram no componente; `aba` fica
  no pai (PaletaComandos e DetalheAsset navegam por ela). ShellStudio:
  1.866 → 1.730 linhas. Falta a fase 3 (viewport/main — a maior, junto
  do lote de câmera avançada).

- **#86 (2026-08-08) — Asset Dock v3 do clássico (lote 831–840, AS6
  §103–§105, flag as6.dock_classico; briefing complementar do Jhony)**:
  AUDITORIA respondida A–F antes de codar — a mudança ESTRUTURAL
  (viewport dominante + trilho horizontal embaixo + lateral fora do DOM
  na aba de itens + câmera contextual do PalcoCinema) EXISTE desde o
  lote 671–680; o print do Jhony mostra a PRODUÇÃO no marco 610
  (deploy-as5.sh pendente — o layout nunca foi deployado). O que
  faltava de VERDADE virou este lote: workspace/DockAssets.tsx (wheel
  vertical→rolagem horizontal com trackpad nativo passando direto ·
  drag horizontal com threshold de 6px que preserva o clique · setas
  nas extremidades só quando há conteúdo escondido, via
  ResizeObserver+scroll) + cards mais VISUAIS no escopo [data-dock-v3]
  (thumb 70%→78%, nome 1 linha ellipsis, texto de raridade some e os
  pips ficam — prioridade imagem→nome→estado→metadata) + filtros da
  grade em linha única compacta + alturas responsivas por faixa
  (≤1439px: 190px · base: 220px · ≥1920px: 236px · ≥2400px: 250px —
  NUNCA volta para a lateral, conforme ordem). Dependência §3398:
  as6.dock_classico → as5.classico_aaa. Flag off = trilho anterior
  byte a byte (wheel não interceptado — testado).

- **#87 (2026-08-08) — Painéis abaixo do preview (lote 841–850, flag
  as6.paineis_dock; pedido visual do Jhony com prints de produção)**: as
  abas de PAINEL (Arquétipo/Título/Presets/Coleções/Conquistas/Vitrine/
  Criar com IA/Histórico/Foto) saem da lateral direita e abrem na ÁREA
  INFERIOR de largura total abaixo do palco — mesma disposição da dock
  de assets; preview segue dominante (inferior max-height 46% com
  scroll interno). Implementação: miolo das abas COMPARTILHADO entre a
  lateral (flag off) e o inferior (flag on) — zero duplicação de
  lógica; grid do corpo vira 200px+1fr via [data-paineis]. Polish de
  visibilidade incluído (fundo/borda/nome dos cards com mais contraste
  na dock). classico-aaa.mjs atualizado (a asserção "Presets mantém a
  lateral" ficou obsoleta por ordem do Jhony); baseline de layout
  regenerada (diff de 12 linhas: a Foto mudou de lugar —
  intencional). Dependência §3398: as6.paineis_dock → as5.classico_aaa.

- **#88 (2026-08-09) — MEGA ONDA VISUAL 851–880 (ordem do Jhony:
  "máximo de melhorias gráficas/UX/UI, validação no final")**: três
  lotes temáticos num único trem, cada um com flag própria:
  `as6.paineis_cards` (851–860 — painéis do inferior viram GRADES de
  cards estilo game UI: presets/arquétipos em cards verticais com thumb
  96px, títulos/coleções em auto-fill; deps → as6.paineis_dock) ·
  `as6.sidebar_pro` (861–870 — modo SÓ-ÍCONES persistido
  dshow.avst6.sidebar.v1, toggle FLUTUANTE sticky no canto da nav,
  tooltips, ativo com barra de acento; coluna 200→64px) ·
  `as6.visual_v2` (871–880 — palco sem cartão §29/§43 com sombra
  profunda + profundidade radial no workspace, trilho/inferior com
  gradiente+blur e entrada suave reduced-motion-safe, topo com blur).
  DOIS bugs pegos pelos guardrails ANTES da entrega: (1) hooks depois
  do early-return do skeleton → React #310 no rollback (regra dos
  hooks; teste visual-851 parte B); (2) toggle da sidebar EM FLUXO
  empurrava o grid inteiro +32px (nav já é mais alta que a viewport) —
  a baseline #83 acusou e o design virou flutuante com zero shift.
  Regime do trem (produtividade, ordem do Jhony): testes dirigidos por
  lote + SUÍTE COMPLETA no fechamento do bloco consolidado (gate da
  entrega); validação visual de tudo pelo Jhony no final.

- **#89 (2026-08-09) — Workspace TRAVADO na viewport (lote 881–890,
  flag `as6.workspace_fixo`; ordem do Jhony: "o scroll vertical acaba
  tirando o preview da tela e isso é inaceitável" + revisão geral dos
  assets)**: o shell mede o próprio offset na página (CSS var
  `--avst6-offset`, re-medida no resize E quando o shell real monta
  após o skeleton — deps carregando/shellNovo no efeito) e trava em
  `100dvh − offset` com overflow hidden; quem rola é cada região
  (sidebar `scrollbar-width: thin`, inferior, lateral) — a PÁGINA
  nunca. Escape hatch: `@media (max-height: 559px)` volta ao fluxo
  (travar esmagaria o palco). Para o preview seguir DOMINANTE dentro
  do budget fixo, o modo compacta as linhas auxiliares: título+filtros
  do trilho na MESMA linha (biblioteca vira row-wrap), prévias 54px,
  barra 2px, cards da dock 240px com thumb 80% (visual > texto §103) —
  palco-principal 480px a 1680×960 (> cap antigo de 470). Inferior
  perde o min-height de 220px sob a trava (aba curta tipo Histórico
  não vira faixa escura vazia). BÔNUS da revisão geral: os filtros
  dentro da grade (Conjuntos §72.1 / Recentes §88 / categorias de
  Efeito §157) viravam colunas 220px com chips ESMAGADOS na dock
  horizontal — agora são um RAIL vertical compacto no início da dock
  (chips empilhados, legíveis, com scroll próprio; escopo dock-v3,
  rollback junto com a dock). Teste novo workspace-fixo.mjs: zero
  scroll de página + palco inteiro na viewport em 4 abas + rail
  compacto + rollback §651; baseline #83 regenerada (desvios revisados
  linha a linha: tudo compressão intencional da trava).

- **#90 (2026-08-09) — Metadados de asset (lote 891–900, flag
  `as6.meta_assets`; AS6 §150–§153/§227)**: lacuna transversal #6 do
  plano. services/MetadadosAssets.ts deriva ficha COMPLETA e
  determinística p/ 100% do catálogo (autor/origem/licença por
  biblioteca — 'dshow' = estúdio interno, resto = curadoria CC0;
  versão com mapa de curadoria; tags normalizadas de tema/categoria/
  raridade/slot/funcional/família/coleção + extras por id). ZERO toque
  em partes/*; nada entra na serialização (byte-stability por
  definição). DetalheAsset ganha a ficha + tags CLICÁVEIS que disparam
  a busca na grade (evento avst6:buscar-tag); GradeItens ganha operador
  tag: exato e termos soltos casando com tags (off = busca anterior
  byte a byte). Teste meta-assets.mjs.

- **#91 (2026-08-09) — Componentização fase 3a (lote 901–910)**:
  ClimaOverlay (§163) extraído do viewport do ShellStudio p/
  workspace/ClimaOverlay.tsx — DOM byte a byte, puro
  (clima, movReduzido) → SVG, mesma condição de render ('limpo' → null
  no componente; !palco3d no pai). ShellStudio segue encolhendo
  (fases 1–2: BarraTopo/TrilhoCategorias/PainelCatalogo). Próximos da
  fase 3: ComposicaoPalco (temas/fundos/horas/luzes/cenário/clima) e
  BarraCenas (§180/§185) — mapeados, ficam p/ a onda seguinte por
  serem clusters de ~25 props que merecem lote próprio.

- **#92 (2026-08-09) — MEGA ONDA 911–1110 (ordem do Jhony: "Prossiga
  com uma mega onda de 200 Lotes se possivel")**: 20 lotes front-first
  mapeados no doc 22 do projeto; regime #45+#80+#88; entrega em DOIS
  blocos consolidados (DEPLOY_1000_OK no marco 1000 e DEPLOY_1110_OK no
  fim); validação visual de tudo pelo Jhony no final da onda.

- **#93 (2026-08-09) — Componentização fase 3b (lote 911–920)**:
  ComposicaoPalco (§160/§161/§162/§163/§164/§165/§590) e BarraCenas
  (§180/§185) extraídos do ShellStudio p/ workspace/, DOM byte a byte;
  o DOMÍNIO do palco (fundos/horas/luzes/climas/props/apresentações/
  hist/coleção→cenário + chaves de storage e leitores) foi p/
  workspace/palco.ts VERBATIM — componentes importam sem dependência
  circular (§3470). Estados que só os componentes usam desceram
  (cenAberto, apresentacoes, renomeandoAp) e os memos §179
  (sugestaoCenario/sugestaoLuz) viraram locais; estados que o viewport/
  PaletaComandos leem (fundo/hora/luz/clima/propsCen/luzAuto/luzInt/
  tema) seguem no pai. A interface ComposicaoPalco (hist §185) foi
  renomeada p/ Composicao — o NOME do cluster ficou p/ o componente
  (tipo interno, zero impacto de serialização). ShellStudio: 1697 →
  1394 linhas. workspace-fase1 ganhou a seção 3b; baseline #83
  intocada (regressao-layout verde = DOM idêntico).

- **#94 (2026-08-09) — Inspector contextual (lote 921–930, flag
  `as6.inspector`; AS6 §181–§189, Parte 4)**: painel de propriedades
  vira INSPECTOR schema-driven — workspace/inspectorSchema.ts declara
  por categoria os grupos (§181/§182: base sem compatibilidade; roupa
  com cor antes de props), as camadas visíveis e a ordem; mudar uma
  categoria = mudar uma linha de DADO. workspace/Inspector.tsx renderiza
  o accordion (§184/§185) com memória local (§186,
  dshow.avst6.inspector.v1): primeiro uso = COMPLETO (§189), usar um
  grupo recolhe os demais (§186), fechar tudo = COMPACTO (§188);
  largura §187 reusa a expansão/alça do painel. MIOLO 100% reusado
  (padrão #87): Cores e PropriedadesAsset renderizam dentro dos grupos
  — PropriedadesAsset ganhou recorte contextual opcional `soCamadas`
  (ausente = tudo, byte a byte); CORES ficam globais no grupo (a paleta
  é transversal no modelo AS5 §11 — recorte contextual vale p/ props
  por camada, não p/ cores; materiais3d/shell-s3 dependem disso). A
  seção mantém a classe .avst5-propriedades (mesma seção, evoluída) —
  fluxos e testes existentes seguem passando SEM edição. Grupos
  compatibilidade (requerBase/incompativelCom/slot/travas §69) e ações
  (favoritar/detalhes/remover). Off = seção anterior byte a byte
  (§651). Teste inspector-as6.mjs.

- **#95 (2026-08-09) — Vestuário MULTI-PEÇA (lote 931–940, flag
  `as6.creator_v6`; AS6 §3393, Parte 5)**: categoria nova `roupa_sobre`
  (Sobrepeça, grupo vestuário) com 4 itens `sob_*` — WRAPPERS 100%
  sobre arte existente (engine/sobrepecas.ts): o `renderCorpo` que cada
  roupa já tem é ADITIVO por construção (detalhes sobre um torso), então
  vira sobrepeça: direto no corpo inteiro (mesmas coords) e no busto
  pela INVERSA do mapa busto→corpo do emblema
  (translate(-18.588 35.412) scale(1.17647)) + clip da faixa do peito
  (y≥176 — nunca invade o rosto). Curadoria: colete/jaqueta/kimono/
  orbital (jersey etc. leem como estampa, ficam fora). Cada sobrepeça é
  `incompativelCom` a peça de origem — 1º uso REAL do §35/§60.6 no
  catálogo. SCHEMA v2: VERSAO_CONFIG 1→2 com a PRIMEIRA migração real
  no motor §3393 (carimbo puro — v1 ⊂ v2; nenhum avatar salvo muda de
  render); paraLegado2d/PHP espelhados (whitelist + versao). Rollback
  §651: flag off ESCONDE a categoria (categoriasAtivas em trilho/
  clássico/paleta) mas o dado salvo segue aceito e renderizando —
  render engine permanece livre de flags (pureza > rollback de render,
  precedente #63). Sem sorteio no aleatório (determinismo preservado).
  Teste creator-v6.mjs; estado-vnext.mjs atualizado p/ a cadeia real.

- **#96 (2026-08-09) — Dock com magnificação + momentum + snap (lote
  941–950, flag `as6.dock_mag`; AS6 §104–§105)**: refina a Dock v3 do
  clássico (dep §3398 → as6.dock_classico). Magnificação estilo dock do
  macOS: queda gaussiana em torno do cursor via CSS **`scale:`** (não
  briga com o transform de hover dos tokens; origem na base; teto
  1.16×); §297 = o JS não põe a var com prefers-reduced-motion.
  Momentum: velocidade suavizada no drag → rAF com atrito 0.94.
  Aprendizados de implementação (registrados p/ não repetir): (1) o rAF
  do momentum morre SÓ no unmount — o efeito de listeners re-roda a
  cada children (hover preview) e cancelava a inércia; (2) a grade JÁ
  tem scroll-snap CSS `x proximity` — cada set programático re-assentava
  e congelava o voo: o snap é SUSPENSO durante a inércia e DEVOLVIDO no
  pouso (scrollend + fallback 600ms), com assentamento suave no passo
  do card; (3) passo medido por offsetWidth (layout), porque o
  getBoundingClientRect vem inflado pela própria magnificação. Off =
  interações do lote 831–840 byte a byte. Teste dock-mag.mjs.

- **#97 (2026-08-09) — Workspace Context Engine (lote 951–960, flag
  `as6.contexto`; AS6 §323–§325)**: trocar de categoria vira UMA
  mudança de contexto coordenada. workspace/contexto.ts é a camada
  DECLARATIVA (§324): CONTEXTOS por categoria (grupo default do
  Inspector + dica) e `aplicarContexto()` disparando o evento
  `avst6:contexto` + anúncio no aria-live existente. Reagem: GradeItens
  (limpa a busca da categoria anterior), Inspector (abre o grupo
  relevante — cabelo→Cores, acessório/sobrepeça→Compatibilidade,
  efeito→Propriedades…), shell (aba volta a Todos). O que JÁ era
  contextual por construção (câmera R2/§52, dock por categoria, filtros
  §68.3, Color Studio por slots) fica nos módulos de origem — o engine
  coordena, não duplica. Gate no DISPARO (shell): flag off = nenhum
  evento = troca de categoria anterior byte a byte (listeners inertes).
  inspector-as6.mjs ajustado (Roupa agora CHEGA com Cores aberta — a
  coordenação §323 mudou o fluxo de propósito). Teste contexto-as6.mjs.

- **#98 (2026-08-09) — Diff campo a campo no salvar (lote 961–970,
  flag `as6.diff_v6`; AS6 §350/§322)**: workspace/diff.ts com
  `diffCampos()` puro — base/camadas/título com NOMES do catálogo
  (nunca id cru), cores por slot, corpo/postura/ajuste fino, params
  param a param (§71) e canais por camada (§73); tipos
  trocado/adicionado/removido/ajustado. Barra de salvamento ganha
  "Detalhes" → popover com de → para legível; salvar grava HISTÓRICO
  local (ring ≤10, dshow.avst6.diff.hist.v1 — diff computado ANTES do
  save, senão o persistido já mudou) e o popover lista os salvamentos
  anteriores. Off = barra anterior byte a byte, ring nem existe. Teste
  diff-v6.mjs; shell-save/shell-619/shell-s4 verdes.

- **#99 (2026-08-09) — Photo Project v2 (lote 971–980, flag
  `as6.foto_projeto`; AS6 §1416–§1418/§1226/§1227)**: auditoria mostrou
  que "projeto local-first com estilo serializado, reabrir/editar" JÁ
  existia (mega 57/§364 + 252) — o lote entrega o DELTA do AS6:
  (1) schema VERSIONADO §1417 (versao 2 + atualizadoEm) gravado só com
  a flag (off = shape v1 byte a byte); (2) migração de LEITURA §1418 —
  projeto de qualquer versão abre, formato desconhecido degrada p/
  'perfil' sem derrubar o painel (endurecido após crash real no teste),
  nada é regravado por abrir; (3) SNAPSHOT do avatar-fonte §1226 quando
  a foto nasce do avatar/preset (câmera/arquivo zeram o rastro);
  (4) ação "atualizar p/ avatar atual" §1227 no card do projeto — troca
  foto-base+snapshot mantendo a estilização (re-render determinístico
  via dataUriDe + miniaturizarFoto). Teste foto-projeto.mjs.

- **#100 (2026-08-09) — Layer System da foto fase 1 (lote 981–990,
  flag `as6.foto_camadas`; AS6 §1215/§1217/§1219)**: o painel de
  camadas (lote 161–164) JÁ cobria nome/visibilidade/opacidade/blend —
  o lote entrega o delta: (1) ORDEM §1215 da pilha de fundo do medalhão
  (fundo/banner/aura) via ▲▼ — `estilo.ordemFundo` só persiste
  permutação completa NÃO-neutra (neutra = campo some, byte-stability),
  sanitizada no svgFotoDe (aprendizado: TODO campo novo do estilo passa
  pela whitelist do serviço — sem isso o render nem vê) e no PHP;
  render do medalhão compõe na ordem (wide mantém a âncora própria da
  aura — fase 2); (2) LOCK §1217 (`travada` por camada — controles
  desabilitados, não destrutivo); (3) SOLO §1219 — só no PREVIEW
  (estiloPreview derivado; export/salvar usam o estilo real, nada
  persiste). Off = painel anterior byte a byte. Teste foto-camadas.mjs
  (inclui: mover sobre camada VAZIA não muda bytes — o teste cruza a
  aura em 2 passos).

- **#101 (2026-08-09) — QA do bloco A / marco 1000 (lote 991–1000)**:
  suíte completa rodada no fechamento (regime #88) pegou 4 vermelhos e
  todos foram tratados ANTES da entrega: (1) tokens §582 — os CSS das
  ondas 921–970 tinham 4 hex soltos (acento/atenção/sucesso) → trocados
  por var(--as6-*); (2) dock-mag — espera de snap virou poll de
  ESTABILIZAÇÃO (o tempo fixo falhava sob carga da suíte);
  (3–4) home-pessoal/home-compacto — falso vermelho: o runbook pede os
  DOIS harnesses (avatar + ger) e a sessão só tinha gerado o do avatar;
  registrado no runbook mental: `node scripts/avatar/gerar-harness.mjs`
  SEM argumento gera ambos. Rota de entrega da sessão: SEM push direto
  (proxy nega credencial p/ o repo) → bloco paste-safe consolidado no
  padrão comprovado (format-patch → gzip → base64 → sha256 → worktree →
  git am → push → deploy-as5.sh) p/ o Jhony colar no servidor.

- **#102 (2026-08-09) — Golden avatars (lote 1001–1010; AS6 Parte
  16)**: regressão de RENDER executável em node puro — 12 configs
  canônicas (busto padrão/completo, sobrepeça, params, canais, corpo/
  postura/fino, título, palco, corpo inteiro + foto medalhão/ordem de
  camadas/wide) → sha256 do SVG versionado em
  docs/AVATAR-STUDIO-6/golden-avatars.json. Ids derivados = primeiro
  id ORDENADO por categoria: mudança de catálogo muda o golden de
  propósito (revisão consciente). Desvio intencional segue a doutrina
  #83: `--gravar` + revisar o diff do JSON no MESMO commit. Zero
  navegador (esbuild --platform=node; flags = defaults, determinístico).
  golden-avatars.mjs na suíte.

- **#103 (2026-08-09) — Virtualização REAL da grade (lote 1011–1020,
  flag `as6.virtual`; AS6 Parte 9 · §276 v2)**: a virtualização §276
  (esqueleto adiado + promoção one-way) vira JANELA DESLIZANTE — card
  promovido que fica LONGE da viewport (observer de saída próprio,
  margem 1600px ≫ 600px do pré-render = zero oscilação) volta a
  esqueleto e devolve o DOM. Guardas: foco dentro, :hover e item
  EQUIPADO nunca reciclam; os CARDS_IMEDIATOS (topo) nunca foram
  preguiçosos e seguem fixos. Implementação: 2º IntersectionObserver
  único e CONTÍNUO no GradeItens + `aoMontarRaiz` opcional no CardItem
  (a raiz sobe p/ o observer sem wrapper — display:contents não mede).
  Aprendizado de teste: numa janela de duas vias "rolar até o fim"
  recicla o TOPO ao mesmo tempo — a prova correta é o ÚLTIMO card
  (real no fim ⇄ esqueleto no topo). Off = one-way anterior byte a
  byte. Teste virtual-as6.mjs; shell-vgrid/a11y-v2/cards-v2 verdes.

- **#104 (2026-08-09) — Quality Manager central (lote 1021–1030, flag
  `as6.quality`; AS6 Parte 9)**: services/QualityManager.ts é a FONTE
  ÚNICA de qualidade — perfil Auto/Eco/Equilibrado/Alto (persistido em
  dshow.avst6.qualidade.v1; Auto resolve por deviceMemory/núcleos/
  saveData, determinístico por device) + evento avst6:qualidade.
  Consumidores: 3D recebe a DICA de tier (o adaptativo §528 continua
  mandando por cima), o shell expõe [data-qualidade] e o CSS do ECO
  derruba backdrop-filter/animação de card (efeitos caros), e as
  partículas do gatilho §156 escalam densidade (×0.5 eco · ×1.25
  alto — palco só, nunca render salvo). Seletor cíclico no BarraTopo.
  Aprendizado: "tic" de re-render com setState(v => v) NÃO re-renderiza
  (React bail-out) — usar contador. Off = decisões locais anteriores
  byte a byte. Teste quality-as6.mjs.

- **#105 (2026-08-09) — Touch + drag&drop (lote 1031–1040, flag
  `as6.touch`; AS6 Parte 6)**: arrastar um card da grade e SOLTAR no
  palco equipa (§325 "uma ação prepara o ambiente"): HTML5 DnD com tipo
  próprio text/avst-item; o drop vira COMANDO com undo (aplicarComando
  — Ctrl+Z desfaz); viewport marca [data-soltavel] com realce + selo
  "Solte para equipar" durante o arrasto. Gestos: a dock horizontal
  declara touch-action: pan-y (vertical rola a página; horizontal é do
  drag/momentum #96 — pointer events já cobrem touch). Off = sem
  draggable/drop, byte a byte. Teste touch-as6.mjs (aprendizado: o
  atributo de realce é estado React — conferir APÓS um frame, não
  sincronamente no dispatch).

- **#106 (2026-08-09) — Prompt Registry da IA (lote 1041–1050, flag
  `as6.ia_registry`; AS6 Parte 12)**: prompts deixam de ser string
  hardcoded — api/avatar/ia/prompts.json é a FONTE ÚNICA do servidor
  (id/versão/descrição/template {{placeholders}}); ProvedorAnthropic
  monta dali com fallback embutido byte-idêntico (arquivo ausente nunca
  quebra); services/PromptRegistry.ts é o ESPELHO tipado no front
  (teste prova identidade byte a byte — mesma doutrina do espelho PHP)
  com renderizarPrompt() puro (placeholder sem valor é PRESERVADO,
  auditável; sem eval). VidaService envia prompt_versao no POST (audit,
  gated). SEM chave e SEM chamada no front — decisões #24 (IA nunca
  gera assets) e segredos-só-no-servidor intactas. Teste ia-registry.mjs.

- **#107 (2026-08-09) — Derivados com reflow (lote 1051–1060, flag
  `as6.derivados`; AS6 Parte 11)**: posições MANUAIS (§323.2) definidas
  no quadro do PERFIL agora REFLUEM p/ a célula de texto dos formatos
  wide com CONSTRAINTS (clamp na área segura) — antes a âncora crua
  caía dentro da célula do medalhão e o derivado quebrava. Engine segue
  LIVRE de flags: o reflow entra por opcoes.reflowPos, injetado pelo
  svgFotoDe (camada de serviço) conforme a flag; estilo SEM pos rende
  idêntico com/sem reflow (goldens intactos). Painel "Derivados (ao
  vivo)" na Foto: os 4 formatos renderizados juntos com o reflow
  aplicado; clicar troca o formato de trabalho. Off = wide anterior
  byte a byte. Teste derivados.mjs (motor node-puro + UI).

- **#108 (2026-08-09) — CMS read-only (lote 1061–1070, flag
  `as6.cms_ro`; AS6 Parte 15)**: primeiro pedaço do CMS SEM esperar o
  backend novo — api/avatar/cms.php é GET-only + AdminGate fail-closed
  (mesma allowlist do admin.php; sem allowlist = 403 p/ todo mundo) e
  LISTA o que o banco já tem: assets (joins categoria/raridade/
  biblioteca/coleção, filtro por status, paginação ≤100), licenças e a
  trilha avatar_catalog_audit. Zero escrita por construção (teste prova
  estático: nenhum INSERT/UPDATE/DELETE). Front: shell/CmsRo.tsx (chunk
  lazy §275) com 3 abas e tabela genérica, aberto pela Paleta de
  Comandos; 401/403 → "restrito", erro → mensagem — nunca dados sem
  gate. Escritas continuam exclusivas do admin.php (POST+CSRF). Teste
  cms-ro.mjs.

- **#109 (2026-08-09) — Vida do avatar no shell novo (lote 1071–1080,
  flag `as6.vida_shell`)**: corrige a REGRESSÃO da auditoria FASE 0 —
  o viewport do shell renderizava SEM palco:true, então os grupos
  animáveis (personagem/cabelo/palpebras) nem existiam. Com a flag: o
  AvatarSvg do viewport pede o modo palco (§608 — nunca em SVG salvo) e
  workspace/vida.ts liga a MESMA receita comprovada do PalcoCinema
  (respiração 4.2s, balanço do cabelo 3.4s, piscada 2.8–7s via WAAPI).
  A vida mora NO AvatarSvg (acompanha o ciclo do markup) e um
  MutationObserver religa quando o innerHTML é reescrito por fora do
  React — visto na prática: o nó animado era substituído por um
  idêntico e as animações evaporavam sem cleanup (aprendizado: dep no
  string do svg não cobre reescritas de mesmo conteúdo). §297
  (movReduzido) e palco 3D desligam. Off = viewport estático anterior.
  Teste vida-shell.mjs; shell-show/palco-v2/clima/goldens verdes.

- **#110 (2026-08-09) — A11y v3 + i18n dos módulos novos (lote
  1081–1090; sem flag própria — doutrina #62)**: cobertura dos módulos
  AS6 das ondas 911–1080. A11y: Escape fecha o popover de diff §350 e o
  drawer do CMS; corpos do Inspector viram role="region" nomeadas;
  derivados ganham aria-pressed; drop no palco ANUNCIA no aria-live
  ("<item> equipado pelo arrasto"). i18n: ~30 chaves EN novas
  (Inspector/grupos/compatibilidade/diff/CMS) — PT segue canônico
  (chave = texto; zero regressão por construção). Limite registrado: o
  selo "Solte para equipar" é CSS ::after (i18n não alcança; fica PT
  até o selo virar DOM). Sem flag: t() é inerte em PT e os ajustes de
  a11y são aditivos.

- **#111 (2026-08-09) — Pool de workers p/ tarefas pesadas (lote
  1091–1100, flag `as6.workers` — AS6 Parte 9)**: worker é ACELERAÇÃO,
  nunca dependência. foto.worker.ts redimensiona/re-encoda fora da
  main thread (createImageBitmap + OffscreenCanvas); WorkerPool mantém
  pool preguiçoso de 2 workers reutilizados e `redimensionarNoWorker`
  devolve **null em QUALQUER falha** (flag off, sem Worker, erro,
  timeout 4s) — o caller mantém o caminho síncrono de sempre como
  fallback byte a byte. Ponto de uso real: a fase de COMPRESSÃO do
  pipeline §268 (processarFoto) e miniaturizarFoto tentam o worker
  primeiro. Limite registrado: bytes do JPEG podem diferir entre o
  encoder do worker e o canvas — por isso o worker só toca
  cache/estado LOCAL (foto-base de projeto, thumbs TTL §277), nunca
  estado persistido de render do avatar (byte-stability intocada).
  Teste workers-as6.mjs (ON: constrói ≤2 workers e salva JPEG válido;
  OFF: zero workers e save idêntico §651); regressões foto-projeto/
  infra-v3/foto-f6 verdes.

- **#112 (2026-08-09) — Dock inferior no shell novo (onda 1111, flag
  `as6.dock_inferior` — pedido visual do Jhony)**: o shell adota a
  estrutura consagrada do Modo Clássico AAA — nav esquerda → preview
  central dominante → biblioteca em DOCK horizontal abaixo. REUSO, não
  duplicação: o wrapper é o MESMO `.avst-trilho` + `DockAssets` do
  clássico (wheel→horizontal, drag com momentum, setas, magnificação,
  snap, responsivo <1024px) — `DockAssets` ganhou o prop `ativa` p/
  gate explícito fora do clássico. Fit-to-view: com a dock, o
  enquadramento AUTO passa a mostrar o avatar INTEIRO com margem
  segura (scale 1 + padding; recálculo automático via CSS em qualquer
  resize de janela/dock); presets manuais Rosto/Busto/Corpo seguem
  mandando e nunca são sobrescritos. Alturas da dock: compacta/padrão/
  expandida (ciclo persistido em `dshow.avst6.dockinf.v1`; recolhida =
  o painelFechado de sempre); expandida volta a grade em linhas com
  scroll vertical próprio. Controles de cenário saem de cima do avatar:
  toolbar "Cenário" recolhível (mesmos radiogroups, mesmo JSX — o
  cluster vira painel flutuante); câmera fica no canto inferior
  direito. Cores/Propriedades/criação avançada viram DRAWER flutuante
  (overlay — abrir não desloca o preview). BUGFIX de contraste SEM
  flag (CSS-only, como §473): os tokens `--as6-*` eram constantes
  escuras (limite registrado da #78) — no tema claro, superfícies AS6
  ficavam com fundo escuro E texto escuro; agora `[data-theme=light]`
  tem rampa clara equivalente (acento/status intocados) e a vinheta do
  cenário "estúdio" ganhou par claro. Seleção de card: anel + fundo
  acentuado + check + selo EQUIPADO, contraste ≥4.5:1 verificado por
  teste nos DOIS temas. 82 testes legados do shell fixam a flag em
  false (cobrem o fallback §651, mesmo padrão do classico_aaa); o novo
  `dock-inferior.mjs` cobre layout, fit, estados, persistência,
  equipar/busca na dock, drawer, toolbar, contraste e rollback.
  Aprendizado: o drawer lateral responsivo legado (<1024px) precisou
  ser neutralizado sob a dock — nenhuma largura restaura a coluna
  direita. QA da onda pegou DOIS reds herdados que passaram batidos nas
  suítes do Bloco B (o scan de log não via reds sem a linha "FALHAS:"):
  (a) showcase-editor — o perfil ECO (as6.quality) zera backdrop-filter
  com seletor universal e o painel do editor 3D perdia o stacking
  context ACIDENTAL que o pintava acima dos chips absolutos do cenário
  (clique caía no chip errado; bug real p/ usuários eco) → ordem
  explícita `position: relative + z-index` no painel; (b) criacao-fina
  — o modo palco (§608, vida) tem `scale(1.08)` legítimo no plano-fundo
  e o match frouxo do teste dava falso positivo → assert no wrapper
  fino de DOIS componentes. O runner agora imprime `VERMELHOS: <lista>`
  no resumo (red por exceção nunca mais passa despercebido).

- **#113 (2026-08-09) — Onda 1121–1220 (mapa no doc 24 do projeto)**:
  100 megas front-first do plano AS6 sem dependência de arte nova,
  backend ou credencial: tour v2 · Motion Registry · light mode §577 ·
  teclado na dock · workers fase 2 · baseline de runtime · CMS RO fase
  2 · IA apply parcial · contextos reais · fechamento DEPLOY_1220_OK.
  Megas 1111–1120 = onda do dock inferior (#112).

- **#114 (2026-08-09) — Tour §568 v2 (lote 1121–1130, flag
  `as6.tour_v6`)**: com o layout do #112 ativo, o roteiro do tour vira
  PASSOS_V6 (7 passos): palco com fit-to-view e câmera manual, dock
  inferior como vitrine (inércia/setas/rodinha), botão de ALTURA da
  dock, toolbar Cenário, salvar com diff. Mesmo motor de coach marks
  (anel/§570, pular sempre §568); off = roteiro anterior byte a byte.
  Teste tour-v6.mjs (ON: 8 passos com poder, anel na dock; OFF: 6
  passos, "Catálogo"). Aprendizado: o anel PULSA (scale) — asserts de
  posição comparam pelo centro, nunca pela borda.

- **#115 (2026-08-09) — Motion v2 do workspace (lote 1131–1140, flag
  `as6.motion_v2`)**: aceites §568 da Parte 7 AS6 que faltavam. Altura
  da dock TRANSICIONA (nada estrutural corta seco); trocar de categoria
  assenta a biblioteca com fade curto (`[data-troca]` + keyframe
  `avst6-troca` REGISTRADO no REGISTRO_ANIMACOES — paridade guardada
  pelo tokens-as6); aba oculta pausa TODAS as animações CSS
  (`[data-oculto]` → animation-play-state: paused — sem custo de frame
  em background; play-state não muda layout nem ordem de pintura,
  aprendizado do bug do eco). §297: reduced-motion nem liga o atributo.
  Off = cortes secos anteriores byte a byte. Teste motion-v2.mjs.

- **#116 (2026-08-09) — Light Mode real (lote 1141–1150, flag
  `as6.light_v6` — AS6 §577/§578)**: direção PRÓPRIA do claro, não
  "dark invertido". Rampa FRIA de estúdio (fundo #e9edf5, painéis
  #f5f7fb, cards quase-brancos #f8fafd — nunca #fff, §578) com
  profundidade por luminosidade (§577: flutuante > card > painel >
  fundo — testada por luminância); sombras leves (a drop-shadow preta
  é linguagem do dark); flutuantes na camada mais clara; vinheta do
  estúdio afinada. Gate por ATRIBUTO no root (entry seta
  [data-light-v6] pela flag) — CSS-only, dark byte a byte intocado
  (testado). Off = claro funcional do #112. Teste light-v6.mjs.

- **#117 (2026-08-09) — Dock operável por teclado (lote 1151–1160,
  flag `as6.nav_dock` — AS6 Parte 6)**: B foca o 1º card navegável da
  biblioteca; setas movem o roving (da a11y-v2) e o trilho ACOMPANHA
  com rolagem suave (focus({preventScroll}) + scrollIntoView — focus()
  puro salta seco e briga com o snap); PageUp/PageDown paginam com o
  mesmo passo das setas da dock; D cicla a altura via CustomEvent
  `avst6:dock-altura` (o estado mora no PainelCatalogo); a folha de
  atalhos §548 ganha o grupo "Dock de assets" (condicional — a folha é
  dado). Teclas só valem fora de campos, sem modificadores e no layout
  novo (#112). Off = navegação anterior byte a byte. Teste
  nav-dock.mjs.

- **#118 (2026-08-09) — Workers fase 2: encode de export off-thread
  (lote 1161–1170, flag `as6.workers_v2` — AS6 Parte 9)**: o
  `toDataURL` SÍNCRONO de PNG grande (wallpaper 1920×1080, lote §371,
  escala §368) travava a main no export. Agora o raster do SVG segue
  na main (worker não decodifica SVG — limitação do Chromium), mas o
  ENCODE vai ao pool via `createImageBitmap(canvas)` TRANSFERIDO
  (zero cópia) → OffscreenCanvas.convertToBlob no worker (tarefa
  'encodar', timeout 6s). Mesma regra de ouro do #111: null em
  qualquer falha → fallback síncrono byte a byte; bytes de export
  podem diferir entre encoders — download/clipboard apenas, nunca
  estado persistido de render. Off = toDataURL de sempre. Teste
  workers-v2.mjs; regressões workers-as6/foto-f6/foto-projeto verdes.

- **#119 (2026-08-09) — Baseline de runtime local (lote 1171–1180,
  flag `as6.perf_baseline` — AS6 Parte 9)**: PerfBaseline.ts mede as
  interações-chave (troca de categoria, equipar) com
  performance.mark/measure fechadas via DOUBLE-rAF (a medida é o que o
  usuário sente: até o paint) + long tasks via PerformanceObserver.
  Tudo local (nunca sai da aba, sem PII), exposto em window.__avstPerf
  p/ suíte e dev. ORCAMENTO_MS generoso (troca 1200ms, equipar 1500ms
  em headless) — estourar é regressão REAL de runtime, e o teste
  perf-baseline.mjs vira o guarda permanente. Off = no-op absoluto
  (zero marks/observers/globals). 

- **#120 (2026-08-09) — CMS RO fase 2 (lote 1181–1190, flag
  `as6.cms_ro2` — AS6 Parte 15)**: o drawer admin ganha OPERAÇÃO de
  leitura de verdade: busca por nome/key (whitelist unicode ≤40 no
  endpoint — espelho §636), filtro por categoria, FICHA de detalhe
  (endpoint `listar=detalhe&id=` com joins + contagens de arquivos/
  versões; 404 p/ id inexistente) e export CSV client-side da página
  visível (zero endpoint novo; escapa aspas). cms.php v1.1.0 segue
  GET-only + AdminGate fail-closed — o teste prova por análise
  estática que NENHUMA escrita entrou. Off = drawer do #108 byte a
  byte. Teste cms-ro2.mjs (mock de dados por wrap do fetch; download
  capturado por interceptação do click de âncora).

- **#121 (2026-08-09) — IA apply parcial (lote 1191–1200, flag
  `as6.ia_apply` — AS6 Parte 12)**: a sugestão da IA/compositor deixa
  de ser tudo-ou-nada. `workspace/diff.ts` ganhou `camposAplicaveis`
  (mudanças ENDEREÇÁVEIS: base/camadas/título/cores com chave estável
  + rótulo do catálogo) e `aplicarSelecionados` (merge determinístico
  puro). No CriarIA a sugestão vira checklist (tudo marcado por
  padrão); "Aplicar selecionados (N/M)" aplica só o marcado, sempre
  via validarConfig (§636 continua barrando o inválido); desmarcar
  tudo desabilita. Funciona idêntico com ou sem chave de IA (o
  compositor local passa pelo MESMO caminho). Off = botão "Aplicar no
  editor" byte a byte. Teste ia-apply.mjs.

- **#122 (2026-08-09) — Universal Avatar Component fase 1 (lote
  1201–1210, flag `as6.contextos_v6` — AS6 Parte 13)**: nasce o
  CONTRATO client-side que a Parte 13 pede: `montarAvatarUniversal(el,
  {tamanho, forma, observar, rotulo})` renderiza o avatar SALVO (fonte
  = espelho §619 `dshow.avatar.config.v1`), com placeholder neutro
  determinístico sem espelho (nunca quebra), atualização AO VIVO nos
  eventos de save + `storage` (outra aba), e devolve o desmontar.
  Exposto em `window.AvatarStudioUniversal` (entry, com a flag) p/
  painéis vanilla do dash. O drawer de contextos ganha o card "Como o
  dash monta (produção)" consumindo o MESMO caminho — o mock morre
  como caminho. A fase 2 (Identity Service, tabelas sociais,
  permissões server) segue na fila com o Jhony. Off = sem API global e
  sem card. Teste contextos-v6.mjs.

- **#123 (2026-08-09) — Fechamento da onda 1121–1220 (lote
  1211–1220)**: suíte completa 130 arquivos, 129/130 na rodada (único
  vermelho dock-mag = flake de carga conhecido, verde isolado — teste
  intocado na onda); 9 flags novas `as6.*` padrão ON com rollback
  §651; 9 testes novos; entrega consolidada DEPLOY_1220_OK (bloco
  paste-safe, 10 commits sobre `39b2f5e0`); roteiros de validação
  visual no doc 25 do projeto. Fila que segue com o Jhony: rosto
  modular (arte), backend Partes 10/13/14, CI runner, RBAC/audit.

- **#125 (2026-08-10) — Code-splitting §275 v2 (lote 1221–1230, sem
  flag — estrutura de build; onda 1221–1270, mapa doc 26/#124)**: os 3
  maiores módulos de ABA saem do entry p/ chunks lazy (mesma técnica
  consagrada do Estudio3D/CmsRo): Foto (60KB), CriarIA e Contextos só
  baixam no primeiro uso. Entry: 466→400KB (gzip 141→123KB, −13%).
  Suspense com fallback "Carregando…" (role=status); flag não se
  aplica a estrutura de build — rollback = revert do commit. Regressões
  foto-f6/workers-v2/ia-apply/contextos-v6/foto-projeto/manifest/
  orcamento verdes.

- **#126 (2026-08-10) — Cobertura i18n + a11y da onda 1121–1220 (lote
  1231–1240, sem flag própria — doutrina #62)**: EN novo p/ CMS fase 2
  (busca/CSV/ficha), toolbar "Cenário" e "Aplicar selecionados"
  (chave duplicada de Cenário deduplicada). A11y: Escape fecha a caixa
  do Cenário e o drawer de propriedades da dock; no CMS o Escape é
  ANINHADO (fecha a ficha primeiro, o drawer depois) e a linha é
  operável por teclado (tabIndex + Enter). Limites que permanecem
  registrados: tour e folha de atalhos seguem PT (nunca usaram t() —
  migram quando a superfície inteira migrar). Teste cobertura-1240.mjs.

- **#127 (2026-08-10) — Telas estreitas: alça de swipe na dock (lote
  1241–1250, flag `as6.mobile_v6`)**: o TOPO da dock vira alça — swipe
  vertical sobe um degrau (recolhida→compacta→padrão→expandida) ou
  desce até recolher; swipe longo atravessa degraus; alça visual
  (pill) e touch-action: none em <1024px; abas com scroll próprio e
  chips de câmera com wrap no estreito. Aprendizados: (a) o centro do
  topo é coberto pelas ABAS — exigir área "vazia" mata o gesto; o
  gesto arma em qualquer ponto e a CAPTURA só entra depois de virar
  arrasto (>8px), com o clique fantasma suprimido por clickCapture;
  (b) sem setPointerCapture o swipe escapa da alça de 46px antes do
  threshold. Off = interações anteriores byte a byte. Teste
  mobile-v6.mjs.

- **#128 (2026-08-10) — Layouts nomeados do workspace (lote 1251–1260,
  flag `as6.layouts` — AS6 Parte 1)**: 3 slots fixos (A/B/C) na Paleta
  de Comandos salvam/aplicam a GEOMETRIA do workspace — largura da
  nav, largura da lateral, altura da dock e recolhimento. Storage puro
  (`dshow.avst6.layouts.v1`); aplicar escreve as chaves CANÔNICAS
  (larguras + dockinf) e o evento `avst6:dock-estado` faz o
  PainelCatalogo reler a altura (o estado mora lá). Slot vazio anuncia
  no aria-live sem quebrar. Geometria ≠ estado do avatar — nada aqui
  toca config/serialização. Off = comandos ausentes. Teste
  layouts-as6.mjs.

## Pendências do Jhony (herdadas — nunca autônomas)

Validação visual 221–610 (roteiros de 1 min no doc 17 do projeto) · Chave
IA (Anexo B RUNBOOK-BANCO) · zip UBC Standard · rotação GitHub PAT ·
rotação do secret do webhook · renovar nexatechs.com.br · item B
`#/panel-pipedrive/produtos` · decisão do trilho C (P11/P12/P14/P17/P18) ·
arte nova (peças de roupa §72, morfologia facial §108–111, fundos §335–336).

Novas do AS6 (2026-08-08): **Parte 8 truncada no §645** (linha 10568 do
briefing termina em "…tornar ileg" — reexportar o final se houver mais
conteúdo) · decisão de produto §1527 (IA gerando imagem × decisão #24 —
mantendo #24 até ordem contrária) · quando chegar a hora: tabelas novas
(Partes 10/13/14) via RUNBOOK-BANCO · runner de CI · backup agendado
com RPO/RTO · headers CSP no nginx.
