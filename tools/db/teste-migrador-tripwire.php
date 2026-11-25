<?php
declare(strict_types=1);
// tools/db/teste-migrador-tripwire.php — Codex DSHOW-115B (P8): em PRODUÇÃO o migrador só grava a 012/013 com a PROVA do tripwire da
// Conferência-C (proposta da ESQUERDA, PROPOSTA-MIGRADOR-TRIPWIRE.md). SEM BANCO: o Migrador recebe um PDO FALSO que registra cada exec/
// prepare; "base vazia" = nenhuma tabela (ledger vazio, preflight limpo). A prova é um arquivo temporário próprio (mktemp), removido no fim.
// Uso: php tools/db/teste-migrador-tripwire.php [caminho/do/equipamentos-migrar.php]   (padrão: o desta árvore)
// Contraprova: rodar contra o migrador da P8 4485cb86/e681a9d9 tem de REPROVAR.

$alvo = $argv[1] ?? __DIR__ . '/equipamentos-migrar.php';
$dirMig = $argv[2] ?? __DIR__ . '/../../db/equipamentos/migrations';
require $alvo;

$ok = 0; $falhas = 0;
function afirma(string $n, bool $c, string $x = ''): void { global $ok, $falhas; if ($c) { $ok++; echo "ok    $n\n"; } else { $falhas++; echo "FALHA $n" . ($x !== '' ? " · $x" : '') . "\n"; } }
function erro(callable $f): ?string { try { $f(); return null; } catch (Throwable $e) { return $e->getMessage(); } }

// ── PDO falso: nada existe; registra as gravações ──
final class StFalso extends PDOStatement { public function __construct(private FalsoPDO $p, private string $q) {} public function execute(?array $a = null): bool { if (!preg_match('/^\s*SELECT/i', $this->q)) $this->p->gravacoes[] = $this->q; return true; } public function fetchAll(int $m = PDO::FETCH_DEFAULT, mixed ...$a): array { return []; } }
final class FalsoPDO extends PDO { public array $gravacoes = []; public function __construct() {} public function prepare(string $q, array $o = []): PDOStatement|false { return new StFalso($this, $q); } public function exec(string $q): int|false { $this->gravacoes[] = $q; return 0; } }

$T = trim((string) shell_exec('mktemp -d /tmp/teste-migrador-tripwire.XXXXXX'));
if (!preg_match('#^/tmp/teste-migrador-tripwire\.[A-Za-z0-9]{6}$#', $T)) { echo "mktemp inesperado\n"; exit(2); }
register_shutdown_function(static function () use ($T) { if (preg_match('#^/tmp/teste-migrador-tripwire\.[A-Za-z0-9]{6}$#', $T)) shell_exec('rm -rf -- ' . escapeshellarg($T)); });
// release falsa com RELEASE_SHA (o migrador lê __DIR__/../../RELEASE_SHA — aqui a raiz é a da árvore; o teste usa shaDaRelease explicitamente)
$REL = str_repeat('a', 40);
$sha = [];
foreach (glob($dirMig . '/01[23]_*.sql') as $f) if (!str_ends_with($f, '.revert.sql')) $sha[basename($f, '.sql')] = hash_file('sha256', $f);
afirma('as migrações 012 e 013 existem na árvore', isset($sha['012_kit_prioridade'], $sha['013_sugestao_estados']));
function prova(string $T, array $linhas, int $modo = 0600, int $idade = 0): string { $f = "$T/prova-" . bin2hex(random_bytes(4)) . '.txt'; file_put_contents($f, implode("\n", $linhas) . "\n"); chmod($f, $modo); if ($idade) touch($f, time() - $idade); return $f; }
$boa = fn(array $extra = []) => array_merge(['EQUIVALENCIA_OK', "ALVO=$REL", 'SERVIDA=' . str_repeat('b', 40), 'SHA012=' . ($sha['012_kit_prioridade'] ?? ''), 'SHA013=' . ($sha['013_sugestao_estados'] ?? ''), 'EM=' . time()], $extra);

