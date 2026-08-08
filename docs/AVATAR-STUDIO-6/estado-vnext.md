# AS6 L0 — Avatar State vNext (lote 751–760 · flag `as6.estado_vnext`)

> §3390–§3398 do `docs/AVATAR_STUDIO_6.md` · decisão #77 · 2026-08-08.

## O que o AS6 pede × o que já existia

| AS6 | Onde está |
|---|---|
| schemaVersion (§3392) | `AvatarConfig.versao` (VERSAO_CONFIG) e `EstadoAvatar.schemaVersion` (contratos.ts) |
| avatarVersion (§3392) | `base_version` do espelho §619 (`AvatarStore.versao`) |
| updatedAt (§3392) | `atualizadoEm` (servidor é a fonte do relógio) |
| Estado em domínios, não lixeira (§3390–§3391) | `EstadoAvatar` (identity/body/appearance/equipment/presentation/environment/animation/renderer) |
| Renderer Contract (§3394) | `nucleo/renderizador.ts` (§401) — initialize→dispose + `diagnostico()` |

**Nenhum campo novo é persistido** — byte-stability preservada por construção.

## O que o lote adicionou

1. **`nucleo/estado-vnext.ts`** — motor de migrações de schema (§3393):
   `migrarSchema(registro, bruto)` aplica a cadeia v1→v2→… (pura,
   determinística, nunca lança; falha devolve o ORIGINAL). Os registros
   reais (`MIGRACOES_CONFIG`, `MIGRACOES_ESTADO`) nascem **vazios** na
   v1 — o gancho no `validarConfig` é identidade hoje. O primeiro bump
   real (ex.: vestuário multi-peça, lote 811+) adiciona a entrada AQUI,
   com teste próprio. Difere de `nucleo/migracoes.ts` (§299–§300), que
   migra CHAVES de storage; este migra o CONTEÚDO.
2. **Renderer Capability Registry (§3396)** — `CAPACIDADES_RENDERER`:
   `2d`/`3d`/`foto` declaram 8 capacidades (morfos, física, poderes,
   luz 3D, foto HQ, fundo animado, animação, canais de cor). A UI
   consulta `capacidadesDe(id)` em vez de espalhar `if (renderer)`.
3. **Dependências de flags (§3398)** — `DEPENDENCIAS_FLAGS` em
   `nucleo/flags.ts`: filho só é efetivo com os pais ligados → rollback
   §651 transitivo (desligar `as5.palco3d` desliga a árvore do palco).
   Regra aprendida em teste: flags de motor com **dupla entrada**
   (palco E Foto §329 — `as5.materiais3d`, `as5.morfos3d`,
   `as5.animacao3d`, `as5.foto3d`) NÃO têm pai.

## Rollback

`as6.estado_vnext: false` → `flag()` volta ao comportamento plano e o
`validarConfig` pula a migração (que já é identidade). Zero diferença
de bytes em qualquer avatar salvo com a flag em qualquer posição.

## Teste

`scripts/avatar/testes/estado-vnext.mjs` (node puro, padrão
nucleo.test.mjs): motor (cadeia/carimbo/falha/futuro/não-objeto),
registros vazios = identidade, dependências + rollback, capability
registry completo.
