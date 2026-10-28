<?php
// Google Calendar / GcalXlsx - XLSX de verdade, sem dependencia nenhuma
// @module google-calendar.xlsx
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// POR QUE ISTO EXISTE
// O XLSX estava parado como "decisao do dono" porque gerar planilha no BROWSER
// exigiria SheetJS no package.json RAIZ, compartilhado por todos os paineis.
// Mas o arquivo .xlsx e so um ZIP com XMLs dentro (OOXML/ECMA-376), e o PHP ja
// traz ZipArchive de fabrica. Gerando no SERVIDOR a pergunta some: zero
// dependencia nova, e o arquivo e legitimo — nao o "xls que e HTML renomeado"
// que faz o Excel avisar formato invalido.
//
// O QUE O XLSX RESOLVE E O CSV NAO
// No CSV todo valor e texto e o Excel adivinha o tipo pelo locale. Em pt-BR
// "1.234" vira mil duzentos e trinta e quatro ou um virgula dois trinta e
// quatro conforme a maquina, e data em texto nao ordena. Aqui numero e gravado
// como NUMERO e data como SERIAL do Excel: soma, ordena e filtra de verdade,
// em qualquer locale.
declare(strict_types=1);

final class GcalXlsx
{
    /** Índices dos formatos declarados em `styles.xml`, na ordem em que entram. */
    private const ESTILO_PADRAO   = 0;
    private const ESTILO_CABECALHO = 1;
    private const ESTILO_NUMERO   = 2;
    private const ESTILO_DECIMAL  = 3;
    private const ESTILO_DATA     = 4;
    private const ESTILO_DATAHORA = 5;
    private const ESTILO_TOTAL    = 6;

