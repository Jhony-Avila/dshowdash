# AS6 — FASE 0: Auditoria briefing × implementação atual

> Lote 741–750 · 2026-08-08 · decisões #74–#76 (plano mestre no doc de projeto `claude/21-plano-as6.md`).
> Fonte: `docs/AVATAR_STUDIO_6.md` (commit `a9eecfbb`, 44.303 linhas, 18 partes, §1–§3672 — numeração própria do AS6, independente do BRF AS5).
> Método: 9 auditorias paralelas, cada uma lendo a fatia inteira do briefing e verificando o código do AS5 (740 megas) antes de classificar.
> Formato dos clusters: `§ini–§fim · tema · veredito COBERTO/PARCIAL/NOVO · onde no AS5 · peso S/M/L`.

## Sumário executivo

- O AS5 dá base PARCIAL forte às Partes 1–9 e 11 (workspace, viewport, dock, creator, motion, performance, foto) e à Parte 15 no backend (registry/admin/auditoria/licenças sem UI).
- Os blocos majoritariamente NOVOS são: Parte 13 (identidade/social), server authority das Partes 10/14, superfície de CMS (15), CI + golden avatars (16), RBAC/audit log/backup formal (17), orquestração de IA (12).
- Lacunas transversais que mais bloqueiam: componentização do workspace (§32/§39), tokens semânticos (§582/§561), Avatar State vNext (§3390–§3393), backend de ownership/progressão, CI + regressão visual, metadados de asset.
- ⚠️ O arquivo do briefing trunca no meio do §645 (linha 10568, "…tornar ileg") — o final da Parte 8 pode ter se perdido na exportação. Confirmar com o Jhony.
- Serviços hoje localStorage-only que a Parte 10 exige migrar para servidor: `Missoes.ts`, `Temporadas.ts`, `PresetsPessoais.ts`, `VitrinePessoal.ts`, `ArquivoItens.ts`, `ProjetosFoto.ts`.
- Parte 12: JÁ EXISTE camada de IA server-side (`api/avatar/ia/`: ProvedorIA/FabricaIA/ProvedorAnthropic/EnvIA) — §1692 proíbe criar segunda implementação paralela.

---

## Parte 1 — Rearquitetura da interface (§1–§41)

```
§1–2 · workspace criativo + hierarquia 6 níveis · PARCIAL · ShellStudio.tsx + as5.classico_aaa · L
§3 · grid mestre 8px sem números soltos · PARCIAL · tokens.css base 4 (falta 40–128; legado 6/10/14px) · M
§4–7 · aproveitar tela, fluido, sem espaço morto · PARCIAL · estudio.css grid 176/1fr/380, larguras fixas · M
§8 · 4 regiões A/B/C/D · PARCIAL · só 3; região D (dock) inexistente · M
§9–11 · canvas 70–80% da atenção · PARCIAL · viewport 1fr convive com painel 380–560px · M
§12 · safe areas por contexto · PARCIAL · Contextos.tsx + Foto.tsx safeCv; nada na viewport · M
§13 · guias inteligentes (terços/centro/simetria) · NOVO · só no Photo Studio (§324.2) · S
§14 · zoom por categoria (tabela 220–90%) · PARCIAL · ENQUADRAMENTOS + CAMERA_BUSTO/CORPO · S
§15 · câmera nunca instantânea (ease/spring) · PARCIAL · transição CSS, sem spring/inércia · M
§16 · adaptativo notebook→ultrawide→TV · PARCIAL · único breakpoint ≤1023px · M
§17–18 · sidebar tree, badges, busca, resize · PARCIAL · arraste + compacta ≤84px; grupos só no clássico · M
§19 · barra superior minimalista · PARCIAL · só sob as5.classico_aaa · S
§20 · toolbar contextual por categoria · PARCIAL · cabeçalho fixo, não troca · M
§21 · separar ferramentas/conteúdo/preview/navegação · PARCIAL · mistura no aside único · S
§22 · avatar sempre centralizado · COBERTO · .avst5-zoom transformOrigin + PalcoCinema · S
§23–24 · dock horizontal macOS/Steam (magnify/snap/momentum) · NOVO · avst-trilho é carrossel simples · L
§25 · painéis contextuais sob demanda · PARCIAL · painelFechado; painel é fixo · M
§26 · infos flutuantes junto do avatar · PARCIAL · selos título/poder/moldura; sem raridade/compat · M
§27 · HUD gamer (glow/blur/vidro/neon) · NOVO · — · M
§28 · status bar compacta de salvamento · PARCIAL · BarraSalvamento.tsx (barra cheia) · S
§29 · canvas sem bordas · PARCIAL · .avst5-palco com moldura/cartão · S
§30 · painel direito vira Inspector · PARCIAL · PropriedadesAsset/DetalheAsset são embriões · M
§31 · dock inferior permanente · NOVO · — · M
§32+39 · layout modular + componentização (7 componentes) · NOVO · ShellStudio.tsx monólito 1.979 linhas · L
§33 · workspace configurável (mover/ocultar/fixar) · NOVO · só largura persistida · L
§34 · presets de layout (Compacto/Editor/Cinema/…) · PARCIAL · modo edicao|foco|studio · M
§35–36 · fullscreen inteligente + apresentação · PARCIAL · modo studio + tecla F; sem Fullscreen API · S
§37 · painéis dockáveis/flutuantes · NOVO · — · L
§38 · nenhum painel desperdiça largura · PARCIAL · larguras fixas · S
§40 · 60fps, sem layout shift · PARCIAL · DPR dinâmico só no 3D · M
§41 · pronto p/ marketplace/social/missões · PARCIAL · abas somadas caso a caso · L
```

