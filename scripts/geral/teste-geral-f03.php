<?php
declare(strict_types=1);
// teste-geral-f03.php — F03 (P0, 26/11, VINHO): o "Recebido" da Geral V2 só com a flag POR PESSOA financeiro_asaas_leitura; sem ela, nega ANTES de consultar.
// Dados sintéticos; nenhum banco: a conexão financeira é um espião que FALHA em qualquer consulta e conta as tentativas.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/geral/GeralV2.php";
require_once "$RAIZ/api/geral/GeralV2Contrato.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
final class Espiao extends PDO {
    public int $n = 0;
    public function __construct() {}
    public function query(string $q, ?int $m = null, mixed ...$a): PDOStatement|false { $this->n++; throw new PDOException('consulta financeira proibida'); }
    public function prepare(string $q, array $o = []): PDOStatement|false { $this->n++; throw new PDOException('consulta financeira proibida'); }
    public function exec(string $q): int|false { $this->n++; throw new PDOException('consulta financeira proibida'); }
}
$AGORA = new DateTimeImmutable('2026-11-26 19:30:00', new DateTimeZone('America/Sao_Paulo'));
// flags por pessoa: 50 e 80 SEM a permissão; 75 (Jhony) COM
$flags = [50 => false, 80 => false, 75 => true];
$res = fn(string $k, int $u): array => $k === 'financeiro_asaas_leitura' && isset($flags[$u]) ? ['enabled' => $flags[$u], 'source' => 'user_override'] : ['enabled' => false, 'source' => 'not_found'];
foreach ([50, 80] as $u) {
    $pode = GeralV2::podeFinanceiro($u, $res); $esp = new Espiao();
    $c = new GeralV2Contrato(new GeralV2(null, null, null, $u, $AGORA, null, '', $pode ? $esp : null, 'APP_DSHOW', $pode));
    $r = $c->resumo('7d'); $p = $c->painel('7d');
    $rec = $r['indicadores']['recebido'] ?? $r['recebido'] ?? null;
    $semFonte = !in_array('precifica', array_column($p['fontes'] ?? [], 'fonte'), true);
    $ck("nível $u sem a permissão: recebido = sem_permissao, valor/quantidade/anterior/série nulos", $pode === false && is_array($rec) && $rec['estado'] === 'sem_permissao'
        && $rec['valor'] === null && $rec['quantidade'] === null && $rec['anterior'] === null && $rec['serie'] === null, json_encode($rec));
    $ck("nível $u sem a permissão: ZERO consultas financeiras (nem do período anterior) e a fonte financeira não aparece", $esp->n === 0 && $semFonte);
    // mesmo que alguém passe a conexão por engano, o portão interno nega antes de tocar nela
    $esp2 = new Espiao(); $r2 = (new GeralV2(null, null, null, $u, $AGORA, null, '', $esp2, 'APP_DSHOW', false))->comparativo('7d');
    $ck("nível $u: com a conexão passada por engano e sem a permissão, o comparativo não consulta", $esp2->n === 0 && $r2['recebido']['anterior'] === null && $r2['recebido']['serie'] === null);
}
$esp = new Espiao(); $g = new GeralV2(null, null, null, 75, $AGORA, null, '', $esp, 'APP_DSHOW', GeralV2::podeFinanceiro(75, $res));
$x = $g->recebido('7d');
$ck('com a permissão (75): a consulta acontece como hoje (o espião é tocado e a falha vira "leitura_falhou", nunca zero)', $esp->n > 0 && $x['estado'] !== 'sem_permissao' && $x['valor'] === null);
$ck('flag ilegível (o resolvedor falha) → NEGA', GeralV2::podeFinanceiro(75, fn() => throw new RuntimeException('banco fora')) === false);
$ck('flag ausente → NEGA; padrão do construtor = negar', GeralV2::podeFinanceiro(99, $res) === false && (new GeralV2(null, null, null, 75, $AGORA, null, '', new Espiao()))->recebido('7d')['estado'] === 'sem_permissao');
// ── Requisito novo (ChatGPT, 26/11 noite): FAIL-CLOSED e INDEPENDENTE do UARPS
$ck('liberação GLOBAL/rollout (alguém subiu o %) NÃO é permissão por pessoa → nega', GeralV2::podeFinanceiro(50, fn() => ['enabled' => true, 'source' => 'global']) === false
    && GeralV2::podeFinanceiro(80, fn() => ['enabled' => true, 'source' => 'rollout']) === false);
