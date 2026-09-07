# V4 AUTHORED ASSET PIPELINE — Relatório de Engenharia

> Decisão **A+** (§14/§23). Como um ativo autorado vira arte no motor, sem o
> ilustrador na sala e sem quebrar avatar salvo. Referência de módulos reais.

## Fluxo ponta a ponta

```
Illustrator/Figma ──(SVG + convenção data-*)──▶ V4_HERO_ASSET_TEMPLATE.svg
        │
        ├─ engenharia monta HeroAssetManifest (domain/heroAsset.ts)
        ▼
importarHeroAsset({manifesto, svg})  (engine/heroAssetImport.ts)
        │  1) escopa ids por uid        3) resolve materiais (materiais2d)
        │  2) resolve canais (cores)     4) distribui camadas → hooks (LAYER_HOOK)
        ▼
ParteDef  ──▶ catálogo/flag ──▶ renderAvatar (motor de sempre) ──▶ SVG do avatar
        │
        └─ provas: hero-import.mjs (bytes) · 13_V4_HERO_IMPORT_PROOF (visual)
```

## Contrato (o que o motor garante)

- **Não reconstrói arte (§5):** as curvas `d="…"` autoradas saem **intactas**
  (verificado por `hero-import.mjs` [7]).
- **uid-scoping:** todos os ids de `<defs>`/gradiente são prefixados pelo uid —
  N avatares na mesma página não colidem. `<defs>` do asset entram uma vez, no
  1º hook não-vazio; como os hooks vão para o mesmo `<svg>`, a referência
  resolve em qualquer plano.
- **Customização preservada (§24):** `data-channel`/`data-tone`/`data-paint`
  ligam a peça à paleta do usuário; trocar a paleta muda a cor sem tocar no SVG.
- **Materiais (§25):** `data-material` + `data-channel` → `materiais2d` injeta os
  gradientes do material (escopados por uid+canal).
- **Camadas → composição:** `data-hero-layer` mapeia para os hooks do ParteDef
  (`renderAtras`/`renderSombra`/`render`/`renderFrente`) por `LAYER_HOOK`.
- **Determinístico:** mesma paleta+uid ⇒ mesmos bytes (byte-stability).
- **Autoria não vaza:** nenhum atributo `data-*` sobra no SVG final.

## Integração sem o ilustrador (§23)

O engenheiro precisa só do `.svg` e do manifesto. `importarHeroAsset` devolve um
`ParteDef` indistinguível de um autorado à mão do ponto de vista do
catálogo/render — entra na lista atrás da flag (`as6.*`), com validação PHP
espelhada quando houver campo novo, e some com a flag OFF (rollback §651).
Nenhuma etapa exige abrir a ferramenta de arte.

## Byte-stability e risco

- O import é aditivo: heroes são **arquivos novos**; `partes/*` legado fica
  intocado.
- A refatoração de anatomia (§13) manteve o perfil **standard byte-idêntico**
  (`corpoInteiroPremium('standard')` = `54dd553ea024557d`, verificado por
  `corpo-fit.mjs`); só slim/athletic/robust/feminino ganharam proporção nova.
- Toda feature atrás de flag desligável; nada de rollout/gravar/merge nesta fase.

## Superfície de módulos (fase A+)

| Módulo | Papel |
|--------|-------|
| `domain/heroAsset.ts` | contrato do ativo autorado (manifesto + convenção) |
| `engine/heroAssetImport.ts` | pipeline de import (asset → ParteDef) |
| `engine/enquadramento.ts` | CATEGORY_FOCUS_MAP (foco fonte única) |
| `engine/partes/corpo.ts` | anatomia real por perfil (fonte única de proporção) |
| `engine/fit.ts` | classes de caimento (folga por FITTED…STRUCTURED) |
| `engine/footwear.ts` | domínio do calçado (âncora do pé + zonas) |
| `engine/gates.ts` | gates independentes apresentação × arte |
| `scripts/golden/preflight-git.sh` | guarda de segurança git (§30) |

## Testes (na suíte `rodar-todos.mjs`)

`hero-import` · `enquadramento` · `corpo-fit` · `footwear` · `gates`
(+ `flag-matrix`, `feminino-save-reload` e toda a suíte histórica).

## O que falta (precisa do Jhony / próximas ondas)

- **Heroes autorados de verdade** na ferramenta visual (a barra ≥8 é REWORK).
- Manifestos e validação PHP espelhada quando os heroes entrarem.
- Veredito humano do Gate A (validação visual/sessão autenticada é do Jhony).