## Parte 2 — Viewport cinematográfica (§42–§100)

```
§42–44 · protagonismo, palco virtual, ambiente sempre · PARCIAL · cenários §160 + .avst5-palco · M
§45 · câmera como componente independente · NOVO no 2D · só 3D (definirCamera/EstadoCamera) · L
§46 · enquadramento ideal por 11 categorias · PARCIAL · ENQUADRAMENTOS; falta barba/calçados/acessório · M
§47–48 · viagem + micro movimento de câmera · PARCIAL · 3D §176; 2D não viaja · M
§49–50 · camera target + auto focus · PARCIAL · enquadrar('auto'|'rosto') §454 · S
§51 · orbit limitada (nunca de costas no clássico) · PARCIAL · órbita 3D sem clamp azimute · S
§52 · 9 presets de câmera · PARCIAL · corpo/rosto/cinemática/órbita + turntable · M
§53 · transições fade/glow/spotlight · PARCIAL · crossfade §157.4 + entrada2d · S
§54 · perfis de iluminação (7 nomeados) · PARCIAL · LUZES_PALCO + as5.luz_contextual · M
§55 · HDR/bloom/exposure incl. 2D · PARCIAL · 3D ACES+bloom §457; 2D nada · M
§56 · sombras 4 tipos · PARCIAL · PCFSoft 3D + .avst-cine-sombra clássico · M
§57–58 · profundidade 3 planos + parallax · COBERTO só clássico · PalcoCinema.tsx; ausente no shell novo · S
§59–61 · idle vivo + eye tracking + blink · COBERTO só clássico · PalcoCinema + data-idle §119 · S
§62 · micro expressões faciais · NOVO · — · S
§63 · aura dinâmica (respira/orbita/emite) · PARCIAL · auras.ts + particulas.ts estáticas · S
§64 · molduras vivas por estado · COBERTO · molduraViva §167 · S
§65 · densidade de partículas por raridade · PARCIAL · celebração fixa; §444–446 no 3D · S
§66–67 · palco reage ao tema + chão material · PARCIAL · data-fundo/luz; 3D chao+grid; 2D sem piso · M
§68–71 · spotlight/rim/ambiente · COBERTO 3D · rim §452; 2D só glow/vinheta · S
§72–75 · background dinâmico + clima 7 tipos + horário · PARCIAL · §163 chuva/neve/névoa + HORAS_PALCO §162 · M
§76–77 · cinematic blur + safe areas opcionais · NOVO · — · S
§78–80 · visualizar publicação + hero shot + photo mode · PARCIAL · Contextos.tsx + modo foco/studio + Foto.tsx · M
§81–84 · zoom livre/pan/reset + bookmarks de câmera · PARCIAL · PalcoCinema zoom/reset; sem pan/bookmarks · M
§85–87 · antes/depois + split + slider · PARCIAL · comparação lado a lado + diff; sem slider · M
§88 · captura automática ao salvar · NOVO · captura sempre manual · M
§89–90 · HDR simulado 2D + preview de impressão · PARCIAL · Contextos 3 de 4 · S
§91–94 · HUD contextual/gamer/auto-hide/clean · PARCIAL · chips soltos; modo foco parcial · M
§95 · modo desenvolvedor (fps/drawcalls/LOD) · COBERTO · Hud3D (as5.hud3d) + TelemetriaDev · S
§96–99 · composição (terços/golden) + fundo adaptativo · NOVO · — · M
§100 · qualidade Ultra→Automática · COBERTO 3D · perfis §482.1 + DPR §483 · S
```

**Aceite P1**: avatar domina, palco não card · tela toda usada (ultrawide/4K) · sidebar agrupada/redimensionável + toolbar contextual · painéis modulares (7 componentes §39) · absorve marketplace/social sem reorganizar · percepção MetaHuman/CC4.
**Aceite P2**: palco cinematográfico à primeira vista · avatar vivo (respiração/piscada/olhar) · câmera por categoria · luz/sombra/profundidade premium em 2D · Hero/Cinema/Foto/Dev · pronto p/ renderer 3D sem reestruturar.

**Top lacunas P1–P2**: componentização viewport/shell (L) · vida do avatar perdida no shell novo — regressão (M) · Asset Dock região D (L) · câmera 2D easing/presets/bookmarks (L) · guias/safe/composição na viewport — portar do Foto.tsx (S–M).

## Parte 3 — Asset Dock AAA (§101–§180)