    /**
     * Monta a planilha e devolve os bytes do arquivo.
     *
     * @param array $colunas  [{id, rotulo, tipo, total?}]
     * @param array $linhas   lista de mapas id => valor
     * @param array $totais   id => número
     * @param array $contexto linhas de cabeçalho (título, período, fuso)
     */
    public static function gerar(array $colunas, array $linhas, array $totais,
                                 array $contexto = [], string $aba = 'Relatório'): string
    {
        // Arquivo temporário: ZipArchive escreve em disco, não em memória.
        $tmp = tempnam(sys_get_temp_dir(), 'gcal-xlsx-');
        if ($tmp === false) throw new RuntimeException('Não foi possível criar o arquivo temporário.');

        $zip = new ZipArchive();
        if ($zip->open($tmp, ZipArchive::OVERWRITE) !== true) {
            @unlink($tmp);
            throw new RuntimeException('Não foi possível montar a planilha.');
        }

        $zip->addFromString('[Content_Types].xml', self::contentTypes());
        $zip->addFromString('_rels/.rels', self::relsRaiz());
        $zip->addFromString('xl/workbook.xml', self::workbook($aba));
        $zip->addFromString('xl/_rels/workbook.xml.rels', self::relsWorkbook());
        $zip->addFromString('xl/styles.xml', self::styles());
        $zip->addFromString('xl/worksheets/sheet1.xml',
            self::planilha($colunas, $linhas, $totais, $contexto));

        if (!$zip->close()) {
            @unlink($tmp);
            throw new RuntimeException('Falha ao fechar a planilha.');
        }

        $bytes = (string)file_get_contents($tmp);
        @unlink($tmp);
        return $bytes;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PLANILHA
    // ═══════════════════════════════════════════════════════════════════

    private static function planilha(array $colunas, array $linhas, array $totais,
                                     array $contexto): string
    {
        $nCols = max(1, count($colunas));
        $ultima = self::coluna($nCols - 1);

        $xml = [];
        $l = 1;

        // ── Contexto ─────────────────────────────────────────────────
        // Um arquivo sem título e sem período vira órfão na pasta Downloads
        // daqui a duas semanas — vale as três linhas.
        foreach ($contexto as $texto) {
            $xml[] = '<row r="' . $l . '">' . self::celulaTexto('A' . $l, (string)$texto,
                $l === 1 ? self::ESTILO_CABECALHO : self::ESTILO_PADRAO) . '</row>';
            $l++;
        }
        if ($contexto) { $l++; }   // linha em branco separando

        // ── Cabeçalho da tabela ──────────────────────────────────────
        $linhaCabecalho = $l;
        $cels = '';
        foreach ($colunas as $i => $c) {
            // A unidade vai no RÓTULO, não no formato da célula. Formato de
            // porcentagem do Excel multiplica por 100 na exibição: gravar 42
            // com formato `%` mostraria 4200%.
            $rot = (string)$c['rotulo']
                 . ($c['tipo'] === 'duracao'   ? ' (min)' : '')
                 . ($c['tipo'] === 'percentual' ? ' (%)'  : '');
            $cels .= self::celulaTexto(self::coluna($i) . $l, $rot, self::ESTILO_CABECALHO);
        }
        $xml[] = '<row r="' . $l . '" ht="20" customHeight="1">' . $cels . '</row>';
        $l++;

        // ── Dados ────────────────────────────────────────────────────
        $primeiraDados = $l;
        foreach ($linhas as $linha) {
            $cels = '';
            foreach ($colunas as $i => $c) {
                $cels .= self::celula(self::coluna($i) . $l,
                    $linha[$c['id']] ?? null, (string)$c['tipo'], false);
            }
            $xml[] = '<row r="' . $l . '">' . $cels . '</row>';
            $l++;
        }
        $ultimaDados = $l - 1;

        // ── Totais ───────────────────────────────────────────────────
        $temTotal = false;
        foreach ($colunas as $c) { if (!empty($c['total'])) { $temTotal = true; break; } }
        if ($temTotal) {
            $cels = '';
            foreach ($colunas as $i => $c) {
                $ref = self::coluna($i) . $l;
                if ($i === 0) {
                    $cels .= self::celulaTexto($ref, 'TOTAL', self::ESTILO_TOTAL);
                } elseif (!empty($c['total'])) {
                    $cels .= self::celula($ref, $totais[$c['id']] ?? 0, (string)$c['tipo'], true);
                } else {
                    $cels .= '<c r="' . $ref . '" s="' . self::ESTILO_TOTAL . '"/>';
                }
            }
            $xml[] = '<row r="' . $l . '">' . $cels . '</row>';
        }

        // ── Larguras ─────────────────────────────────────────────────
        // Sem isto tudo sai em 8,43 e o Excel mostra ##### em número e data —
        // o usuário conclui que o export veio quebrado.
        $largs = '';
        foreach ($colunas as $i => $c) {
            $w = match ((string)$c['tipo']) {
                'datahora' => 19, 'data' => 12,
                'numero', 'duracao', 'percentual' => 12,
                default => max(14, min(46, mb_strlen((string)$c['rotulo']) + 6)),
            };
            $largs .= '<col min="' . ($i + 1) . '" max="' . ($i + 1)
                    . '" width="' . $w . '" customWidth="1"/>';
        }

        // Congelar abaixo do cabeçalho: relatório de 90 dias rola muito, e
        // rolar sem cabeçalho visível é o mesmo que não ter cabeçalho.
        $congelar = '<pane ySplit="' . $linhaCabecalho . '" topLeftCell="A' . ($linhaCabecalho + 1)
                  . '" activePane="bottomLeft" state="frozen"/>';

        $autofiltro = $linhas
            ? '<autoFilter ref="A' . $linhaCabecalho . ':' . $ultima . $ultimaDados . '"/>'
            : '';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<sheetViews><sheetView workbookViewId="0" showGridLines="0">'
            . $congelar . '</sheetView></sheetViews>'
            . '<sheetFormatPr defaultRowHeight="15"/>'
            . ($largs ? '<cols>' . $largs . '</cols>' : '')
            . '<sheetData>' . implode('', $xml) . '</sheetData>'
            . $autofiltro
            . '</worksheet>';
    }

    // ═══════════════════════════════════════════════════════════════════
    // CELULAS
    // ═══════════════════════════════════════════════════════════════════

    private static function celula(string $ref, mixed $v, string $tipo, bool $total): string
    {
        if ($v === null || $v === '') {
            return '<c r="' . $ref . '"' . ($total ? ' s="' . self::ESTILO_TOTAL . '"' : '') . '/>';
        }

        switch ($tipo) {
            case 'numero':
            case 'duracao':
            case 'percentual':
                if (!is_numeric($v)) break;
                $n = (float)$v;
                $s = $total ? self::ESTILO_TOTAL
                   : (floor($n) == $n ? self::ESTILO_NUMERO : self::ESTILO_DECIMAL);
                // Ponto decimal SEMPRE no XML: o arquivo guarda o valor
                // canônico e o Excel exibe conforme o locale de quem abre.
                // Gravar vírgula aqui produz planilha corrompida.
                return '<c r="' . $ref . '" s="' . $s . '"><v>'
                     . rtrim(rtrim(number_format($n, 6, '.', ''), '0'), '.') . '</v></c>';

            case 'data':
            case 'datahora':
                $serial = self::serial((string)$v, $tipo === 'datahora');
                if ($serial === null) break;   // texto que não é data vai como texto
                return '<c r="' . $ref . '" s="'
                     . ($tipo === 'datahora' ? self::ESTILO_DATAHORA : self::ESTILO_DATA)
                     . '"><v>' . $serial . '</v></c>';
        }

        return self::celulaTexto($ref, (string)$v, $total ? self::ESTILO_TOTAL : self::ESTILO_PADRAO);
    }

    /**
     * String inline em vez de sharedStrings.
     *
     * sharedStrings economiza espaço quando o mesmo texto se repete muito; num
     * relatório agregado a repetição é baixa e o ganho não paga o segundo
     * arquivo XML e a tabela de índices para manter em sincronia.
     */
    private static function celulaTexto(string $ref, string $v, int $estilo): string
    {
        return '<c r="' . $ref . '" s="' . $estilo . '" t="inlineStr"><is><t xml:space="preserve">'
             . self::esc($v) . '</t></is></c>';
    }

    /**
     * Data ISO → serial do Excel (dias desde 1899-12-30).
     *
     * 1899-12-30 e não 1900-01-01: o Excel herdou do Lotus 1-2-3 a crença de
     * que 1900 foi bissexto. A época deslocada é o jeito consagrado de
     * compensar sem tratar o caso.
     */
    private static function serial(string $iso, bool $comHora): ?float
    {
        try {
            $d = new DateTimeImmutable($iso);
        } catch (\Throwable $e) {
            return null;
        }
        $epoca = new DateTimeImmutable('1899-12-30 00:00:00', $d->getTimezone());
        $dias = (float)$epoca->diff($d)->days;
        if ($d < $epoca) $dias = -$dias;
        if ($comHora) {
            $dias += ((int)$d->format('H') * 3600 + (int)$d->format('i') * 60
                    + (int)$d->format('s')) / 86400;
        }
        return round($dias, 8);
    }

    /** A, B, ..., Z, AA, AB... */
    private static function coluna(int $i): string
    {
        $s = '';
        for ($n = $i; $n >= 0; $n = intdiv($n, 26) - 1) {
            $s = chr(65 + $n % 26) . $s;
        }
        return $s;
    }

    private static function esc(string $s): string
    {
        // Caracteres de controle são ILEGAIS em XML 1.0 e fazem o Excel
        // recusar o arquivo inteiro com "conteúdo ilegível" — sem dizer onde.
        $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s) ?? $s;
        return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    // ═══════════════════════════════════════════════════════════════════
    // ESQUELETO OOXML
    // ═══════════════════════════════════════════════════════════════════

    private static function contentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . '</Types>';
    }

