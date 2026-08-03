# AUDITORIA DE LACUNAS do briefing (ciclo AS5-GAPS, iniciado 2026-08-03)

Regra: cada parte nunca-lida-a-fundo ganha um turno — índice + normativas,
classificação (✅ feito · ⚙️ implementável-agora · ⛔ bloqueado-em-quê) e
implementação dos itens de maior valor no próprio turno.

## P4 — Auras, poderes, efeitos, cenários e apresentação (§147–§193) · turno 1

✅ Já coberto: taxonomia de auras (15, famílias do §76) · fundos 2D (20) ·
molduras (24, +raridade §167) · banners (15) · títulos (30) · emblemas (20)
· efeitos (24, §157 parcial) · editor de aura intensidade/velocidade (§71) ·
captura/exportação (F6 §368) · histórico (F4).
⚙️ IMPLEMENTADO NESTE TURNO: §150.1 parâmetro RAIO da aura (0.7–1.3, escala
central 120,120 — framework §71) + §150.2 PRESETS RÁPIDOS (Sutil/Padrão/
Intensa) no painel de propriedades.
⚙️ Implementável em turnos futuros: §174–§175 Showcase cinematográfico 2D
(sequência automática no modo Studio via WAAPI — médio esforço) · §158
gatilhos de efeito (equipar/salvar) · §151 modo reduzido (SMIL off por
prefers-reduced-motion via render estático).
⛔ Bloqueado: §152–§156 poderes/partículas e §159.3–§165 cenários 2.5D/3D,
hora/clima/iluminação REAIS → exigem motor 3D (UBC) e/ou arte nova (F9) ·
§178 sound design → assets de áudio · §177 pós-processamento → 3D.

## P6 — Arquitetura técnica (§261–§318) · turno 2

✅ Já coberto pelo programa F0–F9 (P6 é o espelho técnico do que foi construído):
domínios §263 = EstadoAvatar §607 · engine §264 = contrato §401 + Renderizador2d ·
Avatar State §265 = AvatarStore (draft/preview/undo §282) · Asset Registry/Manifest
§266–267 = registry.php + as5_schema + manifest 3D §517 · eventos §280 = BarramentoEventos ·
feature flags §295 = nucleo/flags fail-safe · observabilidade §290–292 = ObservarNucleo/Telemetria ·
versionamento/migrações §299–300 = runner v1.1 + runbook · APIs §301 = §618/§619 ·
banco §302 = as5_schema · IA §303–304 = FabricaIA + ValidadorIA §636 · testes §311 = suíte 18 + ~90 asserções ·
undo/redo §282 ✓ · segurança §298 = fail-closed/CSRF/sanitizador (regras da casa).
⚙️ IMPLEMENTADO NESTE TURNO: §297 redução de movimento — prefers-reduced-motion
congela o SMIL do palco (render estático; fecha também §151 da P4).
⚙️ Futuro: §285 Motion System unificado (biblioteca WAAPI) · §276 virtualização da
grade (392 itens ainda ok; necessário ao escalar catálogo) · §296 i18n (produto é pt-BR).
⛔ Bloqueado/estratégico: §268–271 pipeline de assets automatizado (ferramentaria
build — junto do UBC) · §278–279 offline/sync real · §293 heatmap · §305 SDK ·
§307–308 plugins/marketplace · §313 CI/CD (infra do Jhony).

## Próximas partes: P9 (15157) → P12 (22676) → P14 (27202) → P17 (33126) → P18 (36006)

## P9 — UX e polimento (§538–§599) · turno 3

✅ Já coberto: hover/seleção/equipado §549–551 (cards+preview §64) · undo §561 (pilhas+histórico) ·
autosave §562 (F4) · barra inferior §563 (BarraSalvamento) · tooltips §567 (Dica) · comparação §580 (§65) ·
responsivo §581 + teclado §583 (F2) · dark §588 (nativo) · estados vazios §558 (§92).
⚙️ IMPLEMENTADO NESTE TURNO: §548/§561 ANUNCIADOR de ações (aria-live no palco:
Aplicado/Desfeito/Refeito — feedback visual + screen reader §297).
⚙️ Futuro: §566 command palette · §557 skeletons (com registry async) · §568–571 onboarding/tour ·
§574–575 dashboard pessoal · §590 temas.  ⛔ §584 som (assets) · §591 UX analytics server.

## P12 — Ecossistema (§845–§924) · turno 3

✅ Semente: identidade §847 (avatar no header/menu via avatar-sync) · API §875 parcial (§618/619).
⛔ ESTRATÉGICO (servidor/produto futuro): presence, feed social, marketplace, plugins, XR,
GPU farm, multi-região — decisões de roadmap do Jhony, não lacunas de implementação.

## P14 — Social (§1070–§1217) · turno 3

✅ Semente: vitrine/galeria pessoais (Vitrine.tsx), compartilhar preset (F4).
⛔ Tudo mais exige backend social (feed/comunidades/reações/menções) — roadmap.