```
§101–102 · biblioteca premium, catálogo infinito · PARCIAL · GradeItens IO limiar 40 · M
§103–105 · dock horizontal principal + momentum + magnificação · PARCIAL/NOVO · .avst-trilho só clássico/aba itens; snap proximity; sem magnify · M
§106–108 · hover preview + pré-carregamento por grupo · COBERTO/PARCIAL · aoPrever + MARGEM_PRE_RENDER 600px · S
§109–117 · card colecionável, hover rico, equipado, badges · PARCIAL · trilho 220×248 + Dica portal; badges NOVO/SAZONAL/lock; sem ribbon/pulse · M
§118–120 · favoritar/fixar/recentes 3 tipos · COBERTO/PARCIAL · FavoritosCategorias + Recentes.ts (só usados) · S
§121–123 · busca 11 campos + fuzzy + semântica · PARCIAL · nome/tema/lore + operadores + distanciaAte1; semântica NOVO · M
§124–126 · chips no lugar de dropdowns + persistência · PARCIAL · avst-fchips convivem com selects · M
§127–134 · busca global/coleção/compat + ordenar 9/agrupar 5 · PARCIAL · busca por categoria; 5 ordens; zero agrupamento · L
§135–139 · coleções: preview, 100%, progressão, timeline · COBERTO · Colecoes.tsx §207–214 + TimelineShell §220 · M
§140–143 · recomendação/similaridade/IA no dock · PARCIAL · ConselheiroEstilo (regras); nada no dock · L
§144–148 · preview lado a lado, contextos, locks explicados · COBERTO/PARCIAL · Contextos.tsx + lock+dica; sem slider · M
§149–153 · tooltips premium + lore/autor/licença/versão · PARCIAL · lore sim; ItemCatalogo SEM autor/licença/versão/data · M
§154–157 · comparar até 4 no avatar · NOVO · só A/B · L
§158–160 · modos lista/grade/tabela/compacto · PARCIAL · falta tabela · S
§161–167 · curadoria, Editor's Choice, packs, marketplace · NOVO · — · L
§168–170 · eventos/missões/temporadas no dock · COBERTO · Missoes.ts + Temporadas.ts · S
§171–175 · infinite scroll virtual + cache 4 níveis + skeleton · PARCIAL/COBERTO · IO sem windowing; CardPreguicoso OK · M
§176–179 · vazios ricos, retry, offline · PARCIAL · vazios §92; sem retry/offline · M
```

## Parte 4 — Inspector Panel (§181–§260)

```
§181–186 · inspector contextual por categoria + accordion · PARCIAL/NOVO · PropriedadesAsset é lista de sliders · L
§187–194 · redimensionável, breadcrumb, mini preview, favoritos de prop · PARCIAL/NOVO · avst-redim 320/420/560 · M
§195–199 · histórico contextual, reset por grupo, indicadores · PARCIAL/COBERTO · undo global + Restaurar por camada · M
§200–205 · IA no inspector + conflitos explicados + before/after · PARCIAL · Consultor.tsx drawer; conflito só no card · M
§206–212 · Color Studio (roda/HSL/histórico/harmonias) · PARCIAL · Cores.tsx swatches + input color — zero HSL/roda · L
§213–217 · material editor tempo real + sliders premium · PARCIAL · Materiais3d.ts só 3D; range sem numérico · L
§218–226 · presets por grupo, import/export, perf inspector, coleção · PARCIAL/COBERTO · PresetsPessoais/Export globais; Hud3D só 3D · M
§227–236 · tags de asset, relacionados, técnico (hash/LOD/versão), CMS · PARCIAL/NOVO · assets sem tags; sem inspector técnico · M
§237–247 · drag&drop de grupos, search everywhere, quick actions, multi seleção/batch · NOVO · PaletaComandos §566 é embrião · L
§248–259 · snapshots por categoria, timeline, adaptativo, virtualizado, schema-driven · PARCIAL/NOVO · engine/params.ts ParamDef é a semente · M
```

**Aceite P3**: catálogo = biblioteca premium · dock fluido cinematográfico · cards com valor percebido · busca completa + chips · milhares de assets com virtualização/lazy/cache · pronto p/ marketplace/DLC/IA.
**Aceite P4**: inspector = ambiente de edição contextual · controles dinâmicos por categoria · busca interna/favoritos/histórico/presets/quick actions · Color Studio + Material Editor tempo real · IA não altera estado sozinha · modular (3D/Photo/Marketplace/CMS).

**Top lacunas P3–P4**: inspector contextual schema-driven (L) · Color Studio (L) · dock real no shell novo (L) · metadados de asset no ItemCatalogo — trabalho de dado, vem cedo (M/L) · comparação multi-asset + batch (L).

## Parte 5 — Character Creator (§261–§321)

```
§261–263 · hierarquia identidade→anatomia, macrogrupos · PARCIAL · CategoriaId plana de 12 ids · L
§264–265 · arquétipo preset não bloqueante · COBERTO · Arquetipos.tsx · S
§266–267 · taxonomia espécie → múltiplas bases · PARCIAL · especies.ts; base:string plano sem rig/slots · M
§268–271 · corpo contínuo + presets + postura · PARCIAL/COBERTO · corpo 4 presets + corpoFino; PosturaAvatar 5 · M
§272–276 · rosto modular preset+morph+detalhe · PARCIAL/NOVO · presets §105 só olhos+boca; sem morphs por região · L
§277–278 · edição na viewport + zoom facial automático · NOVO · — · L
§279–282 · Skin Material System (SSS/emissive) · PARCIAL · canal pele recolore (as5.materiais3d) · M
§283–289 · detalhes faciais em slots + olhos em camadas + sobrancelhas · NOVO/PARCIAL · olhos.ts monolítico; sobrancelha inexiste · L
§290–295 · nariz/boca/mandíbula/queixo/orelhas · PARCIAL · só bocas.ts; nariz/mandíbula = 0 no código · L
§296–304 · famílias de cabelo + canais de cor + física + política clipping · PARCIAL/NOVO · cabelos 50 + 3D §425; sem famílias/física; máscaras §415.2 só 3D · M
§305–313 · barbas modulares, expressões persistentes, personality presets · PARCIAL · barba 3D; EMOTES só preview · M
§314–318 · vestuário multi-peça + cores/materiais por peça · PARCIAL · camada roupa é ÚNICA (sem calça/calçado/luvas) · L
§319–321 · presets de material + roupa muda de verdade · NOVO/COBERTO · roughness hardcoded; equipar OK · M
```

