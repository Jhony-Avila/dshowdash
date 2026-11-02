<?php
/**
 * detect-schema-drift.php — motor do DETECTOR 6/6 (schema drift).
 * @version 1.0.0  @created 2026-07-27
 *
 * PROBLEMA QUE RESOLVE (memoria: schema-drift-risco-recorrente)
 * -------------------------------------------------------------
 * Codigo PHP consultando TABELA ou COLUNA que nao existe mais no banco. Quatro casos
 * confirmados numa unica sessao (2026-07-20), todos com a mesma assinatura: SQL escrito
 * antes de uma refatoracao. NENHUM tinha teste que pegasse — e `api/` esta no .gitignore,
 * entao nao ha diff de commit para revisar. Ex.: api/feature-flags/index.php consultava
 * `flag_value`/`is_active`; as colunas reais eram `payload_json`/`is_enabled` — a flag
 * NUNCA ligava, em silencio.
 *
 * READ-ONLY, SEM EXCECAO
 * ----------------------
 * So emite SELECT contra `information_schema`. Nao toca arquivo de producao, nao roda
 * o SQL encontrado, nao abre transacao. Pode rodar em producao a qualquer hora.
 *
 * COMO EVITA FALSO POSITIVO (o que torna o detector confiavel)
 * -----------------------------------------------------------
 * 1. Usa `token_get_all()` — analisa APENAS literais de string do PHP. Comentario que
 *    descreve SQL ("UPDATE the cache") nunca vira tabela `the`.
 * 2. SQL montado com variavel (`FROM {$tabela}`) simplesmente nao casa: o fragmento
 *    termina no `FROM`. Preferimos perder um achado a inventar um.
 * 3. Coluna so e checada em statement INEQUIVOCO: uma unica tabela, sem JOIN e sem
 *    identificador qualificado (`a.col`) — ou seja, sem alias para resolver.
 * 4. Baseline em .schema-drift-baseline.txt: achado aceito nao volta a apitar.
 *
 * EXIT: 0 = sem drift · 1 = ACHADO · 2 = ERRO (crash/config). Igual aos outros detectores.
 * Uso: php detect-schema-drift.php [--strict] [--full] [--json]
 */
declare(strict_types=1);

const RAIZ      = '/var/www/dshowdash';
const ENV_FILE  = RAIZ . '/.env';
const BASELINE  = RAIZ . '/scripts/.schema-drift-baseline.txt';
const CORTE     = 30;   // linhas por secao sem --full

$opts   = $argv ?? [];
$full   = in_array('--full', $opts, true);
$json   = in_array('--json', $opts, true);

// --alvo=DIR: usado pela prova em fixtures (scripts/tests/). Padrao = api/ de producao.
$alvo = RAIZ . '/api';
foreach ($opts as $o) {
    if (str_starts_with((string)$o, '--alvo=')) { $alvo = rtrim(substr((string)$o, 7), '/'); }
}
if (!is_dir($alvo)) {
    fwrite(STDERR, "ERRO: alvo inexistente: {$alvo}\n");
    exit(2);
}
define('ALVO', $alvo);

// ── Palavras que NAO sao coluna (aparecem na posicao de identificador) ──────────
const NAO_COLUNA = [
    'null','true','false','not','and','or','in','is','like','between','exists','case','when',
    'then','else','end','select','from','where','group','order','by','having','limit','offset',
    'as','on','join','inner','left','right','outer','union','all','distinct','set','values',
    'into','insert','update','delete','duplicate','key','asc','desc','interval','current_date',
    'now','curdate','curtime','if','ifnull','coalesce','count','sum','avg','min','max','default',
];
// Nomes de tabela a ignorar (metadados / derivadas / temporarias).
// `json_table` entra aqui pelo mesmo motivo de `dual`: NAO e tabela. `JOIN JSON_TABLE(...)
// jt` tem a forma sintatica de um JOIN, entao o extrator a capturava e o detector acusava
// uma tabela inexistente (visto em 2026-07-28 com o /lead-sources do Pipedrive). Ignorar
// pelo NOME, e nao por "nome seguido de parentese", porque `INSERT INTO t (colunas)` tem
// parentese depois de um nome de tabela legitimo — a regra generica perderia achados reais.
const IGNORA_TABELA = ['dual','information_schema','performance_schema','mysql','sys','json_table'];

