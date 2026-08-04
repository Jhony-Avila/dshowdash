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

## MEGA TAREFA 3 "Acabamento & Cobertura" · 2026-08-03

✅ §557.2 (P9) SKELETON DA CARGA INICIAL — App carregando mostra a silhueta
   do estúdio (3 colunas shimmer + rótulo) em vez de spinner; aria-busy.
✅ §285 ADOÇÃO — entrada animada via MOVIMENTOS.aparecer no drawer
   DetalheAsset (180ms, re-anima ao navegar entre assets) e na
   PaletaComandos (160ms); a11y: bolinhas de tema com aria-label.
✅ COBERTURA §158-salvar — shell-save.mjs E2E: instrumenta o fetch mockado
   do harness (page.route não enxerga mocks inline), prova POST no
   studio.php + confete no sucesso + overlay efêmero (~2.2s) + barra
   confirmada; e §619 flag OFF = zero chamadas ao espelho (__ch619).

Suíte: 25 testes de navegador + núcleo — 25/25 verdes em 2026-08-03.
Aprendizado de harness: os mocks de API são um window.fetch inline — testes
de rede instrumentam ESSA camada, nunca page.route.

## MEGA TAREFA 4 "Fundações 3D & Som" · 2026-08-03

✅ §487 (P8/F5) VALIDADOR DE ASSET 3D — scripts/avatar/assets3d/
   validar-asset.mjs (node puro, lê o chunk JSON do GLB sem three):
   arquivos obrigatórios, manifest §517, licença §511, hashes §478,
   gate §631 de triângulos por LOD, bones §436 (ASCII sem espaço; lista
   canônica do rig em rig-ubc-v1.json — preencher com o 1º GLB real).
   Teste assets3d.test.mjs com GLB sintético: caso feliz + 4 corrupções.
   → Quando o zip UBC chegar, o passo 5 do pipeline já tem ferramenta.
✅ §584 (P9) SOM NO SHELL 5.0 — reuso integral do services/Som (WebAudio
   synth): equipar afinado pela maior raridade, acorde no salvar, botão
   mute nas header-acoes (preferência única com o clássico).
✅ PERF chunk catalogo-arte — entry 497KB → 201KB + arte 297KB em
   paralelo; cache preservado nos dois sentidos (arte × lógica).

Suíte: 26 entradas (25 navegador + assets3d node) — 26/26 + núcleo verdes.

## MEGA TAREFA 5 "Pipeline 3D Industrial" · 2026-08-03 (GIGANTE)

F5 destravado ANTES do zip UBC — publicar personagem virou 1 comando:
✅ publicar-asset.mjs (§461/§478/§517) — lod0 dedup+prune; lod1/lod2 weld+
   simplify meshopt (alvo 90% do gate §631) + compactPrimitive + dedup;
   hashes sha256; manifest completo; AUTOVALIDAÇÃO §487 no fim.
✅ gerar-manequim.mjs — personagem rigged procedural (16 bones §436,
   esferas UV, pesos rígidos, IBMs); --denso 46k tri exercita o simplify.
✅ gerar-thumbs-3d.mjs (§508) — câmera/luz canônicas, three por import-map
   + servidor efêmero próprio, Chromium/SwiftShader; thumb 128 + preview
   512 webp.
✅ gerar-registro-sql.mjs (§614/§615) — SQL idempotente/transacional/
   determinístico p/ o runner; recusa pasta reprovada no §487.
✅ pipeline3d.test.mjs — E2E completo com corrupção; assets3d.test.mjs já
   cobria o validador. Provas: 46208 → lod1 22496 / lod2 7886; §487
   APROVADO com thumbs; SQL 2× idêntico.
Fora de escopo consciente: Renderizador3d §401 no palco fica p/ quando
houver assets REAIS (retargeting §436 pede bones verdadeiros).

Suíte: 27 entradas — 27/27 + núcleo verdes. Tooling novo (devDeps raiz):
@gltf-transform/core+functions, meshoptimizer, playwright-core.

