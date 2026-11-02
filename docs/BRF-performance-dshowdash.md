# BRIEFING TÉCNICO — Otimização de Performance DshowDash

## Contexto e Objetivo

Este documento descreve os gargalos de performance identificados no ambiente de produção do DshowDash (dshowdash.com.br) e propõe atividades concretas de correção, melhoria e refatoração com foco em redução de tempo de carregamento e melhoria da experiência do usuário.

Os dados foram coletados em 12/02/2026 via Performance API do navegador e análise direta do servidor (srv920234.hstgr.cloud).

---

## Ambiente e Stack

- **Servidor:** srv920234.hstgr.cloud (Linux, Nginx, PHP, MySQL)
- **CDN:** Cloudflare
- **Frontend:** JavaScript ES6 Modules (sem framework), CSS vanilla
- **Build:** Vite + Rollup (bundles por componente)
- **Domínio:** dshowdash.com.br (HTTPS via Cloudflare)
- **Root público:** `/var/www/dshowdash/public`

---

## Métricas Atuais (Baseline)

| Métrica                    | Valor     | Avaliação     |
|----------------------------|-----------|---------------|
| TTFB                       | 28ms      | ✅ Excelente  |
| DOM Parsing                | 250ms     | ⚠️ Alto       |
| DOM Content Loaded         | 422ms     | ✅ Bom        |
| Page Load                  | 423ms     | ✅ Bom        |
| First Paint (FP)           | 676ms     | ⚠️ Melhorável |
| First Contentful Paint     | 676ms     | ⚠️ Melhorável |
| Long Tasks                 | 0         | ✅ Perfeito   |
| Memória (heap)             | 132MB/4GB | ✅ Saudável   |
| DOM Elements               | 2.766     | ✅ OK         |
| DOM Max Depth              | 14        | ✅ OK         |
| Total de recursos          | 250       | ⚠️ Alto       |
| Arquivos JS carregados     | 104       | 🔴 Crítico    |
| JS não-cacheados           | 150       | 🔴 Crítico    |
| JS total transferido       | 1.550KB   | ⚠️ Alto       |
| Stylesheets no HTML        | 48        | 🔴 Crítico    |
| JS Waterfall Window        | 29.027ms  | 🔴 Crítico    |
| Paralelismo JS             | 5 req/s   | 🔴 Baixo      |

---

## Gargalos Identificados (Ordenados por Impacto)

### 🔴 GARGALO 1 — Excesso de Requests JS (150 módulos não-cacheados)

**Diagnóstico:** O browser carrega 150 arquivos JS individuais via rede, totalizando 1.550KB. A janela de carregamento JS se estende por **29 segundos** (de 48ms a 29.027ms) com apenas 5 requests/segundo de paralelismo efetivo. Isso significa que módulos são descobertos em cascata — cada bundle importa módulos que importam outros, criando uma cadeia serial de requests.

**Dados do servidor:**
- Total de arquivos JS no `/public` (excluindo dist/ e node_modules/): **6.098 arquivos**
- Total de bundles JS: **15 arquivos** (bem bundlados)
- O problema: módulos avulsos importados pelos bundles como externals são carregados individualmente

**Top 5 JS mais lentos:**

| Arquivo | Duração | Tamanho |
|---------|---------|---------|
| bootstrap.bundle.js | 242ms | 122KB |
| main.bundle.js | 87ms | 253KB |
| footer.bundle.js | 55ms | 103KB |
| app-shell.bundle.js | 54ms | 130KB |
| app-router.bundle.js | 52ms | 28KB |

**Top 5 JS mais pesados (transferência com gzip):**

| Arquivo | Transfer | Decoded | Ratio |
|---------|----------|---------|-------|
| main.bundle.js | 253KB | 1.253KB | 5:1 |
| app-shell.bundle.js | 130KB | 619KB | 4.8:1 |
| bootstrap.bundle.js | 122KB | 616KB | 5:1 |
| header.bundle.js | 110KB | 565KB | 5.1:1 |
| sidebar.bundle.js | 106KB | 520KB | 4.9:1 |

**Nota:** footer.bundle.js transfere 103KB mas decodifica 994KB (ratio 9.6:1) — verificar se compressão Brotli está ativa no Cloudflare para este arquivo especificamente.

---

### 🔴 GARGALO 2 — Excesso de Stylesheets Individuais (48 CSS no HTML)

