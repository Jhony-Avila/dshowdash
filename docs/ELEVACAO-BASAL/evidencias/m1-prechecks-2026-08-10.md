# M1 — Pré-checks de contenção — 2026-08-10 05:31 -03

## A1 — Referências de carga a .ts/.tsx em JS/HTML servidos
```text
public/components/vite.components.config.js:68:      '/components/_shared/permissions/ui-feedback.ts',
public/components/vite.components.config.js:69:      '/components/_shared/permissions/migration-bridge.ts'
public/koala/index.html:20:    <script type="module" src="/src/main.tsx"></script>
```

**A1 liberado: NAO**

## A2 — Consumidores da porta 8080
```text
(nenhum consumidor de :8080 encontrado)
```

**A2 liberado: sim**

## A3 — Controles de acesso nas locations do phpMyAdmin
```text
1:    location ^~ /phpmyadmin/ {
5:        location ~ ^/phpmyadmin/(.+\.php)$ {
7:            include fastcgi_params;
11:        location ~* ^/phpmyadmin/(.+\.(css|js|png|jpg|jpeg|gif|ico|svg|ttf|woff|woff2))$ {
```

## A4 — Firewall (regras relevantes a 3306/8080/22)
```text
(sem ufw/iptables legível)
```

## A5 — Processos em 20241/37865
```text
LISTEN 0      4096       127.0.0.1:20241      0.0.0.0:*    users:(("cloudflared",pid=827,fd=3))                                                                                                                                                                                                                       
LISTEN 0      128        127.0.0.1:37865      0.0.0.0:*    users:(("code-6a49527b96",pid=701940,fd=12))                                                                                                                                                                                                               
```

## A6 — Arquivos .patch sob public/ (busca completa)
```text
public/components/footer/components/registry/index.js.patch
```

> Fase B NÃO executada (pré-check reprovado).
