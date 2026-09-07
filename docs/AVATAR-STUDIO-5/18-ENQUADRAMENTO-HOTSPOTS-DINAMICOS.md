# 18 — Enquadramento + Hotspots dinâmicos do painel 2D (decisões #48/#49)

Correções obrigatórias pós-aprovação visual do painel 2D (Visual Composer). O design foi
aprovado como direção; esta rodada resolve os cortes de enquadramento e o desalinhamento
dos hotspots, sem apagar assets/recursos e preservando o design aprovado.

## Problema

O palco 2D usava presets FIXOS de enquadramento (`grupos.ts:foco` / `engine/enquadramento.ts`)
que recortavam a viewBox (crop apertado) — cortando cabelo/chapéu/orelhas/queixo e, no corpo,
pés/mãos. Os hotspots eram caixas de porcentagem fixa (`grupos.ts:hot`) posicionadas sobre o
crop antigo — logo, ao mudar o enquadramento, desalinhavam (10–15%). Havia ainda um retângulo
técnico (`.vc-hot-on`, borda roxa) visível durante a seleção.

## Decisão #48 — Geometria única compartilhada

Enquadramento e hit-testing passam a usar A MESMA geometria e transformação do `<svg>` vivo.
Módulo novo `vc/enquadramentoDinamico.ts`:

- **Enquadramento**: viewBox derivada dos LIMITES VISUAIS REAIS do personagem —
  `getBBox([data-anim="plano-personagem"])` (exclui o fundo) + margem de segurança (10%).
  `preserveAspectRatio="xMidYMid meet"` (contain, nunca cover), centrado no alvo visual.
  Falha de medição ⇒ tela cheia do canvas base (jamais corta). Idempotente (sem zoom cumulativo).
  Efeitos grandes ficam em `plano-fundo`/`plano-frente` e são EXCLUÍDOS da medição ⇒ não
  encolhem o personagem. O modo busto/corpo dá o contexto (rosto vs corpo inteiro).
- **Hotspots**: ponteiro→coordenada interna por `getScreenCTM().inverse()` (mesma
  transformação); regiões por `getBBox` de grupos semânticos quando existem (olhos, cabelo),
  senão DERIVADAS da face real medida (boca/rosto/acessório ancorados em olhos/cabelo), senão
  caixa canônica do modo. SEM porcentagem fixa. Prioridade de sobreposição:
  `acessório/chapéu → cabelo → olhos → boca → rosto → roupa → calçados` (o topo visual recebe
  o clique; caixa grande de rosto não bloqueia cabelo/olhos/boca).
- **Realce**: `<rect>` sutil desenhado DENTRO do próprio `<svg>` (mesmo viewBox ⇒ alinhado por
  construção); nenhum retângulo técnico/roxo. Hover mostra a região sob o ponteiro; sem hover
  mostra a seleção ativa (continuidade).

## Decisão #49 — Integração e recálculo

`VisualComposer.tsx`: palco sem crop fixo (`foco` removido do palco visual); camada de hotspots
de % fixo removida (`vc-hot`/`vc-subhot`). Um efeito único no palco recalcula em: carga do
avatar, mudança de config/asset (MutationObserver, childList), resize (ResizeObserver), troca de
categoria/sub, busto↔corpo, volta do 3D e no botão **Reenquadrar**. Sem listeners duplicados;
observers desconectados no unmount (o observer é pausado durante o próprio reenquadramento para
não gerar loop). Clique direto PRESERVADO.

Seletor **[2D | 3D]** sempre visível no cabeçalho (desktop + mobile, fora do "Mais"), com o modo
ativo destacado; aparece quando `as6.vc_3d` (+deps) resolve ON — inclusive para o canário u75.
Clicar 3D abre o VisualComposer3D compartilhado (preserva avatar/cores/seleção); 2D permanece
ativo. Nunca abre o Estúdio 3D legado.

Ajustes de UX: legibilidade das thumbnails (fundo claro neutro + escala/contraste); subcategorias
com rolagem horizontal + máscara de fade (indicação de continuidade, nunca cortadas).

## Regras invioláveis honradas

Nenhum asset/recurso removido. Feature nova sob flag (`as6.*`). Byte-stability preservada
(o motor/serialização não muda; só a viewBox de apresentação e a camada de clique). TypeScript
é a fonte da verdade. Deploy pelo fluxo FF→webhook; canário restrito a `app_users.id=75`.

## Handoff (booleans)

`HOTSPOTS_DYNAMIC=YES · HOTSPOTS_USE_SHARED_TRANSFORM=YES · FIXED_PERCENT_HOTSPOTS=NO ·
DEBUG_HOTSPOT_RECT_VISIBLE=NO · DIRECT_CLICK_PRESERVED=YES · FACE_NEVER_CROPPED=YES ·
BODY_NEVER_CROPPED=YES · MODE_SELECTOR_2D3D_ALWAYS_VISIBLE=YES`