// ── Ambiente ───────────────────────────────────────────────────────────────────
function carregarEnv(string $arquivo): array
{
    $env = [];
    if (!is_readable($arquivo)) {
        fwrite(STDERR, "ERRO: .env ilegivel: {$arquivo}\n");
        exit(2);
    }
    foreach (file($arquivo, FILE_IGNORE_NEW_LINES) as $linha) {
        if (preg_match('/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/', $linha, $m)) {
            $env[$m[1]] = trim($m[2], "\"' \t\r");
        }
    }
    return $env;
}

/** Conexoes declaradas em config/db_connection.php, na mesma ordem/nomes. */
function conexoes(array $env): array
{
    $defs = [
        'INTEGRACAO'    => ['DB_INTEGRACAO_',    'displaysolutions.com.br', 'INTEGRACAO'],
        'DSHOWDASH'     => ['DB_DSHOWDASH_',     '127.0.0.1',               'DSHOWDASH'],
        'DSHOW_PROD'    => ['DB_DSHOW_PROD_',    'displaysolutions.com.br', 'DSHOW_PROD'],
        'PIPE_DSHOW'    => ['DB_PIPE_DSHOW_',    '127.0.0.1',               'PIPE_DSHOW'],
        'OUTLOOK_DSHOW' => ['DB_OUTLOOK_DSHOW_', '127.0.0.1',               'OUTLOOK_DSHOW'],
        'ADS_DSHOW'     => ['DB_ADS_DSHOW_',     '127.0.0.1',               'ADS_DSHOW'],
        // 2026-07-30: GCAL e BLING nao estao no db_connection.php (abrem PDO proprio),
        // mas TEM credencial dedicada no .env. Antes eles chegavam aqui de carona na
        // varredura de "outros schemas locais", que rodava com a conexao DSHOWDASH —
        // e essa conexao era o ROOT do MySQL, que enxergava TUDO.
        // Ao tirar a app do root (usuario `dshowdash_app`, privilegio minimo), a
        // varredura passou a ver so DSHOWDASH + DSHOWDASH_HOME, e o detector acusou
        // 75 tabelas `bling_*` como inexistentes — falso positivo.
        // A correcao nao e devolver privilegio ao app: e declarar a conexao de verdade.
        'GCAL_DSHOW'    => ['DB_GCAL_DSHOW_',    '127.0.0.1',               'GCAL_DSHOW'],
        'BLING'         => ['DB_BLING_',         '127.0.0.1',               'BLING'],
    ];
    $out = [];
    foreach ($defs as $nome => [$pfx, $hostPadrao, $dbPadrao]) {
        $out[$nome] = [
            'host' => $env[$pfx . 'HOST'] ?? $hostPadrao,
            'port' => (int)($env[$pfx . 'PORT'] ?? 3306),
            'db'   => $env[$pfx . 'NAME'] ?? $dbPadrao,
            'user' => $env[$pfx . 'USER'] ?? '',
            'pass' => $env[$pfx . 'PASS'] ?? '',
        ];
    }
    return $out;
}

/**
 * Le tabelas e colunas de uma conexao. SOMENTE SELECT em information_schema.
 * @return array{ok:bool, motivo:string, tabelas:array<string,array<string,true>>}
 */
