# Track C Mobile — Auditoria de Contraste (0 violações)

Teste: `mobile-contrast-audit.mjs`. Após o Marco 12, superfícies de preenchimento
acento com texto branco usam rgb(116,84,224)=5.14:1 (isolado data-mobile).

| Estado | razão | limiar | veredito |
|---|---|---|---|
| shell texto base | 16.08 | 4.5 | ✓ |
| categoria / ativa | 14.56 | 4.5 | ✓ |
| card nome | 16.08 | 4.5 | ✓ |
| texto secundário | 14.56 | 4.5 | ✓ |
| seção catálogo (bold) | 16.08 | 3.0 | ✓ |
| filtro chip (fill) | 5.14 | 4.5 | ✓ (era 4.35) |
| botão primário (fill) | 5.14 | 4.5 | ✓ |
| chip pressionado (fill) | 5.14 | 4.5 | ✓ |

```
MOBILE_CONTRAST_VIOLATIONS=0
MIN_NORMAL_TEXT_CONTRAST=5.14 (>=4.5)
MIN_LARGE_TEXT_CONTRAST=16.08 (>=3.0)
FOCUS_INDICATOR_VISIBLE=YES (:focus-visible outline 3px rgb(150,170,255))
```

Fix isolado no mobile (bordas/sombras/tints seguem o token aprovado → sem
divergência de forma; desktop intocado). Contraste percebido em OLED/alto
contraste/daltonismo = device real (kit).