$temFuncoes = method_exists('Migrador', 'conferirProvaTripwire') && method_exists('Migrador', 'exigemProva');
afirma('o migrador tem a conferência da prova (conferirProvaTripwire/exigemProva)', $temFuncoes);
if ($temFuncoes) {
    $c = fn(?string $arq, string $rel = '') => erro(fn() => Migrador::conferirProvaTripwire($arq, $rel ?: $REL, $sha, time()));
    afirma('(1) sem prova → recusa', str_contains((string) $c(null), 'exigem a prova'));
    afirma('(2) prova com 20 min → recusa', str_contains((string) $c(prova($T, $boa(), 0600, 1200)), 'fora do prazo'));
    afirma('(2b) prova com 14 min → aceita', $c(prova($T, $boa(), 0600, 840)) === null);
    afirma('(3) ALVO de outro commit → recusa', str_contains((string) $c(prova($T, $boa()), str_repeat('c', 40)), 'outro ALVO'));
    afirma('(3b) release sem sha40 → recusa', str_contains((string) erro(fn() => Migrador::conferirProvaTripwire(prova($T, $boa()), '', $sha, time())), 'outro ALVO'));
    $l = $boa(); $l[3] = 'SHA012=' . str_repeat('0', 64);
    afirma('(4) SHA012 diferente do arquivo → recusa', str_contains((string) $c(prova($T, $l)), 'não confere a 012'));
    afirma('(5) prova em modo 644 → recusa', str_contains((string) $c(prova($T, $boa(), 0644)), 'dono/modo inseguro'));
    afirma('(5b) prova em modo 640 → recusa', str_contains((string) $c(prova($T, $boa(), 0640)), 'dono/modo inseguro'));
    $pn = prova($T, $boa()); chown($pn, 'nobody');
    afirma('(5c) prova de outro dono (nobody) → recusa', str_contains((string) $c($pn), 'dono/modo inseguro'));
    $alvoLink = prova($T, $boa()); symlink($alvoLink, "$T/link.txt");
    afirma('(6) prova como link simbólico → recusa', str_contains((string) $c("$T/link.txt"), 'não é arquivo regular'));
    $l = $boa(); $l[0] = 'DIVERGENTE';
    afirma('(6b) 1ª linha ≠ EQUIVALENCIA_OK → recusa', str_contains((string) $c(prova($T, $l)), 'sem EQUIVALENCIA_OK'));
    afirma('(3c) DOIS ALVO= (outro commit + o certo) → recusa (nit da ACIMA_ESQUERDA)', str_contains((string) $c(prova($T, $boa(['ALVO=' . str_repeat('c', 40)]))), 'outro ALVO'));
    afirma('(4b) DOIS SHA012= (um errado + o certo) → recusa', str_contains((string) $c(prova($T, $boa(['SHA012=' . str_repeat('0', 64)]))), 'não confere a 012'));
    afirma('(7) prova válida → aceita', $c(prova($T, $boa())) === null);
    afirma('(9) 012/013 já no ledger → nada exige prova', Migrador::exigemProva((new Migrador(new FalsoPDO, 'X', $dirMig, fn() => null))->arquivos(), array_fill_keys(array_keys((new Migrador(new FalsoPDO, 'X', $dirMig, fn() => null))->arquivos()), str_repeat('d', 64)), null) === []);
    afirma('(9b) --ate 011 → 012/013 não vão → nada exige prova', Migrador::exigemProva((new Migrador(new FalsoPDO, 'X', $dirMig, fn() => null))->arquivos(), [], '011_operacao') === []);
    afirma('shaDaRelease: RELEASE_SHA na raiz', (function () use ($T, $REL) { mkdir("$T/r"); file_put_contents("$T/r/RELEASE_SHA", "$REL\n"); return Migrador::shaDaRelease("$T/r"); })() === $REL);
    afirma('shaDaRelease: pasta da release com nome sha40', (function () use ($T) { $d = "$T/" . str_repeat('e', 40); mkdir($d); return Migrador::shaDaRelease($d); })() === str_repeat('e', 40));
    afirma('shaDaRelease: sem nada → vazio (a prova recusa)', (function () use ($T) { mkdir("$T/semnada"); return Migrador::shaDaRelease("$T/semnada"); })() === '');
}

// ── executar() de verdade sobre a base vazia (PDO falso): o que grava ANTES de conferir a prova? ──
function roda(bool $producao, bool $seco, ?string $prova, string $dirMig): array {
    $pdo = new FalsoPDO; $m = new Migrador($pdo, 'DSHOW_EQUIPAMENTOS', $dirMig, fn() => null);
    if (property_exists($m, 'modoProducao')) $m->modoProducao = $producao;
    if ($prova === null) putenv('ATR_TRIPWIRE_PROVA'); else putenv("ATR_TRIPWIRE_PROVA=$prova");
    $e = erro(fn() => $m->executar($seco));
    return [$e, count($pdo->gravacoes)];
}
[$e, $n] = roda(true, false, null, $dirMig);
afirma('(1) executar em PRODUÇÃO sem prova → MIGRAR_FALHOU antes de QUALQUER gravação', $e !== null && str_contains($e, 'tripwire') && $n === 0, "erro=" . var_export($e, true) . " gravações=$n");
[$e, $n] = roda(true, false, prova($T, $boa(), 0600, 1200), $dirMig);
afirma('(2) executar em PRODUÇÃO com prova vencida → recusa sem gravar', $e !== null && $n === 0, "erro=" . var_export($e, true) . " gravações=$n");
[$e, $n] = roda(false, false, null, $dirMig);
afirma('(8) validação (sem --modo-producao) → não exige: segue e grava', $e === null && $n > 0, "erro=" . var_export($e, true) . " gravações=$n");
[$e, $n] = roda(true, true, null, $dirMig);
afirma('(10) --dry-run em produção → não exige e não grava', $e === null && $n === 0, "erro=" . var_export($e, true) . " gravações=$n");
afirma('o CLI liga o modoProducao com --modo-producao', (bool) preg_match('/\$m->modoProducao\s*=\s*isset\(\$o\[\'modo-producao\'\]\)/', (string) file_get_contents($alvo)));
$src = (string) file_get_contents($alvo);
$pPre = strpos($src, 'preflight recusou'); $pTrip = strpos($src, 'self::conferirProvaTripwire('); $pPasso2 = strpos($src, '// 2) aplica as que faltam');
afirma('a conferência fica DEPOIS do preflight e ANTES do passo 2 (aplicar/registrar)', $pPre !== false && $pTrip !== false && $pPasso2 !== false && $pPre < $pTrip && $pTrip < $pPasso2);
echo "MIGRADOR TRIPWIRE (Codex 115B, P8): $ok ok, $falhas falha(s)\n"; exit($falhas ? 1 : 0);
