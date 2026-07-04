<?php
// /api/koala/services/NumberingService.php
// Numeração atômica 2026-NNNN via koala_sequence (idioma LAST_INSERT_ID, sem corrida).
// @module koala.service.numbering @version 1.0.0
declare(strict_types=1);

class NumberingService
{
    /** Próximo número do ano corrente. Atômico em ambos os ramos (insert e update). */
    public static function next(\PDO $pdo, ?int $year = null): string
    {
        $year = $year ?? (int) date('Y');
        $stmt = $pdo->prepare(
            'INSERT INTO koala_sequence (seq_year, last_number) VALUES (?, LAST_INSERT_ID(1))
             ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)'
        );
        $stmt->execute([$year]);
        $n = (int) $pdo->lastInsertId();
        return sprintf('%d-%04d', $year, $n);
    }
}
