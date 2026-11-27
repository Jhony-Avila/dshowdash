<?php
declare(strict_types=1);

/**
 * api/obs/ObsProdutor.php — OBS-001 degrau 2 · o produtor grava no registro central SEM depender dele (VINHO, 27/11/2026).
 * FAIL-SOFT: tabela ausente, banco fora ou qualquer erro do registro NUNCA impede nem altera o trabalho do produtor (só um aviso no log, sem detalhe).
 * Slot = horário PREVISTO (UTC) pelo minuto do cron; tentativa = a próxima livre daquele slot (rodar de novo à mão = tentativa 2, 3…).
 */
require_once __DIR__ . '/ObsExecucoes.php';

final class ObsProdutor
{
    private ?ObsExecucoes $obs;

    public function __construct(?Closure $pdo, private readonly string $job, private readonly int $ttlSeg = 1800)
    {
        try { $this->obs = $pdo !== null ? new ObsExecucoes($pdo()) : null; } catch (Throwable $e) { $this->aviso($e); $this->obs = null; }
    }

    /** Slot previsto: o minuto $minuto da hora corrente (UTC), ou o da hora anterior se ainda não chegou. */
    public static function slotHorario(DateTimeImmutable $agora, int $minuto): DateTimeImmutable
    {
        $u = $agora->setTimezone(new DateTimeZone('UTC'));
        $s = $u->setTime((int) $u->format('H'), $minuto, 0);
        return $s > $u ? $s->modify('-1 hour') : $s;
    }

    /** @return ?array alça para terminar(); null = registro indisponível (o produtor segue normalmente) */
    public function comecar(string $escopo, DateTimeImmutable $slot, DateTimeImmutable $agora): ?array
    {
        if ($this->obs === null) return null;
        try {
            $this->obs->vigiar($agora);   // execução anterior que travou vira 'interrompida' e libera a posse
            for ($t = 1; $t <= 20; $t++) if ($this->obs->iniciar($this->job, $escopo, $slot, $t, $this->ttlSeg, $agora)) return [$escopo, $slot, $t];
            return null;   // 20 tentativas no mesmo slot ou posse ocupada: não registra (o trabalho segue)
        } catch (Throwable $e) { $this->aviso($e); return null; }
    }

    public function terminar(?array $alca, string $estado, ?int $volume, ?string $erro, DateTimeImmutable $agora): void
    {
        if ($alca === null || $this->obs === null) return;
        try { $this->obs->encerrar($this->job, $alca[0], $alca[1], $alca[2], $estado, $volume, $estado === 'ok' ? null : $erro, $agora); }
        catch (Throwable $e) { $this->aviso($e); }
    }

    private function aviso(Throwable $e): void { error_log('[obs] ' . $this->job . ': registro indisponível (' . get_class($e) . ')'); }
}