## MEGA TAREFA 6 "Renderizador 3D §401" · 2026-08-03 (GIGANTE)

✅ §401 COMPLETO NO 3D — services/Renderizador3d.ts implementa TODO o
   contrato em three imperativo (framework-agnostic como o §401 pede):
   montar/aplicarEstado/definirCamera §453.1/tocarAnimacao (idle
   procedural §436-ready)/capturar §508/definirQualidade (LOD a quente
   §423)/pausar/retomar/descartar (dispose profundo).
✅ Pendências HONESTAS §481 — o renderer reporta cobertura REAL (slots
   sem asset 3D publicado), distinta do classificador de sockets.
✅ services/Personagens3d.ts (manifest §517 + lodPorQualidade §423) e
   FabricaRenderizador (3D por import dinâmico — entry não engorda; chunks
   conferidos byte a byte).
✅ renderizador3d.test.mjs — 12 asserções em Chromium/SwiftShader com o
   manequim publicado on-the-fly (economico→lod2 provado por request,
   alto→lod0 a quente, idle mexe, pausar congela, PNG 256, DOM limpo).
Pós-zip UBC: retargeting §436 com clipes reais + mapeamento base 2D →
personagem 3D no resolvedor injetado + palco do shell consumindo a fábrica.

Suíte: 28 entradas — 28/28 + núcleo verdes.

## MEGA TAREFA 7 "Palco 3D no Shell" · 2026-08-03 (autorizada pelo Jhony)

✅ 6 personagens CURADOS do AS4 (androide, pug, aventureiro, casual, punk,
   terno — CC0, LICENCAS.md) publicados pelo pipeline mega 5: LODs no gate
   §631, manifest §517, thumbs §508 — VERSIONADOS (política AS4 de curados
   reconciliada no doc do pipeline; farm UBC em massa segue fora do git).
   Publicador ganhou EXT_meshopt_compression na LEITURA (fontes AS4) com
   saída sempre em GLB plano (§423 universal, palco sem decoder).
✅ shell/Palco3d.tsx — prévia 3D no viewport atrás da flag as5.palco3d
   (fail-safe OFF): botão 3D nas header-acoes, chunk motor3d só carrega ao
   LIGAR, 6 personagens selecionáveis (persistido), câmeras §453.1
   (corpo/retrato/cinemática), chip de pendências §481 honesto, §297
   desliga o idle, indisponível nunca derruba o shell.
✅ shell-palco3d.mjs — 9 asserções (canvas pinta, troca de personagem,
   órbita cinemática, volta ao 2D desmonta, flag OFF esconde o botão).

Suíte: 29 entradas — 29/29 + núcleo verdes. Entry: 201→205KB (só o wiring;
o peso 3D segue no chunk sob demanda — hashes conferidos).

## MEGA TAREFA 8 "Blindagem" · 2026-08-03

✅ GATE DE PESO no deploy — scripts/deploy/pesos-esperados.json (máximos
   por chunk, margem ~15%) conferido na etapa 6: crescimento silencioso de
   bundle FALHA o deploy; crescer é decisão registrada no commit.
✅ REGISTRO §614 dos 6 curados — sql/avatar/registro-curados-3d.sql (6
   transações idempotentes) + entrada na lista oficial do runner.
✅ E2E DO SOM §584 — shell-som.mjs com AudioContext stubado (conta
   osciladores): equipar toca, salvar toca o acorde, mute corta tudo.
🐛 2 BUGS REAIS pegos pelo próprio gate ao registrar os curados:
   (a) validador: thumbs ausentes davam return antecipado que MASCARAVA
   violações de gate — agora só GLB/manifest ausentes abortam;
   (b) aventureiro lod2 flat-shaded resiste a simplify (10202→9997) e
   passou despercebido → simplify agora é ITERATIVO (erro 0.01→0.25) e,
   quando a fonte resiste, EXCEÇÃO AUDITÁVEL declarada no manifest
   (aceita até teto absoluto 12k com AVISO; sem declaração = erro; acima
   do teto = erro mesmo com exceção). Cobertos por 3 casos novos no teste.

