# Avatar Studio — Auditoria Mobile (Track C)

> Frente autorizada de adaptação mobile do Avatar Studio 5, **sem** desfazer a
> aprovação desktop (Track A, congelado em `ba4bf4d3`). Flag mestre
> `as6.mobile_studio` (default **OFF**). Base: `origin/golden/art-wip @ ba4bf4d3`.

## 1. Problema

O shell aprovado (`.avst5-shell`) é um **grid de 5 colunas**: navegação (176px) ·
palco (1fr) · alça · catálogo (380px) · alça. Precisa de ~928px para respirar.
Abaixo disso degrada; num celular de 375px sobra ~11px para o palco — o produto
fica inutilizável. Não havia composição mobile: só o grid desktop encolhido.

## 2. Diagnóstico por região

| Região | Estado no celular (antes) | Causa |
|---|---|---|
| Grid do corpo | 5 colunas espremidas | `grid-template-columns` fixo |
| Palco | ~11px de largura | espremido entre nav e catálogo |
| Navegação | coluna vertical cortada | `flex-direction: column` fixo |
| Catálogo | 380px estourando a tela | largura fixa |
| Ferramentas (Coleções…) | modal centrado minúsculo | overlay desktop |
| Barra de salvar | escondida no modo studio | regra desktop `display:none` |
| Alvos de toque | < 44px | dimensionados para mouse |
| Teclado virtual | cobria os campos | sem tratamento de VisualViewport |
| Safe-area (notch) | ignorada | sem `env(safe-area-inset-*)` |

## 3. Restrições herdadas (invioláveis)

- **Byte-stability**: nada muda o render de avatares/fotos salvos.
- **Track A congelado**: desktop aprovado byte a byte — a adaptação é aditiva.
- **Flag desligável (§651)**: `as6.mobile_studio` default OFF; rollback = desligar.
- **Sem UA-sniffing (§2)**: decisão por *conteúdo/viewport*, não navegador.
- **TypeScript é a fonte** — nunca editar `.js` irmão.

## 4. Estratégia aprovada

Decisão **centralizada**: uma flag + um hook de viewport (`useMobileStudio`,
matchMedia `(max-width:768px),(max-height:520px)`) liga `data-mobile="1"` na
raiz do shell. **Todo** CSS mobile é escopado em `.avst5-shell[data-mobile]` —
sem o atributo (desktop) nada aplica. **Zero** duplicação de store/motor/save;
só **layout**. Detalhe em `AVATAR_STUDIO_MOBILE_RESPONSIVE_ARCHITECTURE.md`.

## 5. Escopo entregue (Marcos 1-10)

Fundação + flag · shell/palco/navegação/catálogo · bottom sheets/overlays ·
controles/cores/assets · save/teclado/safe-area/orientação · compat legada ·
acessibilidade/touch targets · desempenho/estabilidade · E2E + regressões V4.3 ·
boards/documentação/auditoria. Ver `AVATAR_STUDIO_MOBILE_FINAL_REPORT.md`.
