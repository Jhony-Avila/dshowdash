<?php
// /api/koala/services/ProposalRenderService.php
// Renderiza a PROPOSTA REAL (snapshot do cliente + line items + totais) pelo RENDERIZADOR ÚNICO.
// Mesma saída de preview, link público e PDF. Marca d'água em draft.
// F5: buildLiveData() separa a MONTAGEM dos dados do render (freeze reusa; renderFromSnapshot() renderiza
//     a versão CONGELADA byte-idêntica, sem query viva). renderProposal() mantém comportamento original.
// @module koala.service.proposal_render @version 1.1.0-F5
declare(strict_types=1);

require_once __DIR__ . '/../render/Renderer.php';

class ProposalRenderService
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    private static function money($v, string $cur): string
    {
        $sym = strtoupper($cur) === 'USD' ? 'US$' : 'R$';
        return $sym . ' ' . number_format((float) $v, 2, ',', '.');
    }

    private static function dateBr(?string $d): string
    {
        if (!$d) { return ''; }
        $ts = strtotime($d);
        return $ts ? date('d/m/Y', $ts) : (string) $d;
    }

    /**
     * Monta { structure, data, template_version_id, template_id, business } da proposta VIVA.
     * É a fonte única do render — o freeze (F5) guarda este objeto em snapshot_json e depois
     * renderFromSnapshot() reproduz o documento idêntico sem tocar o banco.
     */
    public function buildLiveData(array $koala, int $proposalId): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);   // 404/403
        $cur = strtoupper((string) $p['currency']);

        // cliente (snapshot local)
        $snap = null;
        if (!empty($p['client_snapshot_id'])) {
            $snap = (new ClientSnapshotRepository($this->pdo))->findById((int) $p['client_snapshot_id']);
        }
        // vendedor: snapshot editável na proposta tem precedência; fallback pro cadastro Koala.
        $seller = (new KoalaUserRepository($this->pdo))->findById((int) $p['seller_user_id']);
        $sellerName  = $p['seller_name']  ?: ($seller['name'] ?? ($seller['email'] ?? ''));
        $sellerEmail = $p['seller_email'] ?: ($seller['email'] ?? '');
        $sellerPhone = $p['seller_phone'] ?: ($seller['phone'] ?? '');

        // contatos repetíveis do cliente
        $contacts = [];
        if (!empty($p['client_snapshot_id'])) {
            $contacts = (new ClientSnapshotContactRepository($this->pdo))->listBySnapshot((int) $p['client_snapshot_id']);
        }
        $contactsView = array_map(fn($c) => [
            'name'  => $c['contact_name'] ?? '',
            'type'  => $c['contact_type'] === 'email' ? 'E-mail' : 'Telefone',
            'value' => $c['contact_value'] ?? '',
        ], $contacts);
        // String legível dos contatos p/ placeholder {{Contatos}} (renderer não itera listas).
        $contactsStr = implode(' · ', array_map(
            fn($c) => trim(($c['name'] ? $c['name'] . ' ' : '') . '(' . $c['type'] . ') ' . $c['value']),
            $contactsView
        ));

        // Formas de pagamento vinculadas (placeholder {{FormasPagamento}}).
        $terms = (new ProposalPaymentTermRepository($this->pdo))->listByProposal($proposalId);
        $paymentStr = implode(' · ', array_map(function ($t) {
            $s = (string) ($t['payment_method_name'] ?? 'Forma de pagamento');
            if (!empty($t['installments_quantity']) && (int) $t['installments_quantity'] > 1) { $s .= ' (' . (int) $t['installments_quantity'] . 'x)'; }
            if (!empty($t['first_due_date'])) { $s .= ' — 1º venc. ' . self::dateBr($t['first_due_date']); }
            return $s;
        }, $terms));

        // linha formatada (itens e despesas usam o mesmo shape de exibição)
        $fmtLine = function (array $r) use ($cur) {
            $gross = round((float) $r['quantity'] * (float) $r['unit_price'], 2);   // subtotal bruto (qty*preço)
            return [
                'description'  => $r['description'],
                'category'     => $r['category_name'] ?? '',
                'quantity'     => rtrim(rtrim(number_format((float) $r['quantity'], 3, ',', '.'), '0'), ','),
                'unit_measure' => $r['unit_measure'] ?? '',
                'unit_price'   => self::money($r['unit_price'], $cur),
                'gross'        => self::money($gross, $cur),        // "subtotal" (bruto)
                'subtotal'     => self::money($r['subtotal'], $cur), // "total" (líquido da linha)
                'observation'  => $r['observation'] ?? '',
            ];
        };

        // itens e despesas do rascunho
        $rows     = (new ProposalItemRepository($this->pdo))->listDraft($proposalId);
        $expRows  = (new ProposalExpenseRepository($this->pdo))->listDraft($proposalId);
        $items    = array_map($fmtLine, $rows);
        $expenses = array_map($fmtLine, $expRows);

        // template (do proposal, ou o default publicado)
        $tplRepo = new TemplateRepository($this->pdo);
        $ver = null;
        if (!empty($p['template_id'])) {
            $ver = $tplRepo->getCurrentVersion((int) $p['template_id']);
        }
        if ($ver === null) {
            $defId = $this->pdo->query("SELECT id FROM koala_templates WHERE is_default = 1 AND status = 'published' ORDER BY id LIMIT 1")->fetchColumn();
            if ($defId) { $ver = $tplRepo->getCurrentVersion((int) $defId); }
        }
        if ($ver === null) {
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Nenhum template disponivel']);
        }
        $structure = json_decode((string) $ver['structure_json'], true);
        if (!is_array($structure)) {
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'structure_json invalido']);
        }

        $clientName = $snap['client_name'] ?? '';
        $legalName  = $snap['legal_name'] ?? '';
        $tradeName  = $snap['trade_name'] ?? '';

        // endereço montado (linha única legível)
        $addrParts = array_filter([
            $snap['address'] ?? null,
            ($snap['address_number'] ?? '') !== '' ? 'nº ' . $snap['address_number'] : null,
            $snap['address_complement'] ?? null,
            $snap['district'] ?? null,
            trim(($snap['city'] ?? '') . (($snap['state'] ?? '') ? '/' . $snap['state'] : ''), '/'),
            ($snap['postal_code'] ?? '') !== '' ? 'CEP ' . $snap['postal_code'] : null,
        ]);
        $enderecoFull = implode(' · ', $addrParts);

        $data = [
            'proposal' => [
                'title'             => $p['title'] ?? '',
                'proposal_number'   => $p['proposal_number'],
                'version'           => $p['current_version_id'] ? (int) $p['current_version_id'] : null,
                'proposal_date'     => self::dateBr($p['proposal_date'] ?? null),
                'valid_until'       => self::dateBr($p['valid_until'] ?? null),
                'objective'         => $p['objective'] ?? '',
                'need_context'      => $p['need_context'] ?? '',
                'executive_summary' => $p['executive_summary'] ?? '',
                'project_scope'     => $p['project_scope'] ?? '',
                'commercial_notes'  => $p['commercial_notes'] ?? '',
                'project_name'      => $p['project_name'] ?? '',
                'total_net'         => self::money($p['total_net'] ?? 0, $cur),
                'total_expenses'    => self::money($p['total_expenses'] ?? 0, $cur),
                'total_final'       => self::money($p['total_final'] ?? 0, $cur),
                'items'             => $items,
                'expenses'          => $expenses,
            ],
            'client' => [
                'client_name' => $clientName,
                'trade_name'  => $tradeName,
                'legal_name'  => $legalName,
                'document'    => $snap['document_number'] ?? '',
                'address'     => $enderecoFull,
                'contacts'    => $contactsView,
            ],
            'seller' => ['name' => $sellerName, 'email' => $sellerEmail, 'phone' => $sellerPhone],
            'placeholders' => [
                'TituloProposta'  => $p['title'] ?? '',
                'NomeCliente'     => $clientName,
                'NomeFantasia'    => $tradeName,
                'RazaoSocial'     => $legalName,
                'Documento'       => $snap['document_number'] ?? '',
                'ValorTotal'      => self::money($p['total_final'] ?? 0, $cur),
                'DataProposta'    => self::dateBr($p['proposal_date'] ?? null),
                'Validade'        => self::dateBr($p['valid_until'] ?? null),
                'NomeVendedor'    => $sellerName,
                'EmailVendedor'   => $sellerEmail,
                'TelefoneVendedor'=> $sellerPhone,
                'Endereco'        => $enderecoFull,
                'Contatos'        => $contactsStr,
                'FormasPagamento' => $paymentStr,
                'Cidade'          => $snap['city'] ?? '',
                'NomeProjeto'     => $p['project_name'] ?? '',
                'Objetivo'        => $p['objective'] ?? '',
                'Contexto'        => $p['need_context'] ?? '',
                'ResumoExecutivo' => $p['executive_summary'] ?? '',
                'EscopoProjeto'   => $p['project_scope'] ?? '',
                'ObservacoesComerciais' => $p['commercial_notes'] ?? '',
            ],
        ];

        // D3: campos vazios das seções principais viram "—" (placeholder discreto) para o
        // vendedor VER que o campo existe no documento. Listas 100% vazias (contatos) omitidas.
        $dash = static fn($v) => ($v === null || trim((string) $v) === '') ? '—' : $v;
        $dashKeys = ['Objetivo', 'Contexto', 'ResumoExecutivo', 'EscopoProjeto', 'ObservacoesComerciais',
            'Endereco', 'NomeCliente', 'RazaoSocial', 'NomeFantasia', 'Documento', 'NomeProjeto',
            'NomeVendedor', 'EmailVendedor', 'TelefoneVendedor'];
        foreach ($dashKeys as $k) {
            $data['placeholders'][$k] = $dash($data['placeholders'][$k] ?? '');
        }
        // Contatos: só mostra a linha se houver ao menos um; senão "—".
        $data['placeholders']['Contatos'] = $contactsStr !== '' ? $contactsStr : '—';
        $data['placeholders']['FormasPagamento'] = $paymentStr !== '' ? $paymentStr : '—';
        // Cover usa bindings client.* -> aplica o mesmo tratamento no bloco de dados.
        $data['client']['client_name'] = $dash($clientName);
        $data['client']['legal_name']  = $dash($legalName);

        return [
            'structure'           => $structure,
            'data'                => $data,
            'template_id'         => (int) ($ver['template_id'] ?? ($p['template_id'] ?? 0)),
            'template_version_id' => (int) ($ver['id'] ?? 0),
            // resumo de negócio p/ histórico (não usado no render; leitura humana).
            'business' => [
                'currency'        => $cur,
                'status'          => (string) $p['status'],
                'proposal_number' => (string) $p['proposal_number'],
                'title'           => (string) ($p['title'] ?? ''),
                'proposal_date'   => $p['proposal_date'] ?? null,
                'valid_until'     => $p['valid_until'] ?? null,
                'total_net'       => (float) ($p['total_net'] ?? 0),
                'total_expenses'  => (float) ($p['total_expenses'] ?? 0),
                'total_final'     => (float) ($p['total_final'] ?? 0),
            ],
        ];
    }

    /** Preview/PDF da proposta VIVA (rascunho corrente). Comportamento original preservado. */
    public function renderProposal(array $koala, int $proposalId, string $mode = 'draft'): string
    {
        $b = $this->buildLiveData($koala, $proposalId);
        return Renderer::render($b['structure'], $b['data'], $mode);
    }

    /**
     * Renderiza a partir de um snapshot CONGELADO (versão imutável) — reproduz o documento
     * exatamente como estava no freeze, sem tocar o banco. Usado por: visualizar versão, PDF de
     * versão e link público. $snapshot = objeto salvo por buildLiveData().
     */
    public function renderFromSnapshot(array $snapshot, string $mode = 'final'): string
    {
        $structure = $snapshot['structure'] ?? null;
        $data      = $snapshot['data'] ?? null;
        if (!is_array($structure) || !is_array($data)) {
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'snapshot de versao invalido']);
        }
        return Renderer::render($structure, $data, $mode);
    }
}
