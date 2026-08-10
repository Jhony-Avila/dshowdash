# Baseline do servidor — coletado em 2026-08-10 05:17 -03

> Gerado por scripts/basal/coletar-evidencias-servidor.sh (read-only, sem segredos).

## 1. Estado do Git no servidor


### Commit / branch

```text
c227194d6d3668d38e8e6f1fa93994f4d0652db9  (HEAD -> feat/pipedrive-modulo-completo) 2026-08-10 04:37:16 -0300
```

### Status do worktree (alterações manuais não reconciliadas)

```text
M  .gitignore
A  docs/ELEVACAO-BASAL/00-diagnostico-executivo.md
A  docs/ELEVACAO-BASAL/01-principios-e-invariantes.md
A  docs/ELEVACAO-BASAL/02-baseline-runtime.md
A  docs/ELEVACAO-BASAL/03-registro-de-riscos.md
A  docs/ELEVACAO-BASAL/04-modelo-de-classificacao.md
A  docs/ELEVACAO-BASAL/05-log-de-decisoes.md
A  docs/ELEVACAO-BASAL/06-questoes-abertas.md
A  docs/ELEVACAO-BASAL/07-politica-m0-congelamento.md
A  docs/ELEVACAO-BASAL/adr/ADR-001-fonte-canonica-frontend.md
A  docs/ELEVACAO-BASAL/adr/ADR-002-versionamento-de-artefatos.md
A  docs/ELEVACAO-BASAL/adr/ADR-003-document-root.md
A  docs/ELEVACAO-BASAL/adr/ADR-004-estrategia-ts-js.md
A  docs/ELEVACAO-BASAL/adr/ADR-005-workspaces.md
A  docs/ELEVACAO-BASAL/adr/ADR-006-mecanismo-de-build.md
A  docs/ELEVACAO-BASAL/adr/ADR-007-mecanismo-de-release.md
A  docs/ELEVACAO-BASAL/adr/ADR-008-destino-public-api.md
A  docs/ELEVACAO-BASAL/adr/ADR-009-politica-de-migrations.md
A  docs/ELEVACAO-BASAL/adr/ADR-010-compatibilidade-e-quarentena.md
A  scripts/basal/coletar-evidencias-servidor.sh
?? docs/ELEVACAO-BASAL/evidencias/
```

### Stashes

```text
```

## 2. Dependências do public/index.html (tracked × ignored + sha256)

