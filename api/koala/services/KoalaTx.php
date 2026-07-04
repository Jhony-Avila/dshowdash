<?php
// /api/koala/services/KoalaTx.php
// Helper de transação para operações de escrita multi-tabela do Koala.
// Consolidação 2026-07-04 (A3/A4): garante atomicidade de sequências item/despesa/snapshot/import.
// @module koala.service.tx @version 1.0.0
declare(strict_types=1);

final class KoalaTx
{
    /**
     * Executa $fn dentro de uma transação. Se já existir transação aberta na conexão,
     * apenas PARTICIPA dela (sem begin aninhado — PDO não suporta nested nativo), deixando
     * o commit/rollback para o chamador externo. Em erro, faz rollback e re-lança a exceção
     * (que sobe para o set_exception_handler global -> envelope 500). Nunca engole o erro.
     *
     * Observação: erros de validação usam ApiResponse::error() que faz exit; nesse caso a
     * conexão fecha com a transação aberta e o MySQL reverte automaticamente (sem commit parcial).
     */
    public static function run(\PDO $pdo, callable $fn)
    {
        if ($pdo->inTransaction()) {
            return $fn();
        }
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}
