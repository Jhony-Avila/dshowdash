<?php
// ISessionStorage - Interface de abstração de storage
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #5: Interface para abstração de storage (File/Redis)

declare(strict_types=1);

namespace Core\Contracts;

interface ISessionStorage
{
    // Ler dados da sessão
    public function read(string $sessionId): ?array;
    
    // Escrever dados da sessão
    public function write(string $sessionId, array $data, int $ttl = 604800): bool;
    
    // Destruir sessão
    public function destroy(string $sessionId): bool;
    
    // Verificar se sessão existe
    public function exists(string $sessionId): bool;
    
    // Renovar TTL da sessão
    public function touch(string $sessionId, int $ttl = 604800): bool;
    
    // Garbage collection
    public function gc(int $maxLifetime): int;
    
    // Health check
    public function healthCheck(): array;
}
