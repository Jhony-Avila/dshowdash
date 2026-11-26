<?php
declare(strict_types=1);

/**
 * api/cadastro/PreviaRepositorio.php — C1 · leitura das fontes (SÓ LEITURA) e persistência do lote/decisão nas tabelas NOVAS do consultar_io.
 * VINHO (ACIMA_ESQUERDA), 26/11/2026. Fontes: Pipedrive local (PIPE_DSHOW), Precifica (ds_prod) e legado (consultar_io) no RDS.
 * Escrita: SÓ em consultar_io.revisao_* (o pipedrive_* de outubro e qualquer tabela do Precifica nunca são escritos).
 * Credencial do RDS para o Dash (www-data): /etc/dshow-dash/rds-dshow-dash.cnf (portão CRED-C1: cópia, como root, da credencial dshow-dash do
 * app; www-data 0400). Cada consulta ao RDS tem teto de 4 s (max_execution_time) e as tabelas grandes são lidas em PÁGINAS (keyset).
 */
require_once __DIR__ . '/PreviaCadastral.php';

final class CadastroConexoes
{
    public const CNF = '/etc/dshow-dash/rds-dshow-dash.cnf';   // portão CRED-C1 (VERMELHO): cópia da credencial dshow-dash do app, www-data 0400
    public const LIMITE_MS = 4000;                              // teto por consulta no RDS (como no Koala)

    /** TODOS os blocos [client] do arquivo de opções (o CRED-C1 grava o do app + um acrescentado; o último valor vence, como no mysql): user, password, host, port, ssl-mode, ssl-ca */
    public static function lerCnf(string $arq): array
    {
        $out = []; $cl = false;
        foreach ((is_readable($arq) ? (array) file($arq, FILE_IGNORE_NEW_LINES) : []) as $raw) {
            $l = trim((string) $raw); if ($l === '' || $l[0] === '#' || $l[0] === ';') continue;
            if (preg_match('/^\[(.+)\]$/', $l, $m)) { $cl = strtolower(trim($m[1])) === 'client'; continue; }
            if ($cl && preg_match('/^([a-z_-]+)\s*=\s*(.*)$/i', $l, $kv)) $out[strtolower(str_replace('_', '-', $kv[1]))] = preg_replace('/^["\'](.*)["\']$/', '$1', $kv[2]);
        }
        return $out;
    }

    public static function rds(string $arq = self::CNF): PDO
    {
        $c = self::lerCnf($arq);
        if (($c['user'] ?? '') === '' || ($c['password'] ?? '') === '') throw new RuntimeException('credencial_rds_ausente');
        if (($c['host'] ?? '') === '') throw new RuntimeException('credencial_rds_sem_host');   // o CRED-C1 precisa levar host/port (a cópia do app pode ter só user/password)
        $op = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 4];
        // ssl-mode do CRED-C1: DISABLED só na exceção registrada do túnel; VERIFY_CA com a CA do app; senão REQUIRED (TLS obrigatório, conferido abaixo)
        $modo = strtoupper((string) ($c['ssl-mode'] ?? 'REQUIRED'));
        if (!in_array($modo, ['DISABLED', 'REQUIRED', 'VERIFY_CA'], true)) throw new RuntimeException('credencial_rds_ssl_mode_invalido');
        if ($modo === 'VERIFY_CA') {
            if (empty($c['ssl-ca']) || !is_readable($c['ssl-ca'])) throw new RuntimeException('credencial_rds_sem_ca');
            $op[PDO::MYSQL_ATTR_SSL_CA] = $c['ssl-ca']; $op[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        } elseif ($modo === 'REQUIRED') {
            $op[PDO::MYSQL_ATTR_SSL_CA] = '/etc/ssl/certs/ca-certificates.crt'; $op[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;   // liga o TLS; a cifra é exigida abaixo
        }
        $pdo = new PDO("mysql:host={$c['host']};port=" . (int) ($c['port'] ?? 3306) . ';dbname=ds_prod;charset=utf8mb4', $c['user'], $c['password'], $op);
        unset($c);
        if ($modo !== 'DISABLED') {
            $cifra = $pdo->query("SHOW SESSION STATUS LIKE 'Ssl_cipher'")->fetch(PDO::FETCH_NUM)[1] ?? '';
            if ($cifra === '') throw new RuntimeException('rds_sem_tls');   // fail-closed: nunca segue em texto puro quando o TLS é obrigatório
        }
        $pdo->exec("SET time_zone = '+00:00'");
        try { $pdo->exec('SET SESSION max_execution_time = ' . self::LIMITE_MS); } catch (Throwable) {}
        return $pdo;
    }
}

final class PreviaRepositorio
{
    public function __construct(private readonly ?PDO $pipe, private readonly ?PDO $rds, private readonly int $pagina = 2000) {}

