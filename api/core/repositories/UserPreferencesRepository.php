<?php
// UserPreferencesRepository - Camada de acesso a dados de preferencias de usuario
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// Extraído de UsersRepository para modularização AAA

declare(strict_types=1);

require_once __DIR__ . '/RepositoryException.php';

class UserPreferencesRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function getAll(int $userId): array
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT pref_key, pref_value, pref_type
                FROM app_user_preferences
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $prefs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $preferences = [];
            foreach ($prefs as $pref) {
                $preferences[$pref['pref_key']] = $this->castValue($pref['pref_value'], $pref['pref_type']);
            }

            return $preferences;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'getAll');
        }
    }

    public function get(int $userId, string $key, $default = null)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT pref_value, pref_type
                FROM app_user_preferences
                WHERE user_id = ? AND pref_key = ?
            ");
            $stmt->execute([$userId, $key]);
            $pref = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pref) {
                return $default;
            }

            return $this->castValue($pref['pref_value'], $pref['pref_type']);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'get');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SET METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function set(int $userId, string $key, $value, ?string $type = null): bool
    {
        try {
            $type = $type ?? $this->detectType($value);
            $stringValue = $this->toString($value, $type);

            $stmt = $this->pdo->prepare("
                INSERT INTO app_user_preferences (user_id, pref_key, pref_value, pref_type)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value), pref_type = VALUES(pref_type), updated_at = NOW(3)
            ");
            return $stmt->execute([$userId, $key, $stringValue, $type]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'set');
        }
    }

    public function setMultiple(int $userId, array $preferences): int
    {
        $count = 0;
        foreach ($preferences as $key => $value) {
            if ($this->set($userId, $key, $value)) {
                $count++;
            }
        }
        return $count;
    }

    // ════════════════════════════════════════════════════════════════════════
    // DELETE METHODS
    // ════════════════════════════════════════════════════════════════════════

    public function delete(int $userId, string $key): bool
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM app_user_preferences WHERE user_id = ? AND pref_key = ?");
            return $stmt->execute([$userId, $key]) && $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'delete');
        }
    }

    public function deleteAll(int $userId): int
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM app_user_preferences WHERE user_id = ?");
            $stmt->execute([$userId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'deleteAll');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ════════════════════════════════════════════════════════════════════════

    private function castValue(string $value, string $type)
    {
        switch ($type) {
            case 'boolean':
                return $value === 'true' || $value === '1';
            case 'number':
            case 'integer':
                return strpos($value, '.') !== false ? (float)$value : (int)$value;
            case 'float':
                return (float)$value;
            case 'json':
            case 'array':
                return json_decode($value, true);
            default:
                return $value;
        }
    }

    private function detectType($value): string
    {
        if (is_bool($value)) return 'boolean';
        if (is_int($value)) return 'integer';
        if (is_float($value)) return 'float';
        if (is_array($value)) return 'json';
        return 'string';
    }

    private function toString($value, string $type): string
    {
        switch ($type) {
            case 'boolean':
                return $value ? 'true' : 'false';
            case 'json':
            case 'array':
                return json_encode($value);
            default:
                return (string)$value;
        }
    }
}
