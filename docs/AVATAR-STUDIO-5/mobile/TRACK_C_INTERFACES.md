# Track C — Interfaces com o Shell Global do Site (documento; SEM mudanças)

O Avatar Studio mobile é um MÓDULO embutido no DShowDash. As 5 regiões globais
do site (header, sidebar, nav rail, ticker, footer) **NÃO** foram tocadas nesta
frente — esta é a fronteira e uma frente separada futura.

## Como o módulo mobile interage com cada região

| Região global | Espaço | z-index | Interação do módulo mobile | Responsabilidade |
|---|---|---|---|---|
| Header global | topo do host | (host) | o shell do módulo usa 100dvh/svh DENTRO da área que o host dá; não sobrepõe o header do host | host posiciona; módulo respeita o container |
| Sidebar global | lateral (host) | (host) | no mobile o host normalmente colapsa a sidebar; o módulo assume largura total do container | host decide colapso |
| Nav rail global | lateral/inferior (host) | (host) | a barra de salvar do módulo é `position:fixed bottom` z-60 — pode COLIDIR com um nav rail inferior do host | **conflito conhecido** (ver abaixo) |
| Ticker global | faixa (host) | (host) | reduz a altura útil; o módulo usa dvh/svh, então acompanha | host informa a altura via layout |
| Footer global | rodapé (host) | (host) | o módulo não renderiza footer; a barra fixa de salvar assume o rodapé DENTRO do container do módulo | módulo dono só do seu container |

## Safe areas
O módulo aplica `env(safe-area-inset-*)` no seu header compacto e na barra de
salvar. Se o host já consome a safe-area (ex.: um nav rail inferior nativo), há
risco de dupla contagem — a resolver na frente do shell global.

## Navegação de retorno
`useBackGuard` intercepta `popstate` para fechar a camada interna do módulo antes
de sair. **Contrato com o host:** quando não há camada interna aberta, o módulo
NÃO re-arma o buffer e deixa o voltar propagar — o host então navega normalmente.
Se o host também gerencia history/rotas, alinhar para não competir pelo popstate.

## Offsets e eventos
- O módulo escuta `resize`/`orientationchange`/`visualViewport` só p/ o seu layout.
- Não emite eventos globais; não altera rotas do host.
- `data-avst-kb` no `<html>` (teclado) é do módulo; o host deve ignorá-lo.

## Conflitos conhecidos (para a frente do shell global)
1. **Barra de salvar fixa (z-60) × nav rail inferior do host**: podem se
   sobrepor. Solução futura: o host expõe uma variável de altura do nav rail e o
   módulo soma no `padding-bottom`/`bottom` da barra.
2. **Safe-area dupla** se o host já a consome.
3. **popstate compartilhado** se o host usa history routing.

## Responsabilidades
- **Shell/host:** posicionar o container do módulo, informar alturas de header/
  ticker/nav rail, decidir colapso de sidebar, roteamento global.
- **Módulo (Avatar Studio mobile):** layout responsivo DENTRO do container,
  barra de salvar, teclado/safe-area do próprio conteúdo, back-guard das camadas
  internas, sem tocar as 5 regiões globais.

Nenhuma dessas mudanças foi feita nesta rodada (GLOBAL_SHELL_CHANGED=NO).