    /** @return array{orgs:array, prec:array, precCliente:array, leg:array, fontes:array} */
    public function fontes(bool $comRds = true): array
    {
        $f = ['pipedrive' => ['estado' => 'indisponivel', 'ultimo_sync' => null], 'precifica' => ['estado' => 'indisponivel', 'lido_em' => null], 'legado' => ['estado' => 'indisponivel', 'lido_em' => null]];
        $orgs = []; $prec = []; $pc = []; $leg = [];
        try {
            if ($this->pipe === null) throw new RuntimeException('pipe');
            $this->pipe->exec('SET SESSION TRANSACTION READ ONLY');
            $k = []; $kPrec = null;
            foreach ($this->pipe->query("SELECT pipedrive_id, field_key, name FROM pipe_custom_fields WHERE entity = 'organization'") as $r) {
                $k[(int) $r['pipedrive_id']] = (string) $r['field_key'];
                if ((int) $r['pipedrive_id'] === 4038 && preg_match('/^[a-f0-9]{40}$/', (string) $r['field_key']) === 1) $kPrec = (string) $r['field_key'];   // F18: Id_Precifica pelo ID, nunca pelo nome
            }
            foreach ([4022, 4025, 4036] as $id) if (preg_match('/^[a-f0-9]{40}$/', $k[$id] ?? '') !== 1) throw new RuntimeException('campo');
            $sel = static function (string $key, string $as): string { $e = "JSON_EXTRACT(o.custom_fields, '$.\"$key\"')";
                return "(CASE WHEN o.custom_fields IS NULL OR $e IS NULL THEN 'sem_chave' WHEN JSON_TYPE($e) = 'OBJECT' AND JSON_CONTAINS_PATH($e, 'one', '$.value') = 0 THEN 'OBJECT_UNEXPECTED' ELSE JSON_TYPE($e) END) AS {$as}_t, (CASE WHEN $e IS NULL OR JSON_TYPE($e) = 'NULL' THEN NULL WHEN JSON_TYPE($e) = 'OBJECT' THEN (CASE WHEN JSON_EXTRACT($e, '$.value') IS NULL OR JSON_TYPE(JSON_EXTRACT($e, '$.value')) = 'NULL' THEN NULL ELSE JSON_UNQUOTE(JSON_EXTRACT($e, '$.value')) END) ELSE JSON_UNQUOTE($e) END) AS {$as}_v"; };
            $q = "SELECT o.pipedrive_id AS id, o.name, {$sel($k[4022], 'c4022')}, {$sel($k[4025], 'c4025')}, {$sel($k[4036], 'c4036')}"
               . ($kPrec ? ", JSON_UNQUOTE(JSON_EXTRACT(o.custom_fields, '$.\"$kPrec\"')) AS idprec" : ', NULL AS idprec')
               . ", (SELECT MAX(d.won_time) FROM pipe_deals d WHERE d.org_id = o.pipedrive_id AND d.is_deleted = 0 AND d.status = 'won' AND d.won_time IS NOT NULL) AS ganho
                  FROM pipe_organizations o WHERE COALESCE(o.is_deleted, 0) = 0 AND COALESCE(o.is_active, 1) = 1";
            foreach ($this->pipe->query($q, PDO::FETCH_ASSOC) as $r) {
                $orgs[] = ['id' => (int) $r['id'], 'nome' => $r['name'], 'doc' => (string) $r['c4022_v'], 'idprec' => $r['idprec'] === 'null' ? null : $r['idprec'], 'ganho' => $r['ganho'],
                           'campos' => ['4022' => ['tipo' => $r['c4022_t'], 'valor' => $r['c4022_v']], '4025' => ['tipo' => $r['c4025_t'], 'valor' => $r['c4025_v']], '4036' => ['tipo' => $r['c4036_t'], 'valor' => $r['c4036_v']]]];
            }
            $f['pipedrive'] = ['estado' => 'ok', 'campo_4038' => $kPrec !== null, 'ultimo_sync' => $this->pipe->query("SELECT DATE_FORMAT(MAX(last_synced_at), '%Y-%m-%dT%H:%i:%s') FROM pipe_organizations")->fetchColumn() ?: null];
        } catch (Throwable $e) { error_log('[cadastro] pipedrive: ' . get_class($e)); }
        if ($this->rds !== null && $comRds) {
            try {
                $this->rds->exec('SET SESSION TRANSACTION READ ONLY');
                foreach ($this->paginas("SELECT o.entity_id AS k, o.cnpj, o.company_name, o.trade_name, c.id AS cliente FROM `ds_prod`.`pty_organization` o LEFT JOIN `ds_prod`.`pty_customer` c ON c.entity_id = o.entity_id WHERE COALESCE(o.deleted, 0) = 0 AND o.entity_id > ? ORDER BY o.entity_id LIMIT ?", 0) as $r) {
                    $d = PreviaCadastral::doc($r['cnpj']);
                    if (PreviaCadastral::cnpjValido($d)) $prec[$d][] = ['id' => (string) ($r['cliente'] ?? ''), 'razao' => $r['company_name'], 'fantasia' => $r['trade_name']];
                    if ($r['cliente'] !== null) $pc[(string) $r['cliente']] = $d;
                }
                $f['precifica'] = ['estado' => 'ok', 'lido_em' => gmdate('Y-m-d\TH:i:s\Z')];
            } catch (Throwable $e) { error_log('[cadastro] precifica: ' . get_class($e)); }
            try {
                foreach ($this->paginas("SELECT cnpj AS k, cnpj, razao_social, nome_fantasia, json_completo, DATE_FORMAT(data_consulta_api, '%Y-%m-%d') AS em FROM `consultar_io`.`cnpj_detalhes` WHERE cnpj > ? ORDER BY cnpj LIMIT ?", '') as $r) {
                    $d = PreviaCadastral::doc($r['cnpj']); $pad = false;
                    if (preg_match('/^\d{12,13}$/', $d)) { $d = str_pad($d, 14, '0', STR_PAD_LEFT); $pad = true; }
                    $j = json_decode((string) $r['json_completo'], true); $jc = is_array($j) ? PreviaCadastral::doc((string) ($j['cnpj'] ?? '')) : null;
                    if ($pad && $jc !== $d) continue;   // zeros recompostos SÓ com a confirmação do JSON
                    if (!PreviaCadastral::cnpjValido($d) || isset($leg[$d])) continue;
                    $leg[$d] = ['razao' => $r['razao_social'], 'fantasia' => $r['nome_fantasia'], 'json_cnpj' => $jc, 'json_razao' => is_array($j) ? ($j['razao_social'] ?? null) : null,
                                'json_fantasia' => is_array($j) ? ($j['nome_fantasia'] ?? null) : null, 'consultado_em' => $r['em']];
                }
                $f['legado'] = ['estado' => 'ok', 'lido_em' => gmdate('Y-m-d\TH:i:s\Z')];
            } catch (Throwable $e) { error_log('[cadastro] legado: ' . get_class($e)); }
        }
        return ['orgs' => $orgs, 'prec' => $prec, 'precCliente' => $pc, 'leg' => $leg, 'fontes' => $f];
    }

