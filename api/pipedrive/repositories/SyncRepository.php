<?php
// Pipedrive / SyncRepository - persistencia das entidades sincronizadas (PIPE_DSHOW)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Upserts idempotentes por pipedrive_id (indice uq_pd). Guarda o payload cru em
// raw_payload (mitiga schema/field drift) e o maior update_time em pipe_sync_cursors
// (marca-d'agua incremental — NUNCA guardar o cursor efemero da v2 como marca).
declare(strict_types=1);

final class PipeSyncRepository
{
    private PDO $pdo;
    /** @var array<string,array<string,array>> defs de campos personalizados por entidade (cache) */
    private array $cfDefsCache = [];
    /** @var array<int,array<string,string>> rotulos de opcoes por field_id (cache) */
    private array $cfOptCache = [];

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ── Campos personalizados: resolucao hash->nome e id-opcao->rotulo ──
    private function customFieldDefs(string $entity): array
    {
        if (isset($this->cfDefsCache[$entity])) { return $this->cfDefsCache[$entity]; }
        $st = $this->pdo->prepare(
            "SELECT id, field_key, name, field_type FROM pipe_custom_fields
             WHERE entity = ? AND CHAR_LENGTH(field_key) = 40 AND is_active = 1"
        );
        $st->execute([$entity]);
        $defs = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $defs[$r['field_key']] = ['id' => (int)$r['id'], 'name' => $r['name'], 'type' => $r['field_type']];
        }
        return $this->cfDefsCache[$entity] = $defs;
    }

    private function optionLabels(int $fieldId): array
    {
        if (isset($this->cfOptCache[$fieldId])) { return $this->cfOptCache[$fieldId]; }
        $st = $this->pdo->prepare("SELECT option_id, label FROM pipe_custom_field_options WHERE field_id = ?");
        $st->execute([$fieldId]);
        $map = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) { $map[(string)$r['option_id']] = $r['label']; }
        return $this->cfOptCache[$fieldId] = $map;
    }

    /** Resolve o JSON custom_fields de um registro em [{name, value}] com nomes/rotulos reais. */
    public function resolveCustomFields(string $entity, $customFields): array
    {
        $cf = is_array($customFields) ? $customFields : json_decode((string)$customFields, true);
        if (!is_array($cf)) { return []; }
        $defs = $this->customFieldDefs($entity);
        $out = [];
        foreach ($cf as $key => $val) {
            if (!isset($defs[$key]) || $val === null || $val === '' || $val === []) { continue; }
            $def = $defs[$key];
            $label = $this->formatCfValue($def, $val);
            if ($label === null || $label === '') { continue; }
            $out[] = ['name' => $def['name'], 'value' => $label];
        }
        return $out;
    }

    // ── Campos personalizados como COLUNAS de grid (#11) ────────────
    //
    // ⚠️ `pipe_custom_fields` NAO e um catalogo so de campos personalizados: e o espelho
    // de `dealFields`/`personFields` da API, que traz os NATIVOS junto (`id`, `add_time`,
    // `currency`, `label`...). O personalizado se distingue pela chave: hash de 40 chars.
    // Sem esse filtro o seletor de colunas ofereceria "Etiqueta" e "Moeda" como se fossem
    // campos customizados, duplicando colunas que o grid ja tem. Contado hoje: deal 26
    // personalizados (48 nativos), person 14 (43), organization 15 (38), product 10 (14),
    // activity 0 — e `pipe_activities.custom_fields` e 0% preenchida, entao atividade fica
    // de fora por AUSENCIA DE DADO, nao por esquecimento.
    private const CF_ENTIDADES = ['deal', 'person', 'organization', 'product'];

    /** Tabela que guarda o JSON de cada entidade — usado pela contagem de cobertura. */
    private const CF_TABELA = [
        'deal' => 'pipe_deals', 'person' => 'pipe_persons',
        'organization' => 'pipe_organizations', 'product' => 'pipe_products',
    ];

    public static function cfEntidadeValida(string $entity): bool
    {
        return in_array($entity, self::CF_ENTIDADES, true);
    }

    /**
     * Traduz o `cf=` do cliente em chaves REAIS da entidade. O valor do usuario apenas
     * ESCOLHE entre as chaves do catalogo; nada dele chega ao SQL como texto. Chave
     * desconhecida e descartada — e a resposta declara quais valeram (`cf_aplicados`),
     * para a UI nunca mostrar uma coluna que o backend ignorou.
     * @return string[] chaves na ordem pedida, sem repetir
     */
    public function cfKeysValidas(string $entity, $pedido): array
    {
        if (!self::cfEntidadeValida($entity) || !is_string($pedido) || trim($pedido) === '') { return []; }
        $defs = $this->customFieldDefs($entity);
        $out  = [];
        foreach (explode(',', $pedido) as $k) {
            $k = trim($k);
            if ($k !== '' && isset($defs[$k]) && !in_array($k, $out, true)) { $out[] = $k; }
        }
        return array_slice($out, 0, 12);   // teto: 12 colunas extras ja e mais do que cabe na tela
    }

    /**
     * Valores formatados APENAS das chaves pedidas. Reusa o mesmo `formatCfValue` dos
     * drawers — se o rotulo de um `enum` mudar, muda nos dois lugares de uma vez.
     * @return array<string,string> chave => valor pronto para exibir
     */
    public function cfSubset(string $entity, $customFields, array $keys): array
    {
        if (!$keys) { return []; }
        $cf = is_array($customFields) ? $customFields : json_decode((string)$customFields, true);
        if (!is_array($cf)) { return []; }
        $defs = $this->customFieldDefs($entity);
        $out  = [];
        foreach ($keys as $k) {
            $val = $cf[$k] ?? null;
            if (!isset($defs[$k]) || $val === null || $val === '' || $val === []) { continue; }
            $txt = $this->formatCfValue($defs[$k], $val);
            if ($txt !== null && $txt !== '') { $out[$k] = $txt; }
        }
        return $out;
    }

    /**
     * Catalogo dos personalizados COM cobertura real — quantos registros têm o campo
     * preenchido. Sem esse número o usuário adiciona uma coluna e só descobre que ela é
     * vazia depois de olhar a tela: dos campos de 'deal', 3 passam de 80% e 11 ficam
     * abaixo de 1%.
     *
     * ⚠️ `JSON_LENGTH(x) > 0` NAO serve para detectar preenchimento (num JSON `null`
     * devolve 1, o que daria 100% de cobertura falsa — a armadilha que o #31 pagou).
     * O teste correto é `JSON_TYPE(...) <> 'NULL'` sobre o valor extraído.
     *
     * Uma única query agregada com um SUM por campo (~254 ms nos 20k negócios), chamada
     * ao abrir o seletor de colunas — nunca por página do grid.
     */
    public function customFieldsCobertura(string $entity): array
    {
        if (!self::cfEntidadeValida($entity)) { return ['base' => 0, 'campos' => []]; }
        $defs = $this->customFieldDefs($entity);
        if (!$defs) { return ['base' => 0, 'campos' => []]; }
        $tab = self::CF_TABELA[$entity];

        $sel = [];
        $keys = array_keys($defs);
        foreach ($keys as $i => $k) {
            // $k vem do catalogo (char(40) validado como hash na propria consulta de defs),
            // nunca do cliente — por isso pode ser interpolado no caminho do JSON.
            $sel[] = "SUM(JSON_EXTRACT(custom_fields, '$.\"{$k}\"') IS NOT NULL"
                   . " AND JSON_TYPE(JSON_EXTRACT(custom_fields, '$.\"{$k}\"')) <> 'NULL') c{$i}";
        }
        $sqlDel = in_array($entity, ['deal', 'person', 'organization'], true) ? ' WHERE is_deleted = 0' : '';
        $row = $this->pdo->query(
            "SELECT COUNT(*) base, " . implode(', ', $sel) . " FROM `{$tab}`{$sqlDel}"
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $base = (int)($row['base'] ?? 0);
        $campos = [];
        foreach ($keys as $i => $k) {
            $n = (int)($row["c{$i}"] ?? 0);
            $campos[] = [
                'key'         => $k,
                'name'        => $defs[$k]['name'],
                'type'        => $defs[$k]['type'],
                'preenchidos' => $n,
                'cobertura'   => $base > 0 ? round($n * 100 / $base, 1) : 0.0,
            ];
        }
        // Mais preenchidos primeiro: a ordem do catalogo (order_nr) nao diz nada sobre utilidade.
        usort($campos, static fn($a, $b) => $b['preenchidos'] <=> $a['preenchidos']);
        return ['base' => $base, 'campos' => $campos];
    }

    private function formatCfValue(array $def, $val): ?string
    {
        if (in_array($def['type'], ['enum', 'set'], true)) {
            $opts = $this->optionLabels($def['id']);
            $ids = is_array($val) ? $val : [$val];
            $labels = array_map(static fn($id) => $opts[(string)$id] ?? ('#' . $id), $ids);
            return implode(', ', $labels);
        }
        if (is_array($val)) {
            $partes = array_filter(array_map('strval', $val), static fn($x) => $x !== '');
            return $partes ? implode(' – ', $partes) : null;
        }
        return trim((string)$val);
    }

    // ── helpers de normalizacao ─────────────────────────────────
    /** RFC3339/ISO (UTC, com Z) -> 'Y-m-d H:i:s' para colunas DATETIME. null-safe. */
    public static function dt($v): ?string
    {
        if (!is_string($v) || $v === '') { return null; }
        $s = str_replace('T', ' ', trim($v));
        $s = preg_replace('/(\.\d+)?Z?$/', '', $s); // tira fracao e Z
        $s = substr($s, 0, 19);
        // Data-zero do Pipedrive ('0000-00-00'...) e invalida no MySQL estrito -> NULL.
        if ($s === '' || strpos($s, '0000-00-00') === 0) { return null; }
        return $s;
    }

    /** Coluna DATE (YYYY-MM-DD). Trata data-zero/vazia do Pipedrive como NULL. */
    private static function dateOrNull($v): ?string
    {
        $s = self::s($v);
        if ($s === null || strpos($s, '0000-00-00') === 0) { return null; }
        return substr($s, 0, 10) ?: null;
    }

    private static function s($v): ?string { return (is_scalar($v) && $v !== '') ? (string)$v : null; }
    private static function i($v): ?int { return is_numeric($v) ? (int)$v : null; }
    private static function f($v): ?float { return is_numeric($v) ? (float)$v : null; }

    // ── cursores / marca-d'agua ─────────────────────────────────
    public function getCursor(string $entity): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM pipe_sync_cursors WHERE entity = ?");
        $st->execute([$entity]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /** Avanca a marca-d'agua para o maior update_time visto (se maior que o atual). */
    public function bumpWatermark(string $entity, ?string $maxUpdateTime): void
    {
        if ($maxUpdateTime === null) { return; }
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_sync_cursors (entity, watermark_update_time)
             VALUES (:e, :w)
             ON DUPLICATE KEY UPDATE
               watermark_update_time = GREATEST(COALESCE(watermark_update_time, '1970-01-01'), VALUES(watermark_update_time)),
               updated_at = NOW()"
        );
        $st->execute([':e' => $entity, ':w' => $maxUpdateTime]);
    }

    public function markFullSync(string $entity): void
    {
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_sync_cursors (entity, last_full_sync_at) VALUES (:e, NOW())
             ON DUPLICATE KEY UPDATE last_full_sync_at = NOW(), updated_at = NOW()"
        );
        $st->execute([':e' => $entity]);
    }

    // ── runs (auditoria de cada rodada) ─────────────────────────
    public function startRun(string $runType, ?string $entity): int
    {
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_sync_runs (run_type, entity, started_at, status)
             VALUES (:t, :e, NOW(), 'running')"
        );
        $st->execute([':t' => $runType, ':e' => $entity]);
        return (int)$this->pdo->lastInsertId();
    }

    public function finishRun(int $id, array $st, string $status): void
    {
        $q = $this->pdo->prepare(
            "UPDATE pipe_sync_runs SET
               finished_at = NOW(), status = :s,
               processed = :p, created = :c, updated = :u, skipped = :k,
               marked_deleted = :d, errors = :er, api_calls = :a, token_cost = :tc
             WHERE id = :id"
        );
        $q->execute([
            ':s' => $status,
            ':p' => (int)($st['processed'] ?? 0),
            ':c' => (int)($st['created'] ?? 0),
            ':u' => (int)($st['updated'] ?? 0),
            ':k' => (int)($st['skipped'] ?? 0),
            ':d' => (int)($st['marked_deleted'] ?? 0),
            ':er' => (int)($st['errors'] ?? 0),
            ':a' => (int)($st['api_calls'] ?? 0),
            ':tc' => (int)($st['token_cost'] ?? 0),
            ':id' => $id,
        ]);
    }

    /** 'created' | 'updated' a partir do affected-rows do ON DUPLICATE KEY. */
    private static function outcome(PDOStatement $st): string
    {
        return $st->rowCount() === 1 ? 'created' : 'updated';
    }

    // ── upserts por entidade ────────────────────────────────────
    public function upsertPipeline(array $p): string
    {
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_pipelines
               (pipedrive_id, name, order_nr, is_active, add_time, update_time, raw_payload, last_synced_at)
             VALUES (:pd, :name, :ord, :act, :add, :upd, :raw, NOW())
             ON DUPLICATE KEY UPDATE
               name=VALUES(name), order_nr=VALUES(order_nr), is_active=VALUES(is_active),
               add_time=VALUES(add_time), update_time=VALUES(update_time),
               raw_payload=VALUES(raw_payload), last_synced_at=NOW()"
        );
        $st->execute([
            ':pd' => self::i($p['id']),
            ':name' => self::s($p['name'] ?? null),
            ':ord' => self::i($p['order_nr'] ?? null),
            ':act' => !empty($p['is_deleted']) ? 0 : 1,
            ':add' => self::dt($p['add_time'] ?? null),
            ':upd' => self::dt($p['update_time'] ?? null),
            ':raw' => json_encode($p, JSON_UNESCAPED_UNICODE),
        ]);
        return self::outcome($st);
    }

    /**
     * Catalogo de tipos de atividade. A tabela existia no schema desde o inicio e NUNCA foi
     * populada por ninguem (0 linhas), por isso o filtro de tipos da tela de Atividades mostrava
     * a CHAVE crua em vez do nome.
     *
     * ⚠️ O nome so existe aqui — nao da para derivar da chave. A chave `instalao_` corresponde a
     * "Acompanhamento Instalação": a origem perdeu os acentos e truncou em 26 caracteres. Qualquer
     * tentativa de "embelezar" a chave no front produziria "Instalao ".
     *
     * ⚠️ `/v1/activityTypes` NAO e paginado (devolve o array inteiro, sem `additional_data`). O
     * `paginate()` do client encerra na 1a pagina justamente por falta de `more_items_in_collection`,
     * entao passar por `syncEntity()` e seguro e ganha a contabilidade de run de graca.
     */
    public function upsertActivityType(array $t): string
    {
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_activity_types
               (pipedrive_id, name, key_string, icon_key, color, is_active, raw_payload, last_synced_at)
             VALUES (:pd, :name, :key, :icon, :color, :act, :raw, NOW())
             ON DUPLICATE KEY UPDATE
               name=VALUES(name), key_string=VALUES(key_string), icon_key=VALUES(icon_key),
               color=VALUES(color), is_active=VALUES(is_active), raw_payload=VALUES(raw_payload),
               last_synced_at=NOW()"
        );
        $st->execute([
            ':pd'    => self::i($t['id']),
            ':name'  => self::s($t['name'] ?? null),
            ':key'   => self::s($t['key_string'] ?? null),
            ':icon'  => self::s($t['icon_key'] ?? null),
            ':color' => self::s($t['color'] ?? null),
            // ⚠️ Aqui o campo da API e `active_flag`, NAO `is_deleted` como nas outras entidades.
            ':act'   => array_key_exists('active_flag', $t) ? (int)!empty($t['active_flag']) : 1,
            ':raw'   => json_encode($t, JSON_UNESCAPED_UNICODE),
        ]);
        return $st->rowCount() === 1 ? 'created' : 'updated';
    }

    public function upsertStage(array $s): string
    {
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_stages
               (pipedrive_id, pipeline_pd_id, name, order_nr, deal_probability, is_active,
                add_time, update_time, raw_payload, last_synced_at)
             VALUES (:pd, :pl, :name, :ord, :prob, :act, :add, :upd, :raw, NOW())
             ON DUPLICATE KEY UPDATE
               pipeline_pd_id=VALUES(pipeline_pd_id), name=VALUES(name), order_nr=VALUES(order_nr),
               deal_probability=VALUES(deal_probability), is_active=VALUES(is_active),
               add_time=VALUES(add_time), update_time=VALUES(update_time),
               raw_payload=VALUES(raw_payload), last_synced_at=NOW()"
        );
        $st->execute([
            ':pd' => self::i($s['id']),
            ':pl' => self::i($s['pipeline_id'] ?? null),
            ':name' => self::s($s['name'] ?? null),
            ':ord' => self::i($s['order_nr'] ?? null),
            ':prob' => self::f($s['deal_probability'] ?? null),
            ':act' => !empty($s['is_deleted']) ? 0 : 1,
            ':add' => self::dt($s['add_time'] ?? null),
            ':upd' => self::dt($s['update_time'] ?? null),
            ':raw' => json_encode($s, JSON_UNESCAPED_UNICODE),
        ]);
        return self::outcome($st);
    }

    public function upsertUser(array $u): string
    {
        // v1 /users: active_flag, timezone_name, created/modified, last_login
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_users
               (pipedrive_id, company_id, name, email, phone, role_id, is_active, lang, timezone,
                icon_url, last_login, add_time, modified, raw_payload, last_synced_at)
             VALUES (:pd, :co, :name, :em, :ph, :role, :act, :lang, :tz, :icon, :ll, :add, :mod, :raw, NOW())
             ON DUPLICATE KEY UPDATE
               company_id=VALUES(company_id), name=VALUES(name), email=VALUES(email), phone=VALUES(phone),
               role_id=VALUES(role_id), is_active=VALUES(is_active), lang=VALUES(lang), timezone=VALUES(timezone),
               icon_url=VALUES(icon_url), last_login=VALUES(last_login), add_time=VALUES(add_time),
               modified=VALUES(modified), raw_payload=VALUES(raw_payload), last_synced_at=NOW()"
        );
        $st->execute([
            ':pd' => self::i($u['id']),
            ':co' => self::i($u['company_id'] ?? null),
            ':name' => self::s($u['name'] ?? null),
            ':em' => self::s($u['email'] ?? null),
            ':ph' => self::s($u['phone'] ?? null),
            ':role' => self::i($u['role_id'] ?? null),
            ':act' => array_key_exists('active_flag', $u) ? (int)!empty($u['active_flag']) : 1,
            ':lang' => self::s(is_array($u['language'] ?? null) ? ($u['language']['language_code'] ?? null) : ($u['lang'] ?? null)),
            ':tz' => self::s($u['timezone_name'] ?? null),
            ':icon' => self::s($u['icon_url'] ?? null),
            ':ll' => self::dt($u['last_login'] ?? null),
            ':add' => self::dt($u['created'] ?? null),
            ':mod' => self::dt($u['modified'] ?? null),
            ':raw' => json_encode($u, JSON_UNESCAPED_UNICODE),
        ]);
        return self::outcome($st);
    }

    public function upsertDeal(array $d, ?int $companyId = null): string
    {
        $status = $d['status'] ?? null;
        if (!in_array($status, ['open', 'won', 'lost', 'deleted'], true)) { $status = null; }
        $labels = $d['label_ids'] ?? ($d['label'] ?? null);
        if (is_array($labels)) { $labels = implode(',', array_map('strval', $labels)); }
        $custom = $d['custom_fields'] ?? null;
        $raw = json_encode($d, JSON_UNESCAPED_UNICODE);

        $st = $this->pdo->prepare(
            "INSERT INTO pipe_deals
               (pipedrive_id, company_id, title, value, currency, status, pipeline_id, stage_id,
                person_id, org_id, owner_id, creator_user_id, label_ids, probability,
                expected_close_date, won_time, lost_time, lost_reason, stage_change_time,
                custom_fields, is_deleted, add_time, update_time, source_updated_at,
                raw_payload, payload_hash, last_synced_at)
             VALUES
               (:pd, :co, :title, :val, :cur, :status, :pl, :stage,
                :person, :org, :owner, :creator, :labels, :prob,
                :ecd, :won, :lost, :lostr, :sct,
                :custom, :del, :add, :upd, :upd2,
                :raw, :hash, NOW())
             ON DUPLICATE KEY UPDATE
               company_id=VALUES(company_id), title=VALUES(title), value=VALUES(value), currency=VALUES(currency),
               status=VALUES(status), pipeline_id=VALUES(pipeline_id), stage_id=VALUES(stage_id),
               person_id=VALUES(person_id), org_id=VALUES(org_id), owner_id=VALUES(owner_id),
               creator_user_id=VALUES(creator_user_id), label_ids=VALUES(label_ids), probability=VALUES(probability),
               expected_close_date=VALUES(expected_close_date), won_time=VALUES(won_time), lost_time=VALUES(lost_time),
               lost_reason=VALUES(lost_reason), stage_change_time=VALUES(stage_change_time),
               custom_fields=VALUES(custom_fields), is_deleted=VALUES(is_deleted),
               add_time=VALUES(add_time), update_time=VALUES(update_time), source_updated_at=VALUES(source_updated_at),
               raw_payload=VALUES(raw_payload), payload_hash=VALUES(payload_hash),
               last_synced_at=NOW(), sync_version=sync_version+1"
        );
        $st->execute([
            ':pd' => self::i($d['id']),
            ':co' => $companyId ?? self::i($d['company_id'] ?? null),
            ':title' => self::s($d['title'] ?? null),
            ':val' => self::f($d['value'] ?? null),
            ':cur' => self::s($d['currency'] ?? null),
            ':status' => $status,
            ':pl' => self::i($d['pipeline_id'] ?? null),
            ':stage' => self::i($d['stage_id'] ?? null),
            ':person' => self::i($d['person_id'] ?? null),
            ':org' => self::i($d['org_id'] ?? null),
            ':owner' => self::i($d['owner_id'] ?? null),
            ':creator' => self::i($d['creator_user_id'] ?? null),
            ':labels' => self::s($labels),
            ':prob' => self::f($d['probability'] ?? null),
            ':ecd' => self::dateOrNull($d['expected_close_date'] ?? null),
            ':won' => self::dt($d['won_time'] ?? null),
            ':lost' => self::dt($d['lost_time'] ?? null),
            ':lostr' => self::s($d['lost_reason'] ?? null),
            ':sct' => self::dt($d['stage_change_time'] ?? null),
            ':custom' => $custom !== null ? json_encode($custom, JSON_UNESCAPED_UNICODE) : null,
            ':del' => !empty($d['is_deleted']) ? 1 : 0,
            ':add' => self::dt($d['add_time'] ?? null),
            ':upd' => self::dt($d['update_time'] ?? null),
            ':upd2' => self::dt($d['update_time'] ?? null),
            ':raw' => $raw,
            ':hash' => hash('sha256', $raw),
        ]);
        return self::outcome($st);
    }

    public function upsertOrganization(array $o): string
    {
        $addr = $o['address'] ?? null;
        $addrStr = is_array($addr) ? ($addr['value'] ?? null) : $addr;
        $labels = $o['label_ids'] ?? null;
        if (is_array($labels)) { $labels = implode(',', array_map('strval', $labels)); }
        $raw = json_encode($o, JSON_UNESCAPED_UNICODE);
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_organizations
               (pipedrive_id, company_id, name, address, city, state, country, postal_code,
                owner_id, creator_user_id, label_ids, custom_fields, is_deleted,
                add_time, update_time, source_updated_at, raw_payload, payload_hash, last_synced_at)
             VALUES (:pd,:co,:name,:addr,:city,:state,:country,:zip,:owner,:creator,:labels,:custom,:del,
                     :add,:upd,:upd2,:raw,:hash,NOW())
             ON DUPLICATE KEY UPDATE
               company_id=VALUES(company_id), name=VALUES(name), address=VALUES(address), city=VALUES(city),
               state=VALUES(state), country=VALUES(country), postal_code=VALUES(postal_code),
               owner_id=VALUES(owner_id), creator_user_id=VALUES(creator_user_id), label_ids=VALUES(label_ids),
               custom_fields=VALUES(custom_fields), is_deleted=VALUES(is_deleted),
               add_time=VALUES(add_time), update_time=VALUES(update_time), source_updated_at=VALUES(source_updated_at),
               raw_payload=VALUES(raw_payload), payload_hash=VALUES(payload_hash), last_synced_at=NOW(),
               sync_version=sync_version+1"
        );
        $st->execute([
            ':pd' => self::i($o['id']), ':co' => self::i($o['company_id'] ?? null),
            ':name' => self::s($o['name'] ?? null), ':addr' => self::s($addrStr),
            ':city' => self::s(is_array($addr) ? ($addr['locality'] ?? null) : null),
            ':state' => self::s(is_array($addr) ? ($addr['admin_area_level_1'] ?? null) : null),
            ':country' => self::s(is_array($addr) ? ($addr['country'] ?? null) : null),
            ':zip' => self::s(is_array($addr) ? ($addr['postal_code'] ?? null) : null),
            ':owner' => self::i($o['owner_id'] ?? null), ':creator' => self::i($o['creator_user_id'] ?? null),
            ':labels' => self::s($labels),
            ':custom' => isset($o['custom_fields']) ? json_encode($o['custom_fields'], JSON_UNESCAPED_UNICODE) : null,
            ':del' => !empty($o['is_deleted']) ? 1 : 0,
            ':add' => self::dt($o['add_time'] ?? null), ':upd' => self::dt($o['update_time'] ?? null),
            ':upd2' => self::dt($o['update_time'] ?? null), ':raw' => $raw, ':hash' => hash('sha256', $raw),
        ]);
        return self::outcome($st);
    }

    public function upsertPerson(array $p): string
    {
        $emails = is_array($p['emails'] ?? null) ? $p['emails'] : [];
        $phones = is_array($p['phones'] ?? null) ? $p['phones'] : [];
        $primEmail = self::primaryValue($emails);
        $primPhone = self::primaryValue($phones);
        $labels = $p['label_ids'] ?? null;
        if (is_array($labels)) { $labels = implode(',', array_map('strval', $labels)); }
        $raw = json_encode($p, JSON_UNESCAPED_UNICODE);
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_persons
               (pipedrive_id, company_id, name, org_id, job_title, owner_id, creator_user_id, label_ids,
                primary_email, primary_phone, email_norm, phone_norm, custom_fields, is_deleted,
                add_time, update_time, source_updated_at, raw_payload, payload_hash, last_synced_at)
             VALUES (:pd,:co,:name,:org,:job,:owner,:creator,:labels,:pe,:pp,:en,:pn,:custom,:del,
                     :add,:upd,:upd2,:raw,:hash,NOW())
             ON DUPLICATE KEY UPDATE
               company_id=VALUES(company_id), name=VALUES(name), org_id=VALUES(org_id), job_title=VALUES(job_title),
               owner_id=VALUES(owner_id), creator_user_id=VALUES(creator_user_id), label_ids=VALUES(label_ids),
               primary_email=VALUES(primary_email), primary_phone=VALUES(primary_phone),
               email_norm=VALUES(email_norm), phone_norm=VALUES(phone_norm),
               custom_fields=VALUES(custom_fields), is_deleted=VALUES(is_deleted),
               add_time=VALUES(add_time), update_time=VALUES(update_time), source_updated_at=VALUES(source_updated_at),
               raw_payload=VALUES(raw_payload), payload_hash=VALUES(payload_hash), last_synced_at=NOW(),
               sync_version=sync_version+1"
        );
        $st->execute([
            ':pd' => self::i($p['id']), ':co' => self::i($p['company_id'] ?? null),
            ':name' => self::s($p['name'] ?? null), ':org' => self::i($p['org_id'] ?? null),
            ':job' => self::s($p['job_title'] ?? null), ':owner' => self::i($p['owner_id'] ?? null),
            ':creator' => self::i($p['creator_user_id'] ?? null), ':labels' => self::s($labels),
            ':pe' => self::s($primEmail), ':pp' => self::s($primPhone),
            ':en' => self::s($primEmail ? strtolower($primEmail) : null),
            ':pn' => self::s($primPhone ? preg_replace('/\D+/', '', $primPhone) : null),
            ':custom' => isset($p['custom_fields']) ? json_encode($p['custom_fields'], JSON_UNESCAPED_UNICODE) : null,
            ':del' => !empty($p['is_deleted']) ? 1 : 0,
            ':add' => self::dt($p['add_time'] ?? null), ':upd' => self::dt($p['update_time'] ?? null),
            ':upd2' => self::dt($p['update_time'] ?? null), ':raw' => $raw, ':hash' => hash('sha256', $raw),
        ]);
        $out = self::outcome($st);
        $this->replaceChildren('pipe_person_emails', 'person_pd_id', (int)$p['id'], $emails, ['value', 'label', 'primary']);
        $this->replaceChildren('pipe_person_phones', 'person_pd_id', (int)$p['id'], $phones, ['value', 'label', 'primary']);
        return $out;
    }

    public function upsertProduct(array $pr): string
    {
        $raw = json_encode($pr, JSON_UNESCAPED_UNICODE);
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_products
               (pipedrive_id, name, code, category, description, unit, tax, is_active, owner_id,
                custom_fields, is_deleted, add_time, update_time, raw_payload, payload_hash, last_synced_at)
             VALUES (:pd,:name,:code,:cat,:desc,:unit,:tax,:act,:owner,:custom,:del,:add,:upd,:raw,:hash,NOW())
             ON DUPLICATE KEY UPDATE
               name=VALUES(name), code=VALUES(code), category=VALUES(category), description=VALUES(description),
               unit=VALUES(unit), tax=VALUES(tax), is_active=VALUES(is_active), owner_id=VALUES(owner_id),
               custom_fields=VALUES(custom_fields), is_deleted=VALUES(is_deleted),
               add_time=VALUES(add_time), update_time=VALUES(update_time),
               raw_payload=VALUES(raw_payload), payload_hash=VALUES(payload_hash), last_synced_at=NOW()"
        );
        $st->execute([
            ':pd' => self::i($pr['id']), ':name' => self::s($pr['name'] ?? null), ':code' => self::s($pr['code'] ?? null),
            ':cat' => self::s($pr['category'] ?? null), ':desc' => self::s($pr['description'] ?? null),
            ':unit' => self::s($pr['unit'] ?? null), ':tax' => self::f($pr['tax'] ?? null),
            ':act' => array_key_exists('is_deleted', $pr) ? (int)empty($pr['is_deleted']) : 1,
            ':owner' => self::i($pr['owner_id'] ?? null),
            ':custom' => isset($pr['custom_fields']) ? json_encode($pr['custom_fields'], JSON_UNESCAPED_UNICODE) : null,
            ':del' => !empty($pr['is_deleted']) ? 1 : 0,
            ':add' => self::dt($pr['add_time'] ?? null), ':upd' => self::dt($pr['update_time'] ?? null),
            ':raw' => $raw, ':hash' => hash('sha256', $raw),
        ]);
        $out = self::outcome($st);
        $prices = is_array($pr['prices'] ?? null) ? $pr['prices'] : [];
        $this->replaceChildren('pipe_product_prices', 'product_pd_id', (int)$pr['id'], $prices, ['price', 'currency', 'cost']);
        return $out;
    }

    /**
     * Substitui os produtos anexados a um negocio (delete-reinsert por deal_pd_id).
     * Cada linha vem de GET /v2/deals/{id}/products. `sum` pode faltar no payload →
     * calcula item_price*quantity - discount como fallback. @return int nº de itens.
     */
    public function upsertDealProducts(int $dealPdId, array $products): int
    {
        if ($dealPdId <= 0) { return 0; }
        $this->pdo->prepare("DELETE FROM pipe_deal_products WHERE deal_pd_id = ?")->execute([$dealPdId]);
        if (!$products) { return 0; }
        $ins = $this->pdo->prepare(
            "INSERT INTO pipe_deal_products
               (pipedrive_id, deal_pd_id, product_pd_id, item_price, quantity, discount, tax, `sum`,
                comments, order_nr, add_time, raw_payload)
             VALUES (:pd,:deal,:prod,:price,:qty,:disc,:tax,:sum,:comm,:ord,:add,:raw)"
        );
        $n = 0;
        foreach ($products as $p) {
            if (!is_array($p)) { continue; }
            $price = self::f($p['item_price'] ?? ($p['price'] ?? null));
            $qty   = self::f($p['quantity'] ?? null);
            $disc  = self::f($p['discount'] ?? null);
            $sum   = $p['sum'] ?? null;
            if ($sum === null && $price !== null) {
                $sum = $price * ($qty ?? 1) - ($disc ?? 0);
            }
            $ins->execute([
                ':pd'   => self::i($p['id'] ?? null),
                ':deal' => $dealPdId,
                ':prod' => self::i($p['product_id'] ?? ($p['product_pd_id'] ?? null)),
                ':price' => $price, ':qty' => $qty, ':disc' => $disc,
                ':tax' => self::f($p['tax'] ?? null), ':sum' => self::f($sum),
                ':comm' => self::s($p['comments'] ?? null), ':ord' => self::i($p['order_nr'] ?? null),
                ':add' => self::dt($p['add_time'] ?? null),
                ':raw' => json_encode($p, JSON_UNESCAPED_UNICODE),
            ]);
            $n++;
        }
        return $n;
    }

    /** IDs dos negocios (nao excluidos) para sincronizar produtos. Opcional: so open/won. */
    public function dealIdsForProducts(?int $limit = null, bool $onlyActive = true): array
    {
        $where = 'is_deleted = 0';
        if ($onlyActive) { $where .= " AND status IN ('open','won')"; }
        $sql = "SELECT pipedrive_id FROM pipe_deals WHERE {$where} ORDER BY update_time DESC";
        if ($limit !== null && $limit > 0) { $sql .= ' LIMIT ' . (int)$limit; }
        return array_map('intval', $this->pdo->query($sql)->fetchAll(PDO::FETCH_COLUMN));
    }

    public function upsertActivity(array $a): string
    {
        $raw = json_encode($a, JSON_UNESCAPED_UNICODE);
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_activities
               (pipedrive_id, company_id, subject, type, status, owner_id, creator_user_id, due_date, due_time,
                duration, done, marked_done_time, location, note, deal_pd_id, person_pd_id, org_pd_id,
                custom_fields, is_deleted, add_time, update_time, source_updated_at, raw_payload, payload_hash, last_synced_at)
             VALUES (:pd,:co,:subj,:type,:status,:owner,:creator,:dd,:dt,:dur,:done,:mdt,:loc,:note,
                     :deal,:person,:org,:custom,:del,:add,:upd,:upd2,:raw,:hash,NOW())
             ON DUPLICATE KEY UPDATE
               company_id=VALUES(company_id), subject=VALUES(subject), type=VALUES(type), status=VALUES(status),
               owner_id=VALUES(owner_id), creator_user_id=VALUES(creator_user_id), due_date=VALUES(due_date),
               due_time=VALUES(due_time), duration=VALUES(duration), done=VALUES(done),
               marked_done_time=VALUES(marked_done_time), location=VALUES(location), note=VALUES(note),
               deal_pd_id=VALUES(deal_pd_id), person_pd_id=VALUES(person_pd_id), org_pd_id=VALUES(org_pd_id),
               custom_fields=VALUES(custom_fields), is_deleted=VALUES(is_deleted),
               add_time=VALUES(add_time), update_time=VALUES(update_time), source_updated_at=VALUES(source_updated_at),
               raw_payload=VALUES(raw_payload), payload_hash=VALUES(payload_hash), last_synced_at=NOW(),
               sync_version=sync_version+1"
        );
        $done = !empty($a['done']);
        $st->execute([
            ':pd' => self::i($a['id']), ':co' => self::i($a['company_id'] ?? null),
            ':subj' => self::s($a['subject'] ?? null), ':type' => self::s($a['type'] ?? null),
            ':status' => self::s($done ? 'done' : 'open'), ':owner' => self::i($a['owner_id'] ?? null),
            ':creator' => self::i($a['creator_user_id'] ?? null), ':dd' => self::s($a['due_date'] ?? null),
            ':dt' => self::s($a['due_time'] ?? null), ':dur' => self::s($a['duration'] ?? null),
            ':done' => $done ? 1 : 0, ':mdt' => self::dt($a['marked_as_done_time'] ?? ($a['marked_done_time'] ?? null)),
            ':loc' => self::s(is_array($a['location'] ?? null) ? ($a['location']['value'] ?? null) : ($a['location'] ?? null)),
            ':note' => self::s($a['public_description'] ?? ($a['note'] ?? null)),
            ':deal' => self::i($a['deal_id'] ?? null), ':person' => self::i($a['person_id'] ?? null),
            ':org' => self::i($a['org_id'] ?? null),
            ':custom' => isset($a['custom_fields']) ? json_encode($a['custom_fields'], JSON_UNESCAPED_UNICODE) : null,
            ':del' => !empty($a['is_deleted']) ? 1 : 0,
            ':add' => self::dt($a['add_time'] ?? null), ':upd' => self::dt($a['update_time'] ?? null),
            ':upd2' => self::dt($a['update_time'] ?? null), ':raw' => $raw, ':hash' => hash('sha256', $raw),
        ]);
        return self::outcome($st);
    }

    public function upsertLead(array $l): string
    {
        $val = $l['value'] ?? null; // v1: {amount, currency}
        $labels = $l['label_ids'] ?? null;
        if (is_array($labels)) { $labels = implode(',', array_map('strval', $labels)); }
        $raw = json_encode($l, JSON_UNESCAPED_UNICODE);
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_leads
               (pipedrive_id, company_id, title, person_id, org_id, owner_id, creator_user_id, origin, label_ids,
                value, currency, is_archived, archive_time, seen, converted_deal_id, custom_fields,
                is_deleted, add_time, update_time, source_updated_at, raw_payload, payload_hash, last_synced_at)
             VALUES (:pd,:co,:title,:person,:org,:owner,:creator,:origin,:labels,:val,:cur,:arch,:archt,:seen,:conv,:custom,
                     :del,:add,:upd,:upd2,:raw,:hash,NOW())
             ON DUPLICATE KEY UPDATE
               company_id=VALUES(company_id), title=VALUES(title), person_id=VALUES(person_id), org_id=VALUES(org_id),
               owner_id=VALUES(owner_id), creator_user_id=VALUES(creator_user_id), origin=VALUES(origin),
               label_ids=VALUES(label_ids), value=VALUES(value), currency=VALUES(currency),
               is_archived=VALUES(is_archived), archive_time=VALUES(archive_time), seen=VALUES(seen),
               converted_deal_id=VALUES(converted_deal_id), custom_fields=VALUES(custom_fields),
               is_deleted=VALUES(is_deleted), add_time=VALUES(add_time), update_time=VALUES(update_time),
               source_updated_at=VALUES(source_updated_at), raw_payload=VALUES(raw_payload),
               payload_hash=VALUES(payload_hash), last_synced_at=NOW(), sync_version=sync_version+1"
        );
        $st->execute([
            ':pd' => self::s($l['id'] ?? null), ':co' => self::i($l['company_id'] ?? null),
            ':title' => self::s($l['title'] ?? null),
            ':person' => self::i(is_array($l['person_id'] ?? null) ? ($l['person_id']['value'] ?? null) : ($l['person_id'] ?? null)),
            ':org' => self::i(is_array($l['organization_id'] ?? null) ? ($l['organization_id']['value'] ?? null) : ($l['organization_id'] ?? null)),
            ':owner' => self::i(is_array($l['owner_id'] ?? null) ? ($l['owner_id']['value'] ?? null) : ($l['owner_id'] ?? null)),
            ':creator' => self::i(is_array($l['creator_id'] ?? null) ? ($l['creator_id']['value'] ?? null) : ($l['creator_id'] ?? null)),
            ':origin' => self::s($l['origin'] ?? null), ':labels' => self::s($labels),
            ':val' => self::f(is_array($val) ? ($val['amount'] ?? null) : $val),
            ':cur' => self::s(is_array($val) ? ($val['currency'] ?? null) : null),
            ':arch' => !empty($l['is_archived']) ? 1 : 0, ':archt' => self::dt($l['archive_time'] ?? null),
            ':seen' => !empty($l['was_seen']) ? 1 : 0,
            ':conv' => self::i($l['converted_deal_id'] ?? null),
            ':custom' => isset($l['custom_fields']) ? json_encode($l['custom_fields'], JSON_UNESCAPED_UNICODE) : null,
            ':del' => !empty($l['is_deleted']) ? 1 : 0,
            ':add' => self::dt($l['add_time'] ?? null), ':upd' => self::dt($l['update_time'] ?? null),
            ':upd2' => self::dt($l['update_time'] ?? null), ':raw' => $raw, ':hash' => hash('sha256', $raw),
        ]);
        return self::outcome($st);
    }

    public function upsertNote(array $n): string
    {
        $raw = json_encode($n, JSON_UNESCAPED_UNICODE);
        // §17.3: sanitizar — nesta fatia guardamos texto puro (sem HTML) por seguranca.
        $content = isset($n['content']) ? trim(html_entity_decode(strip_tags((string)$n['content']), ENT_QUOTES | ENT_HTML5, 'UTF-8')) : null;
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_notes
               (pipedrive_id, content_sanitized, user_id, deal_pd_id, person_pd_id, org_pd_id, lead_pd_id,
                is_deleted, add_time, update_time, raw_payload, last_synced_at)
             VALUES (:pd,:content,:user,:deal,:person,:org,:lead,:del,:add,:upd,:raw,NOW())
             ON DUPLICATE KEY UPDATE
               content_sanitized=VALUES(content_sanitized), user_id=VALUES(user_id), deal_pd_id=VALUES(deal_pd_id),
               person_pd_id=VALUES(person_pd_id), org_pd_id=VALUES(org_pd_id), lead_pd_id=VALUES(lead_pd_id),
               is_deleted=VALUES(is_deleted), add_time=VALUES(add_time), update_time=VALUES(update_time),
               raw_payload=VALUES(raw_payload), last_synced_at=NOW()"
        );
        $st->execute([
            ':pd' => self::i($n['id']), ':content' => $content, ':user' => self::i($n['user_id'] ?? null),
            ':deal' => self::i($n['deal_id'] ?? null), ':person' => self::i($n['person_id'] ?? null),
            ':org' => self::i($n['org_id'] ?? null), ':lead' => self::s($n['lead_id'] ?? null),
            ':del' => !empty($n['is_deleted']) ? 1 : (array_key_exists('active_flag', $n) ? (int)empty($n['active_flag']) : 0),
            ':add' => self::dt($n['add_time'] ?? null), ':upd' => self::dt($n['update_time'] ?? null),
            ':raw' => $raw,
        ]);
        return self::outcome($st);
    }

    /**
     * Marca uma entidade como excluida (soft delete) por id externo. Usado quando um
     * webhook 'deleted' chega ou o re-fetch retorna 404 — NUNCA apaga fisicamente
     * (mantem historico/relatorios; doc 03 §4). Idempotente.
     * @return bool true se a linha existia (afetada), false se nao havia registro local.
     */
    /** Mapa entidade -> tabela (allowlist estatica; NUNCA vem do request). */
    private static function entityTable(string $entity): ?string
    {
        static $tabelas = [
            'deal' => 'pipe_deals', 'person' => 'pipe_persons', 'organization' => 'pipe_organizations',
            'product' => 'pipe_products', 'activity' => 'pipe_activities', 'lead' => 'pipe_leads',
            'note' => 'pipe_notes',
        ];
        return $tabelas[$entity] ?? null;
    }

    public function markDeleted(string $entity, string $externalId): bool
    {
        $tabela = self::entityTable($entity);
        if ($tabela === null) { return false; }
        $st = $this->pdo->prepare(
            "UPDATE {$tabela} SET is_deleted = 1, update_time = NOW(), last_synced_at = NOW()
             WHERE pipedrive_id = :pd"
        );
        $st->execute([':pd' => $externalId]);
        return $st->rowCount() > 0;
    }

    /** IDs externos dos registros ATIVOS (is_deleted=0) de uma entidade. Para reconciliacao. */
    public function activeIds(string $entity): array
    {
        $tabela = self::entityTable($entity);
        if ($tabela === null) { return []; }
        return $this->pdo->query("SELECT pipedrive_id FROM {$tabela} WHERE is_deleted = 0")
                         ->fetchAll(PDO::FETCH_COLUMN);
    }

    /** Marca em lote como excluido (reconciliacao). @return int linhas afetadas. */
    public function markDeletedBatch(string $entity, array $ids): int
    {
        $tabela = self::entityTable($entity);
        if ($tabela === null || !$ids) { return 0; }
        $afetadas = 0;
        foreach (array_chunk($ids, 500) as $lote) {
            $ph = implode(',', array_fill(0, count($lote), '?'));
            $st = $this->pdo->prepare(
                "UPDATE {$tabela} SET is_deleted = 1, update_time = NOW(), last_synced_at = NOW()
                 WHERE is_deleted = 0 AND pipedrive_id IN ({$ph})"
            );
            $st->execute(array_values($lote));
            $afetadas += $st->rowCount();
        }
        return $afetadas;
    }

    /** Upsert de definicao de campo personalizado; devolve o id local (para as opcoes). */
    public function upsertCustomField(string $entity, array $f): int
    {
        $key = $f['key'] ?? null;
        // Pula subcampos derivados (hash_40 + sufixo _until/_lat/_long/_currency/_timezone > 40 chars):
        // o campo-mae ja carrega tudo em raw_payload. field_key e char(40).
        if ($key === null || strlen((string)$key) > 40) { return 0; }
        $raw = json_encode($f, JSON_UNESCAPED_UNICODE);
        $st = $this->pdo->prepare(
            "INSERT INTO pipe_custom_fields
               (pipedrive_id, entity, field_key, name, field_type, order_nr, is_active, add_time, update_time, raw_payload, last_synced_at)
             VALUES (:pd,:ent,:key,:name,:type,:ord,:act,:add,:upd,:raw,NOW())
             ON DUPLICATE KEY UPDATE
               pipedrive_id=VALUES(pipedrive_id), name=VALUES(name), field_type=VALUES(field_type),
               order_nr=VALUES(order_nr), is_active=VALUES(is_active), add_time=VALUES(add_time),
               update_time=VALUES(update_time), raw_payload=VALUES(raw_payload), last_synced_at=NOW()"
        );
        $st->execute([
            ':pd' => self::i($f['id'] ?? null), ':ent' => $entity, ':key' => self::s($f['key'] ?? null),
            ':name' => self::s($f['name'] ?? null), ':type' => self::s($f['field_type'] ?? null),
            ':ord' => self::i($f['order_nr'] ?? null),
            ':act' => array_key_exists('active_flag', $f) ? (int)!empty($f['active_flag']) : 1,
            ':add' => self::dt($f['add_time'] ?? null), ':upd' => self::dt($f['update_time'] ?? null),
            ':raw' => $raw,
        ]);
        $id = $this->pdo->query("SELECT id FROM pipe_custom_fields WHERE entity=" . $this->pdo->quote($entity)
            . " AND field_key=" . $this->pdo->quote((string)($f['key'] ?? '')))->fetchColumn();
        $fieldId = (int)$id;
        // opcoes (enum/set)
        $opts = is_array($f['options'] ?? null) ? $f['options'] : [];
        if ($fieldId && $opts) {
            $ins = $this->pdo->prepare(
                "INSERT INTO pipe_custom_field_options (field_id, option_id, label)
                 VALUES (:fid,:oid,:label)
                 ON DUPLICATE KEY UPDATE label=VALUES(label)"
            );
            foreach ($opts as $op) {
                $oid = self::i($op['id'] ?? null);
                if ($oid === null) { continue; } // opcao sem id (enum padrao) — nao ha o que chavear
                $ins->execute([':fid' => $fieldId, ':oid' => $oid, ':label' => self::s($op['label'] ?? null)]);
            }
        }
        return $fieldId;
    }

    // ── helpers de colecoes-filhas (delete + reinsere o conjunto atual) ──
    private static function primaryValue(array $items): ?string
    {
        $first = null;
        foreach ($items as $it) {
            $v = is_array($it) ? ($it['value'] ?? null) : $it;
            if ($v === null || $v === '') { continue; }
            if ($first === null) { $first = (string)$v; }
            if (is_array($it) && !empty($it['primary'])) { return (string)$v; }
        }
        return $first;
    }

    private function replaceChildren(string $table, string $fk, int $parentPdId, array $items, array $cols): void
    {
        if ($parentPdId <= 0) { return; }
        $this->pdo->prepare("DELETE FROM `$table` WHERE `$fk` = ?")->execute([$parentPdId]);
        if (!$items) { return; }
        // cols mapeia [value,label,primary] p/ emails/phones OU [price,currency,cost] p/ prices
        if ($cols === ['value', 'label', 'primary']) {
            $ins = $this->pdo->prepare("INSERT INTO `$table` (`$fk`, value, label, is_primary) VALUES (?,?,?,?)");
            foreach ($items as $it) {
                if (!is_array($it) || ($it['value'] ?? '') === '') { continue; }
                $ins->execute([$parentPdId, self::s($it['value']), self::s($it['label'] ?? null), !empty($it['primary']) ? 1 : 0]);
            }
        } else { // prices
            $ins = $this->pdo->prepare("INSERT INTO `$table` (`$fk`, price, currency, cost) VALUES (?,?,?,?)");
            foreach ($items as $it) {
                if (!is_array($it)) { continue; }
                $ins->execute([$parentPdId, self::f($it['price'] ?? null), self::s($it['currency'] ?? null), self::f($it['cost'] ?? null)]);
            }
        }
    }

    // ── leitura para o dashboard (Visao Geral) ──────────────────
    /** Metricas executivas basicas a partir da base local (nao chama a API). */
    public function overview(): array
    {
        $deals = $this->pdo->query(
            "SELECT
               COUNT(*)                                             AS total,
               SUM(status='open')                                  AS abertos,
               SUM(status='won')                                   AS ganhos,
               SUM(status='lost')                                  AS perdidos,
               COALESCE(SUM(CASE WHEN status='open' THEN value END),0) AS valor_aberto,
               COALESCE(SUM(CASE WHEN status='won'  THEN value END),0) AS valor_ganho
             FROM pipe_deals WHERE is_deleted = 0"
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $porEtapa = $this->pdo->query(
            "SELECT s.name AS etapa, s.order_nr AS ordem,
                    COUNT(d.id) AS qtd, COALESCE(SUM(d.value),0) AS valor
             FROM pipe_stages s
             LEFT JOIN pipe_deals d ON d.stage_id = s.pipedrive_id AND d.is_deleted = 0 AND d.status = 'open'
             WHERE s.is_active = 1
             GROUP BY s.pipedrive_id, s.name, s.order_nr
             ORDER BY s.order_nr ASC LIMIT 50"
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $ganhos = (int)($deals['ganhos'] ?? 0);
        $perdidos = (int)($deals['perdidos'] ?? 0);
        $fechados = $ganhos + $perdidos;

        return [
            'deals' => [
                'total'        => (int)($deals['total'] ?? 0),
                'abertos'      => (int)($deals['abertos'] ?? 0),
                'ganhos'       => $ganhos,
                'perdidos'     => $perdidos,
                'valor_aberto' => (float)($deals['valor_aberto'] ?? 0),
                'valor_ganho'  => (float)($deals['valor_ganho'] ?? 0),
                'taxa_conversao' => $fechados > 0 ? round($ganhos / $fechados * 100, 1) : null,
            ],
            'funil' => array_map(static fn($r) => [
                'etapa' => $r['etapa'],
                'qtd'   => (int)$r['qtd'],
                'valor' => (float)$r['valor'],
            ], $porEtapa),
            'contagens' => [
                'pipelines'     => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_pipelines WHERE is_active=1")->fetchColumn(),
                'stages'        => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_stages WHERE is_active=1")->fetchColumn(),
                'users'         => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_users WHERE is_active=1")->fetchColumn(),
                'persons'       => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_persons WHERE is_deleted=0")->fetchColumn(),
                'organizations' => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_organizations WHERE is_deleted=0")->fetchColumn(),
                'products'      => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_products WHERE is_deleted=0")->fetchColumn(),
                'activities'    => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0")->fetchColumn(),
                'leads'         => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_leads WHERE is_deleted=0 AND is_archived=0")->fetchColumn(),
                'notes'         => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_notes WHERE is_deleted=0")->fetchColumn(),
            ],
            'atividades' => [
                'pendentes' => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0 AND done=0")->fetchColumn(),
                'atrasadas' => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_activities WHERE is_deleted=0 AND done=0 AND due_date IS NOT NULL AND due_date < CURDATE()")->fetchColumn(),
            ],
        ];
    }

    /**
     * Lista paginada de negocios (server-side) para o DataGrid.
     * $f: page,per_page,sort,dir,q,status,stage_id,owner_id
     */
    public function dealsPage(array $f): array
    {
        $page    = max(1, (int)($f['page'] ?? 1));
        $perPage = min(500, max(5, (int)($f['per_page'] ?? 25)));
        $offset  = ($page - 1) * $perPage;

        $sortMap = [
            'title' => 'd.title', 'value' => 'd.value', 'status' => 'd.status',
            'update_time' => 'd.update_time', 'add_time' => 'd.add_time',
            'expected_close_date' => 'd.expected_close_date', 'stage' => 's.order_nr',
            'probability' => 'd.probability', 'org' => 'o.name', 'person' => 'p.name',
        ];
        $sort = $sortMap[$f['sort'] ?? 'update_time'] ?? 'd.update_time';
        $dir  = strtolower((string)($f['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $where = ['d.is_deleted = 0'];
        $params = [];

        // status: multi (lista separada por virgula, validada contra o allowlist) — #8
        $statuses = array_values(array_intersect(
            array_map('trim', explode(',', (string)($f['status'] ?? ''))),
            ['open', 'won', 'lost']
        ));
        if ($statuses) {
            $ph = [];
            foreach ($statuses as $i => $s) { $k = ":st{$i}"; $ph[] = $k; $params[$k] = $s; }
            $where[] = 'd.status IN (' . implode(',', $ph) . ')';
        }

        // stage_id / owner_id: multi (lista de inteiros) — #8
        foreach (['stage_id' => 'd.stage_id', 'owner_id' => 'd.owner_id'] as $fk => $col) {
            $ids = [];
            foreach (explode(',', (string)($f[$fk] ?? '')) as $v) { $v = trim($v); if ($v !== '' && ctype_digit($v)) { $ids[] = (int)$v; } }
            $ids = array_values(array_unique($ids));
            if ($ids) {
                $ph = [];
                foreach ($ids as $i => $id) { $k = ":{$fk}_{$i}"; $ph[] = $k; $params[$k] = $id; }
                $where[] = "{$col} IN (" . implode(',', $ph) . ')';
            }
        }

        // lost_reason: multi por TEXTO (#30) — o unico filtro do grid cujo valor nao e
        // inteiro nem allowlist fixo. Validado contra os motivos que EXISTEM na base:
        // o que nao casar e descartado, entao nada chega cru a consulta.
        //
        // Dois separadores aceitos: o grid multi-selecao junta com VIRGULA, e o drill-down
        // da tela de Perdas usa PIPE — que sobrevive a um motivo que contenha virgula
        // (nenhum contem hoje, mas o texto e cadastrado no Pipedrive e pode mudar).
        $bruto = (string)($f['lost_reason'] ?? '');
        $sep = strpos($bruto, '|') !== false ? '|' : ',';
        $motivosPedidos = array_filter(array_map('trim', explode($sep, $bruto)), static fn($v) => $v !== '');
        if ($motivosPedidos) {
            $validos = $this->pdo->query(
                "SELECT DISTINCT lost_reason FROM pipe_deals
                  WHERE is_deleted=0 AND status='lost' AND lost_reason IS NOT NULL AND lost_reason <> ''"
            )->fetchAll(PDO::FETCH_COLUMN);
            $motivos = array_values(array_intersect($motivosPedidos, $validos));
            if ($motivos) {
                $ph = [];
                foreach ($motivos as $i => $m) { $k = ":lr{$i}"; $ph[] = $k; $params[$k] = $m; }
                $where[] = 'd.lost_reason IN (' . implode(',', $ph) . ')';
            } else {
                $where[] = '1 = 0';  // pediu motivo inexistente: devolve vazio, nao "tudo"
            }
        }

        // faixa de valor — #8
        if (isset($f['value_min']) && is_numeric($f['value_min'])) { $where[] = 'd.value >= :vmin'; $params[':vmin'] = (float)$f['value_min']; }
        if (isset($f['value_max']) && is_numeric($f['value_max'])) { $where[] = 'd.value <= :vmax'; $params[':vmax'] = (float)$f['value_max']; }

        // faixas de data (YYYY-MM-DD) — #8
        $isDate = static fn($v) => is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) === 1;
        if ($isDate($f['close_from'] ?? null))   { $where[] = 'd.expected_close_date >= :cf';  $params[':cf']  = $f['close_from']; }
        if ($isDate($f['close_to'] ?? null))     { $where[] = 'd.expected_close_date <= :ct';  $params[':ct']  = $f['close_to']; }
        if ($isDate($f['created_from'] ?? null)) { $where[] = 'd.add_time >= :crf'; $params[':crf'] = $f['created_from'] . ' 00:00:00'; }
        if ($isDate($f['created_to'] ?? null))   { $where[] = 'd.add_time <= :crt'; $params[':crt'] = $f['created_to'] . ' 23:59:59'; }

        if (isset($f['q']) && trim((string)$f['q']) !== '') { $where[] = 'd.title LIKE :q'; $params[':q'] = '%' . trim((string)$f['q']) . '%'; }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_deals d WHERE $whereSql", $params)->fetchColumn();

        // Colunas de campos personalizados (#11): o JSON so entra no SELECT quem pediu.
        // Medido: +10 ms numa pagina de 25 e +20 ms em 200 — quem nao usa nao paga.
        $cfKeys = $this->cfKeysValidas('deal', $f['cf'] ?? null);
        $cfSel  = $cfKeys ? ', d.custom_fields' : '';

        $sql = "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.status, d.probability,
                       d.expected_close_date, d.update_time, d.add_time, d.lost_reason,
                       s.name AS stage, u.name AS owner, pl.name AS pipeline,
                       p.name AS person, o.name AS org{$cfSel}
                FROM pipe_deals d
                LEFT JOIN pipe_stages s   ON s.pipedrive_id  = d.stage_id
                LEFT JOIN pipe_users  u   ON u.pipedrive_id  = d.owner_id
                LEFT JOIN pipe_pipelines pl ON pl.pipedrive_id = d.pipeline_id
                LEFT JOIN pipe_persons p ON p.pipedrive_id = d.person_id
                LEFT JOIN pipe_organizations o ON o.pipedrive_id = d.org_id
                WHERE $whereSql
                ORDER BY $sort $dir, d.pipedrive_id DESC
                LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT);
        $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);

        $shaped = array_map([$this, 'shapeDealRow'], $rows);
        foreach ($shaped as $i => &$linha) {
            $linha['cf'] = $this->cfSubset('deal', $rows[$i]['custom_fields'] ?? null, $cfKeys);
        }
        unset($linha);

        return [
            'rows'     => $shaped,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
            'pages'    => (int)ceil($total / $perPage),
            // Quais chaves o backend REALMENTE aplicou: a UI não deve desenhar coluna
            // que foi descartada na validação.
            'cf_aplicados' => $cfKeys,
            // As facets NÃO dependem dos filtros (são o catálogo de etapas, donos e motivos
            // que existem na base) e não mudam entre a página 1 e a 7 — mas custavam ~126 ms
            // em CADA página (owners 70 ms + lost_reasons 56 ms, ambas com temporary+filesort).
            // Com `facets=0` o cliente diz "já tenho"; sem o parâmetro, o comportamento é o
            // de sempre.
            'facets'   => self::querFacets($f) ? [
                'stages' => $this->pdo->query("SELECT pipedrive_id AS id, name FROM pipe_stages WHERE is_active=1 ORDER BY order_nr")->fetchAll(PDO::FETCH_ASSOC),
                'owners' => $this->pdo->query("SELECT DISTINCT u.pipedrive_id AS id, u.name FROM pipe_users u JOIN pipe_deals d ON d.owner_id=u.pipedrive_id WHERE d.is_deleted=0 ORDER BY u.name")->fetchAll(PDO::FETCH_ASSOC),
                // Motivo de perda (#30): id == name porque a chave E o proprio texto —
                // o Pipedrive nao expoe id para o motivo na coluna que sincronizamos.
                'lost_reasons' => $this->pdo->query(
                    "SELECT lost_reason AS id, lost_reason AS name
                       FROM pipe_deals
                      WHERE is_deleted=0 AND status='lost' AND lost_reason IS NOT NULL AND lost_reason <> ''
                   GROUP BY lost_reason ORDER BY COUNT(*) DESC"
                )->fetchAll(PDO::FETCH_ASSOC),
            ] : null,
        ];
    }

    private function shapeDealRow(array $r): array
    {
        return [
            'id'       => (int)$r['pipedrive_id'],
            'title'    => $r['title'],
            'value'    => $r['value'] !== null ? (float)$r['value'] : null,
            'currency' => $r['currency'],
            'status'   => $r['status'],
            'stage'    => $r['stage'],
            'owner'    => $r['owner'],
            'pipeline' => $r['pipeline'],
            'person'   => $r['person'] ?? null,
            'org'      => $r['org'] ?? null,
            'probability' => isset($r['probability']) && $r['probability'] !== null ? (float)$r['probability'] : null,
            'expected_close_date' => $r['expected_close_date'],
            'add_time'    => $r['add_time'] ?? null,
            'update_time' => $r['update_time'],
            'lost_reason' => ($r['lost_reason'] ?? '') !== '' ? $r['lost_reason'] : null,
        ];
    }

    /**
     * O cliente quer as facets nesta resposta? Só `facets=0` desliga — qualquer outra coisa
     * (inclusive ausência do parâmetro) mantém o comportamento antigo, para não quebrar quem
     * já consome a API.
     */
    private static function querFacets(array $f): bool
    {
        return (string)($f['facets'] ?? '') !== '0';
    }

    /** Parametros comuns de paginacao/ordenacao. @return [page, perPage, offset, dir] */
    private function pageParams(array $f): array
    {
        $page    = max(1, (int)($f['page'] ?? 1));
        $perPage = min(500, max(5, (int)($f['per_page'] ?? 25))); // ate 500 (usado no export CSV)
        $dir     = strtolower((string)($f['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
        return [$page, $perPage, ($page - 1) * $perPage, $dir];
    }

    private function pageEnvelope(array $rows, int $total, int $page, int $perPage, array $extra = []): array
    {
        return array_merge([
            'rows' => $rows, 'total' => $total, 'page' => $page, 'per_page' => $perPage,
            'pages' => (int)ceil($total / max(1, $perPage)),
        ], $extra);
    }

    /** Lista paginada de PESSOAS. $f: page,per_page,sort,dir,q,owner_id */
    public function personsPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['name' => 'p.name', 'update_time' => 'p.update_time', 'add_time' => 'p.add_time', 'org' => 'o.name'];
        $sort = $sortMap[$f['sort'] ?? 'update_time'] ?? 'p.update_time';

        $where = ['p.is_deleted = 0']; $params = [];
        if (!empty($f['owner_id']) && is_numeric($f['owner_id'])) { $where[] = 'p.owner_id = :owner'; $params[':owner'] = (int)$f['owner_id']; }
        if (isset($f['q']) && trim((string)$f['q']) !== '') {
            // Um placeholder POR OCORRENCIA: com EMULATE_PREPARES=false o PDO nao aceita :q repetido.
            $where[] = '(p.name LIKE :q1 OR p.primary_email LIKE :q2 OR p.primary_phone LIKE :q3)';
            $like = '%' . trim((string)$f['q']) . '%';
            $params[':q1'] = $like; $params[':q2'] = $like; $params[':q3'] = $like;
        }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_persons p WHERE $whereSql", $params)->fetchColumn();
        $cfKeys = $this->cfKeysValidas('person', $f['cf'] ?? null);   // #11
        $cfSel  = $cfKeys ? ', p.custom_fields' : '';
        $sql = "SELECT p.pipedrive_id, p.name, p.primary_email, p.primary_phone, p.job_title,
                       o.name AS org, u.name AS owner, p.update_time, p.add_time,
                       (SELECT COUNT(*) FROM pipe_deals d WHERE d.person_id=p.pipedrive_id AND d.is_deleted=0 AND d.status='open') AS open_deals,
                       (SELECT COUNT(*) FROM pipe_deals d WHERE d.person_id=p.pipedrive_id AND d.is_deleted=0 AND d.status='won') AS won_deals{$cfSel}
                FROM pipe_persons p
                LEFT JOIN pipe_organizations o ON o.pipedrive_id = p.org_id
                LEFT JOIN pipe_users u ON u.pipedrive_id = p.owner_id
                WHERE $whereSql ORDER BY $sort $dir, p.pipedrive_id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $brutos = $st->fetchAll(PDO::FETCH_ASSOC);
        $rows = array_map(fn($r) => [
            'id' => (int)$r['pipedrive_id'], 'name' => $r['name'], 'email' => $r['primary_email'],
            'phone' => $r['primary_phone'], 'job_title' => $r['job_title'], 'org' => $r['org'],
            'owner' => $r['owner'], 'open_deals' => (int)$r['open_deals'], 'won_deals' => (int)$r['won_deals'],
            'add_time' => $r['add_time'], 'update_time' => $r['update_time'],
            'cf' => $this->cfSubset('person', $r['custom_fields'] ?? null, $cfKeys),
        ], $brutos);
        return $this->pageEnvelope($rows, $total, $page, $perPage, ['cf_aplicados' => $cfKeys]);
    }

    /** Lista paginada de ORGANIZACOES. $f: page,per_page,sort,dir,q,owner_id */
    public function organizationsPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['name' => 'o.name', 'update_time' => 'o.update_time', 'add_time' => 'o.add_time'];
        $sort = $sortMap[$f['sort'] ?? 'update_time'] ?? 'o.update_time';

        $where = ['o.is_deleted = 0']; $params = [];
        if (!empty($f['owner_id']) && is_numeric($f['owner_id'])) { $where[] = 'o.owner_id = :owner'; $params[':owner'] = (int)$f['owner_id']; }
        if (isset($f['q']) && trim((string)$f['q']) !== '') {
            $where[] = '(o.name LIKE :q1 OR o.cnpj LIKE :q2)';
            $like = '%' . trim((string)$f['q']) . '%';
            $params[':q1'] = $like; $params[':q2'] = $like;
        }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_organizations o WHERE $whereSql", $params)->fetchColumn();
        $cfKeys = $this->cfKeysValidas('organization', $f['cf'] ?? null);   // #11
        $cfSel  = $cfKeys ? ', o.custom_fields' : '';
        $sql = "SELECT o.pipedrive_id, o.name, o.cnpj, o.city, o.state, u.name AS owner, o.update_time, o.add_time,
                       (SELECT COUNT(*) FROM pipe_persons pp WHERE pp.org_id=o.pipedrive_id AND pp.is_deleted=0) AS people,
                       (SELECT COUNT(*) FROM pipe_deals d WHERE d.org_id=o.pipedrive_id AND d.is_deleted=0 AND d.status='open') AS open_deals,
                       (SELECT COALESCE(SUM(value),0) FROM pipe_deals d WHERE d.org_id=o.pipedrive_id AND d.is_deleted=0 AND d.status='won') AS valor_ganho{$cfSel}
                FROM pipe_organizations o
                LEFT JOIN pipe_users u ON u.pipedrive_id = o.owner_id
                WHERE $whereSql ORDER BY $sort $dir, o.pipedrive_id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = array_map(fn($r) => [
            'id' => (int)$r['pipedrive_id'], 'name' => $r['name'], 'cnpj' => $r['cnpj'],
            'city' => $r['city'], 'state' => $r['state'], 'owner' => $r['owner'],
            'people' => (int)$r['people'], 'open_deals' => (int)$r['open_deals'], 'valor_ganho' => (float)$r['valor_ganho'],
            'add_time' => $r['add_time'], 'update_time' => $r['update_time'],
            'cf' => $this->cfSubset('organization', $r['custom_fields'] ?? null, $cfKeys),
        ], $st->fetchAll(PDO::FETCH_ASSOC));
        return $this->pageEnvelope($rows, $total, $page, $perPage, ['cf_aplicados' => $cfKeys]);
    }

    /** Lista paginada de ATIVIDADES. $f: page,per_page,sort,dir,q,done,type,owner_id,due_from,due_to */
    public function activitiesPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['subject' => 'a.subject', 'due_date' => 'a.due_date', 'update_time' => 'a.update_time', 'add_time' => 'a.add_time', 'type' => 'a.type'];
        $sort = $sortMap[$f['sort'] ?? 'due_date'] ?? 'a.due_date';

        $where = ['a.is_deleted = 0']; $params = [];
        if (isset($f['done']) && $f['done'] !== '' && in_array((string)$f['done'], ['0', '1'], true)) { $where[] = 'a.done = :done'; $params[':done'] = (int)$f['done']; }
        if (!empty($f['type'])) { $where[] = 'a.type = :type'; $params[':type'] = (string)$f['type']; }
        if (!empty($f['owner_id']) && is_numeric($f['owner_id'])) { $where[] = 'a.owner_id = :owner'; $params[':owner'] = (int)$f['owner_id']; }
        if (isset($f['q']) && trim((string)$f['q']) !== '') { $where[] = 'a.subject LIKE :q'; $params[':q'] = '%' . trim((string)$f['q']) . '%'; }
        // Janela de datas (usada pela AGENDA): so aceita AAAA-MM-DD, validado antes de bindar.
        foreach ([['due_from', '>=', ':dfrom'], ['due_to', '<=', ':dto']] as [$chave, $op, $ph]) {
            if (!empty($f[$chave]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$f[$chave])) {
                $where[] = "a.due_date {$op} {$ph}";
                $params[$ph] = (string)$f[$chave];
            }
        }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_activities a WHERE $whereSql", $params)->fetchColumn();
        $sql = "SELECT a.pipedrive_id, a.subject, a.type, a.done, a.due_date, a.due_time,
                       u.name AS owner, d.title AS deal,
                       (a.done=0 AND a.due_date IS NOT NULL AND a.due_date < CURDATE()) AS overdue, a.update_time
                FROM pipe_activities a
                LEFT JOIN pipe_users u ON u.pipedrive_id = a.owner_id
                LEFT JOIN pipe_deals d ON d.pipedrive_id = a.deal_pd_id
                WHERE $whereSql ORDER BY $sort $dir, a.pipedrive_id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = array_map(static fn($r) => [
            'id' => (int)$r['pipedrive_id'], 'subject' => $r['subject'], 'type' => $r['type'],
            'done' => (int)$r['done'], 'due_date' => $r['due_date'], 'due_time' => $r['due_time'],
            'owner' => $r['owner'], 'deal' => $r['deal'], 'overdue' => (int)$r['overdue'], 'update_time' => $r['update_time'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
        // Os tipos sao o catalogo da base: nao dependem dos filtros nem mudam entre a
        // pagina 1 e a 7. Mesmo tratamento que o grid de Negocios ja recebeu (#46) —
        // `facets=0` diz "ja tenho"; sem o parametro, o comportamento e o de sempre.
        // ⚠️ O GANHO AQUI E CORRECAO DE BUG, NAO PERF. O `LIMIT 50` ESCONDIA UM TIPO:
        // existem 51 na base e o 51o (`zoom_showroom`, 284 atividades) era INFILTRAVEL.
        // Removido — catalogo tem de vir inteiro.
        // Perf, MEDIDA EM 2026-07-29 (105.646 linhas ativas), page=4&per_page=25 pela
        // origin, mediana de 7 rodadas: 68,4 ms -> 26,4 ms, ~42 ms por pagina navegada.
        // No SQL puro o DISTINCT custa ~48 ms contra ~26 ms do COUNT de controle na mesma
        // sessao (~22 ms); o resto do delta e serializacao do envelope.
        // NAO ha temporary/filesort: `ix_del_type (is_deleted, type)` cobre a consulta
        // (EXPLAIN: `Using where; Using index`). Se voce leu "177 ms / temporary+filesort
        // / 52.959 linhas / ix_del_due_type" em alguma nota deste lote, era medicao antiga
        // de antes do indice — nada disso vale hoje, e `ix_del_due_type` nem existe.
        $facets = self::querFacets($f) ? ['types' => $this->activityTypeFacet()] : null;
        return $this->pageEnvelope($rows, $total, $page, $perPage, ['facets' => $facets]);
    }

    /**
     * Facet de tipos da tela de Atividades: `[{value, label}]`, onde `label` e o NOME do tipo.
     *
     * O rotulo so existe em `pipe_activity_types` — nao da para derivar da chave. `instalao_` e
     * "Acompanhamento Instalação"; a origem perdeu acentos e truncou em 26 chars. O front
     * (`EntityGrid.opcoesDe`) ja aceitava `{value,label}`, entao nada muda lá.
     *
     * ⚠️ DUAS CONSULTAS DE PROPOSITO, NAO POR DESCUIDO. A forma "elegante" —
     * `DISTINCT ... LEFT JOIN pipe_activity_types ... ORDER BY label` — foi MEDIDA e custa
     * **249 ms**, contra **48,7 ms** destas duas (47,5 do DISTINCT + 1,2 do catalogo, controle
     * 20,5). O JOIN destroi o index-only scan de `ix_del_type` e devolveria a tela ao patamar que
     * o 3o lote do #46 acabou de derrubar. Medido em 2026-07-29, 105.646 linhas.
     *
     * ⚠️ Lista os tipos EM USO, nao os `is_active=1`. Dos 51 em uso, so **18** estao ativos no
     * Pipedrive — filtrar por ativo esconderia 33 tipos que TEM atividades historicas, repetindo
     * exatamente o bug do `LIMIT 50` que este lote corrigiu.
     *
     * ⚠️ Ordenacao vem do MySQL (`ORDER BY name`), que tem collation para acento. Este PHP nao tem
     * `intl`/`Collator`, e ordenar "Apresentação" em PHP puro erraria a acentuacao.
     *
     * @return list<array{value:string,label:string}>
     */
    private function activityTypeFacet(): array
    {
        $emUso = $this->pdo->query(
            "SELECT DISTINCT type FROM pipe_activities
              WHERE is_deleted=0 AND type IS NOT NULL ORDER BY type"
        )->fetchAll(PDO::FETCH_COLUMN);
        if (!$emUso) { return []; }

        // key_string => name, já na ordem alfabética do NOME (collation do banco cuida do acento).
        $catalogo = $this->pdo->query(
            "SELECT key_string, name FROM pipe_activity_types
              WHERE key_string IS NOT NULL AND name IS NOT NULL ORDER BY name"
        )->fetchAll(PDO::FETCH_KEY_PAIR);

        $usados = array_fill_keys($emUso, true);
        $out = [];
        foreach ($catalogo as $chave => $nome) {          // ordem = nome
            if (isset($usados[$chave])) { $out[] = ['value' => (string)$chave, 'label' => (string)$nome]; unset($usados[$chave]); }
        }
        // Sobras = tipo em uso SEM entrada no catalogo (hoje ZERO, medido). Nunca sumir com eles:
        // sem rotulo, aparecem com a propria chave, que e o comportamento anterior a este lote.
        // Tambem e o caminho quando `pipe_activity_types` esta vazia — antes do 1o syncReference()
        // a tela continua funcionando igual, so sem os nomes.
        foreach (array_keys($usados) as $chave) { $out[] = ['value' => (string)$chave, 'label' => (string)$chave]; }
        return $out;
    }

    /** Detalhe completo de UM negocio + vinculos + produtos + timeline (atividades+notas). */
    public function dealDetail(int $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.status, d.probability,
                    d.expected_close_date, d.won_time, d.lost_time, d.lost_reason, d.origin,
                    d.add_time, d.update_time, d.stage_change_time, d.is_deleted, d.custom_fields,
                    s.name AS stage, pl.name AS pipeline, u.name AS owner,
                    p.pipedrive_id AS person_id, p.name AS person_name, p.primary_email AS person_email, p.primary_phone AS person_phone,
                    o.pipedrive_id AS org_id, o.name AS org_name, o.cnpj AS org_cnpj
             FROM pipe_deals d
             LEFT JOIN pipe_stages s ON s.pipedrive_id = d.stage_id
             LEFT JOIN pipe_pipelines pl ON pl.pipedrive_id = d.pipeline_id
             LEFT JOIN pipe_users u ON u.pipedrive_id = d.owner_id
             LEFT JOIN pipe_persons p ON p.pipedrive_id = d.person_id
             LEFT JOIN pipe_organizations o ON o.pipedrive_id = d.org_id
             WHERE d.pipedrive_id = :id LIMIT 1"
        );
        $st->execute([':id' => $id]);
        $d = $st->fetch(PDO::FETCH_ASSOC);
        if (!$d) { return null; }

        // Produtos do negocio
        $prod = $this->pdo->prepare(
            "SELECT dp.product_pd_id, COALESCE(pr.name, CONCAT('#', dp.product_pd_id)) AS name,
                    dp.item_price, dp.quantity, dp.discount, dp.`sum`
             FROM pipe_deal_products dp
             LEFT JOIN pipe_products pr ON pr.pipedrive_id = dp.product_pd_id
             WHERE dp.deal_pd_id = :id ORDER BY dp.order_nr, dp.id"
        );
        $prod->execute([':id' => $id]);
        $produtos = array_map(static fn($r) => [
            'product_id' => $r['product_pd_id'] !== null ? (int)$r['product_pd_id'] : null, 'name' => $r['name'],
            'item_price' => (float)$r['item_price'], 'quantity' => (float)$r['quantity'],
            'discount' => $r['discount'] !== null ? (float)$r['discount'] : null, 'sum' => (float)$r['sum'],
        ], $prod->fetchAll(PDO::FETCH_ASSOC));

        // Timeline: atividades + notas (merge, mais recente primeiro)
        $acts = $this->pdo->prepare(
            "SELECT a.subject, a.type, a.done, a.due_date, a.marked_done_time, a.add_time, u.name AS owner
             FROM pipe_activities a LEFT JOIN pipe_users u ON u.pipedrive_id = a.owner_id
             WHERE a.deal_pd_id = :id AND a.is_deleted = 0 ORDER BY COALESCE(a.due_date, a.add_time) DESC LIMIT 100"
        );
        $acts->execute([':id' => $id]);
        $timeline = [];
        foreach ($acts->fetchAll(PDO::FETCH_ASSOC) as $a) {
            $timeline[] = [
                'kind' => 'activity', 'when' => $a['marked_done_time'] ?: ($a['due_date'] ?: $a['add_time']),
                'title' => $a['subject'], 'type' => $a['type'], 'done' => (int)$a['done'], 'author' => $a['owner'],
            ];
        }
        $notes = $this->pdo->prepare(
            "SELECT LEFT(n.content_sanitized, 400) AS content, n.add_time, u.name AS author
             FROM pipe_notes n LEFT JOIN pipe_users u ON u.pipedrive_id = n.user_id
             WHERE n.deal_pd_id = :id AND n.is_deleted = 0 ORDER BY n.add_time DESC LIMIT 100"
        );
        $notes->execute([':id' => $id]);
        foreach ($notes->fetchAll(PDO::FETCH_ASSOC) as $n) {
            $timeline[] = ['kind' => 'note', 'when' => $n['add_time'], 'title' => $n['content'], 'author' => $n['author']];
        }
        usort($timeline, static fn($a, $b) => strcmp((string)$b['when'], (string)$a['when']));

        return [
            'deal' => [
                'id' => (int)$d['pipedrive_id'], 'title' => $d['title'],
                'value' => $d['value'] !== null ? (float)$d['value'] : null, 'currency' => $d['currency'],
                'status' => $d['status'], 'probability' => $d['probability'] !== null ? (float)$d['probability'] : null,
                'stage' => $d['stage'], 'pipeline' => $d['pipeline'], 'owner' => $d['owner'], 'origin' => $d['origin'],
                'expected_close_date' => $d['expected_close_date'], 'won_time' => $d['won_time'],
                'lost_time' => $d['lost_time'], 'lost_reason' => $d['lost_reason'],
                'add_time' => $d['add_time'], 'update_time' => $d['update_time'], 'is_deleted' => (int)$d['is_deleted'],
            ],
            'person' => $d['person_id'] ? ['id' => (int)$d['person_id'], 'name' => $d['person_name'], 'email' => $d['person_email'], 'phone' => $d['person_phone']] : null,
            'organization' => $d['org_id'] ? ['id' => (int)$d['org_id'], 'name' => $d['org_name'], 'cnpj' => $d['org_cnpj']] : null,
            'custom_fields' => $this->resolveCustomFields('deal', $d['custom_fields'] ?? null),
            'products' => $produtos,
            'timeline' => array_slice($timeline, 0, 120),
        ];
    }

    /** Alertas comerciais (§35): negocios ABERTOS que pedem atencao, derivados de dados reais. */
    public function commercialAlerts(int $porAlerta = 50): array
    {
        $defs = [
            ['ativ_atrasada', 'Atividades atrasadas', 'Negócios com atividade pendente vencida.', 'high',
             "EXISTS (SELECT 1 FROM pipe_activities a WHERE a.deal_pd_id=d.pipedrive_id AND a.is_deleted=0 AND a.done=0 AND a.due_date IS NOT NULL AND a.due_date<CURDATE())"],
            ['fechamento_vencido', 'Fechamento vencido', 'Aberto e já passou da data prevista de fechamento.', 'high',
             "d.expected_close_date IS NOT NULL AND d.expected_close_date<CURDATE()"],
            ['sem_atividade', 'Sem atividade agendada', 'Nenhuma atividade pendente futura — precisa de follow-up.', 'medium',
             "NOT EXISTS (SELECT 1 FROM pipe_activities a WHERE a.deal_pd_id=d.pipedrive_id AND a.is_deleted=0 AND a.done=0 AND a.due_date>=CURDATE())"],
            ['parado', 'Parados (30+ dias)', 'Sem atualização há mais de 30 dias.', 'medium',
             "d.update_time<NOW()-INTERVAL 30 DAY"],
            ['sem_previsao', 'Sem previsão de fechamento', 'Aberto sem data prevista de fechamento.', 'low',
             "d.expected_close_date IS NULL"],
        ];
        $porAlerta = max(5, min($porAlerta, 100));
        $alerts = [];
        foreach ($defs as [$key, $label, $desc, $sev, $cond]) {
            $where = "d.is_deleted=0 AND d.status='open' AND ({$cond})";
            $count = (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_deals d WHERE {$where}")->fetchColumn();
            $valor = (float)$this->pdo->query("SELECT COALESCE(SUM(value),0) FROM pipe_deals d WHERE {$where}")->fetchColumn();
            // Fase 4: funil/etapa/dono vem junto para o agrupamento e os filtros da tela.
            $rows = $this->pdo->query(
                "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.expected_close_date, d.update_time,
                        d.owner_id, d.pipeline_id, d.stage_id,
                        u.name AS owner, o.name AS org, s.name AS stage, pl.name AS pipeline
                 FROM pipe_deals d
                 LEFT JOIN pipe_users u ON u.pipedrive_id=d.owner_id
                 LEFT JOIN pipe_organizations o ON o.pipedrive_id=d.org_id
                 LEFT JOIN pipe_stages s ON s.pipedrive_id=d.stage_id
                 LEFT JOIN pipe_pipelines pl ON pl.pipedrive_id=d.pipeline_id
                 WHERE {$where} ORDER BY d.value DESC, d.update_time ASC LIMIT {$porAlerta}"
            )->fetchAll(PDO::FETCH_ASSOC);
            $deals = array_map(static fn($r) => [
                'id' => (int)$r['pipedrive_id'], 'title' => $r['title'],
                'value' => $r['value'] !== null ? (float)$r['value'] : null, 'currency' => $r['currency'],
                'owner' => $r['owner'], 'org' => $r['org'],
                'owner_id' => $r['owner_id'] !== null ? (int)$r['owner_id'] : null,
                'stage' => $r['stage'], 'stage_id' => $r['stage_id'] !== null ? (int)$r['stage_id'] : null,
                'pipeline' => $r['pipeline'], 'pipeline_id' => $r['pipeline_id'] !== null ? (int)$r['pipeline_id'] : null,
                'expected_close_date' => $r['expected_close_date'], 'update_time' => $r['update_time'],
            ], $rows);
            $alerts[] = ['key' => $key, 'label' => $label, 'description' => $desc, 'severity' => $sev,
                         'count' => $count, 'valor' => $valor, 'deals' => $deals];
        }

        return [
            'alerts' => $alerts,
            'total_abertos' => (int)$this->pdo->query("SELECT COUNT(*) FROM pipe_deals WHERE is_deleted=0 AND status='open'")->fetchColumn(),
            'resumo' => $this->alertsResumo($defs),
        ];
    }

    /**
     * Painel de risco dos alertas (Fase 4). Somar os `count` de cada alerta CONTA O MESMO
     * negocio varias vezes — um negocio parado e sem previsao aparece em dois alertas. Aqui
     * medimos NEGOCIOS DISTINTOS que disparam pelo menos um alerta, com a uniao das condicoes.
     * @param array<int,array{0:string,1:string,2:string,3:string,4:string}> $defs
     */
    private function alertsResumo(array $defs): array
    {
        $abertos = "d.is_deleted=0 AND d.status='open'";
        $uniao   = '(' . implode(' OR ', array_map(static fn($x) => "({$x[4]})", $defs)) . ')';
        $where   = "{$abertos} AND {$uniao}";

        $tot = $this->pdo->query(
            "SELECT COUNT(*) n, COALESCE(SUM(d.value),0) v FROM pipe_deals d WHERE {$where}"
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        // Por severidade: negocios com PELO MENOS UM alerta daquela severidade (podem
        // repetir entre severidades — o rotulo na tela diz isso).
        $porSeveridade = [];
        foreach (['high', 'medium', 'low'] as $sev) {
            $conds = array_values(array_filter($defs, static fn($x) => $x[3] === $sev));
            if (!$conds) { continue; }
            $u = '(' . implode(' OR ', array_map(static fn($x) => "({$x[4]})", $conds)) . ')';
            $r = $this->pdo->query(
                "SELECT COUNT(*) n, COALESCE(SUM(d.value),0) v FROM pipe_deals d WHERE {$abertos} AND {$u}"
            )->fetch(PDO::FETCH_ASSOC) ?: [];
            $porSeveridade[] = [
                'severity' => $sev,
                'regras'   => count($conds),
                'count'    => (int)($r['n'] ?? 0),
                'valor'    => (float)($r['v'] ?? 0),
            ];
        }

        // Agrupamentos: sempre sobre os negocios DISTINTOS da uniao.
        $grupo = function (string $join, string $col, string $rotulo) use ($where): array {
            $st = $this->pdo->query(
                "SELECT COALESCE({$col}, '—') AS nome, COUNT(*) n, COALESCE(SUM(d.value),0) v
                   FROM pipe_deals d {$join}
                  WHERE {$where}
               GROUP BY nome ORDER BY n DESC, v DESC LIMIT 12"
            );
            return array_map(static fn($r) => [
                'nome' => $r['nome'], 'count' => (int)$r['n'], 'valor' => (float)$r['v'],
            ], $st->fetchAll(PDO::FETCH_ASSOC));
        };

        return [
            'negocios_afetados' => (int)($tot['n'] ?? 0),
            'valor_em_risco'    => (float)($tot['v'] ?? 0),
            'por_severidade'    => $porSeveridade,
            'por_dono'   => $grupo('LEFT JOIN pipe_users u ON u.pipedrive_id=d.owner_id', 'u.name', 'dono'),
            'por_funil'  => $grupo('LEFT JOIN pipe_pipelines pl ON pl.pipedrive_id=d.pipeline_id', 'pl.name', 'funil'),
            'por_etapa'  => $grupo('LEFT JOIN pipe_stages s ON s.pipedrive_id=d.stage_id', 's.name', 'etapa'),
        ];
    }

    /**
     * Quadro Kanban: etapas de um funil, cada uma com seus negocios ABERTOS.
     * @version 2.0.0 (Fase 5 — cartoes ricos)
     *
     * v1 tinha um defeito de contagem: `count` era o tamanho da PAGINA (LIMIT 200), entao
     * uma etapa com 250 abertos anunciava 200 e o valor da coluna somava so os 200 trazidos.
     * Agora contagem e soma vem de um agregado proprio, e a pagina e so o que se desenha.
     *
     * ⚠️ COLUNAS MORTAS: `next_activity_date`, `activities_overdue_count`, `is_stalled`,
     * `no_activity` e `close_overdue` existem no schema mas o sync NUNCA as popula (medido:
     * 0 de 252 abertos). Ler delas devolveria "nenhum alerta" em silencio — os sinais do
     * cartao sao derivados de `pipe_activities` e das datas do proprio negocio, com as MESMAS
     * regras de `commercialAlerts()`, para as duas telas nao se contradizerem.
     */
    /**
     * Quadro Kanban dos negocios ABERTOS de um funil (backlog #26: filtro por dono e
     * por previsao de fechamento).
     *
     * $prazo aceita: null|'todos' (sem recorte), 'vencidos', 'mes', 'd30', 'd90' e
     * 'sem_previsao'. O balde 'sem_previsao' existe de proposito: 121 dos 253 abertos
     * desta base NAO tem expected_close_date, entao qualquer recorte por data esconde
     * metade do quadro. Melhor virar recorte que o usuario escolhe ver do que sumico
     * silencioso — e a UI informa quantos ficaram de fora.
     *
     * O MESMO filtro entra nas tres consultas (agregado, pagina de cartoes e donos):
     * filtrar so a pagina faria a contagem do cabecalho mentir sobre a lista.
     */
    /** Recortes por previsao de fechamento aceitos pelo Kanban (#26). Fonte unica: o
     *  controller valida contra esta lista e o repositorio a usa como allow-list. */
    public const KANBAN_PRAZOS = ['todos', 'vencidos', 'mes', 'd30', 'd90', 'sem_previsao'];

    /**
     * Monta o WHERE extra do Kanban (#26). Devolve [sql, params].
     *
     * O trecho de SQL sai de uma ALLOW-LIST de constantes: o valor de $prazo so
     * ESCOLHE qual string constante e usada, nunca e concatenado. O dono vai por
     * placeholder. Prazo desconhecido = sem recorte (falha para o lado de mostrar
     * tudo, nunca para o de esconder em silencio).
     */
    private function kanbanFiltroSql(?int $ownerId, ?string $prazo): array
    {
        $sql = '';
        $params = [];

        if ($ownerId !== null) {
            $sql .= ' AND owner_id = :fowner';
            $params[':fowner'] = $ownerId;
        }

        // Recortes por previsao de fechamento (expected_close_date).
        $porPrazo = [
            'vencidos'     => ' AND expected_close_date IS NOT NULL AND expected_close_date <  CURDATE()',
            'mes'          => ' AND expected_close_date IS NOT NULL'
                            . ' AND expected_close_date BETWEEN CURDATE() AND LAST_DAY(CURDATE())',
            'd30'          => ' AND expected_close_date IS NOT NULL'
                            . ' AND expected_close_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)',
            'd90'          => ' AND expected_close_date IS NOT NULL'
                            . ' AND expected_close_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)',
            'sem_previsao' => ' AND expected_close_date IS NULL',
        ];
        if ($prazo !== null && isset($porPrazo[$prazo])) {
            $sql .= $porPrazo[$prazo];
        }

        return [$sql, $params];
    }

    public function kanbanBoard(
        ?int $pipelineId,
        int $porEtapa = 200,
        ?int $ownerId = null,
        ?string $prazo = null
    ): array
    {
        $porEtapa = max(20, min($porEtapa, 500));

        $pipes = $this->pdo->query(
            "SELECT pipedrive_id AS id, name FROM pipe_pipelines WHERE is_active=1 ORDER BY order_nr, name"
        )->fetchAll(PDO::FETCH_ASSOC);
        if (!$pipes) {
            return ['pipeline_id' => null, 'pipeline_name' => null, 'pipelines' => [], 'columns' => [],
                    'etiquetas' => [], 'limite_por_etapa' => $porEtapa, 'totais' => ['count' => 0, 'valor' => 0.0]];
        }

        if ($pipelineId === null || !in_array($pipelineId, array_map(static fn($p) => (int)$p['id'], $pipes), true)) {
            $pipelineId = (int)$pipes[0]['id'];
        }
        $pipeName = null;
        foreach ($pipes as $p) { if ((int)$p['id'] === $pipelineId) { $pipeName = $p['name']; } }

        // 1) Etapas do funil.
        $stStages = $this->pdo->prepare(
            "SELECT pipedrive_id AS id, name, order_nr, deal_probability FROM pipe_stages
              WHERE pipeline_pd_id = :pl AND is_active = 1 ORDER BY order_nr"
        );
        $stStages->execute([':pl' => $pipelineId]);
        $stages = $stStages->fetchAll(PDO::FETCH_ASSOC);

        // Filtros de #26. `kanbanFiltroSql` devolve SQL de CONSTANTES (allow-list) —
        // nada vindo do usuario entra na string; o dono vai por placeholder.
        [$filtroSql, $filtroParams] = $this->kanbanFiltroSql($ownerId, $prazo);

        // Donos com negocio aberto NESTE funil, para alimentar o seletor. Nao aplica o
        // filtro de dono (senao a lista encolheria para o proprio filtro e nao daria
        // para trocar), mas aplica o de prazo, que e o recorte em vigor.
        [$prazoSql, $prazoParams] = $this->kanbanFiltroSql(null, $prazo);
        $stOwners = $this->pdo->prepare(
            "SELECT d.owner_id AS id, COALESCE(u.name,'(sem dono)') AS name, COUNT(*) n
               FROM pipe_deals d
          LEFT JOIN pipe_users u ON u.pipedrive_id = d.owner_id
              WHERE d.is_deleted=0 AND d.status='open' AND d.pipeline_id = :pl {$prazoSql}
           GROUP BY d.owner_id, u.name
           ORDER BY n DESC"
        );
        $stOwners->execute(array_merge([':pl' => $pipelineId], $prazoParams));
        $owners = array_map(static fn($r) => [
            'id' => $r['id'] !== null ? (int)$r['id'] : null,
            'name' => $r['name'],
            'count' => (int)$r['n'],
        ], $stOwners->fetchAll(PDO::FETCH_ASSOC));

        // Quantos abertos do funil ficam FORA por nao terem previsao — o numero que a
        // tela mostra quando ha recorte por data, para o sumico nao ser silencioso.
        $stSemPrev = $this->pdo->prepare(
            "SELECT COUNT(*) FROM pipe_deals
              WHERE is_deleted=0 AND status='open' AND pipeline_id = :pl
                AND expected_close_date IS NULL"
        );
        $stSemPrev->execute([':pl' => $pipelineId]);
        $semPrevisao = (int)$stSemPrev->fetchColumn();

        // 2) Contagem e soma REAIS por etapa (independentes da pagina desenhada).
        $stAgg = $this->pdo->prepare(
            "SELECT stage_id, COUNT(*) n, COALESCE(SUM(value),0) v
               FROM pipe_deals
              WHERE is_deleted=0 AND status='open' AND pipeline_id = :pl {$filtroSql}
           GROUP BY stage_id"
        );
        $stAgg->execute(array_merge([':pl' => $pipelineId], $filtroParams));
        $agg = [];
        foreach ($stAgg->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $agg[(int)$r['stage_id']] = ['n' => (int)$r['n'], 'v' => (float)$r['v']];
        }

        // 3) Os N maiores de CADA etapa numa consulta so. ROW_NUMBER numera dentro da etapa
        //    (MySQL 8) e os JOINs/subconsultas caros rodam so sobre o recorte ja limitado.
        $stDeals = $this->pdo->prepare(
            "SELECT d.pipedrive_id, d.stage_id, d.title, d.value, d.currency, d.probability,
                    d.expected_close_date, d.add_time, d.update_time, d.stage_change_time, d.label_ids,
                    u.name AS owner, o.name AS org, pe.name AS person,
                    DATEDIFF(NOW(), COALESCE(d.stage_change_time, d.add_time)) AS dias_na_etapa,
                    (d.stage_change_time IS NULL)                              AS sem_marco_de_etapa,
                    (SELECT MIN(a.due_date) FROM pipe_activities a
                      WHERE a.deal_pd_id = d.pipedrive_id AND a.is_deleted=0 AND a.done=0
                        AND a.due_date IS NOT NULL AND a.due_date >= CURDATE())  AS prox_ativ,
                    (SELECT COUNT(*) FROM pipe_activities a
                      WHERE a.deal_pd_id = d.pipedrive_id AND a.is_deleted=0 AND a.done=0
                        AND a.due_date IS NOT NULL AND a.due_date <  CURDATE())  AS ativ_atrasadas
               FROM (
                    SELECT pipedrive_id, stage_id,
                           ROW_NUMBER() OVER (PARTITION BY stage_id ORDER BY value DESC, update_time DESC) rn
                      FROM pipe_deals
                     WHERE is_deleted=0 AND status='open' AND pipeline_id = :pl {$filtroSql}
                    ) r
               JOIN pipe_deals d        ON d.pipedrive_id = r.pipedrive_id
          LEFT JOIN pipe_users u        ON u.pipedrive_id = d.owner_id
          LEFT JOIN pipe_organizations o ON o.pipedrive_id = d.org_id
          LEFT JOIN pipe_persons pe     ON pe.pipedrive_id = d.person_id
              WHERE r.rn <= :lim
           ORDER BY d.stage_id, d.value DESC, d.update_time DESC"
        );
        $stDeals->bindValue(':pl', $pipelineId, PDO::PARAM_INT);
        $stDeals->bindValue(':lim', $porEtapa, PDO::PARAM_INT);
        foreach ($filtroParams as $k => $v) {
            $stDeals->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stDeals->execute();

        $etiquetas = $this->etiquetasDeNegocio();
        $porStage = [];
        foreach ($stDeals->fetchAll(PDO::FETCH_ASSOC) as $d) {
            $porStage[(int)$d['stage_id']][] = $this->cartaoKanban($d, $etiquetas);
        }

        $columns = [];
        foreach ($stages as $s) {
            $id = (int)$s['id'];
            $a  = $agg[$id] ?? ['n' => 0, 'v' => 0.0];
            $lista = $porStage[$id] ?? [];
            $columns[] = [
                'stage_id'    => $id,
                'stage'       => $s['name'],
                'order'       => (int)$s['order_nr'],
                'probability' => $s['deal_probability'] !== null ? (int)$s['deal_probability'] : null,
                'count'       => $a['n'],
                'valor'       => $a['v'],
                'exibidos'    => count($lista),
                'deals'       => $lista,
            ];
        }

        return [
            'pipeline_id'   => $pipelineId,
            'pipeline_name' => $pipeName,
            'pipelines'     => array_map(static fn($p) => ['id' => (int)$p['id'], 'name' => $p['name']], $pipes),
            'owners'        => $owners,
            'filtros'       => [
                'owner_id' => $ownerId,
                'prazo'    => $prazo ?? 'todos',
                // Abertos do funil sem previsao de fechamento. Quando ha recorte por
                // data, estes NAO entram (exceto no proprio balde 'sem_previsao') — a
                // tela usa este numero para dizer o que ficou fora.
                'sem_previsao_no_funil' => $semPrevisao,
            ],
            'columns'       => $columns,
            'etiquetas'     => array_map(static fn($id, $nome) => ['id' => $id, 'label' => $nome],
                                         array_keys($etiquetas), array_values($etiquetas)),
            'limite_por_etapa' => $porEtapa,
            'totais' => [
                'count' => array_sum(array_column($columns, 'count')),
                'valor' => array_sum(array_column($columns, 'valor')),
            ],
        ];
    }

    /**
     * Dicionario id => rotulo das etiquetas de NEGOCIO (campo `label`, tipo set).
     * A cor NAO e sincronizada (o Pipedrive a expoe em dealFields e nossa
     * `pipe_custom_field_options` so guarda id+rotulo) — a UI usa cor deterministica pelo id
     * em vez de chutar semantica que poderia contradizer o CRM.
     * @return array<int,string>
     */
    private function etiquetasDeNegocio(): array
    {
        $st = $this->pdo->query(
            "SELECT o.option_id, o.label
               FROM pipe_custom_fields f
               JOIN pipe_custom_field_options o ON o.field_id = f.id
              WHERE f.entity = 'deal' AND f.field_key = 'label'
           ORDER BY o.option_id"
        );
        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) { $out[(int)$r['option_id']] = $r['label']; }
        return $out;
    }

    /** Monta um cartao do Kanban a partir da linha crua, derivando os sinais de atencao. */
    private function cartaoKanban(array $d, array $etiquetas): array
    {
        $hoje = date('Y-m-d');
        $fecha = $d['expected_close_date'] ?: null;
        $atrasadas = (int)$d['ativ_atrasadas'];
        $prox = $d['prox_ativ'] ?: null;

        // MESMAS regras de commercialAlerts(): as duas telas tem de concordar.
        $alertas = [];
        if ($atrasadas > 0)                     { $alertas[] = 'ativ_atrasada'; }
        if ($fecha !== null && $fecha < $hoje)  { $alertas[] = 'fechamento_vencido'; }
        if ($prox === null)                     { $alertas[] = 'sem_atividade'; }
        if (!empty($d['update_time']) && strtotime((string)$d['update_time']) < strtotime('-30 days')) {
            $alertas[] = 'parado';
        }
        if ($fecha === null)                    { $alertas[] = 'sem_previsao'; }

        $ids = array_values(array_filter(array_map(
            static fn($x) => ctype_digit(trim($x)) ? (int)trim($x) : null,
            explode(',', (string)($d['label_ids'] ?? ''))
        ), static fn($x) => $x !== null));

        return [
            'id'       => (int)$d['pipedrive_id'],
            'title'    => $d['title'],
            'value'    => $d['value'] !== null ? (float)$d['value'] : null,
            'currency' => $d['currency'],
            'owner'    => $d['owner'],
            'org'      => $d['org'],
            'person'   => $d['person'],
            'probability' => $d['probability'] !== null ? (float)$d['probability'] : null,
            'expected_close_date' => $fecha,
            'add_time'    => $d['add_time'],
            'update_time' => $d['update_time'],
            'dias_na_etapa' => $d['dias_na_etapa'] !== null ? (int)$d['dias_na_etapa'] : null,
            // true = nao ha marco de entrada na etapa; o tempo esta medido DA CRIACAO do negocio.
            'desde_criacao' => (bool)$d['sem_marco_de_etapa'],
            'proxima_atividade'   => $prox,
            'atividades_atrasadas' => $atrasadas,
            'labels'  => array_values(array_filter($ids, static fn($i) => isset($etiquetas[$i]))),
            'alertas' => $alertas,
        ];
    }

    /** Detalhe de UMA pessoa + org + seus negocios + atividades. */
    public function personDetail(int $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT p.pipedrive_id, p.name, p.primary_email, p.primary_phone, p.job_title, p.custom_fields,
                    p.add_time, p.update_time, o.pipedrive_id AS org_id, o.name AS org_name, u.name AS owner
             FROM pipe_persons p
             LEFT JOIN pipe_organizations o ON o.pipedrive_id = p.org_id
             LEFT JOIN pipe_users u ON u.pipedrive_id = p.owner_id
             WHERE p.pipedrive_id = :id LIMIT 1"
        );
        $st->execute([':id' => $id]);
        $p = $st->fetch(PDO::FETCH_ASSOC);
        if (!$p) { return null; }

        $deals = $this->pdo->prepare(
            "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.status, s.name AS stage
             FROM pipe_deals d LEFT JOIN pipe_stages s ON s.pipedrive_id = d.stage_id
             WHERE d.person_id = :id AND d.is_deleted = 0 ORDER BY d.update_time DESC LIMIT 60"
        );
        $deals->execute([':id' => $id]);
        $acts = $this->pdo->prepare(
            "SELECT subject, type, done, due_date FROM pipe_activities
             WHERE person_pd_id = :id AND is_deleted = 0 ORDER BY COALESCE(due_date, add_time) DESC LIMIT 60"
        );
        $acts->execute([':id' => $id]);

        return [
            'person' => [
                'id' => (int)$p['pipedrive_id'], 'name' => $p['name'], 'email' => $p['primary_email'],
                'phone' => $p['primary_phone'], 'job_title' => $p['job_title'],
                'org' => $p['org_name'], 'org_id' => $p['org_id'] ? (int)$p['org_id'] : null,
                'owner' => $p['owner'], 'add_time' => $p['add_time'], 'update_time' => $p['update_time'],
                'custom_fields' => $this->resolveCustomFields('person', $p['custom_fields'] ?? null),
            ],
            'deals' => array_map([$this, 'miniDeal'], $deals->fetchAll(PDO::FETCH_ASSOC)),
            'activities' => array_map(static fn($a) => [
                'subject' => $a['subject'], 'type' => $a['type'], 'done' => (int)$a['done'], 'due_date' => $a['due_date'],
            ], $acts->fetchAll(PDO::FETCH_ASSOC)),
            'notes' => $this->notasDe('person_pd_id', $id),
        ];
    }

    /** Detalhe de UMA organizacao + pessoas + negocios + resumo de valores. */
    public function orgDetail(int $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT o.pipedrive_id, o.name, o.cnpj, o.address, o.city, o.state, o.country, o.custom_fields,
                    o.add_time, o.update_time, u.name AS owner
             FROM pipe_organizations o LEFT JOIN pipe_users u ON u.pipedrive_id = o.owner_id
             WHERE o.pipedrive_id = :id LIMIT 1"
        );
        $st->execute([':id' => $id]);
        $o = $st->fetch(PDO::FETCH_ASSOC);
        if (!$o) { return null; }

        $people = $this->pdo->prepare(
            "SELECT pipedrive_id, name, primary_email FROM pipe_persons
             WHERE org_id = :id AND is_deleted = 0 ORDER BY name LIMIT 60"
        );
        $people->execute([':id' => $id]);
        $deals = $this->pdo->prepare(
            "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.status, s.name AS stage
             FROM pipe_deals d LEFT JOIN pipe_stages s ON s.pipedrive_id = d.stage_id
             WHERE d.org_id = :id AND d.is_deleted = 0 ORDER BY d.update_time DESC LIMIT 60"
        );
        $deals->execute([':id' => $id]);
        $resumo = $this->pdo->prepare(
            "SELECT COUNT(*) total, SUM(status='open') abertos, SUM(status='won') ganhos,
                    COALESCE(SUM(CASE WHEN status='won' THEN value END),0) valor_ganho
             FROM pipe_deals WHERE org_id = :id AND is_deleted = 0"
        );
        $resumo->execute([':id' => $id]);
        $rz = $resumo->fetch(PDO::FETCH_ASSOC) ?: [];
        $orgActs = $this->pdo->prepare(
            "SELECT subject, type, done, due_date FROM pipe_activities
             WHERE org_pd_id = :id AND is_deleted = 0 ORDER BY COALESCE(due_date, add_time) DESC LIMIT 60"
        );
        $orgActs->execute([':id' => $id]);

        return [
            'organization' => [
                'id' => (int)$o['pipedrive_id'], 'name' => $o['name'], 'cnpj' => $o['cnpj'],
                'address' => $o['address'], 'city' => $o['city'], 'state' => $o['state'], 'country' => $o['country'],
                'owner' => $o['owner'], 'add_time' => $o['add_time'], 'update_time' => $o['update_time'],
                'custom_fields' => $this->resolveCustomFields('organization', $o['custom_fields'] ?? null),
            ],
            'summary' => [
                'total' => (int)($rz['total'] ?? 0), 'abertos' => (int)($rz['abertos'] ?? 0),
                'ganhos' => (int)($rz['ganhos'] ?? 0), 'valor_ganho' => (float)($rz['valor_ganho'] ?? 0),
            ],
            'people' => array_map(static fn($r) => ['id' => (int)$r['pipedrive_id'], 'name' => $r['name'], 'email' => $r['primary_email']], $people->fetchAll(PDO::FETCH_ASSOC)),
            'deals' => array_map([$this, 'miniDeal'], $deals->fetchAll(PDO::FETCH_ASSOC)),
            'activities' => array_map(static fn($a) => [
                'subject' => $a['subject'], 'type' => $a['type'], 'done' => (int)$a['done'], 'due_date' => $a['due_date'],
            ], $orgActs->fetchAll(PDO::FETCH_ASSOC)),
            'notes' => $this->notasDe('org_pd_id', $id),
        ];
    }

    /** Notas vinculadas a uma entidade (para as abas dos drawers). $coluna e allow-list interna. */
    private function notasDe(string $coluna, int $id, int $limite = 60): array
    {
        // $coluna NUNCA vem de entrada do usuario: so os literais abaixo sao aceitos.
        if (!in_array($coluna, ['person_pd_id', 'org_pd_id', 'deal_pd_id', 'lead_pd_id'], true)) { return []; }
        $st = $this->pdo->prepare(
            "SELECT LEFT(n.content_sanitized, 400) AS content, n.add_time, u.name AS author
             FROM pipe_notes n LEFT JOIN pipe_users u ON u.pipedrive_id = n.user_id
             WHERE n.{$coluna} = :id AND n.is_deleted = 0 ORDER BY n.add_time DESC LIMIT " . (int)$limite
        );
        $st->execute([':id' => $id]);
        return array_map(static fn($n) => [
            'content' => $n['content'], 'add_time' => $n['add_time'], 'author' => $n['author'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Resumo minimo de um negocio (para listas dentro de detalhes). */
    private function miniDeal(array $d): array
    {
        return [
            'id' => (int)$d['pipedrive_id'], 'title' => $d['title'],
            'value' => $d['value'] !== null ? (float)$d['value'] : null, 'currency' => $d['currency'],
            'status' => $d['status'], 'stage' => $d['stage'] ?? null,
        ];
    }

    /** Lista paginada de LEADS. $f: page,per_page,sort,dir,q,archived */
    public function leadsPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['title' => 'l.title', 'value' => 'l.value', 'update_time' => 'l.update_time', 'add_time' => 'l.add_time'];
        $sort = $sortMap[$f['sort'] ?? 'update_time'] ?? 'l.update_time';

        $where = ['l.is_deleted = 0']; $params = [];
        if (isset($f['archived']) && in_array((string)$f['archived'], ['0', '1'], true)) { $where[] = 'l.is_archived = :arc'; $params[':arc'] = (int)$f['archived']; }
        if (isset($f['q']) && trim((string)$f['q']) !== '') { $where[] = 'l.title LIKE :q'; $params[':q'] = '%' . trim((string)$f['q']) . '%'; }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_leads l WHERE $whereSql", $params)->fetchColumn();
        $sql = "SELECT l.pipedrive_id, l.title, l.value, l.currency, l.origin, l.is_archived,
                       u.name AS owner, o.name AS org, p.name AS person, l.converted_deal_id,
                       l.add_time, l.update_time
                FROM pipe_leads l
                LEFT JOIN pipe_users u ON u.pipedrive_id = l.owner_id
                LEFT JOIN pipe_organizations o ON o.pipedrive_id = l.org_id
                LEFT JOIN pipe_persons p ON p.pipedrive_id = l.person_id
                WHERE $whereSql ORDER BY $sort $dir, l.id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = array_map(static fn($r) => [
            'id' => (string)$r['pipedrive_id'], 'title' => $r['title'],
            'value' => $r['value'] !== null ? (float)$r['value'] : null, 'currency' => $r['currency'],
            'origin' => $r['origin'], 'archived' => (int)$r['is_archived'], 'owner' => $r['owner'],
            'org' => $r['org'], 'person' => $r['person'], 'converted' => $r['converted_deal_id'] !== null,
            'add_time' => $r['add_time'], 'update_time' => $r['update_time'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
        return $this->pageEnvelope($rows, $total, $page, $perPage);
    }

    /** Lista paginada de PRODUTOS. $f: page,per_page,sort,dir,q,category */
    public function productsPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['name' => 'pr.name', 'code' => 'pr.code', 'update_time' => 'pr.update_time', 'add_time' => 'pr.add_time'];
        $sort = $sortMap[$f['sort'] ?? 'name'] ?? 'pr.name';

        $where = ['pr.is_deleted = 0']; $params = [];
        if (!empty($f['category'])) { $where[] = 'pr.category = :cat'; $params[':cat'] = (string)$f['category']; }
        if (isset($f['q']) && trim((string)$f['q']) !== '') {
            $where[] = '(pr.name LIKE :q1 OR pr.code LIKE :q2)';
            $like = '%' . trim((string)$f['q']) . '%';
            $params[':q1'] = $like; $params[':q2'] = $like;
        }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_products pr WHERE $whereSql", $params)->fetchColumn();
        $cfKeys = $this->cfKeysValidas('product', $f['cf'] ?? null);   // #11
        $cfSel  = $cfKeys ? ', pr.custom_fields' : '';
        $sql = "SELECT pr.pipedrive_id, pr.name, pr.code, pr.category, pr.unit, pr.tax, u.name AS owner, pr.update_time,
                       (SELECT pp.price FROM pipe_product_prices pp WHERE pp.product_pd_id=pr.pipedrive_id ORDER BY pp.id LIMIT 1) AS price,
                       (SELECT pp.currency FROM pipe_product_prices pp WHERE pp.product_pd_id=pr.pipedrive_id ORDER BY pp.id LIMIT 1) AS currency{$cfSel}
                FROM pipe_products pr LEFT JOIN pipe_users u ON u.pipedrive_id = pr.owner_id
                WHERE $whereSql ORDER BY $sort $dir, pr.pipedrive_id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = array_map(fn($r) => [
            'id' => (int)$r['pipedrive_id'], 'name' => $r['name'], 'code' => $r['code'],
            'category' => $r['category'], 'unit' => $r['unit'],
            'price' => $r['price'] !== null ? (float)$r['price'] : null, 'currency' => $r['currency'],
            'tax' => $r['tax'] !== null ? (float)$r['tax'] : null, 'owner' => $r['owner'], 'update_time' => $r['update_time'],
            'cf' => $this->cfSubset('product', $r['custom_fields'] ?? null, $cfKeys),
        ], $st->fetchAll(PDO::FETCH_ASSOC));
        $cats = self::querFacets($f)
            ? $this->pdo->query("SELECT DISTINCT category FROM pipe_products WHERE is_deleted=0 AND category IS NOT NULL AND category<>'' ORDER BY category LIMIT 60")->fetchAll(PDO::FETCH_COLUMN)
            : null;
        return $this->pageEnvelope($rows, $total, $page, $perPage,
            ['facets' => $cats !== null ? ['categories' => $cats] : null, 'cf_aplicados' => $cfKeys]);
    }

    /** Detalhe de UMA atividade + vinculos (negocio/pessoa/organizacao) — backlog #18. */
    public function activityDetail(int $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT a.pipedrive_id, a.subject, a.type, a.done, a.due_date, a.due_time, a.duration,
                    a.location, a.note, a.marked_done_time, a.add_time, a.update_time,
                    (a.done=0 AND a.due_date IS NOT NULL AND a.due_date < CURDATE()) AS overdue,
                    u.name AS owner,
                    d.pipedrive_id AS deal_id, d.title AS deal_title, d.status AS deal_status,
                    p.pipedrive_id AS person_id, p.name AS person_name, p.primary_email AS person_email, p.primary_phone AS person_phone,
                    o.pipedrive_id AS org_id, o.name AS org_name
               FROM pipe_activities a
          LEFT JOIN pipe_users u         ON u.pipedrive_id = a.owner_id
          LEFT JOIN pipe_deals d         ON d.pipedrive_id = a.deal_pd_id
          LEFT JOIN pipe_persons p       ON p.pipedrive_id = a.person_pd_id
          LEFT JOIN pipe_organizations o ON o.pipedrive_id = a.org_pd_id
              WHERE a.pipedrive_id = :id LIMIT 1"
        );
        $st->execute([':id' => $id]);
        $a = $st->fetch(PDO::FETCH_ASSOC);
        if (!$a) { return null; }

        return [
            'activity' => [
                'id' => (int)$a['pipedrive_id'], 'subject' => $a['subject'], 'type' => $a['type'],
                'done' => (int)$a['done'], 'overdue' => (int)$a['overdue'],
                'due_date' => $a['due_date'], 'due_time' => $a['due_time'], 'duration' => $a['duration'],
                'location' => $a['location'], 'note' => $a['note'], 'owner' => $a['owner'],
                'marked_done_time' => $a['marked_done_time'], 'add_time' => $a['add_time'], 'update_time' => $a['update_time'],
            ],
            'deal'         => $a['deal_id'] !== null ? ['id' => (int)$a['deal_id'], 'title' => $a['deal_title'], 'status' => $a['deal_status']] : null,
            'person'       => $a['person_id'] !== null ? ['id' => (int)$a['person_id'], 'name' => $a['person_name'], 'email' => $a['person_email'], 'phone' => $a['person_phone']] : null,
            'organization' => $a['org_id'] !== null ? ['id' => (int)$a['org_id'], 'name' => $a['org_name']] : null,
        ];
    }

    /** Detalhe de UM lead + vinculos + status de conversao — backlog #19. (id = UUID) */
    public function leadDetail(string $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT l.pipedrive_id, l.title, l.value, l.currency, l.origin, l.is_archived,
                    l.converted_deal_id, l.add_time, l.update_time, l.next_activity_date,
                    u.name AS owner,
                    p.pipedrive_id AS person_id, p.name AS person_name, p.primary_email AS person_email, p.primary_phone AS person_phone,
                    o.pipedrive_id AS org_id, o.name AS org_name,
                    cd.title AS converted_title, cd.status AS converted_status
               FROM pipe_leads l
          LEFT JOIN pipe_users u         ON u.pipedrive_id = l.owner_id
          LEFT JOIN pipe_persons p       ON p.pipedrive_id = l.person_id
          LEFT JOIN pipe_organizations o ON o.pipedrive_id = l.org_id
          LEFT JOIN pipe_deals cd        ON cd.pipedrive_id = l.converted_deal_id
              WHERE l.pipedrive_id = :id LIMIT 1"
        );
        $st->execute([':id' => $id]);
        $l = $st->fetch(PDO::FETCH_ASSOC);
        if (!$l) { return null; }

        return [
            'lead' => [
                'id' => (string)$l['pipedrive_id'], 'title' => $l['title'],
                'value' => $l['value'] !== null ? (float)$l['value'] : null, 'currency' => $l['currency'],
                'origin' => $l['origin'], 'archived' => (int)$l['is_archived'],
                'next_activity_date' => $l['next_activity_date'], 'owner' => $l['owner'],
                'add_time' => $l['add_time'], 'update_time' => $l['update_time'],
            ],
            'person'       => $l['person_id'] !== null ? ['id' => (int)$l['person_id'], 'name' => $l['person_name'], 'email' => $l['person_email'], 'phone' => $l['person_phone']] : null,
            'organization' => $l['org_id'] !== null ? ['id' => (int)$l['org_id'], 'name' => $l['org_name']] : null,
            'converted'    => $l['converted_deal_id'] !== null ? ['id' => (int)$l['converted_deal_id'], 'title' => $l['converted_title'], 'status' => $l['converted_status']] : null,
        ];
    }

    /** Detalhe de UM produto + precos + negocios que o utilizam — backlog #20. */
    public function productDetail(int $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT pr.pipedrive_id, pr.name, pr.code, pr.category, pr.description, pr.unit, pr.tax,
                    pr.is_active, pr.add_time, pr.update_time, u.name AS owner
               FROM pipe_products pr
          LEFT JOIN pipe_users u ON u.pipedrive_id = pr.owner_id
              WHERE pr.pipedrive_id = :id LIMIT 1"
        );
        $st->execute([':id' => $id]);
        $p = $st->fetch(PDO::FETCH_ASSOC);
        if (!$p) { return null; }

        $pr = $this->pdo->prepare("SELECT price, currency, cost FROM pipe_product_prices WHERE product_pd_id = :id ORDER BY id");
        $pr->execute([':id' => $id]);
        $precos = array_map(static fn($r) => [
            'price'    => $r['price'] !== null ? (float)$r['price'] : null,
            'currency' => $r['currency'],
            'cost'     => $r['cost'] !== null ? (float)$r['cost'] : null,
        ], $pr->fetchAll(PDO::FETCH_ASSOC));

        $sum = $this->pdo->prepare(
            "SELECT COUNT(DISTINCT dp.deal_pd_id) deals, COALESCE(SUM(dp.`sum`),0) valor_total
               FROM pipe_deal_products dp
               JOIN pipe_deals d ON d.pipedrive_id = dp.deal_pd_id AND d.is_deleted = 0
              WHERE dp.product_pd_id = :id"
        );
        $sum->execute([':id' => $id]);
        $agg = $sum->fetch(PDO::FETCH_ASSOC) ?: ['deals' => 0, 'valor_total' => 0];

        $du = $this->pdo->prepare(
            "SELECT d.pipedrive_id AS id, d.title, d.value, d.currency, d.status,
                    dp.quantity, dp.`sum`
               FROM pipe_deal_products dp
               JOIN pipe_deals d ON d.pipedrive_id = dp.deal_pd_id AND d.is_deleted = 0
              WHERE dp.product_pd_id = :id
           ORDER BY dp.`sum` DESC LIMIT 20"
        );
        $du->execute([':id' => $id]);
        $deals = array_map(static fn($r) => [
            'id' => (int)$r['id'], 'title' => $r['title'],
            'value' => $r['value'] !== null ? (float)$r['value'] : null, 'currency' => $r['currency'],
            'status' => $r['status'], 'quantity' => (float)$r['quantity'], 'sum' => (float)$r['sum'],
        ], $du->fetchAll(PDO::FETCH_ASSOC));

        return [
            'product' => [
                'id' => (int)$p['pipedrive_id'], 'name' => $p['name'], 'code' => $p['code'],
                'category' => $p['category'], 'description' => $p['description'], 'unit' => $p['unit'],
                'tax' => $p['tax'] !== null ? (float)$p['tax'] : null, 'is_active' => (int)$p['is_active'],
                'owner' => $p['owner'], 'add_time' => $p['add_time'], 'update_time' => $p['update_time'],
            ],
            'prices'  => $precos,
            'summary' => ['deals' => (int)$agg['deals'], 'valor_total' => (float)$agg['valor_total']],
            'deals'   => $deals,
        ];
    }

    /** Lista paginada de NOTAS. $f: page,per_page,sort,dir,q */
    public function notesPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['update_time' => 'n.update_time', 'add_time' => 'n.add_time'];
        $sort = $sortMap[$f['sort'] ?? 'update_time'] ?? 'n.update_time';

        $where = ['n.is_deleted = 0']; $params = [];
        if (isset($f['q']) && trim((string)$f['q']) !== '') { $where[] = 'n.content_sanitized LIKE :q'; $params[':q'] = '%' . trim((string)$f['q']) . '%'; }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_notes n WHERE $whereSql", $params)->fetchColumn();
        $sql = "SELECT n.pipedrive_id, LEFT(n.content_sanitized, 160) AS content, u.name AS author,
                       n.deal_pd_id, n.person_pd_id, n.org_pd_id, n.lead_pd_id, n.add_time
                FROM pipe_notes n LEFT JOIN pipe_users u ON u.pipedrive_id = n.user_id
                WHERE $whereSql ORDER BY $sort $dir, n.pipedrive_id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = array_map(static function ($r) {
            $vinculo = $r['deal_pd_id'] ? 'Negócio' : ($r['person_pd_id'] ? 'Pessoa' : ($r['org_pd_id'] ? 'Organização' : ($r['lead_pd_id'] ? 'Lead' : '—')));
            return [
                'id' => (int)$r['pipedrive_id'], 'content' => $r['content'], 'author' => $r['author'],
                'vinculo' => $vinculo, 'add_time' => $r['add_time'],
            ];
        }, $st->fetchAll(PDO::FETCH_ASSOC));
        return $this->pageEnvelope($rows, $total, $page, $perPage);
    }

    /** Lista paginada de USUARIOS. $f: page,per_page,sort,dir,q,active */
    public function usersPage(array $f): array
    {
        [$page, $perPage, $offset, $dir] = $this->pageParams($f);
        $sortMap = ['name' => 'u.name', 'email' => 'u.email', 'last_login' => 'u.last_login'];
        $sort = $sortMap[$f['sort'] ?? 'name'] ?? 'u.name';

        $where = ['1=1']; $params = [];
        if (isset($f['active']) && in_array((string)$f['active'], ['0', '1'], true)) { $where[] = 'u.is_active = :act'; $params[':act'] = (int)$f['active']; }
        if (isset($f['q']) && trim((string)$f['q']) !== '') {
            $where[] = '(u.name LIKE :q1 OR u.email LIKE :q2)';
            $like = '%' . trim((string)$f['q']) . '%';
            $params[':q1'] = $like; $params[':q2'] = $like;
        }
        $whereSql = implode(' AND ', $where);

        $total = (int)$this->prepFetch("SELECT COUNT(*) FROM pipe_users u WHERE $whereSql", $params)->fetchColumn();
        $sql = "SELECT u.pipedrive_id, u.name, u.email, u.is_active, u.timezone, u.last_login
                FROM pipe_users u WHERE $whereSql ORDER BY $sort $dir, u.pipedrive_id DESC LIMIT :lim OFFSET :off";
        $st = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $perPage, PDO::PARAM_INT); $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = array_map(static fn($r) => [
            'id' => (int)$r['pipedrive_id'], 'name' => $r['name'], 'email' => $r['email'],
            'active' => (int)$r['is_active'], 'timezone' => $r['timezone'], 'last_login' => $r['last_login'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
        return $this->pageEnvelope($rows, $total, $page, $perPage);
    }

    /** Funis com etapas aninhadas + contagem/valor de negocios abertos por etapa. */
    public function pipelinesOverview(): array
    {
        $pipes = $this->pdo->query(
            "SELECT pipedrive_id, name, order_nr, is_active FROM pipe_pipelines ORDER BY order_nr, name"
        )->fetchAll(PDO::FETCH_ASSOC);
        $stmt = $this->pdo->prepare(
            "SELECT s.pipedrive_id, s.name, s.order_nr, s.deal_probability,
                    COUNT(d.id) AS deals_abertos, COALESCE(SUM(d.value),0) AS valor_aberto
             FROM pipe_stages s
             LEFT JOIN pipe_deals d ON d.stage_id = s.pipedrive_id AND d.is_deleted = 0 AND d.status = 'open'
             WHERE s.pipeline_pd_id = :pl AND s.is_active = 1
             GROUP BY s.pipedrive_id, s.name, s.order_nr, s.deal_probability
             ORDER BY s.order_nr"
        );
        $out = [];
        foreach ($pipes as $p) {
            $stmt->execute([':pl' => $p['pipedrive_id']]);
            $stages = array_map(static fn($s) => [
                'id' => (int)$s['pipedrive_id'], 'name' => $s['name'], 'order' => (int)$s['order_nr'],
                'probability' => $s['deal_probability'] !== null ? (int)$s['deal_probability'] : null,
                'deals_abertos' => (int)$s['deals_abertos'], 'valor_aberto' => (float)$s['valor_aberto'],
            ], $stmt->fetchAll(PDO::FETCH_ASSOC));
            $out[] = [
                'id' => (int)$p['pipedrive_id'], 'name' => $p['name'], 'order' => (int)$p['order_nr'],
                'is_active' => (int)$p['is_active'],
                'stages' => $stages,
                'total_deals' => array_sum(array_column($stages, 'deals_abertos')),
                'total_valor' => array_sum(array_column($stages, 'valor_aberto')),
            ];
        }
        return ['pipelines' => $out];
    }

    /** Definicoes de campos personalizados por entidade (+ opcoes). */
    public function customFields(string $entity): array
    {
        $st = $this->pdo->prepare(
            "SELECT id, pipedrive_id, field_key, name, field_type, order_nr, is_active
             FROM pipe_custom_fields WHERE entity = ? ORDER BY order_nr, name"
        );
        $st->execute([$entity]);
        $fields = $st->fetchAll(PDO::FETCH_ASSOC);
        if ($fields) {
            $ids = array_column($fields, 'id');
            $in = implode(',', array_fill(0, count($ids), '?'));
            $opt = $this->pdo->prepare("SELECT field_id, option_id, label FROM pipe_custom_field_options WHERE field_id IN ($in) ORDER BY id");
            $opt->execute($ids);
            $byField = [];
            foreach ($opt->fetchAll(PDO::FETCH_ASSOC) as $o) { $byField[$o['field_id']][] = ['id' => (int)$o['option_id'], 'label' => $o['label']]; }
            foreach ($fields as &$fl) { $fl['options'] = $byField[$fl['id']] ?? []; }
        }
        return $fields;
    }

    private function prepFetch(string $sql, array $params): PDOStatement
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($params);
        return $st;
    }

    /** Ultimas rodadas de sync (para o painel de status/diagnostico). */
    public function recentRuns(int $limit = 10): array
    {
        $st = $this->pdo->prepare(
            "SELECT run_type, entity, started_at, finished_at, processed, created, updated,
                    marked_deleted, errors, api_calls, token_cost, status
             FROM pipe_sync_runs ORDER BY id DESC LIMIT :lim"
        );
        $st->bindValue(':lim', $limit, PDO::PARAM_INT);
        $st->execute();
        return $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /** Resumo dos cursores (marca-d'agua por entidade). */
    public function cursors(): array
    {
        return $this->pdo->query(
            "SELECT entity, watermark_update_time, last_full_sync_at, updated_at
             FROM pipe_sync_cursors ORDER BY entity"
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
