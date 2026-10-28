<?php
// DataTables / ConnectionRepository - CRUD de DT_Conexao, DT_Servidor, DT_Ambiente
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// INVARIANTE DE SEGURANCA (§30): password_encrypted NUNCA sai deste repositorio
// para o front. Os metodos publicos de leitura usam COLS_PUBLIC (sem a coluna).
// Apenas findForConnect() - consumido pelo probe/inventario - traz o segredo.
declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/RepositoryException.php';
require_once __DIR__ . '/../lib/Crypto.php';

final class DtConnectionRepository
{
    /** Colunas seguras para devolver ao front. Sem password_encrypted. */
    private const COLS_PUBLIC = 'id, name, source_type, server_id, environment_id, application_id, module_id,
        host, port, db_name, username, ssl_enabled, extra_json, classification, status,
        monitoring_enabled, is_active, last_check_at, last_success_at, last_error,
        last_inventory_at, created_by, created_at, updated_at';

    /** Campos aceitos em create/update. Whitelist - nunca interpolar input em nome de coluna. */
    public const EDITABLE = [
        'name', 'source_type', 'server_id', 'environment_id', 'application_id', 'module_id',
        'host', 'port', 'db_name', 'username', 'ssl_enabled', 'extra_json',
        'classification', 'monitoring_enabled', 'is_active',
    ];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // LEITURA (segura)
    // ═══════════════════════════════════════════════════════════════

    /** Lista conexoes com nomes resolvidos de servidor/ambiente/aplicacao. */
    public function listAll(array $filters = []): array
    {
        $where  = ['1=1'];
        $params = [];

        if (isset($filters['environment_id']) && $filters['environment_id'] !== '') {
            $where[] = 'c.environment_id = :env';
            $params[':env'] = (int)$filters['environment_id'];
        }
        if (isset($filters['server_id']) && $filters['server_id'] !== '') {
            $where[] = 'c.server_id = :srv';
            $params[':srv'] = (int)$filters['server_id'];
        }
        if (!empty($filters['status'])) {
            $where[] = 'c.status = :st';
            $params[':st'] = (string)$filters['status'];
        }
        if (!empty($filters['source_type'])) {
            $where[] = 'c.source_type = :sty';
            $params[':sty'] = (string)$filters['source_type'];
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $where[] = 'c.is_active = :act';
            $params[':act'] = (int)((bool)$filters['is_active']);
        }

        $sql = 'SELECT c.id, c.name, c.source_type, c.server_id, c.environment_id, c.application_id,
                       c.module_id, c.host, c.port, c.db_name, c.username, c.ssl_enabled,
                       c.classification, c.status, c.monitoring_enabled, c.is_active,
                       c.last_check_at, c.last_success_at, c.last_error, c.last_inventory_at,
                       c.created_at, c.updated_at,
                       s.name  AS server_name,
                       e.env_key, e.label AS environment_label, e.color AS environment_color,
                       a.label AS application_label,
                       (c.password_encrypted IS NOT NULL AND c.password_encrypted <> "") AS has_password
                  FROM DT_Conexao c
             LEFT JOIN DT_Servidor  s ON s.id = c.server_id
             LEFT JOIN DT_Ambiente  e ON e.id = c.environment_id
             LEFT JOIN DT_Aplicacao a ON a.id = c.application_id
                 WHERE ' . implode(' AND ', $where) . '
              ORDER BY c.name';

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return array_map([$this, 'normalize'], $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::listAll');
        }
    }

