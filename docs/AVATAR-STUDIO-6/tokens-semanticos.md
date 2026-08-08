# AS6 L0 — Tokens semânticos + Motion registry (lote 761–770)

> §576–§586 e §561 do `docs/AVATAR_STUDIO_6.md` · decisão #78 · 2026-08-08.

## Cor semântica (§582–§586)

11 hex que viviam soltos no `estudio.css` (~380 ocorrências) viraram
tokens em `styles/tokens.css`, com os MESMOS valores (pixel a pixel
igual por construção):

| Token | Valor | Papel |
|---|---|---|
| `--as6-superficie-0` | `#0a0d15` | fosso (palco profundo/vitrines) |
| `--as6-superficie-1` | `#0d1017` | fundo do estúdio |
| `--as6-superficie-2` | `#12151d` | faixas/trilhos |
| `--as6-superficie-3` | `#161b26` | cartões/controles |
| `--as6-superficie-4` | `#232a38` | bordas/realces |
| `--as6-texto-forte` | `#e6eaf2` | texto principal |
| `--as6-texto-suave` | `#8a93a6` | texto secundário |
| `--as6-acento` | `#7c5cff` | violeta Dshow |
| `--as6-atencao` | `#e8b64c` | avisos |
| `--as6-perigo` | `#ff5230` | erro/destrutivo |
| `--as6-sucesso` | `#39d98a` | confirmação |

**Doutrina (vigiada pelo `tokens-as6.mjs`)**: esses hex NUNCA mais
aparecem soltos no `estudio.css` — hex novo em CSS = usar/criar token.
Os tokens são constantes de tema escuro por enquanto (os hex soltos
também não reagiam ao tema claro — comportamento preservado); o light
mode com direção própria (§577) entra em lote futuro COM flag, porque
aí muda pixel.

## Motion (§561)

- Easings nomeados: `--t-ease-suave` / `--t-ease-elastico` /
  `--t-ease-saida` (valores em uso capturados do CSS).
- `REGISTRO_ANIMACOES` em `shell/movimento.ts`: as 28 `@keyframes` do
  `estudio.css` catalogadas (nome → categoria + propósito). Paridade
  vigiada nos DOIS sentidos pelo teste — keyframe sem registro ou
  registro órfão = suíte vermelha.

## Por que sem flag

Refatoração byte-idêntica: CSS custom property não é gateável e nenhum
pixel muda. Rollback = `git revert`; guardrails = suíte de screenshots
existente + `tokens-as6.mjs`. Interpretação da regra §651 registrada na
decisão #78. A flag `as6.tokens` fica reservada para a primeira mudança
de VALOR (temas).