```text
IGNORED  /app/router/dist/app-router.bundle.js  sha256:c53d8af029323433
IGNORED  /app/router/initial-route.js  sha256:2b7acbc584cb47f9
IGNORED  /assets/css/core/z-index.tokens.css  sha256:d2d12830616ce677
IGNORED  /assets/css/design-system/design-system.css  sha256:c9caa4b1ffc18353
IGNORED  /assets/css/global-theme.css  sha256:e3cd93876d69c95d
IGNORED  /assets/css/layout.css  sha256:21cf8f6757c01d27
IGNORED  /assets/css/panels-sane.css  sha256:08c99ceed0aab3e7
IGNORED  /assets/css/theme.css  sha256:156a58fb1333eb02
IGNORED  /assets/css/theme.light-total.css  sha256:9d850edaa4be3925
IGNORED  /assets/css/tokens/edts.tokens.css  sha256:e685bc1f6f289814
IGNORED  /assets/css/tokens/toast.tokens.css  sha256:77bf0549ed37bd75
IGNORED  /assets/js/core/api-client/dist/api-client.bundle.js  sha256:f681c1dc375157f8
IGNORED  /assets/js/core/config-loader/dist/config-loader.bundle.js  sha256:e9531ce76c782ebc
IGNORED  /assets/js/core/environment-manager/dist/environment-manager.bundle.js  sha256:e36c32f78d8f08aa
IGNORED  /assets/js/core/header-scroll-guardian.js  sha256:a3ac853ad87d3584
IGNORED  /assets/js/core/logger-global/dist/logger-global.bundle.js  sha256:3158fb4f1cfc0d81
IGNORED  /assets/js/core/telemetry-core/dist/telemetry-core.bundle.js  sha256:cddbe87c71c83068
IGNORED  /assets/js/core/theme-manager/dist/theme-manager.bundle.js  sha256:2d2761a4f013d3d3
IGNORED  /assets/js/core/theme-toggle-header/index.js  sha256:58affa85c37a9029
IGNORED  /assets/js/core/theme-tokens-loader/dist/theme-tokens-loader.bundle.js  sha256:c070eec328de7175
IGNORED  /bootstrap-v2/dist/bootstrap.bundle.js  sha256:b8ba0600f589e220
IGNORED  /components/_shared/permissions/dist/integration.bundle.js  sha256:0307a99fdfbcd0b8
IGNORED  /components/_shared/permissions/dist/ui-feedback.bundle.js  sha256:956a65acd245bcb1
IGNORED  /components/app-shell/dist/app-shell.bundle.js  sha256:e1e48a2ac6dcf2b1
TRACKED  /components/app-shell/styles/index.css  sha256:47c43a6589a1ae50
TRACKED  /components/avatar-sync/index.js  sha256:ddcccdde55647823
IGNORED  /components/context-provider/dist/context-provider.bundle.js  sha256:7790226b62ed231e
IGNORED  /components/error-boundary/dist/error-boundary.bundle.js  sha256:7163355f3dfeb37c
IGNORED  /components/feature-flags/dist/feature-flags.bundle.js  sha256:69a01bd5c8fa3e45
IGNORED  /components/footer/dist/footer.bundle.js  sha256:707b5b8d4320ea8a
TRACKED  /components/gcal-header-popover/index.js  sha256:0ca74374c32b66fa
TRACKED  /components/gcal-header-popover/style.css  sha256:988f0e170ae7d1f5
TRACKED  /components/header/components/currency-panel/index.js  sha256:9e959301a62247b9
IGNORED  /components/header/components/dist/header-components.bundle.js  sha256:7250736c591fb5a2
IGNORED  /components/header/dist/header.bundle.js  sha256:602f67171bd29938
IGNORED  /components/layout-manager/dist/layout-manager.bundle.js  sha256:e7e72ac4c53bc281
IGNORED  /components/login-modal/dist/login-modal.bundle.js  sha256:5b2c974e70c698e8
IGNORED  /components/main/dist/main.bundle.js  sha256:2777df85e929d049
TRACKED  /components/main/main.tokens.css  sha256:05442eab3c333ad2
TRACKED  /components/main/ui/container-main/container-main.bundle.css  sha256:a00902d8768aa757
TRACKED  /components/main/ui/container-main/utils/features-toolbar/styles/toolbar.css  sha256:348395d193a40e5d
TRACKED  /components/modal-manager-global/styles.css  sha256:cbcc0d634f413ad0
IGNORED  /components/nav-rail/dist/nav-rail.bundle.js  sha256:14e77333f8342cc3
IGNORED  /components/overlay-layer/dist/overlay-layer.bundle.js  sha256:cb7bc7f4254318ef
TRACKED  /components/panels/panel-dashboard/index.js  sha256:4c478e71169c2539
TRACKED  /components/panels/panel-nav-admin/styles-premium.css  sha256:c9030d33836a7c67
TRACKED  /components/panels/panel-nav-admin/styles.css  sha256:daab870b9d5eb879
IGNORED  /components/preloader/dist/preloader.bundle.js  sha256:5e4ac81d0b6cd842
TRACKED  /components/preloader/styles/index.css  sha256:841f218ec5e57fc2
TRACKED  /components/router/styles.css  sha256:2fa4332c8eebdcc5
IGNORED  /components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js  sha256:8d8e1d49de879131
IGNORED  /components/session-manager/dist/session-manager.bundle.js  sha256:8412fcc5ff64bb06
IGNORED  /components/sidebar/dist/sidebar.bundle.js  sha256:a6ddb2aa75301ec7
TRACKED  /components/sidebar/styles/sidebar.bundle.css  sha256:cbcdc72fbfb9849e
TRACKED  /components/ticker/component-enterprise.css  sha256:2483573904051f11
IGNORED  /components/ticker/dist/ticker.bundle.js  sha256:db329b70b894c5d5
IGNORED  /components/toast/service/dist/toast-service.bundle.js  sha256:b11e163599bc2599
TRACKED  /components/traffic-monitor/header-indicator.js  sha256:5808c80eae467630
TRACKED  /components/world-clock-map/index.js  sha256:742a89dc7c877f97
IGNORED  /config/app.config.js  sha256:433500ea9a9d057a
IGNORED  /core/auth/dist/auth.bundle.js  sha256:c661bc15b135119d
IGNORED  /core/css/reset.css  sha256:085a1ecdecc02adf
IGNORED  /core/css/utilities.css  sha256:1fb92a2839d05727
IGNORED  /core/css/variables.css  sha256:249cdec6b3af4a2c
IGNORED  /core/js/asset-loader/dist/asset-loader.bundle.js  sha256:493268c45606538c
IGNORED  /core/js/enterprise-loader/dist/enterprise-loader.bundle.js  sha256:5913ed6f1949f2ff
IGNORED  /core/js/event-bus/dist/event-bus.bundle.js  sha256:237d609862673323
IGNORED  /core/kernel/dist/kernel.bundle.js  sha256:00997fbf3f02eb87
IGNORED  /core/kernel/ui/dist/kernel-ui.bundle.js  sha256:9b2827e266c5810d
IGNORED  /core/runtime/dist/runtime.bundle.js  sha256:18ef4f7a71164ed4
IGNORED  /core/runtime/events/catalog/dist/events-catalog.bundle.js  sha256:27531cffff0c2a2a
IGNORED  /core/services/toast-service.js  sha256:3ca1845c5c6d9725
IGNORED  /core/ui-orchestrator/dist/ui-orchestrator.bundle.js  sha256:1492c270193676b0
IGNORED  /modules/global-state/dist/global-state.bundle.js  sha256:a6ac88931ef820f8
IGNORED  /platform/runtime/dist/platform-runtime.bundle.js  sha256:3ac4aac3ff500bda
IGNORED  /platform/shell/dist/platform-shell.bundle.js  sha256:7d9e6981c3faa269
```

