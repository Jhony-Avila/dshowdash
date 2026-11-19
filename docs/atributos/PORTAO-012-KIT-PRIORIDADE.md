# PORTÃO: migração 012_kit_prioridade (P1, precedência de kit independente do nome)

Situação em 18/11/2026: **NÃO aplicada em produção.** Só foi aplicada e testada em `ATRWEB_VAL_T_7` (e `_T_8` para a contraprova). Em produção, só pelo executor
`tools/db/equipamentos-migrar.php --modo-producao` com `ATR_MIGRAR_PRODUCAO=APLICAR-NO-PORTAO` e o **APLICAR do Jhony**. Ramo: `feat/kit-prioridade-esq` (partiu da servida `6738adb3`).

## 0. O problema e a regra nova

Hoje (`Aplicabilidade::kits`, DSHOW-035 #1) o kit que vence quando um atributo aparece em vários kits é escolhido pela posição de **(nome, id)** no
`ORDER BY` do MySQL (colação `utf8mb4_0900_ai_ci` de `eq_grupo.nome`). Esse kit define o grupo, a posição, a importância e a **unidade do item de kit**
na cascata D3 (unidade do valor → ajuste do produto → item do kit → padrão do atributo). Por isso, renomear um kit podia mudar a ficha de produtos.

Regra nova (`Aplicabilidade::compararKits`):
1. quando os dois kits têm `prioridade`, vale `prioridade` crescente (menor vence) e o desempate é o `id`;
2. quando só um tem `prioridade`, ele vem antes. O kit sem prioridade foi inserido pelo código anterior depois da 012 e vai para o **fim da fila**;
3. quando nenhum dos dois tem (coluna ausente, ou seja, 012 não aplicada, ou valor NULL), vale a **regra antiga** sem erro: `ordem_nome` do MySQL, ou `(nome, id)` no repositório em memória.

- **Kit novo** (`AtributosRepoPdo::criarGrupo`, usado por `kit`, `kit_duplicar` e pelo legado `grupo`) entra com `MAX(prioridade) + 1`, ou seja, no fim da fila.
  Ele nunca muda a ficha de produtos que já tinham kits. Se duas criações acontecerem ao mesmo tempo e empatarem, o desempate é o `id` (o mais novo perde).
- **Renomear** um kit não muda mais nada.
- A coluna `ordem` (005) **não** foi reaproveitada. Ela já é editável pela tela e nunca participou da precedência.
- A leitura é **aditiva**: `GET kits` e os kits do repositório passam a trazer `prioridade` (um número, ou `null` sem a 012).

## 1. O que a 012 cria (tudo ADITIVO; nada é renomeado ou removido)

| Objeto | Para quê |
|---|---|
| coluna `eq_grupo.prioridade INT UNSIGNED NULL` (depois de `ordem`) | precedência explícita do kit |
| `UPDATE` que preenche os NULL com `ROW_NUMBER() OVER (ORDER BY nome, id)` (de 1 a N, incluindo inativos) | reproduz exatamente a posição antiga, com a mesma colação e o mesmo `ORDER BY` de `retratoModelo` |
| linha `012_kit_prioridade` em `eq_schema_migrations` | ledger (o executor preenche o sha256) |

- **NULL de propósito** (e não `NOT NULL`): o código anterior insere kit sem a coluna. Com `NOT NULL` sem default, isso quebraria o rollback de código em modo estrito;
  com `NOT NULL DEFAULT 0`, o kit novo passaria a vencer todos os outros.
- O `UPDATE` só toca linhas NULL, então é repetível. Ele não altera `versao` nem `atualizado_em`, para que nenhuma tela aberta receba 409 por causa da migração.
- Não tem índice: `eq_grupo` tem dezenas de linhas (95 no `ATRWEB_VAL_EQ`) e é lida inteira.
- sha256 neste ramo: `012_kit_prioridade.sql` = `39acc0aa9267ffb5b0800f5b0044bd27667be12e0cfa762709f1dbbaa4c9d2e9`,
  `012_kit_prioridade.revert.sql` = `ec8ad581ddee4af8efe77fd203bb92cb5f1bb8302fea105f12da91168936ddf6`. Confira com `sha256sum`, porque o executor recusa se o ledger tiver outro valor.

## 2. Ordem 011 → 012 (dependência só de ORDEM)

A `011_operacao` ("foi salvo", ramo `feat/foi-salvo-esq`) vem antes pela numeração. **A 012 não usa nada da 011.** Neste ramo, sem a 011, o executor aplica a 012 logo
depois da 010, e os testes rodaram assim. Na integração, os dois arquivos convivem e o executor aplica 011 e depois 012 na mesma execução, ou só a 012 se a 011 já
estiver no ledger.
Os testes do executor (`executor.php`, `executor-preflight.php`) deixaram de contar "10" fixo e passaram a contar os arquivos da pasta. As migrações "futuras"
de teste foram renomeadas para `901_*`/`902_*`. Com isso, a 011 também passa sem novo ajuste.

## 3. Preflight (antes de aplicar). Só leitura, sem root

```
php tools/db/equipamentos-migrar.php --schema DSHOW_EQUIPAMENTOS --credenciais <ini da conexão do Dash> --modo-producao --verificar
```
Esperado: 001–010 (e 011, se já aplicada) com `ledger=sim estado=ok`, e `012_kit_prioridade` pendente "limpa" (coluna `eq_grupo.prioridade` inexistente).
Qualquer outro estado = PARE. Conferência manual equivalente:
```sql
SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'DSHOW_EQUIPAMENTOS' AND TABLE_NAME = 'eq_grupo' AND COLUMN_NAME = 'prioridade';
SELECT version, checksum FROM DSHOW_EQUIPAMENTOS.eq_schema_migrations ORDER BY version;
```

## 4. Permissões

- **Para aplicar** (executor): `ALTER` e `UPDATE` em `DSHOW_EQUIPAMENTOS.eq_grupo`, e `INSERT`/`UPDATE` em `eq_schema_migrations`, os mesmos privilégios das migrações anteriores.
- **Para a aplicação depois da 012**: nada de novo. `SELECT`, `INSERT` e `UPDATE` em `eq_grupo` já existem, e `SHOW COLUMNS` só exige `SELECT`. Sem DELETE.
- **Para a prova**: só `SELECT` (em `DSHOW_EQUIPAMENTOS` e em `APP_DSHOW.product_catalog`), numa sessão `READ ONLY`.

## 5. Prova antes/depois: ficha efetiva idêntica

Ferramenta só de leitura: `scripts/atributos/kit-prioridade-prova.php`. Ela usa a mesma função da ficha, `Aplicabilidade::ficha` sobre `AtributosRepoPdo::retratoModelo`,
igual a `ProdutosLeitura::fichaProduto`, e roda numa sessão `READ ONLY` com snapshot consistente.
Em cada produto não excluído, compara:
- a ordem dos kits;
- em cada atributo: a ordem na ficha, o kit dono, a posição, obrigatório, visível, destaque, importância, a unidade do kit, a unidade do produto e a unidade efetiva (sem valor e com a unidade do valor vivo) e as origens;
- as exclusões.

A comparação é entre a regra antiga e a nova, com a prioridade da coluna (se a 012 estiver aplicada) ou com a simulação feita pelo **mesmo SELECT do UPDATE da 012**.
Saída: `0` = tudo idêntico; `1` = há diferenças, que são listadas; `2` = a prova não foi executada.

**Antes** do APLICAR (simulada) e **logo depois** dele (coluna real):
```
php scripts/atributos/kit-prioridade-prova.php --schema DSHOW_EQUIPAMENTOS --catalogo APP_DSHOW --credenciais <ini da conexão do Dash>
```
Esperado em produção: `ativos=347 idênticos=347 · diferentes=0` e `[OK]`. Rode logo após o APLICAR: depois que alguém renomear um kit, a regra antiga daria
outra ficha e a prova acusaria diferença. Nesse caso a diferença é exatamente o problema resolvido, e o teste prova que a ferramenta detecta isso.

Resultado em 18/11/2026 no `ATRWEB_VAL_EQ` (cópia de validação, só leitura, simulada):
`kits=95 · produtos (não excluídos)=622 idênticos=622 · ativos=347 idênticos=347 · diferentes=0 · [OK]`.

## 6. Execução repetida é idempotente (testado no T_7)

Fonte: `scripts/atributos/testes/kit-prioridade-mysql.php`, 42 casos sem falha.
- 1ª execução: `aplicadas=[012_kit_prioridade]`. 2ª: `aplicadas=0`, com 012 conferida. `--verificar`: `012 ledger=sim estado=ok`. O ledger fica com o sha256 do arquivo.
- Preenchimento = posição antiga (nome, id) do MySQL, de 1 a N sem buraco, igual a `ordem_nome + 1`, inclusive com acento e caixa (`álamo < Alfa < beta < Ébano < Zeta`).
  `versao` e `atualizado_em` não mudam.
- **Interrupção entre o ALTER e o UPDATE** (coluna presente e toda NULL): o código aplica a regra antiga, então a ficha não muda. O executor recusa ("completa sem ledger") e
  **recusa também `--registrar-se-completo`** porque a 012 tem comando de dados. **Recuperação**: rodar o 1º comando do `.revert.sql`
  (`ALTER TABLE eq_grupo DROP COLUMN prioridade`) e o executor de novo, que reaplica a 012 inteira. Esse caminho foi testado.

## 7. Rollback de CÓDIGO sem reverter a coluna

O código anterior (`6738adb3`) convive com a 012: não lê a coluna e insere kit com `prioridade` NULL, o que é permitido.
Testado em 18/11 com o código de `6738adb3` e a 012 aplicada no T_8:
- `modulo-mysql` 188 casos, 0 falhas;
- `hotfix-integridade-mysql` 45/0, `hotfix2-mysql` 33/0, `hotfix3-mysql` 45/0;
- `repo-mysql` 25/0 (só o filtro do carregador ganhou `UPDATE`).

Portanto, para voltar o código basta voltar os arquivos. A coluna fica.
Se o código novo voltar depois, um kit criado nesse intervalo (NULL) vai para o fim da fila, sem mudar a ficha dos demais. Para ele entrar na fila explicitamente, rode o mesmo
`UPDATE` da 012, que só preenche NULL. Esse `UPDATE`, porém, numera pela ordem de nome: rode-o antes de qualquer renome, ou dê ao kit, pela ação de prioridade
(pedido em aberto, §9), o valor `MAX + 1`.
**Reverter a 012 em produção NÃO faz parte do rollback.** O `.revert.sql` é só para validação. Ao revertê-la, a regra antiga volta sem erro (testado).

## 8. Fora do Dash: o app (Node) precisa acompanhar

`app-dshow backend/api/src/modules/products/attributes.ts` reproduz a ficha com `ORDER BY g.nome, g.id`, e a massa dourada `golden-ficha` garante PHP = Node.
Com a 012 aplicada, as duas regras dão o mesmo resultado **até o primeiro renome ou kit novo**. A partir daí, o app mostraria outra ficha.
**Pedido ao dono do backend do app**: ordenar por `g.prioridade IS NULL, g.prioridade, g.id` quando a coluna existir, com fallback `g.nome, g.id`,
e estender a `golden-ficha` com um caso de kit renomeado. Antes disso, **não renomear kits nem criar kit que dispute atributo com outro**.
Também é preciso o grant `SELECT` na coluna nova, se o grant do app for por coluna.

## 9. Ação de reordenar (`POST kit_prioridade`) e pedido de tela

Ramo `feat/kit-prioridade-acao-esq`: servidor do foi-salvo (`246d01b0`) + este ramo (`e66ff036`) + a ação. Implementada em
`KitsService::reordenarPrioridade`, no molde de `opcao_reordenar`, pela camada `OperacoesGravacao` (recibo, chave de operação, `conferir_gravacao`).

### 9.1 Contrato

`POST ?r=kit_prioridade` · corpo `{ordem: [ids], ordem_antes: [ids], motivo?: texto}` · cabeçalho opcional `X-Chave-Operacao`.

- **Forma escolhida: a lista completa.** `ordem` traz TODOS os kits ATIVOS, cada um uma vez, na nova precedência (o primeiro vence).
  Descartei "mover o kit X para a posição N" porque o resultado dele depende da posição atual, e um reenvio sem chave moveria de novo.
  A lista completa diz o resultado inteiro, a tela confere o que vai gravar e repetir o pedido nunca "empurra" duas vezes.
- `ordem_antes` (obrigatória) é a ordem dos ativos que a tela viu, e a ordem importa. `GET kits` passa a trazer `ordem_prioridade` (aditivo),
  que é exatamente esse valor: os ativos na precedência efetiva (`Aplicabilidade::compararKits`). Inclui os kits com prioridade NULL.
- **Porta:** administrar o catálogo (`ROTAS_ADMIN`). Nível < 80 → 403 `INSUFFICIENT_LEVEL`; sem administrar → 403 `NOT_CATALOG_ADMIN`. Essa conferência vem antes do reenvio de recibo.
- **422 `VALIDATION_ERROR`, sempre antes de mutar:** `ordem` ou `ordem_antes` malformada, vazia ou com mais de 1000 ids (campo `ordem`/`ordem_antes`); kit repetido;
  `ordem` com conjunto diferente de `ordem_antes` (lista incompleta ou com kit a mais); kit que não existe em `eq_grupo`.
- **409 `CONFLICT`, só em conflito real**, com `meta.atual = {ordem: [ativos atuais], kits: [{id, nome, ativo, prioridade}]}` e `meta.desfecho = conflito`. Acontece quando
  `ordem_antes` difere da ordem atual dos ativos. Exemplos: outra pessoa reordenou, um kit foi ativado ou desativado, ou a tela mandou um kit inativo.
  Também dá 409 (sem `meta.atual`) quando a espera pela trava se esgota, porque outra gravação está segurando linhas de `eq_grupo`.
- **`sem_mudanca`:** quando `ordem` é igual à ordem atual, nada é gravado nem auditado (`recibo.campos_gravados: []`).
- **Gravação:** tudo sob `SELECT … FOR UPDATE` de TODAS as linhas de `eq_grupo`. Essa trava também segura uma criação de kit simultânea (`MAX(prioridade)`).
  A fila inteira é reescrita de 1 a N. Os ativos ocupam, na nova ordem, as vagas que os ativos já ocupavam. Os inativos ficam onde estavam e não entram na ficha.
  Prioridade NULL é normalizada. Só a coluna `prioridade` muda: `versao` e `atualizado_em` do kit ficam iguais, então nenhuma tela de kit recebe 409 por causa disso.
  A auditoria `reordenar_kits` (entidade `kit_prioridade`, id `fila`, com `{ordem, prioridade}` antes e depois, e o motivo) é gravada na mesma transação.
  Ela pode ser lida por `GET auditoria&entidade=kit_prioridade&id=fila`.
- **Resposta** (lida DENTRO da transação que gravou): `{ordem, kits: [{id, nome, ativo, prioridade}] na precedência, versao_prioridade, desfecho, recibo}`.
  O recibo traz `operacao: kit_prioridade`, `versao_nova = versao_prioridade` (sha256 curto da fila), `campos_gravados: ["prioridade"]` e `ordem`.
  Com chave, o recibo fica guardado byte a byte e é igual no reenvio e no `conferir_gravacao`.
- **Sem a 012** (coluna ausente): 503 `KIT_PRIORITY_UNAVAILABLE`, sem mutar.
- **Efeito:** nenhum VALOR muda. A ficha efetiva muda só onde kits disputam o mesmo atributo, porque a precedência decide o dono do item, a posição, a importância e a unidade do kit (D3).
  O teste prova isso: a ficha depois de reordenar é igual a `Aplicabilidade::ficha` calculada sobre o retrato com as prioridades novas.

### 9.2 Pedido de tela aos donos (DIREITA, `Kits.tsx`): não feito por mim

- **Mostrar:** coluna "Precedência", com a lista dos ativos na ordem de `ordem_prioridade` e os inativos à parte.
- **Editar:** modo "Ordenar precedência" (arrastar, ou botões subir/descer com teclado) sobre os ATIVOS. Ao salvar, enviar
  `{ordem: <nova>, ordem_antes: <ordem_prioridade lida>}` com UMA chave de operação por intenção (reaproveitar a chave quando o resultado for incerto).
- **Aviso antes de salvar:** "Reordenar muda a ficha dos produtos em que estes kits têm o mesmo atributo (qual kit define posição, importância e unidade). Nenhum valor é apagado."
  Uma prévia de impacto (no mesmo molde da `kit_impacto`) fica como melhoria. O servidor ainda não tem prévia para a reordenação.
- **Desfechos:** `aplicada` → "Precedência salva" e a lista vem da resposta. `sem_mudanca` → "Nada mudou". 409 com `meta.atual` → mostrar a ordem atual e oferecer "Recarregar".
  422 → mensagem junto da lista. Resposta sem recibo → "Não conseguimos confirmar se foi salvo" + `conferir_gravacao`.

## 10. Testes deste ramo

| Teste | Base | Resultado |
|---|---|---|
| `kit-prioridade-mysql.php` (novo) | T_7 | 42 casos, 0 falhas |
| contraprova: o mesmo teste no código de `6738adb3` (+ 012) | T_8 | 15 falhas e erro fatal (`compararKits` inexistente) |
| `modulo-mysql` / `hotfix-integridade-mysql` / `hotfix2-mysql` / `hotfix3-mysql` / `repo-mysql` | T_7 | 188/0 · 45/0 · 33/0 · 45/0 · 25/0 |
| `executor` / `executor-preflight` | T_9 | 13/0 · 31/0 |
| `aplicabilidade` / `golden-ficha` / `servico` / `cargas-nome` | sem banco | 24/0 · 10/0 · 81/0 · 16/0 |

### 10.1 Testes do ramo da ação (`feat/kit-prioridade-acao-esq`, base T_9, 18/11)

| Teste | Código | Resultado |
|---|---|---|
| `kit-prioridade-acao-mysql.php` (novo; 2 conexões para a concorrência) | ação | 64 casos, 0 falhas |
| contraprova: o mesmo teste no merge sem a ação (`d179df5a`) | merge | 55 de 64 falham (`reordenarPrioridade` inexistente) |
| `foi-salvo-mysql` / `kit-prioridade-mysql` logo depois do merge (`d179df5a`) | merge | 99/0 · 42/0 |
| `foi-salvo-mysql` / `kit-prioridade-mysql` / `modulo-mysql` / `hotfix-integridade-mysql` / `hotfix2-mysql` / `hotfix3-mysql` / `repo-mysql` | ação | 99/0 · 42/0 · 188/0 · 45/0 · 33/0 · 45/0 · 25/0 |
| `servico` / `aplicabilidade` / `golden-ficha` | ação (sem banco) | 81/0 · 24/0 · 10/0 |
