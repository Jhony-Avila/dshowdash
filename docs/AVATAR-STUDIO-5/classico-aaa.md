# Modo Clássico AAA — arquitetura da reestruturação (lote 671–680)

> Origem: **briefing complementar do Jhony (2026-08-07)** — "Reestruturação
> completa do layout do Avatar Studio (Modo Clássico)". Regra de ouro do
> briefing: NÃO alterar funcionalidades, regras de negócio ou
> comportamento — só reposicionar, reorganizar e redimensionar.
> Flag: `as5.classico_aaa` (padrão ON — decisão #50; rollback §651 =
> layout anterior byte a byte).

## Diagnóstico (análise da estrutura atual)

Árvore do clássico (`src/app/App.tsx` + `src/styles/estudio.css`):

```
.avst-shell (flex column)
├── header.avst-topo                 (~64px: título+subtítulo+5 botões)
└── .avst-corpo                      grid: 148px | minmax(300px,1fr) | 420px*
    ├── nav.avst-categorias          (grupos colapsáveis + 8 abas extras)
    ├── main.avst-palco              ← .avst-palco-principal CAP 470px,
    │                                  .avst-cine aspect 1:1 + radius 24
    │                                  + sombra = "card"; barra; prévias
    └── aside.avst-lateral           (420px redim. 320/420/560):
                                     GradeItens cards 108px + Cores no FIM
```

Confirmação ponto a ponto do diagnóstico do briefing:

| Problema | Causa no código |
|---|---|
| Avatar pequeno (35–40% da largura) | `.avst-palco-principal { width: min(470px, 100%) }` |
| Canvas "encaixado em card" | `.avst-cine` radius 24 + box-shadow + borda implícita |
| Assets comprimidos | lateral 420px, `.avst-grade` minmax(108px) |
| Cores longe do canvas | `<Cores>` renderizado DEPOIS da grade, no fim da lateral |
| Muito deslocamento vertical | grade vertical + cores + painel único com scroll |

O que JÁ EXISTE e é reaproveitado sem mudança de comportamento:
zoom contextual por categoria (PalcoCinema §5.3 — CAMERA_BUSTO/CORPO com
olhos/boca mais próximos), busca/filtros/modos da GradeItens, prévias de
contexto (drawer §42), content-visibility nos cards (§59.1), barra de
salvar (§39.11).

## Arquitetura nova (flag ligada)

```
.avst-shell[data-aaa="sim"]
├── header.avst-topo         COMPACTA (~48px: subtítulo oculto, ações densas)
└── .avst-corpo              aba itens → grid: 200px | 1fr  (2 colunas)
    ├── nav.avst-categorias  compacta (gap 8px, grupos com separador)
    └── .avst-centro         (coluna: palco domina, trilho embaixo)
        ├── main.avst-palco-aaa   flex:1 — PALCO sem card (sem radius/
        │   │                     sombra; fundo funde com o app = "palco,
        │   │                     não formulário"); tamanho dirigido pela
        │   │                     ALTURA útil (75–85%): width =
        │   │                     min(alturaUtil × 0.98, 96%)
        │   ├── .avst-cores-lado  CORES compactas AO LADO do canvas
        │   └── .avst-previas     em LINHA sob o palco (Header/Menu/
        │                         Perfil/Ranking, miniaturas maiores)
        ├── footer.avst-barra     discreta (altura menor, sem destaque)
        └── .avst-trilho          CARROSSEL HORIZONTAL de assets:
                                  a MESMA GradeItens, com CSS de trilho —
                                  grid-auto-flow: column, cards 220×250,
                                  thumb ~70%, overflow-x próprio
```

Abas que não são "itens" (Presets/Coleções/Conquistas/IA/Vitrine/
Histórico/Foto/Arquétipo/Título): mantêm palco + painel, mas o painel
ganha a largura que sobra do palco dominante (grid 200px | 1fr | 480px) —
elimina o vazio sem tocar nos componentes.

## Regras da implementação

- **Zero mudança de funcionalidade**: GradeItens/Cores/PalcoCinema/etc.
  NÃO mudam de código — só de POSIÇÃO (JSX condicional à flag) e de
  ESTILO (CSS escopado em `[data-aaa="sim"]`). Handlers, estado, filtros,
  busca, ordenação: intocados.
- **Rollback §651**: flag off = DOM idêntico ao anterior (JSX condicional
  devolve a árvore antiga) e CSS escopado não se aplica.
- **Grid 8px**: todos os espaçamentos novos são múltiplos de 8.
- **Scrolls independentes**: sidebar (y), trilho (x), palco fixo.
- **Hover/seleção AAA** (CSS): hover = elevação+escala+sombra+brilho;
  selecionado = glow+escala+check (o check já existe no card).
- **Safe area**: o palco mantém o enquadramento §5.3 (as margens do zoom
  já preservam cabelo/chapéu/aura no quadro aberto).
- **Responsivo**: ≥1440 sidebar 208px/cards 236px · 1024–1439 base ·
  ≤1023 mantém o layout clássico anterior (mobile não é alvo do AAA).
- **Perf**: cards do trilho mantêm content-visibility (§59.1); nenhuma
  camada nova de render; 60fps preservado (só transform/opacity).
- **Compat 3D**: classes `.avst-trilho`/tokens AAA são agnósticas — o
  shell/palco 3D poderá adotar o mesmo trilho quando o briefing mandar
  (nada aqui toca o shell novo nem o modo 3D).

## Critérios de aceite (do briefing complementar)

Avatar dominante · canvas sem card · carrossel horizontal · cards
maiores/legíveis · sem grandes vazios · sidebar organizada · cores junto
do avatar · prévias reorganizadas · largura total aproveitada · sensação
de Character Creator AAA.
