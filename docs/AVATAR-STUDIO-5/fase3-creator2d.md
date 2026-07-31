# AS5 — Fase 3: Character Creator 2D (checklist P2 + plano)

**Fontes lidas:** P10 §627–§628 (prioridades P0/P1/P2 + backlog do catálogo) · P2 índice completo (§51–§98) + seções normativas §68–§71 na íntegra · **P3 COMPLETA via índice (§99–§146, linhas 3389–5227)** + normativas §107.5/§122–§125/§135–§141.

## Mapa P3 → destino (lida no turno C2)

A Parte 3 é majoritariamente 3D/conteúdo — cada bloco tem dono:

| Seções | Tema | Destino |
|---|---|---|
| §101–§103 espécie/tipo corporal/idade · §104–§112 rosto avançado/morphs/pele/olhos/nariz/boca/orelhas · §113–§115 cabelo/barba/marcas · §116–§121 expressões/personalidade/postura/idle/emotes/voz · §124 materiais 3D · §131–§133 câmera/iluminação/pose | exige rigging/morphs/arte nova | **F5 (slice 3D, P8) + F9/P11 (conteúdo)** — bases 2D já cobrem espécie parcialmente (decisão #33) |
| §107.5 canais de cor · §122 roupas por partes · §123 editor por regiões · §125 padrões | vestuário modular 2D-aplicável | **C3** (expansão usaCores → canais nomeados; slots de roupa além do único atual exigem arte → plano de conteúdo F9) |
| §134 criação guiada · §135 randomização inteligente (modos/preservar/coerência) · §137 comparação | fluxos de criação | **P1'** (§90 aleatório já respeita bloqueios do §70.1 — mesma infra) |
| §136 presets pessoais · §138 histórico granular · §139 autosave de rascunho | persistência | **F4 (§629)** — histórico granular = pilha de comandos do núcleo (nomes já registrados); autosave = draft do §619 |
| §140 estados de carregamento | skeletons | R10 pendente — liga com registry (flag as5.registry_api) |
| §141 econômico/premium · §142–§144 critérios de aceite | transversal | F7 (§633 qualidade) / DoD §644 |

## Mapa REQUISITO → estado (P2)

**JÁ COBERTO (4.6 + F2):** §54 cabeçalho · §55 tabs · §58 ordenação (menos popularidade→telemetria futura) · §59–§61 cards/estados/raridade (pips, NOVO, lock) · §62–§63 thumbs por categoria (FOCO_THUMB, SVG determinístico) · §66 hover card (Dica portal) · §79–§83 títulos/emblemas/fundos/molduras/banners · §84–§86 coleções/desbloqueio/vitrine · §87 favoritos server-side · §88 recentes · §91–§92 feedbacks/vazios · §93 responsividade · §94 persistência · §95 telemetria (parcial).

**GAPS priorizados:**
- [ ] C1a §64 HOVER PREVIEW NO PALCO: hover no card → store.visualizar (preview §608 JÁ EXISTE no núcleo — só ligar); sair → limparPreview.
- [ ] C1b §70 PAINEL "EQUIPADOS": lista slot→item com remover/trocar(abre categoria)/favoritar + §70.1 BLOQUEAR slot (Set em prefs; aleatório/presets/IA respeitam).
- [ ] C1c §69.1 UX DE CONFLITO: modal "Equipar X removerá Y" (Cancelar/Equipar e substituir) alimentado por avaliarRegras + troca implícita de slot exclusivo (hoje silenciosa).
- [ ] C1d §57 BUSCA INTELIGENTE: normalização de acentos/caixa + múltiplos termos (AND).
- [x] C2 §68 SLOTS MÚLTIPLOS 2D ✅: chips Todos/Cabeça/Rosto/Pescoço (§68.3, `filtroSlot` no GradeItens) + resumo "N equipados · nomes" (§68.2) na categoria Acessórios; crescimento além dos 3 slots exige ARTE nova (plano de conteúdo F9/P11).
- [x] C2 §71 PERSONALIZAÇÃO POR ASSET ✅: framework completo — `engine/params.ts` é a FONTE ÚNICA (registro por categoria + sanitização + aplicação SVG sem tocar nas artes: opacity/reescala de `dur` SMIL/scale no centro declarado); `AvatarConfig.params` opcional e byte-estável (padrão nunca persiste, validarConfig grampeia); roundtrip nos adaptadores (`appearance.params`); UI `PropriedadesAsset` com sliders (arrastar=preview §608, soltar=comando com undo, Restaurar). Primeiras entregas: aura intensidade/velocidade, emblema escala. Óculos/headset/fundo/título do §71 aguardam arte paramétrica (F9). O schema do registry (§614 properties_schema_json) passa a alimentar este mapa quando a flag as5.registry_api ligar.
- [x] BUG F1 CORRIGIDO (achado pela guarda de no-op da C2): `checksumEstado` usava replacer-array do JSON.stringify = WHITELIST RECURSIVA — ignorava equipment.*/body.base e igualava estados diferentes (quebraria o lock otimista §619.1 em produção). Agora serialização canônica com chaves ordenadas em todos os níveis + testes de regressão.
- [ ] C3 §72–§75 canais de cor por camada de roupa + paletas + materiais 2D (expansão do engine usaCores → canais nomeados).
- [ ] P1' §56 filtros combinados em popover · §65 comparação no shell · §67 drawer completo de detalhes · §89 recomendações contextuais · §90 aleatório respeitando bloqueios.

## Ordem de execução

C1 (a–d: gaps com infra pronta, alto valor) → LER P3 → C2 (slots+propriedades) → C3 (canais de roupa) → P1' conforme couber antes da F4. Skeletons (R10 pendente) entram quando o catálogo assíncrono via registry ligar (flag as5.registry_api).
