<?php
/**
 * RepositoryException - Exceção customizada para camada de repositórios
 * @version 1.0.0-ENTERPRISE
 * @created 2026-01-21
 */

declare(strict_types=1);

class RepositoryException extends Exception {
    private ?string $query;
    private ?array $params;

    public function __construct(
        string $message,
        int $code = 0,
        ?Throwable $previous = null,
        ?string $query = null,
        ?array $params = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->query = $query;
        $this->params = $params;
    }

    public function getQuery(): ?string {
        return $this->query;
    }

    public function getParams(): ?array {
        return $this->params;
    }

    /**
     * Cria exceção a partir de PDOException
     */
    public static function fromPDOException(
        PDOException $e,
        string $operation,
        ?string $query = null,
        ?array $params = null
    ): self {
        $message = "Repository error in {$operation}: " . $e->getMessage();
        error_log("[RepositoryException] {$message}");
        return new self($message, (int)$e->getCode(), $e, $query, $params);
    }
}
