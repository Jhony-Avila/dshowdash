# V4 ART AUTHORING KIT — Pacote de Handoff do Ilustrador

> Decisão **A+** (§21/§22). Este kit é o contrato **sem ambiguidade** entre a arte
> autorada (Illustrator / Figma / Inkscape) e o motor do Avatar Studio. Um
> ilustrador que segue este documento produz um **HeroAsset2D** que o motor
> **consome** (`engine/heroAssetImport.ts`) — nunca reconstrói à mão (§5). Um
> engenheiro integra o ativo **sem depender do ilustrador** (§23).
>
> Regra de ouro: **ENGINE ≠ ART ASSET.** Você (ilustrador) é dono da SILHUETA,
> das curvas autorais, da anatomia da peça, da construção, do cabelo, da
> estrutura facial, das mãos, do calçado, do detalhe. O motor é dono de
> âncoras, escala, fit, paleta, clipping, composição, variantes, adaptação ao
> corpo, compatibilidade e apresentação. **Não desenhe cor final nem sombra de
> chão "chapada" na peça** — declare canais e camadas; o motor resolve.

Índice dos **15 itens** do pacote:

1. Canvas e frames
2. Sistema de âncoras (corpo padrão)
3. Camadas nomeadas (`data-hero-layer`)
4. Canais de cor (`data-channel` / `data-tone` / `data-paint`)
5. Materiais (`data-material`)
6. Molde base — `V4_HERO_ASSET_TEMPLATE.svg`
7. Âncoras por categoria (rosto, torso, pé…)
8. Classes de caimento (fit)
9. Domínio do calçado (zonas + âncora do pé)
10. Foco de card e palco (o que domina a viewport)
11. Regras invioláveis (byte-stability + customização)
12. Do / Don't
13. Checklist de export
14. Processo de handback (import + prova)
15. Barra de qualidade (critérios ≥8) + exemplo trabalhado

---

## 1. Canvas e frames

Duas telas, origem `0,0`, **fundo transparente**, sem `<svg>` aninhado extra:

| Frame  | viewBox        | Uso                                              |
|--------|----------------|--------------------------------------------------|
| `busto`| `0 0 240 240`  | rosto, olhos, boca, nariz, sobrancelha, cabelo, barba |
| `corpo`| `0 0 240 400`  | roupa, roupa inferior, calçado, corpo, mãos      |

A peça é autorada **na tela inteira**, posicionada onde ela realmente fica no
personagem (não centralize um "ícone" — desenhe a peça **vestida**). O motor
recorta/enquadra depois (item 10).

## 2. Sistema de âncoras (corpo padrão, `corpo` 240×400)

Fonte única: `engine/partes/corpo.ts → anatomiaCorpo('standard')`. Desenhe a
peça alinhada a estas linhas (o motor adapta aos outros perfis por você):

```
cx (centro) = 120
yNuc (base do pescoço) = 104     ombro (meia-largura) = 47
yOmb (ombro)           = 122     peito                = 42
yPei (tórax)           = 150     cintura              = 30
yCin (cintura)         = 192     quadril              = 36
yQua (quadril)         = 220     coxa                 = 19
yEnt (entreperna)      = 236     braço/antebraço      = 14 / 10
yJoe (joelho)          = 298
yTor (tornozelo)       = 356
yPe  (chão)            = 372
```

> Você autora para o **standard**. Slim / athletic / robust / feminino têm
> proporção vertical e largura próprias (§13) — o motor reposiciona a peça pela
> âncora + classe de fit. **Não** desenhe cinco versões.

## 3. Camadas nomeadas — `data-hero-layer`

Cada elemento de topo declara sua camada. O motor as distribui pelos planos de
composição (fonte: `domain/heroAsset.ts → LAYER_HOOK / LAYER_Z`):

