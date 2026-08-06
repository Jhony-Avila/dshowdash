# Mapa de Lacunas do Briefing — v8 (pós onda 511–610, 2026-08-06)

> **TRILHO A ESGOTADO** nesta onda (decisão #61). O que resta do briefing
> depende do Jhony (trilho B) ou de decisão estratégica (trilho C).

> Método: briefing (006a394b, 1.764 §§) cruzado por evidência com o código.

## O que a onda 231–260 fechou

- **A2**: §160.1–.4 (4 cenários novos), §161 (propriedades + vivo), §162
  (6 horas), §154/§154.1 (sequência do poder), §155 (preview no card),
  §167 (moldura por raridade), §168 (emissão/sombra/escala + contextos
  ranking/notificação), §170/§170.1 (posição + presets do banner),
  §171.3/§172 (selo real + editor de título).
- **A4**: §208/§209 (hero v2 + experimentar), §214 (galeria), §217
  (tiers), §218 (ordenações), §219 (coleção no card), §221 (seus
  números), §226–§228 (origem/disponibilidade/arquivado), §231 (diff
  cores+título).
- **A1/A3**: §102 (tipo corporal), §105 (presets faciais), §118
  (postura), §119 (idle 2D), §120 v2 (7 emotes), §349 (compor pra mim),
  §361 (histórico visual), §364 v2 (renomear/8), §369 (presets export).

## TRILHO A — implementável agora (restante)

**A1**: correções locais finas §333–334, máscaras §340–341 (além da
forma), publicação/derivação no Dash §365–366 (precisa de endpoint —
semi-B). **A2**: poderes com roteiro visual por FAMÍLIA §153.1–.4
(partículas §156 dedicadas), som ambiente §161, editores §166.2–.3
(camadas/comportamentos de moldura — pede arte nova → semi-B). **A3**:
granularidade §108–111 além da escala (pede arte), barba §114 (pede
arte), §102.2 parâmetros finos. **A4**: §207 coleções multi-categoria
(pede curadoria), trailer §208 (asset). **A5 3D**: piscar §440, env maps
§449, pós-processamento §457, partículas 3D §444–446. **A6**: manifest
§267, streaming §274, tokens §283–289, logging §291 v2.

## TRILHO B — bloqueado no Jhony

Zip UBC (morphs §412+, roupas §416, sockets §426+) · Chave IA (P13; IA de
imagem §355–358) · Infra P16 · endpoints novos (publicação §365–366).

## TRILHO C — estratégico

P11 CMS · P12 plataforma · P14 social server-side · P17 monorepo · P18
processos.

## O que a onda 261–310 fechou

- **A5 3D**: vida procedural §440–441 · ambiente §449 v2 · tone mapping
  §457–458 · partículas 3D §444–446 · rim §452 · enquadrar §454.
- **A6**: manifest §267 · cache multinível §277 · lazy §275 (8 chunks) ·
  tokens §283/§287 v2 · heap no viewer §290 v2 · crítico §291 v2.
- **A2**: famílias §153.1–.4 + biblioteca de partículas §156 (roteiro por
  família na cor de destaque, câmera §154 passo 2).
- **A4/P9/P10**: tipos §216 · XP por uso §222–223 · títulos de nível ·
  badges por tier §224 v2 · extrato §634 · microinterações · focus trap ·
  prefers-contrast · kill-switch §297 · storage doctor §629 v2.

## O que a onda 311–410 fechou

- **Foto**: nitidez §333 · formas §340–341 (estrela/escudo) · JPEG §369 ·
  marca §372 · galeria §326 v2 (contagens).
- **Palco**: som ambiente §161/§178 · crossfade §157.4 · presença §157.5 ·
  luz §164.3–.4 · efeitos funcionais §157.1–.5 + gatilho §158.1.
- **3D**: câmera cinematográfica §176 · pós leve §457/§177.1 · poses §443 v2.
- **Sistemas**: presets §201–§205 (versão/snapshot/inteligente) ·
  temporadas §248 · desafios §251 · recordes §252 · diário §245 v2 ·
  portabilidade §254/§309/§310 · orçamento §183/§186.1 · prefetch §274 ·
  recentes §88 · vazios §92 v2 · raridade §61 v2 · materiais §75.

## O que a onda 411–510 fechou

- i18n §296 (fundação PT/EN + seletor) · busca §57.1–.3 (tolerante,
  sugestão, atalho /) + §58 v2 · cards §60.9 (indisponível visível) /
  §60.10 (substitui X) / §66 (hover premium) · editor de efeitos §158 +
  gatilho §158.1 · pós 3D REAL §457/§177 (EffectComposer+bloom+vinheta) ·
  heatmap §293 + eventos §294 locais · luz AUTO §165 + combinados §164.2 ·
  timeline git-like v2 §244 + histórico visual §203 + evento ativo §247 ·
  setas na grade §297 + foco visível.

## O que a onda 511–610 fechou (trilho A ESGOTADO)

- **i18n §296 cobertura**: catálogo (busca/ordenar/abas/chips §157/
  recentes/quis-dizer) + painéis (Foto/Conquistas/horas/luzes/presets).
- **Foto**: §321.1–.2 (avatar/preset → foto) · §348.1 partículas
  estáticas · §370 specs de export · luz/composição §335–348 restos.
- **Roupas §72.1/.3/§74**: CONJUNTOS curados (roupa+acessórios+paleta em
  1 clique, bloqueios preservados, anúncio aria-live).
- **Criação fina §102.2**: corpoFino largura/altura multiplica o preset
  (TS+PHP+adaptadores) · borda suave §340–341 (máscara plumada).
- **Palco/som v3**: §176.1 Órbita/Composto · §178.2 som POR CATEGORIA
  (volume/efeitos/ambiente/celebrações/preview) · §157.4 entradas
  one-shot (Materializar/Teleporte/Ascender).
- **Infra v3**: §268 pipeline com fases · §277 thumbs em IDB · §299–300
  migrações com backup + leitura dual (§300 substituição automática
  registrada como desligada — decisão #63).
- **UX final**: §64.2 fixar prévia · §59.1 compacta 70–80% · §60.4/.6
  badges · §545 durações padronizadas.

## Sequência recomendada (611+)

1. **Trilho B destravado** (quando chegarem, nesta ordem de valor):
   zip UBC → morphs §412+/piscar §440 real/roupas 3D §416/sockets §426+;
   chave IA → §355–358 (estilização por IA com validador §636);
   endpoints → publicação/derivação §365–366.
2. **Arte nova** (decisão do Jhony): peças de roupa §72 reais · morfologia
   facial §108–111 · barba §114 · fundos §335–336 · trailer §208.
3. **Trilho C** (decisão estratégica): P11 CMS · P12 plataforma · P14
   social server-side · P17 monorepo · P18 processos.
