# Track C Mobile — Auditoria de Contraste (automatizada)

Teste: `mobile-contrast-audit.mjs` (razão WCAG de fg/bg efetivo, 390×844, flag
ON). Limiar: 4.5 texto normal; 3.0 texto grande (≥18px ou ≥14px bold).

## Resultado por estado

| Estado | fg | bg | razão | limiar | veredito |
|---|---|---|---|---|---|
| shell texto base | branco-gelo | superfície-1 | 16.08 | 4.5 | ✓ |
| categoria | branco-gelo | superfície-3 | 14.56 | 4.5 | ✓ |
| categoria ativa | branco-gelo | superfície-3 | 14.56 | 4.5 | ✓ |
| card nome | branco-gelo | superfície-1 | 16.08 | 4.5 | ✓ |
| texto secundário | branco-gelo | superfície-3 | 14.56 | 4.5 | ✓ |
| seção catálogo (bold) | branco-gelo | superfície-1 | 16.08 | 4.5 | ✓ |
| filtro chip (ativo) | branco | acento rgb(124,92,255) | 4.35 | 4.5 | ≈ HERDADO |

## Classificação

- **CONTRAST_VIOLATIONS introduzidas pelo Track C: 0.** A composição mobile só
  reflui LAYOUT; não define cores de texto próprias.
- **1 herdada do tema Track A:** o chip de filtro ativo (texto branco sobre o
  acento roxo) mede 4.35:1 — 0.15 abaixo do limiar de texto normal. É **idêntico
  no desktop** (flag OFF), confirmado. É decisão de **token de tema (Track A)**,
  fora do escopo do Track C; ajustá-la afetaria o desktop aprovado. Registrada
  como P2.

## Pendente de device/leitor de tela

Contraste percebido em telas OLED/brilho real, modo de alto contraste do SO e
daltonismo → validação humana (kit de device).
