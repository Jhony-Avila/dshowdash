-- /sql/koala/koala_sections_structure.sql
-- ADITIVO (ADD COLUMN nullable): estrutura default por seção do catálogo.
-- Motivo: o Renderer único já consome structure_json (pages->sections->components).
-- koala_template_sections/_components são legado POR-VERSÃO e não são lidos pelo motor.
-- Guardar a estrutura na própria seção = menor toque aditivo + editável depois (F7).
-- Shape guardado (nível-seção): {"section_key": "...", "components":[ {component_type, content_json, bindings_json} ]}
-- @created 2026-07-04  @module koala.sections

-- ADD COLUMN idempotente-por-inspeção (rodar 2x: a 2ª acusa "Duplicate column" — inócuo).
ALTER TABLE koala_sections_catalog
  ADD COLUMN structure_json JSON NULL AFTER section_type;

-- ── TEARDOWN (revert manual) ──
-- ALTER TABLE koala_sections_catalog DROP COLUMN structure_json;
