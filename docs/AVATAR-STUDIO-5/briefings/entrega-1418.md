# Onda 1418 — Photo Mode 2D, Vitrine, presets e ROLLOUT Classic Premium (MEGA_BRIEFING_01 P10-G, P3-G, P4-H 2D, §2559–§2560; decisões #202–#203)

> Entrega 2026-08-21 — **a onda do GATE ★ que fecha a Fase 1**. Flag nova: `as6.cp_foto` (OFF, filha de `classico_premium`). OFF = byte a byte (regressão 111/111; goldens anteriores intocados). A VIRADA da flag `as6.classico_premium` é EXCLUSIVA do Jhony (gate §2560 — roteiro no checklist).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **Photo Mode 2D do avatar** (#202): `ExportAvatar` — `svgExport` puro/determinístico em 5 framings (full/bust/portrait com crop de rosto/square/vertical), toggles fundo/moldura/efeito, **transparente** (PNG alpha), SVG congelado (sem SMIL); `rasterizarExport` (canvas 2×, PNG/WebP) e `nomeExport` canônico; botão "Exportar PNG" na barra premium (`data-teste="export-avatar"`, sob `as6.cp_foto`); **a foto usa o MESMO config do avatar** (§321) | `services/ExportAvatar.ts`, `ShellStudio.tsx` | P10-G |
| 2 | **Presets C03–C06** + **coleção "Classic Premium"** (#202): Boardroom/Off-duty/Neon/Gala — looks completos do trilho (rosto+cabelo+outfit+ambiente); `colecoesAtivas()` esconde a coleção sem a flag (Colecoes/Vitrine/MinhaVitrine migradas) | `AvatarCatalog.ts`, 3 componentes | P3-G |
| 3 | **`configInicial()`** (#203): avatar NOVO nasce no golden com o trilho ligado; flag OFF = `CONFIG_PADRAO` byte a byte; nunca toca avatar existente (`App.tsx` semeia por ela) | `AvatarCatalog.ts`, `App.tsx` | §2560 |
| 4 | **SUCESSOR dos defaults GATED** (#180→#202): `SUCESSOR_PREMIUM_GATE` (bas_classica/olh_padrao/boc_sorriso/cab_curto/rou_social) só vale com a flag ON via `sucessorDe()` — OFF mantém o kit padrão destacável (teste [L] trava) | `QualidadeVisual.ts` | #180 |
| 5 | **Vitrine nunca destaca Legacy** (#202): prateleiras filtram itens com sucessor premium (`ehDestacavel`, sob `as6.avatar_visual_v2`); **thumbs por categoria** nos cards de coleção (`svgItemIsolado` + foco §68, cache local, `data-teste="colecao-pecas"`) | `Vitrine.tsx`, `Colecoes.tsx` | §163 |
| 6 | **Look Face + randomize facial homologado** (#203): `LOOKS_FACE` (5 rostos completos curados: base+olhos+boca+sobrancelha+nariz+íris), `aplicarLookFace` (SÓ o rosto — roupa fica), `randomizeFacial` (PRNG por semente, sorteia APENAS production/premium/hero — nunca prototype/legacy §2559); barra na grade da base (`data-teste="look-face-*"`, `look-face-random`) | `services/LookFace.ts`, `GradeItens.tsx` | P4-H |
| 7 | **UI do gate**: barra premium no palco (`data-teste="premium-bar"`) — toggle de ACABAMENTO (`toggle-acabamento`, comando com undo), seletor de LOOKS 2D (1417; `data-look` no palco, localStorage, apresentação pura), export | `ShellStudio.tsx`, `estudio.css` | P8-F |
| 8 | **Checklist DoD §2559 + roteiro do gate §2560**: doc executável com os 18 critérios (todos ✅ automatizados) e o roteiro de validação do Jhony (flags de console, sequência, perguntas do briefing, vias de aprovação/reprovação/rollback) | `docs/AVATAR-STUDIO-5/CHECKLIST-DOD-CLASSICO-PREMIUM.md` | §2559–§2560 |
| 9 | **Testes**: seção [L] (25+ asserts: export determinístico/congelado/toggles, presets válidos renderizando, coleção gated, configInicial byte-estável, defaults gated, Look Face não troca roupa, randomize homologado determinístico) + goldens **e01–e03 + p16** — baseline 31→35; orcamento-2d 110→115 (0 erros; gala no corpo = pior caso); pesos entry 515/catalogo-arte 436 | `golden-classic.mjs`, `orcamento-2d.mjs` | #83 |

## Decisões (registro #45)

- **#202** Export é FUNÇÃO PURA sobre o config (o mesmo do avatar — §321): toggles derivam um config efêmero, nada persiste; rasterização é conveniência do navegador. Sucessores dos defaults via `sucessorDe()` (tabela `SUCESSOR_PREMIUM_GATE` gated pela flag) — o #180 fecha sem quebrar o destaque do kit padrão enquanto OFF. Vitrine filtra legacy no cliente (dados do servidor intocados).
- **#203** `configInicial()` decide na LEITURA (flag) — sem migração, sem campo novo; avatar existente nunca muda. Look Face é preset PARCIAL (só rosto) e o randomize facial é semeado (reprodutível) e homologado (§2559). Looks 2D ficam em localStorage (apresentação §651-free — nunca no config).

## Precisa do Jhony (GATE §2560 — bloqueia SÓ a virada da flag)

- Seguir o roteiro do `CHECKLIST-DOD-CLASSICO-PREMIUM.md` (flags no console → presets → export) e dar o VEREDITO. Aprovado → eu ligo `as6.classico_premium` (+ filhas que você escolher) no padrão em onda de rollout. Reprovado → aponte as peças; ajustes viram ondas de correção.

## Fase 1 COMPLETA (1411–1418). Próxima: Fase 2 — 3D premium sem assets (1419–1426, mapa claude/41).
