# Google Analytics — FASE 2: visualizações em D3

> Entregue em **2026-07-30**, commit `4855237`. Corresponde à Fase 3 do §79 do briefing
> (analytics avançado). Verificação: `bash scripts/ga-smoke-all.sh`.

---

## 1. O que entrou

| Componente | Seção | O que responde |
|---|---|---|
| `viz/Sankey.tsx` | §21 | de onde vem quem chega, e onde aterrissa |
| `viz/ArvoreJornada.tsx` | §25, §26 | o que a pessoa faz depois de entrar, e onde desiste |
| `viz/MapaBrasil.tsx` | §40 | onde está o público, e onde ele converte |
| `viz/Treemap.tsx` | §20 | qual canal tem volume **sem** qualidade |

Telas: **Fluxo e Jornada** (nova, `jornada`), **Localizações** (ganhou mapa), **Canais**
(ganhou treemap). Backend: nova rota **`GET /journey`** e `fluxoAquisicao()` reescrito.

Total agora: **22 telas com dados**, **17 rotas**.

---

## 2. Reúso: por que os componentes foram escritos aqui e não importados do Ads

O painel de Ads tem 9 gráficos D3 prontos, e este módulo usa 3 deles como **molde** — não como
import. O motivo é concreto:

- cada painel tem **build próprio** com `emptyOutDir: true`. Importar de
  `../panel-ads/src/...` faria o bundle deste painel depender do código-fonte de outro, e
  qualquer refatoração lá quebraria aqui sem aviso;
- o `GeoMapaBrasil` do Ads referencia o TopoJSON **dentro do dist dele**. Um `vite build` do
  painel de Ads apagaria o asset e este mapa quebraria por causa de um build alheio;
- os componentes do Ads dependem de `useTokensAds`, que lê tokens `--ads-*`.

O que **foi** reusado de verdade: o padrão (SVG montado à mão sem `d3-selection`,
`ResizeObserver`, tooltip em estado React, import dinâmico) e as 12 dependências `d3-*` que já
estavam no `package.json`. **Nada novo foi instalado.**

⚠️ O TopoJSON (154 KB) foi **copiado** para `panel-google-analytics/public/geo/`. Duplicação
consciente: 154 KB compram independência entre painéis.

---

## 3. 🔴 A regressão de performance que a medição pegou

Depois de adicionar os quatro componentes, o build mostrou:

| Chunk | Antes da Fase 2 | Depois (errado) | Depois (corrigido) |
|---|---|---|---|
| `vendor` | 9,68 kB | **77,45 kB** | **9,68 kB** |
| `d3` | — | (dentro do vendor) | **67,68 kB**, sob demanda |
| `entry` | 66,47 kB | 88,35 kB | 88,09 kB |

**A causa**: o `manualChunks` mandava **todo** `node_modules` para `vendor`, e `vendor` carrega
junto com o entry. O `import('d3-sankey')` dinâmico dos componentes adiava a **execução**, mas
não o **download** — quem abrisse só a Visão Geral pagava 68 kB de D3 sem usar.

**A correção** foi uma regra no `manualChunks`:

```js
if (/[\\/]node_modules[\\/](d3-|topojson)/.test(id)) return 'd3';
```

⚠️ **`import()` dinâmico não garante lazy-load por si só.** Se o bundler agrupa o módulo num
chunk que já é carregado, o `import()` vira só adiamento de execução. A prova de UI agora
fotografa os chunks baixados no primeiro paint e exige que `d3.*` **não** esteja lá — sem essa
checagem, a regressão volta em silêncio no próximo componente que alguém adicionar.

---

## 4. Decisões de leitura (por que os gráficos são assim)

### Sankey: `id` estável, não índice de array

A primeira versão do backend devolvia `origem`/`destino` como **posição** no array de nós.
Funciona, e é o que a maioria dos exemplos de `d3-sankey` faz. Dois problemas:

