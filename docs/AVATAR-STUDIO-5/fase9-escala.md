# AS5 — Fase 9: Escala, rollout e observabilidade (§637; §647–§656; P11/P15/P16)

**Fontes lidas:** §647–§656 na íntegra (migração/rollout/rollback/observabilidade) · P11/P15/P16 por índice nas fases anteriores.

## Rollout (§647/§650/§651) — plano concreto

A migração gradual do §647 JÁ ESTÁ RESPEITADA pela arquitetura: o shell novo
convive com o clássico atrás de `as5.novo_shell` (decisão #47), com botão
"Modo clássico" como retorno imediato — nenhum big bang.

| Etapa §650 | Como executar aqui |
|---|---|
| A Interna | Jhony liga `as5.novo_shell` via localStorage `dshow.avst.flags.v1` (override local já suportado) |
| B Piloto | flag server-side por user_id no payload de flags (infra F1 pronta; lista de ids no config) |
| C Beta | mesma flag + telemetria ObservarNucleo ativa |
| D Gradual | percentual por hash de user_id no servidor de flags |
| E Padrão | default true; clássico vira o fallback |
| F Legado | remover clássico SÓ após §649 (migração validada por comparação visual) |

Rollback (§651): flags fail-safe (OFF na dúvida — F1), caminho legado
intacto, config byte-estável (avatares antigos re-renderizam idênticos —
provado por teste), /backup no servidor (regra do Jhony), git com hash de
produção conferido no deploy.

## Observabilidade (§652–§656) — o que já emite

ObservarNucleo (F1) publica comando/undo/redo/preview/conflito na
telemetria; Telemetria.ts cobre IA (ia, ia_validacao F8), foto
(foto_template/foto_exportou F6) e uso de catálogo. Dashboards do §652
(FPS/context-loss/abandono) fazem sentido COM o 3D — pós-UBC. Conversão
preview→equipar já é derivável dos eventos existentes.

## Trilhas de conteúdo (§637/P11) — inventário atual do catálogo 2D

bases 20 · espécies 16 · cabelos 50 · olhos 40 · bocas 40 · roupas 30 ·
acessórios 30 · fundos 20 · molduras 24 · efeitos 24 · auras 15 ·
banners 15 · emblemas 20 = **344 partes** (+30 títulos).
Raridade: 59 comum · 81 incomum · 93 raro · 61 épico · 34 lendário ·
8 mítico · 8 exclusivo — curva saudável (topo escasso).
Prioridades de arte quando a produção contínua abrir (F9 real): slots de
acessório além dos 3 atuais (§68.1), peças de vestuário por partes
(§122.1), variações de espécie (P3 §101) e assets 3D pós-UBC.

## Pendências herdadas (registradas, não bloqueiam)

§67 drawer de detalhes · §65.1/§65.2 comparação lado a lado/sequencial ·
formatos wide do Photo Studio (§325) · editor de camadas completo (P7 core)
· TODOS os itens da lista "precisa do Jhony" (relatório final).
