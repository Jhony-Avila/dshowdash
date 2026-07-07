<?php
// /api/koala/services/TemplateRenderService.php
// Orquestra o renderizador único: busca a versão do template, monta o mapa de dados
// e chama o Renderer. Na F1 usa DADOS DE EXEMPLO (proposta real vem na F2).
// @module koala.service.template_render
// @version 1.0.0-F1
declare(strict_types=1);

require_once __DIR__ . '/../render/Renderer.php';

class TemplateRenderService
{
    private TemplateRepository $repo;
    public function __construct(\PDO $pdo) { $this->repo = new TemplateRepository($pdo); }

    /**
     * HTML A4 self-contained do template (dados de exemplo na F1).
     * @param string $version 'published' (versão corrente) ou 'draft' (rascunho pendente → marca d'água).
     */
    public function renderTemplatePreview(int $templateId, string $mode = 'draft', string $version = 'published'): string
    {
        $tpl = $this->repo->findById($templateId);
        if ($tpl === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $templateId]);
        }
        if ($version === 'draft') {
            // Rascunho pendente; se não houver, cai na versão publicada. Rascunho => marca d'água.
            $ver  = $this->repo->getDraftVersion($templateId) ?? $this->repo->getCurrentVersion($templateId);
            $mode = 'draft';
        } else {
            $ver = $this->repo->getCurrentVersion($templateId);
        }
        if ($ver === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Template sem versao publicada']);
        }
        $structure = json_decode((string) $ver['structure_json'], true);
        if (!is_array($structure)) {
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'structure_json invalido']);
        }
        return Renderer::render($structure, self::sampleData(), $mode);
    }

    /** Dados de exemplo cobrindo todos os placeholders do template genérico. */
    public static function sampleData(): array
    {
        return [
            'proposal' => [
                'title'         => 'Proposta Comercial — Painel de LED',
                'proposal_date' => '03/07/2026',
                'total_final'   => 'R$ 45.000,00',
                'items' => [
                    ['description' => 'Painel LED P3 Outdoor', 'quantity' => 2, 'unit_price' => 'R$ 18.000,00', 'subtotal' => 'R$ 36.000,00'],
                    ['description' => 'Instalacao e comissionamento', 'quantity' => 1, 'unit_price' => 'R$ 9.000,00', 'subtotal' => 'R$ 9.000,00'],
                ],
            ],
            'client' => [
                'client_name' => 'Cliente Exemplo LTDA',
                'legal_name'  => 'Cliente Exemplo Comercio LTDA',
            ],
            'seller' => ['name' => 'Jhony'],
            'placeholders' => [
                'TituloProposta' => 'Proposta Comercial — Painel de LED',
                'NomeCliente'    => 'Cliente Exemplo LTDA',
                'RazaoSocial'    => 'Cliente Exemplo Comercio LTDA',
                'Endereco'       => 'Av. Exemplo, 1000',
                'Cidade'         => 'Sao Paulo/SP',
                'NomeProjeto'    => 'Projeto Fachada LED',
                'ValorTotal'     => 'R$ 45.000,00',
                'DataProposta'   => '03/07/2026',
                'NomeVendedor'   => 'Jhony',
                // Placeholders da estrutura enriquecida (expansão do cadastro) — dados de exemplo p/ o preview do template
                'EmailVendedor'  => 'jhony@dshow.com.br',
                'TelefoneVendedor' => '(11) 90000-0000',
                'Documento'      => '12.345.678/0001-90',
                'Contatos'       => 'Maria Souza (E-mail) maria@exemplo.com',
                'FormasPagamento' => 'PIX à vista · Boleto 30/60/90',
                'Objetivo'       => 'Objetivo de exemplo da proposta.',
                'Contexto'       => 'Contexto de exemplo da necessidade do cliente.',
                'ResumoExecutivo' => 'Resumo executivo de exemplo.',
                'EscopoProjeto'  => 'Escopo de exemplo: fornecimento, instalação e operação.',
                'ObservacoesComerciais' => 'Observações comerciais de exemplo.',
            ],
        ];
    }
}
