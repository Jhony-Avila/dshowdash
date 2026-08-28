# Track C Mobile — Resultados de Rede e Save

Captura via wrap de `window.fetch` no harness (mocks controlados; **sem produção
real**). 390×844, flag ON. Comparado com desktop (flag OFF).

## Chamadas por fase

| Fase | Chamadas |
|---|---|
| Carga inicial | nenhuma chamada de save (assets via mock do harness) |
| Edição (equipar card) | nenhuma escrita (só estado local) |
| Save (1 clique) | `POST /api/avatar/studio.php` + `POST /api/avatar/estado.php` (via check auth `GET /api/auth/check.php`) |

## Contrato

| Item | Resultado |
|---|---|
| Endpoint de save | `/api/avatar/estado.php` (+ `studio.php`) ✅ correto |
| Método | POST ✅ |
| Estado "salvando"/pendente | `.avst5-salvar-pendente` indicado ✅ |
| Confirmação | pendente→salvo (`.avst5-salvar-pendente` some) ✅ |
| Tratamento de erro | `.avst5-salvar-erro` (não disparado no caminho feliz) ✅ |
| Contrato persistido | inalterado (Track C não toca serialização/API) ✅ |

## Paridade mobile ≡ desktop (característica do serviço de save)

| Cenário | POST estado.php |
|---|---|
| MOBILE (flag ON) 1 clique | 2 |
| MOBILE (flag ON) 2 cliques | 4 |
| DESKTOP (flag OFF) 1 clique | 2 |
| DESKTOP (flag OFF) 2 cliques | 4 |

**Conclusão:** o padrão de rede do save é IDÊNTICO em mobile e desktop. O Track C
não altera em nada o comportamento de rede/save — apenas reposiciona a barra.

## Nota P2 (fora do escopo Track C)

O serviço de save compartilhado (Track A) **não trava um duplo-clique síncrono**
(2 cliques → 2 submissões). Isso é PRÉ-EXISTENTE e idêntico no desktop aprovado;
corrigi-lo exigiria mexer no handler de save congelado (reabrir Track A). No
mobile o botão é ≥44px com `touch-action: manipulation` (sem double-tap-zoom
acidental) — o risco é o mesmo do desktop. Registrado como **P2** para os donos
do serviço de save, não como regressão mobile.
