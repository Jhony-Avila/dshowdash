<?php
// teste-int-ux-classificacao.php — INT-UX-001 (VINHO, 27/11): precedência e categorias da classificação do servidor (sem banco).
$src = file_get_contents(dirname(__DIR__, 2) . '/api/geral/GeralV2Integracoes.php');
preg_match('/    public const PRECEDENCIA.*?\n    public static function resumo.*?\n    }\n/s', $src, $m);
eval('final class K {' . $m[0] . '}');
$b = ['contas' => [], 'cobertas' => null, 'esperadas' => null, 'ultimo_sucesso' => '2026-11-27T06:00:00-03:00'];
$t = fn($r) => K::classificar($r + $b);
$ok = 0; $f = 0; $ck = function ($n, $c) use (&$ok, &$f) { $c ? $ok++ : $f++; echo ($c ? 'ok    ' : 'FALHA ') . "$n\n"; };
$ck('ok com sucesso e cobertura completa → em_dia', $t(['estado' => 'ok'])['estado_principal'] === 'em_dia');
$ck('ok SEM último sucesso → desconhecida (AC03)', $t(['estado' => 'ok', 'ultimo_sucesso' => null])['estado_principal'] === 'desconhecida');
$x = $t(['estado' => 'ok', 'cobertas' => 1, 'esperadas' => 3]); $ck('ok com 1/3 da cobertura → parcial (em_dia sai)', $x['estado_principal'] === 'parcial' && $x['estados_detalhe'] === []);
$x = $t(['estado' => 'atrasado', 'contas' => [['estado' => 'com_problema', 'erro_codigo' => 'chave_recusada'], ['estado' => 'atrasado', 'erro_codigo' => null]]]);
$ck('chave recusada + atrasada → principal credencial_expirada, detalhe atrasada', $x['estado_principal'] === 'credencial_expirada' && $x['estados_detalhe'] === ['atrasada'] && $x['categoria'] === 'com_falha');
$x = $t(['estado' => 'com_problema', 'cobertas' => 2, 'esperadas' => 3]); $ck('falha + parcial → com_falha, detalhe parcial', $x['estado_principal'] === 'com_falha' && $x['estados_detalhe'] === ['parcial']);
$ck('aguardando → aguardando_conexao/nao_conectada (cobertura 0/0 não vira parcial)', ($y = $t(['estado' => 'aguardando', 'cobertas' => 0, 'esperadas' => 2]))['estado_principal'] === 'aguardando_conexao' && $y['categoria'] === 'nao_conectada');
$ck('sem_acesso → desconhecida', $t(['estado' => 'sem_acesso'])['estado_principal'] === 'desconhecida');
$ck('estado novo/inesperado → desconhecida (nunca em_dia)', $t(['estado' => 'qualquer'])['estado_principal'] === 'desconhecida');
$r = K::resumo([['categoria' => 'em_dia'], ['categoria' => 'com_falha'], ['categoria' => 'atencao'], ['categoria' => 'atencao'], ['categoria' => 'nao_conectada']]);
$ck('resumo: exclusivas, soma = total, pedem_atencao = 3', $r['total'] === 5 && $r['pedem_atencao'] === 3 && $r['em_dia'] + $r['com_falha'] + $r['atencao'] + $r['nao_conectada'] === 5);
echo "classificacao: $ok ok, $f falha(s)\n";
exit($f === 0 ? 0 : 1);
