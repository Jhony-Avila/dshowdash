-- migracao-asaas-20261126-cobrancas.sql — "Cobranças vencidas · Asaas" (VINHO/ACIMA_ESQUERDA, 26/11/2026). SÓ ADITIVA, no banco DSHOWDASH.
-- Nada existente muda: 4 colunas NOVAS e NULL em asaas_cobrancas (o código atual não as lê nem escreve; a sincronização nova passa a preencher)
-- e 1 tabela NOVA, asaas_clientes (cadastro MÍNIMO: só nome e tipo de pessoa — nunca CPF/CNPJ, e-mail, telefone ou endereço).
-- Volta: as colunas e a tabela podem ficar (o código anterior as ignora); remoção só por decisão, com backup:
--   ALTER TABLE `asaas_cobrancas` DROP COLUMN `juros_multa`, DROP COLUMN `vencimento_original`, DROP COLUMN `invoice_url`, DROP COLUMN `invoice_number`;
--   DROP TABLE `asaas_clientes`;
ALTER TABLE `asaas_cobrancas`
  ADD COLUMN `juros_multa` DECIMAL(15,2) NULL AFTER `cliente_id`,
  ADD COLUMN `vencimento_original` DATE NULL AFTER `juros_multa`,
  ADD COLUMN `invoice_url` VARCHAR(255) NULL AFTER `vencimento_original`,
  ADD COLUMN `invoice_number` VARCHAR(40) NULL AFTER `invoice_url`;
CREATE TABLE IF NOT EXISTS `asaas_clientes` (
  `conta` VARCHAR(32) NOT NULL, `cliente_id` VARCHAR(40) NOT NULL, `nome` VARCHAR(160) NULL, `tipo_pessoa` VARCHAR(10) NULL,
  `deletado` TINYINT(1) NOT NULL DEFAULT 0, `atualizado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`, `cliente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