| `data-hero-layer` | papel                              | plano no motor  |
|-------------------|------------------------------------|-----------------|
| `back`            | volume/halo ATRÁS da figura        | atrás           |
| `shadow`          | sombra de contato no CHÃO          | sombra          |
| `base`            | silhueta / preenchimento           | figura (z 10)   |
| `mid`             | meios-tons / dobras                | figura (z 20)   |
| `light`           | realces                            | figura (z 30)   |
| `detail`          | costura, fecho, textura fina       | figura (z 40)   |
| `occlusion`       | oclusão de contato sobre a peça    | figura (z 50)   |
| `front`           | fios soltos, brilho de lente       | na frente (z 60)|

Ordem interna é por `z`; dentro de uma camada, a ordem do documento vale.

## 4. Canais de cor — `data-channel` / `data-tone` / `data-paint`

**Não pinte cor final.** Marque o que é tingível; o motor aplica a paleta do
usuário (a peça continua **customizável**, §24). Fonte: `engine/cores.ts`.

- `data-channel="pele|cabelo|roupa|destaque"` — de qual canal vem a cor.
- `data-tone="base|claro|escuro|profundo|brilho|meio"` (default `base`) — o tom.
- `data-paint="fill|stroke|both"` (default `fill`) — onde aplicar.

Use um **fill/stroke placeholder** no SVG (ex.: `fill="#3a4256"`) para você
enxergar a peça no Illustrator — o motor **sobrescreve** no import.

## 5. Materiais — `data-material`

Para uma zona "ler" como um material, declare `data-material` **junto** de
`data-channel` (o material usa o hex do canal como base). Fonte:
`engine/materiais2d.ts`. Tokens válidos:

`cotton · denim · wool · leather · metal · technical · satin · silk · glass · emissive`

O motor injeta os gradientes do material (escopados por uid) e resolve o fill.
Você desenha só a **forma** da zona.

## 6. Molde base

`docs/AVATAR-STUDIO-5/V4_HERO_ASSET_TEMPLATE.svg` — abra, é a convenção viva
(um blazer de referência com todas as camadas, canais, um material, botões e o
grupo de âncoras). **Copie a estrutura**, troque as curvas pela sua arte.

## 7. Âncoras por categoria

Declare pontos nomeados em `<g data-hero="anchors"> … </g>` (círculos com
`data-anchor="nome" cx cy` — **não são pintados**). Conjuntos esperados:

| Categoria     | frame | âncoras mínimas                          |
|---------------|-------|------------------------------------------|
| roupa (torso) | corpo | `gola, ombroL, ombroR, cintura, bainha`  |
| roupa inferior| corpo | `cos, quadrilL, quadrilR, bainhaL, bainhaR`|
| calçado       | corpo | `tornozelo, calcanhar, biqueira, sola`   |
| rosto/olhos…  | busto | `olhoL, olhoR, nariz, boca, queixo`      |
| cabelo        | busto | `coroa, testa, orelhaL, orelhaR, nuca`   |

As âncoras alimentam fit e foco; posições em coords do viewBox nativo.

## 8. Classes de caimento (fit)

Uma peça de vestuário declara sua **classe** no manifesto; o motor deriva a
folga sobre qualquer corpo (fonte: `engine/fit.ts`). Autore a silhueta no
**standard** com o caimento da classe pretendida:

| Classe       | caráter                                            |
|--------------|----------------------------------------------------|
| `FITTED`     | segue o corpo; cintura marcada (segunda pele).     |
| `REGULAR`    | folga natural; leve marcação de cintura.           |
| `RELAXED`    | amplo; cintura suave.                              |
| `OVERSIZED`  | volumoso; silhueta em caixa (streetwear).          |
| `STRUCTURED` | alfaiataria; segura a forma independentemente do corpo.|

## 9. Domínio do calçado

Fonte: `engine/footwear.ts`. Zonas nomeadas (use como camadas/`data-*` na sua
arte): `sola · entressola · cabedal · biqueira · colarinho · lingua ·
contraforte · salto · cadarco`. `cabedal` = canal `roupa`; `cadarco` = canal
`destaque`; `sola`/`salto` = valor escuro fixo. Ancore ao pé: `pontosPe` dá
`tornozelo (yTor−4)`, `chão (yPe+5)`, largura e drift do bico por perfil.

## 10. Foco de card e palco

