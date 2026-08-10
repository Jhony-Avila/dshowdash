# M1c — Contenção limpa (origem-verificada) — 2026-08-10 05:48 -03

## Origem — antes
```text
patch=200 8080=404 home=200 health=200
```

## Cloudflare purge
```text
"success":true
```

## Origem — depois
```text
home=200 bundle=200 health=200 patch=200 8080=000REFUSED
```

> Revertido por falha de validação/smoke.