## Parte 6 — UX avançada (§322–§399)

```
§322–325 · Workspace Context Engine coordenado · PARCIAL · categoria muda dock+inspector; câmera/busca/atalhos não · L
§326–333 · Quick Create + modos Advanced/Expert + fluxo próximo · NOVO/PARCIAL · TourGuiado é onboarding · M
§334–338 · autosave 5 estados + draft + change summary · COBERTO/PARCIAL · BarraSalvamento 4 estados + AvatarStore §608 · S
§339–343 · undo/redo universal granular · COBERTO · Command Pattern + atalhos + aria-live (as5.undo_redo) · S
§344–352 · histórico com thumbnail, snapshots, diff, timeline de versões · PARCIAL · Historico/VersoesAvatar/HistoricoSessao; sem thumb/diff campo a campo · M
§353–361 · presets rápidos, favoritos globais, recentes, Ctrl+K · PARCIAL/COBERTO · PaletaComandos completa · M
§362–366 · quick actions, context menu, atalhos contextuais · NOVO/PARCIAL · zero onContextMenu · M
§367–371 · 100% teclado + focus ring + multi seleção · PARCIAL/NOVO · foco.ts §297 · M
§372–386 · gamepad + touch + drag&drop · NOVO · zero código das 3 superfícies · L
§387–392 · continuidade multi-device + offline + conflito entre abas · PARCIAL · espelho §619 + rascunho; conflito só "aplicar o novo" · M
§393–399 · feedback instantâneo/skeletons/erros claros · COBERTO/PARCIAL · skeletons §557 por lista · S
```

**Aceite P5**: silhuetas distintas sem trocar roupa · espécie ≠ humano · rosto por região · canais de cor por peça · zero clipping declarado · byte-stability preservada.
**Aceite P6**: ação de categoria coordena viewport/câmera/dock/inspector/busca/atalhos · Ctrl+Z universal · autosave/draft/publicação distintos · histórico com thumb+snapshot+diff · 100% teclado; touch/gamepad sem UI paralela · erro sempre diz o que foi preservado.

**Top lacunas P5–P6**: rosto não modular (L, raiz da diversidade) · vestuário camada única (L, "obrigatório" §316) · Workspace Context Engine (L) · touch/gamepad/dnd (L) · histórico thumb+snapshot+diff (M, melhor valor/esforço).

## Parte 7 — Motion Design (§401–§570)

```
§401–409 · doutrina + motion tokens + spring/momentum · PARCIAL/NOVO · movimento.ts + --t-dur-* (3 de 7); sem spring · M
§410–417 · idle por personalidade + reações por raridade · PARCIAL · avst5-idle-* 3 loops + celebra + Som.tocarEquipar · M
§418–432 · enter/exit, sidebar, dock magnify/drag, card 3 camadas · PARCIAL · trilho snap+hover 1.03; sem magnify/drag · L
§433–439 · crossfade morph/cor/material/aura · PARCIAL · cen-fade 0.36s + Materiais3d lerp; cor/morph saltam · L
§440–450 · inspector/accordion/slider/tab/chip/FLIP · PARCIAL · transições pontuais; sem FLIP · M
§451–458 · skeleton shimmer + sistema de toast · COBERTO/PARCIAL · esqueleto OK; UM toast sem fila/undo · M
§459–465 · modal/drawer/tooltip delay 300–500ms · PARCIAL · avst-tip 0.16s SEM delay · M
§466–480 · câmera ease/interrupt + luz/parallax · PARCIAL · CameraRig3D lerp; 2D fixo 480ms · M
§481–497 · famílias de partículas + layered motion + stagger · PARCIAL/NOVO · particulas.ts sem famílias; head-look único precedente · L
§498–509 · preset sequencial, AI thinking, photo studio motion · PARCIAL/NOVO · snapping §324.2; CriarIA usa spinner · M
§510–519 · shared element + reduced motion + pausar fora da viewport · PARCIAL/COBERTO · movimentoReduzido + kill-switch + IO · S
§520–531 · budget transform/opacity + state machine + motion debugger · COBERTO/PARCIAL/NOVO · zero GSAP; máquina §433 só 3D · M
§532–547 · regressão de motion + audio sync + perfis por tema · PARCIAL/NOVO · suíte testa estado, não movimento · L
§548–559 · first-time hints + loading 3D poster + FPS guard · PARCIAL · TourGuiado + §470/§472; sem poster · M
§561–566 · motion/ modular: Provider, Registry, eventos · PARCIAL · movimento.ts 104 linhas = 1 de 11 camadas · L
```

## Parte 8 — Direção visual / Design System (§571–§645 ⚠️ truncada)