$ck('override desligado, "enabled" não booleano, resposta não-array, usuário 0 → nega', GeralV2::podeFinanceiro(80, fn() => ['enabled' => false, 'source' => 'user_override']) === false
    && GeralV2::podeFinanceiro(80, fn() => ['enabled' => 1, 'source' => 'user_override']) === false && GeralV2::podeFinanceiro(80, fn() => null) === false && GeralV2::podeFinanceiro(0, fn() => ['enabled' => true, 'source' => 'user_override']) === false);
$semUarps = true;
foreach (["$RAIZ/api/geral/GeralV2.php", "$RAIZ/api/geral/GeralV2Contrato.php"] as $arq) foreach (token_get_all((string) file_get_contents($arq)) as $t)
    if (is_array($t) && $t[0] === T_STRING && stripos($t[1], 'UARPS') !== false) $semUarps = false;
$ck('a trava financeira não consulta o UARPS (nenhuma referência em código a UARPSGate/enforce/sombra no GeralV2 e no contrato)', $semUarps);
// UARPS em SOMBRA: o portão deixa todo mundo passar (sombraTrigger nunca bloqueia) → os níveis 50 e 80 chegam ao contrato; a trava própria nega.
$uarpsSombra = fn(int $nivel): bool => true;
foreach ([50, 80] as $u) {
    $esp = new Espiao();
    $passou = $uarpsSombra($u);
    $rec = (new GeralV2Contrato(new GeralV2(null, null, null, $u, $AGORA, null, '', $esp, 'APP_DSHOW', GeralV2::podeFinanceiro($u, $res))))->resumo('7d');
    $rec = $rec['indicadores']['recebido'] ?? $rec['recebido'];
    $ck("UARPS em sombra (deixou passar) · nível $u sem a permissão: continua NEGADO e sem consulta", $passou && $rec['estado'] === 'sem_permissao' && $esp->n === 0);
}
// O resolvedor REAL de flags, num MySQL LOCAL temporário (o mesmo código do Dash): global a 100% ≠ permissão; só o override por pessoa libera
require_once "$RAIZ/api/feature-flags/resolver.php";
try { $root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); } catch (Throwable) { $root = null; }
if ($root !== null && !$root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'zz_f03_flags'")->fetchColumn()) {
    register_shutdown_function(fn() => $root->exec('DROP DATABASE IF EXISTS zz_f03_flags'));
    $root->exec("CREATE DATABASE zz_f03_flags; USE zz_f03_flags;
      CREATE TABLE app_feature_flags (flag_key VARCHAR(64), flag_name VARCHAR(64), description TEXT, is_enabled TINYINT, rollout_percentage INT, payload_json TEXT, environment VARCHAR(20), starts_at DATETIME, ends_at DATETIME, deleted_at DATETIME);
      CREATE TABLE app_user_feature_flags (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, flag_key VARCHAR(64), is_enabled TINYINT, payload_json TEXT, reason TEXT, expires_at DATETIME, deleted_at DATETIME);
      INSERT INTO app_feature_flags VALUES ('financeiro_asaas_leitura','x','',1,0,NULL,'all',NULL,NULL,NULL);
      INSERT INTO app_user_feature_flags (user_id, flag_key, is_enabled) VALUES (75,'financeiro_asaas_leitura',1),(80,'financeiro_asaas_leitura',0);");
    $fp = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=zz_f03_flags;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $real = fn(string $k, int $u): array => (new FeatureFlagResolver($fp))->resolve($k, $u);
    $ck('resolvedor real · canário oficial (global 0% + override): 75 libera; 50 (sem override) e 80 (override desligado) negam', GeralV2::podeFinanceiro(75, $real) && !GeralV2::podeFinanceiro(50, $real) && !GeralV2::podeFinanceiro(80, $real));
    $fp->exec("UPDATE app_feature_flags SET rollout_percentage = 100");
    $ck('resolvedor real · alguém sobe o global para 100%: 50 continua NEGADO (o resolvedor diria enabled/global) e 75 segue liberado', !GeralV2::podeFinanceiro(50, $real) && ($real('financeiro_asaas_leitura', 50)['enabled'] ?? null) === true && GeralV2::podeFinanceiro(75, $real));
    $fp->exec("UPDATE app_feature_flags SET is_enabled = 0");
    $ck('resolvedor real · kill switch global desligado: até o 75 é negado', !GeralV2::podeFinanceiro(75, $real));
    $fp->exec("DROP TABLE app_feature_flags");
    $ck('resolvedor real · tabela de flags fora (erro de banco): nega', !GeralV2::podeFinanceiro(75, $real));
} else { $ck('MySQL local para o resolvedor real', false, 'indisponível ou zz_f03_flags já existe'); }
echo "teste-geral-f03: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
