<?php
/**
 * InputValidator - Validação centralizada de entrada
 * @version 1.1.0-ENTERPRISE
 * @created 2026-01-21
 * @updated 2026-01-21
 *
 * v1.1.0: Adicionado withOverrides() para criar nova instância com valores sobrescritos
 *
 * Uso:
 *   $validator = new InputValidator($_GET);
 *   $id = $validator->int('id', 0, ['min' => 1]);
 *   $action = $validator->enum('action', 'list', ['list', 'get', 'create']);
 *   $search = $validator->string('q', '', ['maxLength' => 100]);
 */

declare(strict_types=1);

class InputValidator {
    private array $data;
    private array $errors = [];

    public function __construct(array $data) {
        $this->data = $data;
    }

    /**
     * Cria nova instância com valores sobrescritos
     * Seguro: não usa array_merge com superglobals diretamente
     *
     * @param array $overrides Valores a sobrescrever
     * @return self Nova instância com dados mesclados
     */
    public function withOverrides(array $overrides): self {
        return new self(array_merge($this->data, $overrides));
    }

    /**
     * Cria instância para $_GET
     */
    public static function fromGet(): self {
        return new self($_GET);
    }

    /**
     * Cria instância para $_POST
     */
    public static function fromPost(): self {
        return new self($_POST);
    }

    /**
     * Cria instância para JSON body
     */
    public static function fromJson(): self {
        $input = json_decode(file_get_contents('php://input'), true);
        return new self($input ?: []);
    }

    /**
     * Retorna erros de validação
     */
    public function getErrors(): array {
        return $this->errors;
    }

    /**
     * Verifica se há erros
     */
    public function hasErrors(): bool {
        return !empty($this->errors);
    }

