<?php
declare(strict_types=1);
// scripts/panel-05/teste-sessao-liberada.php — P0 28/11 (panel-05: 12 ações em fila na trava da sessão PHP), VINHO.
// Confere no api.php: (1) session_write_close() existe e vem DEPOIS de SessionGate::validate() e ANTES de qualquer consulta/cache
// (getConnection, erp_ponto_pdo, RedisHelper, ->query/->prepare); (2) nenhuma escrita em $_SESSION, session_regenerate_id ou novo
// session_start/SessionGate::start depois do fechamento; (3) o panel-05 não chama generateCsrfToken (que grava na sessão).
// A prova de comportamento (mesma sessão, ações em paralelo, por HTTP real) é da homologação.
$arq = $argv[1] ?? dirname(__DIR__, 2) . '/api/modules/panels/panel-05/api.php';
$src = (string) file_get_contents($arq);
$sem = preg_replace('~/\*.*?\*/~s', '', $src); $sem = preg_replace('~(?<![:"\'])//[^\n]*~', '', $sem); $sem = preg_replace('~#[^\n]*~', '', $sem);
$pos = static fn(string $re) => preg_match($re, $sem, $m, PREG_OFFSET_CAPTURE) ? $m[0][1] : null;
$ok = 0; $f = 0; $t = function (string $n, bool $v) use (&$ok, &$f): void { if ($v) $ok++; else { $f++; echo "FALHOU: $n\n"; } };
$val = $pos('/SessionGate::validate\(\)/'); $wc = $pos('/session_write_close\(\)/');
$t('session_write_close() presente', $wc !== null);
$t('fecha DEPOIS de SessionGate::validate() (a renovação last_activity já foi gravada)', $val !== null && $wc !== null && $wc > $val);
foreach (['getConnection\(', 'erp_ponto_pdo\(', 'erp_novo_pdo\(', 'RedisHelper::', '->query\(', '->prepare\(', 'p05_escopo\(', 'erp_novo_autorizado\('] as $re) {
    $p = $pos('/' . $re . '/'); $t("fecha ANTES de $re (consulta/cache/decisão)", $p === null || ($wc !== null && $wc < $p));
}
$depois = $wc !== null ? substr($sem, $wc + 1) : $sem;
$t('nenhuma escrita em $_SESSION depois do fechamento', preg_match('/\$_SESSION\s*\[[^\]]*\]\s*(=|\.=|\+=)(?!=)/', $depois) === 0 && preg_match('/unset\s*\(\s*\$_SESSION/', $depois) === 0);
$t('sem session_regenerate_id / session_start / SessionGate::start depois do fechamento', preg_match('/session_regenerate_id|session_start\s*\(|SessionGate::start/', $depois) === 0);
$t('o panel-05 não chama generateCsrfToken (que grava na sessão)', preg_match('/generateCsrfToken\s*\(/', $sem) === 0);
echo basename($arq) . ": $ok ok, $f falha(s)\n"; exit($f === 0 ? 0 : 1);
