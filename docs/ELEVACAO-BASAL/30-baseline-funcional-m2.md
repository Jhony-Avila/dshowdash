# Elevação Basal — 30 · Baseline Funcional + Characterization Tests (M2)

> §1605 (baseline funcional) + §1606 (characterization tests). Protegem o
> comportamento ATUAL das jornadas críticas antes de qualquer consolidação (M3+).
> Gate 3 (proteção): nada de compatibilidade é removido sem estes testes.

## 1. Jornadas cobertas (read-only)

| # | Jornada | O que caracteriza |
|---|---|---|
| 01 | Boot a frio | HTTP 200, tempo de boot, montagem do shell (app-shell/header/sidebar/nav-rail/footer/main), erros de console e requests 4xx/5xx durante o boot |
| 02 | Autenticação | `/api/auth/check.php` → status, envelope `ok`, presença de csrf_token e user (sem imprimir valores) |
| 03 | Shell / navegação | inventário de itens de nav e triggers de painel |
| 04 | Navegação entre painéis | para cada painel da lista: rota atualiza, conteúdo monta, novos erros de console |
| 05 | API autenticada | `/api/health`, `/api/auth/check.php`, `/api/user/preferences` → status + chaves de topo |
| 06 | Persistência (leitura) | `/api/user/preferences` e `/api/user/layouts` → status (NUNCA escreve) |
| 07 | Recuperação de erro | rota inexistente não derruba o shell nem gera tela branca; error boundary |
| 08 | Logout | presença do controle; ação real só com `DO_LOGOUT=1` (default off, p/ não matar a sessão do bot) |

## 2. Como rodar (no servidor)

```bash
cd /var/www/dshowdash/tools/screenshot
node basal-caracterizacao.mjs
# opcional: BASAL_PANELS="panel-dashboard,panel-home" node basal-caracterizacao.mjs
```

Requisitos (já presentes no servidor): `tools/screenshot/node_modules` (Playwright),
`.env` com `SCREENSHOT_SERVICE_USER/PASS`, Chromium. Bate na ORIGEM
(`host-resolver MAP → 127.0.0.1`), então não depende do Cloudflare.

## 3. Saídas

- **Baseline versionável**: `docs/ELEVACAO-BASAL/evidencias/baseline-funcional-<data>.json`
  (resultado por jornada + VERDES/VERMELHOS + amostra de erros de console e net 4xx/5xx).
- **Screenshots** (validação visual do Jhony): `storage/.../screenshots/basal-*.png`.
- Resumo no stdout.

## 4. Contrato de uso no programa

- **Baseline, não gate rígido ainda**: o primeiro run FOTOGRAFA o estado atual
  (inclusive comportamentos quebrados — isso é o ponto de um characterization test).
  Um VERMELHO aqui não bloqueia por si só; ele registra o que existe hoje.
- **A partir do M3**: qualquer lote que altere fundação roda este baseline antes e
  depois; regressão = jornada que passa a divergir do baseline sem intenção.
- **Validação visual e de sessão autenticada é sempre do Jhony** (regra do projeto):
  os screenshots `basal-*.png` são para essa conferência.
- Read-only por construção: não cria/edita/apaga dados; logout real fica atrás de flag.

## 5. Limitações conhecidas

- Os seletores do shell usam alternativas amplas (`.app-shell`/`main`/`.dsd-container`)
  porque o DOM exato das fundações ainda não está mapeado (M6). Ajustáveis quando o
  runtime-map de boot for detalhado.
- A lista de painéis (`BASAL_PANELS`) é conservadora; ampliar conforme o M2 avança.
- Envelope de API: o projeto usa `{"ok":true}` (não `success`) — a jornada 02/05
  aceita ambos por robustez, mas o baseline registra qual veio.
