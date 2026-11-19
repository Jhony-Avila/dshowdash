# Contrato "FOI SALVO OU NÃO" — servidor do módulo Produtos & Atributos

Dono do servidor: ESQUERDA (ramo `feat/foi-salvo-esq`, base `6738adb3`). Quem consome: a CIMA, que liga a tela depois do UX-1b (`lib/api.ts`, `EditorValor`, `Ficha`, `Preencher`).
Teste de banco real: `scripts/atributos/testes/foi-salvo-mysql.php`, nas bases ATRWEB_VAL_T_7, T_8 e T_9.

**Regra para a tela:** só mostre "Salvo" quando a resposta trouxer `recibo`. Um 2xx sem `recibo`, ou com corpo ilegível, significa resultado DESCONHECIDO: mostre "Não conseguimos confirmar se foi salvo" e ofereça "Conferir gravação".

---

## 1. Onde vale

Vale para todas as escritas (`POST`) de `api/atributos/index.php`. Todas passam por uma camada única, `OperacoesGravacao::executar` (`api/atributos/AtributosService.php`):

- valores: `valor`, `valor_limpar`, `valor_unidade`, `valor_opcao_remover`;
- vínculos e kits: `kit`, `kit_duplicar`, `kit_ativo`, `kit_itens`, `kit_escopos`, `kit_produtos`, `produto_kit`, `produto_atributo`, `massa_aplicar` (a prévia `massa_previa` não grava nada e fica FORA da camada: nunca traz recibo);
- dicionário, opções e unidades: `atributo`, `atributo_ativo`, `atributo_unidades`, `opcao`, `opcao_renomear`, `opcao_reordenar`, `opcao_ativa`, `unidade`, `unidade_ativa`;
- sugestões: `sugestao`, `sugestoes_lote`;
- legado: `grupo`, `grupo_ativo`, `ficha_revisar`.

Um chamador antigo, que não envia chave, continua funcionando. A única diferença é que a resposta passa a trazer `desfecho` e `recibo`, campos acrescentados ao que já vinha.

## 2. Quatro desfechos

| Desfecho | HTTP | Onde aparece | O que a tela faz |
|---|---|---|---|
| `aplicada` | 200 | `data.desfecho`, `data.recibo.desfecho` | "Salvo" (tem recibo) |
| `sem_mudanca` | 200 | idem | "Nada mudou", sem erro (o recibo diz que nada foi gravado: `campos_gravados: []`) |
| `recusada` | 4xx (422, 403, 404…) | `meta.desfecho` + `meta.motivos` = `{campo: mensagem}` + `meta.campos` | "Não foi salvo." + o motivo, junto de cada campo |
| `conflito` | 409 | `meta.desfecho` + `meta.atual` (rotas de valor) | Mostra o valor que estava ao abrir, o rascunho e o valor atual, com as unidades |

`meta.atual`, presente nos conflitos das rotas de valor:
```json
{"versao": 7, "versao_conjunto": "…", "valores": [{"estado": "informado", "valor_texto": null, "valor_num": "13", "valor_bool": null,
  "valor_data": null, "opcao_id": null, "opcao_chave": 0, "unidade_id": 3, "versao": 7, "excluido": false}]}
```
Outros códigos possíveis no `meta.desfecho`: `em_andamento` (409 `OPERATION_IN_PROGRESS`, explicado na seção 4).

## 3. O recibo

O recibo existe sempre que a escrita terminou. Os campos comuns são `operacao` (a rota), `chave` (a chave de operação, ou `null`), `desfecho` e `confirmado_em` (UTC).

