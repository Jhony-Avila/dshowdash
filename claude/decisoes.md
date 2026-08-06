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

## Pendências do Jhony (herdadas — nunca autônomas)

Validação visual 221–610 (roteiros de 1 min no doc 17 do projeto) · Chave
IA (Anexo B RUNBOOK-BANCO) · zip UBC Standard · rotação GitHub PAT ·
rotação do secret do webhook · renovar nexatechs.com.br · item B
`#/panel-pipedrive/produtos` · decisão do trilho C (P11/P12/P14/P17/P18) ·
arte nova (peças de roupa §72, morfologia facial §108–111, fundos §335–336).
