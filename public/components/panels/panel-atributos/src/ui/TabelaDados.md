# TabelaDados — tabela padrão do módulo Produtos & Atributos

Arquivos: `src/ui/TabelaDados.tsx` (componente), `src/ui/tabela-dados.css` (estilo, só tokens `var(--bl-…)`), `src/lib/ordenar.ts` (ordenação pura).
Primeiro uso: tela Atributos (`src/screens/Dicionario.tsx`).

## O que ela faz

- **Cabeçalho fixo**: `<th>` com `position: sticky; top: 0`, fundo próprio (`--bl-superficie-2`) e sombra leve (`--bl-sombra-sm`) quando a tabela já rolou (`data-rolando="1"` na moldura).
- **Ordenação por clique no título**: o título é um `<button>` (Enter/Espaço nativos). 1º clique ▲ crescente, 2º ▼ decrescente, 3º volta a ▲; outra coluna começa em ▲. `aria-sort` = `ascending`/`descending`/`none`. Colunas não ordenadas mostram ↕ apagado.
- **Regras de ordem** (`lib/ordenar.ts`): `numero` ordena como número; `texto` com `localeCompare(…, 'pt-BR', { sensitivity: 'base', numeric: true })`; **vazios (`null`, `undefined`, `''`, só espaços; em coluna numérica, o que não vira número) sempre no fim, nos dois sentidos**; **estável** (empate mantém a ordem de entrada, também em ▼); comparador opcional por coluna (recebe só valores não vazios).
- **Linhas**: zebra bem suave + destaque no hover, por tokens (claro e escuro). Colunas `numero` alinhadas à direita.
- **Linha clicável** (opcional): `tabIndex=0`, Enter/Espaço, `aria-label` próprio. Clique/tecla dentro de campo, botão, link ou label da linha **não** abre a linha.
- **Grupos** (opcional) e **células editáveis** (ver abaixo).

## Props

| Prop | Tipo | Padrão | Observação |
|---|---|---|---|
| `colunas` | `ColunaTabela<T>[]` | — | ver tabela abaixo |
| `linhas` | `readonly T[]` | — | TODAS as linhas a exibir (a tabela ordena tudo; não pagina) |
| `chaveLinha` | `(l: T) => React.Key` | — | **estável** (id). É a `key` da `<tr>` — nunca o índice |
| `ordenacaoPadrao` | `{ chave, direcao: 'asc'\|'desc' } \| null` | `null` | modo interno |
| `ordenacao` + `aoOrdenar` | `Ordenacao \| null`, `(o) => void` | — | modo **controlado** (use quando a tabela pode desmontar — ex.: lista vazia por filtro — e a ordem tem de sobreviver) |
| `aoClicarLinha` | `(l: T) => void` | — | torna a linha clicável |
| `rotuloLinha` | `(l: T) => string` | — | `aria-label` da linha clicável |
| `classeLinha` | `(l: T) => string \| undefined` | — | ex.: `at-linha--inativa` |
| `className` | `string` | — | classe extra da `<table>` |
| `legenda` | `string` | — | `<caption>` só para leitor de tela |
| `rolagem` | `'propria' \| 'container'` | `'propria'` | ver "Container do sticky" |
| `grupos` | `{ chave: string; titulo: string }[]` | — | ordem do array = ordem exibida |
| `grupoDaLinha` | `(l: T) => string \| null \| undefined` | — | obrigatório com `grupos` |
| `mostrarVazios` | `boolean` | `false` | grupo sem linhas aparece com "Nenhum item." |
| `congelarOrdem` | `boolean` | `false` | congela a ordem atual além do congelamento automático por foco |

`ColunaTabela<T>`:

| Campo | Tipo | Observação |
|---|---|---|
| `chave` | `string` | identifica a coluna (também `data-coluna` no `<th>`) |
| `titulo` | `string` | texto do botão de ordenar |
| `tipo` | `'texto' \| 'numero'` | regra de ordem e alinhamento padrão |
| `alinhamento?` | `'esquerda' \| 'direita' \| 'centro'` | padrão: `direita` para `numero` |
| `render?` | `(l: T) => ReactNode` | conteúdo da célula (pode ser input/select) |
| `valor?` | `(l: T) => unknown` | valor usado na ordenação; padrão `linha[chave]` |
| `comparador?` | `(a, b) => number` | compara dois valores **não vazios** em ordem crescente |
| `classe?` | `string` | classe da `<td>`; utilitárias: `at-td--curta` (não quebra), `at-td--palavras` (quebra só entre palavras) |
| `ordenavel?` | `boolean` | `false` = título sem botão |

Ajudantes exportados de `lib/ordenar.ts`: `comparadorPorLista(lista)` (ordem lógica, ex. importância `IMPORTANCIAS`), `ordenarLinhas`, `agruparOrdenado`, `manterOrdem`, `alternarOrdenacao`, `ariaSort`, `ehVazio`.

## Exemplo simples (tela Atributos)