Suíte: 30 entradas — 30/30 + núcleo verdes.

## MEGA TAREFA 9 "3D Vivo & Conectado" · 2026-08-03

Descoberta: os 6 curados têm CLIPES REAIS embutidos (androide 14; demais 6
— Idle/Walk/Wave/Dance/Jump…). O 3D deixou de ser estátua:
✅ Renderizador3d com THREE.AnimationMixer — tocarAnimacao toca clipe REAL
   com crossfade (transicaoMs/loop do contrato §401); Idle automático ao
   carregar; idle procedural vira FALLBACK p/ GLBs sem clipes; pausar
   congela o mixer; animacoesDisponiveis() p/ a UI.
✅ publicar-asset EXTRAI as animações do GLB p/ o manifest (fim do
   hardcode); 6 republicados com listas reais.
✅ gerar-indice-3d.mjs — index.json DERIVADO da publicação (slug, nome,
   thumb, animações, exceções); Palco3d consome com fallback embutido.
✅ MAPEAMENTO base 2D→3D (personagemParaBase): a espécie escolhida no 2D
   decide o personagem da prévia (bas_androide/ledbot/holo/alien/fantasma→
   androide; espécies animais→pug; humanos→casual); seletor manual vira
   OVERRIDE com chip "Auto" — trocar o rosto no 2D TROCA o 3D.
✅ Seletor de ANIMAÇÕES no palco (destaques Idle/Walk/Wave/Dance…).

Testes: shell-palco3d v2 (animações + auto-mapeamento E2E). Suíte 30/30 +
núcleo verdes. Registro §614 regenerado com os manifests novos.

## MEGA TAREFA 10 "Showcase 3D & Captura" · 2026-08-03

✅ §174.1 CAPTURA 3D — botão no palco 3D → renderer.capturar (960×960,
   determinística §508) → download PNG; paridade com o 2D.
✅ §174 SHOWCASE 3D — coreografia com CLIPES REAIS: câmera cinemática
   orbitando + roteiro do personagem (Wave → Dance/Victory/Running,
   conforme o índice) → volta ao Idle e à câmera anterior (~6s);
   botão local no palco + delegação do Apresentar do shell (sinal);
   §297 pula a coreografia; data-apresentando p/ testabilidade.
✅ shell-palco3d v3 — captura interceptada (PNG 960 nomeado) + showcase
   (liga, anima, desabilita o botão, termina no Idle).

Suíte: 30 entradas — 30/30 + núcleo verdes.

## MEGAS 11+12+13 (lote) · 2026-08-03

✅ MEGA 11 "Registry Vivo" — api/avatar/personagens3d.php serve o catálogo
   3D do REGISTRY §614 (glb ativos × versão máxima aprovada/publicada,
   manifest do metadata_json); front com CADEIA fail-safe: registry →
   index.json → embutido (§481: erro/vazio nunca derruba). Aplicar
   registro-curados-3d.sql agora tem efeito visível.
✅ MEGA 12 "Foto 3D" (§21×§174.1) — Photo Studio com TERCEIRA origem:
   galeria dos curados (thumbs §508) → captura headless 960 via renderer
   §401 efêmero → direto no Estilizar (medalhão/fundo/título).
✅ MEGA 13 "Gravação §174.2" — REC no palco 3D: MediaRecorder no canvas
   (vp9→vp8→padrão) grava a coreografia inteira e baixa
   dshow-showcase.webm; para sozinho no fim; sem MediaRecorder o botão
   some; falha nunca derruba o palco.

Testes: foto-3d.mjs novo + shell-palco3d v4 (gravação interceptada,
blob WebM real). Suíte: 31 entradas — 31/31 + núcleo verdes.

