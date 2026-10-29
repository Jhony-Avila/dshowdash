<?php
declare(strict_types=1);
/** SÓ para os testes puros da ponte (sem o módulo do Google Calendar carregado): espelho textual de GcalEventController::validar/validarPeriodo. */
if (!class_exists('GcalEventController')) {
    final class GcalEventController
    {
        public static function validar(array $b): array
        {
            $erros = [];
            if (trim((string)($b['summary'] ?? '')) === '') { $erros['summary'] = 'Informe um título.'; }
            if (empty($b['start']) || empty($b['end'])) { $erros['start'] = 'Informe início e fim.'; }
            return $erros + self::validarPeriodo($b);
        }
        public static function validarPeriodo(array $b): array
        {
            $erros = [];
            if (empty($b['start']) || empty($b['end'])) return $erros;
            try { $i = new \DateTimeImmutable((string)$b['start']); $f = new \DateTimeImmutable((string)$b['end']); }
            catch (\Throwable $e) { return ['start' => 'Data ou hora em formato inválido.']; }
            if ($f <= $i) { $erros['end'] = 'O término deve ser posterior ao início.'; }
            if (empty($b['all_day']) && (($f->getTimestamp() - $i->getTimestamp()) / 3600) > 24) { $erros['end'] = 'Duração acima de 24 h. Use um evento de dia inteiro.'; }
            return $erros;
        }
    }
}
