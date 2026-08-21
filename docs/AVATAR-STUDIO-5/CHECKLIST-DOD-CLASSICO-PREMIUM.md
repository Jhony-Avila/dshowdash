# Checklist DoD — Classic Premium (MEGA_BRIEFING_01 §2559) e gate §2560

> Onda 1418 (decisão #203). Este é o Definition of Done do trilho CLASSIC
> PREMIUM 2D (ondas 1411–1418). Tudo abaixo está automatizado nos testes —
> a última linha (veredito visual) é EXCLUSIVA do Jhony (§2560).

## DoD §2559 — estado por item

| # | Critério | Estado | Prova |
|---|---|---|---|
| 1 | Motor premium atrás de flag desligável (`as6.classico_premium`), rollback §651 byte a byte | ✅ | golden-classic [B]/[G]/[H]/[I]/[J]/[K] + regressão visual 111/111 |
| 2 | Byte-stability: avatar salvo NUNCA muda (campo neutro omitido; espelho PHP de todo campo novo) | ✅ | goldens g01–g16 + [B]; `studio.php` espelhado (acabamento, coresFace, expressao, idade, secundario, camadas novas) |
| 3 | Zero filtros SVG no trilho premium (SvgSanitizer intocado) | ✅ | [C]/[K] + orcamento-2d (110 casos, ≤4 filtros) |
| 4 | Golden Faces (8 bases + 8 olhos + 8 bocas `_px_`) | ✅ | 1412, casos p03–p06 |
| 5 | Golden Hair (10 cabelos, compat §897 headwear) | ✅ | 1413, h01–h06 + p07–p08 |
| 6 | Rosto v2: barba/sobrancelha/nariz + expressões + idade + assimetria | ✅ | 1414, f01–f04 |
| 7 | Golden Outfits (roupas, calça independente, calçados, scaffold v2) | ✅ | 1415, p09–p11 |
| 8 | Acessórios premium + contrato de fit §617 + paridade semântica | ✅ | 1416, p12 |
| 9 | Ambiente premium (fundos em planos, auras, molduras) + looks 2D | ✅ | 1417, p13–p15 |
| 10 | Orçamento §2510 verde em TODO item premium (busto ≤40 KB/600 nós; corpo ≤80 KB) | ✅ | orcamento-2d.json (0 erros) |
| 11 | Baseline golden própria do trilho (sha256 por caso, doutrina #83) | ✅ | golden-classic.json (31+ casos) |
| 12 | Presets Golden (Ele/Ela) + C03–C06 + coleção "Classic Premium" | ✅ | 1418, [L] |
| 13 | Photo Mode 2D do avatar (framings, PNG/WebP, transparente, toggles) | ✅ | 1418, `ExportAvatar` + [L] |
| 14 | Vitrine nunca destaca Legacy; sucessores dos defaults GATED (#180/#202) | ✅ | [L]; `SUCESSOR_PREMIUM_GATE` só com a flag |
| 15 | `configInicial()` premium para avatares novos (nunca altera existentes) | ✅ | [L] |
| 16 | Look Face + randomize facial homologado (nunca prototype/legacy) | ✅ | [L] |
| 17 | UI: toggle de acabamento, looks 2D, canais/materiais, contador de acessórios | ✅ | data-teste: toggle-acabamento, look-*, chip-material, acess-* |
| 18 | Suíte completa verde (150 testes) em TODAS as ondas do trilho | ✅ | rodar-todos (registrado por onda) |

## Gate §2560 — SÓ o Jhony

1. Ligar no console: `localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as6.classico_premium': true, 'as6.face_v2': true, 'as6.barba_slot': true, 'as6.brow_slot': true, 'as6.roupa_premium': true, 'as6.acess_2d_premium': true, 'as6.cp_foto': true }))` e recarregar.
2. Roteiro de validação: presets Golden (Ele/Ela) e C03–C06 → trocar íris/expressão/idade → cabelos com chapéu (recorte §897) → outfits no corpo inteiro → coroa/asas (massa atrás) → BG01–BG06 no palco (parallax) → auras (núcleo no slider) → looks 2D → exportar PNG (busto e transparente).
3. Perguntas do briefing (§708 etc.): "os 4 rostos parecem irmãos?", "o premium lê como OUTRO NÍVEL ao lado do clássico?".
4. Veredito: **aprovado** → ligar `as6.classico_premium` (+ filhas desejadas) no padrão do `nucleo/flags.ts` (1 linha por flag, commit "rollout §650 do Classic Premium") — deploy pelo fluxo de sempre. **Reprovado** → apontar as peças; cada ajuste vira onda de correção com golden regravado (doutrina #83).

## Rollback (sempre disponível, §651)

Desligar `as6.classico_premium` reverte TUDO (catálogo, render, UI) byte a byte — provado por teste em toda onda. Configs salvos com peças premium continuam válidos (POR_ID) e voltam a renderizar premium quando a flag religa.