| Rota | Campos próprios do recibo |
|---|---|
| `valor`, `valor_unidade` | `product_id`, `atributo_id`, `versao_nova` (versão da linha gravada), `campos_gravados` (por exemplo `["estado","valor_num","unidade_id"]`), `valor` (eco: estado, texto, número, booleano, data, opção, unidade, versão), `unidade_id` |
| `valor_limpar`, `valor_opcao_remover` | `product_id`, `atributo_id`, `versao_nova: null`, `campos_gravados: ["excluido_em"]` (ou `[]` quando `sem_mudanca`), `valor: null` |
| `ficha_revisar` | `product_id`, `campos_gravados: ["revisao"]`, `revisao` (o evento gravado: `usuario`, `criado_em` e a impressão), lido na mesma transação |
| `massa_aplicar` | `chave` (a da massa), `gravado` (`kits_aplicados`, `kits_removidos`, `inclusoes`, `exclusoes`), `resumo` da prévia |
| as demais | `versao_nova` (`versao_vinculos` ou `versao` do objeto gravado) e `campos_gravados` (os campos de dados do pedido; os de controle, como versão, chave e fotografia, ficam de fora) |

Nas rotas de valor, o valor do recibo é lido DENTRO da transação que gravou. A resposta não depende de nenhuma leitura feita depois do COMMIT. Antes, essa releitura acontecia fora da transação e, quando falhava, virava erro com o valor já gravado.

## 4. Chave de operação (idempotência)

- **Como enviar:** pelo cabeçalho `X-Chave-Operacao: <chave>` ou pelo campo `chave_operacao` no corpo. A chave tem de 8 a 64 caracteres, entre letras, números, `-` e `_`. Uma chave malformada recebe 422 com o campo `chave_operacao`. Gere UMA chave por intenção e reaproveite-a quando o resultado for incerto (o mesmo padrão de `chaveParaPedido` no Vincular).
- **Massa:** continua com a própria chave (`chave` no corpo, tabela `eq_pedido_massa`). Nela, o cabeçalho é ignorado.
- **Primeiro envio:** o servidor reserva a chave para o titular, com o id ESTÁVEL do usuário do Dash, a rota e a assinatura (sha256 da rota com o corpo canônico, sem a chave). A marcação como `aplicada` acontece **dentro da mesma transação que grava**, num gancho executado antes do COMMIT do repositório. Por isso não existe recibo `aplicada` sem a gravação, nem gravação sem o recibo.
- **Reenvio da mesma chave, com o mesmo pedido e o mesmo titular:**
  - quando já está `aplicada` ou `sem_mudanca`, volta 200 `{repetido: true, desfecho, recibo}` com o recibo ORIGINAL, sem efeito novo e sem auditoria nova;
  - quando está `em_andamento`, volta 409 `OPERATION_IN_PROGRESS` (`meta.desfecho = em_andamento`); use "Conferir gravação";
  - quando terminou em `recusada`, `conflito` ou `falhou`, ou está `em_andamento` parada há mais de 5 minutos (`interrompida`), o pedido executa de novo e `tentativas` aumenta.
- **Mesma chave com outro pedido, ou de outro titular:** 422 `IDEMPOTENCY_KEY_REUSED`. A resposta não revela o recibo de ninguém.
- **Retenção:** os recibos ficam em `eq_operacao` e nada é apagado. O reenvio vale enquanto a linha existir. A garantia de contrato é de **30 dias**; uma limpeza futura, se houver, só move linhas mais antigas que isso, com portão. Os recibos da massa (`eq_pedido_massa`) seguem a mesma regra.
- **Sem a migração 011:** a camada detecta a ausência de `eq_operacao` e segue sem guardar recibos. As seções 2, 3, 6 e 7 continuam valendo; o reenvio e a conferência pela chave ficam indisponíveis, e `conferir_gravacao` responde `nao_encontrada`.

## 5. Conferir gravação (somente leitura)

`GET ?r=conferir_gravacao&chave=<chave>`. Não grava nada e responde só ao titular da chave.

```json
{"chave": "…", "resultado": "aplicada|sem_mudanca|em_andamento|interrompida|nao_aplicada|nao_encontrada",
 "operacao": "valor", "recibo": {…} | null, "erro": {"codigo","http","mensagem","campos"} | null, "tentativas": 1, "criado_em": "…", "concluido_em": "…"}
```
- `aplicada` ou `sem_mudanca` trazem o recibo original.
- `nao_aplicada` significa que o pedido foi recusado, deu conflito ou falhou. Nada foi gravado, e `erro` traz o motivo.
- `em_andamento` significa que o pedido ainda está sendo processado.
- `interrompida` significa que a requisição morreu antes do COMMIT. Nada foi gravado, porque a marcação `aplicada` está no mesmo COMMIT da gravação.
- `nao_encontrada` cobre três casos: a chave nunca chegou ao servidor, é de outra pessoa ou a 011 está ausente.
- Para a massa (DSHOW-085), quando a chave não está em `eq_operacao`, a busca vai a `eq_pedido_massa`, conferida pelo titular. O resultado é `aplicada`, com `gravado` e `resumo`.

