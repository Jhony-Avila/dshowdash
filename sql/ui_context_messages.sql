-- ═══════════════════════════════════════════════════════════════
-- UI Context Messages - Tabela de mensagens contextuais
-- @version 1.0.0
-- @database DSHOWDASH
-- @created 2026-01-27
-- ═══════════════════════════════════════════════════════════════

-- Criar tabela
CREATE TABLE IF NOT EXISTS ui_context_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificador único da mensagem',
  message VARCHAR(255) NOT NULL COMMENT 'Texto da mensagem (suporta placeholders)',
  subtitle VARCHAR(255) DEFAULT NULL COMMENT 'Subtítulo opcional',
  category ENUM('temporal','acolhimento','acao','contexto','estado','inspiracional','idle') NOT NULL COMMENT 'Categoria da mensagem',
  priority INT DEFAULT 50 COMMENT 'Prioridade (maior = mais importante)',
  active BOOLEAN DEFAULT TRUE COMMENT 'Se a mensagem está ativa',
  start_time TINYINT UNSIGNED DEFAULT NULL COMMENT 'Hora inicial (0-23)',
  end_time TINYINT UNSIGNED DEFAULT NULL COMMENT 'Hora final (0-23)',
  days_of_week JSON DEFAULT NULL COMMENT 'Dias da semana [0-6]',
  requires_user_name BOOLEAN DEFAULT FALSE COMMENT 'Requer nome do usuário',
  min_session_time INT UNSIGNED DEFAULT NULL COMMENT 'Tempo mínimo de sessão (segundos)',
  max_session_time INT UNSIGNED DEFAULT NULL COMMENT 'Tempo máximo de sessão (segundos)',
  system_state VARCHAR(20) DEFAULT NULL COMMENT 'Estado do sistema (ready, loading, error)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_active (active),
  INDEX idx_priority (priority DESC),
  INDEX idx_system_state (system_state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mensagens contextuais para UI';

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS TEMPORAIS (Categoria A)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority, start_time, end_time, requires_user_name) VALUES
('morning_greeting', '{saudacao}, {nome}', 'Pronto para começar o dia?', 'temporal', 80, 5, 12, TRUE),
('morning_greeting_generic', '{saudacao}', 'Um novo dia, novas possibilidades', 'temporal', 70, 5, 12, FALSE),
('afternoon_greeting', '{saudacao}, {nome}', 'Continue o bom trabalho', 'temporal', 80, 12, 18, TRUE),
('afternoon_greeting_generic', '{saudacao}', 'Tarde produtiva pela frente', 'temporal', 70, 12, 18, FALSE),
('evening_greeting', '{saudacao}, {nome}', 'Finalizando mais um dia', 'temporal', 80, 18, 22, TRUE),
('evening_greeting_generic', '{saudacao}', 'Reta final do dia', 'temporal', 70, 18, 22, FALSE),
('night_greeting', 'Trabalhando até tarde, {nome}?', 'Lembre-se de descansar', 'temporal', 75, 22, 5, TRUE),
('night_greeting_generic', 'Sessão noturna', 'O sistema está disponível 24h', 'temporal', 65, 22, 5, FALSE),
('monday_start', 'Início de semana', 'Vamos com tudo!', 'temporal', 85, NULL, NULL, FALSE),
('friday_end', 'Sexta-feira', 'Finalize a semana com chave de ouro', 'temporal', 85, NULL, NULL, FALSE);

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS DE ACOLHIMENTO (Categoria B)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority, requires_user_name, min_session_time, max_session_time) VALUES
('welcome_user', 'Bem-vindo, {nome}', 'Bom te ver por aqui', 'acolhimento', 90, TRUE, NULL, 60),
('welcome_generic', 'Bem-vindo ao sistema', 'Seu ambiente está pronto', 'acolhimento', 85, FALSE, NULL, 60),
('welcome_back', 'Que bom te ver de volta, {nome}', 'Continuando de onde parou', 'acolhimento', 88, TRUE, NULL, 120),
('welcome_back_generic', 'Bem-vindo de volta', 'Tudo como você deixou', 'acolhimento', 82, FALSE, NULL, 120);

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS DE AÇÃO/PRODUTIVIDADE (Categoria C)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority, system_state) VALUES
('ready_to_start', 'Tudo pronto para começar', 'Selecione um módulo no menu', 'acao', 75, 'ready'),
('environment_ready', 'Ambiente preparado', 'Use a barra lateral para navegar', 'acao', 70, 'ready'),
('lets_go', 'Vamos lá', 'O que vamos fazer hoje?', 'acao', 65, 'ready');

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS DE CONTEXTO/CONTINUIDADE (Categoria D)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority, min_session_time) VALUES
('session_restored', 'Sessão restaurada', 'Suas preferências foram aplicadas', 'contexto', 80, NULL),
('preferences_applied', 'Preferências carregadas', 'Tudo configurado do seu jeito', 'contexto', 75, NULL),
('continuing_work', 'Continuando o trabalho', 'Você estava por aqui há pouco', 'contexto', 70, 300);

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS DE ESTADO DO SISTEMA (Categoria E)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority, system_state) VALUES
('system_stable', 'Sistema estável', 'Todos os serviços operacionais', 'estado', 60, 'ready'),
('monitoring_active', 'Monitoramento ativo', 'Tudo sob controle', 'estado', 55, 'ready'),
('all_systems_go', 'Tudo funcionando', 'Sem pendências no momento', 'estado', 50, 'ready'),
('system_loading', 'Carregando...', 'Preparando o ambiente', 'estado', 95, 'loading'),
('system_error', 'Ops, algo não está certo', 'Tentando reconectar...', 'estado', 100, 'error');

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS INSPIRACIONAIS (Categoria F)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority) VALUES
('focus_clarity', 'Menos ruído, mais foco', NULL, 'inspiracional', 40),
('clarity_speed', 'Clareza gera velocidade', NULL, 'inspiracional', 40),
('simplicity', 'Simplicidade é sofisticação', NULL, 'inspiracional', 40),
('progress', 'Pequenos passos, grandes resultados', NULL, 'inspiracional', 40),
('consistency', 'Consistência constrói excelência', NULL, 'inspiracional', 40);

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS IDLE/NEUTRA (Categoria G)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ui_context_messages (key_name, message, subtitle, category, priority, min_session_time) VALUES
('idle_waiting', 'Em espera', 'Aguardando sua ação', 'idle', 30, 600),
('session_active', 'Sessão ativa', NULL, 'idle', 25, 300),
('standing_by', 'Pronto quando você estiver', NULL, 'idle', 20, 900);

-- ═══════════════════════════════════════════════════════════════
-- MENSAGENS POR DIA DA SEMANA
-- ═══════════════════════════════════════════════════════════════

UPDATE ui_context_messages SET days_of_week = '[1]' WHERE key_name = 'monday_start';
UPDATE ui_context_messages SET days_of_week = '[5]' WHERE key_name = 'friday_end';