    /** Busca por id, SEM credencial. */
    public function find(int $id): ?array
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT ' . self::COLS_PUBLIC . ',
                        (password_encrypted IS NOT NULL AND password_encrypted <> "") AS has_password
                   FROM DT_Conexao WHERE id = :id LIMIT 1'
            );
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? $this->normalize($row) : null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::find');
        }
    }

    /**
     * Busca COM credencial cifrada. Uso restrito: probe de saude e inventario.
     * O retorno jamais deve ser serializado para o front.
     */
    public function findForConnect(int $id): ?array
    {
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM DT_Conexao WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::findForConnect');
        }
    }

    /** Conexoes elegiveis a verificacao automatica (§14). */
    public function findMonitorable(): array
    {
        try {
            $stmt = $this->pdo->query(
                'SELECT * FROM DT_Conexao
                  WHERE is_active = 1 AND monitoring_enabled = 1
                  ORDER BY id'
            );
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::findMonitorable');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ESCRITA
    // ═══════════════════════════════════════════════════════════════

    /** Cria conexao. $password em texto plano e cifrado aqui - nunca chega cru ao banco. */
    public function create(array $data, ?string $password, ?string $createdBy = null): int
    {
        $clean = $this->pickEditable($data);
        $clean['created_by'] = $createdBy;
        $clean['password_encrypted'] = ($password !== null && $password !== '')
            ? DtCrypto::encrypt($password)
            : null;

        $cols = array_keys($clean);
        $sql  = 'INSERT INTO DT_Conexao (' . implode(', ', $cols) . ')
                 VALUES (:' . implode(', :', $cols) . ')';

        try {
            $stmt = $this->pdo->prepare($sql);
            foreach ($clean as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
            $stmt->execute();
            return (int)$this->pdo->lastInsertId();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::create');
        }
    }

    /**
     * Atualiza conexao. $password: null = manter a atual; '' = remover; texto = trocar.
     * Distinguir "nao mexer" de "apagar" e essencial - o front nunca reenvia a senha.
     */
    public function update(int $id, array $data, ?string $password = null): bool
    {
        $clean = $this->pickEditable($data);

        if ($password !== null) {
            $clean['password_encrypted'] = $password === '' ? null : DtCrypto::encrypt($password);
        }

        if ($clean === []) {
            return false;
        }

        $sets = [];
        foreach (array_keys($clean) as $k) {
            $sets[] = "{$k} = :{$k}";
        }
        $sql = 'UPDATE DT_Conexao SET ' . implode(', ', $sets) . ' WHERE id = :__id';

        try {
            $stmt = $this->pdo->prepare($sql);
            foreach ($clean as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
            $stmt->bindValue(':__id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->rowCount() >= 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::update');
        }
    }

    /** Grava resultado de um probe de saude. */
    public function recordCheck(int $id, string $status, ?string $error, bool $success): void
    {
        try {
            $sql = 'UPDATE DT_Conexao
                       SET status = :st,
                           last_check_at = NOW(),
                           last_error = :err'
                 . ($success ? ', last_success_at = NOW()' : '')
                 . ' WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':st'  => $status,
                ':err' => $error !== null ? mb_substr($error, 0, 1000) : null,
                ':id'  => $id,
            ]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::recordCheck');
        }
    }

    /** Soft-delete: desativa em vez de apagar (§7.2 - nao perder historico). */
    public function deactivate(int $id): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                'UPDATE DT_Conexao SET is_active = 0, monitoring_enabled = 0 WHERE id = :id'
            );
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtConnectionRepository::deactivate');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    private function pickEditable(array $data): array
    {
        $out = [];
        foreach (self::EDITABLE as $f) {
            if (!array_key_exists($f, $data)) {
                continue;
            }
            $v = $data[$f];
            if ($v === '') {
                $v = null;
            }
            if (in_array($f, ['port', 'server_id', 'environment_id', 'application_id', 'module_id'], true)) {
                $v = $v === null ? null : (int)$v;
            }
            if (in_array($f, ['ssl_enabled', 'monitoring_enabled', 'is_active'], true)) {
                $v = (int)((bool)$v);
            }
            if ($f === 'extra_json' && is_array($v)) {
                $v = json_encode($v, JSON_UNESCAPED_UNICODE);
            }
            $out[$f] = $v;
        }
        return $out;
    }

    /** Tipos corretos no JSON + garantia final de que nenhum segredo escapou. */
    private function normalize(array $r): array
    {
        foreach (['id', 'port', 'server_id', 'environment_id', 'application_id', 'module_id'] as $k) {
            if (isset($r[$k])) {
                $r[$k] = (int)$r[$k];
            }
        }
        foreach (['ssl_enabled', 'monitoring_enabled', 'is_active', 'has_password'] as $k) {
            if (isset($r[$k])) {
                $r[$k] = (bool)$r[$k];
            }
        }
        unset($r['password_encrypted']);
        return $r;
    }
}
