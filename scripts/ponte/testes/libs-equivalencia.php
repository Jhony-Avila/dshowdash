<?php
declare(strict_types=1);
/**
 * W1 — prova de MOVIMENTO TEXTUAL das libs da Ponte v2: as SQL e mensagens de api/ponte/libs/{AlertaLib,NotificacaoLib}.php são
 * byte a byte as do commit que IMPORTOU api/datatables/controllers/AlertController.php e api/notifications/index.php (o estado de
 * produção), e os dois endpoints atuais não têm mais SQL própria (delegam). uso: php scripts/ponte/testes/libs-equivalencia.php
 */
$repo = dirname(__DIR__, 3);
$git = static function (string $args) use ($repo): string { return (string)shell_exec('git -C ' . escapeshellarg($repo) . ' ' . $args . ' 2>/dev/null'); };
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$orig = static function (string $path) use ($git): string {
    $c = trim($git('log --diff-filter=A --format=%H -1 -- ' . escapeshellarg($path)));
    return $c === '' ? '' : $git('show ' . escapeshellarg("$c:$path"));
};
$notifOrig = $orig('api/notifications/index.php'); $alertOrig = $orig('api/datatables/controllers/AlertController.php');
$ok($notifOrig !== '' && $alertOrig !== '', '[0] originais no commit de importação');
$notifNow = file_get_contents("$repo/api/notifications/index.php"); $alertNow = file_get_contents("$repo/api/datatables/controllers/AlertController.php");
$nlib = file_get_contents("$repo/api/ponte/libs/NotificacaoLib.php"); $alib = file_get_contents("$repo/api/ponte/libs/AlertaLib.php");

$sqlN = [
    '"UPDATE app_notifications SET is_read = 1, read_at = NOW(3) WHERE user_id = ? AND is_read = 0"',
    '"UPDATE app_notifications SET is_read = 1, read_at = NOW(3) WHERE id = ? AND user_id = ?"',
    '"DELETE FROM app_notifications WHERE id = ? AND user_id = ?"',
];
foreach ($sqlN as $i => $q) {
    $ok(substr_count($notifOrig, $q) === 1, "[N$i] SQL existia 1× no index.php original");
    $ok(substr_count($nlib, $q) === 1, "[N$i] SQL está 1× na NotificacaoLib, verbatim");
    $ok(substr_count($notifNow, $q) === 0, "[N$i] SQL NÃO está mais no index.php (delegou)");
}
foreach (['notificacao_marcar_todas($pdo, $userId)', 'notificacao_marcar_lida($pdo, $userId, (int)$notificationId)', 'notificacao_excluir($pdo, $userId, (int)$notificationId)'] as $call) {
    $ok(substr_count($notifNow, $call) === 1, "[N] index.php chama $call");
}
$ok(preg_match('/\$stmt = \$pdo->prepare\("(UPDATE|DELETE)/', $notifNow) === 0, '[N] nenhum prepare de escrita sobrou no index.php');
$ok(substr_count($notifNow, 'requireCsrf();') === substr_count($notifOrig, 'requireCsrf();') && substr_count($notifNow, 'session_write_close();') === substr_count($notifOrig, 'session_write_close();'), '[N] CSRF e session_write_close preservados em número');

$sqlA = [
    "'SELECT alert_type, target_type, target_id, status FROM DT_Alerta WHERE id = :id'",
    "'UPDATE DT_Alerta SET status = \"resolved\", resolved_at = NOW() WHERE id = :id'",
    "['message' => 'Alerta nao encontrado']",
    "['message' => 'Alerta ja resolvido']",
    "'Alerta resolvido manualmente. Se a condicao persistir, um novo incidente sera aberto no proximo ciclo.'",
];
foreach ($sqlA as $i => $q) {
    $ok(substr_count($alertOrig, $q) === 1, "[A$i] trecho existia 1× no AlertController original: $q");
    $ok(substr_count($alib, $q) === 1, "[A$i] trecho está 1× na AlertaLib, verbatim");
    $ok(substr_count($alertNow, $q) === 0, "[A$i] trecho NÃO está mais no AlertController");
}
// corpo de resolve(): mesmas linhas (ignorando indentação), com ApiResponse::error → throw new PonteErro e success → return
$corpo = static function (string $src, string $ini, string $fim): array {
    $a = strpos($src, $ini); $b = strpos($src, $fim, $a === false ? 0 : $a);
    if ($a === false || $b === false) { return []; }
    return array_values(array_filter(array_map('trim', explode("\n", substr($src, $a, $b - $a)))));
};
$lo = $corpo($alertOrig, "\$sel = \$pdo->prepare('SELECT alert_type", "ApiResponse::success(['id' => \$id, 'resolved' => true]");
$ll = $corpo($alib, "\$sel = \$pdo->prepare('SELECT alert_type", "return ['id' => \$id, 'resolved' => true];");
$lo2 = array_map(static fn($l) => str_replace('ApiResponse::error(', 'throw new PonteErro(', $l), $lo);
$ok(count($lo) >= 10 && $lo2 === $ll, '[A] corpo de resolve() idêntico linha a linha (só error→throw): ' . count($lo) . ' vs ' . count($ll));
$ok(substr_count($alertNow, 'alerta_resolver($pdo, $id)') === 1 && substr_count($alertNow, 'ALERTA_MSG_RESOLVIDO') === 1, '[A] controller delega a alerta_resolver e usa a mensagem única');
$ok(substr_count($alertNow, "(new DtAlertService(\$pdo))->acknowledge(\$id, \$by)") === 1 && substr_count($alib, "(new DtAlertService(\$pdo))->acknowledge(\$id, \$by)") === 1, '[A] acknowledge: controller e lib chamam o MESMO serviço');
$ok(substr_count($alertNow, "\$by = (string)(AuthHelpers::getCurrentUserId() ?: 'desconhecido');") === 1 && substr_count($alib, '$by = (string)$userId;') === 1, '[A] `by` = id do usuário como texto nos dois caminhos');

if ($falhas) { echo "FALHAS (" . count($falhas) . "):\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "libs-equivalencia: OK\n";
