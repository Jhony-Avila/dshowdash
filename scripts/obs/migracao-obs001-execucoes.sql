-- OBS-001 · registro central de execuções (VINHO/ACIMA_ESQUERDA, 26/11/2026 noite) · banco do Dash (DSHOWDASH) · ADITIVA (CREATE TABLE IF NOT EXISTS)
-- Referência: LOTE9/OBS-001 (schema.sql), adaptada: job/escopo por identificador TÉCNICO do catálogo (nunca nome de pessoa/cliente), horários UTC.
-- SEM payload, mensagem, URL, chave ou documento: só estado, volume (nullable), código de erro de uma lista fechada e os horários.
-- Volta: scripts/obs/migracao-obs001-execucoes-volta.sql (RENAME, nunca DROP). CHECKs e FK SEM nome explícito de propósito: o MySQL renomeia os
-- nomes gerados junto com a tabela; com nome explícito, a migração não poderia ser reaplicada depois da volta (nome repetido no schema).
CREATE TABLE IF NOT EXISTS `obs_execucao` (
  `job` VARCHAR(40) NOT NULL COMMENT 'id técnico do catálogo, ex.: asaas.sincronizar',
  `escopo` VARCHAR(40) NOT NULL COMMENT 'partição técnica (conta/empresa) ou "-"',
  `slot` DATETIME NOT NULL COMMENT 'horário PREVISTO da execução, UTC',
  `tentativa` SMALLINT UNSIGNED NOT NULL,
  `iniciado_em` DATETIME(3) NOT NULL COMMENT 'UTC',
  `terminado_em` DATETIME(3) NULL COMMENT 'UTC',
  `estado` ENUM('executando','ok','parcial','falhou','interrompida') NOT NULL,
  `volume` BIGINT UNSIGNED NULL COMMENT 'itens processados; null = desconhecido (nunca 0 por falta)',
  `erro_codigo` ENUM('tempo','fonte','cobertura','interrompida','interno') NULL,
  `posse_ate` DATETIME(3) NOT NULL COMMENT 'lease UTC: passou disso sem terminar = interrompida (watchdog)',
  PRIMARY KEY (`job`, `escopo`, `slot`, `tentativa`),
  KEY `ix_recente` (`job`, `escopo`, `iniciado_em`),
  KEY `ix_aberta` (`estado`, `posse_ate`),
  CHECK (`tentativa` >= 1),
  CHECK ((`estado` = 'executando' AND `terminado_em` IS NULL) OR (`estado` <> 'executando' AND `terminado_em` IS NOT NULL)),
  CHECK (`estado` <> 'ok' OR `erro_codigo` IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `obs_posse` (
  `job` VARCHAR(40) NOT NULL,
  `escopo` VARCHAR(40) NOT NULL,
  `slot` DATETIME NOT NULL,
  `tentativa` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`job`, `escopo`) COMMENT 'uma execução em andamento por job+escopo',
  FOREIGN KEY (`job`, `escopo`, `slot`, `tentativa`) REFERENCES `obs_execucao` (`job`, `escopo`, `slot`, `tentativa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