```tsx
const COLUNAS: ColunaTabela<AtributoDicionario>[] = [
  { chave: 'rotulo', titulo: 'Rótulo', tipo: 'texto' },
  { chave: 'tipo', titulo: 'Tipo', tipo: 'texto', valor: (a) => TIPO[a.tipo] },            // ordena pelo rótulo exibido
  { chave: 'importancia_padrao', titulo: 'Importância padrão', tipo: 'texto',
    comparador: comparadorPorLista(IMPORTANCIAS), render: (a) => IMPORTANCIA[a.importancia_padrao ?? ''] ?? '—' },
  { chave: 'em_kits', titulo: 'Em kits', tipo: 'numero' },                                   // à direita, ordem numérica
];
const [ordenacao, setOrdenacao] = React.useState<Ordenacao>({ chave: 'rotulo', direcao: 'asc' });
<TabelaDados colunas={COLUNAS} linhas={filtrados} chaveLinha={(a) => a.id}
  ordenacao={ordenacao} aoOrdenar={setOrdenacao}
  aoClicarLinha={(a) => abrir(a.id)} rotuloLinha={(a) => `Abrir ${a.rotulo}`} />
```

## Exemplo com grupos e célula editável (ficha do produto)

```tsx
const GRUPOS = [{ chave: 'base', titulo: 'Base (todos os produtos)' }, { chave: 'kit', titulo: 'Kit Cabos' }];
const colunas = React.useMemo<ColunaTabela<Item>[]>(() => [
  { chave: 'rotulo', titulo: 'Atributo', tipo: 'texto' },
  { chave: 'valor', titulo: 'Valor DSHOW', tipo: 'texto',
    render: (i) => <input aria-label={`Valor de ${i.rotulo}`} value={rascunho[i.id] ?? ''}
                          onChange={(e) => setRascunho((r) => ({ ...r, [i.id]: e.target.value }))} /> },
], [rascunho]);
<TabelaDados colunas={colunas} linhas={itens} chaveLinha={(i) => i.id}
  grupos={GRUPOS} grupoDaLinha={(i) => i.grupo} ordenacaoPadrao={{ chave: 'rotulo', direcao: 'asc' }} />
```

## Grupos

- Cada grupo é um `<tbody data-grupo="…">` com uma linha de cabeçalho `<th scope="rowgroup" colSpan={nº de colunas}>` com o título e a contagem (ex.: "Base (todos os produtos) 8"; a contagem tem `aria-label` "8 itens").
- A ordenação vale **dentro** de cada grupo; os **grupos mantêm a ordem dada** (nunca são reordenados pela coluna).
- Grupo sem linhas não aparece (`mostrarVazios` mostra com "Nenhum item."). Linha cujo grupo não está na lista vai para um grupo final **"Outros"** (só aparece se tiver linhas).
- A zebra recomeça em cada grupo.

## Células editáveis, foco e ordem congelada

- A `key` de cada `<tr>` é `chaveLinha` → reordenar/re-renderizar **não remonta** o campo (mesmo nó DOM: foco e texto ficam).
- **Congelamento automático**: quando um campo editável (`input`, `select`, `textarea`, `contenteditable`) do `<tbody>` recebe o foco, a ordem exibida fica congelada: os valores atualizam, mas nenhuma linha muda de lugar — nem por dados novos, nem por mudança de ordenação controlada. Linha nova entra no fim do seu grupo; linha removida sai.
- Andar com Tab para outro campo ou outra linha da mesma tabela mantém congelado. **A ordem nova se aplica quando o foco sai do `<tbody>`** (blur, clique fora, clique num título de coluna).
- Clicar num título durante a edição: o foco vai para o botão do título (comportamento normal), o texto digitado fica e a ordem nova aparece nesse momento.
- `congelarOrdem` força o congelamento (ex.: enquanto uma gravação está pendente).

## Container do sticky (medido no harness 8113, 18/11)

O `<th>` gruda no topo do **ancestral rolável mais próximo**. A raiz do módulo `[data-bl-root].at-raiz` tem `overflow: auto` (modulo.css) **mas não tem altura limitada** (scrollHeight = clientHeight); quem rola de verdade é o `<main class="dsd-shell__region--main">` do app-shell. Como o overflow da `.at-raiz` a torna o container do sticky, um cabeçalho "fixo na página" não gruda em lugar nenhum. Por isso:

- `rolagem="propria"` (**padrão hoje**): a moldura da tabela (`.at-td`) é o container rolável, nos dois eixos, com altura máxima `--at-td-altura-max` (padrão `max(320px, calc(100dvh - 240px))`). O cabeçalho gruda no topo da moldura.
- `rolagem="container"`: sem overflow na moldura; o cabeçalho gruda no ancestral rolável. Usar quando a `.at-raiz` (ou outro container) tiver altura limitada e for quem rola. Se a tabela não couber na largura, a moldura ganha rolagem horizontal (`data-larga="1"`) e, nesse caso, o cabeçalho deixa de ser fixo.

## Testes

- Puros: `bash scripts/atributos/testes/tabela-dados.sh` (ordenação, vazios, estabilidade, 9 colunas da tela Atributos, filtro × ordem, grupos, ordem congelada).
- Navegador (harness 8113): `validacao/shell-esquerda/teste-tabela-dados.cjs` (tela Atributos) e `teste-tabela-dados-demo.cjs` (página de demonstração só de teste com 2 grupos e célula editável; monta com `scripts/atributos/testes/tabela-dados-demo/montar.sh <pasta>`).