## 3. Diretórios dist e frescor (fonte mais nova que o artefato?)

```text
DEFASADO     1 arquivos  public/app/router/dist
ok?          1 arquivos  public/assets/css/design-system/dist
DEFASADO     3 arquivos  public/assets/css/dist
DEFASADO     1 arquivos  public/assets/js/core/api-client/dist
ok?          1 arquivos  public/assets/js/core/config-loader/dist
DEFASADO     1 arquivos  public/assets/js/core/environment-manager/dist
DEFASADO     1 arquivos  public/assets/js/core/logger-global/dist
ok?          1 arquivos  public/assets/js/core/telemetry-core/dist
ok?          1 arquivos  public/assets/js/core/theme-manager/dist
ok?          1 arquivos  public/assets/js/core/theme-tokens-loader/dist
DEFASADO     1 arquivos  public/bootstrap-v2/dist
DEFASADO     2 arquivos  public/components/_shared/permissions/dist
DEFASADO     1 arquivos  public/components/app-shell/dist
ok?          1 arquivos  public/components/app-shell/styles/dist
DEFASADO     1 arquivos  public/components/context-provider/dist
DEFASADO     1 arquivos  public/components/error-boundary/dist
DEFASADO     1 arquivos  public/components/feature-flags/dist
DEFASADO     1 arquivos  public/components/footer/dist
DEFASADO     1 arquivos  public/components/footer/styles/dist
DEFASADO     1 arquivos  public/components/header/components/dist
DEFASADO     1 arquivos  public/components/header/dist
DEFASADO     1 arquivos  public/components/layout-manager/dist
DEFASADO     2 arquivos  public/components/login-modal/dist
ok?          1 arquivos  public/components/main/dist
DEFASADO     1 arquivos  public/components/modal-manager-global/dist
DEFASADO     1 arquivos  public/components/nav-rail/dist
DEFASADO     1 arquivos  public/components/nav-rail/styles/dist
DEFASADO     1 arquivos  public/components/overlay-layer/dist
ok?          1 arquivos  public/components/panel-home/dist
ok?         24 arquivos  public/components/panels/panel-ads/dist
ok?          6 arquivos  public/components/panels/panel-anuncios/dist
ok?         23 arquivos  public/components/panels/panel-avatar-studio/dist
ok?          9 arquivos  public/components/panels/panel-bling/dist
ok?          7 arquivos  public/components/panels/panel-dashboard/dist
ok?         72 arquivos  public/components/panels/panel-datatables/dist
ok?          8 arquivos  public/components/panels/panel-google-analytics/dist
ok?         12 arquivos  public/components/panels/panel-google-calendar/dist
ok?          6 arquivos  public/components/panels/panel-mercadolivre/dist
ok?          6 arquivos  public/components/panels/panel-metaads/dist
ok?          5 arquivos  public/components/panels/panel-outlook/dist
ok?          8 arquivos  public/components/panels/panel-pipedrive/dist
DEFASADO    12 arquivos  public/components/panels/panel-relogio-mundial/dist
DEFASADO     1 arquivos  public/components/preloader/dist
ok?          1 arquivos  public/components/preloader/styles/dist
DEFASADO     1 arquivos  public/components/security/csrf-token-manager/dist
DEFASADO     1 arquivos  public/components/session-manager/dist
DEFASADO     1 arquivos  public/components/sidebar/dist
DEFASADO     1 arquivos  public/components/ticker/dist
DEFASADO     1 arquivos  public/components/toast/service/dist
DEFASADO     1 arquivos  public/core/auth/dist
DEFASADO     1 arquivos  public/core/js/asset-loader/dist
DEFASADO     1 arquivos  public/core/js/enterprise-loader/dist
DEFASADO     1 arquivos  public/core/js/event-bus/dist
DEFASADO     1 arquivos  public/core/kernel/dist
ok?          1 arquivos  public/core/kernel/ui/dist
DEFASADO     1 arquivos  public/core/runtime/dist
DEFASADO     1 arquivos  public/core/runtime/events/catalog/dist
DEFASADO     1 arquivos  public/core/ui-orchestrator/dist
DEFASADO     3 arquivos  public/koala/dist
DEFASADO     1 arquivos  public/modules/global-state/dist
ok?          1 arquivos  public/platform/runtime/dist
ok?          1 arquivos  public/platform/shell/dist
ok?          2 arquivos  public/react/dist
```

