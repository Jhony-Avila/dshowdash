# 2D MODE ARCHITECTURE AUDIT — V4 (§5)

> Objetivo (§5): resolver a questão de PRODUTO dos "modos 2D" ANTES de criar
> mais arte. Base `dc14cd3f` (V3.2). Fonte: grep real do projeto + leitura do
> código (não suposição). Termos buscados: econômico, classic/clássico/classico,
> premium, 2D, arte_v2, classico_premium, face_v2, Legacy, Candidate.

## TL;DR (recomendação executiva)
Hoje o 2D expõe ao usuário um conceito de implementação — o toggle **"✦ Premium"**
(gated por `as6.classico_premium`) — enquanto a arte ELEVADA de verdade mora atrás
de OUTRA flag (`as6.arte_v2`, default OFF). Resultado: mesmo ligando "Premium" o
usuário NÃO recebe a arte nova; e há 3 flags + 1 campo de config que ninguém fora
da engenharia deveria conhecer. **"Econômico" NÃO existe como modo 2D** (é só tier
de LOD/material do 3D). Proposta: **user vê só 2D/3D; dentro do 2D recebe a melhor
arte automaticamente; Legacy vira compatibilidade automática/avançado; as flags
viram implementation flags** (mantidas p/ rollback, §7). Nada disso remove rollback.

## Inventário por ocorrência

