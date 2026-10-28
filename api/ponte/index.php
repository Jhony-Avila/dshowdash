<?php
declare(strict_types=1);

/**
 * /api/ponte/index.php — PONTE v2 servidor-a-servidor do APP DSHOW (Programa PARIDADE TOTAL, ADR-013). @version 2.0.0 @created 2026-10-28
 * O backend do app (Fastify, mesma máquina) chama por LOOPBACK, autenticado por HMAC (api/avatar/PonteAuth), para executar ações de
 * ESCRITA pelo MESMO pipeline do Dash (libs compartilhadas com os endpoints web). Sem sessão PHP, sem cookie, sem CSRF.
 *   flag `ponte.v2` DESLIGADA/ausente → 404 (endpoint inerte, fail-closed); flag `ponte.<modulo>.<tipo>` DESLIGADA → 404 MODULO_DESLIGADO
 *   POST { user_id:int, modulo:string, acao:string, payload:{…}, request_id:string(16..64), contexto?:{ip_app, app_versao} }
 *   W1: alertas.{reconhecer,resolver,silenciar,dessilenciar} (nível ≥ 80) · notificacoes.{marcar_lida,marcar_todas,excluir} (posse)
 *   erros: 400 PEDIDO_INVALIDO/ACAO_INVALIDA · 403 PONTE_RECUSADA/USUARIO_INVALIDO/PERMISSAO_NEGADA · 404 NAO_ENCONTRADO/MODULO_DESLIGADO
 *          · 409 CONFLITO/IDEMPOTENCIA_DIVERGENTE/EM_ANDAMENTO · 413 CORPO_GRANDE · 422 VALIDACAO · 503 PONTE_INDISPONIVEL · 500 ERRO_INTERNO
 *   Idempotência: app_ponte_ops (replay devolve a mesma resposta, meta.replay=true). Auditoria: app_audit_log + app_audit_trail.
 */

require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/PonteV2Core.php';

$pdo = null;
try {
    $pdo = getConnection('DSHOWDASH');
} catch (Throwable $e) {
    error_log('[ponte/index.php] banco: ' . $e->getMessage());
}
$corpo = file_get_contents('php://input', false, null, 0, PV2_CORPO_MAX + 1) ?: '';
[$status, $envelope] = pv2_executar($pdo, $_SERVER, $corpo);
if ($status === 405) {
    header('Allow: POST');
}
http_response_code($status);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode($envelope, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