Total de dists: `63`

## 4. Físico × rastreado por árvore crítica

```text
api                      fisicos:   560  rastreados:   118
public/app               fisicos:    32  rastreados:     0
public/bootstrap-v2      fisicos:   415  rastreados:     0
public/core              fisicos:   477  rastreados:     0
public/platform          fisicos:   112  rastreados:     0
public/modules           fisicos:    36  rastreados:     0
public/react             fisicos:     7  rastreados:     0
```

## 5. Tipo real de public/api


### ls -la public/api

```text
lrwxrwxrwx 1 www-data www-data 22 Nov 10  2025 public/api -> /var/www/dshowdash/api
```

### readlink -f

```text
/var/www/dshowdash/api
```

## 6. Nginx (apenas listen/server_name/root/location/alias — sem segredos)


### config: /etc/nginx/sites-enabled/dshowdash-v3

```text
2:    listen 8080;
3:    server_name _;
5:    root /var/www/dshowdash_v3/public;
13:    location / {
18:    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
24:    location ~* \.html$ {
```

### config: /etc/nginx/sites-enabled/dshowdash.com.br

```text
2:    listen 80;
3:    listen [::]:80;
4:    server_name dshowdash.com.br www.dshowdash.com.br;
12:    listen 443 ssl http2;
13:    listen [::]:443 ssl http2;
14:    server_name dshowdash.com.br www.dshowdash.com.br;
19:    root  /var/www/dshowdash/public;
39:    location ~* \.(bak|bak-[a-z0-9_-]+|bak\.[0-9a-z_-]+|old|tmp|swp|orig|backup|pre-[a-z0-9_-]+|map|log)$ {
48:    location = /index.html {
59:    location = /csp-report.php {
69:    location ~* ^/components/.*\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
78:    location ~* ^/assets/js/core/.*\.(js|mjs|css)$ {
85:    location /assets/ {
92:    location ^~ /modules/ {
93:        root /var/www/dshowdash/public;
100:    location ^~ /mf/ {
101:        root /var/www/dshowdash/public;
112:    location = /sw.js {
119:    location = /manifest.webmanifest {
127:    location = /api/health {
137:    location = /api/user/preferences {
147:    location ~ ^/api/user/panel-settings(/.*)?$ {
158:    location ~ ^/api/user/layouts(/.*)?$ {
169:    location ~ ^/api/user/saved-views(/.*)?$ {
180:    location ~ ^/api/user/preferences-history(/.*)?$ {
191:    location ~ ^/api/auth/(.+\.php)$ {
193:        alias /var/www/dshowdash/api/auth/$1;
212:    location ~ ^/components/(.+)/api/backend/(.+\.php)$ {
214:        alias /var/www/dshowdash/public/components/$1/api/backend/$2;
226:    location ~ ^/api/ui/header(/.*)?$ {
243:    location ~ ^/api/admin/navigation(/.*)?$ {
260:    location ~ ^/api/permissions(/.*)?$ {
280:    location ~ ^/api/outlook(/.*)?$ {
302:    location ~ ^/api/pipedrive(/.*)?$ {
325:    location ~ ^/api/datatables(/.*)?$ {
344:    location ~ ^/api/koala(/.*)?$ {
363:    location ~ ^/api/ads(/.*)?$ {
384:    location ~ ^/api/bling(/.*)?$ {
405:    location ~ ^/api/google-calendar(/.*)?$ {
425:    location ~ ^/api/google-analytics(/.*)?$ {
443:    location ~ "^/p/([a-f0-9]{24,64})(?:/(download))?/?$" {
461:    location ~ ^/api/([^/]+)/$ {
462:        alias /var/www/dshowdash/api/$1/;
480:    location = /api/metrics/server.php {
484:        alias /var/www/dshowdash/api/metrics/server.php;
501:    location ~ ^/api/admin/panels(/.*)?$ {
518:    location = /api/admin/panels/categories {
534:    location ~ ^/api/admin/panels/([a-zA-Z0-9_-]+)/screenshot$ {
551:    location /storage/media/images/screenshots/ {
552:        alias /var/www/dshowdash/storage/media/images/screenshots/;
556:    location ~ ^/api/(.+\.php)$ {
557:        alias /var/www/dshowdash/api/$1;
576:    location ~ ^/modules/(.+\.php)$ {
577:        alias /var/www/dshowdash/api/modules/$1;
595:    location ^~ /app/ {
596:        alias /var/www/dshowdash/public/app/;
608:    location ^~ /components/panel-home/styles/ {
620:    location ^~ /components/panel-home/weather-fx/ {
634:    location ^~ /components/footer/styles/ {
641:    location ^~ /components/_shared/nav-fx/ {
651:    location ^~ /koala/ {
652:        alias /var/www/dshowdash/public/koala/dist/;
661:    location / {
667:        location ~* /(package-lock\.json|package\.json|composer\.(json|lock)|tsconfig[^/]*\.json)$ {
671:        location ~* \.(js|mjs|css|json|svg|png|jpg|jpeg|webp|gif|ico|woff|woff2|ttf|eot)$ {
678:    location ~ ^/(?!api/|modules/|components/).+\.php$ {
684:    location ~ /\. { deny all; return 404; }
687:    location ^~ /phpmyadmin/ {
688:        alias /usr/share/phpmyadmin/;
695:        location ~ ^/phpmyadmin/(.+\.php)$ {
696:            alias /usr/share/phpmyadmin/$1;
702:        location ~* ^/phpmyadmin/(.+\.(css|js|png|jpg|jpeg|gif|ico|svg|ttf|woff|woff2))$ {
703:            alias /usr/share/phpmyadmin/$1;
```