```
§571–575 · creative environment + ASVL + níveis N0–N5 · PARCIAL/NOVO · as5.classico_aaa ataca card genérico · M
§576–581 · surface tokens + light mode próprio + accent Dshow · PARCIAL/NOVO · 3 superfícies; light = 6 vars invertidas; accent violeta · M
§582–586 · color tokens semânticos, proibir hex + adaptive contrast · PARCIAL · centenas de #161b26/#232a38/#8a93a6 soltos · L
§587–601 · gradient system + materiais (glass/carbon/holo/LED) + noise · PARCIAL/NOVO · glass ad-hoc ~12 pontos sem token · L
§602–611 · borda/radius/shadow/elevation/z-index tokens · PARCIAL/COBERTO · z-index oficial §22.5 OK; radius com soltos · M
§612–622 · tipografia (papéis/display/tabular) + truncar · PARCIAL · --t-tipo-* + tabular-nums; sem fonte display · M
§623–629 · biblioteca única de ícones + ícones por categoria · COBERTO/NOVO · lucide 100%; sem ícones próprios das 15 categorias · M
§630–638 · escada visual de raridade legível sem cor · COBERTO · borda→degradê→shimmer→glow + pips §39.20 · M
§639–645 · anatomia do card + Selected≠Equipped≠Preview≠Locked · COBERTO/PARCIAL · um único anel serve p/ tudo; §645 CORTADO no arquivo · M
```

**Aceite P7**: transições coerentes · idle+reações sutis; hover≠equip · câmera interrompível sem acumular timelines · reduced-motion + pausa em background · tudo sai de token/preset · animações críticas testadas.
**Aceite P8** (derivado; formal ficou além do corte): zero valor visual hardcoded · escala real de superfícies · light mode com direção própria · glass restrito e tokenizado · raridade legível sem cor · Selected/Equipped/Preview/Locked distinguíveis.

**Top lacunas P7–P8**: Motion Provider+Registry (L) · tokens semânticos de cor + famílias de material (L, dependência-raiz) · dock motion completo (L) · Selected×Equipped×Preview (M, ambiguidade funcional) · motion debugger + QA de motion (M).

## Parte 9 — Performance Engineering (§646–§961)

```
§646–655 · budgets formais, P75/P95/P99, main-thread budget · PARCIAL/NOVO · baselines.md só peso de chunk · M
§656–661 · Worker Pool + Task Scheduler + cancelamento global · NOVO/PARCIAL · ZERO workers; geracaoCarga §473 só no 3D · L
§662–681 · pipeline de imagem, cache em camadas, prefetch, CDN · PARCIAL · CacheAssets3d 96MB/7d/LRU/pin (só GLB) · M
§682–689 · bundle splitting + análise + regressão · COBERTO/PARCIAL · vite manualChunks + 9 lazy + gate de peso · S
§690–705 · rerenders, DOM budget, virtualização, busca rápida · PARCIAL · GradeItens IO limiar 40 sem windowing · L
§706–712 · budget do renderer 2D/SVG, dirty rendering · NOVO · sem cache de camada · L
§713–733 · budgets 3D, texturas KTX2/atlas, material sharing, DPR · PARCIAL/COBERTO · diagnostico() drawCalls; passoDpr §483 OK · M
§734–748 · Quality Manager central + degradação escalonada + LOD transição/histerese · PARCIAL/NOVO · adaptativo §528 dentro do renderer; troca de LOD é reload · L
§749–771 · animation/particle budget, Resource Manager, refcount, leaks · PARCIAL/NOVO · descartar() OK; sem camada central nem soak · L
§772–788 · performance do Photo Studio + history budget + save delta · NOVO/PARCIAL · canvas §324 sem budget · L
§789–809 · API projeção/cursor/batching + Service Worker/offline · NOVO/PARCIAL · studio.php monolítico; zero SW · L
§810–834 · preload por intenção, warm-up, context loss, background tab · PARCIAL · watchdog WebGL OK; hover carrega imediato · M
§835–858 · tiers de UI (glass/blur), performance modes, RUM, gate por asset · PARCIAL/NOVO · efeitos CSS alheios ao tier · M
§859–909 · testes de carga/soak/stress, pipeline Draco/KTX2, safe mode, dashboards · NOVO/PARCIAL · suíte é funcional, não de carga · L
§910–961 · percepção (sem spinner global, refinamento progressivo), culling/instancing, Renderer Contract · PARCIAL/COBERTO · fases §472 + stand-in §470; contrato §401 ≈ §941 · L
```

**Aceite P9**: baseline de runtime versionado (script determinístico) · budgets com gate automático · Quality Manager central com ordem de degradação (rosto por último) + Safe Mode · Resource Manager com refcount + teste de leak · virtualização real em toda lista grande · trabalho pesado fora da main thread com cancelamento por operation ID.

**Top lacunas P9**: Worker Pool + Scheduler + cancelamento global (L) · Quality Manager central (L) · virtualização real/DOM budget (L) · baseline de runtime + CI de regressão (M) · Resource Manager + leaks/soak (L).

## Parte 10 — Assets/Inventário/Coleções/Economia (§962–§1198)

```
§962–976 · Catálogo×Inventário×Equipado×Preview + Meu Inventário + origem · PARCIAL/NOVO · avatar_user_unlocks sem entidade user_asset nem tela · L
§977–998 · raridade 7 níveis + desbloqueio declarativo + progresso do lock · PARCIAL · RARIDADES + avatar_unlock_rules (1 regra); sem "faltam 2/9" · L
§999–1009 · XP/nível/conquistas · COBERTO · ProgressoPerfil + Conquistas + VidaLib.php · S
§1010–1034 · coleções hero/partial + Dshow Originals + eventos/temporadas · PARCIAL/NOVO · Colecoes.tsx; Missoes/Temporadas localStorage · L
§1035–1062 · economia + Reward Ledger idempotente + presets parciais/oficiais · PARCIAL · sem ledger; PresetsPessoais só completo · L
§1063–1096 · vitrine hub + asset details + variantes base+skin · PARCIAL/NOVO · Vitrine/MinhaVitrine; cores = itens separados · L
§1097–1115 · APIs/modelo de dados + domain events + retirement/legado · PARCIAL/NOVO · faltam user_assets/rewards/presets/achievements · L
§1116–1161 · content health, celebração, sync favoritos, resolver de conflito lock×preset · PARCIAL/NOVO · celebra por raridade OK; aplicarColecao não negocia · M
§1162–1191 · integridade, vitrine editorial sem deploy, empty states, a11y, deep link · PARCIAL/NOVO · sem rotas internas · M
```

