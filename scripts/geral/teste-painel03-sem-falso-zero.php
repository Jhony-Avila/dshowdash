<?php
declare(strict_types=1);
// teste-painel03-sem-falso-zero.php — MIG-001 INTEGRACAO (VINHO, 26/11 noite): o Painel 03 nunca responde 200 com zeros quando a fonte dá timeout.
$f = (string) file_get_contents(dirname(__DIR__, 2) . '/api/modules/panels/panel-03/api.php');
$ok = 0; $falhas = []; $ck = function (string $n, bool $c) use (&$ok, &$falhas) { $c ? $ok++ : $falhas[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . "$n\n"; };
$catch = substr($f, (int) strpos($f, '} catch (Exception $e)'));
$ck('no erro, nenhum buildSuccess (nada de 200 com dado inventado)', !str_contains($catch, 'buildSuccess'));
$ck('nenhum "_fallback" nem zeros fixos de total/sucesso/erro/taxa', !str_contains($f, '_fallback') && !preg_match("/'total_executions'\\s*=>\\s*0\\b/", $f));
$ck('timeout → 503 com fonte integracao, estado indisponivel e motivo tempo_esgotado; nada em cache no erro', str_contains($catch, '503') && str_contains($catch, "'estado' => 'indisponivel'")
    && str_contains($catch, "'motivo' => 'tempo_esgotado'") && !str_contains($catch, 'cacheAndReturn'));
echo "teste-painel03-sem-falso-zero: $ok ok, ", count($falhas), " falha(s)\n"; exit($falhas === [] ? 0 : 1);
