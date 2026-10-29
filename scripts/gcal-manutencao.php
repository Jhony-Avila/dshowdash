<?php
// Google Calendar — manutenção dos jobs `dead` (Q-V9.6 do APP DSHOW, 2026-10-29)
// @module google-calendar.manutencao.cli
// @version 1.0.0
// @created 2026-10-29
//
//   php scripts/gcal-manutencao.php                     lista os jobs `dead` (motivo, permanente?, idade)
//   php scripts/gcal-manutencao.php --mortos            trata os notFound (o que o cron já faz a cada rodada)
//   php scripts/gcal-manutencao.php --requeue=all       reenfileira TODOS os `dead` não permanentes (attempts = 0)
//   php scripts/gcal-manutencao.php --requeue=123       reenfileira um job
//   --dry-run em qualquer modo: só mostra, não grava
//
// Nada é apagado. Permanentes (notFound, forbidden, insufficientPermissions, invalid_grant,
// requiredAccessLevel) nunca são reenfileirados. Saída sempre em arquivo quando vier do cron.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);
require_once $raiz . '/api/_helpers/ApiResponse.php';
require_once $raiz . '/config/db_connection.php';
require_once $raiz . '/api/google-calendar/repositories/GcalRepository.php';
require_once $raiz . '/api/google-calendar/services/GcalManutencaoService.php';

$opts  = getopt('', ['mortos', 'requeue::', 'dry-run']);
$seco  = isset($opts['dry-run']);
$diz   = static fn(string $m) => print('[' . gmdate('Y-m-d H:i:s') . ' UTC] ' . $m . "\n");

$repo  = new GcalRepository();
$manut = new GcalManutencaoService($repo);

if (isset($opts['requeue'])) {
    $alvo = (string)$opts['requeue'];
    $id   = ($alvo === '' || $alvo === 'all') ? null : (ctype_digit($alvo) ? (int)$alvo : null);
    if ($alvo !== '' && $alvo !== 'all' && $id === null) { fwrite(STDERR, "--requeue aceita 'all' ou um id numérico\n"); exit(2); }
    $r = $manut->reenfileirar($id, $seco);
    foreach ($r['detalhe'] as $d) {
        $diz(sprintf('job %d · %s · %s · motivo=%s → %s', $d['id'], $d['kind'], $d['calendar_id'] ?? '(conta)', $d['motivo'] ?: '?', $d['acao']));
    }
    $diz(sprintf('%sreenfileirados %d · recusados (permanentes) %d', $seco ? 'dry-run: ' : '', $r['reenfileirados'], $r['recusados']));
    exit(0);
}

if (isset($opts['mortos'])) {
    $r = $manut->tratarMortos($seco);
    foreach ($r['detalhe'] as $d) { $diz(sprintf('job %d · %s · %s → cancelled (calendário apagado no Google)', $d['id'], $d['kind'], $d['calendar_id'])); }
    $diz(sprintf('%scancelados %d · calendários marcados como apagados %d · dead restantes %d',
        $seco ? 'dry-run: ' : '', $r['cancelados'], $r['calendarios_marcados'], $r['restantes']));
    if ($r['erro'] !== null) { fwrite(STDERR, '[gcal-manutencao] ' . $r['erro'] . "\n"); exit(1); }
    exit(0);
}

// Padrão: só lista.
$mortos = $manut->listarMortos();
if (!$mortos) { $diz('nenhum job dead'); exit(0); }
foreach ($mortos as $j) {
    $diz(sprintf('job %d · %s · %s · attempts=%d · morto em %s · motivo=%s%s · %s',
        (int)$j['id'], (string)$j['kind'], $j['calendar_id'] ?? '(conta)', (int)$j['attempts'],
        (string)($j['finished_at'] ?? '?'), $j['motivo'] !== '' ? $j['motivo'] : '?',
        $j['permanente'] ? ' (permanente)' : ' (reenfileirável)', mb_substr((string)($j['last_error'] ?? ''), 0, 120)));
}
$perm = count(array_filter($mortos, static fn($j) => $j['permanente']));
$diz(sprintf('%d dead: %d permanente(s), %d reenfileirável(is). notFound é tratado pelo cron; --requeue para os demais.', count($mortos), $perm, count($mortos) - $perm));
exit(0);
