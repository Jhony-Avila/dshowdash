-- BLING · DSHOW-018 (origem: Codex DSHOW-016) · NÃO APLICADA — entra com o portão BLING-COLETA, ANTES do código.
-- bling_prices.custo passa a aceitar NULL = "custo não informado pelo Bling" (≠ 0 legítimo). Nenhuma linha é alterada:
-- os 333 zeros atuais continuam 0 (só contados/classificados; ver PORTAO-BLING-COLETA.md).
-- Reverter: ALTER TABLE bling_prices MODIFY custo DECIMAL(14,2) NOT NULL DEFAULT 0.00;  (só se não houver NULL gravado)
ALTER TABLE bling_prices MODIFY custo DECIMAL(14,2) NULL DEFAULT NULL;
