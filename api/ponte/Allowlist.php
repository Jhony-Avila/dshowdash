<?php
declare(strict_types=1);

/**
 * /api/ponte/Allowlist.php — REGISTRO EXPLÍCITO das ações que a Ponte v2 aceita (Programa PARIDADE TOTAL, ADR-013).
 * Nada fora desta lista é executável pela ponte ("rodar endpoint X" não existe). Cada ação declara:
 *   tipo    leitura|escrita → flag `ponte.<modulo>.<tipo>` (OFF = 404 para o módulo)
 *   nivel   nível mínimo do usuário (MAX(app_roles.level)); a regra fina (posse, estado) fica na lib
 *   handler função pv2h_* abaixo: recebe (PDO, user_id, payload) e devolve ['data'=>…, 'recurso'=>[tipo,id], 'antes'=>?, 'depois'=>?]
 * W1 (28/10/2026): alertas (reconhecer, resolver, silenciar, dessilenciar — nível 80, regra do app) e notificacoes
 * (marcar_lida, marcar_todas, excluir — posse por user_id). Ondas seguintes acrescentam módulos aqui, com teste.
 * DASH-APP-V1 · DC-2 (29/10/2026): metas (definir, remover — nível 80; libs/MetaLib.php; flag `ponte.metas.escrita`).
 */
require_once __DIR__ . '/PonteErro.php';
require_once __DIR__ . '/libs/AlertaLib.php';
require_once __DIR__ . '/libs/NotificacaoLib.php';
require_once __DIR__ . '/libs/MetaLib.php';

const PV2_ALLOWLIST = [
    'alertas' => [
        'reconhecer'   => ['tipo' => 'escrita', 'nivel' => 80, 'handler' => 'pv2h_alertas_reconhecer'],
        'resolver'     => ['tipo' => 'escrita', 'nivel' => 80, 'handler' => 'pv2h_alertas_resolver'],
        'silenciar'    => ['tipo' => 'escrita', 'nivel' => 80, 'handler' => 'pv2h_alertas_silenciar'],
        'dessilenciar' => ['tipo' => 'escrita', 'nivel' => 80, 'handler' => 'pv2h_alertas_dessilenciar'],
    ],
    'notificacoes' => [
        'marcar_lida'  => ['tipo' => 'escrita', 'nivel' => 0, 'handler' => 'pv2h_notificacoes_marcar_lida'],
        'marcar_todas' => ['tipo' => 'escrita', 'nivel' => 0, 'handler' => 'pv2h_notificacoes_marcar_todas'],
        'excluir'      => ['tipo' => 'escrita', 'nivel' => 0, 'handler' => 'pv2h_notificacoes_excluir'],
    ],
    'metas' => [   // DASH-APP-V1 · DC-2: metas comerciais mensais (Q-DASH.2 — dono = Dash; Q-DC.1 — nível 80)
        'definir'      => ['tipo' => 'escrita', 'nivel' => 80, 'handler' => 'pv2h_metas_definir'],
        'remover'      => ['tipo' => 'escrita', 'nivel' => 80, 'handler' => 'pv2h_metas_remover'],
    ],
];

/** id inteiro positivo obrigatório no payload (422 VALIDACAO com o campo). */
function pv2_id(array $payload, string $campo = 'id'): int
{
    $v = $payload[$campo] ?? null;
    if (is_int($v) && $v > 0) { return $v; }
    if (is_string($v) && ctype_digit($v) && (int)$v > 0) { return (int)$v; }
    throw new PonteErro('VALIDACAO', 422, ['campos' => [$campo => 'inteiro positivo']]);
}

function pv2h_alertas_reconhecer(PDO $pdo, int $userId, array $payload): array
{
    $id = pv2_id($payload);
    return ['data' => alerta_reconhecer($pdo, $userId, $id), 'recurso' => ['alerta', $id], 'depois' => ['status' => 'acknowledged']];
}
function pv2h_alertas_resolver(PDO $pdo, int $userId, array $payload): array
{
    $id = pv2_id($payload);
    $data = alerta_resolver($pdo, $id) + ['message' => ALERTA_MSG_RESOLVIDO];
    return ['data' => $data, 'recurso' => ['alerta', $id], 'depois' => ['status' => 'resolved']];
}
function pv2h_alertas_silenciar(PDO $pdo, int $userId, array $payload): array
{
    $data = alerta_silenciar($pdo, $userId, $payload);
    return ['data' => $data, 'recurso' => ['silencio', $data['id']], 'depois' => ['is_active' => 1]];
}
function pv2h_alertas_dessilenciar(PDO $pdo, int $userId, array $payload): array
{
    $id = pv2_id($payload);
    return ['data' => alerta_dessilenciar($pdo, $id), 'recurso' => ['silencio', $id], 'depois' => ['is_active' => 0]];
}
function pv2h_notificacoes_marcar_lida(PDO $pdo, int $userId, array $payload): array
{
    $id = pv2_id($payload);
    return ['data' => notificacao_marcar_lida($pdo, $userId, $id), 'recurso' => ['notificacao', $id], 'depois' => ['is_read' => 1]];
}
function pv2h_notificacoes_marcar_todas(PDO $pdo, int $userId, array $payload): array
{
    $d = notificacao_marcar_todas($pdo, $userId);
    return ['data' => $d, 'recurso' => ['notificacao', null], 'depois' => ['is_read' => 1, 'marked' => $d['marked']]];
}
function pv2h_notificacoes_excluir(PDO $pdo, int $userId, array $payload): array
{
    $id = pv2_id($payload);
    return ['data' => notificacao_excluir($pdo, $userId, $id), 'recurso' => ['notificacao', $id], 'depois' => ['deleted' => 1]];
}
function pv2h_metas_definir(PDO $pdo, int $userId, array $payload): array
{
    $d = meta_definir($pdo, $userId, $payload, 'app');
    return ['data' => $d, 'recurso' => ['meta', $d['id']], 'antes' => ['valor_cents' => $d['valor_anterior_cents']], 'depois' => ['valor_cents' => $d['valor_cents'], 'versao' => $d['versao']]];
}
function pv2h_metas_remover(PDO $pdo, int $userId, array $payload): array
{
    $d = meta_remover($pdo, $userId, $payload, 'app');
    return ['data' => $d, 'recurso' => ['meta', $d['id']], 'antes' => ['valor_cents' => $d['valor_anterior_cents']], 'depois' => ['removed' => 1]];
}
