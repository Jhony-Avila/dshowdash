<?php
// Google Calendar / ReportController - relatorios e visualizacoes (§64, §40, §65)
// @version 1.0.0  @created 2026-07-30
declare(strict_types=1);

final class GcalReportController
{
    /** GET /reports — catalogo do seletor. */
    public static function catalogo(GcalProvider $p): void
    {
        $itens = $p->tiposRelatorio();
        ApiResponse::success(['relatorios' => $itens], ['total' => count($itens)]);
    }

    /**
     * GET /reports/{tipo}?de=&ate=&tz=&calendars=
     *
     * A agregacao acontece no SERVIDOR. Mandar 90 dias de evento cru para o
     * browser somar seria exatamente o que o §77 proibe — e a conta de
     * "participantes" precisaria de todos os attendees de todos os eventos.
     */
    public static function gerar(GcalProvider $p, string $tipo): void
    {
        $especiais = ['fluxo', 'rede'];
        if (!in_array($tipo, $especiais, true) && !GcalReports::existe($tipo)) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
                'message' => 'Relatório desconhecido: ' . $tipo,
                'disponiveis' => array_column(GcalReports::tipos(), 'id'),
            ]);
        }

        $f = gcal_filtros();
        $r = $p->relatorio($tipo, $f);

        if (gcal_qstr('formato', 8) === 'xlsx') {
            self::baixarXlsx($tipo, $r, $f);
        }

        ApiResponse::success($r, ['de' => $f['de'], 'ate' => $f['ate'], 'tz' => $f['tz']]);
    }

    /**
     * GET /reports/{tipo}?formato=xlsx — planilha de verdade.
     *
     * Gerada no SERVIDOR, sem biblioteca: .xlsx é um ZIP de XMLs e o PHP já tem
     * ZipArchive. Isso dissolve a pendência que existia — a decisão era sobre
     * pôr SheetJS no package.json RAIZ, e no servidor não há dependência nova.
     *
     * O ganho sobre o CSV não é cosmético: aqui número é NÚMERO e data é DATA.
     * No CSV tudo é texto e o Excel adivinha pelo locale, então "1.234" muda de
     * significado conforme a máquina de quem abre.
     *
     * @return never
     */
    private static function baixarXlsx(string $tipo, array $r, array $f): void
    {
        // `fluxo` e `rede` são grafos (Sankey e força), não tabelas: não têm
        // `colunas`/`linhas` para virar planilha.
        if (!isset($r['colunas'], $r['linhas'])) {
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 422, [
                'message' => 'Este relatório é uma visualização, não uma tabela — não há XLSX.',
            ]);
        }

        $titulo = (string)($r['titulo'] ?? $tipo);
        $contexto = [
            $titulo,
            'Período: ' . self::brData($f['de']) . ' a ' . self::brData($f['ate'])
                . '  ·  Fuso: ' . $f['tz'],
            'Gerado em ' . (new \DateTimeImmutable('now', new \DateTimeZone($f['tz'])))
                ->format('d/m/Y H:i'),
        ];

        try {
            $bytes = GcalXlsx::gerar($r['colunas'], $r['linhas'], $r['totais'] ?? [],
                                     $contexto, $titulo);
        } catch (\Throwable $e) {
            error_log('[gcal] xlsx falhou: ' . $e->getMessage());
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, [
                'message' => 'Não foi possível gerar a planilha.',
            ]);
        }

        $nome = 'google-calendar-' . preg_replace('/[^a-z0-9_-]/i', '', $tipo)
              . '-' . $f['de'] . '_a_' . $f['ate'] . '.xlsx';

        // `Content-Length` explícito: sem ele, um buffer de saída ainda aberto
        // (o handler global de erro liga um) pode truncar o binário e o Excel
        // acusa "arquivo corrompido" sem dizer por quê.
        while (ob_get_level() > 0) { ob_end_clean(); }
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $nome . '"');
        header('Content-Length: ' . strlen($bytes));
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        echo $bytes;
        exit;
    }

    private static function brData(string $iso): string
    {
        $d = \DateTimeImmutable::createFromFormat('Y-m-d|', $iso);
        return $d instanceof \DateTimeImmutable ? $d->format('d/m/Y') : $iso;
    }
}