function lerSchema(array $cfg): array
{
    if ($cfg['user'] === '') {
        return ['ok' => false, 'motivo' => 'sem credencial no .env', 'tabelas' => []];
    }
    try {
        $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['db']};charset=utf8mb4";
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT            => 8,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        $st = $pdo->prepare(
            'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?'
        );
        $st->execute([$cfg['db']]);
        $tabelas = [];
        foreach ($st->fetchAll(PDO::FETCH_NUM) as [$t, $c]) {
            $tabelas[strtolower($t)][strtolower($c)] = true;
        }
        // Views tambem contam como "tabela existente" (ja vem em information_schema.COLUMNS).
        return ['ok' => true, 'motivo' => '', 'tabelas' => $tabelas];
    } catch (Throwable $e) {
        return ['ok' => false, 'motivo' => 'inacessivel: ' . $e->getMessage(), 'tabelas' => []];
    }
}

/**
 * A string tem FORMA de SQL? Exigir a forma (nao so a palavra-chave) e o que separa
 * consulta de prosa: "[NavAdmin] sidebar_groups update skipped:" contem UPDATE mas nao
 * e SQL, e sem este filtro vira uma "tabela" chamada `skipped`.
 */
function pareceSql(string $s): bool
{
    $formas = [
        '/\bSELECT\b[\s\S]*\bFROM\b/i',
        '/\bINSERT\s+INTO\s+`?[A-Za-z_]/i',
        '/\bREPLACE\s+INTO\s+`?[A-Za-z_]/i',
        '/\bUPDATE\s+`?[A-Za-z_][A-Za-z0-9_]*`?\s+SET\b/i',
        '/\bDELETE\s+FROM\s+`?[A-Za-z_]/i',
    ];
    foreach ($formas as $re) {
        if (preg_match($re, $s)) { return true; }
    }
    // Fragmento de SQL concatenado (comeca no FROM/JOIN): exige clausula SQL junto,
    // senao "FROM the queue drains" em texto solto viraria tabela `the`.
    return (bool)preg_match('/^\s*(?:FROM|(?:LEFT\s+|RIGHT\s+|INNER\s+)?JOIN)\s+`?[A-Za-z_]/i', $s)
        && (bool)preg_match('/\b(WHERE|ORDER\s+BY|GROUP\s+BY|LIMIT|ON|HAVING)\b/i', $s);
}

// ── Extracao: so literais de string do PHP, via tokenizer ──────────────────────
/** @return array<int,array{sql:string,linha:int}> */
function literaisSql(string $codigo): array
{
    $out = [];
    $tokens = @token_get_all($codigo);
    foreach ($tokens as $t) {
        if (!is_array($t)) { continue; }
        [$id, $txt, $linha] = $t;
        if ($id !== T_CONSTANT_ENCAPSED_STRING && $id !== T_ENCAPSED_AND_WHITESPACE) { continue; }
        $s = trim($txt, "'\"");
        if (!pareceSql($s)) { continue; }
        $out[] = ['sql' => $s, 'linha' => $linha];
    }
    return $out;
}

/** Tabelas citadas num fragmento SQL. Ignora derivadas `FROM (` e nomes dinamicos. */
function tabelasDe(string $sql): array
{
    $nomes = [];
    // FROM/JOIN/INSERT INTO/REPLACE INTO/DELETE FROM: o nome vem logo depois.
    // (?<![:\w]) impede que o placeholder nomeado `:from` case como palavra FROM —
    // sem isso, ":from GROUP BY h" vira uma tabela chamada `group`.
    $re1 = '/(?<![:\w])\b(?:FROM|JOIN|INSERT\s+INTO|REPLACE\s+INTO|DELETE\s+FROM)\s+`?([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)`?/i';
    if (preg_match_all($re1, $sql, $m1)) { $nomes = $m1[1]; }
    // UPDATE <tabela> SET: exigir o SET descarta `ON DUPLICATE KEY UPDATE col = ...`,
    // onde o que vem depois de UPDATE e COLUNA, nao tabela (falso positivo classico).
    $re2 = '/\bUPDATE\s+`?([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)`?\s+SET\b/i';
    if (preg_match_all($re2, $sql, $m2)) { $nomes = array_merge($nomes, $m2[1]); }
    if (!$nomes) { return []; }
    $out = [];
    foreach ($nomes as $nome) {
        $nome = strtolower($nome);
        $base = str_contains($nome, '.') ? explode('.', $nome)[0] : $nome;
        if (in_array($base, IGNORA_TABELA, true)) { continue; }
        $out[$nome] = true;
    }
    return array_keys($out);
}

