# Track D — Acessibilidade (estado + pendências)

## Já endereçado nesta onda (CSS, sob o marcador)
- **Alvos de toque ≥44×44** em header, bottom-nav e footer (eram 22–40px).
- **Safe-areas**: `env(safe-area-inset-*)` em header (top), bottom-nav e footer (bottom).
- **prefers-reduced-motion**: `.ticker-track` para de animar (gap real corrigido);
  transição do drawer também respeita reduced-motion.
- **Popovers do header** presos à viewport (não estouram; scroll interno).
- **Foco visível**: preservado (não alterado; herda o do shell).

## Pendências de A11y que exigem mudança de JS/DOM (próxima onda — ver AUDIT)
Estas são **comportamentais** e tocam TS compartilhado do shell; ficam
documentadas com file:line e NÃO foram aplicadas sem validação autenticada:
- **Drawer**: adicionar focus-trap, `aria-expanded`/`aria-controls` no toggle,
  retorno de foco ao fechar, `inert`/`aria-hidden` no resto quando aberto,
  fechar por **Escape**; e integrar o scroll-lock/foco à governança central do
  `overlay-layer` (`reference-counter`/`focus-governance`) — hoje o drawer usa
  classe própria fora dessa governança (risco de órfão). Wiring quebrado em
  `sidebar/lifecycle/setup-coordinator.ts:137,143`.
- **Ticker**: expor controle acessível de pausar/anterior/próximo e trocar o
  `role="marquee"` (depreciado) por região com `aria-live` adequada.
- **Bottom-nav**: `toggle-sidebar` deve anunciar "abrir menu" e abrir o drawer
  reabilitado (unificar registro com a sidebar).

## Leitor de tela / teclado ao vivo
Validação com leitor de tela e navegação por teclado na sessão autenticada é do
Jhony (roteiro no `MOBILE_SCREEN_READER_SCRIPT` do Track C serve de molde).
