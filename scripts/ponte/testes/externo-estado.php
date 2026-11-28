<?php
declare(strict_types=1);
/**
 * DDI-072 (GPT DATA 007-R08, AZUL 28/11) — escrita EXTERNA (agenda) com um provedor de teste COM ESTADO persistente entre tentativas (arquivo), e a
 * reserva de app_ponte_ops simulada linha a linha entre as tentativas. Estados: committed (efeito + resposta) · outcome_unknown (efeito aconteceu,
 * a resposta se perdeu) · no_effect (recusado antes do efeito). A recuperação NUNCA duplica o efeito. Sem rede, sem banco.
 */
require_once __DIR__ . '/../../../api/ponte/PonteV2Core.php';
require_once __DIR__ . '/_pdo-falso-v2.php';
putenv('GCAL_OAUTH_STAGE=write');
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$dir = sys_get_temp_dir() . '/pv2-ext-' . getmypid(); @mkdir("$dir/nonces", 0700, true);
$EST = "$dir/google.json"; file_put_contents($EST, json_encode(['efeitos' => [], 'modo' => 'committed']));
final class ProvedorEstado {   // "o Google": guarda os efeitos em arquivo, sobrevive entre tentativas
    public function __construct(private string $arq) {}
    public function excluirEvento(string $cal, string $ev, bool $notificar, string $escopo = 'this'): void {
        $s = json_decode((string) file_get_contents($this->arq), true);
        if ($s['modo'] === 'no_effect') { throw new InvalidArgumentException('recusado antes de qualquer efeito'); }
        $s['efeitos'][] = "$cal/$ev"; file_put_contents($this->arq, json_encode($s));
        if ($s['modo'] === 'outcome_unknown') { throw new Exception('timeout: o Google aplicou, a resposta se perdeu'); }   // vira 503 no agenda_traduzir
    }
}
$GLOBALS['PV2_AGENDA_PROVIDER'] = static fn (int $u) => new ProvedorEstado($EST);
$modo = static function (string $m) use ($EST): void { $s = json_decode((string) file_get_contents($EST), true); $s['modo'] = $m; file_put_contents($EST, json_encode($s)); };
$efeitos = static fn (string $ev): int => count(array_filter(json_decode((string) file_get_contents($EST), true)['efeitos'], static fn ($x) => $x === "cal/$ev"));
$segredo = str_repeat('e', 48); $agora0 = 1_800_000_000; $n = 0;
$srv = static function (string $corpo, int $agora) use ($segredo, &$n): array {
    $n++; $ts = (string) $agora; $nonce = sprintf('nonce-ext-%04d-0123456789', $n);
    return ['REMOTE_ADDR' => '127.0.0.1', 'REQUEST_METHOD' => 'POST', 'REQUEST_URI' => '/api/ponte/', 'HTTP_X_APP_TS' => $ts, 'HTTP_X_APP_NONCE' => $nonce,
        'HTTP_X_APP_SIG' => PonteAuth::assinar($segredo, $ts, $nonce, 'POST', '/api/ponte/', $corpo)];
};
// reserva de app_ponte_ops simulada: null = não existe; senão [status, resposta_json, criado]
$tentar = static function (string $ev, string $req, ?array &$linha, int $agora) use ($srv, $segredo, $dir): array {
    $payload = ['calendar_id' => 'cal', 'event_id' => $ev, 'escopo' => 'this'];
    $corpo = json_encode(['user_id' => 7, 'modulo' => 'agenda', 'acao' => 'excluir', 'payload' => $payload, 'request_id' => $req]);
    $hash = hash('sha256', "agenda\nexcluir\n" . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    $p = new PdoFalsoV2();
    $p->respostas = [
        '/^SELECT id, status, deleted_at FROM app_users WHERE id = \?/' => ['linhas' => [['id' => 7, 'status' => 'active', 'deleted_at' => null]]],
        '/^SELECT r\.id, r\.role_key, r\.role_name, r\.level FROM app_user_roles ur JOIN app_roles r/' => ['linhas' => []],
        '/^INSERT IGNORE INTO app_ponte_ops/' => ['afetadas' => $linha === null ? 1 : 0],
        '/^SELECT corpo_hash, status, resposta_json/' => ['linhas' => $linha === null ? [] : [['corpo_hash' => $hash, 'status' => $linha[0], 'resposta_json' => $linha[1], 'criado' => $linha[2]]]],
    ];
    $r = pv2_executar($p, $srv($corpo, $agora), $corpo, ['flagGeral' => true, 'flagsModulo' => ['ponte.agenda.escrita' => true], 'segredo' => $segredo, 'dirNonces' => "$dir/nonces", 'agora' => $agora, 'resolver' => "$dir/x.php"]);
    if ($linha === null) { $linha = [0, null, $agora]; }   // a reserva criada nesta tentativa
    foreach ($p->executadas as [$sql, $b]) {
        if (str_starts_with((string) $sql, 'DELETE FROM app_ponte_ops')) { $linha = null; }
        elseif (str_starts_with((string) $sql, 'UPDATE app_ponte_ops SET status')) { $linha = [$b[0], $b[1], $linha[2]]; }
    }
    return $r;
};
// committed
$modo('committed'); $l = null;
[$s1] = $tentar('ev-1', 'req-ext-committed-0001', $l, $agora0); [$s2, $e2] = $tentar('ev-1', 'req-ext-committed-0001', $l, $agora0 + 5);
$ok($s1 === 200 && $s2 === 200 && ($e2['meta']['replay'] ?? false) === true && $efeitos('ev-1') === 1, "[1] committed: efeito 1×; a repetição devolve o guardado (efeitos {$efeitos('ev-1')})");
// outcome_unknown
$modo('outcome_unknown'); $l = null;
[$s1, $e1] = $tentar('ev-2', 'req-ext-unknown-00001', $l, $agora0);
$modo('committed');   // mesmo que a próxima tentativa conseguisse falar com o Google, NÃO pode reexecutar
[$s2, $e2] = $tentar('ev-2', 'req-ext-unknown-00001', $l, $agora0 + 5);
[$s3, $e3] = $tentar('ev-2', 'req-ext-unknown-00001', $l, $agora0 + 600);
$ok($s1 === 503 && $l !== null && $l[0] === 0, '[2a] outcome_unknown: 503 e a reserva FICA (status 0), não é apagada');
$ok($s2 === 409 && ($e2['error'] ?? '') === 'EM_ANDAMENTO' && $s3 === 409 && ($e3['error'] ?? '') === 'RESULTADO_INDETERMINADO', "[2b] repetição = EM_ANDAMENTO e depois RESULTADO_INDETERMINADO (tem $s2/{$e2['error']} · $s3/{$e3['error']})");
$ok($efeitos('ev-2') === 1, "[2c] outcome_unknown: o efeito externo aconteceu UMA vez só (efeitos {$efeitos('ev-2')})");
// no_effect
$modo('no_effect'); $l = null;
[$s1] = $tentar('ev-3', 'req-ext-noeffect-0001', $l, $agora0); [$s2, $e2] = $tentar('ev-3', 'req-ext-noeffect-0001', $l, $agora0 + 5);
$ok($s1 === 422 && $s2 === 422 && ($e2['meta']['replay'] ?? false) === true && $efeitos('ev-3') === 0, "[3] no_effect: 422, registrado; a repetição devolve o 422 guardado, 0 efeitos");
@array_map('unlink', glob("$dir/nonces/*") ?: []); @rmdir("$dir/nonces"); @unlink($EST); @rmdir($dir);
if ($falhas) { echo "FALHAS (" . count($falhas) . "):\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "externo-estado: OK (3 estados)\n";