1. amarra o contrato à ordem — reordenar no backend reescreve o diagrama inteiro;
2. o cross-filter fica cego: a partir de um número não há como dizer *"o usuário clicou no
   canal Paid Search"*.

Com `id` (`canal:Paid Search`, `camp:institucional-marca`) e `camada`, o clique num nó vira
filtro tipado sem tabela de tradução, e a **cor é por etapa** — a mesma etapa tem a mesma cor
em qualquer tela.

### Árvore: o abandono é um nó

O backend devolve um nó `tipo: 'saida'` por nível, em vermelho. Uma árvore de navegação que só
desenha quem seguiu adiante esconde exatamente o que se quer descobrir (§25 pede abandono
explícito). No cenário padrão são **7 nós de abandono** — a prova exige que existam.

A espessura da ligação é proporcional ao volume: sem isso um caminho de 12 usuários parece tão
importante quanto um de 4.000, e a árvore engana mais do que informa.

### Treemap: área é volume, cor é qualidade

A leitura que a tabela não dá: **retângulo grande e apagado** = canal que traz muita sessão e
converte mal. A intensidade é normalizada pelo **melhor canal**, não por 100% — taxas de
conversão vivem entre 1% e 5%, e escalar por 100 deixaria tudo na mesma cor pálida.

### Mapa: piso de cor para UF sem dado

UF sem dado é pintada com a cor de superfície, não transparente: transparente dá impressão de
buraco no mapa. E se o TopoJSON falhar, o componente mostra o motivo e **a tabela ao lado
continua servindo** — o mapa é a camada visual, não a fonte.

---

## 5. Duas correções de honestidade na UI

- A nota do mapa dizia *"clique num estado para filtrar as outras telas"*. O filtro global do
  módulo **não tem dimensão de UF**; a seleção é local (liga mapa e tabela). A nota passou a
  dizer o que o clique realmente faz. Prometer filtro que não existe é pior que não ter o filtro.
- `maxTx` e `melhorTx` calculavam a mesma coisa na tela de Canais. Ficou **uma** referência: com
  duas, o mesmo canal poderia aparecer "bom" no treemap e "médio" na barra ao lado.

---

## 6. Verificação

O smoke ganhou o item **6b — integridade do grafo**, em 3 cenários:

- **todo link aponta para nó existente** — link órfão faz o `d3-sankey` **lançar**, e a tela
  fica em branco sem erro visível;
- **nenhum ciclo entre camadas** — ciclo também faz o `d3-sankey` lançar;
- **profundidade da árvore ≤ 6 níveis** — acima disso vira ilegível.

A prova de UI foi de **77 para 105 checagens**. As novas:

| Checagem | Resultado medido |
|---|---|
| chunk `d3` é lazy (ausente no primeiro paint) | ✅ |
| Sankey desenhou ligações / nós / rótulos | 57 / 43 / 38 |
| árvore desenhou nós | 22 nós, 21 ligações |
| árvore mostra o abandono como nó | 7 nós de saída |
| clique no nó do Sankey aplica cross-filter | chips 0 → 1 |
| mapa desenhou as 27 UFs com geometria | 27 / 27 |
| treemap com fatias de área positiva | 8 / 8 |

Capturas: `ga-fase2-jornada-{dark,light}.png` e `ga-fase2-mapa-{dark,light}.png`.

---

## 7. O que a Fase 2 NÃO fez

| Item | Por quê |
|---|---|
| Drill-down por UF | O filtro global não tem dimensão de região; entra na Fase 3 junto com o drill-down completo (§64) |
| Coorte em D3 | A tabela de coortes atual (CSS, escala de cor) já entrega a leitura; trocar por D3 seria custo sem ganho |
| Grafo de força (§26 alternativo) | A árvore hierárquica responde melhor "onde desiste"; o grafo cabe se o dado real mostrar loops |
| Diretoria, Insights | Fase 3 |
| Exportação (§51.2) | Fase 3 |
| Ícone no header (§9) | Pequeno, mas o header estava sendo editado por outra sessão nas duas fases; fica para quando não houver concorrência |
