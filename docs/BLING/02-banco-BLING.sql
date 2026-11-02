-- ═══════════════════════════════════════════════════════════════════════════
-- BLING — schema do módulo Bling
-- @version 1.0.0  @created 2026-07-30
--
-- Idempotente e aditivo: pode rodar quantas vezes for preciso.
-- Molde: docs/GOOGLE-CALENDAR/02-banco-GCAL_DSHOW.sql e
--        docs/PIPEDRIVE/02-banco-PIPE_DSHOW.sql.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- REGRA 1 — FUSO: todo DATETIME aqui é UTC. Sem exceção.
--
-- `mysql.time_zone_name` está VAZIA neste servidor: CONVERT_TZ por NOME devolve
-- NULL, e NULL num WHERE de janela some com o registro sem erro nenhum no log.
-- A conversão para o fuso do usuário acontece em PHP ou no browser.
-- NENHUMA query deste módulo pode conter CONVERT_TZ.
--
-- Exceção proposital: colunas `*_date` (vencimento, competência, emissão) são
-- DATE. Vencimento não tem hora nem fuso — é o mesmo dia em qualquer lugar.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- REGRA 2 — FK DESDE O PRIMEIRO DIA.
--
-- No Google Calendar, a ausência de FK em `gcal_sync_state` produziu 16 linhas
-- órfãs, e a tela passou a dizer "✔ sincronizado" com ZERO contas conectadas.
-- Um verde falso é pior que um vermelho.
--
-- Aqui toda tabela de domínio referencia `bling_accounts(id)` com ON DELETE
-- CASCADE. São SEIS as exceções, todas DELIBERADAS e marcadas onde ocorrem:
--   bling_audit_logs · bling_sync_errors · bling_sync_jobs
--   bling_queue · bling_webhook_events · bling_raw_payloads
-- Precisam SOBREVIVER à remoção da conta — é justamente quando alguém vai
-- querer investigar o que aconteceu. (`bling_oauth_states` também não tem, mas
-- por outro motivo: é anti-CSRF de vida curta, anterior à existência da conta.)
--
-- CONFERIR APÓS APLICAR — a consulta abaixo deve devolver exatamente estas 8
-- (as 6 acima + bling_accounts + bling_oauth_states) e nada mais:
--   SELECT t.TABLE_NAME FROM information_schema.TABLES t
--    WHERE t.TABLE_SCHEMA='BLING' AND NOT EXISTS (
--      SELECT 1 FROM information_schema.KEY_COLUMN_USAGE k
--       WHERE k.TABLE_SCHEMA='BLING' AND k.TABLE_NAME=t.TABLE_NAME
--         AND k.REFERENCED_TABLE_NAME='bling_accounts');
--
-- ─────────────────────────────────────────────────────────────────────────────
-- REGRA 3 — IDEMPOTÊNCIA: `UNIQUE (account_id, bling_id)` em toda tabela de
-- domínio. É o que permite reprocessar um lote sem duplicar, e o que torna o
-- webhook seguro para reentrega.
--
-- REGRA 4 — `payload_hash`: quando o hash não muda, a linha não é reescrita.
-- Evita UPDATE inútil e mantém `updated_at` significando algo.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS BLING
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE BLING;

