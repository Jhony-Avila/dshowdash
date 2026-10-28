<?php
// DataTables / FieldClassifier - etiquetas automaticas e sensibilidade de campos
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// LIMITE DELIBERADO (§20.2): classifica SOMENTE por metadado - nome do campo,
// comentario, tipo e nome da tabela. NUNCA le valores armazenados. Uma coluna
// marcada 'cpf' e um INDICIO baseado no nome, nao uma confirmacao de conteudo.
declare(strict_types=1);

final class DtFieldClassifier
{
    // Sensibilidade (§20.2). Ordem importa: o primeiro padrao que casar vence.
    private const SENSITIVITY_PATTERNS = [
        'senha'      => '/\b(senha|password|passwd|pwd|hash[ _]?senha)\b/i',
        // "token" sozinho e generico demais (design token, token de template).
        // Exige qualificacao por prefixo de autenticacao OU ser o nome inteiro.
        'credencial' => '/(?:\b(?:access|api|auth|refresh|session|csrf|bearer|reset|jwt|oauth|webhook|private)[ _](?:token|key|secret)\b'
                      . '|\b(?:api[ _]key|secret[ _]key|client[ _]secret|credential|credencial)\b'
                      . '|^ (?:token|secret|apikey) $)/i',
        'cpf'        => '/\b(cpf|cpf[ _]?cnpj|num[ _]?cpf)\b/i',
        'cnpj'       => '/\b(cnpj|num[ _]?cnpj|inscricao[ _]?federal)\b/i',
        'bancario'   => '/\b(agencia|conta[ _]?corrente|conta[ _]?bancaria|banco[ _]?numero|pix|iban|swift|cartao|card[ _]?number)\b/i',
        'documento'  => '/\b(rg|registro[ _]?geral|passaporte|passport|cnh|titulo[ _]?eleitor|pis|pasep|inscricao[ _]?estadual)\b/i',
        'email'      => '/\b(e[ _]?mail|email|correio[ _]?eletronico)\b/i',
        // 'ip' vem ANTES de endereco: ip_address e dado pessoal (LGPD), mas nao
        // e endereco residencial - rotular certo evita ruido no inventario.
        'ip'         => '/\b(ip|ip[ _]?address|endereco[ _]?ip|remote[ _]?addr|client[ _]?ip)\b/i',
        // "mobile" sozinho quase sempre e responsividade de tela neste codigo
        // (show_on_mobile, is_mobile). So conta como telefone quando qualificado.
        'telefone'   => '/\b(telefone|fone|celular|whatsapp|ddd|phone|mobile[ _]?(phone|number)|numero[ _]?(tel|fone))\b/i',
        'endereco'   => '/\b(endereco|logradouro|cep|bairro|complemento|zip[ _]?code|street|billing[ _]?address|shipping[ _]?address)\b/i',
        'financeiro' => '/\b(salario|remuneracao|valor[ _]?total|preco|custo|receita|faturamento|saldo|renda)\b/i',
        'pessoal'    => '/\b(nome[ _]?completo|data[ _]?nascimento|nascimento|birth[ _]?date|genero|estado[ _]?civil|nacionalidade|mae|pai)\b/i',
    ];

    // Etiquetas nao-exclusivas (§20.1). Um campo pode acumular varias.
    private const LABEL_PATTERNS = [
        'identificador' => '/\b(id|codigo|cod|uuid|guid|slug|chave|key)\b/i',
        'auditoria'     => '/\b(created[ _]?at|updated[ _]?at|deleted[ _]?at|criado[ _]?em|alterado[ _]?em|created[ _]?by|updated[ _]?by|usuario[ _]?cadastro)\b/i',
        'data'          => '/\b(data|date|[ _]?at$|dt_|periodo|vencimento|prazo)\b/i',
        'status'        => '/\b(status|situacao|estado|ativo|is[ _]?active|flag|habilitado)\b/i',
        'tecnico'       => '/\b(versao|version|revision|checksum|hash|[ _]?json$|metadata|config)\b/i',
        'depreciado'    => '/\b(old|antigo|deprecated|obsoleto|legacy|[ _]?bak$|[ _]?tmp$|temp|nao[ _]?usar)\b/i',
    ];

    // Padroes seguros para buscar TAMBEM no comentario da coluna.
    // O comentario e prosa livre: "colapsado em mobile" nao e telefone, "endereco
    // do webhook" nao e endereco residencial. So termos inequivocos entram aqui;
    // os demais (telefone/endereco/financeiro/pessoal/email) exigem casar no NOME.
    private const COMMENT_SAFE = ['cpf', 'cnpj', 'senha', 'credencial', 'documento', 'bancario'];

    private const DATE_TYPES = ['date', 'datetime', 'timestamp', 'time', 'year'];
    private const NUM_TYPES  = ['int', 'bigint', 'smallint', 'tinyint', 'mediumint',
                                'decimal', 'numeric', 'float', 'double'];