/**
 * Colunas citadas — SO em statement inequivoco (1 tabela, sem JOIN, sem `alias.col`).
 * Posicoes aceitas: lista do INSERT, `SET x =`, comparacao no WHERE, ORDER/GROUP BY.
 */
function colunasDe(string $sql): array
{
    if (preg_match('/\bJOIN\b/i', $sql)) { return []; }
    if (preg_match('/\b[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_]/', $sql)) { return []; }  // alias/qualificado
    if (preg_match('/\bSELECT\b.*\bSELECT\b/is', $sql)) { return []; }             // subconsulta

    $cols = [];

    // Lista de projeção do SELECT (2026-07-27 — PONTO CEGO FECHADO).
    // Antes o detector só olhava WHERE/INSERT/SET e por isso NÃO via
    // `SELECT ip_address, user_agent FROM app_user_sessions` — colunas que não existiam e
    // faziam api/users/sessions.php falhar 100% das vezes. Só a prova E2E pegou.
    //
    // Seguro porque: já estamos num statement inequívoco (1 tabela, sem JOIN, sem `a.col`),
    // e cada item da lista é aceito SÓ se for um identificador puro. Descarta-se
    // agressivamente o que possa ser alias, função ou expressão.
    if (preg_match('/\bSELECT\b(.*?)\bFROM\b/is', $sql, $m)) {
        foreach (explode(',', $m[1]) as $item) {
            $item = trim($item);
            if ($item === '' || $item === '*') { continue; }
            $item = preg_replace('/^\s*(?:DISTINCT|ALL|SQL_CALC_FOUND_ROWS)\s+/i', '', $item);
            // `expr AS alias` / `expr alias`: o ALIAS nunca é coluna — fica só o lado esquerdo.
            $item = preg_replace('/\s+AS\s+[`\'"]?[A-Za-z_][A-Za-z0-9_]*[`\'"]?\s*$/i', '', (string)$item);
            $item = trim((string)$item);
            // Qualquer sinal de expressão, função, literal ou alias-sem-AS: descarta o item.
            if (preg_match('/[()\'"*+\-\/%<>=!|]|\s/', $item)) { continue; }
            $c = strtolower(trim($item, '`'));
            if ($c !== '' && preg_match('/^[a-z_][a-z0-9_]*$/', $c)) { $cols[$c] = true; }
        }
    }

    // INSERT INTO t (a, b, c)
    if (preg_match('/\bINSERT\s+INTO\s+`?[A-Za-z0-9_]+`?\s*\(([^)]*)\)/i', $sql, $m)) {
        foreach (explode(',', $m[1]) as $c) {
            $c = strtolower(trim($c, " \t\r\n`"));
            if ($c !== '' && preg_match('/^[a-z_][a-z0-9_]*$/', $c)) { $cols[$c] = true; }
        }
    }
    // SET col = ...   (UPDATE / ON DUPLICATE KEY UPDATE)
    if (preg_match_all('/(?:\bSET\b|,)\s*`?([A-Za-z_][A-Za-z0-9_]*)`?\s*=/i', $sql, $m)) {
        foreach ($m[1] as $c) { $cols[strtolower($c)] = true; }
    }
    // WHERE/AND/OR col <op>
    //
    // ORDER BY / GROUP BY / HAVING ficam DE FORA de proposito: o MySQL ACEITA alias de
    // projecao nessas clausulas ("COUNT(*) AS total ... ORDER BY total"), entao o
    // identificador ali nao e necessariamente uma coluna — era a maior fonte de falso
    // positivo desta ferramenta. No WHERE o MySQL PROIBE alias, logo o que aparece
    // comparado ali e coluna de verdade. O corte e semantico, nao heuristico.
    if (preg_match_all('/\b(?:WHERE|AND|OR)\s+`?([A-Za-z_][A-Za-z0-9_]*)`?\s*(?:=|!=|<>|>=|<=|>|<|\bLIKE\b|\bIN\b|\bIS\b|\bBETWEEN\b)/i', $sql, $m)) {
        foreach ($m[1] as $c) { $cols[strtolower($c)] = true; }
    }
    foreach (array_keys($cols) as $c) {
        if (in_array($c, NAO_COLUNA, true)) { unset($cols[$c]); }
    }
    return array_keys($cols);
}