-- ══════════════════════════════════════════════════════════════════════════
-- CONTAS, CREDENCIAIS E UNIDADES
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_accounts (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome               VARCHAR(190) NOT NULL,
  cnpj               VARCHAR(20)  NULL          COMMENT 'só dígitos; exibido mascarado (LGPD §62)',
  ambiente           ENUM('producao','homologacao') NOT NULL DEFAULT 'producao',
  estado_conexao     ENUM('conectado','reauth_necessaria','revogado','erro','nao_configurado')
                     NOT NULL DEFAULT 'nao_configurado',
  is_padrao          TINYINT(1) NOT NULL DEFAULT 0,
  is_ativo           TINYINT(1) NOT NULL DEFAULT 1,
  escopos            VARCHAR(500) NULL          COMMENT 'escopos REALMENTE concedidos, não os pedidos',
  ultima_sync_em     DATETIME NULL,
  ultimo_sucesso_em  DATETIME NULL,
  ultimo_erro_codigo VARCHAR(64)  NULL,
  ultimo_erro_msg    VARCHAR(500) NULL,
  criado_em          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  desconectado_em    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conta_cnpj (cnpj),
  KEY ix_conta_ativa (is_ativo, estado_conexao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Contas Bling conectadas (§13)';

-- Tokens em tabela SEPARADA da conta.
-- Motivo: a conta é lida em toda requisição para montar o seletor do header; o
-- token só é lido na hora de falar com a API. Separar evita que o segredo
-- trafegue em consultas de tela e permite GRANT distinto no futuro.
CREATE TABLE IF NOT EXISTS bling_oauth_tokens (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id         BIGINT UNSIGNED NOT NULL,
  access_token_enc   VARBINARY(2048) NOT NULL   COMMENT 'AES-256-GCM (BlingCrypto). NUNCA em texto puro',
  refresh_token_enc  VARBINARY(2048) NULL       COMMENT 'idem. NULL enquanto o Bling não devolver um novo',
  token_type         VARCHAR(32)  NOT NULL DEFAULT 'Bearer',
  expira_em          DATETIME NOT NULL          COMMENT 'UTC — quando o access_token morre',
  renovado_em        DATETIME NULL,
  falhas_renovacao   INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token_conta (account_id),
  CONSTRAINT fk_token_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tokens OAuth 2.0 cifrados em repouso (§4)';

-- Estado do fluxo OAuth: protege contra CSRF no callback.
-- Linha de vida curta; o serviço apaga as expiradas.
CREATE TABLE IF NOT EXISTS bling_oauth_states (
  state       CHAR(64) NOT NULL              COMMENT 'aleatório; volta no callback',
  user_id     BIGINT UNSIGNED NOT NULL       COMMENT 'quem iniciou a conexão',
  redirect_to VARCHAR(300) NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em   DATETIME NOT NULL,
  PRIMARY KEY (state),
  KEY ix_state_expira (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Anti-CSRF do fluxo de autorização';

CREATE TABLE IF NOT EXISTS bling_business_units (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  bling_id      VARCHAR(64) NULL,
  nome          VARCHAR(190) NOT NULL,
  uf            CHAR(2) NULL,
  is_matriz     TINYINT(1) NOT NULL DEFAULT 0,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_unidade (account_id, bling_id),
  CONSTRAINT fk_unidade_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Unidades de negócio (§13) — o modelo não assume unidade única';

CREATE TABLE IF NOT EXISTS bling_sales_channels (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  bling_id      VARCHAR(64) NULL,
  nome          VARCHAR(190) NOT NULL,
  tipo          VARCHAR(40) NULL   COMMENT 'marketplace | loja | interno',
  integrado     TINYINT(1) NOT NULL DEFAULT 0,
  -- ⚠️ TODA tabela alvo de sincronização precisa DAS DUAS.
  -- O upsert genérico grava `sincronizado_em` e `payload_hash` em qualquer
  -- tabela. Esta era a única sem elas, e o resultado foi que NENHUM canal de
  -- venda era gravado — 6 erros por item, que não derrubam o recurso e por isso
  -- ficavam invisíveis. A homologação passou a verificar isso em todas.
  sincronizado_em DATETIME NULL COMMENT 'ultima vez que veio da API',
  payload_hash  CHAR(32) NULL      COMMENT 'hash do payload cru; igual = nao reescreve',
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canal (account_id, bling_id),
  CONSTRAINT fk_canal_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Canais de venda (§38)';

-- ══════════════════════════════════════════════════════════════════════════
-- CADASTROS
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_categories (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  bling_id      VARCHAR(64) NOT NULL,
  nome          VARCHAR(190) NOT NULL,
  parent_bling_id VARCHAR(64) NULL,
  payload_hash  CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categoria (account_id, bling_id),
  CONSTRAINT fk_categoria_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bling_suppliers (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  nome           VARCHAR(190) NOT NULL,
  documento      VARCHAR(20) NULL   COMMENT 'só dígitos; exibido mascarado',
  uf             CHAR(2) NULL,
  prazo_entrega_dias INT UNSIGNED NULL,
  cadastro_completo TINYINT(1) NOT NULL DEFAULT 0,
  is_ativo       TINYINT(1) NOT NULL DEFAULT 1,
  payload_hash   CHAR(32) NULL,
  criado_externo_em    DATETIME NULL,
  atualizado_externo_em DATETIME NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL   COMMENT 'exclusão lógica: some da tela, fica para auditoria',
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fornecedor (account_id, bling_id),
  KEY ix_fornecedor_nome (account_id, nome),
  CONSTRAINT fk_fornecedor_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Fornecedores (§29)';

CREATE TABLE IF NOT EXISTS bling_contacts (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  nome           VARCHAR(190) NOT NULL,
  tipo_pessoa    ENUM('fisica','juridica') NOT NULL DEFAULT 'fisica',
  documento      VARCHAR(20) NULL   COMMENT 'LGPD: nunca exibido inteiro sem permissão (§62)',
  email          VARCHAR(190) NULL,
  telefone       VARCHAR(40) NULL,
  uf             CHAR(2) NULL,
  cidade         VARCHAR(120) NULL,
  is_cliente     TINYINT(1) NOT NULL DEFAULT 1,
  is_fornecedor  TINYINT(1) NOT NULL DEFAULT 0,
  cadastro_completo TINYINT(1) NOT NULL DEFAULT 0,
  is_ativo       TINYINT(1) NOT NULL DEFAULT 1,
  payload_hash   CHAR(32) NULL,
  criado_externo_em    DATETIME NULL,
  atualizado_externo_em DATETIME NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contato (account_id, bling_id),
  KEY ix_contato_nome (account_id, nome),
  KEY ix_contato_doc (account_id, documento),
  CONSTRAINT fk_contato_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Clientes e contatos (§37)';

CREATE TABLE IF NOT EXISTS bling_warehouses (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  bling_id      VARCHAR(64) NOT NULL,
  nome          VARCHAR(190) NOT NULL,
  business_unit_id BIGINT UNSIGNED NULL,
  is_padrao     TINYINT(1) NOT NULL DEFAULT 0,
  payload_hash  CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_deposito (account_id, bling_id),
  CONSTRAINT fk_deposito_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_deposito_unidade FOREIGN KEY (business_unit_id)
    REFERENCES bling_business_units(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Depósitos (§25)';

CREATE TABLE IF NOT EXISTS bling_products (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  sku            VARCHAR(120) NULL,
  gtin           VARCHAR(20) NULL,
  nome           VARCHAR(300) NOT NULL,
  tipo           ENUM('simples','variacao','kit','servico') NOT NULL DEFAULT 'simples',
  category_id    BIGINT UNSIGNED NULL,
  marca          VARCHAR(120) NULL,
  unidade        VARCHAR(20) NULL,
  ncm            VARCHAR(20) NULL,
  origem         VARCHAR(40) NULL,
  peso_kg        DECIMAL(12,3) NULL,
  dimensoes      VARCHAR(60) NULL,
  tem_imagem     TINYINT(1) NOT NULL DEFAULT 0,
  descricao_ok   TINYINT(1) NOT NULL DEFAULT 0,
  supplier_id    BIGINT UNSIGNED NULL,
  situacao       VARCHAR(40) NULL,
  is_ativo       TINYINT(1) NOT NULL DEFAULT 1,
  -- Score de qualidade cadastral (§23), recalculado na sincronização.
  -- Materializado porque a tela de Produtos ordena e filtra por ele: calcular
  -- 16 critérios em SQL a cada listagem inviabiliza a paginação server-side.
  qualidade_score TINYINT UNSIGNED NULL,
  payload_hash   CHAR(32) NULL,
  criado_externo_em    DATETIME NULL,
  atualizado_externo_em DATETIME NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produto (account_id, bling_id),
  KEY ix_produto_sku (account_id, sku),
  KEY ix_produto_gtin (account_id, gtin),
  KEY ix_produto_nome (account_id, nome(80)),
  KEY ix_produto_categoria (account_id, category_id),
  CONSTRAINT fk_produto_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_produto_categoria FOREIGN KEY (category_id)
    REFERENCES bling_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_produto_fornecedor FOREIGN KEY (supplier_id)
    REFERENCES bling_suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Produtos (§22)';

CREATE TABLE IF NOT EXISTS bling_product_variations (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  bling_id      VARCHAR(64) NOT NULL,
  sku           VARCHAR(120) NULL,
  atributo      VARCHAR(80) NULL,
  valor         VARCHAR(120) NULL,
  payload_hash  CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variacao (account_id, bling_id),
  KEY ix_variacao_produto (product_id),
  CONSTRAINT fk_variacao_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_variacao_produto FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bling_product_structures (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  product_id     BIGINT UNSIGNED NOT NULL   COMMENT 'o kit',
  componente_id  BIGINT UNSIGNED NOT NULL   COMMENT 'o produto que entra nele',
  quantidade     DECIMAL(14,4) NOT NULL DEFAULT 1,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_estrutura (product_id, componente_id),
  CONSTRAINT fk_estrutura_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_estrutura_kit FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_estrutura_componente FOREIGN KEY (componente_id)
    REFERENCES bling_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Composição de kits (§22)';

CREATE TABLE IF NOT EXISTS bling_prices (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  sales_channel_id BIGINT UNSIGNED NULL   COMMENT 'NULL = preço padrão',
  -- ⚠️ UNIQUE COM COLUNA NULLABLE NÃO DEDUPLICA.
  -- O MySQL considera cada NULL distinto, então UNIQUE (product_id,
  -- sales_channel_id) NÃO impede duas linhas de preço padrão: o
  -- ON DUPLICATE KEY do sync nunca casava e cada execução inseria uma linha
  -- nova — o produto passava a aparecer duplicado na tela, uma cópia por sync.
  -- canal_key espelha o canal com NULL->0 e devolve a garantia.
  -- Não pode ser coluna GERADA: o InnoDB recusa (erro 1215) gerar a partir de
  -- coluna que participa de FK. Quem mantém o valor é o BlingSyncService.
  canal_key     BIGINT UNSIGNED NOT NULL DEFAULT 0
                COMMENT 'espelha sales_channel_id com NULL->0; existe porque UNIQUE ignora NULL',
  preco         DECIMAL(14,2) NOT NULL DEFAULT 0,
  preco_promocional DECIMAL(14,2) NULL,
  custo         DECIMAL(14,2) NOT NULL DEFAULT 0,
  vigente_desde DATETIME NULL,
  sincronizado_em DATETIME NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_preco_canal (product_id, canal_key),
  CONSTRAINT fk_preco_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_preco_produto FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_preco_canal FOREIGN KEY (sales_channel_id)
    REFERENCES bling_sales_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Preço e custo VIGENTES (§26)';

-- Histórico de preço: append-only.
-- É o que faltava na Fase 3 para a tela §26.1 mostrar série real em vez do
-- valor vigente repetido. A linha só entra quando o valor MUDA.
CREATE TABLE IF NOT EXISTS bling_price_history (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  preco         DECIMAL(14,2) NULL,
  preco_promocional DECIMAL(14,2) NULL,
  custo         DECIMAL(14,2) NULL,
  origem        VARCHAR(40) NOT NULL DEFAULT 'sync'  COMMENT 'sync | webhook | manual',
  observado_em  DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY ix_preco_hist (product_id, observado_em),
  CONSTRAINT fk_preco_hist_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_preco_hist_produto FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Histórico de preço e custo (§26.1) — append-only';

-- ══════════════════════════════════════════════════════════════════════════
-- ESTOQUE
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_inventory (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  fisico        DECIMAL(14,4) NOT NULL DEFAULT 0,
  reservado     DECIMAL(14,4) NOT NULL DEFAULT 0,
  -- disponivel é COLUNA GERADA: derivar em SQL impede que fisico e reservado
  -- fiquem inconsistentes com o disponível por um UPDATE parcial.
  disponivel    DECIMAL(14,4) AS (fisico - reservado) STORED,
  minimo        DECIMAL(14,4) NULL,
  maximo        DECIMAL(14,4) NULL,
  ultima_movimentacao DATETIME NULL,
  sincronizado_em DATETIME NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_estoque (product_id, warehouse_id),
  KEY ix_estoque_conta (account_id),
  KEY ix_estoque_disponivel (account_id, disponivel),
  CONSTRAINT fk_estoque_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_estoque_produto FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_estoque_deposito FOREIGN KEY (warehouse_id)
    REFERENCES bling_warehouses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Saldo por produto e depósito (§24)';

CREATE TABLE IF NOT EXISTS bling_inventory_history (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  tipo          VARCHAR(40) NOT NULL   COMMENT 'entrada | saida | ajuste | transferencia',
  quantidade    DECIMAL(14,4) NOT NULL,
  saldo_apos    DECIMAL(14,4) NULL,
  documento     VARCHAR(120) NULL      COMMENT 'pedido/nota que originou',
  observado_em  DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY ix_estoque_hist (product_id, warehouse_id, observado_em),
  CONSTRAINT fk_estoque_hist_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Movimentações de estoque — append-only';

-- ══════════════════════════════════════════════════════════════════════════
-- VENDAS
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_sales_orders (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id      BIGINT UNSIGNED NOT NULL,
  business_unit_id BIGINT UNSIGNED NULL,
  bling_id        VARCHAR(64) NOT NULL,
  numero          VARCHAR(60) NULL,
  data_pedido     DATE NOT NULL,
  situacao        VARCHAR(60) NOT NULL   COMMENT 'vocabulário interno (BlingSituacoes)',
  situacao_bling  VARCHAR(60) NULL       COMMENT 'código cru, para rastrear tradução',
  contact_id      BIGINT UNSIGNED NULL,
  sales_channel_id BIGINT UNSIGNED NULL,
  vendedor        VARCHAR(190) NULL,
  forma_pagamento VARCHAR(120) NULL,
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  desconto        DECIMAL(14,2) NOT NULL DEFAULT 0,
  frete           DECIMAL(14,2) NOT NULL DEFAULT 0,
  total           DECIMAL(14,2) NOT NULL DEFAULT 0,
  custo_total     DECIMAL(14,2) NOT NULL DEFAULT 0,
  qtd_itens       INT UNSIGNED NOT NULL DEFAULT 0,
  payload_hash    CHAR(32) NULL,
  criado_externo_em     DATETIME NULL,
  atualizado_externo_em DATETIME NULL,
  sincronizado_em DATETIME NULL,
  deletado_em     DATETIME NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedido (account_id, bling_id),
  KEY ix_pedido_data (account_id, data_pedido),
  KEY ix_pedido_situacao (account_id, situacao, data_pedido),
  KEY ix_pedido_canal (account_id, sales_channel_id, data_pedido),
  KEY ix_pedido_contato (account_id, contact_id),
  KEY ix_pedido_numero (account_id, numero),
  CONSTRAINT fk_pedido_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_contato FOREIGN KEY (contact_id)
    REFERENCES bling_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_pedido_canal FOREIGN KEY (sales_channel_id)
    REFERENCES bling_sales_channels(id) ON DELETE SET NULL,
  CONSTRAINT fk_pedido_unidade FOREIGN KEY (business_unit_id)
    REFERENCES bling_business_units(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pedidos de venda (§20)';

CREATE TABLE IF NOT EXISTS bling_sales_order_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  product_id     BIGINT UNSIGNED NULL,
  bling_id       VARCHAR(64) NULL,
  sku            VARCHAR(120) NULL,
  descricao      VARCHAR(300) NULL,
  quantidade     DECIMAL(14,4) NOT NULL DEFAULT 0,
  valor_unitario DECIMAL(14,2) NOT NULL DEFAULT 0,
  valor_total    DECIMAL(14,2) NOT NULL DEFAULT 0,
  custo_unitario DECIMAL(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_item_pedido (sales_order_id),
  KEY ix_item_produto (account_id, product_id),
  CONSTRAINT fk_item_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_pedido FOREIGN KEY (sales_order_id)
    REFERENCES bling_sales_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_produto FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bling_sales_order_status_history (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  situacao_de    VARCHAR(60) NULL,
  situacao_para  VARCHAR(60) NOT NULL,
  origem         VARCHAR(40) NOT NULL DEFAULT 'sync',
  observado_em   DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY ix_hist_pedido (sales_order_id, observado_em),
  CONSTRAINT fk_hist_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_pedido FOREIGN KEY (sales_order_id)
    REFERENCES bling_sales_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Timeline do pedido (§21.1)';

-- ══════════════════════════════════════════════════════════════════════════
-- COMPRAS
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_purchase_orders (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  numero         VARCHAR(60) NULL,
  supplier_id    BIGINT UNSIGNED NULL,
  situacao       VARCHAR(60) NOT NULL,
  situacao_bling VARCHAR(60) NULL,
  data_emissao   DATE NOT NULL,
  data_previsao  DATE NULL,
  data_recebimento DATE NULL,
  valor          DECIMAL(14,2) NOT NULL DEFAULT 0,
  qtd_itens      INT UNSIGNED NOT NULL DEFAULT 0,
  qtd_total      DECIMAL(14,4) NOT NULL DEFAULT 0,
  qtd_recebida   DECIMAL(14,4) NOT NULL DEFAULT 0,
  comprador      VARCHAR(190) NULL,
  tem_divergencia TINYINT(1) NOT NULL DEFAULT 0,
  payload_hash   CHAR(32) NULL,
  criado_externo_em     DATETIME NULL,
  atualizado_externo_em DATETIME NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_compra (account_id, bling_id),
  KEY ix_compra_emissao (account_id, data_emissao),
  KEY ix_compra_fornecedor (account_id, supplier_id),
  KEY ix_compra_situacao (account_id, situacao),
  CONSTRAINT fk_compra_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_compra_fornecedor FOREIGN KEY (supplier_id)
    REFERENCES bling_suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pedidos de compra (§27)';

CREATE TABLE IF NOT EXISTS bling_purchase_order_items (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id        BIGINT UNSIGNED NOT NULL,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  product_id        BIGINT UNSIGNED NULL,
  sku               VARCHAR(120) NULL,
  descricao         VARCHAR(300) NULL,
  quantidade        DECIMAL(14,4) NOT NULL DEFAULT 0,
  quantidade_recebida DECIMAL(14,4) NOT NULL DEFAULT 0,
  valor_unitario    DECIMAL(14,2) NOT NULL DEFAULT 0,
  valor_total       DECIMAL(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_item_compra (purchase_order_id),
  CONSTRAINT fk_item_compra_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_compra FOREIGN KEY (purchase_order_id)
    REFERENCES bling_purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_compra_produto FOREIGN KEY (product_id)
    REFERENCES bling_products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════
-- FISCAL
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_invoices (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  numero         VARCHAR(60) NULL,
  serie          VARCHAR(20) NULL,
  chave          VARCHAR(60) NULL,
  sales_order_id BIGINT UNSIGNED NULL,
  contact_id     BIGINT UNSIGNED NULL,
  data_emissao   DATE NOT NULL,
  valor          DECIMAL(14,2) NOT NULL DEFAULT 0,
  situacao       VARCHAR(60) NOT NULL,
  situacao_bling VARCHAR(60) NULL,
  finalidade     VARCHAR(40) NULL,
  tipo           ENUM('entrada','saida') NOT NULL DEFAULT 'saida',
  erro_codigo    VARCHAR(20) NULL,
  erro_mensagem  VARCHAR(500) NULL,
  tentativas     INT UNSIGNED NOT NULL DEFAULT 1,
  url_danfe      VARCHAR(500) NULL,
  url_xml        VARCHAR(500) NULL,
  payload_hash   CHAR(32) NULL,
  criado_externo_em     DATETIME NULL,
  atualizado_externo_em DATETIME NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nota (account_id, bling_id),
  UNIQUE KEY uq_nota_chave (chave),
  KEY ix_nota_emissao (account_id, data_emissao),
  KEY ix_nota_situacao (account_id, situacao, data_emissao),
  KEY ix_nota_pedido (sales_order_id),
  KEY ix_nota_erro (account_id, erro_codigo),
  CONSTRAINT fk_nota_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_nota_pedido FOREIGN KEY (sales_order_id)
    REFERENCES bling_sales_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_nota_contato FOREIGN KEY (contact_id)
    REFERENCES bling_contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notas fiscais (§30)';

CREATE TABLE IF NOT EXISTS bling_invoice_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   BIGINT UNSIGNED NOT NULL,
  invoice_id   BIGINT UNSIGNED NOT NULL,
  evento       VARCHAR(60) NOT NULL,
  codigo       VARCHAR(20) NULL,
  mensagem     VARCHAR(500) NULL,
  observado_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY ix_nota_evento (invoice_id, observado_em),
  CONSTRAINT fk_nota_evento_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_nota_evento_nota FOREIGN KEY (invoice_id)
    REFERENCES bling_invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tentativas e rejeições da nota (§30.3)';

CREATE TABLE IF NOT EXISTS bling_service_invoices (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   BIGINT UNSIGNED NOT NULL,
  bling_id     VARCHAR(64) NOT NULL,
  numero       VARCHAR(60) NULL,
  contact_id   BIGINT UNSIGNED NULL,
  data_emissao DATE NOT NULL,
  competencia  CHAR(7) NULL,
  descricao    VARCHAR(500) NULL,
  valor        DECIMAL(14,2) NOT NULL DEFAULT 0,
  iss_percentual DECIMAL(6,2) NULL,
  iss_valor    DECIMAL(14,2) NULL,
  situacao     VARCHAR(60) NOT NULL,
  payload_hash CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nfs (account_id, bling_id),
  KEY ix_nfs_emissao (account_id, data_emissao),
  CONSTRAINT fk_nfs_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_nfs_contato FOREIGN KEY (contact_id)
    REFERENCES bling_contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notas de serviço (§10 item 22)';

-- ══════════════════════════════════════════════════════════════════════════
-- FINANCEIRO
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_financial_categories (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   BIGINT UNSIGNED NOT NULL,
  bling_id     VARCHAR(64) NOT NULL,
  nome         VARCHAR(190) NOT NULL,
  tipo         ENUM('receita','despesa') NOT NULL,
  payload_hash CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_fin (account_id, bling_id),
  CONSTRAINT fk_cat_fin_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bling_payment_methods (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   BIGINT UNSIGNED NOT NULL,
  bling_id     VARCHAR(64) NOT NULL,
  nome         VARCHAR(190) NOT NULL,
  prazo_dias   INT UNSIGNED NULL,
  taxa_percentual DECIMAL(6,2) NULL,
  payload_hash CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_forma_pgto (account_id, bling_id),
  CONSTRAINT fk_forma_pgto_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bling_accounts_receivable (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  titulo         VARCHAR(60) NULL,
  contact_id     BIGINT UNSIGNED NULL,
  sales_order_id BIGINT UNSIGNED NULL,
  financial_category_id BIGINT UNSIGNED NULL,
  payment_method_id BIGINT UNSIGNED NULL,
  data_emissao   DATE NULL,
  data_vencimento DATE NOT NULL,
  parcela        VARCHAR(20) NULL,
  valor          DECIMAL(14,2) NOT NULL DEFAULT 0,
  valor_recebido DECIMAL(14,2) NOT NULL DEFAULT 0,
  -- saldo GERADO: um UPDATE parcial não pode deixar saldo mentindo.
  saldo          DECIMAL(14,2) AS (valor - valor_recebido) STORED,
  situacao       VARCHAR(60) NOT NULL,
  situacao_bling VARCHAR(60) NULL,
  payload_hash   CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_receber (account_id, bling_id),
  KEY ix_receber_venc (account_id, data_vencimento),
  KEY ix_receber_situacao (account_id, situacao, data_vencimento),
  KEY ix_receber_contato (account_id, contact_id),
  CONSTRAINT fk_receber_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_receber_contato FOREIGN KEY (contact_id)
    REFERENCES bling_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_receber_pedido FOREIGN KEY (sales_order_id)
    REFERENCES bling_sales_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_receber_categoria FOREIGN KEY (financial_category_id)
    REFERENCES bling_financial_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_receber_forma FOREIGN KEY (payment_method_id)
    REFERENCES bling_payment_methods(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Contas a receber (§32)';

CREATE TABLE IF NOT EXISTS bling_accounts_payable (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  titulo         VARCHAR(60) NULL,
  supplier_id    BIGINT UNSIGNED NULL,
  purchase_order_id BIGINT UNSIGNED NULL,
  financial_category_id BIGINT UNSIGNED NULL,
  descricao      VARCHAR(300) NULL,
  data_emissao   DATE NULL,
  data_vencimento DATE NOT NULL,
  competencia    CHAR(7) NULL,
  valor          DECIMAL(14,2) NOT NULL DEFAULT 0,
  valor_pago     DECIMAL(14,2) NOT NULL DEFAULT 0,
  saldo          DECIMAL(14,2) AS (valor - valor_pago) STORED,
  situacao       VARCHAR(60) NOT NULL,
  situacao_bling VARCHAR(60) NULL,
  is_recorrente  TINYINT(1) NOT NULL DEFAULT 0,
  payload_hash   CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  deletado_em    DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagar (account_id, bling_id),
  KEY ix_pagar_venc (account_id, data_vencimento),
  KEY ix_pagar_situacao (account_id, situacao, data_vencimento),
  CONSTRAINT fk_pagar_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pagar_fornecedor FOREIGN KEY (supplier_id)
    REFERENCES bling_suppliers(id) ON DELETE SET NULL,
  CONSTRAINT fk_pagar_compra FOREIGN KEY (purchase_order_id)
    REFERENCES bling_purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_pagar_categoria FOREIGN KEY (financial_category_id)
    REFERENCES bling_financial_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Contas a pagar (§33)';

-- ══════════════════════════════════════════════════════════════════════════
-- LOGÍSTICA
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bling_shipments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  bling_id       VARCHAR(64) NOT NULL,
  sales_order_id BIGINT UNSIGNED NULL,
  invoice_id     BIGINT UNSIGNED NULL,
  contact_id     BIGINT UNSIGNED NULL,
  transportadora VARCHAR(190) NULL,
  servico        VARCHAR(120) NULL,
  rastreamento   VARCHAR(120) NULL,
  data_despacho  DATE NULL,
  data_previsao  DATE NULL,
  data_entrega   DATE NULL,
  uf_destino     CHAR(2) NULL,
  custo          DECIMAL(14,2) NOT NULL DEFAULT 0,
  situacao       VARCHAR(60) NOT NULL,
  situacao_bling VARCHAR(60) NULL,
  ocorrencia     VARCHAR(300) NULL,
  payload_hash   CHAR(32) NULL,
  sincronizado_em DATETIME NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_envio (account_id, bling_id),
  KEY ix_envio_despacho (account_id, data_despacho),
  KEY ix_envio_situacao (account_id, situacao),
  KEY ix_envio_rastreio (account_id, rastreamento),
  CONSTRAINT fk_envio_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_envio_pedido FOREIGN KEY (sales_order_id)
    REFERENCES bling_sales_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_envio_nota FOREIGN KEY (invoice_id)
    REFERENCES bling_invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_envio_contato FOREIGN KEY (contact_id)
    REFERENCES bling_contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Envios e expedição (§39)';

CREATE TABLE IF NOT EXISTS bling_shipment_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   BIGINT UNSIGNED NOT NULL,
  shipment_id  BIGINT UNSIGNED NOT NULL,
  evento       VARCHAR(120) NOT NULL,
  descricao    VARCHAR(300) NULL,
  local        VARCHAR(190) NULL,
  observado_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY ix_envio_evento (shipment_id, observado_em),
  CONSTRAINT fk_envio_evento_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_envio_evento_envio FOREIGN KEY (shipment_id)
    REFERENCES bling_shipments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Rastreamento (§39)';

-- ══════════════════════════════════════════════════════════════════════════
-- SINCRONIZAÇÃO, FILA E OBSERVABILIDADE
--
-- As quatro tabelas seguintes NÃO têm FK para bling_accounts. É deliberado:
-- precisam sobreviver à remoção da conta, porque é exatamente aí que alguém vai
-- querer investigar o que aconteceu. A coluna account_id fica como referência
-- solta e documentada.
-- ══════════════════════════════════════════════════════════════════════════

-- Estado por recurso: cursor, watermark e retry.
-- ESTA tem FK — foi a falta dela no gcal_sync_state que produziu 16 órfãs e a
-- tela dizendo "✔ sincronizado" com zero contas.
CREATE TABLE IF NOT EXISTS bling_sync_state (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  recurso        VARCHAR(60) NOT NULL,
  estrategia     ENUM('carga_inicial','incremental','reconciliacao') NOT NULL DEFAULT 'carga_inicial',
  situacao       ENUM('ok','atencao','parcial','erro','nunca_executado') NOT NULL DEFAULT 'nunca_executado',
  cursor_atual   VARCHAR(190) NULL   COMMENT 'de onde retomar',
  pagina_atual   INT UNSIGNED NOT NULL DEFAULT 1,
  watermark      DATETIME NULL       COMMENT 'até quando já foi lido (UTC)',
  ultima_execucao_em  DATETIME NULL,
  proxima_execucao_em DATETIME NULL,
  duracao_ms     INT UNSIGNED NULL,
  registros_consultados INT UNSIGNED NOT NULL DEFAULT 0,
  registros_criados     INT UNSIGNED NOT NULL DEFAULT 0,
  registros_atualizados INT UNSIGNED NOT NULL DEFAULT 0,
  registros_ignorados   INT UNSIGNED NOT NULL DEFAULT 0,
  erros          INT UNSIGNED NOT NULL DEFAULT 0,
  retry          INT UNSIGNED NOT NULL DEFAULT 0,
  limite_consumido_pct TINYINT UNSIGNED NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sync (account_id, recurso),
  CONSTRAINT fk_sync_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Estado da sincronização por recurso (§47)';

CREATE TABLE IF NOT EXISTS bling_sync_jobs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id    BIGINT UNSIGNED NULL,
  recurso       VARCHAR(60) NOT NULL,
  estrategia    VARCHAR(40) NOT NULL,
  situacao      ENUM('executando','concluido','falhou','cancelado') NOT NULL DEFAULT 'executando',
  iniciado_em   DATETIME NOT NULL,
  terminado_em  DATETIME NULL,
  duracao_ms    INT UNSIGNED NULL,
  consultados   INT UNSIGNED NOT NULL DEFAULT 0,
  criados       INT UNSIGNED NOT NULL DEFAULT 0,
  atualizados   INT UNSIGNED NOT NULL DEFAULT 0,
  ignorados     INT UNSIGNED NOT NULL DEFAULT 0,
  erros         INT UNSIGNED NOT NULL DEFAULT 0,
  correlation_id VARCHAR(64) NULL,
  mensagem      VARCHAR(500) NULL,
  PRIMARY KEY (id),
  KEY ix_job_recurso (recurso, iniciado_em),
  KEY ix_job_conta (account_id, iniciado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Histórico de execuções (§47). SEM FK: sobrevive à conta';

CREATE TABLE IF NOT EXISTS bling_sync_errors (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NULL,
  sync_job_id    BIGINT UNSIGNED NULL,
  recurso        VARCHAR(60) NOT NULL,
  bling_id       VARCHAR(64) NULL,
  codigo         VARCHAR(64) NULL,
  mensagem       VARCHAR(1000) NULL,
  http_status    SMALLINT UNSIGNED NULL,
  tentativa      INT UNSIGNED NOT NULL DEFAULT 1,
  correlation_id VARCHAR(64) NULL,
  ocorrido_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_erro_recurso (recurso, ocorrido_em),
  KEY ix_erro_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Erros de sincronização. SEM FK: sobrevive à conta';

-- Fila com prioridade e dead-letter (§47).
CREATE TABLE IF NOT EXISTS bling_queue (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NULL,
  tipo           VARCHAR(60) NOT NULL   COMMENT 'webhook | sync | reconciliacao',
  recurso        VARCHAR(60) NOT NULL,
  referencia     VARCHAR(120) NULL      COMMENT 'id externo do que processar',
  payload        JSON NULL,
  -- Prioridade menor = mais urgente. Webhook (10) passa na frente de carga (50):
  -- o webhook é o caminho reativo e a carga pode esperar.
  prioridade     TINYINT UNSIGNED NOT NULL DEFAULT 50,
  situacao       ENUM('pendente','processando','concluido','falhou','dlq')
                 NOT NULL DEFAULT 'pendente',
  tentativas     INT UNSIGNED NOT NULL DEFAULT 0,
  max_tentativas INT UNSIGNED NOT NULL DEFAULT 5,
  disponivel_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT 'backoff: só processa a partir daqui',
  ultimo_erro    VARCHAR(1000) NULL,
  correlation_id VARCHAR(64) NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Índice do consumidor: pega o próximo item pendente já disponível, na ordem
  -- de prioridade. Sem ele o SELECT ... FOR UPDATE varre a fila inteira.
  KEY ix_fila_proximo (situacao, disponivel_em, prioridade, id),
  KEY ix_fila_dlq (situacao, atualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Fila de processamento com DLQ (§47). SEM FK: sobrevive à conta';

CREATE TABLE IF NOT EXISTS bling_webhook_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NULL,
  evento         VARCHAR(120) NOT NULL,
  bling_id       VARCHAR(64) NULL,
  -- Idempotência (§46): a mesma entrega, reenviada, não processa duas vezes.
  chave_idempotencia CHAR(64) NOT NULL COMMENT 'sha256(evento|bling_id|hash do corpo)',
  assinatura_ok  TINYINT(1) NOT NULL DEFAULT 0,
  situacao       ENUM('recebido','na_fila','processado','falhou','duplicado','dlq')
                 NOT NULL DEFAULT 'recebido',
  tentativas     INT UNSIGNED NOT NULL DEFAULT 0,
  duracao_ms     INT UNSIGNED NULL,
  resultado      VARCHAR(1000) NULL,
  correlation_id VARCHAR(64) NULL,
  recebido_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processado_em  DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_webhook_idem (chave_idempotencia),
  KEY ix_webhook_evento (evento, recebido_em),
  KEY ix_webhook_situacao (situacao, recebido_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Webhooks recebidos (§46). SEM FK: sobrevive à conta';

-- Payload cru: guardado à parte porque é grande e raramente lido.
-- Retenção curta e controlada — não é backup do Bling.
CREATE TABLE IF NOT EXISTS bling_raw_payloads (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id   BIGINT UNSIGNED NULL,
  recurso      VARCHAR(60) NOT NULL,
  bling_id     VARCHAR(64) NULL,
  origem       VARCHAR(40) NOT NULL DEFAULT 'sync',
  payload      LONGTEXT NOT NULL,
  payload_hash CHAR(32) NOT NULL,
  recebido_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em    DATETIME NULL   COMMENT 'limpeza automática; NULL = manter',
  PRIMARY KEY (id),
  KEY ix_raw_recurso (recurso, bling_id),
  KEY ix_raw_expira (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Payload original (§50). SEM FK: sobrevive à conta';

CREATE TABLE IF NOT EXISTS bling_alerts (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NOT NULL,
  tipo           VARCHAR(80) NOT NULL,
  severidade     ENUM('critica','alta','media','baixa','informativa') NOT NULL,
  modulo         VARCHAR(60) NOT NULL,
  descricao      VARCHAR(500) NOT NULL,
  quantidade     INT UNSIGNED NOT NULL DEFAULT 0,
  valor_impactado DECIMAL(14,2) NULL,
  tela           VARCHAR(60) NULL,
  reconhecido_em DATETIME NULL,
  reconhecido_por BIGINT UNSIGNED NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alerta (account_id, tipo),
  KEY ix_alerta_sev (account_id, severidade),
  CONSTRAINT fk_alerta_conta FOREIGN KEY (account_id)
    REFERENCES bling_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Alertas materializados (§44)';

CREATE TABLE IF NOT EXISTS bling_audit_logs (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id     BIGINT UNSIGNED NULL,
  user_id        BIGINT UNSIGNED NULL,
  usuario_email  VARCHAR(190) NULL   COMMENT 'copiado no momento do ato: o usuário pode ser removido depois',
  acao           VARCHAR(80) NOT NULL,
  entidade       VARCHAR(80) NULL,
  entidade_id    VARCHAR(64) NULL,
  valor_anterior JSON NULL,
  valor_novo     JSON NULL,
  ip             VARCHAR(64) NULL,
  origem         VARCHAR(60) NULL,
  resultado      ENUM('sucesso','falha','negado') NOT NULL DEFAULT 'sucesso',
  detalhe        VARCHAR(1000) NULL,
  correlation_id VARCHAR(64) NULL,
  ocorrido_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_auditoria_quando (ocorrido_em),
  KEY ix_auditoria_usuario (user_id, ocorrido_em),
  KEY ix_auditoria_acao (acao, ocorrido_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Trilha de auditoria (§63). SEM FK: sobrevive à conta e ao usuário';

-- ══════════════════════════════════════════════════════════════════════════
-- USUÁRIO DA APLICAÇÃO — PRIVILÉGIO MÍNIMO
--
-- A aplicação conecta no MySQL como ROOT hoje (passivo aberto do projeto).
-- Este módulo NÃO amplia esse passivo: usa usuário próprio, como o gcal_app.
--
-- Sem DDL em runtime, sem GRANT, sem FILE, sem acesso a outros schemas.
-- Trocar a senha abaixo antes de executar.
-- ══════════════════════════════════════════════════════════════════════════

-- ⚠️ DOIS HOSTS, NÃO UM.
-- O MySQL trata 'localhost' (socket Unix) e '127.0.0.1' (TCP) como hosts
-- DIFERENTES. O .env deste projeto usa 127.0.0.1 em todos os bancos locais, mas
-- um cron que conecte por socket cai em 'localhost'. Criar só um dos dois
-- resulta em "Access denied" que parece senha errada e não é.
--
-- CREATE USER IF NOT EXISTS 'bling_app'@'127.0.0.1' IDENTIFIED BY 'TROCAR_ESTA_SENHA';
-- CREATE USER IF NOT EXISTS 'bling_app'@'localhost' IDENTIFIED BY 'TROCAR_ESTA_SENHA';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON BLING.* TO 'bling_app'@'127.0.0.1';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON BLING.* TO 'bling_app'@'localhost';
-- FLUSH PRIVILEGES;
--
-- Conferir depois: SHOW GRANTS FOR 'bling_app'@'localhost';
-- Deve listar SOMENTE o GRANT acima. Se aparecer ALL PRIVILEGES ou *.*, parar.