## MEGAS 14–20 (lote de 7) · 2026-08-03/04

✅ 14 VITRINE 3D (§23) — seção Personagens 3D (previews §508 + nº de
   animações); lição rules-of-hooks REINCIDENTE pega em teste (hooks
   após early return crashavam o painel).
✅ 15 COMPARTILHAR (§21.5) — cascata share(File)→ClipboardItem→download
   na foto estilizada e na captura 3D; canal na telemetria. Fix de
   layout: filas de ações com wrap (Cancelar transbordava sobre o palco).
✅ 16 QUALIDADE ADAPTATIVA (§528) — FPS média móvel, histerese 30/55,
   LOD a quente no modo auto; câmera preservada no reload; tier na nota.
✅ 17 CACHE/PREFETCH (§402) — LRU dos BYTES do GLB + parseAsync fresco;
   prefetch no hover. Decisão de arquitetura: clonar cena skinned
   DESCARTADO (SkeletonUtils.clone deixou o androide 2-skins invisível;
   diagnóstico por sondas: cena ok, mixer ok, canvas só fundo).
✅ 18 A11Y & TECLADO (§583/§548) — atalhos P/R/C, aria-live, focus-visible.
✅ 19 TELEMETRIA 3D (§290–292) — p3d_aplicou(+ms)/personagem/qualidade/
   showcase/capturou/gravou + foto_compartilhou.
✅ 20 CONSOLIDAÇÃO — suíte 31/31 + núcleo; relatórios do projeto
   atualizados; este registro.

## MEGAS 21–30 "Palco 3D Profissional" (lote de 10) · 2026-08-04

✅ 21 CENÁRIO (§9.3) — fundos Neutro/Estúdio/Grade no renderer
   (background + GridHelper + chão-disco com sombra fake que ancora o
   personagem); fila de chips no palco.
✅ 22 ILUMINAÇÃO (§163-lite) — presets Estúdio/Quente/Fria/Neon MUTAM as
   3 luzes canônicas (chave/preencher/ambiente) sem recriar a cena; a
   luz canônica continua idêntica à das thumbs §508 no preset padrão.
✅ 23 ÓRBITA MANUAL (§453) — modo de câmera 'orbita' liga OrbitControls
   (drag gira, roda dá zoom; damping; alvo no centro do personagem;
   dispose no descartar). Radio próprio no palco; cinemática continua
   sendo a órbita AUTOMÁTICA.
✅ 24 USAR COMO AVATAR (§21×§325) — captura 960 do palco 3D entra no
   MESMO pipeline salvarFoto da Foto (POST studio.php, re-encode pixel
   a pixel no servidor, versão otimista do App atualizada). Fio:
   App.aoSalvarFotoLegado → ShellStudio → Palco3d.aoUsarComoAvatar;
   botão só existe com a prop (fail-safe).
✅ 25 FICHA DO PERSONAGEM (§508) — contact sheet 2×2 (1920²) com 4
   ângulos determinísticos (frente/¾/perfil/costas via azimute);
   câmera restaurada; download dshow-ficha-<slug>.png.
✅ 26 MARCA D'ÁGUA — "DSHOW" no canto das capturas/ficha; toggle
   aria-pressed (nasce ligada; desligável).
✅ 27 IDLE VIVO — alterna Idle↔Idle_Neutral a cada 12s quando o clipe
   existe; nunca durante showcase/pose congelada (vida sem ruído).
✅ 28 HUD DE PERFORMANCE — flag NOVA as5.hud3d (fail-safe OFF):
   fps · tier · triângulos via diagnostico() do renderer (média móvel
   §528); poll 1s; pointer-events none.
✅ 29 POSE CONGELADA — botão + tecla espaço pausam/retomam o laço
   (freeze frame p/ enquadrar captura); badge com role=status.
