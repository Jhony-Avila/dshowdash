# M1e — phpMyAdmin allowlist + recon UFW/MySQL — 2026-08-10 06:19 -03

## IP de origem detectado (allowlist)
```text
SSH origin = 187.15.86.187
```

## UFW status
```text
(ufw inativo/sem permissão — rode: sudo ufw status verbose)
```

## 3306 — bind e alcance
```text
LISTEN 0      70         127.0.0.1:33060      0.0.0.0:*    users:(("mysqld",pid=3973518,fd=21))                                                                                                                                                                                                                       
LISTEN 0      151          0.0.0.0:3306       0.0.0.0:*    users:(("mysqld",pid=3973518,fd=27))                                                                                                                                                                                                                       
```

## Hosts remotos provisionados no MySQL (só a coluna host — sem segredos)
```text
(sem acesso por socket — rode manualmente: mysql -e "SELECT DISTINCT host FROM mysql.user;")
```

## Comandos GUARDADOS p/ allowlist do 3306 (NÃO aplicados — confirmação do Jhony)
```bash
# Fecham o 3306 ao público SEM mexer no SSH nem no default policy do ufw:
sudo ufw allow from 187.15.86.187 to any port 3306 proto tcp   # libera seu IP
sudo ufw deny 3306/tcp                                            # nega o resto (regra específica acima tem prioridade)
# repita o 'allow from' para cada IP/consumidor externo legítimo antes do deny.
```

## Smoke pós-allowlist (origem)
```text
home=200|text/html health=200|application/json; charset=utf-8  (pma: allow 127.0.0.1 + 187.15.86.187, deny all)
```

> **M1e aplicado.** phpMyAdmin restrito a 127.0.0.1 + 187.15.86.187. Backup: `/backup/elevacao-basal/20260810-061941`.
