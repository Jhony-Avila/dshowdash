<?php
// Teste PURO do Precifica Analytics no Dash (sem banco): php scripts/precifica-analytics-teste.php → "N/0".
declare(strict_types=1);
require __DIR__ . '/../api/pipedrive/lib/PrecificaAnalytics.php';
$ok = 0; $falha = 0;
$c = static function (string $n, $a, $e) use (&$ok, &$falha) { if ($a === $e) $ok++; else { $falha++; echo "FALHA $n: " . var_export($a, true) . " ≠ " . var_export($e, true) . "\n"; } };
$d = static fn (string $dia, string $v, int $g, ?int $val, int $p) => ['dia' => $dia, 'vendedor' => $v, 'criados' => 1, 'ganhos' => $g, 'ganhos_com_valor' => $g, 'valor_ganho_cents' => $val,
    'ganhos_valor_desconhecido' => $val === null ? 1 : 0, 'ganhos_sem_valor_financeiro' => 0, 'ganhos_garantia' => 0, 'perdidos' => $p, 'ciclo_dias_soma' => 10 * $g, 'ciclo_n' => $g];
$agora = 1_764_100_000;
$r = PrecificaAnalytics::montar(['estado' => 'ok', 'motivos' => '', 'g' => $agora - 60, 'cs' => $agora - 60],
    [$d('2026-11-10', '7', 2, 10000, 1), $d('2026-11-11', '7', 1, null, 0), $d('2026-11-11', '9', 1, 5000, 1)], [['motivo' => 'PRICE', 'n' => 2]],
    [['vendedor' => '7', 'abertos' => 3, 'valor_cents' => 9000, 'abertos_sem_valor_financeiro' => 0, 'idade_dias_soma' => 30]], ['7' => 'Ana', '9' => 'Bia'], $agora);
$c('estado ok', $r['estado'], 'ok');
$c('valor total com um dia desconhecido = null', $r['totais']['valor_ganho_cents'], null);
$c('ticket sem valor conhecido = null', $r['totais']['ticket_cents'], null);
$c('conversão 4/(4+2)', $r['totais']['conversao'], 0.6667);
$c('valor do vendedor 9 conhecido', $r['por_vendedor'][1]['valor_ganho_cents'], 5000);
$c('ciclo médio', $r['totais']['ciclo_medio_dias'], 10.0);
$c('rótulo do motivo', $r['motivos_perda'][0]['rotulo'], 'Preço');
$c('em aberto', [$r['em_aberto']['abertos'], $r['em_aberto']['valor_cents'], $r['em_aberto']['idade_media_dias']], [3, 9000, 10.0]);
$r2 = PrecificaAnalytics::montar(['estado' => 'parcial', 'motivos' => 'valor_em_carga', 'g' => $agora - 60, 'cs' => $agora - 9000], [], [], [], [], $agora);
$c('desatualizado com motivo', [$r2['estado'], $r2['motivos']], ['desatualizado', ['valor_em_carga', 'cache_atrasado']]);
$c('vazio sem base', [$r2['totais']['conversao'], $r2['totais']['valor_ganho_cents'], $r2['em_aberto']['idade_media_dias']], [null, 0, null]);
$g = new DateTimeImmutable('2026-11-26 02:00:00', new DateTimeZone('UTC'));   // 25/11 23:00 em Brasília
$c('período padrão em Brasília', PrecificaAnalytics::periodo(null, null, $g), ['2026-08-28', '2026-11-25']);
$c('período inválido', PrecificaAnalytics::periodo('2026-11-31', null, $g), null);
echo "$ok/$falha\n"; exit($falha ? 1 : 0);