/** Conexao citada num codigo PHP. Distinta e unica → nome; senao null. */
function conexaoDoCodigo(string $codigo): ?string
{
    if (!preg_match_all('/getConnection\(\s*[\'"]([A-Z_]+)[\'"]/', $codigo, $m)) { return null; }
    $nomes = array_values(array_unique($m[1]));
    return count($nomes) === 1 ? $nomes[0] : null;
}

/**
 * Conexao do arquivo; se ele nao conecta (repositorio recebe o PDO injetado), HERDA do
 * ponto de entrada do modulo (api/<modulo>/index.php ou _init.php). Sem isso, os
 * repositorios do Outlook eram comparados contra a uniao dos bancos e acusavam tabela
 * inexistente — quando na verdade o banco OUTLOOK_DSHOW e que ainda nao existe.
 */
function conexaoDoArquivo(string $caminho, string $codigo, array &$cacheModulo): ?string
{
    $propria = conexaoDoCodigo($codigo);
    if ($propria !== null) { return $propria; }

    $rel = substr($caminho, strlen(ALVO) + 1);
    $modulo = explode('/', $rel)[0] ?? '';
    if ($modulo === '' || !is_dir(ALVO . '/' . $modulo)) { return null; }
    if (array_key_exists($modulo, $cacheModulo)) { return $cacheModulo[$modulo]; }

    $herdada = null;
    foreach (['index.php', '_init.php'] as $entrada) {
        $p = ALVO . '/' . $modulo . '/' . $entrada;
        if (!is_readable($p)) { continue; }
        $c = conexaoDoCodigo((string)file_get_contents($p));
        if ($c === null) { continue; }
        if ($herdada !== null && $herdada !== $c) { $herdada = null; break; }  // ambiguo
        $herdada = $c;
    }
    return $cacheModulo[$modulo] = $herdada;
}

// ── Execucao ───────────────────────────────────────────────────────────────────
$env    = carregarEnv(ENV_FILE);
$conexoes = conexoes($env);

$schemas = [];
$indisponiveis = [];
foreach ($conexoes as $nome => $cfg) {
    $r = lerSchema($cfg);
    if ($r['ok']) {
        $schemas[$nome] = $r['tabelas'];
    } else {
        $indisponiveis[$nome] = $r['motivo'];
    }
}
if (!$schemas) {
    fwrite(STDERR, "ERRO: nenhuma conexao pode ser lida — sem base de comparacao.\n");
    exit(2);
}

// Uniao das tabelas (usada quando a conexao do arquivo e indeterminada).
$uniao = [];
foreach ($schemas as $tabs) {
    foreach ($tabs as $t => $cols) { $uniao[$t] = ($uniao[$t] ?? []) + $cols; }
}

/**
 * PONTO CEGO FECHADO (2026-07-27): nem todo codigo passa pelo DatabaseManager. Alguns
 * arquivos abrem PDO proprio apontando para bancos que NAO estao em config/db_connection.php
 * — `api/ui/context-messages.php` usa `DSHOWDASH_HOME` e `api/media/*` usa `DSHOW_MEDIA`.
 * Sem varrer esses schemas, o detector acusava 5 tabelas que existem (falso positivo).
 * Aqui varremos TODOS os schemas visiveis no servidor local e juntamos a uniao.
 */
