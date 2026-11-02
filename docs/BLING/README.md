# Módulo Bling — documentação

> **Status:** Fases 2, 3, 4 e **5** entregues e provadas em **2026-07-30**.
> As Fases 4 e 5 foram provadas **sem a credencial do Bling** — o grafo inteiro
> (6.251 registros) entra no banco pelo pipeline real e as 52 telas dão o mesmo
> número lidas do banco e do mock.
>
> **Confira a prontidão:** `php scripts/bling-golive.php` (sai 0 quando pode
> virar a chave). Hoje faltam `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET` e a troca
> de `BLING_PROVIDER`.
>
> Provedor ainda `mock`. Nenhuma escrita é enviada ao Bling. Nenhum painel em
> produção foi alterado.
> **Responsável:** Jhony (jhony@dshow.com.br) · **Briefing:** `docs/BRF_BLING.md`

---

## Índice

| Arquivo | Conteúdo | Status |
|---|---|---|
| [00-fase0-investigacao.md](00-fase0-investigacao.md) | Retrato do terreno: o que existia, o que não existia, bugs, riscos e decisões pendentes | ✅ revisado em 30/07 |
| [01-arquitetura.md](01-arquitetura.md) | Decisões travadas, camadas, catálogo de telas, banco, backend | ✅ |
| [05-plano-fases.md](05-plano-fases.md) | O que foi entregue, bugs que as provas pegaram, achados fora do escopo, o que falta | ✅ |
| [02-banco-BLING.sql](02-banco-BLING.sql) | DDL do banco `BLING` — 38 tabelas, 65 FKs | ✅ **aplicado** |
| [03-sincronizacao-e-filas.md](03-sincronizacao-e-filas.md) | Estratégias, fila, DLQ, webhook, cron, retenção | ✅ Fase 4 |
| [04-endpoints-api-v3.md](04-endpoints-api-v3.md) | Endpoints do módulo e da API v3 do Bling | ✅ Fase 4 |
| [06-homologacao.md](06-homologacao.md) | Paridade mock × banco, desempenho, rollback, roteiro de go-live | ✅ Fase 5 |

---

## Como abrir

`#/panel-bling` — ou pela **sidebar**, em Favoritos › Bling.

⚠️ **Não usar `#/bling`**: `ITEM_TO_PANEL['bling']` apontava para `panel-04`, um
stub chamado "Produtos/Bling". Corrigido em 30/07, mas a rota canônica é
`#/panel-bling/<grupo>/<tela>`.

## Como validar

Tudo de uma vez — **283 verificações**:

```bash
bash scripts/bling-check-all.sh
```

Ou individualmente. Cada suíte cobre uma camada diferente **de propósito**:
cada uma já pegou defeito que nenhuma das outras pegaria.

```bash
php   scripts/bling-smoke-all.php          # 55 · dados e coerência entre telas
node  scripts/bling-smoke-bundle.mjs       # 24 · bundle (entry sem App)
php   scripts/bling-fase4-golive.php       # 96 · cifra, OAuth, sync, fila, worker
bash  scripts/bling-fase4-rotas.sh         # 24 · rotas HTTP anônimas
php   scripts/bling-fase5-homologacao.php  # 65 · carga com VOLUME e paridade 52 telas
cd tools/screenshot && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
      node valida-bling-fase4.mjs          # 25 · navegador autenticado
cd tools/screenshot && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
      node valida-bling-fase2.mjs          # 33 · Fase 2
cd tools/screenshot && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
      node valida-bling-fase3.mjs          # 26 · Fase 3
```

`bling-fase4-golive.php` cria uma conta de teste com CNPJ reservado e **apaga
tudo ao final**, inclusive em caso de erro. Nenhum dado real é tocado.

## Operação

```bash
php scripts/bling-golive.php                        # dá para virar a chave? (exit 0/1)
php scripts/bling-worker.php --modo=fila --seco    # o que o cron faz, sem fazer
tail -f /var/log/bling-worker.log                   # o que ele fez
```

Cron em `/etc/cron.d/bling`. **Nenhuma linha descarta a saída** — foi assim que
dois crons de warm-cache deste servidor ficaram mortos por 14 dias sem ninguém
notar.

Rebuild do painel:

```bash
npx vite build --config public/components/panels/panel-bling/vite.config.ts
chown -R www-data:www-data public/components/panels/panel-bling   # OBRIGATÓRIO
```

---