**Diagnóstico:** O `index.html` carrega diretamente **21 tags `<link rel="stylesheet">`** no `<head>`, cada uma disparando um request HTTP separado. Vários CSS têm 0KB de transferência mas 177-234ms de duração — ou seja, é latência pura de round-trip, não transferência de dados.

**CSS no `<head>` do index.html (21 arquivos):**

```
/core/css/reset.css
/core/css/variables.css                           ← 234ms, 1KB
/assets/css/core/z-index.tokens.css               ← 75ms, 1KB
/assets/css/tokens/toast.tokens.css               ← 93ms, 3KB
/assets/css/tokens/edts.tokens.css                ← 75ms, 1KB
/core/css/utilities.css                           ← 75ms, 1KB
/assets/css/theme.css                             ← 93ms, 0KB
/assets/css/global-theme.css                      ← 111ms, 2KB
/assets/css/design-system/design-system.css       ← 177ms, 0KB
/assets/css/layout.css                            ← 177ms, 0KB
/assets/css/panels-sane.css                       ← 177ms, 0KB
/components/preloader/styles/index.css            ← 66ms, 0KB
/components/sidebar/styles/sidebar.bundle.css     ← 153ms, 15KB
/components/app-shell/styles/index.css            ← 176ms, 0KB
/components/modal-manager-global/styles.css       ← 176ms, 0KB
/components/router/styles.css                     ← 65ms, 1KB
/components/main/main.tokens.css                  ← 221ms, 3KB
/components/main/ui/container-main/container-main.bundle.css ← 220ms, 24KB
```

**Total de CSS avulsos no servidor (excluindo dist/):** 1.404 arquivos

**Impacto:** Cada CSS no `<head>` é render-blocking. O browser precisa baixar e parsear TODOS antes de pintar a primeira pixel. Isso explica o FCP de 676ms.

---

### 🔴 GARGALO 3 — Vídeo de Background (3.6MB, 799ms)

**Diagnóstico:** O arquivo `video_background_site_web.mp4` (3.6MB) é o recurso mais lento da página (799ms). Ele é usado em dois contextos:

1. **Preloader** (`/components/preloader/template.js`): Carregado com `<video autoplay loop muted playsinline preload="metadata">` — o `preload="metadata"` ajuda, mas o autoplay força o download completo
2. **Login Modal** (`/components/login-modal/template.js`): Usado como background do modal de login

**Localização das referências:**
```
/components/preloader/template.js:46       — preloader template (autoplay)
/components/preloader/template-aaa.js:42   — preloader template alternativo
/components/login-modal/template.js:67     — login modal background
/components/login-modal/core/video-manager.js:50 — video manager
/components/login-modal/utils/service-worker-cache.js:45 — precache list
```

**Nota:** O vídeo é essencial visualmente para o preloader, mas pode ser defer/lazy para contextos secundários.

---

### ⚠️ GARGALO 4 — Chamada Externa ipapi.co (261ms)

**Diagnóstico:** A API de geolocalização `https://ipapi.co/json/` é chamada durante o boot e leva 261ms. Esta chamada é feita no footer registry:

```
/components/footer/components/registry/index.js:361
```

**Impacto:** 261ms bloqueando no carregamento para obter dados de geolocalização que provavelmente não são críticos para o first render.

---

### ⚠️ GARGALO 5 — Configuração de Cache no Nginx

**Diagnóstico:** A configuração do Nginx em `/etc/nginx/sites-enabled/dshowdash.com.br` tem múltiplas regras de `no-cache` que podem estar impedindo o cache efetivo de recursos estáticos:

```nginx
# Regras encontradas (resumo):
# Assets estáticos (imagens/fontes): 7d, public, immutable ← ✅ OK
# Bundles JS (*.bundle.js): ? ← VERIFICAR
# CSS: ? ← VERIFICAR
# JS modules avulsos: no-cache ← 🔴 PROBLEMA
# HTML: no-cache ← ✅ Correto
# PHP: no-cache ← ✅ Correto
```

**Problema potencial:** Se os 150 módulos JS avulsos estão com `no-cache`, CADA page load faz 150 requests completos ao servidor, mesmo que os arquivos não tenham mudado.

**Compressão gzip:** Ativa no nginx.conf (level 6) e no site config, incluindo `application/javascript`. Brotli **não está configurado** no Nginx (apenas gzip). O Cloudflare pode estar servindo Brotli, mas apenas para requests cacheados.