## P17 — Padrões de engenharia (§1424–§1603*) · turno 3

✅ CONFORMIDADE VERIFICADA no código AS5: responsabilidade única, contratos antes da
implementação (§401/§617/§624), dependência explícita (núcleo dependência-zero),
imutabilidade (comandos/estado), falhas isoladas (ErrorBoundary/fail-safe), observabilidade
por padrão (bus→telemetria), tipos de domínio, funções puras no engine.
⚙️ Futuro: monorepo formal §1427 e apps separados §1428 — reorganização estrutural (decisão do Jhony).

## P18 — Gestão de produto (§1584+) · turno 3

Doutrina organizacional (papéis, discovery, hipóteses, testes de usabilidade §1598 — cujas
tarefas exemplo JÁ são executáveis no shell novo). Vira governança dos próximos ciclos:
o checklist de 14 perguntas do §1585 será aplicado a toda feature nova. Sem código.

## CICLO CONCLUÍDO — todas as 18 partes lidas/auditadas (P1–P3, P5, P7, P8, P10, P11, P13, P15, P16 nas fases F0–F9; P4, P6, P9, P12, P14, P17, P18 neste ciclo).

## MEGA TAREFA "Polimento Total" · 2026-08-03 (pós-ciclo)

Fecha de uma vez os "⚙️ Futuro" acumulados nas partes auditadas acima:

✅ §158 (P4) GATILHOS DE EFEITO — confete efêmero ao salvar com sucesso
   (svgEfeitoIsolado no catálogo + overlay .avst5-celebracao 2.2s; respeita
   prefers-reduced-motion §297).
✅ §574–575 (P9) DASHBOARD PESSOAL — chips Nível/explorados/favoritos/presets
   na aba Presets (XP de exploração local, conquistas seguem no clássico).
✅ §590 (P9) TEMAS — 4 acentos (roxo/verde/âmbar/ciano) via --avst-acento,
   bolinhas no palco, persistência dshow.avst5.tema.v1.
✅ §276 (P6) VIRTUALIZAÇÃO DA GRADE — IntersectionObserver único, esqueletos
   fora da tela, 24 cards imediatos, fail-safe sem IO. Limiar 40 (não os 60
   do plano: a maior categoria hoje tem 50 itens — 60 nunca ativaria).
✅ §325 (P5) FOTO WIDE — FORMATOS_FOTO (perfil 1:1 480² / header 3:1
   1500×500 / banner 4:1 1920×480 / wallpaper 16:9 1920×1080), composição
   comporWide (medalhão à esquerda, título+emblema à direita, fundo/banner
   esticados; moldura só no 1:1), seletor na UI da Foto, export nas
   dimensões nativas. Salvar continua gravando o perfil 1:1 (contrato do
   servidor intocado). Bônus: corrigido overflow pré-existente das faixas
   de chips (min-width:0 — o scroll horizontal por design nunca engatava).

Suíte: 23 testes de navegador (novos: shell-vgrid, foto-wide) + nucleo
(~95 asserções) — 23/23 e núcleo verdes em 2026-08-03. Nota: shell-p1
flakou 1× por timeout sob carga da suíte (passa isolado e na re-execução).

⚙️ Ainda futuros (inalterados): §285 Motion System · §296 i18n · §557
skeletons async · e os ⛔ bloqueados por 3D/assets/infra listados acima.

## MEGA TAREFA 2 "Movimento & Robustez" · 2026-08-03

✅ §285 (P6) MOTION SYSTEM — shell/movimento.ts: movimentoReduzido() (guard
   §297 central), animar(), sequencia(), presets MOVIMENTOS, coreografia
   SHOWCASE_174 como dado; apresentar() §174 e celebrar() §158 migrados.
✅ §158 (P4) COMPLETO — gatilho ao EQUIPAR: épico+ dispara MOVIMENTOS.brilho
   (~700ms) no palco via Motion System (equipar+salvar agora cobertos).
✅ §557 (P9) SKELETONS — .avst-esqueleto genérico (base compartilhada com o
   thumb adiado §276); Conquistas distingue carregar≠falhar (vidaCarregando
   no App), Histórico com 3 linhas skeleton, galeria de fotos com 4 quadrados.
✅ PERF da grade — GradeItens lê o DRAFT (hover-preview não re-renderiza 40+
   thumbnails; mesma correção do DetalheAsset) + React.memo no CardItem com
   comparador documentado.
🐛 FIX §90 — aleatorioInteligente sorteava base incompatível com item
   BLOQUEADO (requerBase §35): validarConfig derrubava o item e o bloqueio
   era violado (era a "flakiness" do shell-p1 — semente aleatória). Agora o
   bloqueio vence a base nos modos completo e categoria:base. Regressão no
   nucleo.test (40 sementes × 2 modos) + shell-p1 4× verde.

Suíte: 24 testes (novo shell-polish.mjs: temas §590, dashboard §574,
brilho-equipar §158 com contra-prova) — 24/24 + núcleo verdes em 2026-08-03.
