# PORTÃO — migração 011_operacao ("FOI SALVO OU NÃO")

Situação em 18/11/2026: **NÃO aplicada em produção** (segurada). Aplicada e testada só em `ATRWEB_VAL_T_7`. Em produção, só pelo executor
`tools/db/equipamentos-migrar.php --modo-producao` com `ATR_MIGRAR_PRODUCAO=APLICAR-NO-PORTAO` e o APLICAR do Jhony. Contrato: `CONTRATO-FOI-SALVO.md`.

## 1. O que a 011 cria (tudo ADITIVO; nada existente é renomeado ou removido)

| Objeto | Para quê |
|---|---|
| tabela `eq_operacao` (chave única, titular_id, rota, assinatura, estado, recibo JSON, erro, tentativas, datas) | recibo por chave de operação |
| coluna `eq_operacao.tentativa` CHAR(32) NULL | token da tentativa dona da chave (fencing, P1-2 b / DSHOW-095) |
| coluna `eq_operacao.recibo_texto` MEDIUMTEXT NULL | recibo exato em texto: resposta = reenvio = conferir, byte a byte (DSHOW-093 A) |
| tabela `eq_operacao_item` (chave+item únicos, posição, desfecho, detalhe) | desfecho por item do `sugestoes_lote` (P1-1) |
| coluna `eq_pedido_massa.titular_id` BIGINT NULL | titular estável do recibo da massa (DSHOW-086) |
| linha `011_operacao` em `eq_schema_migrations` | ledger (o executor preenche o sha256) |

sha256 do arquivo neste ramo: conferir com `sha256sum db/equipamentos/migrations/011_operacao.sql` (o executor recusa se o ledger tiver outro).

## 2. Preflight (antes de aplicar) — só leitura, sem root

```
php tools/db/equipamentos-migrar.php --schema DSHOW_EQUIPAMENTOS --credenciais <ini da conexão do Dash> --modo-producao --verificar
```
Esperado: 001–010 `ledger=sim estado=ok`; `011_operacao` pendente "limpa" (nenhum dos objetos acima existe). Qualquer outro estado
(parcial, completa sem ledger, ledger sem objeto) = PARE; o executor lista por comando o que existe e o que falta.
Conferência manual equivalente (SELECT no information_schema, sem root):
```sql
SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = 'DSHOW_EQUIPAMENTOS' AND (TABLE_NAME IN ('eq_operacao', 'eq_operacao_item') OR (TABLE_NAME = 'eq_pedido_massa' AND COLUMN_NAME = 'titular_id'));
SELECT version, checksum FROM DSHOW_EQUIPAMENTOS.eq_schema_migrations ORDER BY version;
```

## 3. Permissões EFETIVAS que a conexão do Dash precisa (depois da 011)

| Tabela | Privilégios | Por quê |
|---|---|---|
| `eq_operacao` | SELECT, INSERT, UPDATE | ler/reservar/marcar; `SELECT … FOR UPDATE [NOWAIT]` exige SELECT **e** UPDATE (MySQL 8.0) |
| `eq_operacao_item` | SELECT, INSERT, UPDATE | `INSERT IGNORE` dos pendentes e `UPDATE` do desfecho |
| `eq_pedido_massa` | (já tinha) SELECT, INSERT, UPDATE | coluna nova `titular_id` |

Sem DELETE (nada é apagado). Se o grant atual é por schema (`DSHOW_EQUIPAMENTOS`.*), as tabelas novas já ficam cobertas; se for por tabela,
o portão inclui o GRANT das duas tabelas. Conferir SEM root, pela própria conexão: `SHOW GRANTS FOR CURRENT_USER();`.
Sem essas permissões, quem manda chave recebe 503 `OPERATION_LEDGER_UNAVAILABLE` ANTES de qualquer escrita (contrato §4-A); quem não manda chave segue normal.

## 4. Execução repetida é idempotente (testado 2× no T_7, 18/11 21:55)

`php tools/db/equipamentos-migrar.php --schema ATRWEB_VAL_T_7 --credenciais <ini>`:
- 1ª: `aplicadas=11` (001–011) · 2ª: `aplicadas=0 conferidas=11` (nenhum DDL) · `--verificar`: `011_operacao ledger=sim estado=ok objetos=29/29`;
- `--reverter 011_operacao` (só validação) → reaplicar: `aplicadas=1` → 3ª: `aplicadas=0 conferidas=11`.
Interrupção no meio (ex.: depois do 1º ALTER) → o executor RECUSA a retomada às cegas e lista o que falta (preflight por objeto, DSHOW-036).

## 5. Rollback de CÓDIGO sem reverter a tabela de recibos

O código anterior convive com a 011: não lê nem escreve `eq_operacao`/`eq_operacao_item`; `eq_pedido_massa.titular_id` aceita NULL.
Testado 18/11: código de `6738adb3` (antes do "foi salvo") com a 011 deste ramo aplicada no T_7 — `modulo-mysql` 188/0,
`hotfix-integridade-mysql` 45/0, `hotfix2-mysql` 33/0, `hotfix3-mysql` 45/0, `repo-mysql` 25/0.
Portanto: voltar o código = só voltar os arquivos; a tabela fica (e os recibos ficam para auditoria). Reverter a 011 em produção NÃO faz parte
do rollback (o `.revert.sql` é só para validação).

## 6. Retenção (política escrita; limpeza automática PENDENTE)

- Garantia de contrato: recibos e desfechos por item valem por **30 dias** (reenvio e conferência). Depois disso o cliente não deve depender deles.
- Nada é apagado pela aplicação (sem DELETE). Limpeza futura, se houver, só com portão e cópia antes. Proposta (não automatizada):
  1. exportar (só SELECT, conexão do Dash):
     ```sql
     SELECT * FROM DSHOW_EQUIPAMENTOS.eq_operacao WHERE criado_em < NOW(3) - INTERVAL 30 DAY AND estado <> 'em_andamento';
     SELECT i.* FROM DSHOW_EQUIPAMENTOS.eq_operacao_item i JOIN DSHOW_EQUIPAMENTOS.eq_operacao o ON o.chave = i.chave
      WHERE o.criado_em < NOW(3) - INTERVAL 30 DAY AND o.estado <> 'em_andamento';
     ```
     para `/backup/<carimbo>-eq-operacao-retencao/` (arquivo + sha256);
  2. só então, por quem tem DELETE (Jhony, root), remover as mesmas linhas pelo mesmo critério (itens antes da operação), com contagem igual à exportada.
- `eq_pedido_massa` segue a mesma regra.
