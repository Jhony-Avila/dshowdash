# Track C Mobile — Registro de Riscos

## P0 (bloqueadores) — NENHUM

Nenhum bloqueador. A superfície Track C passou na auditoria sem defeito objetivo;
desktop com regressão ZERO; motor/persistência/arte intocados; flag OFF por
padrão.

## P1 (lacunas a fechar antes do rollout amplo)

| # | Risco | Mitigação |
|---|---|---|
| P1-1 | **Validação em device real pendente** (iOS/Android): leitor de tela, teclado virtual real, notch em paisagem, sessão autenticada. Headless não substitui. | Executar `MOBILE_REAL_DEVICE_TEST_KIT.md` antes do flip. Flag OFF mantém risco contido. |
| P1-2 | Contraste AA dos tokens em telas mobile não reavaliado (herança do tema Track A). | Checar no device real com os tokens vigentes. |

## P2 (observações, sem impedir handoff)

| # | Observação | Nota |
|---|---|---|
| P2-1 | Serviço de save (Track A) não trava duplo-clique síncrono (mobile ≡ desktop). | Pré-existente; fora do escopo Track C; dono é o serviço de save. |
| P2-2 | `mobile-color-controls` valida sizing só quando swatches estão na tela (surgem no Inspector/DetalheAsset). | Guardado; CSS aplica quando presente. |
| P2-3 | Aviso genérico de chunk-size do vite no build. | Pré-existente, não relacionado ao mobile. |

## Aceitação

Com a flag OFF por padrão, todos os riscos acima ficam contidos: o desktop
aprovado é o que roda em produção. O rollout mobile depende apenas de fechar P1-1
(device real) e da decisão humana de flip.