    private static function relsRaiz(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>';
    }

    private static function relsWorkbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>';
    }

    private static function workbook(string $aba): string
    {
        // O Excel recusa nome de aba com : \ / ? * [ ] ou acima de 31 chars.
        $nome = preg_replace('#[:\\\\/?*\[\]]#', '-', $aba) ?? 'Planilha';
        $nome = mb_substr(trim($nome), 0, 31) ?: 'Planilha';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
            . ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets><sheet name="' . self::esc($nome) . '" sheetId="1" r:id="rId1"/></sheets>'
            . '</workbook>';
    }

    /**
     * Estilos.
     *
     * A ORDEM dos elementos em `styles.xml` é normativa e o Excel é rígido:
     * numFmts, fonts, fills, borders, cellStyleXfs, cellXfs. Fora de ordem, o
     * arquivo abre "reparado" e perde toda a formatação.
     */
    private static function styles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            // IDs abaixo de 164 são reservados aos formatos embutidos.
            . '<numFmts count="4">'
            .   '<numFmt numFmtId="164" formatCode="#,##0"/>'
            .   '<numFmt numFmtId="165" formatCode="#,##0.00"/>'
            .   '<numFmt numFmtId="166" formatCode="dd/mm/yyyy"/>'
            .   '<numFmt numFmtId="167" formatCode="dd/mm/yyyy\ hh:mm"/>'
            . '</numFmts>'
            . '<fonts count="2">'
            .   '<font><sz val="11"/><name val="Calibri"/></font>'
            .   '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            . '</fonts>'
            . '<fills count="3">'
            .   '<fill><patternFill patternType="none"/></fill>'
            .   '<fill><patternFill patternType="gray125"/></fill>'
            // Azul do módulo. Texto branco sobre ele dá 4,72:1 — o mesmo tom
            // escolhido na homologação de contraste do painel.
            .   '<fill><patternFill patternType="solid"><fgColor rgb="FF3372CF"/>'
            .     '<bgColor indexed="64"/></patternFill></fill>'
            . '</fills>'
            . '<borders count="2">'
            .   '<border><left/><right/><top/><bottom/><diagonal/></border>'
            .   '<border><left/><right/><top style="thin"><color rgb="FF888888"/></top>'
            .     '<bottom/><diagonal/></border>'
            . '</borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            // A ordem daqui define as constantes ESTILO_* no topo da classe.
            . '<cellXfs count="7">'
            .   '<xf numFmtId="0"   fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .   '<xf numFmtId="0"   fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1">'
            .     '<alignment vertical="center" wrapText="1"/></xf>'
            .   '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
            .   '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
            .   '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
            .   '<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
            .   '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0"'
            .     ' applyNumberFormat="1" applyBorder="1"/>'
            . '</cellXfs>'
            // Sem `cellStyles`, um leitor estrito avisa "workbook contains no
            // default style" e aplica o próprio — o Excel costuma resolver isso
            // ABRINDO EM MODO REPARADO, que assusta o usuário e pode descartar
            // a formatação. Detectado pelo openpyxl na validação cruzada.
            . '<cellStyles count="1">'
            .   '<cellStyle name="Normal" xfId="0" builtinId="0"/>'
            . '</cellStyles>'
            . '</styleSheet>';
    }
}