## Parte 11 — Photo Studio 6.0 (§1199–§1446)

```
§1199–1206 · editor de composição total + Photo Project + workspace dedicado · PARCIAL · Foto.tsx 1998 linhas; ProjetosFoto salva bitmap · L
§1207–1212 · canvas pro (zoom/pan/grade/safe/guias/snap) · COBERTO · vista{zoom,x,y} + §324.2 · S
§1213–1227 · Layer System real + avatar como layer vivo · PARCIAL · camadasFoto opacidade+blend; sem painel/ordem/grupo/máscara · L
§1228–1248 · Camera Studio + Pose Library + Lighting Studio na foto · PARCIAL · câmera §176 e UAL existem no palco, não na foto; captura fixa em Idle · L
§1249–1284 · Background Studio + molduras família + auras + efeitos + Title Designer + emblemas · PARCIAL · §332–350 dão base; sem famílias/estilos/plate · L
§1285–1312 · Template Engine + formatos + derivados com reflow/constraints + context preview · PARCIAL/NOVO · 17 templates estáticos; reexporta sem reposicionar · L
§1313–1351 · export engine (WebP/fila/batch) + publish por contexto + histórico/crash recovery + colaboração · PARCIAL/NOVO · JPEG §369 + rascunho §362 · L
§1352–1401 · atalhos/multi-select/transform/estilos/LUT/a11y/saída animada · PARCIAL/NOVO · vinheta/granulação/nitidez; sem LUT · M
§1402–1439 · Photo CMS + licença/proveniência + modelo PhotoProject + APIs + analytics · NOVO/PARCIAL · localStorage puro, zero endpoint · L
```

**Aceite P10**: 4 estados distintos em banco/API/UI · ownership server-side declarativo · lock explica requisito · presets completos E parciais respeitando locks · rewards idempotentes com ledger · depreciado nunca quebra avatar antigo.
**Aceite P11**: editor real, não captura · projetos não destrutivos re-editáveis · derivados por reflow · publicação por contexto com preview e rollback · histórico/autosave/crash recovery · preview em resolução reduzida via Quality Manager.

**Top lacunas P10–P11**: entidade de inventário/ownership (L) · Photo Project serializado + API (L) · Layer System real (L) · derivados com constraints + context preview (L) · Reward Ledger + domain events (M).

## Parte 12 — IA contextual (§1447–§1693)

```
§1447–1454 · princípios + AI Core + abstração de provedor + funcional sem IA · PARCIAL/COBERTO · api/avatar/ia/ (ProvedorIA/FabricaIA/Anthropic) + fallback local 501 · M
§1455–1465 · Orchestrator + Context Resolver + tool calling + structured outputs · NOVO/PARCIAL · vida.php aceita só {pedido,catalogo}; ValidadorIA §636 · L
§1466–1475 · sandbox/preview/apply parcial/locks + AI Intensity · PARCIAL/NOVO · Consultor prevê/aplica tudo · L
§1476–1506 · Stylist/Outfit/Color Advisor/busca NL/embeddings/Curator · PARCIAL/NOVO · ConselheiroEstilo por regras; embeddings NOVO · L
§1507–1552 · IA no inspector, Photo Director, Help, Command Palette NL · PARCIAL/NOVO · PaletaComandos determinística · L
§1553–1576 · AI Jobs, custo/budget, cache semântico, memória de preferências · NOVO · chamada síncrona única · M
§1577–1608 · Prompt Registry + golden tests + flags por função + erros/retry/circuit breaker · NOVO/PARCIAL · prompt hardcoded ProvedorAnthropic.php:38 · M
§1609–1646 · injection/allowlist/authz + observabilidade/custo + admin console + assincronia · PARCIAL/NOVO · chave server-side + CSRF OK · L
§1647–1693 · identidade visual da IA, a11y, persona, QA de IA, aceite · PARCIAL/NOVO · CriarIA.tsx tem base · M
```

## Parte 13 — Identidade digital e social (§1694–§1911)

```
§1694–1698 · Identity Service + context variants + fallback · PARCIAL · Contextos.tsx é MOCK · L
§1699–1719 · perfil avançado + Minha Vitrine + galerias · PARCIAL/COBERTO · MinhaVitrine OK; galerias sem visibilidade/owner · M
§1720–1733 · share sheet + privacidade por conteúdo + Presence · PARCIAL/NOVO · Compartilhar.ts = share do SO · L
§1734–1766 · header/hover card/feed/comentários/notificações/saved · NOVO/PARCIAL · panel-user-notifications não integrado · L
§1767–1802 · comunidades/equipes/colaboração/aprovação/presets compartilhados · NOVO/PARCIAL · vitrine.php 'equipe' = leaderboard · L
§1803–1826 · creator profiles/reputação/rankings/eventos sociais/social search · PARCIAL/NOVO · ranking voluntário de coleção · L
§1827–1851 · AI social + external share/watermark + moderação + consentimento · NOVO/PARCIAL · marca d'água §372 · L
§1852–1878 · integração Dash (Pipedrive/Ads/…) + Universal Avatar Component + APIs (18 tabelas) + Ownership/Permissions · NOVO · cada painel tem avatar próprio hoje · L
§1879–1911 · a11y/responsivo/analytics/rollout 4 fases + auditoria de identidade existente · PARCIAL/NOVO · §1910 exige mapa de users/roles/teams ANTES de código · M
```