---

## Propostas de Atividades (Priorizadas)

### P0 — Impacto Máximo / Risco Baixo

#### P0.1 — Adicionar `<link rel="modulepreload">` para Bundles Críticos

**O que fazer:** Adicionar tags `<link rel="modulepreload">` no `<head>` do `index.html` para os bundles principais. Isso permite que o browser descubra e comece a baixar todos os bundles em paralelo, eliminando a cascata de descoberta.

**Onde:** `/var/www/dshowdash/public/index.html`

**Bundles para modulepreload (em ordem de prioridade):**
```html
<link rel="modulepreload" href="/bootstrap-v2/dist/bootstrap.bundle.js">
<link rel="modulepreload" href="/core/runtime/dist/runtime.bundle.js">
<link rel="modulepreload" href="/core/kernel/dist/kernel.bundle.js">
<link rel="modulepreload" href="/components/main/dist/main.bundle.js">
<link rel="modulepreload" href="/components/app-shell/dist/app-shell.bundle.js">
<link rel="modulepreload" href="/components/header/dist/header.bundle.js">
<link rel="modulepreload" href="/components/sidebar/dist/sidebar.bundle.js">
<link rel="modulepreload" href="/components/footer/dist/footer.bundle.js">
<link rel="modulepreload" href="/components/nav-rail/dist/nav-rail.bundle.js">
<link rel="modulepreload" href="/components/preloader/dist/preloader.bundle.js">
<link rel="modulepreload" href="/components/overlay-layer/dist/overlay-layer.bundle.js">
```

**Impacto estimado:** Redução de 40-60% no JS waterfall window (de 29s para ~12-15s).

**Risco:** Zero. Modulepreload é hint — se o browser não suportar, ignora silenciosamente.

**Validação:** Comparar `jsLoadWindow` antes e depois via Performance API.

---

#### P0.2 — Consolidar CSS em Bundles Temáticos

**O que fazer:** Agrupar os 21 CSS individuais do `<head>` em 3-4 bundles concatenados para reduzir round-trips. CSS no `<head>` é render-blocking, então cada request adicionado atrasa o FCP proporcionalmente à latência.

**Proposta de agrupamento:**

| Bundle | Arquivos Incluídos | Tamanho Est. |
|--------|-------------------|-------------|
| `core-tokens.bundle.css` | reset.css, variables.css, z-index.tokens.css, toast.tokens.css, edts.tokens.css, utilities.css | ~8KB |
| `theme-layout.bundle.css` | theme.css, global-theme.css, design-system.css, layout.css, panels-sane.css | ~5KB |
| `components-shell.bundle.css` | preloader/index.css, sidebar.bundle.css, app-shell/index.css, modal-manager-global/styles.css, router/styles.css | ~17KB |
| `main-container.bundle.css` | main.tokens.css, container-main.bundle.css | ~27KB |

**Onde:** Criar um script Vite/build similar ao de JS para concatenar CSS.

**Impacto estimado:** Redução de 21 requests CSS para 4 — economia de ~17 round-trips (~170ms * 17 = potencialmente ~2-3 segundos de render-blocking time eliminados). FCP pode cair de 676ms para ~400ms.

**Risco:** Baixo. CSS concatenado funciona igual a CSS separado. Manter originais como fonte.

**Validação:** Medir FCP antes e depois.

---

#### P0.3 — Revisar Cache Headers no Nginx para Módulos JS

**O que fazer:** Verificar e corrigir a configuração de cache no Nginx para que módulos JS avulsos (não apenas bundles) sejam cacheados com headers adequados.

**Onde:** `/etc/nginx/sites-enabled/dshowdash.com.br`

**Verificação necessária:** Executar o seguinte para ver quais regras de cache se aplicam a módulos JS:

```bash
# Ver a config completa do site
cat /etc/nginx/sites-enabled/dshowdash.com.br

# Testar headers de um módulo JS avulso
curl -sI https://dshowdash.com.br/core/runtime/ports-profiles.js | grep -i "cache\|expires\|age"

# Testar headers de um bundle
curl -sI https://dshowdash.com.br/components/main/dist/main.bundle.js | grep -i "cache\|expires\|age"
```

**Proposta de cache strategy:**

