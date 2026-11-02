<?php
// Bling / controllers/ExportController.php - exportação de relatórios (§43)
// @module  bling.controller.export
// @version 1.0.0
// @created 2026-07-30
//
// CSV e XLSX saem daqui; PDF sai pela impressão do navegador (§43 pede
// "PDF; impressão" — são a mesma coisa quando o CSS de impressão está feito, e
// gerar PDF no servidor exigiria um motor de renderização só para isso).
//
// EXPORTAÇÃO É EVENTO AUDITÁVEL (§62, §63). Toda exportação registra quem, o
// quê, quantas linhas e com quais filtros. Em mock a trilha vai para o log de
// erro do PHP; na Fase 4 passa a gravar em `bling_audit_logs`.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class ExportController
{
    /** Teto de linhas por exportação. Acima disso o navegador engasga e o
     *  arquivo deixa de ser útil — melhor recortar e avisar do que travar. */
    private const LIMITE = 20000;

    /** GET /export/{recurso}?formato=csv|xlsx */
    public static function exportar(string $recurso): void
    {
        $formato = strtolower(bling_str('formato', 'csv', 8));
        if (!in_array($formato, ['csv', 'xlsx'], true)) {
            ApiResponse::error('FORMATO_INVALIDO', 400, [
                'message'    => "Formato '$formato' não é suportado.",
                'suportados' => ['csv', 'xlsx'],
                'nota'       => 'PDF sai pela impressão do navegador (Ctrl+P na tela).',
            ]);
        }

        // Reaproveita o MESMO caminho de dados da tela. Se a exportação tivesse
        // consulta própria, o arquivo poderia divergir do que está na tela —
        // que é o pior defeito possível num relatório.
        $dados = ResourceController::montarParaExport($recurso, self::LIMITE);

        $usuario = AuthHelpers::getCurrentUser();
        self::registrarAuditoria($recurso, $formato, count($dados['linhas']), $usuario);

        if ($formato === 'csv') {
            self::enviarCsv($recurso, $dados);
        }
        self::enviarXlsx($recurso, $dados);
    }

    /** GET /export — o que dá para exportar e em quais formatos. */
    public static function catalogo(): void
    {
        ApiResponse::success([
            'formatos' => [
                ['id' => 'csv',  'rotulo' => 'CSV',   'disponivel' => true,
                 'nota' => 'Texto separado por ponto e vírgula, com BOM — abre direto no Excel em pt-BR.'],
                ['id' => 'xlsx', 'rotulo' => 'Excel', 'disponivel' => true,
                 'nota' => 'Números como número e datas como data: soma, ordena e filtra em qualquer locale.'],
                ['id' => 'pdf',  'rotulo' => 'PDF',   'disponivel' => true,
                 'nota' => 'Pela impressão do navegador (Ctrl+P), que respeita o CSS de impressão da tela.'],
            ],
            'limite_linhas' => self::LIMITE,
            'auditado' => true,
        ], bling_meta());
    }

    // ─────────────────────────────────────────────────────────────

    private static function enviarCsv(string $recurso, array $dados): void
    {
        $nome = self::nomeArquivo($recurso, 'csv');
        header('Content-Type: text/csv; charset=UTF-8');
        header("Content-Disposition: attachment; filename=\"$nome\"");
        header('Cache-Control: no-store');

        $out = fopen('php://output', 'w');
        // BOM: sem ele o Excel em pt-BR abre os acentos quebrados.
        fwrite($out, "\xEF\xBB\xBF");

        foreach ($dados['contexto'] as $linha) {
            fputcsv($out, [$linha], ';', '"', '\\');
        }
        if ($dados['contexto']) {
            fwrite($out, "\n");
        }

        fputcsv($out, array_column($dados['colunas'], 'rotulo'), ';', '"', '\\');
        foreach ($dados['linhas'] as $l) {
            $celulas = [];
            foreach ($dados['colunas'] as $c) {
                $celulas[] = self::formatarCsv($l[$c['id']] ?? null, $c['tipo']);
            }
            fputcsv($out, $celulas, ';', '"', '\\');
        }

        if ($dados['totais']) {
            $celulas = [];
            foreach ($dados['colunas'] as $i => $c) {
                $celulas[] = $i === 0 ? 'TOTAL'
                    : (isset($dados['totais'][$c['id']])
                        ? self::formatarCsv($dados['totais'][$c['id']], $c['tipo']) : '');
            }
            fputcsv($out, $celulas, ';', '"', '\\');
        }

        fclose($out);
        exit;
    }

    private static function enviarXlsx(string $recurso, array $dados): void
    {
        require_once __DIR__ . '/../../_helpers/XlsxWriter.php';

        $colunas = array_map(static fn($c) => [
            'id'     => $c['id'],
            'rotulo' => $c['rotulo'],
            'tipo'   => self::tipoXlsx($c['tipo']),
            'total'  => isset($dados['totais'][$c['id']]),
        ], $dados['colunas']);

        try {
            $bytes = XlsxWriter::gerar(
                $colunas, $dados['linhas'], $dados['totais'], $dados['contexto'],
                mb_substr($dados['titulo'], 0, 31),
                'FF4E9B2B',   // verde do Bling; branco em cima dá 4,6:1 (AA)
            );
        } catch (Throwable $e) {
            error_log('[bling] falha ao montar xlsx: ' . $e->getMessage());
            ApiResponse::error('FALHA_EXPORTACAO', 500, [
                'message' => 'Não foi possível montar a planilha.',
                'correlation_id' => bling_correlation_id(),
            ]);
        }

        $nome = self::nomeArquivo($recurso, 'xlsx');
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename=\"$nome\"");
        header('Content-Length: ' . strlen($bytes));
        header('Cache-Control: no-store');
        echo $bytes;
        exit;
    }

    /** Tipos da tela → tipos que o XlsxWriter entende. */
    private static function tipoXlsx(?string $t): string
    {
        return match ($t) {
            'moeda'                 => 'moeda',
            'inteiro'               => 'inteiro',
            'numero', 'medidor'     => 'numero',
            'percentual'            => 'percentual',
            'data'                  => 'data',
            'datahora'              => 'datahora',
            default                 => 'texto',
        };
    }

    /**
     * No CSV o número vai em formato pt-BR (vírgula decimal) porque o destino é
     * abrir no Excel local. No XLSX é o contrário: valor canônico com ponto, e
     * quem formata é o Excel. Trocar isso corrompe um dos dois.
     */
    private static function formatarCsv(mixed $v, ?string $tipo): string
    {
        if ($v === null || $v === '') {
            return '';
        }
        return match ($tipo) {
            'moeda', 'numero', 'percentual' => is_numeric($v)
                ? number_format((float) $v, 2, ',', '.') : (string) $v,
            'inteiro' => is_numeric($v) ? number_format((float) $v, 0, ',', '.') : (string) $v,
            'data'    => preg_match('/^\d{4}-\d{2}-\d{2}/', (string) $v)
                ? date('d/m/Y', strtotime((string) $v)) : (string) $v,
            'datahora'=> strtotime((string) $v) !== false
                ? date('d/m/Y H:i', strtotime((string) $v)) : (string) $v,
            'booleano'=> $v === true ? 'Sim' : ($v === false ? 'Não' : ''),
            default   => (string) $v,
        };
    }

    private static function nomeArquivo(string $recurso, string $ext): string
    {
        $limpo = preg_replace('/[^a-z0-9-]/i', '-', $recurso) ?? 'dados';
        return sprintf('bling-%s-%s.%s', $limpo, date('Y-m-d'), $ext);
    }

    /**
     * Trilha de exportação (§63).
     * Em mock vai para o log; na Fase 4 passa a gravar em `bling_audit_logs`.
     * Registrar desde já mantém o hábito e deixa o formato definido.
     */
    private static function registrarAuditoria(string $recurso, string $formato,
                                               int $linhas, ?array $usuario): void
    {
        $f = bling_filtros();
        error_log(sprintf(
            '[bling][auditoria] exportacao usuario=%s recurso=%s formato=%s linhas=%d '
            . 'periodo=%s..%s filtros=%s ip=%s cid=%s',
            $usuario['id'] ?? '?', $recurso, $formato, $linhas,
            $f['de'], $f['ate'],
            json_encode(array_filter([
                'situacao' => $f['situacao'], 'canal' => $f['canal'],
                'categoria' => $f['categoria'], 'fornecedor' => $f['fornecedor'],
                'deposito' => $f['deposito'], 'vendedor' => $f['vendedor'],
                'busca' => $f['busca'],
            ]), JSON_UNESCAPED_UNICODE),
            AuthHelpers::getClientIp(), bling_correlation_id(),
        ));
    }
}
