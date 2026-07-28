-- ============================================================================
-- Painel Anúncios — Workspace Fase 2: perfis, favoritas e arquivamento.
-- 100% ADITIVO: só ADD COLUMN. Rodar 1x (o runner de deploy verifica antes).
-- @module anuncios.sql.workspace_f2
-- @created 2026-07-28
-- ============================================================================

ALTER TABLE anuncios_conversas
  ADD COLUMN profile     VARCHAR(20) NOT NULL DEFAULT 'consultor' AFTER titulo,
  ADD COLUMN is_favorita TINYINT(1)  NOT NULL DEFAULT 0 AFTER profile,
  ADD COLUMN arquivada   TINYINT(1)  NOT NULL DEFAULT 0 AFTER is_favorita;

-- ── Reversão (manual, se necessário) ──
-- ALTER TABLE anuncios_conversas
--   DROP COLUMN profile, DROP COLUMN is_favorita, DROP COLUMN arquivada;