| Tipo | Cache-Control | Motivo |
|------|---------------|--------|
| `*.bundle.js` | `public, max-age=604800, immutable` | Bundles versionados, 7 dias |
| `*.js` (modules) | `public, max-age=3600` | Módulos podem mudar, 1 hora |
| `*.css` | `public, max-age=604800, immutable` | CSS raramente muda |
| `*.html` | `no-cache` | Sempre fresh |
| `/api/*` | `no-store` | Dados dinâmicos |

**Impacto estimado:** Após primeiro load, requests subsequentes usariam cache local — page load cairia para ~200ms em visits de retorno.

**Risco:** Baixo. Se um módulo for atualizado, o cache de 1h expira naturalmente.

---

### P1 — Impacto Alto / Risco Médio

#### P1.1 — Lazy-load do Vídeo de Background

**O que fazer:** O vídeo `video_background_site_web.mp4` (3.6MB) aparece no preloader com `autoplay`. Alterar para `preload="none"` e iniciar o carregamento via JS após o preloader ser montado no DOM — o browser mostrará o primeiro frame assim que disponível, sem bloquear o load de outros recursos.

**Onde:**
- `/var/www/dshowdash/public/components/preloader/template.js` (linha 46)
- `/var/www/dshowdash/public/components/preloader/template-aaa.js` (linha 42)

**Mudança proposta:**
```html
<!-- ANTES -->
<video autoplay loop muted playsinline preload="metadata">
  <source src="/assets/videos/video_background_site_web.mp4" type="video/mp4">
</video>

<!-- DEPOIS -->
<video loop muted playsinline preload="none" data-src="/assets/videos/video_background_site_web.mp4">
</video>
```

Então no JS do preloader, após montar o template:
```javascript
const video = document.querySelector('[data-src]');
if (video) {
  video.src = video.dataset.src;
  video.play().catch(() => {});
}
```

**Impacto estimado:** Elimina 799ms + 3.6MB do critical path. O preloader pode mostrar o progress bar imediatamente enquanto o vídeo carrega em background.

**Risco:** Médio. O vídeo pode ter um breve momento sem conteúdo visual. Mitigação: usar um poster/thumbnail estático como fallback.

---

#### P1.2 — Defer Chamada ipapi.co para Pós-Boot

**O que fazer:** A chamada `https://ipapi.co/json/` (261ms) é feita no footer registry durante o boot. Mover para ser executada após o boot completar (via `requestIdleCallback` ou `setTimeout`), cachear o resultado em `localStorage` com TTL de 24h.

**Onde:** `/var/www/dshowdash/public/components/footer/components/registry/index.js` (linha 361)

**Mudança proposta:**
```javascript
// ANTES: chamado durante boot
_fetchWithTimeout('https://ipapi.co/json/', ...);

// DEPOIS: defer para pós-boot com cache
function getGeoLocation() {
  const cached = localStorage.getItem('dshowdash_geo');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 86400000) return Promise.resolve(data); // 24h TTL
  }
  return requestIdleCallback(() => {
    _fetchWithTimeout('https://ipapi.co/json/', ...)
      .then(data => {
        localStorage.setItem('dshowdash_geo', JSON.stringify({ data, timestamp: Date.now() }));
        return data;
      });
  });
}
```

**Impacto estimado:** Elimina 261ms do critical path. Em visits subsequentes, elimina a chamada de rede completamente.

**Risco:** Baixo. Geolocalização no footer não é crítica para o first render.

---

### P2 — Otimizações de Médio Prazo

#### P2.1 — Bundlar Módulos JS Externos Frequentes

**O que fazer:** Identificar módulos JS avulsos que são importados por múltiplos bundles (externals compartilhados) e criar bundles de "shared dependencies". Exemplos detectados:

```
/core/runtime/ports-profiles.js          — importado por 13 bundles
/core/runtime/enterprise/strict-mode.js  — importado por 12 bundles
/core/runtime/events/catalog/dist/events-catalog.bundle.js — importado por 12 bundles
/core/runtime/constants/event-names.js   — importado por 6 bundles
/core/runtime/boot-ready-dom-bridge.js   — importado por 4 bundles
/core/runtime/early-boot-logger.js       — importado por 4 bundles
/platform/shell/layout-regions.js        — importado por 4 bundles
```

**Proposta:** Criar um `shared-runtime.bundle.js` que contenha os módulos mais importados, reduzindo ~30-50 requests individuais para 1.

**Impacto estimado:** Redução significativa do waterfall e do total de requests JS.