### config: /etc/nginx/conf.d/brotli.conf

```text
[AVISO] comando falhou: grep -nE ^\s*(listen|server_name|root|location|alias) /etc/nginx/conf.d/brotli.conf
```

### config: /etc/nginx/conf.d/cloudflare_realip.conf

```text
[AVISO] comando falhou: grep -nE ^\s*(listen|server_name|root|location|alias) /etc/nginx/conf.d/cloudflare_realip.conf
```

### config: /etc/nginx/conf.d/dshowdash-cache-map.conf

```text
[AVISO] comando falhou: grep -nE ^\s*(listen|server_name|root|location|alias) /etc/nginx/conf.d/dshowdash-cache-map.conf
```

### config: /etc/nginx/conf.d/rootcheck_format.conf

```text
[AVISO] comando falhou: grep -nE ^\s*(listen|server_name|root|location|alias) /etc/nginx/conf.d/rootcheck_format.conf
```

### config: /etc/nginx/conf.d/ssl-tuning.conf

```text
[AVISO] comando falhou: grep -nE ^\s*(listen|server_name|root|location|alias) /etc/nginx/conf.d/ssl-tuning.conf
```

### nginx -t

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## 7. Portas em escuta e serviços


### ss -tlnp (portas)

```text
State Local Address:PortProcess
LISTEN 127.0.0.1:33060 
LISTEN 0.0.0.0:8080 
LISTEN 127.0.0.1:20241 
LISTEN 127.0.0.1:37865 
LISTEN 0.0.0.0:3306 
LISTEN 0.0.0.0:443 
LISTEN 0.0.0.0:80 
LISTEN 127.0.0.1:6379 
LISTEN 0.0.0.0:22 
LISTEN 127.0.0.53%lo:53 
LISTEN 127.0.0.1:8100 
LISTEN 127.0.0.54:53 
LISTEN [::]:443 
LISTEN [::]:80 
LISTEN [::]:22 
LISTEN [::1]:6379 
```