    /**
     * Classifica um campo. Retorna ['sensitivity' => ?string, 'labels' => string[]].
     *
     * @param array $col Linha de information_schema.COLUMNS (ja normalizada)
     * @param string $tableName Nome da tabela - da contexto (ex.: tabela "usuarios")
     */
    public static function classify(array $col, string $tableName = ''): array
    {
        $name    = (string)($col['name'] ?? '');
        $comment = (string)($col['column_comment'] ?? '');
        $type    = strtolower((string)($col['data_type'] ?? ''));

        // Duas areas de busca com pesos diferentes. O NOME da coluna e o sinal
        // forte; o COMENTARIO e prosa e so vale para termos inequivocos.
        $hayName    = self::normalizeText($name);
        $hayComment = $comment !== '' ? self::normalizeText($comment) : '';

        $sensitivity   = null;
        $matchedSource = null;

        foreach (self::SENSITIVITY_PATTERNS as $tag => $re) {
            if (preg_match($re, $hayName)) {
                $sensitivity   = $tag;
                $matchedSource = 'nome';
                break;
            }
            if ($hayComment !== ''
                && in_array($tag, self::COMMENT_SAFE, true)
                && preg_match($re, $hayComment)) {
                $sensitivity   = $tag;
                $matchedSource = 'comentario';
                break;
            }
        }

        $labels = [];

        if (!empty($col['is_pk'])) {
            $labels[] = 'chave primaria';
        }
        if (!empty($col['is_fk'])) {
            $labels[] = 'chave estrangeira';
        }

        // Etiquetas nao-sensiveis toleram o comentario: um falso positivo em
        // "tecnico" ou "data" e inofensivo, diferente de marcar algo como sensivel.
        $hayBoth = $hayName . $hayComment;
        foreach (self::LABEL_PATTERNS as $tag => $re) {
            if (preg_match($re, $hayBoth)) {
                $labels[] = $tag;
            }
        }

        // Reforco por tipo: uma coluna DATE e 'data' mesmo sem casar o nome.
        if (in_array($type, self::DATE_TYPES, true) && !in_array('data', $labels, true)) {
            $labels[] = 'data';
        }

        if ($sensitivity !== null) {
            $labels[] = 'sensivel';
            // Rastreia a origem da suspeita - o operador precisa saber se veio do
            // nome (forte) ou do comentario (fraco) antes de agir sobre o campo.
            $labels[] = 'via:' . $matchedSource;
            // 'financeiro' e 'pessoal' sao tambem etiquetas de categoria.
            if (in_array($sensitivity, ['financeiro', 'pessoal'], true)
                && !in_array($sensitivity, $labels, true)) {
                $labels[] = $sensitivity;
            }
        }

        return [
            'sensitivity' => $sensitivity,
            'labels'      => array_values(array_unique($labels)),
        ];
    }

    /**
     * Indicios de campo aparentemente sem uso (§20.3), a partir SO de metadado.
     * Deliberadamente conservador: sem ler dados, so da para suspeitar pelo nome
     * e pela ausencia de indice/relacionamento. Retorna lista de motivos.
     */
    public static function unusedHints(array $col): array
    {
        $hints = [];
        $name  = self::normalizeText((string)($col['name'] ?? ''));

        if (preg_match(self::LABEL_PATTERNS['depreciado'], $name)) {
            $hints[] = 'nome sugere campo depreciado';
        }
        if (empty($col['is_pk']) && empty($col['is_fk']) && empty($col['is_indexed'])
            && !empty($col['is_nullable']) && ($col['column_default'] ?? null) === null) {
            $hints[] = 'sem indice, sem relacionamento, anulavel e sem default';
        }
        return $hints;
    }

    /** Normaliza para casar padroes: minusculas, acentos removidos, separadores unificados. */
    private static function normalizeText(string $s): string
    {
        // ORDEM IMPORTA: separar camelCase ANTES de baixar a caixa, senao o
        // padrao [a-z][A-Z] nunca casa e "dataNascimento" fica colado.
        $s = trim($s);
        $s = preg_replace('/([a-z0-9])([A-Z])/', '$1 $2', $s) ?? $s;
        $s = mb_strtolower($s);
        $from = ['á','à','ã','â','ä','é','è','ê','ë','í','ì','î','ï','ó','ò','õ','ô','ö','ú','ù','û','ü','ç'];
        $to   = ['a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u','c'];
        $s = str_replace($from, $to, $s);
        // Separadores viram espaco para o \b funcionar em snake_case.
        $s = str_replace(['_', '-', '.'], ' ', $s);
        return ' ' . preg_replace('/\s+/', ' ', $s) . ' ';
    }

    /** Tipo e numerico? Usado pelas regras de qualidade (fase 4). */
    public static function isNumeric(string $dataType): bool
    {
        return in_array(strtolower($dataType), self::NUM_TYPES, true);
    }

    /** Tipo e temporal? */
    public static function isTemporal(string $dataType): bool
    {
        return in_array(strtolower($dataType), self::DATE_TYPES, true);
    }
}
