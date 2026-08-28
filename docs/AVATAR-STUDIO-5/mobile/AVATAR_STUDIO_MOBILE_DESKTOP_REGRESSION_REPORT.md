# Avatar Studio — Relatório de Regressão do Desktop (Track C)

Prova de que a adaptação mobile é **aditiva** e não tocou o desktop aprovado
(Track A, congelado em `ba4bf4d3`).

## 1. Mecanismo de isolamento

- Flag `as6.mobile_studio` default **OFF** em `PADROES` (`flags.ts`).
- `useMobileStudio()` retorna `false` quando a flag está OFF → `ShellStudio`
  **não** aplica `data-mobile`.
- **Todo** o `mobile.css` está escopado em `.avst5-shell[data-mobile]`. Sem o
  atributo, o seletor não casa: **zero** regra mobile aplica.

Conclusão estrutural: com a flag OFF (produção), o DOM e o CSS efetivo do shell
são idênticos ao aprovado — a importação do `mobile.css` adiciona regras que
nunca casam.

## 2. Regressões automatizadas (flag OFF)

| Teste | Resultado |
|---|---|
| `v43-single2d-parity` | ✅ verde |
| `v43-single2d-flow` | ✅ verde |
| `v43-legacy-compat` | ✅ verde |
| `v43-category-focus` | ✅ verde |

Rodadas repetidamente a cada Marco (M1→M10). **Nenhuma** regrediu em nenhum
ponto. Board `14_MOBILE_DESKTOP_REGRESSION.png` mostra o grid de 5 colunas
aprovado renderizando a 1280×900 com a flag OFF.

## 3. Byte-stability

A adaptação não adiciona campo serializável, não muda o motor 2D e não toca
`partes/*`. Avatares/fotos salvos renderizam idênticos — a mudança é puramente
de **layout do container**, atrás de flag.

## 4. Rollback

Desligar `as6.mobile_studio` remove 100% da composição mobile em runtime, sem
deploy. É o mecanismo de rollback por-feature previsto no §651.

## 5. Estado das travas

```
MAIN_TOUCHED=NO   PUSH=NO   MERGE=NO   DEPLOY=NO   ROLLOUT=NO
GOLDENS_RECORDED=NO   FULL_SUITE_RUN=NO   TRACK_A_DESKTOP_REGRESSION=ZERO
```
