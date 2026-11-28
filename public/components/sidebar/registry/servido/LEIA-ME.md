# Modelo de RECUO SERVIDO da Sidebar (INTEGRADO-01 · item 8, ROXO 27/11)
`items.manifest.{ts,js}.servido` são o `registry/items.manifest` da P133 com **4 rotas como no bundle servido** (`a6ddb2aa`): Bling `#/bling`, Google Ads `#/google-ads`, Google Drive `#/google-drive`, Pipedrive `#/pipedrive`. O fonte tem as correções de 09/2026 que nunca rodaram, as mesmas do B01; reconciliar é item do G3.
- Usados **só** por `scripts/router/sidebar/gerar-sidebar-bundle.sh`. **Prova:** P133 + estas cópias → `sidebar.bundle.js` **idêntico byte a byte** ao servido.
- O modelo de recuo só entra quando a API do menu falha.
