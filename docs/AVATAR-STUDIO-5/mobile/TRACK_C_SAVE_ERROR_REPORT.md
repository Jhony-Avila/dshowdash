# Track C — Save no mobile: correção aplicada (opção 3) + matriz de erros

Teste: `mobile-save-error-matrix.mjs`. **A correção do save foi aplicada
EXCLUSIVAMENTE na composição mobile** (flag `as6.mobile_studio` ON), no
adaptador de apresentação — **o serviço de save compartilhado (Track A) NÃO
foi tocado**; desktop (flag OFF) permanece byte a byte. O gap do serviço
compartilhado fica registrado, sem aplicar, em `TRACK_A_SAVE_P1_PROPOSAL.md`.

## O que mudou (mobile ON, isolado)

1. **`ShellStudio.tsx`** — quando `mobileStudio` é verdadeiro, o `aoSalvar` da
   barra envolve o save numa `Promise.race` com timeout do cliente
   (`window.__avstSaveTimeoutMs` || 12000) e classifica **sucesso real** como
   `r.ok && r.origem !== 'local'`. O fallback offline-first (`origem:'local'`,
   que retorna `ok:true`) deixa de contar como "salvo no servidor" no celular.
2. **`BarraSalvamento.tsx`** — prop `mobileStrito`: guarda contra duplo-envio
   em voo (`emVoo`), foco no botão "Tentar de novo" ao entrar em erro (a11y),
   e mensagem honesta *"Não salvo no servidor — suas mudanças continuam aqui."*
3. **`App.tsx`** — `aoSalvarLegado` repassa `origem` ('api' | 'local' | 'padrao')
   para o shell decidir. Nenhuma mudança de contrato de rede, motor, store ou
   persistência §619.

Desktop (flag OFF) ignora todo o caminho acima: `mobileStrito=false`, sem
`Promise.race`, `sucessoReal = r.ok` — comportamento aprovado inalterado.

## Matriz (mobile ON) — 12 cenários — execução ao vivo (HEAD ea01bb7d)

`window.__avstSaveTimeoutMs=900` no teste (timeout curto p/ exercitar o caso).

| Cenário | POST | pend antes | pend/erro depois | erro visível | retry | shell | jsErr |
|---|---|---|---|---|---|---|---|
| HTTP 400 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| HTTP 401 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| HTTP 403 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| HTTP 409 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| HTTP 422 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| HTTP 429 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| HTTP 500 | 2 | sim | **erro** | sim | sim | vivo | 0 |
| timeout | 2 | sim | **erro** | sim | sim | vivo | 0 |
| offline | 2 | sim | **erro** | sim | sim | vivo | 0 |
| json inválido | 2 | sim | **erro** | sim | sim | vivo | 0 |
| studio.php falha | 2 | sim | **erro** | sim | sim | vivo | 0 |
| estado.php falha | 2 | sim | **salvo** | não | sim | vivo | 0 |

- **NEGATIVE_MATRIX: 11/11** cenários negativos → "pendente OU erro visível"
  (sem confirmação falsa). Antes da correção eram **0/11**.
- **estado.php falha é POSITIVO**: o save AUTORITATIVO (`studio.php`) passa; só
  o espelho §619 (`estado.php`, best-effort) falha → corretamente "salvo".
- **Garantias mobile (todas ✓):** shell vivo, ≤3 POST (sem loop), botão
  utilizável (retry com foco), 0 erro JS.
- **RETRY:** 500 → erro → servidor volta → "Tentar de novo" salva de verdade;
  edição preservada durante o erro (card equipado permanece). ✓
- **Desktop (flag OFF):** fallback local NÃO vira erro — aprovado inalterado. ✓

## Escopo e reversibilidade

- **Isolado atrás de `as6.mobile_studio`** (default OFF, §651): rollback =
  desligar a flag → desktop e o próprio serviço de save intactos.
- Commit único revisável: `ea01bb7d` *"mobile(C-save-fix): save ESTRITO na
  composição mobile (isolado; desktop byte a byte)"*.
- **Track A não reaberto.** O aprimoramento no serviço compartilhado (que
  beneficiaria também o desktop) segue registrado, **sem aplicar**, em
  `TRACK_A_SAVE_P1_PROPOSAL.md` para decisão futura do Jhony.