## 6. Gravado, mas a leitura seguinte falhou (DSHOW-090 e regra geral)

- **`ficha_revisar`:** o evento de revisão é gravado e relido na mesma transação. A ficha é relida DEPOIS. Se essa releitura falhar, a resposta é 200 `{gravado: true, releitura: "falhou", revisao_gravada, product_id, mensagem, desfecho: "aplicada", recibo}`. A tela mostra "Revisão salva, mas não consegui reler a ficha." + [Tentar reler]. "Não gravado" continua sendo erro (4xx/5xx sem `gravado`). Quando tudo dá certo, volta a ficha completa + `gravado: true, releitura: "ok", revisao_gravada`.
- **Regra geral, para qualquer rota:** se um erro acontecer depois de um COMMIT do repositório durante a requisição, a camada responde 200 `{gravado: true, releitura: "falhou", desfecho: "aplicada", recibo: {…, parcial: true}, mensagem}`. Nunca responde com um erro que pareça "não gravado".

## 7. Releitura de uma linha do Preencher (DSHOW-068)

- **Rejeitada:** 4xx com `meta.desfecho`, que pode ser `recusada` ou `conflito`; no conflito vem também `meta.atual`.
- **Confirmada, com a tela pendente:** 200 com `recibo`. Se a tela não conseguir atualizar, mostra "Salvo. Não foi possível atualizar o valor na tela." + [Atualizar valor].
- **Resultado desconhecido** (resposta perdida, corpo ilegível ou 2xx sem recibo): use `GET conferir_gravacao` com a chave.
- **"Reler linha":** é só um GET, sem gravar nada. Use `GET ?r=ficha_produto&product_id=` (uma linha da grade é um produto).

## 8. Histórico filtrado pelo atributo (DSHOW-066)

`GET ?r=historico_produto&product_id=&atributo_id=`. O filtro é aplicado no BANCO, ANTES do limite de 300. Entram:
- os eventos de valor do atributo;
- os vínculos avulsos ou exceções do produto com esse atributo;
- as decisões de sugestão cujo destino é esse atributo.

O vínculo de kit não pertence a um atributo e fica de fora.

Resposta: `{product_id, atributo_id, limite: 300, truncado, historico: […]}`.
- Lista vazia significa que não há histórico.
- Uma falha de leitura volta como **503 `HISTORY_UNAVAILABLE`** com a mensagem "Não foi possível carregar o histórico deste atributo.", que dá para distinguir do vazio. A tela mostra a mensagem + "Tentar novamente".
- Sem `atributo_id`, a resposta é a mesma de antes (os 300 mais recentes do produto) + `truncado`.

## 9. Lote de massa incerto e titular do recibo (DSHOW-085 / DSHOW-086)

- **DSHOW-085:** o reenvio da massa com a mesma `chave` e o mesmo pedido devolve o recibo (`repetido: true`) ANTES de revalidar contra o estado atual. Um produto que saiu do catálogo depois do lote não transforma "já gravado" em 422, e nenhuma operação nova é criada. Também é possível conferir pela seção 5, sem POST nenhum. Do lado da tela, nada fica guardado depois de logout ou troca de usuário, e o servidor reforça isso porque o recibo é do titular.
- **DSHOW-086:** o recibo da massa guarda `titular_id`, o id estável do usuário (011). O reenvio por outra identidade recebe 409 "Esta chave já foi usada para outro pedido", mesmo que o e-mail seja igual, e não recebe o resultado. O gate de administrador continua antes. Recibos antigos, sem `titular_id`, são conferidos pelo `usuario` gravado.

