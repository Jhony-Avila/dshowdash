# Track C Mobile — Resiliência (estados adversos, dados extremos, back, iOS, a11y)

## Estados adversos (mobile-adverse-states.mjs)
- Save rejeitado (500), save lento, resposta inválida: UI não trava, sem chamada
  infinita (≤2 POST), botão utilizável (retry), palco preservado, shell vivo,
  sem erro JS não tratado.
- ACHADO Track A/P1: o handler de save compartilhado limpa "pendente" em
  rejeição sem sinalizar erro — IDÊNTICO no desktop (flag OFF). Fora do escopo
  Track C (handler congelado); registrado para os donos do serviço de save.

## Dados extremos (mobile-extreme-data.mjs) — 360×640
Nomes ~200 chars, Unicode/emoji, thumbnail ausente: sem overflow de página,
truncamento/quebra dentro do card, seleção preservada, sem erro JS.

## Navegação de retorno (mobile-back-navigation.mjs)
`useBackGuard(mobile)`: popstate fecha a camada interna aberta (sheet/drawer/
modal) em vez de sair do módulo; sem overlay, propaga ao host. Desktop no-op.
```
ANDROID_BACK_STATUS=overlay→fecha overlay; nada aberto→comportamento do host
```

## Fallback iOS/Android (mobile-ios-fallback.mjs)
Fallback vh→svh→dvh (@supports), VisualViewport no-op quando ausente, inputs
16px (sem zoom iOS), zoom do usuário permitido, touch-action manipulation
(sem tap-delay/duplo-tap-zoom), position:sticky no palco/trilho, safe-area
declarada. Chromium headless ≠ Safari → NÃO aprova iOS; aparelho real = kit.

## Acessibilidade aprofundada (mobile-a11y-keyboard.mjs)
Tab move foco a controles; sheet é diálogo modal (role/aria-modal); foco entra
no diálogo; focus trap (Tab não escapa); FOCO RETORNA à origem ao fechar
(`useFocoDialogo(mobile)`, observador escopado — não toca componente Track A).
Leitor de tela real = VoiceOver/TalkBack no device (ver MOBILE_SCREEN_READER_SCRIPT).
