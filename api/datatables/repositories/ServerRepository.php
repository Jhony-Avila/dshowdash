<?php
// DataTables / ServerRepository - CRUD de servidores, aplicacoes e modulos
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Entidades de CADASTRO MANUAL (§10 / §8.2). Diferente do catalogo, que e
// descoberto automaticamente, estas o operador precisa informar - nao ha como
// inferir "qual VPS e esta" ou "qual aplicacao usa este banco" a partir do banco.
//
// Exclusao e sempre SOFT (§7.2): desativar preserva o vinculo historico das
// conexoes que apontam para o registro.
declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtServerRepository
{
    /** Whitelist de campos editaveis de servidor. */
    public const SERVER_EDITABLE = [
        'name', 'identifier', 'hostname', 'ip', 'provider', 'server_type',
        'environment_id', 'notes', 'monitoring_enabled', 'is_active',
    ];

    /** Tipos aceitos (§10.1). */
    public const SERVER_TYPES = ['vps', 'dedicated', 'cloud', 'managed', 'container', 'outro'];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // SERVIDORES
    // ═══════════════════════════════════════════════════════════════

    public function findServer(int $id): ?array
    {
        try {
            $st = $this->pdo->prepare('SELECT * FROM DT_Servidor WHERE id = :id LIMIT 1');
            $st->execute([':id' => $id]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            return $r ? $this->normalizeServer($r) : null;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::findServer');
        }
    }

    public function createServer(array $data, ?string $createdBy = null): int
    {
        $clean = $this->pickServer($data);
        $clean['created_by'] = $createdBy;

        $cols = array_keys($clean);
        try {
            $st = $this->pdo->prepare(
                'INSERT INTO DT_Servidor (' . implode(', ', $cols) . ')
                 VALUES (:' . implode(', :', $cols) . ')'
            );
            foreach ($clean as $k => $v) {
                $st->bindValue(':' . $k, $v);
            }
            $st->execute();
            return (int)$this->pdo->lastInsertId();
        } catch (PDOException $e) {
            // 1062 = identifier duplicado; mensagem util em vez de 500 opaco.
            if ((string)$e->getCode() === '23000') {
                throw new RuntimeException('Ja existe servidor com este identificador');
            }
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::createServer');
        }
    }

    public function updateServer(int $id, array $data): bool
    {
        $clean = $this->pickServer($data);
        if ($clean === []) {
            return false;
        }

        $sets = [];
        foreach (array_keys($clean) as $k) {
            $sets[] = "{$k} = :{$k}";
        }

        try {
            $st = $this->pdo->prepare(
                'UPDATE DT_Servidor SET ' . implode(', ', $sets) . ' WHERE id = :__id'
            );
            foreach ($clean as $k => $v) {
                $st->bindValue(':' . $k, $v);
            }
            $st->bindValue(':__id', $id, PDO::PARAM_INT);
            $st->execute();
            return true;
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23000') {
                throw new RuntimeException('Ja existe servidor com este identificador');
            }
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::updateServer');
        }
    }

    /**
     * Soft-delete. Desvincula as conexoes para elas nao ficarem apontando para
     * um servidor invisivel — voltam ao no "Sem servidor cadastrado" da arvore.
     */
    public function deactivateServer(int $id): array
    {
        try {
            $n = $this->pdo->prepare('UPDATE DT_Conexao SET server_id = NULL WHERE server_id = :id');
            $n->execute([':id' => $id]);
            $desvinculadas = $n->rowCount();

            $st = $this->pdo->prepare('UPDATE DT_Servidor SET is_active = 0 WHERE id = :id');
            $st->execute([':id' => $id]);

            return ['ok' => $st->rowCount() > 0, 'unlinked_connections' => $desvinculadas];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::deactivateServer');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // APLICACOES
    // ═══════════════════════════════════════════════════════════════

    public function listApplications(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT a.*,
                        COUNT(DISTINCT m.id) module_count,
                        COUNT(DISTINCT c.id) connection_count
                   FROM DT_Aplicacao a
              LEFT JOIN DT_Modulo  m ON m.application_id = a.id
              LEFT JOIN DT_Conexao c ON c.application_id = a.id AND c.is_active = 1
                  WHERE a.is_active = 1
               GROUP BY a.id
               ORDER BY a.label'
            );
            return array_map(static function ($r) {
                $r['id'] = (int)$r['id'];
                $r['module_count'] = (int)$r['module_count'];
                $r['connection_count'] = (int)$r['connection_count'];
                $r['is_active'] = (bool)$r['is_active'];
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::listApplications');
        }
    }

    public function findApplication(int $id): ?array
    {
        try {
            $st = $this->pdo->prepare('SELECT * FROM DT_Aplicacao WHERE id = :id LIMIT 1');
            $st->execute([':id' => $id]);
            $app = $st->fetch(PDO::FETCH_ASSOC);
            if (!$app) {
                return null;
            }
            $m = $this->pdo->prepare('SELECT id, mod_key, label FROM DT_Modulo WHERE application_id = :id ORDER BY label');
            $m->execute([':id' => $id]);
            $app['id'] = (int)$app['id'];
            $app['modules'] = $m->fetchAll(PDO::FETCH_ASSOC);
            return $app;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::findApplication');
        }
    }

    public function createApplication(array $data): int
    {
        $label = trim((string)($data['label'] ?? ''));
        // ?? so trata NULL. O formulario manda STRING VAZIA no campo opcional,
        // entao o fallback para o rotulo precisa ser explicito.
        $key = $this->slug($this->firstNonEmpty($data['app_key'] ?? '', $label));

        if ($key === '' || $label === '') {
            throw new InvalidArgumentException('Chave e rotulo da aplicacao sao obrigatorios');
        }

        try {
            $st = $this->pdo->prepare(
                'INSERT INTO DT_Aplicacao (app_key, label, is_active) VALUES (:k, :l, 1)'
            );
            $st->execute([':k' => $key, ':l' => mb_substr($label, 0, 80)]);
            return (int)$this->pdo->lastInsertId();
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23000') {
                throw new RuntimeException("Ja existe aplicacao com a chave '{$key}'");
            }
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::createApplication');
        }
    }

    public function updateApplication(int $id, array $data): bool
    {
        $sets = [];
        $par  = [':id' => $id];

        if (isset($data['label']) && trim((string)$data['label']) !== '') {
            $sets[] = 'label = :l';
            $par[':l'] = mb_substr(trim((string)$data['label']), 0, 80);
        }
        if (isset($data['app_key']) && trim((string)$data['app_key']) !== '') {
            $sets[] = 'app_key = :k';
            $par[':k'] = $this->slug((string)$data['app_key']);
        }
        if ($sets === []) {
            return false;
        }

        try {
            $st = $this->pdo->prepare('UPDATE DT_Aplicacao SET ' . implode(', ', $sets) . ' WHERE id = :id');
            $st->execute($par);
            return true;
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23000') {
                throw new RuntimeException('Ja existe aplicacao com esta chave');
            }
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::updateApplication');
        }
    }

    public function deactivateApplication(int $id): array
    {
        try {
            $n = $this->pdo->prepare('UPDATE DT_Conexao SET application_id = NULL WHERE application_id = :id');
            $n->execute([':id' => $id]);
            $desvinculadas = $n->rowCount();

            $st = $this->pdo->prepare('UPDATE DT_Aplicacao SET is_active = 0 WHERE id = :id');
            $st->execute([':id' => $id]);

            return ['ok' => $st->rowCount() > 0, 'unlinked_connections' => $desvinculadas];
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::deactivateApplication');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MODULOS
    // ═══════════════════════════════════════════════════════════════

    public function createModule(int $appId, array $data): int
    {
        $label = trim((string)($data['label'] ?? ''));
        if ($label === '') {
            throw new InvalidArgumentException('Rotulo do modulo e obrigatorio');
        }
        try {
            $st = $this->pdo->prepare(
                'INSERT INTO DT_Modulo (application_id, mod_key, label) VALUES (:a, :k, :l)'
            );
            $st->execute([
                ':a' => $appId,
                ':k' => $this->slug($this->firstNonEmpty($data['mod_key'] ?? '', $label)),
                ':l' => mb_substr($label, 0, 100),
            ]);
            return (int)$this->pdo->lastInsertId();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::createModule');
        }
    }

    public function deleteModule(int $id): bool
    {
        try {
            // Modulo nao tem catalogo pendurado: exclusao dura e segura aqui.
            $this->pdo->prepare('UPDATE DT_Conexao SET module_id = NULL WHERE module_id = :id')
                      ->execute([':id' => $id]);
            $st = $this->pdo->prepare('DELETE FROM DT_Modulo WHERE id = :id');
            $st->execute([':id' => $id]);
            return $st->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtServerRepository::deleteModule');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    private function pickServer(array $data): array
    {
        $out = [];
        foreach (self::SERVER_EDITABLE as $f) {
            if (!array_key_exists($f, $data)) {
                continue;
            }
            $v = $data[$f];
            if (is_string($v)) {
                $v = trim($v);
            }
            if ($v === '') {
                $v = null;
            }
            if ($f === 'environment_id') {
                $v = $v === null ? null : (int)$v;
            }
            if (in_array($f, ['monitoring_enabled', 'is_active'], true)) {
                $v = (int)((bool)$v);
            }
            if ($f === 'identifier' && $v !== null) {
                $v = $this->slug((string)$v);
            }
            if ($f === 'server_type' && $v !== null && !in_array($v, self::SERVER_TYPES, true)) {
                $v = 'outro';
            }
            $out[$f] = $v;
        }

        // identifier e UNIQUE e obrigatorio: deriva do nome se nao vier.
        if (!isset($out['identifier']) && isset($out['name']) && $out['name'] !== null) {
            $out['identifier'] = $this->slug((string)$out['name']);
        }
        return $out;
    }

    /** Primeiro valor nao-vazio apos trim. Existe porque ?? ignora string vazia. */
    private function firstNonEmpty(...$vals): string
    {
        foreach ($vals as $v) {
            $v = trim((string)$v);
            if ($v !== '') {
                return $v;
            }
        }
        return '';
    }

    /** Slug estavel para chaves: minusculas, sem acento, hifen como separador. */
    private function slug(string $s): string
    {
        $s = trim(mb_strtolower($s));
        $from = ['á','à','ã','â','ä','é','è','ê','ë','í','ì','î','ï','ó','ò','õ','ô','ö','ú','ù','û','ü','ç'];
        $to   = ['a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u','c'];
        $s = str_replace($from, $to, $s);
        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? $s;
        return trim(mb_substr($s, 0, 80), '-');
    }

    private function normalizeServer(array $r): array
    {
        foreach (['id', 'environment_id'] as $k) {
            if (isset($r[$k])) {
                $r[$k] = $r[$k] === null ? null : (int)$r[$k];
            }
        }
        foreach (['monitoring_enabled', 'is_active'] as $k) {
            if (isset($r[$k])) {
                $r[$k] = (bool)$r[$k];
            }
        }
        return $r;
    }
}
