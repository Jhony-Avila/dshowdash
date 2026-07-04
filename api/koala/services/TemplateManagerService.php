<?php
// /api/koala/services/TemplateManagerService.php
// CAMADA DE GESTÃO de templates (F6): criar (do zero/duplicando), editar metadados,
// salvar estrutura como RASCUNHO de versão (com validação de shape + placeholders),
// publicar (congela vX), ativar/desativar, soft-delete (guarda "único ativo").
// O renderer-core (Renderer.php) consome structure_json da versão — aqui está a fonte de verdade.
// Gate ADMIN fica no controller; este serviço assume a autorização já feita.
// @module koala.service.template_manager
// @version 1.0.0-F6
declare(strict_types=1);

class TemplateManagerService
{
    private \PDO $pdo;
    private TemplateRepository $repo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repo = new TemplateRepository($pdo);
    }

    // ───────────────────────── Leitura ─────────────────────────

    /** Lista de GESTÃO: todos os não-deletados (inclui inativos), com versão publicada e flag de rascunho. */
    public function list(): array
    {
        return $this->repo->listForManagement();
    }

    /** Detalhe completo: metadados + structure da versão corrente + rascunho pendente + histórico. */
    public function detail(int $id): array
    {
        $tpl = $this->repo->findById($id);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        $current = $this->repo->getCurrentVersion($id);
        $draft   = $this->repo->getDraftVersion($id);

        $tpl['current_version'] = $current ? [
            'id'             => (int) $current['id'],
            'version_number' => (int) $current['version_number'],
            'status'         => $current['status'],
            'structure_json' => json_decode((string) $current['structure_json'], true),
        ] : null;
        $tpl['draft_version'] = $draft ? [
            'id'             => (int) $draft['id'],
            'version_number' => (int) $draft['version_number'],
            'structure_json' => json_decode((string) $draft['structure_json'], true),
        ] : null;
        $tpl['versions'] = $this->repo->listVersions($id);
        return $tpl;
    }

    // ───────────────────────── Criação ─────────────────────────

    /** Cria template NOVO do zero com estrutura mínima válida (nasce inativo + v1 publicada). */
    public function createFromScratch(array $koala, array $d): array
    {
        $name = trim((string) ($d['name'] ?? ''));
        if ($name === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome obrigatorio']);
        }
        $structure = self::minimalStructure((string) ($d['segment'] ?? 'custom'));
        return $this->persistNew($koala, $name, $d['description'] ?? null, $structure);
    }

    /** Duplica um template existente: copia a estrutura da versão publicada corrente. */
    public function duplicate(array $koala, int $sourceId, array $d): array
    {
        $src = $this->repo->findById($sourceId);
        if ($src === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['source_id' => $sourceId]);
        }
        $ver = $this->repo->getCurrentVersion($sourceId);
        if ($ver === null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => 'Template de origem sem versao publicada']);
        }
        $structure = json_decode((string) $ver['structure_json'], true);
        if (!is_array($structure)) {
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'structure_json de origem invalido']);
        }
        $name = trim((string) ($d['name'] ?? ''));
        if ($name === '') { $name = 'Copia de ' . $src['name']; }
        return $this->persistNew($koala, $name, $d['description'] ?? ($src['description'] ?? null), $structure);
    }

    private function persistNew(array $koala, string $name, ?string $description, array $structure): array
    {
        $owns = !$this->pdo->inTransaction();
        if ($owns) { $this->pdo->beginTransaction(); }
        try {
            $slug = $this->uniqueSlug($name);
            $tid = $this->repo->insertTemplate([
                'name'        => $name,
                'slug'        => $slug,
                'description' => $description,
                'segment'     => $structure['segment'] ?? null,
                'status'      => 'inactive',   // novo nasce INATIVO (não aparece p/ escolha até ativar)
                'orientation' => $structure['orientation'] ?? 'portrait',
                'page_format' => $structure['page_format'] ?? 'A4',
                'created_by'  => (int) $koala['id'],
            ]);
            $vid = $this->repo->insertVersion($tid, 1, json_encode($structure, JSON_UNESCAPED_UNICODE), 'published', (int) $koala['id']);
            $this->repo->setCurrentVersion($tid, $vid);
            if ($owns) { $this->pdo->commit(); }
        } catch (\Throwable $e) {
            if ($owns && $this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            error_log('[koala] template create: ' . $e->getMessage());
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500);
        }
        return $this->detail($tid);
    }

    // ───────────────────────── Edição ─────────────────────────

    /** Edita metadados (nome/descrição/segmento). */
    public function updateMeta(array $koala, int $id, array $d): array
    {
        $tpl = $this->repo->findById($id);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        if (array_key_exists('name', $d) && trim((string) $d['name']) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'name', 'message' => 'Nome nao pode ser vazio']);
        }
        $this->repo->updateMeta($id, $d);
        return $this->detail($id);
    }

    /** Salva o structure_json editado como RASCUNHO de versão (upsert do rascunho pendente). */
    public function saveStructureDraft(array $koala, int $id, string $structureJson): array
    {
        $tpl = $this->repo->findById($id);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        $v = self::validateStructure($structureJson);
        if (!$v['ok']) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'structure_json', 'message' => $v['error']]);
        }
        $normalized = json_encode($v['structure'], JSON_UNESCAPED_UNICODE);
        $draft = $this->repo->getDraftVersion($id);
        if ($draft) {
            $this->repo->updateVersionStructure((int) $draft['id'], $normalized);
            $vid = (int) $draft['id'];
            $vnum = (int) $draft['version_number'];
        } else {
            $vnum = $this->repo->maxVersionNumber($id) + 1;
            $vid = $this->repo->insertVersion($id, $vnum, $normalized, 'draft', (int) $koala['id']);
        }
        return ['template_id' => $id, 'draft_version_id' => $vid, 'draft_version_number' => $vnum, 'saved' => true];
    }

    /** Publica: congela o rascunho pendente como versão publicada e aponta current_version_id para ela. */
    public function publish(array $koala, int $id): array
    {
        $tpl = $this->repo->findById($id);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        $draft = $this->repo->getDraftVersion($id);
        if ($draft === null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => 'Nada para publicar: nao ha rascunho pendente.']);
        }
        // Re-valida por segurança antes de congelar.
        $v = self::validateStructure((string) $draft['structure_json']);
        if (!$v['ok']) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'structure_json', 'message' => $v['error']]);
        }
        $owns = !$this->pdo->inTransaction();
        if ($owns) { $this->pdo->beginTransaction(); }
        try {
            $this->repo->setVersionStatus((int) $draft['id'], 'published');
            $this->repo->setCurrentVersion($id, (int) $draft['id']);
            if ($owns) { $this->pdo->commit(); }
        } catch (\Throwable $e) {
            if ($owns && $this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            error_log('[koala] template publish: ' . $e->getMessage());
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500);
        }
        return $this->detail($id);
    }

    /** Liga/desliga. Desativar o ÚNICO ativo é bloqueado (propostas futuras ficariam sem template). */
    public function setActive(array $koala, int $id, bool $active): array
    {
        $tpl = $this->repo->findById($id);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        if (!$active && $tpl['status'] === 'published' && $this->repo->countActivePublished() <= 1) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => 'Nao e possivel desativar o unico template ativo.']);
        }
        $this->repo->setStatus($id, $active ? 'published' : 'inactive');
        return $this->detail($id);
    }

    /** Soft-delete (regra da casa). Bloqueia se for o ÚNICO ativo. */
    public function softDelete(array $koala, int $id): array
    {
        $tpl = $this->repo->findById($id);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        if ($tpl['status'] === 'published' && $this->repo->countActivePublished() <= 1) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => 'Nao e possivel excluir o unico template ativo.']);
        }
        $this->repo->softDelete($id);
        return ['deleted' => $id];
    }

    // ───────────────────────── Validação de estrutura ─────────────────────────

    /**
     * Valida o structure_json (string): JSON válido + shape mínimo pages->sections->components
     * + placeholders {{...}} bem formados. Static para reuso no smoke.
     * @return array{ok:bool,error:?string,structure?:array}
     */
    public static function validateStructure(string $json): array
    {
        $data = json_decode($json, true);
        if (!is_array($data)) {
            return ['ok' => false, 'error' => 'JSON invalido: ' . json_last_error_msg()];
        }
        if (!isset($data['pages']) || !is_array($data['pages']) || count($data['pages']) === 0) {
            return ['ok' => false, 'error' => "Campo 'pages' ausente ou vazio (minimo 1 pagina)."];
        }
        foreach ($data['pages'] as $pi => $page) {
            if (!is_array($page) || !isset($page['sections']) || !is_array($page['sections']) || count($page['sections']) === 0) {
                return ['ok' => false, 'error' => "pages[$pi]: 'sections' ausente ou vazio (minimo 1 secao)."];
            }
            foreach ($page['sections'] as $si => $sec) {
                if (!is_array($sec) || !isset($sec['components']) || !is_array($sec['components'])) {
                    return ['ok' => false, 'error' => "pages[$pi].sections[$si]: 'components' ausente ou nao e lista."];
                }
                foreach ($sec['components'] as $ci => $comp) {
                    if (!is_array($comp) || !isset($comp['component_type'])
                        || !is_string($comp['component_type']) || trim($comp['component_type']) === '') {
                        return ['ok' => false, 'error' => "pages[$pi].sections[$si].components[$ci]: 'component_type' obrigatorio."];
                    }
                }
            }
        }
        $bad = self::findMalformedPlaceholder($data);
        if ($bad !== null) {
            return ['ok' => false, 'error' => "Placeholder mal formado em: \"$bad\" (use {{Chave}} com letras, numeros ou _)."];
        }
        return ['ok' => true, 'error' => null, 'structure' => $data];
    }

    /** Varre todo content_json.text procurando {{...}} mal formado. Retorna trecho ofensor ou null. */
    private static function findMalformedPlaceholder(array $data): ?string
    {
        $texts = [];
        $walk = function ($node) use (&$walk, &$texts): void {
            if (!is_array($node)) { return; }
            foreach ($node as $k => $v) {
                if ($k === 'content_json' && is_array($v) && isset($v['text']) && is_string($v['text'])) {
                    $texts[] = $v['text'];
                }
                if (is_array($v)) { $walk($v); }
            }
        };
        $walk($data);
        foreach ($texts as $t) {
            $stripped = preg_replace('/\{\{[A-Za-z0-9_]+\}\}/', '', $t);
            if (strpos($stripped, '{{') !== false || strpos($stripped, '}}') !== false) {
                return mb_substr($t, 0, 40);
            }
        }
        return null;
    }

    // ───────────────────────── Helpers ─────────────────────────

    /** Estrutura mínima válida (renderizável): capa com título/cliente + seção financeira com price_table. */
    public static function minimalStructure(string $segment = 'custom'): array
    {
        return [
            'template_key' => 'custom',
            'segment'      => $segment,
            'orientation'  => 'portrait',
            'page_format'  => 'A4',
            'placeholders' => ['{{TituloProposta}}', '{{NomeCliente}}', '{{DataProposta}}', '{{NomeVendedor}}'],
            'pages' => [
                [
                    'key' => 'cover',
                    'sections' => [[
                        'section_key'  => 'cover',
                        'section_type' => 'cover',
                        'components'   => [
                            ['component_key' => 'title', 'component_type' => 'title',
                             'content_json' => ['text' => '{{TituloProposta}}'], 'bindings_json' => ['text' => 'proposal.title'], 'is_editable_by_seller' => true],
                            ['component_key' => 'client_name', 'component_type' => 'text',
                             'content_json' => ['text' => '{{NomeCliente}}'], 'bindings_json' => ['text' => 'client.client_name'], 'is_editable_by_seller' => false],
                        ],
                    ]],
                ],
                [
                    'key' => 'items',
                    'sections' => [[
                        'section_key'  => 'financial_summary',
                        'section_type' => 'financial_summary',
                        'components'   => [
                            ['component_key' => 'items_table', 'component_type' => 'price_table',
                             'bindings_json' => ['rows' => 'proposal.items', 'total' => 'proposal.total_final'], 'is_editable_by_seller' => true],
                            ['component_key' => 'seller', 'component_type' => 'text',
                             'content_json' => ['text' => '{{NomeVendedor}}'], 'bindings_json' => ['text' => 'seller.name'], 'is_editable_by_seller' => false],
                        ],
                    ]],
                ],
            ],
        ];
    }

    /** Slug único a partir do nome (transliterado p/ ASCII), com sufixo -2, -3… se colidir. */
    private function uniqueSlug(string $name): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
        if ($ascii === false) { $ascii = $name; }
        $base = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($ascii)), '-');
        if ($base === '') { $base = 'template'; }
        $slug = $base;
        $i = 2;
        while ($this->repo->slugExists($slug)) {
            $slug = $base . '-' . $i;
            $i++;
        }
        return $slug;
    }
}
