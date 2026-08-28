# TRACK A — Proposta P1 do Save (gap DESKTOP; NÃO aplicada)

Registrada separadamente por decisão do Jhony: a correção do save foi aplicada
**só na composição mobile** (as6.mobile_studio). O caminho **desktop** aprovado
permanece inalterado e mantém o comportamento atual, aqui documentado.

## Comportamento atual (desktop, e produção geral)
`salvarAvatar` (serviço compartilhado, Track A) é **offline-first**: em
401/422/429/500/timeout/offline/JSON-inválido, cai no **fallback local**
(`localStorage`) e retorna `{ok:true, origem:'local'}`. A `BarraSalvamento`
mostra "Tudo salvo" sem distinguir servidor de local — uma **confirmação
potencialmente ambígua** no desktop (o dado está salvo localmente, não no
servidor).

## Por que NÃO foi aplicado no desktop
Mexer nisso reabriria o handler/serviço de save congelado (Track A), afeta o
produto desktop aprovado e exige suíte completa + validação visual do Jhony.

## Proposta (para uma frente futura, com autorização)
1. `BarraSalvamento` (ou o controlador de apresentação): distinguir
   `origem:'api'` (salvo no servidor) de `origem:'local'` (só neste aparelho) e
   mostrar um estado próprio "salvo localmente · servidor indisponível · tentar
   enviar" em vez de "Tudo salvo".
2. Timeout client-side no `salvarAvatar` (hoje um POST pendente fica preso).
3. Mensagens por classe (401/403 sessão/permissão; 409 conflito → recarregar;
   429 aguardar; 5xx/timeout/offline → retry).
- **Impacto:** desktop passa a não dar confirmação ambígua; contrato de rede inalterado.
- **Compatibilidade:** desktop e mobile convergem (o mobile já tem o comportamento).
- **Rollback:** reverter o commit do handler restaura o offline-first atual.
- **Risco:** médio (caminho crítico de save) → exige suíte completa + validação visual.
- **Teste esperado:** uma versão desktop da matriz negativa exigindo estado claro
  (salvo-local ≠ salvo-servidor) em 11/11 negativos.
