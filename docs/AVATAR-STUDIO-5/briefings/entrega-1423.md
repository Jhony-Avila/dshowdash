# Onda 1423 — Fase A do BRIEFING_CORRETIVO_01: Candidate Mode, Before×After, UX 3D simples, Upgrade Premium (decisões #212–#215)

> Entrega 2026-08-22 — primeira onda do briefing corretivo (registrado em `briefings/BRIEFING_CORRETIVO_01.md`, sha `584c7ecff362d1cf…`). Relatório no FORMATO NOVO (§103).

## 1. O que mudou

Candidate Mode (preset das 14 flags §12 + URL `?avst_candidate=1` + botão no QA Studio), matriz de flags efetivas no QA Studio (§16/§113), UI 3D simplificada atrás de `as6.ux3d_simples` (#213 — técnicos p/ "Avançado"), Upgrade Legacy→Premium com preview e aprovação explícita (#214 — `montarCandidatoPremium` + banner Ver comparação/Atualizar/Manter), gerador de Before×After (`qa-visual/before-after.mjs` — 8 casos 2D + 8 casos 3D + UX), doc `GATES-VISUAIS.md` (gates A/B/C + tabela de assets §38). **2 bugs reais achados PELO Before×After e corrigidos**: (a) cadeia de pós v2 sem `OutputPass` → saída linear (pele bronze); (b) look Hero estourado → recalibrado (versao 2); (c) bonus: arte de aura com atributo XML cru (`data-nucleo` sem valor) quebrava parsers estritos (export PNG) → corrigido + goldens p13–p16 regravados (#83).

## 2. Onde aparece para o usuário

- QA/Jhony: `?avst_candidate=1` liga a experiência candidata INTEIRA em produção (só no browser dele); QA Studio mostra matriz + botão.
- Com candidate ON: catálogo premium visível, barra Premium, palco 3D com looks/câmera/lentes e UI simples; banner de upgrade aparece p/ avatar legado salvo.
- Usuário final: NADA muda (flags padrão OFF) até os gates aprovarem (§14).

## 3. Flag efetiva

Novas: `as6.ux3d_simples` (OFF; no preset candidate). Preset NÃO muda defaults (§11 — nada de false→true cego).

## 4–5. Screenshots Before/After

17 pranchas enviadas no chat (A1 2D ×8, A2 3D ×8, A3 UX ×1); cópia em `scripts/avatar/testes/saida/before-after/` (fora do git #158). Regenerar: `node scripts/avatar/qa-visual/before-after.mjs`.

## 6. Resultado visual (avaliação honesta)

- 2D: rosto com mais estrutura mas rostos ainda "irmãos" (§18 → REWORK na Fase B); `cab_px_curto` afinou (REWORK); roupas/full/ambiente com salto claro.
- 3D: ENGINE 8/10 · ART 4/10 (§33). Câmera v2 = maior ganho visível. Pele ~1 ponto acima no brilho. Teto = asset (ART BLOCKED §38 — tabela no GATES-VISUAIS.md).
- UX: modo simples remove ~60% dos controles do fluxo principal (provisório; IA definitiva na Fase E).

## 7. Gate afetado

A = CANDIDATE · B = CANDIDATE · C = CANDIDATE (todos aguardando veredito visual do Jhony).

## 8. Performance

Bundle entry 509 KB (teto 515); Renderizador3d 61,5 KB (teto 62); OutputPass só existe quando a cadeia v2 está ativa (flag OFF = zero custo).

## 9. Testes

Suíte 154→**155** (`corretivo-a.mjs`: preset §12 exato sem flags DEV, liga/desliga preservando overrides, matriz, upgrade com preview e "Manter" persistente, UX simples esconde/devolve técnicos, XML da arte válido); goldens p13–p16 regravados no MESMO commit (#83, fix XML da aura); harness ganhou seed de avatar salvo (`avst.harness.config`).

## 10. Rollback

`as6.ux3d_simples` OFF = UI byte a byte; candidate OFF (`?avst_candidate=0`/botão) remove SÓ o preset; upgrade nunca migra sozinho (§5 — aplicar exige clique; "Manter" persiste a dispensa); OutputPass/hero v2/aura fix só aparecem com flags ON.

## Decisões (registro #45)

- **#212** Candidate Mode = preset do mecanismo de flags existente (FLAGS_CANDIDATE, §12 exato, sem flags DEV) + URL `?avst_candidate` + matriz de flags no QA Studio. Nenhum default muda nesta onda (§11).
- **#213** UX 3D simples via `as6.ux3d_simples`: modo provisório esconde qualidade/ajuste fino/cinema/poses/cenas/showcase/turntable/ficha/marca/tinta/comparar atrás de "Avançado"; essenciais (personagem, cabelo/barba/roupa, animações, capturar, lentes, fundos, looks, câmera, tela cheia) ficam. IA definitiva (§54) na Fase E.
- **#214** Upgrade Legacy→Premium: `montarCandidatoPremium` (puro, nunca muta, usa SUCESSOR_PREMIUM±GATE) + banner com preview lado a lado; aplicar SÓ por clique; dispensa persistida. Nunca migração silenciosa (§5–§6).
- **#215** Before×After vira ferramenta oficial de gate (gerador próprio; hash NÃO é gate visual §8). Correções que ele pegou: OutputPass na cadeia v2 (three moderno não aplica tone mapping/sRGB em render target), Hero v2 recalibrado, `data-nucleo="1"` (XML válido). Goldens afetados regravados (#83).

## Precisa do Jhony

- **VEREDITO dos 3 gates** (APPROVED/REWORK por área) com base nas 17 pranchas → direciona a Fase B (rework 2D) e a Fase F (default ON §97).
- Colar o colar-1423 quando enviado.
