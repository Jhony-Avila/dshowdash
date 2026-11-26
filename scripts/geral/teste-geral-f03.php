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
$res = fn(string $k, int $u): array => $k === 'financeiro_asaas_leitura' && isset($flags[$u]) ? ['enabled' => $flags[$u]] : ['enabled' => false];
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
echo "teste-geral-f03: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