Fonte única: `engine/enquadramento.ts → focoDe(categoria, slot)`. Você **não**
decide enquadramento — mas saiba que:
- **CARD** = "o que É este item" → recorte apertado no alvo (item domina).
- **PALCO** = "como fica em MIM" → o avatar com a câmera da categoria.
Garanta que a peça **lê no seu recorte de categoria** (ex.: um brinco precisa
de silhueta clara no crop da orelha, não só no corpo inteiro).

## 11. Regras invioláveis

- **Byte-stability**: um avatar já salvo **nunca** muda de render por causa de
  arte nova. Campo novo neutro = **omitido** na serialização.
- **Customização preservada**: nunca "queime" a cor do usuário — use canais.
- **Nunca editar arte legada** em `partes/*` — hero assets são arquivos novos.
- Toda peça nova entra **atrás de flag** (`as6.*`) e é reversível.

## 12. Do / Don't

**Do:** silhueta primeiro (leia em preto puro — item 15); camadas nomeadas;
canais + tons; materiais nas zonas; âncoras; placeholders de cor; curvas
limpas.
**Don't:** cor final "queimada"; sombra de chão dentro da `base`; um ícone
centralizado; texto; imagens rasterizadas embutidas; filtros pesados fora de
`front`; ids que dependem de não colidir (o motor prefixa por uid).

## 13. Checklist de export

- [ ] viewBox correto (`240×240` busto / `240×400` corpo), origem `0,0`.
- [ ] Todo elemento de topo tem `data-hero-layer`.
- [ ] Zonas tingíveis têm `data-channel` (+ `data-tone`/`data-paint`).
- [ ] Zonas de material têm `data-material` **e** `data-channel`.
- [ ] `<g data-hero="anchors">` presente com o conjunto da categoria.
- [ ] Sem texto, sem raster embutido, sem `<style>` externo.
- [ ] Placeholders de cor só p/ leitura (serão sobrescritos).
- [ ] Exporte **SVG** (não PDF/PNG). Curvas, não contornos expandidos demais.

## 14. Processo de handback

1. Entregue o `.svg`.
2. Engenharia monta o `HeroAssetManifest` (id, categoria, frame, canais, fit,
   zonas, focos) — ver `domain/heroAsset.ts`.
3. `importarHeroAsset({ manifesto, svg })` → `ParteDef` (sem redesenhar).
4. Prova automática: `13_V4_HERO_IMPORT_PROOF` (visual) + `hero-import.mjs`
   (bytes: uid-scope, recolor, camadas→hooks, curvas intactas).
5. A peça entra no catálogo atrás da flag; validação visual final é do Jhony.

## 15. Barra de qualidade (≥8) + exemplo

A **apresentação** (foco, card, material lendo) é responsabilidade do motor e
tem gate próprio (§17); ela **não** maquia arte fraca (§18). A arte é aprovada
só se, isolada:

1. **Silhueta lê em preto puro** (value study) — reconhecível sem cor.
2. **Anatomia/construção corretas** — a peça "veste", não flutua.
3. **Hierarquia de luz** coerente (key superior-esquerda).
4. **Materiais distinguíveis** na mesma geometria (lã ≠ couro ≠ metal).
5. **Detalhe intencional** (costura/fecho onde existe de verdade).
6. **Bordas limpas** — sem "serrilha" de curva grosseira.
7. **Coerência de estilo** com o cast (stylized 2.5D premium).
8. **Legibilidade no thumbnail** (o item se explica no card).

> "Se eu precisar ler o relatório para entender por que ficou bom: ainda não
> ficou bom." — a peça se defende sozinha no palco e no card.

**Exemplo trabalhado:** o próprio `V4_HERO_ASSET_TEMPLATE.svg` (um blazer
`STRUCTURED`, canais `roupa`+`destaque`, material `wool`) importado e vestido no
avatar real está em `13_V4_HERO_IMPORT_PROOF` — recolorido por 3 paletas sem
tocar no SVG. Ele demonstra o **pipeline**; a barra ≥8 de fatura artística é o
que os heroes finais precisam atingir (segue REWORK até o veredito do Jhony).
