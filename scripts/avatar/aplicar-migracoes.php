<?php
declare(strict_types=1);

/**
 * scripts/avatar/aplicar-migracoes.php — aplica as migrações do catálogo
 * do Avatar Studio (Expansão, Trilha A) usando a PRÓPRIA conexão da app.
 * @version 1.0.0  @created 2026-07-30
 *
 * Uso (CLI apenas, na raiz do projeto):
 *   php scripts/avatar/aplicar-migracoes.php                 → aplica tudo
 *   php scripts/avatar/aplicar-migracoes.php --dry-run       → só lista
 *   php scripts/avatar/aplicar-migracoes.php --checar        → diagnóstico
 *       (quais tabelas existem, contagens) SEM executar nada
 *   php scripts/avatar/aplicar-migracoes.php <arquivo.sql…>  → só os arquivos
 *       citados (ex.: só os SEEDS quando o usuário do banco não tem CREATE —
 *       v1.1.0: o dshowdash_app perdeu CREATE no endurecimento de permissões,
 *       então schema roda como root em passo explícito e seeds rodam aqui)
 *
 * Idempotente por construção (IF NOT EXISTS / ON DUPLICATE KEY). Para testes
 * fora do servidor: AVST_MIG_DSN/AVST_MIG_USER/AVST_MIG_PASS sobrescrevem a
 * conexão (nunca usados em produção).
 * @version 1.1.0 — --checar + filtro de arquivos por argumento
 */
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Somente CLI.\n");
    exit(1);
}

$raiz = dirname(__DIR__, 2);
$todos = [
    $raiz . '/sql/avatar/catalogo_schema.sql',
    $raiz . '/sql/avatar/catalogo_seed_taxonomia.sql',
    $raiz . '/sql/avatar/catalogo_seed_assets.sql',
    $raiz . '/sql/avatar/historico_schema.sql',
    $raiz . '/sql/avatar/as5_schema.sql',
];
$dryRun = in_array('--dry-run', $argv, true);
$checar = in_array('--checar', $argv, true);

// arquivos passados na linha de comando limitam a execução (só da lista oficial)
$pedidos = array_values(array_filter(array_slice($argv, 1),
    static fn (string $a): bool => !str_starts_with($a, '--')));
if ($pedidos !== []) {
    $arquivos = [];
    foreach ($pedidos as $p) {
        $alvo = str_starts_with($p, '/') ? $p : $raiz . '/' . ltrim($p, './');
        if (!in_array($alvo, $todos, true)) {
            // conveniência: aceitar o BASENAME (ex.: as5_schema.sql) —
            // continua 100% restrito à lista oficial acima
            $porNome = array_values(array_filter($todos,
                static fn (string $t): bool => basename($t) === basename($p)));
            if (count($porNome) === 1) {
                $alvo = $porNome[0];
            } else {
                fwrite(STDERR, "RECUSADO (fora da lista oficial de migracoes): {$p}
");
                exit(1);
            }
        }
        $arquivos[] = $alvo;
    }
} else {
    $arquivos = $todos;
}

$dsn = getenv('AVST_MIG_DSN');
if ($dsn !== false && $dsn !== '') {
    $pdo = new PDO($dsn, getenv('AVST_MIG_USER') ?: 'root', getenv('AVST_MIG_PASS') ?: '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} else {
    require_once $raiz . '/config/db_connection.php';
    $pdo = getConnection('DSHOWDASH');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

// ── modo --checar: diagnóstico sem executar nada ─────────────────────
if ($checar) {
    $esperadas = ['avatar_licenses', 'avatar_libraries', 'avatar_categories',
        'avatar_category_groups', 'avatar_rarities', 'avatar_assets',
        'avatar_asset_rules', 'avatar_unlock_rules', 'avatar_presets',
        'avatar_collections', 'avatar_collection_items', 'avatar_user_favorites',
        'avatar_user_unlocks', 'avatar_user_inventory', 'avatar_catalog_meta',
        'avatar_catalog_audit', 'avatar_version_meta',
        // AS5 F1 (§610–§615)
        'avatar_profiles', 'avatar_states', 'avatar_state_versions',
        'avatar_asset_versions', 'avatar_asset_files'];
    $st = $pdo->query("
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name LIKE 'avatar\\_%'
    ");
    $existentes = array_map(static fn ($l) => (string) $l[0], $st->fetchAll(PDO::FETCH_NUM));
    foreach ($esperadas as $t) {
        echo (in_array($t, $existentes, true) ? 'OK      ' : 'FALTA   ') . $t . "\n";
    }
    foreach (array_diff($existentes, $esperadas) as $extra) {
        echo "EXTRA   {$extra}\n";
    }
    foreach (['avatar_categories' => 'categorias', 'avatar_assets' => 'assets',
        'avatar_collections' => 'colecoes'] as $tab => $rotulo) {
        if (in_array($tab, $existentes, true)) {
            $n = (int) $pdo->query("SELECT COUNT(*) FROM {$tab}")->fetchColumn();
            echo "CONTAGEM {$rotulo}: {$n}\n";
        }
    }
    echo "== CHECAGEM CONCLUIDA (nada foi executado) ==\n";
    exit(0);
}

/** Divide o arquivo em comandos: ';' no fim de linha encerra o statement. */
function avstmig_comandos(string $sql): array
{
    $linhas = preg_split('/\R/', $sql) ?: [];
    $comandos = [];
    $atual = '';
    foreach ($linhas as $linha) {
        $aparada = trim($linha);
        if ($aparada === '' || str_starts_with($aparada, '--')) {
            continue; // comentários e vazios nunca entram no buffer
        }
        $atual .= $linha . "\n";
        if (str_ends_with(rtrim($linha), ';')) {
            $comandos[] = trim($atual);
            $atual = '';
        }
    }
    if (trim($atual) !== '') {
        $comandos[] = trim($atual);
    }
    return $comandos;
}

$totalOk = 0;
foreach ($arquivos as $arquivo) {
    if (!is_file($arquivo)) {
        fwrite(STDERR, "AUSENTE: {$arquivo}\n");
        exit(1);
    }
    $comandos = avstmig_comandos((string) file_get_contents($arquivo));
    echo basename($arquivo) . ' — ' . count($comandos) . " comandos\n";
    if ($dryRun) {
        continue;
    }
    foreach ($comandos as $i => $cmd) {
        try {
            $pdo->exec($cmd);
            $totalOk++;
        } catch (Throwable $e) {
            fwrite(STDERR, sprintf("ERRO em %s (comando %d): %s\n",
                basename($arquivo), $i + 1, $e->getMessage()));
            fwrite(STDERR, substr($cmd, 0, 220) . "…\n");
            exit(1);
        }
    }
}

if (!$dryRun) {
    $tabelas = (int) $pdo->query("
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name LIKE 'avatar\\_%'
    ")->fetchColumn();
    $assets = (int) $pdo->query('SELECT COUNT(*) FROM avatar_assets')->fetchColumn();
    $cats = (int) $pdo->query('SELECT COUNT(*) FROM avatar_categories')->fetchColumn();
    echo "== MIGRACOES OK == comandos: {$totalOk} · tabelas avatar_*: {$tabelas}"
        . " · categorias: {$cats} · assets: {$assets}\n";
}