### servicos ativos (nginx/php/mysql/redis/python/cloudflared)

```text
  cloudflared.service                                   loaded active running cloudflared
  decision-engine.service                               loaded active running Google Ads Decision Engine API (Dshow)
  mysql.service                                         loaded active running MySQL Community Server
  nginx.service                                         loaded active running A high performance web server and a reverse proxy server
  php8.3-fpm.service                                    loaded active running The PHP 8.3 FastCGI Process Manager
  redis-server.service                                  loaded active running Advanced key-value store
```

## 8. Exposição HTTP de fontes internas (status code apenas)

```text
HTTP 200  /components/_shared-react/components/DataGrid.tsx
HTTP 200  /components/_shared-react/components/Painel.tsx
HTTP 200  /components/_shared-react/index.ts
HTTP 200  /components/_shared-react/lib/formato.ts
HTTP 200  /components/_shared/icons.ts
HTTP 200  /components/_shared/permissions/builders/index.ts
HTTP 200  /koala/src/api/client.ts
```

(200 em .ts/.tsx/.patch = exposição confirmada — risco BASAL-004)

## 9. Testes existentes fora do Avatar Studio


### arquivos de teste (excluindo avatar)

```text
./tests/api-navigation-test.php
./storage/media/images/screenshots/panel-footer-settings/latest.jpg
./storage/media/images/screenshots/panel-user-preferences/latest.jpg
./storage/media/images/screenshots/panel-session-admin/latest.jpg
./storage/media/images/screenshots/panel-status-currency-usd-brl/latest.jpg
./storage/media/images/screenshots/panel-13/latest.jpg
./storage/media/images/screenshots/panel-07/latest.jpg
./storage/media/images/screenshots/panel-12/latest.jpg
./storage/media/images/screenshots/panel-integration-bling/latest.jpg
./storage/media/images/screenshots/panel-status-currency-usd-cny/latest.jpg
./storage/media/images/screenshots/panel-17/latest.jpg
./storage/media/images/screenshots/panel-08/latest.jpg
./storage/media/images/screenshots/panel-integration-pipedrive/latest.jpg
./storage/media/images/screenshots/panel-integration-calendar/latest.jpg
./storage/media/images/screenshots/panel-integration-adwords/latest.jpg
./storage/media/images/screenshots/panel-cards/latest.jpg
./storage/media/images/screenshots/panel-04/latest.jpg
./storage/media/images/screenshots/panel-permissions-admin/latest.jpg
./storage/media/images/screenshots/panel-footer-globe/latest.jpg
./storage/media/images/screenshots/panel-footer-status/latest.jpg
./storage/media/images/screenshots/panel-09/latest.jpg
./storage/media/images/screenshots/panel-orchestrator-manager/latest.jpg
./storage/media/images/screenshots/panel-user-sessions/latest.jpg
./storage/media/images/screenshots/panel-location/latest.jpg
./storage/media/images/screenshots/panel-status-currency-btc/latest.jpg
./storage/media/images/screenshots/panel-10/latest.jpg
./storage/media/images/screenshots/panel-03/latest.jpg
./storage/media/images/screenshots/panel-status/latest.jpg
./storage/media/images/screenshots/panel-analytics/latest.jpg
./storage/media/images/screenshots/panel-nav-admin/latest.jpg
./storage/media/images/screenshots/panel-status-email-integration/latest.jpg
./storage/media/images/screenshots/panel-dashboard/latest.jpg
./storage/media/images/screenshots/panel-18/latest.jpg
./storage/media/images/screenshots/panel-integration-mercado-livre/latest.jpg
./storage/media/images/screenshots/panel-files/latest.jpg
./storage/media/images/screenshots/panel-user-management/latest.jpg
./storage/media/images/screenshots/panel-footer-server/latest.jpg
./storage/media/images/screenshots/panel-06/latest.jpg
./storage/media/images/screenshots/panel-orchestrator/latest.jpg
./storage/media/images/screenshots/panel-observability/latest.jpg
```