✅ 30 CONSOLIDAÇÃO — suíte 31/31 + núcleo verdes; pesos DENTRO do gate
   (entry 221/240 · motor3d 1043/1180 · Renderizador3d 9.9/12 — o
   OrbitControls foi p/ o motor3d, chunk certo); relatórios do projeto
   atualizados (relatório final v2, mapa v60); este registro.

Testes: shell-palco3d v2(=v5 funcional) — pixel do canto prova a troca
de fundo, drag da órbita, freeze/retomar, ficha 1920² interceptada,
marca, HUD, usar-avatar; renderizador3d.test com OrbitControls no
import-map. Suíte: 31/31 + núcleo verdes.

## MEGAS 31–40 "Estúdio Criativo & Governança" (lote de 10) · 2026-08-04

✅ 31 CENAS DO PALCO (§136-3D) — Cenas3d.ts no molde PresetsPessoais
   (localStorage versionado dshow.avst5.p3d.cenas.v1, máx 8, sanitização
   de DOMÍNIO por campo); chips salvar/aplicar/excluir no cenário.
✅ 32 CAPTURA TRANSPARENTE (§21×§325) — capturar() honra transparente:
   true (o contrato §401 já previa; o 3D ignorava): background null +
   chão/grade ocultos SÓ no frame, restaura e re-renderiza (nada vaza
   p/ o palco). PNG alpha pronto p/ compor no Photo Studio.
✅ 33 TURNTABLE 360° (§508) — folha 4×2 (1920×960) com 8 azimutes
   determinísticos; dshow-turntable-<slug>.png; câmera restaurada.
✅ 34 QUALIDADE MANUAL (§423) — chips Auto/Alta/Média/Econ. →
   definirQualidade; persistida; Auto continua o adaptativo §528; a
   nota diferencia "econômica" (manual) de "econômica (auto)".
✅ 35 PALETA §566 + 3D — ações injetadas: ligar/desligar prévia 3D
   (flag-gated) e abrir a folha de atalhos.
✅ 36 VÍDEO NA CASCATA §21.5 — compartilharBlob (PNG delega); gravação
   WebM compartilhável. BUG REAL pego pelo teste: clipboard.write com
   vídeo fica PENDENTE p/ SEMPRE no Chromium (nem resolve nem rejeita)
   → cascata estalava; fix: clipboard SÓ image/* + guarda de 2,5s.
✅ 37 FOLHA DE ATALHOS (§548/§583) — "?" abre overlay acessível
   data-driven (2D+3D); Esc fecha; fora de campos de texto.
✅ 38 BACKUP EXPORT/IMPORT (governança) — JSON versionado com config +
   presets + cenas 3D; interpretarBackup PURA e ESTRITA (formato/versão
   conferidos, config re-sanitizado — ID inventado NUNCA entra, lixo
   descartado e contado no aviso); aplicar config vira COMANDO (undo);
   substituirPresets/substituirCenas p/ restauração íntegra.
✅ 39 MODO APRESENTAÇÃO — fullscreen no contêiner do palco 3D
   (fullscreenchange, aria-pressed, CSS :fullscreen, fail-safe sem API).
   Aprendizado de teste: Esc SINTÉTICO não sai do fullscreen (gesto de
   UI confiável) — o teste sai pelo próprio botão.
✅ 40 CONSOLIDAÇÃO — suíte 33/33 + núcleo (interpretarBackup coberto em
   node puro); pesos no gate (entry 232/265 — teto subiu de 240 com
   justificativa no commit; motor3d/renderizador inalterados); fix
   LATENTE da mega 26 (deps do capturar3d congelavam o comMarca — marca
   OFF não valia na captura); docs do projeto atualizados; este registro.

Testes novos: shell-palco3d-criativo (alpha do canto=0 na transparente,
cena roundtrip Grade+Neon, turntable interceptado, fullscreen) e
shell-atalhos-backup (export parseado, import com descarte contado,
arquivo inválido recusado sem tocar a biblioteca). Suíte: 33/33 + núcleo.
