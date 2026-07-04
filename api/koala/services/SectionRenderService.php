<?php
// /api/koala/services/SectionRenderService.php
// Renderiza o FRAGMENTO (preview) de UMA seção do catálogo, reusando o Renderer único.
// Não cria motor paralelo: monta o structure_json da seção (ou um default derivado) e
// delega a Renderer::renderFragment com os dados de exemplo do template.
// @module koala.service.section_render @version 1.0.0
declare(strict_types=1);

require_once __DIR__ . '/../render/Renderer.php';

class SectionRenderService
{
    private SectionRepository $repo;
    public function __construct(\PDO $pdo) { $this->repo = new SectionRepository($pdo); }

    /** HTML self-contained do fragmento da seção (dados de exemplo nos placeholders). */
    public function renderPreview(int $sectionId): string
    {
        $sec = $this->repo->findById($sectionId);
        if ($sec === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $sectionId]);
        }

        $section = $this->resolveStructure($sectionId, $sec);
        return Renderer::renderFragment($section, TemplateRenderService::sampleData());
    }

    /**
     * Estrutura nível-seção {section_key, components[]}. Usa structure_json guardado;
     * se ausente (seção criada sem estrutura), deriva um default simples do nome/tipo.
     */
    private function resolveStructure(int $id, array $sec): array
    {
        $raw = $this->repo->getStructure($id);
        if ($raw !== null) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && !empty($decoded['components'])) {
                $decoded['section_key'] = $decoded['section_key'] ?? ($sec['section_key'] ?? '');
                return $decoded;
            }
        }
        return self::defaultStructure((string) ($sec['section_key'] ?? ''), (string) ($sec['name'] ?? 'Seção'));
    }

    /** Default derivado: título (nome da seção) + texto placeholder descritivo. */
    public static function defaultStructure(string $key, string $name): array
    {
        return [
            'section_key' => $key,
            'components'  => [
                ['component_type' => 'title', 'content_json' => ['text' => $name]],
                ['component_type' => 'text',  'content_json' => ['text' => 'Conteúdo da seção ' . $name . '. Este bloco será preenchido/configurado no template.']],
            ],
        ];
    }
}