## 10. /backup (governança de remoções)


### primeiros níveis

```text
total 1220916
drwxrwxrwt+ 640 root     root      3690496 Aug 10 05:15 .
drwxr-xr-x   26 root     root         4096 Aug 10 04:37 ..
-rw-r-----+   1 root     root         6720 Jul 30 15:03 .env.bak-pre-dshowdash-app-20260730-150359
-rw-r--r--+   1 root     root        54192 Jul 30 06:56 02-banco-BLING.sql.20260730-065633.bak
-rw-r-----+   1 root     root        12553 Jul 30 07:21 05-plano-fases.md.20260730-072129.bak
-rw-r--r--+   1 www-data www-data    11746 Jul 22 20:25 06-melhorias-futuras-20260727-232836.md
drwxrwxr-x+   3 root     root         4096 Feb 12 07:59 2022_02_12
-rw-rw-rw-+   1 root     root        24764 Apr 29 11:10 2025_12_08.tar.gz
drwxrwxrwx+   7 root     root         4096 Feb  5  2026 2026-02-05-briefing-fix
drwxrwxrwx+   2 root     root         4096 Feb  5  2026 2026-02-05-p1-events
drwxrwxrwx+   2 root     root         4096 Feb  5  2026 2026-02-05-p2-elevacao
drwxrwxrwx+   2 root     root         4096 Feb  6  2026 2026-02-06-strict-mode-migration
drwxrwxrwx+   3 root     root         4096 Jul 29 20:01 2026-07-29-fix-container-any
drwxrwxrwx+   2 root     root         4096 Jul 30 16:00 2026-07-30-isloginpage
-rw-rw-rw-+   1 root     root          115 Apr 29 11:10 20260105_120243.tar.gz
drwxrwxrwx+   2 root     root         4096 Jan 31  2026 20260113
-rwxrwxrwx+   1 root     root         6353 Feb  6  2026 404-index-pre-p1.html
-rw-rw-r--+   1 root     root         2822 Jul 30 15:23 ACHADO-JHONY-PRIVILEGIO-TOTAL.md
-rwxrwxrwx+   1 root     root         6070 Jan 21  2026 API_CONTRACT.md
-rwxrwxrwx+   1 root     root         9402 Jan 24  2026 API_REFERENCE.md
-rwxrwxrwx+   1 root     root         1794 Feb  3  2026 APP-SHELL-EVENT-CATALOG.md
-rwxrwxrwx+   1 root     root         1002 Feb  3  2026 APP-SHELL-WINDOW-USAGE.md
-rwxrwxrwx+   1 root     root         4329 Dec  1  2025 ARCHITECTURE.md
-rwxrwxrwx+   1 root     root        15317 Feb  2  2026 AUDIT-AAA-30.md
```

## 11. Toolchain do servidor


### versões

```text
v20.20.2
10.8.2
PHP 8.3.6 (cli) (built: Jul 16 2026 18:30:41) (NTS)
nginx version: nginx/1.24.0 (Ubuntu)
mysql  Ver 8.0.46-0ubuntu0.24.04.3 for Linux on x86_64 ((Ubuntu))
```

---
Coleta concluída. Revisar manualmente antes de commitar: confirmar que nenhum dado sensível foi capturado.