    /** Leitura em PÁGINAS por chave (keyset; cada página é uma consulta curta, dentro do teto de 4 s do RDS). */
    private function paginas(string $sql, int|string $inicio): Generator
    {
        $tam = max(1, $this->pagina); $st = $this->rds->prepare($sql); $k = $inicio;
        while (true) {
            $st->bindValue(1, $k, is_int($k) ? PDO::PARAM_INT : PDO::PARAM_STR); $st->bindValue(2, $tam, PDO::PARAM_INT); $st->execute();
            $rows = $st->fetchAll(PDO::FETCH_ASSOC); if ($rows === []) return;
            foreach ($rows as $r) yield $r;
            if (count($rows) < $tam) return;
            $k = is_int($inicio) ? (int) end($rows)['k'] : (string) end($rows)['k'];
        }
    }

    /**
     * Revalidação DIRECIONADA de UMA linha (ajuste do arquiteto: nunca a prévia inteira por clique). Pipedrive local (barato) para a ficha e as do mesmo
     * CNPJ; no RDS, só consultas pelo CNPJ/cliente da linha, com o teto de 4 s. Mesma semântica do montar (mesmo núcleo).
     * @return string 'ok' | 'mudou' | 'indisponivel'
     */
    public function revalidar(array $x): string
    {
        try {
            $f = $this->fontes(false);
            if (($f['fontes']['pipedrive']['estado'] ?? '') !== 'ok') return 'indisponivel';
            $d = (string) $x['cnpj']; $alvo = null; foreach ($f['orgs'] as $o) if ($o['id'] === (int) $x['org_id']) $alvo = $o;
            if ($alvo === null) return 'mudou';
            if ($x['fila'] === 'sem_cnpj_id_precifica') {   // CNPJ proposto pelo cliente do Precifica da ficha; quem mais o reivindica
                $st = $this->rds->prepare("SELECT c.id FROM `ds_prod`.`pty_customer` c JOIN `ds_prod`.`pty_organization` o ON o.entity_id = c.entity_id AND COALESCE(o.deleted, 0) = 0
                                            WHERE c.id = ? OR REPLACE(REPLACE(REPLACE(o.cnpj, '.', ''), '/', ''), '-', '') = ?");
                $st->execute([trim((string) $alvo['idprec']), $d]); $ids = array_map('strval', $st->fetchAll(PDO::FETCH_COLUMN));
                $orgs = array_values(array_filter($f['orgs'], fn($o) => in_array(trim((string) $o['idprec']), $ids, true) || PreviaCadastral::doc($o['doc']) === $d || $o['id'] === $alvo['id']));
            } else {
                $orgs = array_values(array_filter($f['orgs'], fn($o) => PreviaCadastral::doc($o['doc']) === $d));
            }
            [$prec, $pc, $leg] = $this->fontesDoCnpj($d, array_values(array_unique(array_filter(array_map(fn($o) => trim((string) $o['idprec']), $orgs)))));
            $fontes = $f['fontes']; $fontes['precifica'] = ['estado' => 'ok']; $fontes['legado'] = ['estado' => 'ok'];
            $r = PreviaCadastral::montar($orgs, $prec, $pc, $leg, $fontes, [$x['fila']], 'agora');
            foreach ($r['linhas'] as $l) if ($l['org_id'] === (int) $x['org_id'] && $l['campo'] === $x['campo']) return $l['evidencia_versao'] === $x['evidencia_versao'] ? 'ok' : 'mudou';
            return 'mudou';
        } catch (Throwable $e) {
            error_log('[cadastro] revalidar: ' . get_class($e));
            return 'indisponivel';   // falha transitória: 503, a decisão já tomada NÃO é invalidada
        }
    }

    /** Precifica e legado SÓ do CNPJ (e dos clientes) da linha — consultas direcionadas, teto de 4 s cada. */
    private function fontesDoCnpj(string $d, array $clientes): array
    {
        $prec = []; $pc = []; $leg = [];
        $in = $clientes === [] ? 'NULL' : implode(',', array_fill(0, count($clientes), '?'));
        $st = $this->rds->prepare("SELECT o.cnpj, o.company_name, o.trade_name, c.id AS cliente FROM `ds_prod`.`pty_organization` o LEFT JOIN `ds_prod`.`pty_customer` c ON c.entity_id = o.entity_id
                                    WHERE COALESCE(o.deleted, 0) = 0 AND (REPLACE(REPLACE(REPLACE(o.cnpj, '.', ''), '/', ''), '-', '') = ? OR c.id IN ($in))");
        $st->execute(array_merge([$d], $clientes));
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $dd = PreviaCadastral::doc($r['cnpj']);
            if (PreviaCadastral::cnpjValido($dd)) $prec[$dd][] = ['id' => (string) ($r['cliente'] ?? ''), 'razao' => $r['company_name'], 'fantasia' => $r['trade_name']];
            if ($r['cliente'] !== null) $pc[(string) $r['cliente']] = $dd;
        }
        $alvos = array_values(array_unique(array_filter(array_merge([$d], array_values($pc)), fn($v) => $v !== '')));
        foreach ($alvos as $dd) {
            $st = $this->rds->prepare("SELECT cnpj, razao_social, nome_fantasia, json_completo, DATE_FORMAT(data_consulta_api, '%Y-%m-%d') AS em FROM `consultar_io`.`cnpj_detalhes` WHERE cnpj IN (?, ?) ORDER BY cnpj DESC");
            $st->execute([$dd, ltrim($dd, '0')]);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $j = json_decode((string) $r['json_completo'], true); $jc = is_array($j) ? PreviaCadastral::doc((string) ($j['cnpj'] ?? '')) : null;
                if (PreviaCadastral::doc($r['cnpj']) !== $dd && $jc !== $dd) continue;   // zeros recompostos só com a confirmação do JSON
                $leg[$dd] ??= ['razao' => $r['razao_social'], 'fantasia' => $r['nome_fantasia'], 'json_cnpj' => $jc, 'json_razao' => is_array($j) ? ($j['razao_social'] ?? null) : null,
                               'json_fantasia' => is_array($j) ? ($j['nome_fantasia'] ?? null) : null, 'consultado_em' => $r['em']];
            }
        }
        return [$prec, $pc, $leg];
    }

