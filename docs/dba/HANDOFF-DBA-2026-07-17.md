# Handoff para o DBA — DShowDash (2026-07-17)

Dois itens de banco no ERP remoto (`displaysolutions.com.br:3306`). Ambos são no **servidor do
ERP**, não no servidor da aplicação (DShowDash / srv920234). Contato técnico da app: Jhony.

---

> ⚠️ ATUALIZAÇÃO 2026-07-17: o **#5 já foi RESOLVIDO internamente** (usuário `dshow_ro` criado e a
> app já cortada para ele — ver abaixo). **Só o #6 precisa de você.** Mantido o #5 aqui só como registro.

## #5 — Criar usuário READ-ONLY para a aplicação ler o ERP  ✅ FEITO (não precisa de ação)

### Problema
Hoje a aplicação DShowDash conecta no ERP com o usuário **privilegiado `Jhony`** para LER dados
(bancos `DSHOW_PROD` e `INTEGRACAO`). Auditoria interna apontou isso como risco (credencial de
escrita usada só para leitura). Queremos um usuário **somente-SELECT**.

### Ação (rodar no MySQL do ERP como admin/root)
Script pronto: **`docs/dba/create-readonly-dshow-prod.sql`**. Resumo:

```sql
CREATE USER IF NOT EXISTS 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH'
  IDENTIFIED BY 'TROCAR_POR_SENHA_FORTE';
GRANT SELECT ON `DSHOW_PROD`.*  TO 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH';
GRANT SELECT ON `INTEGRACAO`.*  TO 'dshow_ro'@'IP_DO_SERVIDOR_DSHOWDASH';
FLUSH PRIVILEGES;
```

Antes de rodar, definir:
- **`TROCAR_POR_SENHA_FORTE`** → senha aleatória forte (≥ 20 chars).
- **`IP_DO_SERVIDOR_DSHOWDASH`** → IP público de saída do servidor da app (restringir o host é mais
  seguro que `'@%'`). Se o IP for dinâmico, usar `'%'` temporariamente e restringir depois.
- Se a app também **executa** procedures no INTEGRACAO (ver #6), adicionar
  `GRANT EXECUTE ON \`INTEGRACAO\`.* TO 'dshow_ro'@'...';`.

### Depois de criar (feito por nós, no servidor da app)
Atualizar `/var/www/dshowdash/.env` (`DB_DSHOW_PROD_USER/PASS` e `DB_INTEGRACAO_USER/PASS` →
`dshow_ro` + senha) e `sudo systemctl reload php8.3-fpm`. Validar abrindo Compras > Requisições.
**Só precisamos que você nos passe usuário + senha criados** (ou confirme e nos mande a senha por canal seguro).

---

## #6 — Restaurar as procedures faltantes no `INTEGRACAO`

### Problema
O schema **`INTEGRACAO`** deveria conter a camada de procedures de integração `sp_aut_*` (uma por
entidade do ERP: contas a pagar/receber, orçamentos, pessoas, produtos, requisições, vendas, etc.).
Hoje elas **NÃO existem** no `INTEGRACAO`. Conferido em 2026-07-17 via
`information_schema.ROUTINES` — o schema só tem:

```
FUNCTIONS : INITCAP, TitleCase
PROCEDURES: check_job_alerts, sp_migrar_qsa_incremental, sp_migrar_qsa_manual, sp_upsert_custom_field
```

Ou seja, **as 44 `sp_aut_*` + 5 procedures pesadas (49 no total)** estão faltando. Causa provável:
os dumps locais foram feitos **sem `--routines`**, então nunca capturaram as stored procedures — elas
existem na **base de ORIGEM do ERP**, mas não foram migradas para o `INTEGRACAO`. Isso vinha gerando
um grande volume de erros (auditoria registrou ~68.004) quando algo tentava chamá-las.

### Lista das 44 `sp_aut_*` faltantes (referenciadas no histórico da app)
```
sp_aut_acrescimo               sp_aut_frete                    sp_aut_pessoas
sp_aut_atendimento_suporte     sp_aut_info_vendedores          sp_aut_produtos
sp_aut_bv                      sp_aut_nossas_contas            sp_aut_recebimentos
sp_aut_centro_custos           sp_aut_notificacao              sp_aut_requisicoes
sp_aut_colaboradores           sp_aut_oportunidades_insta      sp_aut_reserva_tecnica
sp_aut_comissao                sp_aut_orc_detalhes             sp_aut_resumo_clientes
sp_aut_conciliacao_financeira  sp_aut_orc_itens                sp_aut_resumo_usuarios
sp_aut_conta_extrato           sp_aut_orcamento_serv_manutencao sp_aut_servico_manutencao
sp_aut_contas_pagar            sp_aut_orcamentos               sp_aut_sessao_ativa
sp_aut_contas_receber          sp_aut_organizacao              sp_aut_subs_contas_a_pagar
sp_aut_contas_saldo            sp_aut_perda                    sp_aut_subs_requisicoes
sp_aut_contato_email           sp_aut_pessoa_organizacao       sp_aut_usuarios
sp_aut_contato_telefone        sp_aut_descontos                sp_aut_vendas_gerais
sp_aut_diversas                sp_aut_endereco_instalacao      sp_aut_eventos
sp_aut_extrato_bancario        sp_aut_fornecedores
```
(+ as 5 procedures "pesadas" que a auditoria contou à parte — favor confirmar quais são na origem.)

### Ação recomendada (no servidor de ORIGEM do ERP)
1. Extrair **apenas as rotinas** da base de origem (a que tem as `sp_aut_*` vivas):
   ```bash
   mysqldump -h <HOST_ORIGEM> -u <ADMIN> -p \
     --routines --no-create-info --no-data --skip-triggers \
     <BASE_ORIGEM> > integracao_routines_2026-07-17.sql
   ```
   (Se as procedures estão na própria base que alimenta o INTEGRACAO, dumpe as rotinas dela.)
2. Revisar `DEFINER=` no dump (trocar por um usuário que exista no destino, ou usar
   `--set-gtid-purged=OFF` e editar os `DEFINER` para evitar erro de definer inexistente).
3. Carregar no destino:
   ```bash
   mysql -h displaysolutions.com.br -u <ADMIN> -p INTEGRACAO < integracao_routines_2026-07-17.sql
   ```
4. Conferir a contagem final:
   ```sql
   SELECT ROUTINE_TYPE, COUNT(*) FROM information_schema.ROUTINES
   WHERE ROUTINE_SCHEMA='INTEGRACAO' GROUP BY ROUTINE_TYPE;
   -- e checar cada nome da lista acima com:
   SELECT ROUTINE_NAME FROM information_schema.ROUTINES
   WHERE ROUTINE_SCHEMA='INTEGRACAO' AND ROUTINE_NAME LIKE 'sp_aut/_%' ESCAPE '/';
   ```
5. Se não houver base de origem acessível com as rotinas: elas terão de ser **reescritas** a partir
   da especificação de cada integração (last resort).

### O que precisamos de você
- Confirmar **onde estão as `sp_aut_*` vivas** (qual host/base de origem) e rodar o dump `--routines`
  de lá para o `INTEGRACAO`; ou avisar se será necessária reescrita.
- Quais são as **5 procedures "pesadas"** contadas à parte (nomes), para fecharmos as 49.

---

### Resumo de 1 linha
**#5:** criar `dshow_ro` (SELECT em DSHOW_PROD+INTEGRACAO) — script pronto. **#6:** carregar no
`INTEGRACAO` as 44 `sp_aut_*` (+5 pesadas) via `mysqldump --routines` da base de origem — hoje o
schema não tem nenhuma delas.