**Aceite P12**: IA desacoplada do provedor; Studio íntegro sem IA · toda ação persistente validada server-side; locks respeitados · propostas com diff/preview/histórico · busca semântica sobre catálogo real · chave só no servidor, allowlist, kill switch · trocar provedor sem tocar as UIs.
**Aceite P13**: Identity Service fonte única; fallback nunca quebra · perfil/vitrine/galerias funcionais · permissões server-side; privado nunca vaza · colaboração com versionamento · ownership explícito + moderação · domínio social separado do Avatar State.

**Top lacunas P12–P13**: Identity Service + Universal Avatar Component (bloqueia a promessa central) · Orquestração de IA (Orchestrator/Resolver/Tools) · sandbox/apply parcial/locks · Permissions Engine server-side · Prompt Registry + eval + observabilidade de custo.

**Dependências externas P12–P13**: chave IA (Anexo B) · provedor de embeddings (decisão nova) · geração de imagem ×decisão #24 (decisão do Jhony) · ~18 tabelas sociais + APIs + Permissions Engine (RUNBOOK-BANCO) · canal realtime (WebSocket/SSE inexistente) · mapa de identidade do Dash (§1910) · CDN de derivados.

## Parte 14 — Gamificação AAA (§1912–§2195)

```
§1912–1928 · princípios, XP anti-grinding, curva, rewards por nível · PARCIAL · ProgressoPerfil derivado (imune a farm); curva hardcoded · M
§1920–1924 · event bus + regras declarativas + ledger idempotente · NOVO · regras são funções TS (a "engine paralela" que §2194 proíbe) · L
§1929–1959 · Progression Hub + achievements tiers + missões CTA + challenges · PARCIAL · Conquistas v3 + Missoes 7 regras; sem hub/claim/submissão · L
§1960–1996 · eventos hub/archive + temporadas + títulos + badges/Collection Book · PARCIAL · Temporadas §248 client; Book NOVO · L
§1997–2035 · Power System (slots/máquina/VFX/áudio) + Companion System · PARCIAL/NOVO · PoderesFamilia §153; companion inexiste · L
§2036–2082 · Showcase engine + cards/Trophy Room + milestones/paths/wishlist · PARCIAL · Roteiros §175 + Evolucao §241; troféus NOVO · L
§2083–2123 · reward queue/inbox + legacy/migração + server authority + analytics · NOVO · 100% client-side (localStorage editável) · L
§2124–2195 · quality gates, notificações, profile modes, a11y, APIs, QA matrix · NOVO/PARCIAL · homologacao.mjs cobre parte · L
```

## Parte 15 — CMS Enterprise (§2196–§2640)

```
§2196–2207 · Registry central + category schema + CMS Dashboard/Health Score · PARCIAL/NOVO · avatar_assets + registry.php (as5.registry_api); sem UI · L
§2208–2245 · Asset Browser enterprise + detail + proveniência + pipeline 2D · NOVO/PARCIAL/COBERTO · fonte imutável OK; SvgSanitizer OK; grid admin NOVO · L
§2246–2289 · pipeline 3D (rig/sockets/clipping QA) + texturas + materiais/LOD/animação + Power Pipeline · PARCIAL/COBERTO · validar-asset §487 + webp 3 tamanhos + gate §631; clipping QA e power-as-asset NOVO · L
§2290–2337 · pipelines de companion/moldura/pose + Collection Editor + builders + dependency graph · NOVO/PARCIAL · avatar_asset_rules dá matéria-prima; nada consome · L
§2338–2398 · versionamento/diff/rollback + licenças enforcement + QA workflow + approval four-eyes · PARCIAL/NOVO · avatar_asset_versions + licenças; AdminGate binário · L
§2399–2452 · releases/canary/kill switch + RBAC/audit + lifecycle dashboards · PARCIAL/NOVO · publicar versão++/ETag + audit total; canary/papéis NOVO · L
§2453–2531 · batch/jobs/fork/lineage + Thumbnail Studio + search indexing + UX do CMS · PARCIAL/NOVO · gerar-thumbs-3d §508; sem superfície · L
§2532–2640 · global search, releases de conteúdo, ambientes/promoção, segurança CMS, runbooks, DoD · PARCIAL · deploy-as5.sh smoke de CÓDIGO; registry×admin já separados §2575 · M
```

**Aceite P14**: progressão server-authoritative · regras declarativas versionadas + rewards idempotentes · missões com CTA e eventos reais · títulos/badges/troféus entidades distintas · poderes com sistema próprio e fallback · Showcase data-driven + histórico auditável.
**Aceite P15**: Registry fonte única + categorias data-driven · browser p/ dezenas de milhares server-side · pipelines idempotentes · dependências com impact analysis · versionamento com rollback + licença bloqueando publicação · releases reversíveis + RBAC + audit + Draft nunca vaza.