    public function decididas(): array
    {
        $out = []; if ($this->rds === null) return $out;
        foreach ($this->rds->query("SELECT DISTINCT evidencia_versao FROM `consultar_io`.`revisao_decisao` WHERE expirada = 0")->fetchAll(PDO::FETCH_COLUMN) as $e) $out[(string) $e] = true;
        return $out;
    }

    public function salvar(array $r, array $filas, int $operador): void
    {
        $this->rds->exec('SET SESSION TRANSACTION READ WRITE');
        $this->rds->beginTransaction();
        try {
            $l = $r['lote'];
            $this->rds->prepare("INSERT INTO `consultar_io`.`revisao_lote` (id, regras_versao, gerado_em, filas, completa, fontes_json, resumo_json, operador) VALUES (?,?,?,?,?,?,?,?)")
                ->execute([$l['id'], $l['regras_versao'], gmdate('Y-m-d H:i:s'), implode(',', $filas), $l['completa'] ? 1 : 0, json_encode($l['fontes']), json_encode($l, JSON_UNESCAPED_UNICODE), $operador]);
            $st = $this->rds->prepare("INSERT INTO `consultar_io`.`revisao_linha` (lote_id, linha_id, fila, org_id, cnpj, campo, classificacao, pre_selecionada, evidencia_versao, ultimo_ganho, linha_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            foreach ($r['linhas'] as $x) $st->execute([$l['id'], $x['id'], $x['fila'], $x['org_id'], $x['cnpj'] !== '' ? $x['cnpj'] : null, $x['campo'], $x['classificacao'], $x['pre_selecionada'] ? 1 : 0,
                                                       $x['evidencia_versao'], $x['ultimo_ganho'], json_encode($x, JSON_UNESCAPED_UNICODE)]);
            $this->rds->commit();
        } catch (Throwable $e) { $this->rds->rollBack(); throw $e; }
    }

