# Track C Mobile — Ativação e Rollback

## Pré-condições

- `as6.mobile_studio` depende de `as5.novo_shell` (DEPENDENCIAS_FLAGS): a
  composição mobile só vale com o shell novo ligado.
- A composição ativa apenas em viewport estreito (≤768w) ou baixo (≤520h). Em
  desktop, mesmo com a flag ON, `data-mobile` não é aplicado (provado por
  `desktop-responsive-regression`).

## Ativação (flip)

A flag é lida por `flag('as6.mobile_studio')` de PADROES →
`localStorage['dshow.avst.flags.v1']` → remotas. Ativar em produção = ligar a
flag pelo mecanismo de flags remotas do produto (sem deploy de código).
Ativação progressiva possível (ex.: subconjunto de usuários) pelo mesmo canal.

Ordem recomendada:
1. Validar em device real com a flag ON local (kit de device).
2. Ligar a flag para uma fração pequena; observar.
3. Ampliar.

## Rollback (imediato, sem deploy)

Desligar `as6.mobile_studio` remove 100% da composição mobile em runtime:
`useMobileStudio()` passa a retornar false, `data-mobile` some do shell, e todo
o `mobile.css` (escopado em `.avst5-shell[data-mobile]`) fica inerte. O desktop
aprovado volta byte a byte. É o rollback por-feature do §651.

Não há migração de dados nem estado persistido novo: nada a reverter além da
flag. Avatares/fotos salvos são idênticos com a flag ON ou OFF (byte-stability).

## Garantias

| Garantia | Como |
|---|---|
| Desktop intocado | CSS escopado por `data-mobile`; ausente no desktop |
| Rollback sem deploy | desligar a flag |
| Sem efeito em dados | Track C não toca serialização/API/motor |
| Isolamento | flag OFF por padrão; dep de `as5.novo_shell` |