**Top lacunas P14–P15**: Progression Engine declarativo + ledger (L) · server authority/anti-abuso (L) · superfície de CMS — backend existe sem UI, maior alavanca de escala (L) · dependency graph/impact analysis — risco direto à byte-stability (L) · Power/Showcase como assets versionados (L).

**Backend novo P14–P15**: tabelas de progressão (profiles/ledger/rules/achievements/missions/events/seasons/titles/badges/powers/trophies) · APIs `/avatar/progression|achievements|missions|events|powers` + admin grant/simulate · Reward Service com idempotency key + espelho PHP · ingest com quarentena, fila de jobs, RBAC multi-papel, licenças com expiração, índice server-side, signed URLs, webhooks. Aproveitável: avatar_catalog_audit, admin.php publicar (ETag), avatar_asset_versions/_files, avatar_licenses, par registry.php/admin.php.

## Parte 16 — Quality Engineering (§2641–§3044)

```
§2641–2653 · quality gates + pirâmide + golden journeys · PARCIAL · deploy gate + 93 e2e; sem unit/component · M
§2654–2667 · Golden Avatars + regressão visual com baseline/diff · NOVO · screenshots são só evidência · L
§2668–2699 · determinismo (seed/freeze) + layout regression + combinatória/nightly · PARCIAL/NOVO · navegador.mjs double-RAF; suíte fixa sequencial · L
§2700–2751 · clipping detection + morph/pose/hair QA + foto/preset/progressão QA · NOVO/PARCIAL · sockets-3d cobre encaixe, não penetração · L
§2752–2810 · AI evaluation + CMS QA + a11y engineering + device matrix · PARCIAL/NOVO · só Chromium headless; sem axe · L
§2811–2870 · performance regression/memória/soak + chaos + security QA · PARCIAL/NOVO · orcamento.mjs + gate de peso; sem chaos/security · L
§2871–2900 · contract tests + i18n QA + QA por componente · PARCIAL · portabilidade/manifest/i18n/shell-save cobrem parte · M
§2901–3044 · Quality Command Center + ownership/SLA + test data factory + Test Lab + PR gates + KPIs/sharding · NOVO · SEM CI (.github/workflows ausente); suíte ~15min sequencial é o teto · L
```

## Parte 17 — Security/Privacy/Reliability (§3045–§3386)

```
§3045–3068 · threat model + RBAC/ABAC/deny by default · NOVO/PARCIAL · AdminGate allowlist fail-closed, sem papéis · L
§3069–3103 · object-level authz/IDOR + validação/rate limit + CSRF/CSP + XSS/SVG · COBERTO/PARCIAL · studio.php user_id da sessão + SvgSanitizer fail-closed; CSP/SRI NOVO · M
§3104–3136 · signed URLs + upload (image bomb/EXIF) + cripto + secrets/rotação · PARCIAL · GD re-encode 480×480 mata EXIF; sem AV/rotação · M
§3137–3163 · redaction + Audit Log imutável + privacy by design/retenção/export · NOVO · Log.ts é client-side; só retenção de 100 versões · L
§3164–3216 · share tokens + AI privacy + supply chain/SBOM + infra/least privilege · PARCIAL/NOVO · flag ia_assistiva = kill switch; sem scan · L
§3217–3269 · backup RPO/RTO/PITR/drills + DR plan + degradação/circuit breaker/health · PARCIAL · /backup + revert-all + runbook; sem agenda/drill · L
§3270–3336 · SLO/error budgets + integridade/migração expand-contract + headers + error tracking + Security Command Center · PARCIAL/NOVO · 409 base_version + espelho §619 OK · L
§3337–3386 · testes de segurança (SQLi/SSRF/escalation) + docs/runbooks/DoD · NOVO/PARCIAL · runbooks cobrem ~30% · L
```

**Aceite P16**: golden avatars + render determinístico · regressão visual e combinatória automatizadas · clipping com processo · IA com eval suite · perf regression + a11y no CI · chaos + Safe Mode testados · Command Center: em incidente, responder em minutos o quê/quando/qual release/afetados/rollback.
**Aceite P17**: authz server-side centralizada + IDOR testado · uploads sanitizados, drafts privados, secrets fora do front/logs · AI allowlist + sharing revogável · privado nunca vaza p/ busca/feed/logs/prompts · falha de subsistema não derruba edição · backups com alerta, restore testado, RPO/RTO definidos.

**Top lacunas P16–P17**: baseline visual versionada + diff (maior ROI; casa com byte-stability) · CI ausente (pré-condição de tudo) · Golden Avatars/dataset versionado · Audit Log server-side + RBAC formal · backup agendado com RPO/RTO + restore drill.

**Infra nova P16–P17**: runner de CI com Chromium/artefatos · storage de baselines com retenção · tabela append-only de audit + Permissions Service · cron de backup + destino imutável + ambiente de restore · headers/CSP no nginx (fora do repo) · Command Center (agregação+API+painel) · scanner de deps/SBOM/secrets · runners com GPU real (hoje só SwiftShader).

---

## Conclusão da FASE 0

Ordem de ataque (caminho crítico §3463 + P0 §3451): **State → tokens/registry → Workspace → Creator**, com QA foundation (golden avatars + regressão visual) em paralelo enxuto. Mapa de ondas 741–840 e decisões #74–#76 no doc de projeto `claude/21-plano-as6.md`. Blocos de backend (Partes 10/13/14/15/17) entram por migração via RUNBOOK-BANCO quando os pré-requisitos com o Jhony destravarem.