    public function lote(?string $id): ?array
    {
        $st = $id === null ? $this->rds->query("SELECT resumo_json FROM `consultar_io`.`revisao_lote` ORDER BY gerado_em DESC, id DESC LIMIT 1")
                           : $this->rds->prepare("SELECT resumo_json FROM `consultar_io`.`revisao_lote` WHERE id = ?");
        if ($id !== null) $st->execute([$id]);
        $v = $st->fetchColumn(); return $v === false ? null : json_decode((string) $v, true);
    }

    /** @param array{filtro:?string, campo:?string, fila:?string, busca:?string, pagina:int, por_pagina:int} $q */
    public function linhas(string $lote, array $q): array
    {
        $st = $this->rds->prepare("SELECT l.linha_json, d.decisao, d.grafia, d.origem, d.operador, d.em, d.expirada FROM `consultar_io`.`revisao_linha` l
             LEFT JOIN `consultar_io`.`revisao_decisao` d ON d.id = (SELECT MAX(id) FROM `consultar_io`.`revisao_decisao` x WHERE x.lote_id = l.lote_id AND x.linha_id = l.linha_id)
             WHERE l.lote_id = ? ORDER BY l.ultimo_ganho DESC, l.cnpj, l.org_id, l.campo");
        $st->execute([$lote]); $todos = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $x = json_decode((string) $r['linha_json'], true);
            $x['decisao'] = $r['decisao'] === null ? null : ['decisao' => $r['decisao'], 'grafia' => $r['grafia'], 'origem' => $r['origem'], 'operador' => (int) $r['operador'], 'em' => $r['em'], 'expirada' => (bool) $r['expirada']];
            $c = $x['classificacao'];
            $passa = match ($q['filtro'] ?? null) { 'com_sugestao' => $c === 'sugestao', 'divergem' => $c === 'fontes_divergem', 'sem_valor' => str_starts_with($c, 'sem_valor'),
                'consulta_paga' => $c === 'sem_valor_legado_ausente', 'revisar' => in_array($c, ['nome_para_razao_revisar', 'fontes_divergem'], true), default => true };
            if ($passa && ($q['campo'] ?? null) !== null) $passa = $x['campo'] === $q['campo'];
            if ($passa && ($q['fila'] ?? null) !== null) $passa = $x['fila'] === $q['fila'];
            if ($passa && ($q['busca'] ?? '') !== '') $passa = str_contains(mb_strtoupper(($x['empresa'] ?? '') . ' ' . $x['cnpj'] . ' ' . $x['org_id']), mb_strtoupper((string) $q['busca']));
            if ($passa) $todos[] = $x;
        }
        $pp = max(1, min(200, $q['por_pagina'])); $pg = max(1, $q['pagina']);
        return ['lote' => $lote, 'total' => count($todos), 'pagina' => $pg, 'por_pagina' => $pp, 'itens' => array_slice($todos, ($pg - 1) * $pp, $pp)];
    }