**Risco:** Médio. Requer ajuste na config do Vite (externals/internals) e testes de regressão.

---

#### P2.2 — Habilitar Brotli no Nginx

**O que fazer:** Brotli oferece 15-25% melhor compressão que gzip. Atualmente apenas gzip está configurado no Nginx. Cloudflare pode servir Brotli para conteúdo cacheado, mas para o origin server ter Brotli também melhora o cache miss performance.

**Onde:** `/etc/nginx/nginx.conf` ou `/etc/nginx/conf.d/`

```bash
# Instalar módulo brotli
apt-get install libnginx-mod-brotli

# Configuração
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript application/json image/svg+xml;
```

**Impacto estimado:** Redução de 15-25% no tamanho transferido de JS/CSS. Para o main.bundle.js (253KB gzip), poderia cair para ~200-215KB com Brotli.

**Risco:** Baixo. Brotli é amplamente suportado. Fallback para gzip automático.

---

#### P2.3 — Critical CSS Inline

**O que fazer:** Identificar o CSS mínimo necessário para renderizar o preloader (above-the-fold) e inline-lo diretamente no `<head>` do HTML. Mover os CSS restantes para `<link>` com `media="print" onload="this.media='all'"` para torná-los non-render-blocking.

**Onde:** `/var/www/dshowdash/public/index.html`

**CSS crítico (estimado):**
- `reset.css` (completo)
- `variables.css` (apenas variáveis usadas pelo preloader)
- `preloader/styles/index.css` (completo)

**Impacto estimado:** FCP poderia cair de 676ms para ~300-400ms, pois o preloader apareceria sem esperar os 21 CSS carregarem.

**Risco:** Médio. Requer identificar precisamente qual CSS é critical-path. Ferramentas como `critical` (npm) podem ajudar.

---

## Resumo Executivo de Prioridades

| # | Atividade | Impacto | Risco | Esforço |
|---|-----------|---------|-------|---------|
| P0.1 | Modulepreload para bundles | 🔴 Alto | ✅ Zero | 30min |
| P0.2 | Consolidar CSS em bundles | 🔴 Alto | ✅ Baixo | 2-3h |
| P0.3 | Cache headers Nginx | 🔴 Alto | ✅ Baixo | 1h |
| P1.1 | Lazy-load vídeo | ⚠️ Médio | ⚠️ Médio | 1h |
| P1.2 | Defer ipapi.co | ⚠️ Médio | ✅ Baixo | 30min |
| P2.1 | Bundle shared dependencies | 🔴 Alto | ⚠️ Médio | 4-6h |
| P2.2 | Habilitar Brotli | ⚠️ Médio | ✅ Baixo | 30min |
| P2.3 | Critical CSS inline | ⚠️ Médio | ⚠️ Médio | 2-3h |

---

## Instruções para Execução

### Protocolo Obrigatório

1. **Backup antes de qualquer alteração** — todos os backups devem ir para `/backup/` com formato `NOME.bak_YYYYMMDD_HHMMSS`
2. **Full-file audit** — nunca editar parcialmente; sempre reescrever o arquivo completo
3. **Validação no terminal primeiro** — somente testar no browser após validação de sintaxe
4. **Zero regressão** — testar boot completo após cada mudança (FP, FCP, Long Tasks, window.ContainerMain, window.CMBootstrap)
5. **Sem gambiarras** — soluções enterprise, não workarounds

### Comando de Validação Pós-Alteração

Após cada atividade, rodar no DevTools para comparar com baseline:

```javascript
(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const js = res.filter(r => r.name.includes('.js'));
  console.log(JSON.stringify({
    pageLoad: Math.round(nav.loadEventEnd - nav.startTime) + 'ms',
    domParsing: Math.round(nav.domInteractive - nav.responseEnd) + 'ms',
    totalResources: res.length,
    jsFiles: js.length,
    jsWindow: Math.round(Math.max(...js.map(r => r.responseEnd)) - Math.min(...js.map(r => r.startTime))) + 'ms',
    jsTransfer: Math.round(js.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024) + 'KB'
  }, null, 2));
})();
```

### Baseline para Comparação

```json
{
  "pageLoad": "423ms",
  "domParsing": "250ms",
  "totalResources": 250,
  "jsFiles": 104,
  "jsWindow": "28979ms",
  "jsTransfer": "1550KB"
}
```

---

*Documento gerado em 12/02/2026 — DshowDash Performance Audit v1.0*