$outrosLocais = [];
try {
    $cfgLocal = $conexoes['DSHOWDASH'];
    $pdoLocal = new PDO(
        "mysql:host={$cfgLocal['host']};port={$cfgLocal['port']};charset=utf8mb4",
        $cfgLocal['user'], $cfgLocal['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]
    );
    $jaLidos = [];
    foreach ($conexoes as $c) { $jaLidos[strtolower($c['db'])] = true; }
    $st = $pdoLocal->query(
        "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA NOT IN ('information_schema','performance_schema','mysql','sys')"
    );
    foreach ($st->fetchAll(PDO::FETCH_NUM) as [$sch, $t, $c]) {
        if (isset($jaLidos[strtolower($sch)])) { continue; }   // ja veio como conexao
        $t = strtolower($t);
        $uniao[$t][strtolower($c)] = true;
        $outrosLocais[strtolower($sch)] = true;
    }
} catch (Throwable $e) {
    $outrosLocais = [];   // sem privilegio para varrer: segue com a uniao das conexoes
}

$baseline = [];
if (is_readable(BASELINE)) {
    foreach (file(BASELINE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) {
        $l = trim($l);
        if ($l !== '' && $l[0] !== '#') { $baseline[$l] = true; }
    }
}

$arquivos = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(ALVO, FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) {
    if ($f->isFile() && strtolower($f->getExtension()) === 'php') { $arquivos[] = $f->getPathname(); }
}
sort($arquivos);

$achadosTabela = [];
$achadosColuna = [];
$cacheModulo = [];   // modulo => conexao herdada do ponto de entrada (ou null)
$statsArquivos = 0; $statsSql = 0; $statsIndeterminados = 0;

foreach ($arquivos as $caminho) {
    $codigo = @file_get_contents($caminho);
    if ($codigo === false) { continue; }   // ilegivel (ACL) — nao e drift
    $sqls = literaisSql($codigo);
    if (!$sqls) { continue; }

    $statsArquivos++;
    $conn = conexaoDoArquivo($caminho, $codigo, $cacheModulo);
    if ($conn === null || !isset($schemas[$conn])) {
        if ($conn !== null && isset($indisponiveis[$conn])) { continue; }  // banco fora do ar: nao acusa
        $statsIndeterminados++;
    }
    $rotulo  = ($conn !== null && isset($schemas[$conn])) ? $conn : '(indeterminado)';
    $rel     = str_replace(RAIZ . '/', '', $caminho);

    foreach ($sqls as $item) {
        $statsSql++;
        $sql = $item['sql'];
        $tabsSql = tabelasDe($sql);
        if (!$tabsSql) { continue; }

        // REGRA: so e ACHADO a tabela que nao existe em NENHUM banco legivel.
        // Um repositorio pode receber um PDO de outra conexao que nao a do modulo
        // (ex.: koala/RemoteErpRepository fala com o ERP remoto, nao com o DSHOWDASH):
        // exigir ausencia em todos os bancos elimina esse falso positivo por completo.
        $faltando = [];
        foreach ($tabsSql as $t) {
            $simples = str_contains($t, '.') ? explode('.', $t)[1] : $t;
            if (!isset($uniao[$simples])) { $faltando[] = $t; }
        }
        if ($faltando) {
            foreach ($faltando as $t) {
                $chave = "{$rel}:{$t}";
                if (isset($baseline[$chave])) { continue; }
                $achadosTabela[$chave] = ['arquivo' => $rel, 'linha' => $item['linha'],
                                          'conn' => $rotulo, 'tabela' => $t,
                                          'sql' => mb_substr(preg_replace('/\s+/', ' ', $sql), 0, 110)];
            }
            continue;   // sem tabela, checar coluna nao faz sentido
        }

        // Coluna: so quando a tabela e unica e o statement e inequivoco.
        if (count($tabsSql) !== 1) { continue; }
        $t = $tabsSql[0];
        $simples = str_contains($t, '.') ? explode('.', $t)[1] : $t;
        // Colunas: prefere o banco do arquivo; se a tabela nao esta la, usa a UNIAO das
        // colunas de todos os bancos que tem uma tabela com esse nome (homonimas existem).
        $colsTabela = ($conn !== null && isset($schemas[$conn][$simples]))
            ? $schemas[$conn][$simples]
            : ($uniao[$simples] ?? []);
        if (!$colsTabela) { continue; }

        foreach (colunasDe($sql) as $c) {
            if (isset($colsTabela[$c])) { continue; }
            $chave = "{$rel}:{$simples}:{$c}";
            if (isset($baseline[$chave])) { continue; }
            $achadosColuna[$chave] = ['arquivo' => $rel, 'linha' => $item['linha'],
                                      'conn' => $rotulo, 'tabela' => $simples, 'coluna' => $c,
                                      'sql' => mb_substr(preg_replace('/\s+/', ' ', $sql), 0, 110)];
        }
    }
}

// ── Saida ──────────────────────────────────────────────────────────────────────
// --gerar-baseline: imprime as chaves atuais no formato do arquivo de baseline.
// Serve para congelar o passivo conhecido e deixar o check-all verde, de modo que
// um achado NOVO volte a ser sinal (mesma logica do detector 2/6).
if (in_array('--gerar-baseline', $opts, true)) {
    foreach (array_keys($achadosTabela) as $k) { echo $k, "\n"; }
    foreach (array_keys($achadosColuna) as $k) { echo $k, "\n"; }
    exit(0);
}

if ($json) {
    echo json_encode([
        'tabelas_ausentes' => array_values($achadosTabela),
        'colunas_ausentes' => array_values($achadosColuna),
        'bancos_lidos'     => array_keys($schemas),
        'bancos_fora'      => $indisponiveis,
        'arquivos_com_sql' => $statsArquivos,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
    exit($achadosTabela || $achadosColuna ? 1 : 0);
}

printf("  bancos lidos: %s\n", implode(', ', array_keys($schemas)));
if ($outrosLocais) {
    printf("  + schemas locais fora do db_connection.php: %s\n", implode(', ', array_keys($outrosLocais)));
}
foreach ($indisponiveis as $nome => $motivo) {
    printf("  \033[1;33mPULADO\033[0m %-14s %s\n", $nome, mb_substr($motivo, 0, 90));
}
printf("  arquivos com SQL: %d · literais analisados: %d · conexao indeterminada: %d\n",
    $statsArquivos, $statsSql, $statsIndeterminados);

$mostra = static function (array $lista, string $titulo, callable $linha) use ($full): void {
    $n = count($lista);
    printf("\n  %s: %d\n", $titulo, $n);
    if ($n === 0) { return; }
    $i = 0;
    foreach ($lista as $a) {
        if (!$full && $i >= CORTE) { printf("    … +%d (use --full)\n", $n - CORTE); break; }
        echo '    ' . $linha($a) . "\n";
        $i++;
    }
};

$mostra($achadosTabela, 'TABELAS que o codigo usa e nao existem', static fn($a) =>
    sprintf("\033[0;31m%s\033[0m  %s:%d [%s]\n        %s", $a['tabela'], $a['arquivo'], $a['linha'], $a['conn'], $a['sql']));
$mostra($achadosColuna, 'COLUNAS que o codigo usa e nao existem', static fn($a) =>
    sprintf("\033[0;31m%s.%s\033[0m  %s:%d [%s]\n        %s", $a['tabela'], $a['coluna'], $a['arquivo'], $a['linha'], $a['conn'], $a['sql']));

$total = count($achadosTabela) + count($achadosColuna);
if ($total === 0) {
    echo "\n  \033[0;32mSem drift de schema.\033[0m\n";
} else {
    printf("\n  \033[0;31mACHADO: %d divergencia(s) codigo x schema.\033[0m\n", $total);
    printf("  Aceitou um achado? Anote a chave em %s\n", str_replace(RAIZ . '/', '', BASELINE));
}
exit($total > 0 ? 1 : 0);
