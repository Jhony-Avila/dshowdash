<?php
// ERP novo — CHAVEAMENTO e TRAVAS do painel 01 (v2: AZUL, 26/11 noite, rebase do patch 0002; um componente por degrau).
// Sem flag/credencial (o estado de entrega) o painel 01 fica EXATAMENTE como antes (DSHOW_PROD + camada antiga, cache 'panel:01:').
// Travas da origem nova: autorização POR PESSOA fail-closed; cache separado; falha = 503 "indisponível"; anexo sem chave do S3.
// Processos separados (constantes ERP_V_* são definidas uma vez por processo). Sem banco real. Uso: php chaveamento.php
declare(strict_types=1);
$falhas = [];
$filho = static function (string $codigo): string {
    $arq = tempnam(sys_get_temp_dir(), 'erpn'); file_put_contents($arq, "<?php\n" . $codigo);
    $out = (string)shell_exec(escapeshellarg(PHP_BINARY) . ' -d error_log=/dev/null ' . escapeshellarg($arq) . ' 2>&1'); unlink($arq); return trim($out);
};
$raiz = realpath(__DIR__ . '/../../..');
$stub = "function getConnection(string \$n) { if (\$n === 'DSHOWDASH') { throw new RuntimeException('sem banco'); } \$GLOBALS['conexao'] = \$n; return new PdoFalso(); }\nclass PdoFalso extends PDO { public function __construct() {} }\n";
putenv('DB_ERP_NOVO_CNF'); putenv('DB_ERP_NOVO_HOST'); putenv('DB_ERP_NOVO_NAME');
// 1. sem flag/credencial: legado
$r = $filho($stub . "require '$raiz/api/modules/panels/_erp-ponto.php'; \$o = erp_ponto_origem('painel01'); erp_ponto_pdo('painel01'); echo \$o, '|', \$GLOBALS['conexao'], '|', str_contains(ERP_V_REQUISICAO, 'fin_requisicao_pagamento') ? 'antiga' : 'nova';");
if ($r !== 'legado|DSHOW_PROD|antiga') { $falhas[] = "painel01 sem flag deveria ser legado + DSHOW_PROD + camada antiga (veio: $r)"; }
// 2. pontos desconhecidos/desligados
$r = $filho($stub . "require '$raiz/api/_helpers/ErpNovo.php'; echo json_encode([erp_novo_ligado('painel01'), erp_novo_ligado('qualquer'), erp_novo_configurado()]);");
if ($r !== '[false,false,false]') { $falhas[] = "sem flag/credencial tudo desligado (veio: $r)"; }
// 3. credencial ilegível não conecta
$r = $filho($stub . "putenv('DB_ERP_NOVO_CNF=/nao/existe'); putenv('DB_ERP_NOVO_HOST=127.0.0.1'); putenv('DB_ERP_NOVO_NAME=ds_prod'); require '$raiz/api/_helpers/ErpNovo.php'; try { erp_novo_pdo(); echo 'conectou'; } catch (RuntimeException \$e) { echo \$e->getMessage(); }");
if ($r !== 'ERP novo não configurado') { $falhas[] = "credencial ilegível = 'não configurado', sem tentar conectar (veio: $r)"; }
// 4. autorização POR PESSOA, fail-closed (o nível não entra; flag ausente/erro/usuário 0/valor não-booleano = nega)
$r = $filho($stub . "require '$raiz/api/_helpers/ErpNovo.php';
\$sim = fn (\$k, \$u) => ['enabled' => \$k === 'financeiro_asaas_leitura' && \$u === 75, 'source' => \$u === 75 ? 'user_override' : 'default'];
\$global = fn (\$k, \$u) => ['enabled' => true, 'source' => 'global'];
\$rollout = fn (\$k, \$u) => ['enabled' => true, 'source' => 'rollout'];
\$erro = function (\$k, \$u) { throw new RuntimeException('flag ilegível'); };
\$texto = fn (\$k, \$u) => ['enabled' => 'true'];
echo json_encode([erp_novo_autorizado(75, \$sim), erp_novo_autorizado(76, \$sim), erp_novo_autorizado(0, \$sim), erp_novo_autorizado(75, \$erro), erp_novo_autorizado(75, \$texto), erp_novo_autorizado(75), erp_novo_autorizado(50, \$global), erp_novo_autorizado(80, \$rollout)]);");
if ($r !== '[true,false,false,false,false,false,false,false]') { $falhas[] = "autorização: [override, sem flag, usuário 0, ilegível, 'true' em texto, resolvedor sem banco, GLOBAL, ROLLOUT] deveria ser [true,false×7] (veio: $r)"; }
// 5. ordem no painel 01: login → origem → autorização → cache (prefixo por origem) → conexão; falha da origem nova = 503 indisponível
$p = (string)file_get_contents("$raiz/api/modules/panels/panel-01/api.php");
$pos = static fn (string $s): int => ($i = strpos($p, $s)) === false ? PHP_INT_MAX : $i;
$ordem = [$pos('AuthHelpers::requireAuth();'), $pos("\$ERP_ORIGEM = erp_ponto_origem('painel01');"), $pos('erp_novo_autorizado(AuthHelpers::getCurrentUserId())'), $pos('RedisHelper::serveIfCached'), $pos("\$pdo = erp_ponto_pdo('painel01');")];
$ord = $ordem; sort($ord);
if ($ordem !== $ord || in_array(PHP_INT_MAX, $ordem, true)) { $falhas[] = 'painel 01 fora da ordem login → origem → autorização → cache → conexão'; }
$semDef = preg_replace('/\$CACHE_PREFIX = .*;/', '', $p);
if (preg_match("/['\"]panel:01:/", (string)$semDef)) { $falhas[] = "chave de cache 'panel:01:' fixa sobrou (precisa do prefixo por origem)"; }
if (substr_count($p, "'estado' => 'indisponivel'") < 2) { $falhas[] = 'origem nova sem 503 indisponível na conexão e na consulta'; }
// 5b. painel 05 (Cliente 360, financeiro: contas a receber): a MESMA ordem e as mesmas travas do painel 01
$p5 = (string)file_get_contents("$raiz/api/modules/panels/panel-05/api.php");
$pos5 = static fn (string $s): int => ($i = strpos($p5, $s)) === false ? PHP_INT_MAX : $i;
$ordem5 = [$pos5('SessionGate::validate()'), $pos5("\$ERP_ORIGEM = erp_ponto_origem('painel05');"), $pos5('erp_novo_autorizado(AuthHelpers::getCurrentUserId())'), $pos5('RedisHelper::serveIfCached'), $pos5("\$pdo = erp_ponto_pdo('painel05');")];
$o5 = $ordem5; sort($o5);
if ($ordem5 !== $o5 || in_array(PHP_INT_MAX, $ordem5, true)) { $falhas[] = 'painel 05 fora da ordem login → origem → autorização → cache → conexão'; }
if (preg_match("/['\"]panel:05:/", (string)preg_replace('/\$CACHE_PREFIX = .*;|\?\? \'panel:05:\'/', '', $p5))) { $falhas[] = "painel 05: chave de cache 'panel:05:' fixa sobrou"; }
if (substr_count($p5, "'estado' => 'indisponivel'") < 2) { $falhas[] = 'painel 05 sem 503 indisponível na conexão e na consulta'; }
if (str_contains($p5, "\$cacheableActions = ['default',")) { $falhas[] = "painel 05: a ação 'default' (lista com filtros) não pode ter cache só por ação (CP-002)"; }
// 5c. painel 16 (Fornecedor 360): mesma ordem e travas; CP-003: sem dados bancários/PIX em lugar nenhum do painel
$p16 = (string)file_get_contents("$raiz/api/modules/panels/panel-16/api.php");
$pos16 = static fn (string $s): int => ($i = strpos($p16, $s)) === false ? PHP_INT_MAX : $i;
$ordem16 = [$pos16('AuthHelpers::requireAuth();'), $pos16("\$ERP_ORIGEM = erp_ponto_origem('painel16');"), $pos16('erp_novo_autorizado(AuthHelpers::getCurrentUserId())'), $pos16('RedisHelper::serveIfCached'), $pos16("\$pdo = erp_ponto_pdo('painel16');")];
$o16 = $ordem16; sort($o16);
if ($ordem16 !== $o16 || in_array(PHP_INT_MAX, $ordem16, true)) { $falhas[] = 'painel 16 fora da ordem login → origem → autorização → cache → conexão'; }
if (preg_match("/['\"]panel:16:(kpis|list)/", $p16)) { $falhas[] = "painel 16: chave de cache antiga 'panel:16:kpis|list' (o formato mudou: CP-003)"; }
if (substr_count($p16, "'estado' => 'indisponivel'") < 2) { $falhas[] = 'painel 16 sem 503 indisponível na conexão e na consulta'; }
if (preg_match('/CONTA_BANCARIA|Nome_Titular|\bAgencia\b|\bPix\b/', (string)preg_replace('#//[^\n]*#', '', $p16))) { $falhas[] = 'painel 16 ainda lê conta bancária/PIX (CP-003: oculto até bank_account_id)'; }
// 6. anexo: a chave do S3 não sai como url na camada nova
$c = (string)file_get_contents("$raiz/api/modules/panels/_erp-compat-novo.php");
if (str_contains($c, 's3_key AS Url')) { $falhas[] = 'camada nova ainda expõe s3_key como Url'; }
if ($falhas) { echo "[ERRO] chaveamento:\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "[OK]   chaveamento: painéis 01, 05 e 16 (ordem, cache por origem, 503; 05 sem cache da página inicial; 16 sem banco/PIX); painel 01 legado sem flag; autorização por pessoa fail-closed (8 casos: só user_override libera; global/rollout negam); ordem login→origem→autorização→cache→conexão; cache por origem; 503 indisponível; anexo sem chave do S3\n";