### 1. `acabamento: 'premium'` (campo de config) — **USER-FACING**
- **Onde**: `domain/types.ts` (campo), `ShellStudio.tsx:1275-1291` (toggle **"✦ Premium"**, `data-teste="toggle-acabamento"`, só aparece com `flag('as6.classico_premium')`), persistido em `api/avatar/studio.php` (`avst_validar_config`, l.201-203).
- **Técnico ou user-facing?** User-facing (botão "✦ Premium" + LOOKS_2D + export na "premium-bar").
- **Renderer**: `svgDe` liga o trilho premium só quando `acabamento==='premium' && flag(classico_premium) && flag(arte_v2)`.
- **Catálogo**: com premium, cards `_px_` entram (via `classico_premium`).
- **Por que existe**: onda 1411 (#159) — introduziu o "Classic Premium" como acabamento opcional do avatar.
- **Quem precisa**: o produto (é a porta do 2D premium). Mas o NOME e o toggle confundem.
- **Pode sair da UX?** O TOGGLE sim (novos avatares nascem premium — `configInicial()` já faz isso com o trilho ligado). O CAMPO permanece (byte-stability/saves). → **Recomendação: acabamento='premium' vira o DEFAULT do 2D novo; sem toggle "Premium" para o usuário comum.**

### 2. `as6.classico_premium` (flag) — **TÉCNICO** (hoje vaza p/ UX)
- **Onde**: `nucleo/flags.ts` (default **OFF**), `AvatarCatalog.itensDe` (gate de listagem `_px_`), `svgDe` (parte do AND premium), `ShellStudio.tsx` (mostra/esconde a premium-bar).
- **Renderer/Catálogo/Config**: gate de listagem de `_px_` + parte do gate de render premium.
- **Por que existe**: rollback §651 do trilho premium inteiro.
- **Pode sair da UX?** Sim — é implementation flag. Deve deixar de decidir se o usuário vê uma "barra Premium". → **implementation flag; ON no produto padrão, mas invisível.**

### 3. `as6.arte_v2` (flag) — **TÉCNICO** (correto; não vaza)
- **Onde**: `flags.ts` (default OFF, depende de `classico_premium`), `svgDe` (liga a ARTE elevada V3/V3.2/V4). 6 ocorrências, ZERO UI.
- **Por que existe**: #219-R1 — segura a arte candidata (Golden) atrás de flag até aprovação humana do Gate A.
- **Pode sair da UX?** Já está fora (dev/candidate). Mantém como implementation flag até o rollout. **É a flag que, ligada, entrega a arte boa** — hoje o usuário comum nunca a vê.
- **PROBLEMA-CHAVE**: "Premium" (o que o usuário liga) ≠ "arte_v2" (o que realmente eleva). Ligar Premium sem arte_v2 dá o premium ANTIGO. Essa dissociação é a raiz da confusão.

### 4. `as6.face_v2` (flag) — **TÉCNICO**
- **Onde**: `flags.ts` (default OFF), gate das CATEGORIAS faciais novas (nariz/barba/sobrancelha em `categoriasAtivas`), expressão semântica/idade/assimetria e canais `coresFace.*` no render. 26 ocorrências.
- **Pode sair da UX?** É implementation flag do rosto v2. No V4 (rosto reconstruído) deve consolidar com o trilho da arte elevada, mas **sem remover rollback agora** (§7/§87).

### 5. Legacy / legado (155 ocorrências) — **CONTRATO, não modo de produto**
- Bases/partes clássicas (não-`_px_`), `corpoInteiro` (vs `corpoInteiroPremium`), byte-stability §651.
- **Papel (§75)**: abrir saves antigos, comparação, rollback, dev. NÃO deve ditar o novo design.
- **Pode sair da UX?** Sim do fluxo de NOVO usuário; permanece automático p/ save legado + "Compatibilidade clássica (Avançado)".

### 6. Candidate Mode (24 ocorrências) — **DEV/QA**
- `FLAGS_CANDIDATE` + `definirCandidate()` — liga a experiência candidata inteira por override local. Interno (§13); usuário final nunca vê. Manter.

### 7. "Econômico" — **NÃO É MODO 2D** (esclarecimento)
- 45 ocorrências, TODAS em 3D: `Partes3d`/`FamiliasMaterial`/`Renderizador3d` — tier de **LOD/material** (economico|medio|alto) do renderer 3D e do farm CC0. **Não existe "2D econômico".** Nenhuma ação no 2D; a incerteza do briefing (§5 "possivelmente econômico na interface") se resolve: é só 3D.

### 8. `NivelQualidadeVisual` (QualidadeVisual.ts) — metadado de asset
- `'prototype'|'legacy'|'production'|'premium'|'hero'` com rótulos "Protótipo/Legado/Produção/Premium/Hero". É QUALIDADE por asset (dado de catálogo), usado p/ ordenar/curar. Não é um "modo" — é insumo perfeito para o **MAIN vs ALL/LEGACY grid** do §76.

## Matriz de flags (efetiva) — confirmada em V3.2 (flag matrix)
| Estado | classico_premium | arte_v2 | Catálogo `_px_` | Render | Legacy |
|---|---|---|---|---|---|
| A | OFF | OFF | escondido | CLÁSSICO byte a byte | estável |
| B | ON | OFF | listado | ainda CLÁSSICO (arte_v2 gaticia) | estável |
| C | ON | ON | listado | **ARTE ELEVADA** | estável |
(Legacy byte-stable nos 3; teste `flag-matrix` — ver RC_FLAG_MATRIX abaixo.)

## Proposta de arquitetura de PRODUTO (§6/§71)
1. **UX principal: só `2D` e `3D`.** Sem "econômico/Classic Premium/arte v2/novo premium" para o usuário comum.
2. **Ao entrar em 2D → melhor arte disponível automaticamente.** Novo avatar nasce com `acabamento='premium'` e a arte elevada ligada (quando o rollout permitir). **Remover o toggle "✦ Premium" do fluxo padrão.**
3. **Legacy** = automático ao abrir save legado, ou "Compatibilidade clássica" em **Avançado**. Nunca decisão central.
4. **Flags viram implementation flags** (§7): `classico_premium`, `arte_v2`, `face_v2` continuam para rollback até o rollout terminar; deixam de aparecer/decidir UX. Consolidação só DEPOIS de estável (§317).
5. **Catálogo curado (MAIN/ALL/LEGACY)** usando `NivelQualidadeVisual` (§76-77): MAIN = só assets aprovados (hero/premium); ALL/LEGACY = Avançado.
6. **Performance (§72)**: não inventar "2D econômico". Se algum dia justificar, medir CPU/render/bytes/DOM/memory/export antes. Hoje: sem ganho material documentado → não criar modo separado.

## Riscos / não-fazer agora
- NÃO apagar flags (rollback vivo, §7/§88). NÃO consolidar face_v2/arte_v2 agora se ameaçar rollback. NÃO mudar persistência de saves. A simplificação é de UX/apresentação, não de contrato.
