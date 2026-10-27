<?php
declare(strict_types=1);

/**
 * /api/avatar/ponte.php — PONTE servidor-a-servidor do APP DSHOW para o Avatar Studio (Programa "Avatar nativo", Onda 1).
 * @version 0.1.0  @created 2026-10-27
 *
 * O backend do app (Fastify, mesma máquina) chama este endpoint por LOOPBACK, autenticado por HMAC (PonteAuth), para LER o que
 * o editor nativo precisa e para GRAVAR pelo MESMO pipeline do studio.php (StudioLib). Sem sessão PHP, sem cookie, sem CSRF.
 * Toda a lógica está em PonteCore.php (testável: scripts/avatar/testes/ponte-core.php); este arquivo só liga HTTP ↔ núcleo.
 *
 *   flag server-side `avatar.ponte_app` (FeatureFlagResolver) DESLIGADA/ausente → 404 (endpoint inerte, fail-closed)
 *   POST { user_id:int, acao:'ler'|'salvar'|'reativar'|'meta'|'favorito', payload:{…}, request_id:string, flags?:string[] }
 *     ler      → { estado, historico, favoritos, vida:{conquistas,eventos,desbloqueados}, flags:{k:bool}, limites }
 *     salvar   → payload {config, svg, base_version}   → { version, render_url, tipo:'camadas' }  (foto/3d → 403 FUNCAO_DESLIGADA)
 *     reativar → payload {id, base_version}            → { version, render_url, tipo }
 *     meta     → payload {id, nome?, fixado?}          → { id, nome, fixado }
 *     favorito → payload {item}                        → { favorito, sincronizado }
 *   erros: 400 PEDIDO_INVALIDO/ACAO_INVALIDA/… · 403 ITEM_BLOQUEADO/FUNCAO_DESLIGADA/PONTE_RECUSADA · 404 · 409 CONFLITO_VERSAO
 *          · 413 CORPO_GRANDE · 422 ITEM_INVALIDO · 429 RATE_LIMIT · 503 PONTE_INDISPONIVEL. Envelope igual ao do studio.php.
 *   Auditoria: uma linha AVST_PONTE no error_log por pedido (user, acao, request_id, status, erro).
 */

require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/PonteCore.php';

$pdo = null;
try {
    $pdo = getConnection('DSHOWDASH');
} catch (Throwable $e) {
    error_log('[avatar/ponte.php] banco: ' . $e->getMessage());
}
$corpo = file_get_contents('php://input', false, null, 0, AVPT_CORPO_MAX + 1) ?: '';
[$status, $envelope] = avpt_executar($pdo, $_SERVER, $corpo);
if ($status === 405) {
    header('Allow: POST');
}
http_response_code($status);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode($envelope, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