## Decisões do dono (2026-07-30)

| # | Decisão | Escolha |
|---|---|---|
| 8.1 | Data grid | **TanStack Table + Virtual** (já instalados; AG Grid Enterprise é pago) |
| 8.3 | RBAC | **Nível agora** (`requireAuth(50)`), granular `bling.*` na Fase 6 |
| 8.4 | Componentes React | **Extrair `_shared-react/` agora** — feito, sem tocar em painel no ar |
| 8.6 | Escopo | **As 52 páginas do §10** — entregues |
| 8.5 | Credencial OAuth | **pendente** — não bloqueia; bloqueia a Fase 5 |

---

## ⚠️ Pendências do dono

### 1. 🔴 Os 10 ícones de painel do header não navegam (pré-existente)

Medido com clique real em 30/07: **nenhum** dos dez botões do header leva ao
painel. Inclui o **Pipedrive**, com o painel em produção.

O componente é servido **embutido no `header.bundle.js`** (de 2026-04-30) — o
`index.js` do diretório nunca é requisitado. O `navigation-adapter` emite o
evento e devolve `true` mesmo sem ninguém escutando, então a falha nunca
apareceu.

A correção do Bling **já está no fonte** e passa a valer no rebuild do bundle.
**Decisão necessária:** rebuildar `header.bundle.js` (afeta o header inteiro; o
projeto já teve incidente com esse rebuild) ou deixar como está.

Enquanto isso, o módulo abre pela sidebar, pela rota e pela busca.

### 2. 🟠 O app-shell remonta o painel a cada troca de hash

Medido em 2026-07-30: abrir o painel = 1 montagem, um drill-down = 2, navegar
pela sub-sidebar = 3. Cada navegação interna **recria o React do zero** e
descarta todo o estado.

O Bling contornou persistindo filtros e seleção em `sessionStorage`, mas o
comportamento afeta **qualquer painel React** do projeto — o Pipedrive, o
DataTables e o Google Calendar vivem com isso hoje.

**Decisão necessária:** investigar o container-main para manter o painel montado
quando só muda o sub-caminho da rota. Fora do escopo desta entrega porque mexe no
shell inteiro.

### 3. Reload do Service Worker + aceite visual

Como em toda entrega de painel: `Ctrl+Shift+R` ou limpar cache do SW.

### 4. Credencial do Bling (bloqueia a Fase 5)

Cadastrar o aplicativo no Bling e informar `client_id`, `client_secret` e a URL
de callback a registrar.

---

## Correções aplicadas nesta entrega

| O que | Onde | Por quê |
|---|---|---|
| Envelope `j.success` → `j.ok` | `panel-integration-bling/index.{ts,js}` | O widget do header estava preso em `--` desde sempre; a falha voltava como HTTP 200 |
| Rota `#/integrations/bling` → `#/panel-bling` | `header/components/panel-bling/index.{ts,js}` | A rota antiga abre o widget de status, não o módulo (vale após rebuild do bundle) |
| Alias `bling: panel-04` → `panel-bling` | `panel-loader/panel-paths.{ts,js}` | `#/bling` abria o stub "Produtos/Bling" |
| `sidebar.bling` repontado e ligado | `ui_nav_items` | Estava invisível e apontando para o widget |
| `sidebar.dash.bling` repontado | `ui_nav_items` | Apontava para `panel-stub-dev` |
| Flag `panel_bling_enabled` | `app_feature_flags` | Molde do Google Calendar |
| Bloco `location ~ ^/api/bling` | `sites-enabled/dshowdash.com.br` | Aditivo, antes do genérico. Backup em `/backup/` |
| `XlsxWriter` extraído para `_helpers/` | `api/_helpers/XlsxWriter.php` | Aditivo. Origem: `GcalXlsx.php`, que segue intocado |

Backups em `/backup/bling-fase0-2026-07-30/` e `/backup/bling-fase2-2026-07-30/`.

---

## Princípios que valem daqui pra frente

- O envelope é **`{ok, data, error}`** — nunca `{success}`.
- O navegador nunca vê `client_secret`, `refresh_token` ou `access_token`.
- Mock e banco calculam pelo **mesmo** código (`BlingProviderBase`). Trocar de
  provedor não pode mudar um número.
- Tela sem visualização dedicada é marcada como **estrutural** na navegação e na
  própria tela. Nada é apresentado como pronto sem estar.
- Nenhuma escrita no Bling antes da Fase 6 homologada.
