# ADR-008 · Destino de `public/api`

**Status**: PENDENTE · **Prazo**: M8

## Contexto
`public/api` é provavelmente alias físico/symlink de compatibilidade para `api/`
(confirmação pendente — questão aberta 6). Rotas Nginx e código podem assumir qualquer
um dos caminhos. Regra vigente: o alias NÃO deve ser transformado em cópia física.

## Opções
1. **Nginx roteia `/api` diretamente para `api/` (fora do document root) e o symlink é aposentado.**
   Vantagens: superfície pública mínima; um caminho canônico. Riscos: código que calcula paths assumindo `public/api`; exige mapa completo de consumidores.
2. **Manter symlink permanentemente** como camada de compatibilidade documentada.
   Vantagens: zero mudança. Riscos: compatibilidade sem plano de encerramento = dívida bloqueadora (princípio 10).
3. **Mover endpoints públicos deliberados para dentro do document root gerado** e internalizar o resto.
   Vantagens: alinha com ADR-003 opção 1. Riscos: depende do document root final.

## Decisão provisória
Tratar `public/api` como `COMPATIBILITY_LAYER` com owner (Jhony) e revisão no M8.
Sequência obrigatória antes de qualquer mudança: confirmar tipo → registrar destino →
mapear rotas Nginx → identificar código dependente do caminho → versionar backend ativo
→ testes de contrato → só então planejar remoção.

## Evidência necessária
`ls -la public/api` (coletor); grep de `public/api` no código; mapa de rotas Nginx;
testes de contrato verdes nas rotas críticas.
