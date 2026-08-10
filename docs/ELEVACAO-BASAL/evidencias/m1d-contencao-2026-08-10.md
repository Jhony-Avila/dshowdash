# M1d — Contenção (oráculo por content-type) — 2026-08-10 05:55 -03

## Antes (origem)
```text
home=200|text/html  bundle=200|application/javascript
health=200|application/json; charset=utf-8  patch=200|text/html  8080=404
```

## Cloudflare purge
```text
"success":true
```

## Depois (origem)
```text
home=200|text/html  bundle=200|application/javascript  health=200|application/json; charset=utf-8  patch=200|text/html  8080=000000
```

> **M1d aplicado.** vhost :8080 desativado, .patch contido. Backup: `/backup/elevacao-basal/20260810-055552`.