    /** Grava a decisão. A evidência informada tem de ser a da linha no lote E a do retrato atual (senão: evidencia_mudou, seleção expirada). */
    public function decidir(string $lote, string $linha, string $ev, string $decisao, ?string $grafia, ?string $origem, int $operador, callable $evidenciaAtual): array
    {
        $st = $this->rds->prepare("SELECT linha_json FROM `consultar_io`.`revisao_linha` WHERE lote_id = ? AND linha_id = ?"); $st->execute([$lote, $linha]);
        $x = $st->fetchColumn(); if ($x === false) return ['http' => 404, 'code' => 'NOT_FOUND'];
        $x = json_decode((string) $x, true);
        if ($decisao === 'aprovar' && !PreviaCadastral::aprovavel($x)) return ['http' => 409, 'code' => 'aprovacao_bloqueada'];   // F11/F12: grafia nunca libera identidade bloqueada
        $est = $x['evidencia_versao'] === $ev ? $evidenciaAtual($x) : 'mudou';
        if ($est === 'indisponivel') return ['http' => 503, 'code' => 'dados_indisponiveis'];   // transitório: NÃO invalida decisão já tomada
        if ($est !== 'ok') {
            $this->rds->exec('SET SESSION TRANSACTION READ WRITE');
            $this->rds->prepare("UPDATE `consultar_io`.`revisao_decisao` SET expirada = 1 WHERE lote_id = ? AND linha_id = ?")->execute([$lote, $linha]);
            return ['http' => 409, 'code' => 'evidencia_mudou'];
        }
        if ($decisao === 'aprovar') {
            $ok = false; foreach ($x['grafias'] as $g) if ($g['valor'] === $grafia && $g['origem'] === $origem) $ok = true;
            if (!$ok) return ['http' => 400, 'code' => 'grafia_invalida'];   // só a grafia que o Jhony VIU
        }
        $this->rds->exec('SET SESSION TRANSACTION READ WRITE');
        $this->rds->prepare("INSERT INTO `consultar_io`.`revisao_decisao` (lote_id, linha_id, evidencia_versao, decisao, grafia, origem, operador, em) VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP())")
            ->execute([$lote, $linha, $ev, $decisao, $decisao === 'aprovar' ? $grafia : null, $decisao === 'aprovar' ? $origem : null, $operador]);
        return ['http' => 200, 'data' => ['decisao' => $decisao, 'grafia' => $decisao === 'aprovar' ? $grafia : null, 'origem' => $decisao === 'aprovar' ? $origem : null, 'operador' => $operador, 'em' => gmdate('c'), 'expirada' => false]];
    }

    public function selecao(string $lote): array
    {
        $st = $this->rds->prepare("SELECT d.linha_id, l.org_id, l.campo, d.grafia FROM `consultar_io`.`revisao_decisao` d JOIN `consultar_io`.`revisao_linha` l ON l.lote_id = d.lote_id AND l.linha_id = d.linha_id
             WHERE d.lote_id = ? AND d.expirada = 0 AND d.decisao = 'aprovar' AND d.id = (SELECT MAX(id) FROM `consultar_io`.`revisao_decisao` x WHERE x.lote_id = d.lote_id AND x.linha_id = d.linha_id) ORDER BY l.org_id, l.campo");
        $st->execute([$lote]); $it = $st->fetchAll(PDO::FETCH_ASSOC);
        return ['campos' => count($it), 'estabelecimentos' => count(array_unique(array_column($it, 'org_id'))), 'itens' => array_map(fn($r) => ['linha' => $r['linha_id'], 'org_id' => (int) $r['org_id'], 'campo' => $r['campo'], 'grafia' => $r['grafia']], $it)];
    }
}
