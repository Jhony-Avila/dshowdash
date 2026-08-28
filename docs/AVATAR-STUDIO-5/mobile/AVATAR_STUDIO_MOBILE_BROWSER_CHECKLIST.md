# Avatar Studio — Checklist de Navegadores Mobile (Track C)

Cobertura automatizada: Chromium (Playwright) na matriz de viewports. Os demais
motores dependem de recursos com fallback já embutido — abaixo, o mapa de
compatibilidade e o que **precisa** de validação humana em device real.

## 1. Recursos usados e suporte

| Recurso | Chrome/Android | Safari/iOS | Firefox | Fallback embutido |
|---|---|---|---|---|
| `100dvh/svh` | ✅ | ✅ (15.4+) | ✅ | `100vh` + `@supports` |
| `env(safe-area-inset-*)` | ✅ | ✅ | ✅ | `, 0px` (fallback 0) |
| `VisualViewport` | ✅ | ✅ | ✅ | no-op se ausente |
| `scroll-snap` | ✅ | ✅ | ✅ | rola normal sem snap |
| `matchMedia` + `orientationchange` | ✅ | ✅ | ✅ | `resize` cobre |
| `-webkit-mask-image` (fade) | ✅ | ✅ | ✅ (`mask-image`) | ambos declarados |
| `touch-action` | ✅ | ✅ | ✅ | comportamento padrão |
| `accent-color` (sliders) | ✅ | ✅ | ✅ | thumb custom `-webkit`/`-moz` |
| `font-size:16px` anti-zoom iOS | n/a | ✅ | n/a | inócuo nos demais |

Nenhum recurso é *load-bearing* sem fallback: em um motor que não suporte X, o
produto degrada para o comportamento base — nunca quebra.

## 2. Checklist manual (device real — Jhony)

- [ ] iOS Safari: notch respeitado (safe-area) em retrato e paisagem.
- [ ] iOS Safari: teclado não cobre o campo; barra de salvar reaparece ao fechar.
- [ ] iOS Safari: sem zoom automático ao focar campo (font 16px).
- [ ] Android Chrome: barra de URL sumindo/aparecendo não corta o palco (svh/dvh).
- [ ] Android Chrome: trilho de categorias rola e faz snap.
- [ ] Ambos: girar o device liga/desliga a composição sem recarregar.
- [ ] Ambos: ferramenta abre full-screen e fecha voltando ao shell.
- [ ] Ambos: salvar faz POST e persiste (validação de sessão autenticada).

## 3. Nota

Validação **visual** e de **sessão autenticada** é sempre do Jhony (regra do
projeto). Este checklist é o roteiro; o verde automatizado cobre estrutura,
layout e ausência de erro — não substitui o olho no device.
