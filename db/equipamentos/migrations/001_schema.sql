-- =====================================================================================================================================
-- DSHOW_EQUIPAMENTOS · 001_schema — Fase B PREPARADA (31/10/2026, modo autônomo; DP-AUTO.30/35). NÃO EXECUTAR sem o Jhony:
--   o banco é criado e migrado SÓ por `sudo scripts/setup/equipamentos-db-criar.sh` (root do MySQL, dry-run antes).
-- Autoridade: definições, grupos, opções, unidades e VALORES de atributos de equipamentos. A identidade do produto continua no RDS do
-- Walter (`prd_product.id`, sem FK física — validação pela API/projeção). Escrita: o Dash (web Equipamentos › Atributos). App: só leitura.
-- Regras: nada em cascata (RESTRICT), exclusão LÓGICA (`ativo`/`excluido_em`), versão de edição (`versao`) para conflito, auditoria.
-- Estrutura legada PRESERVADA em `eq_legado_*` (bruto da importação, nunca editado) e na proveniência (`legado_ns`/`legado_id`).
-- =====================================================================================================================================

CREATE TABLE IF NOT EXISTS `eq_schema_migrations` (
  `version`    VARCHAR(64)  NOT NULL,
  `applied_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Unidades (símbolo + grandeza); conversão automática NÃO existe (só regra validada no futuro).
CREATE TABLE IF NOT EXISTS `eq_unidade` (
  `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `simbolo`    VARCHAR(20)      NOT NULL,
  `nome`       VARCHAR(80)      NOT NULL,
  `grandeza`   VARCHAR(40)      NULL COMMENT 'comprimento, potência, luminância… (do backup legado Grandeza_Atributo quando houver)',
  `ativo`      TINYINT(1)       NOT NULL DEFAULT 1,
  `legado_texto` VARCHAR(60)    NULL COMMENT 'texto original (un_medida/tp_unit) que originou a unidade',
  `criado_em`  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_unidade_simbolo` (`simbolo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Definição do atributo (código estável; tipo; unidade; precisão). Mudar o TIPO com valores preenchidos é bloqueado pela aplicação.
CREATE TABLE IF NOT EXISTS `eq_atributo` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `codigo`      VARCHAR(64)      NOT NULL COMMENT 'estável, minúsculas e _ (ex.: pitch_mm)',
  `rotulo`      VARCHAR(128)     NOT NULL,
  `tipo`        ENUM('texto','numero','inteiro','booleano','opcao','multiopcao','data') NOT NULL,
  `unidade_id`  INT UNSIGNED     NULL,
  `casas`       TINYINT UNSIGNED NULL COMMENT 'casas decimais para numero',
  `minimo`      DECIMAL(20,6)    NULL,
  `maximo`      DECIMAL(20,6)    NULL,
  `descricao`   VARCHAR(500)     NULL,
  `ativo`       TINYINT(1)       NOT NULL DEFAULT 1,
  `versao`      INT UNSIGNED     NOT NULL DEFAULT 1,
  `legado_ns`   VARCHAR(80)      NULL COMMENT 'Led_Lovers_PROD.mm_atributos | Backups.Atributos_Itens_Atributos',
  `legado_id`   BIGINT           NULL,
  `legado_meta` JSON             NULL COMMENT 'colunas legadas sem lugar próprio (grupo_atributos, tipo_produtos, categoria, subgrupos_categorias, importancia_campos, tipo_input, observacoes) — preservadas, não interpretadas',
  `criado_em`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_atributo_codigo` (`codigo`),
  UNIQUE KEY `uq_eq_atributo_legado` (`legado_ns`, `legado_id`),
  KEY `idx_eq_atributo_ativo` (`ativo`, `rotulo`),
  CONSTRAINT `fk_eq_atributo_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `eq_unidade` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Opções (identidade estável; desativar ≠ apagar; o valor guarda o ID, nunca só o rótulo).
CREATE TABLE IF NOT EXISTS `eq_opcao` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `atributo_id` INT UNSIGNED     NOT NULL,
  `rotulo`      VARCHAR(160)     NOT NULL,
  `posicao`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `ativo`       TINYINT(1)       NOT NULL DEFAULT 1,
  `legado_ns`   VARCHAR(80)      NULL COMMENT 'Backups.Atributos_Itens_Campos_Listas',
  `legado_id`   BIGINT           NULL,
  `criado_em`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_opcao_rotulo` (`atributo_id`, `rotulo`),
  UNIQUE KEY `uq_eq_opcao_legado` (`legado_ns`, `legado_id`),
  CONSTRAINT `fk_eq_opcao_atributo` FOREIGN KEY (`atributo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Grupo/template (legado: mm_atributos_grupo_subcategoria_produto) e onde se aplica (categoria/subcategoria do catálogo canônico).
CREATE TABLE IF NOT EXISTS `eq_grupo` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `nome`        VARCHAR(160)     NOT NULL,
  `ativo`       TINYINT(1)       NOT NULL DEFAULT 1,
  `versao`      INT UNSIGNED     NOT NULL DEFAULT 1,
  `legado_ns`   VARCHAR(80)      NULL,
  `legado_id`   BIGINT           NULL,
  `criado_em`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_grupo_nome` (`nome`),
  UNIQUE KEY `uq_eq_grupo_legado` (`legado_ns`, `legado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `eq_grupo_escopo` (
  `grupo_id`     INT UNSIGNED    NOT NULL,
  `categoria`    VARCHAR(40)     NOT NULL COMMENT 'prd_product.category (ex.: LED_PANEL)',
  `subcategoria` VARCHAR(60)     NOT NULL DEFAULT '' COMMENT "'' = toda a categoria",
  PRIMARY KEY (`grupo_id`, `categoria`, `subcategoria`),
  CONSTRAINT `fk_eq_grupo_escopo_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `eq_grupo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Vínculo grupo × atributo: ordem, obrigatoriedade e visibilidade POR GRUPO (o legado guardava ordem/visível por item — preservado no valor).
CREATE TABLE IF NOT EXISTS `eq_grupo_atributo` (
  `grupo_id`    INT UNSIGNED     NOT NULL,
  `atributo_id` INT UNSIGNED     NOT NULL,
  `posicao`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `obrigatorio` TINYINT(1)       NOT NULL DEFAULT 0,
  `visivel`     TINYINT(1)       NOT NULL DEFAULT 1,
  `legado_id`   VARCHAR(256)     NULL COMMENT 'mm_atributos_grupo_subcategoria_x_atributo.id (chave textual)',
  PRIMARY KEY (`grupo_id`, `atributo_id`),
  KEY `idx_eq_grupo_atributo_atr` (`atributo_id`),
  CONSTRAINT `fk_eq_ga_grupo` FOREIGN KEY (`grupo_id`) REFERENCES `eq_grupo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_ga_atributo` FOREIGN KEY (`atributo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Correspondência de legado (identidade durável; sem 1:1 imposto; sem FK para o RDS).
CREATE TABLE IF NOT EXISTS `eq_legado_vinculo` (
  `id`           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `origem_ns`    VARCHAR(60)      NOT NULL COMMENT 'Led_Lovers_PROD.mm_item',
  `chave_antiga` VARCHAR(64)      NOT NULL,
  `product_id`   BIGINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT 'prd_product.id (RDS) — 0 = sem correspondência (NULL quebraria a unicidade no reprocesso)',
  `criterio`     ENUM('legacy_product_id','manual') NOT NULL,
  `estado`       ENUM('inequivoca','ausente','ambigua','multipla','nao_verificavel','revisada') NOT NULL,
  `evidencia`    VARCHAR(500)     NULL,
  `revisado_por` VARCHAR(100)     NULL,
  `revisado_em`  DATETIME(3)      NULL,
  `lote_id`      INT UNSIGNED     NULL,
  `criado_em`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_legado_vinculo` (`origem_ns`, `chave_antiga`, `product_id`),
  KEY `idx_eq_legado_vinculo_produto` (`product_id`),
  KEY `idx_eq_legado_vinculo_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Valor por PRODUTO do catálogo canônico (tipado). Estado distingue informado × não se aplica × desconhecido (o legado não distinguia).
CREATE TABLE IF NOT EXISTS `eq_valor` (
  `id`           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `product_id`   BIGINT UNSIGNED  NOT NULL COMMENT 'prd_product.id (RDS) — validado pela API/projeção, sem FK física',
  `atributo_id`  INT UNSIGNED     NOT NULL,
  `opcao_id`     INT UNSIGNED     NULL COMMENT 'opcao/multiopcao',
  `opcao_chave`  INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '= opcao_id em multiopcao; 0 nos demais (unicidade)',
  `valor_texto`  VARCHAR(500)     NULL,
  `valor_num`    DECIMAL(20,6)    NULL,
  `valor_bool`   TINYINT(1)       NULL,
  `valor_data`   DATE             NULL,
  `estado`       ENUM('informado','nao_se_aplica','desconhecido') NOT NULL DEFAULT 'informado',
  `origem`       ENUM('importado','manual') NOT NULL,
  `legado_bruto` VARCHAR(256)     NULL COMMENT 'valor_atributo original (texto) quando importado',
  `legado_ordem` INT UNSIGNED     NULL COMMENT 'mm_atributos_x_itens.ordem (por item, preservado)',
  `legado_visivel` TINYINT(1)     NULL COMMENT 'mm_atributos_x_itens.visible (por item, preservado)',
  `versao`       INT UNSIGNED     NOT NULL DEFAULT 1,
  `lote_id`      INT UNSIGNED     NULL,
  `atualizado_por` VARCHAR(100)   NULL,
  `excluido_em`  DATETIME(3)      NULL,
  `criado_em`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_valor` (`product_id`, `atributo_id`, `opcao_chave`),
  KEY `idx_eq_valor_atributo` (`atributo_id`, `estado`),
  CONSTRAINT `fk_eq_valor_atributo` FOREIGN KEY (`atributo_id`) REFERENCES `eq_atributo` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT `fk_eq_valor_opcao` FOREIGN KEY (`opcao_id`) REFERENCES `eq_opcao` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Lote de importação + bruto preservado (nunca editado; reprocessável sem duplicar pela unicidade de proveniência).
CREATE TABLE IF NOT EXISTS `eq_importacao_lote` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `origem`      VARCHAR(200)     NOT NULL COMMENT 'descrição da exportação (quem, quando, de qual banco)',
  `arquivo_sha256` CHAR(64)      NOT NULL,
  `estado`      ENUM('ensaio','aplicado','descartado') NOT NULL DEFAULT 'ensaio',
  `relatorio`   JSON             NULL COMMENT 'contagens por origem e classificação',
  `criado_por`  VARCHAR(100)     NULL,
  `criado_em`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_importacao_arquivo` (`arquivo_sha256`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `eq_legado_bruto` (
  `id`         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `lote_id`    INT UNSIGNED     NOT NULL,
  `tabela`     VARCHAR(80)      NOT NULL,
  `chave`      VARCHAR(256)     NOT NULL,
  `linha`      JSON             NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_legado_bruto` (`lote_id`, `tabela`, `chave`),
  CONSTRAINT `fk_eq_legado_bruto_lote` FOREIGN KEY (`lote_id`) REFERENCES `eq_importacao_lote` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Auditoria das operações administrativas (quem, o quê, antes/depois resumido, motivo).
CREATE TABLE IF NOT EXISTS `eq_auditoria` (
  `id`         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `usuario`    VARCHAR(100)     NOT NULL,
  `acao`       VARCHAR(40)      NOT NULL,
  `entidade`   VARCHAR(40)      NOT NULL,
  `entidade_id` VARCHAR(64)     NOT NULL,
  `antes`      JSON             NULL,
  `depois`     JSON             NULL,
  `motivo`     VARCHAR(255)     NULL,
  `criado_em`  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_eq_auditoria_entidade` (`entidade`, `entidade_id`, `criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `eq_schema_migrations` (`version`) VALUES ('001_schema');
