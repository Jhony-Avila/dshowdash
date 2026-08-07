# Homologação da onda 611–720 (§487–§495 + gate §631) — lote 701–710

> Executável: `node scripts/avatar/testes/homologacao.mjs` (na suíte).
> Data desta rodada: 2026-08-07 · 34 assets · 28 aprovados limpos ·
> 6 com ressalvas (legados, justificadas) · **0 reprovados** ·
> motor3d 1036KB ≤ gate 1180KB (§631).

## §487 Validador (ampliado neste lote)

Verifica por asset: arquivos obrigatórios · manifest §517 · hashes §478
por LOD · triângulos por LOD (gate §631 + exceções declaradas) ·
texturas por LOD (2048/1024/512) · bones ASCII + lista canônica POR RIG
(§436) · **licença §511** · **contagem de materiais** · **UV em
primitivas texturizadas** · **escala (altura 0,8–3 m em bases)**.
Não coberto (sem base confiável no GLB): origem/orientação — o preview
técnico §489 cobre visualmente. Draw calls: medidos em runtime (HUD §467).

## §488 Relatório

`relatorioDeValidacao(pasta)` → status (aprovado / com ressalvas /
reprovado) + linhas por item. Regra: reprovado NUNCA publica; ressalva
documenta (ex.: legados sem lista canônica de rig — rigs próprios
corrigidos nos manifests, decisão do lote 611–620).

## §489 Preview técnico

Coberto pelo palco na homologação: corpo esbelto → robusto → compacto
(§102 via UI), fundo claro (Estúdio) e escuro (Neutro), câmera frontal.
Evidências: `saida/homolog-robusto-vestido.png` · `saida/homolog-neutro.png`.
Poses executiva/emote: cobertas pelos clipes UAL (Idle_Talking, Interact).

## §490 Roupa — checklist

| Item | Situação |
|---|---|
| rig correto | ✅ 65 bones idênticos, validador cobra lista canônica |
| sem deformação crítica | ✅ prova visual lotes 631/701 (zero clipping) |
| morphs suportados | ✅ escala §414 veste o conjunto (§413) |
| corpo ocultado | ✅ body masking §415.2 (teste roupas3d) |
| materiais recoloríveis + canais | ✅ canal roupa §420 (teste materiais3d) |
| clipping aceitável | ✅ passo 13 do assembler reporta faces ocultas |
| LODs / thumbnail | ✅ 3 LODs + thumb §508 por peça |
| fallback | ✅ §651 flag off = sem roupas 3D; 2D intacto |
| light e dark / captura | ✅ §489 evidências + captura v2 §329 |

## §491 Cabelo — checklist

encaixe/volume/câmera/cor/LOD/sombra/fallback ✅ (lotes 621/641/651 +
homologação). **N/A honestos**: boné/capacete/headset (não há esses
acessórios 3D publicados — entra com os assets); física (§424: rígido
econômico por decisão #66 — assets CC0 sem spring bones); transparência
e mechas (hair cards opacos do pack; revisita com assets premium §423.3).

## §492 Acessório — N/A

Não há acessórios 3D próprios publicados (capuz/ombreira são PEÇAS de
roupa com máscara). Sockets §426 prontos (props procedurais lote 131).
Checklist ativa quando o primeiro acessório real entrar.

## §493 Animação — checklist

| Item | Situação |
|---|---|
| rig / retargeting | ✅ mesmo rig ubc-v1 (§436 reuso direto) |
| loop | ✅ homologação: animação viva no palco (frames diferem) |
| root motion | ✅ removido no carregamento (§437, teste animacao3d) |
| braços/mãos/pés/cabelo/roupa | ✅ um esqueleto move o conjunto pós-rebind |
| câmera | ✅ enquadramento §453 preservado no reload |
| corpo robusto/compacto | ✅ escala §414 compõe com clipes (homologação) |
| interrupção | ✅ máquina §433 + 'nenhum' congela (bugfix lote 691) |
| reduced motion | ✅ idle/vida/olhar desligam (testes §297) |

## §494 Cenário / §495 Poder — N/A (F9)

Cenários 3D atuais são fundos/luz do palco (§449/§160); poderes 3D
aguardam arte própria (tocarPoder é stub declarado). Checklists ativam
na F9 com arte.

## Gate §631

motor3d ≤ 1180KB — medido no dist local pela homologação (1036KB) e no
deploy blindado (bloqueante). Triângulos/texturas por LOD: no validador.