## 10. Unidades graváveis na leitura do valor (DSHOW-079 P2)

Em `GET ficha_produto`, cada item numérico tem `unidades[]`, e cada unidade agora traz:
```json
{"id": 3, "simbolo": "mm", "nome": "milímetro", "padrao": false, "fator_base": "0.001", "gravavel": true, "motivo_nao_gravavel": null}
```
- `gravavel` segue a MESMA regra que dá 422 na gravação: `AtributosService::unidadeNaoGravavel`, usada também por `validarUnidade`. A regra não está duplicada.
- `motivo_nao_gravavel` assume um destes valores: `desativada`, `nao_permitida` ou `outra_grandeza`.
- A unidade do VALOR salvo que saiu da lista, porque foi desativada ou por outro motivo, continua listada só para leitura, com `historica: true` e `gravavel: false`.
- O servidor continua sendo a autoridade final: a gravação confere de novo, sob trava. Uma unidade marcada `gravavel: true` ainda pode receber 422 se mudar entre a leitura e a gravação.

## 10-A. Aceitar sugestões em lote: só as decisões efetivadas (DSHOW-087)

`POST sugestoes_lote` com `{ids: [...], confirmar: true}` (de 1 a 200 ids). Cada item é decidido isolado, e um erro não desfaz os outros. A resposta conta **só as decisões efetivadas nesta execução**:
```json
{
  "aceitas": 1,
  "aceitas_ids": [11],
  "aceitas_detalhe": [{"id": 11, "valor": {"product_id": 105, "atributo_id": 3, "valor_num": 4, "versao": 1}}],
  "ignoradas": [{"id": 12, "motivo": "ja_decidida", "estado": "recusada"}, {"id": 999, "motivo": "nao_encontrada"}],
  "falhas": [{"id": 13, "codigo": "VALUE_EXISTS", "erro": "Este campo já tem valor neste produto…", "campos": ["atributo_id"]}],
  "pedidas": 4,
  "desfecho": "aplicada",
  "recibo": {"operacao": "sugestoes_lote", "chave": "…", "desfecho": "aplicada", "campos_gravados": ["ids"]}
}
```
- `aceitas` continua sendo um **número** (compatível com quem já lia o campo) e é igual a `aceitas_ids.length`.
- `ignoradas[].motivo` vale `nao_encontrada` ou `ja_decidida`. `ja_decidida` traz o `estado` atual da sugestão. Também cai aqui a sugestão que outra pessoa decidiu **entre a leitura do lote e a decisão**: o `decidir` devolve `sem_mudanca`, e o item **não** conta como aceito.
- `falhas[]` traz `codigo` estável (`VALUE_EXISTS`, `CONFLICT`, `VALIDATION_ERROR`, `NOT_CATALOG_ADMIN`…), `erro` (mensagem legível) e `campos`. A sugestão continua pendente.
- `pedidas` é o número de ids distintos recebidos.
- Desfecho da camada (seção 2): `aceitas = 0` → **`sem_mudanca`**, porque nada foi gravado, mesmo que haja ignoradas ou falhas. Com `aceitas ≥ 1` → `aplicada`. A tela só mostra "N aceitas" pelo número devolvido, nunca pelo número pedido, e lista as ignoradas e as falhas com o motivo.
- Prova em banco real: `scripts/atributos/testes/foi-salvo-mysql.php`, bloco 087 (payload, estado das sugestões, `eq_valor`, `eq_auditoria`, corrida simulada por gancho no PDO, recibo da rota).

## 11. Migração 011 — PORTÃO

`db/equipamentos/migrations/011_operacao.sql` (+ `.revert.sql`) é ADITIVA:
- cria a tabela `eq_operacao`;
- acrescenta a coluna `eq_pedido_massa.titular_id`, que aceita NULL.

Até agora foi aplicada só nas bases de validação ATRWEB_VAL_T_*. **Em produção, só pelo executor `tools/db/equipamentos-migrar.php`, com o APLICAR do Jhony** (sessão de atributos/Dash). O código funciona sem ela, conforme a seção 4.