    /**
     * Valida e retorna inteiro
     *
     * @param string $key Nome do campo
     * @param int $default Valor padrão
     * @param array $options ['min' => int, 'max' => int, 'required' => bool]
     */
    public function int(string $key, int $default = 0, array $options = []): int {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Campo obrigatório';
            }
            return $default;
        }

        $value = filter_var($this->data[$key], FILTER_VALIDATE_INT);
        if ($value === false) {
            $this->errors[$key] = 'Deve ser um número inteiro';
            return $default;
        }

        if (isset($options['min']) && $value < $options['min']) {
            $value = $options['min'];
        }
        if (isset($options['max']) && $value > $options['max']) {
            $value = $options['max'];
        }

        return $value;
    }

    /**
     * Valida e retorna float
     */
    public function float(string $key, float $default = 0.0, array $options = []): float {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Campo obrigatório';
            }
            return $default;
        }

        $value = filter_var($this->data[$key], FILTER_VALIDATE_FLOAT);
        if ($value === false) {
            $this->errors[$key] = 'Deve ser um número';
            return $default;
        }

        if (isset($options['min']) && $value < $options['min']) {
            $value = $options['min'];
        }
        if (isset($options['max']) && $value > $options['max']) {
            $value = $options['max'];
        }

        return $value;
    }

    /**
     * Valida e retorna string sanitizada
     *
     * @param array $options ['maxLength' => int, 'minLength' => int, 'pattern' => string, 'required' => bool, 'trim' => bool]
     */
    public function string(string $key, string $default = '', array $options = []): string {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Campo obrigatório';
            }
            return $default;
        }

        $value = (string)$this->data[$key];

        // Trim por padrão
        if ($options['trim'] ?? true) {
            $value = trim($value);
        }

        // Sanitização básica
        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');

        // Validações
        if (isset($options['maxLength']) && mb_strlen($value) > $options['maxLength']) {
            $value = mb_substr($value, 0, $options['maxLength']);
        }

        if (isset($options['minLength']) && mb_strlen($value) < $options['minLength']) {
            $this->errors[$key] = "Mínimo de {$options['minLength']} caracteres";
            return $default;
        }

        if (isset($options['pattern']) && !preg_match($options['pattern'], $value)) {
            $this->errors[$key] = 'Formato inválido';
            return $default;
        }

        return $value;
    }

    /**
     * Valida string raw (sem sanitização HTML) - usar com cuidado
     */
    public function rawString(string $key, string $default = '', array $options = []): string {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Campo obrigatório';
            }
            return $default;
        }

        $value = (string)$this->data[$key];

        if ($options['trim'] ?? true) {
            $value = trim($value);
        }

        if (isset($options['maxLength']) && mb_strlen($value) > $options['maxLength']) {
            $value = mb_substr($value, 0, $options['maxLength']);
        }

        return $value;
    }

    /**
     * Valida valor de enum (whitelist)
     */
    public function enum(string $key, string $default, array $allowed): string {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            return $default;
        }

        $value = (string)$this->data[$key];

        if (!in_array($value, $allowed, true)) {
            return $default;
        }

        return $value;
    }

    /**
     * Valida booleano
     */
    public function bool(string $key, bool $default = false): bool {
        if (!isset($this->data[$key])) {
            return $default;
        }

        $value = $this->data[$key];

        // Aceita 1, "1", "true", "yes", "on" como true
        if (in_array($value, [1, '1', 'true', 'yes', 'on', true], true)) {
            return true;
        }

        // Aceita 0, "0", "false", "no", "off" como false
        if (in_array($value, [0, '0', 'false', 'no', 'off', false, ''], true)) {
            return false;
        }

        return $default;
    }

    /**
     * Valida email
     */
    public function email(string $key, string $default = '', array $options = []): string {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Email obrigatório';
            }
            return $default;
        }

        $value = filter_var(trim($this->data[$key]), FILTER_VALIDATE_EMAIL);
        if ($value === false) {
            $this->errors[$key] = 'Email inválido';
            return $default;
        }

        return $value;
    }

    /**
     * Valida data no formato Y-m-d
     */
    public function date(string $key, ?string $default = null, array $options = []): ?string {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Data obrigatória';
            }
            return $default;
        }

        $value = trim($this->data[$key]);

        // Valida formato Y-m-d
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            $this->errors[$key] = 'Formato de data inválido (use YYYY-MM-DD)';
            return $default;
        }

        // Valida se é data válida
        $parts = explode('-', $value);
        if (!checkdate((int)$parts[1], (int)$parts[2], (int)$parts[0])) {
            $this->errors[$key] = 'Data inválida';
            return $default;
        }

        // Validações opcionais de range
        if (isset($options['minDate']) && $value < $options['minDate']) {
            $this->errors[$key] = "Data mínima: {$options['minDate']}";
            return $default;
        }

        if (isset($options['maxDate']) && $value > $options['maxDate']) {
            $this->errors[$key] = "Data máxima: {$options['maxDate']}";
            return $default;
        }

        return $value;
    }

    /**
     * Valida datetime no formato Y-m-d H:i:s
     */
    public function datetime(string $key, ?string $default = null, array $options = []): ?string {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Data/hora obrigatória';
            }
            return $default;
        }

        $value = trim($this->data[$key]);

        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $value);
        if (!$dt || $dt->format('Y-m-d H:i:s') !== $value) {
            $this->errors[$key] = 'Formato de data/hora inválido (use YYYY-MM-DD HH:MM:SS)';
            return $default;
        }

        return $value;
    }

    /**
     * Valida array de inteiros
     */
    public function intArray(string $key, array $default = [], array $options = []): array {
        if (!isset($this->data[$key])) {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Campo obrigatório';
            }
            return $default;
        }

        $value = $this->data[$key];

        // Se for string, tenta fazer explode por vírgula
        if (is_string($value)) {
            $value = array_filter(explode(',', $value), fn($v) => $v !== '');
        }

        if (!is_array($value)) {
            $this->errors[$key] = 'Deve ser um array';
            return $default;
        }

        $result = [];
        foreach ($value as $item) {
            $int = filter_var($item, FILTER_VALIDATE_INT);
            if ($int !== false) {
                $result[] = $int;
            }
        }

        // Limite de itens
        if (isset($options['maxItems']) && count($result) > $options['maxItems']) {
            $result = array_slice($result, 0, $options['maxItems']);
        }

        return $result;
    }

    /**
     * Valida JSON string e retorna array
     */
    public function json(string $key, array $default = [], array $options = []): array {
        if (!isset($this->data[$key]) || $this->data[$key] === '') {
            if ($options['required'] ?? false) {
                $this->errors[$key] = 'Campo obrigatório';
            }
            return $default;
        }

        $value = $this->data[$key];

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->errors[$key] = 'JSON inválido';
            return $default;
        }

        return $decoded;
    }

    /**
     * Valida ID (inteiro positivo)
     */
    public function id(string $key, int $default = 0, array $options = []): int {
        return $this->int($key, $default, array_merge(['min' => 0], $options));
    }

    /**
     * Valida paginação (page e limit)
     * @return array ['page' => int, 'limit' => int, 'offset' => int]
     */
    public function pagination(int $defaultLimit = 20, int $maxLimit = 100): array {
        $page = $this->int('page', 1, ['min' => 1]);
        $limit = $this->int('limit', $defaultLimit, ['min' => 1, 'max' => $maxLimit]);
        $offset = ($page - 1) * $limit;

        return [
            'page' => $page,
            'limit' => $limit,
            'offset' => $offset
        ];
    }

    /**
     * Valida ordenação (sort field e direction)
     * @param array $allowedFields Lista de campos permitidos para ordenação
     */
    public function sorting(array $allowedFields, string $defaultField = 'id', string $defaultOrder = 'DESC'): array {
        $field = $this->enum('sort', $defaultField, $allowedFields);
        $order = $this->enum('order', $defaultOrder, ['ASC', 'DESC', 'asc', 'desc']);

        return [
            'field' => $field,
            'order' => strtoupper($order)
        ];
    }

    /**
     * Obtém valor raw sem validação (usar apenas quando necessário)
     */
    public function raw(string $key, $default = null) {
        return $this->data[$key] ?? $default;
    }

    /**
     * Verifica se campo existe
     */
    public function has(string $key): bool {
        return isset($this->data[$key]) && $this->data[$key] !== '';
    }

    /**
     * Valida todos os campos obrigatórios de uma vez
     * @return bool True se todos os campos obrigatórios estão presentes
     */
    public function requireFields(array $fields): bool {
        foreach ($fields as $field) {
            if (!$this->has($field)) {
                $this->errors[$field] = 'Campo obrigatório';
            }
        }
        return !$this->hasErrors();
    }
}

/**
 * Funções helper para uso rápido
 */

/**
 * Valida e retorna inteiro de $_GET
 */
function input_int(string $key, int $default = 0, array $options = []): int {
    static $validator = null;
    if ($validator === null) {
        $validator = InputValidator::fromGet();
    }
    return $validator->int($key, $default, $options);
}

/**
 * Valida e retorna string de $_GET
 */
function input_string(string $key, string $default = '', array $options = []): string {
    static $validator = null;
    if ($validator === null) {
        $validator = InputValidator::fromGet();
    }
    return $validator->string($key, $default, $options);
}

/**
 * Valida e retorna enum de $_GET
 */
function input_enum(string $key, string $default, array $allowed): string {
    static $validator = null;
    if ($validator === null) {
        $validator = InputValidator::fromGet();
    }
    return $validator->enum($key, $default, $allowed);
}
