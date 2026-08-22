# Onda 1424 — Fase B (rodada 1): rework de identidade facial + cabelos premium (decisão #216)

> Entrega 2026-08-22 — primeira onda de REWORK do BRIEFING_CORRETIVO_01 Fase B (§92: rework até Gate A = APPROVED). Relatório no formato §103.

## 1. O que mudou
Rework artístico das artes premium 2D (só arquivos `partes/premium/*` — Legacy intocado):
- **8 bases faciais** (`faces.ts`): cada base virou um `PerfilRosto` com crânio, maxilar (sombra lateral), queixo próprio (fenda/ponta/chato), nariz COM FORMA (reto/largo/fino/arrebitado/aquilino/curto), maçãs (altura+volume), testa e arcada com peso — fim do "rosto único parametrizado" que fazia todos parecerem irmãos (§18–§19). Silhuetas de crânio mais distintas (topo estável p/ o fit de cabelo §897; identidade na metade de baixo).
- **Olhos** (`olhoPremium`): cavidade ocular (sombra superior), canto lacrimal, linha d'água inferior, íris com raios + limbo escuro, catchlight principal em gota (§20).
- **5 cabelos** (`cabelos.ts`): `cab_px_curto`, `_lateral`, `_undercut`, `_rabo`, `_afro` — as massas eram ANÉIS OCOS que deixavam o couro à mostra ("calvície"/"shape colado", §23). Reescritas como **calotas sólidas** fechadas na hairline, com textura por mechas; afro virou domo cheio com borda em nuvem preenchida.

## 2. Onde aparece
Com o trilho premium ligado (`as6.classico_premium`/`as6.face_v2` — ou Candidate Mode `?avst_candidate=1`): qualquer base/olhos/cabelo `_px_` no Creator, palco, foto, presets Golden. Usuário sem a flag: nada muda.

## 3. Flag efetiva
Nenhuma flag nova. Consome as existentes (premium/faceV2). Arte nova em IDs existentes `_px_` (sem migração; saves antigos que já usam esses IDs premium veem a arte nova — é o comportamento desejado do rework, e todos esses IDs só existem no trilho premium opt-in).

## 4–6. Screenshots + resultado (avaliação honesta)
Enviados: contact-sheet das 8 bases, contact-sheet dos cabelos, Before×After facial atualizado. Salto claro de IDENTIDADE (rostos distintos; cabelos com massa real). Pendências para rodada 2 se o Jhony pedir: highlight do `cab_px_curto` um pouco forte; alguns queixos pontudos ainda dá p/ suavizar.

## 7. Gate afetado
GATE A (2D) — continua CANDIDATE; este rework ataca os 2 apontamentos da rodada anterior (rostos "irmãos" §18, cabelo fino §23). Veredito do Jhony decide APPROVED ou rodada 2.

## 8. Performance
catalogo-arte 427,8 KB < teto 436; orçamento 2D 115 casos, 0 erros.

## 9. Testes
Goldens premium regravados (#83 — p03–p16, c01/c02, h01–h06, p07/p08, f01–f04, e01–e03; 30 casos); 16 goldens LEGACY byte-idênticos (`golden-avatars` 16/16); suíte completa verde.

## 10. Rollback
Flag premium OFF = Legacy byte a byte (inalterado). Reverter o rework = `git revert` desta onda (arte premium volta à versão anterior; nenhum save quebra).

## Decisão
- **#216** Rework de arte premium é mudança de ASSET (não de contrato): goldens premium regravados no mesmo commit (#83), Legacy intocado, sem flag nova. Identidade facial resolvida por PERFIL declarativo por base (não parametrização de um rosto único); bug de cabelo resolvido trocando massa-anel por massa-calota sólida.

## Precisa do Jhony
- Veredito Gate A (APPROVED / rodada 2 com apontamentos) → decide seguir p/ roupas-materialidade (§24–§25) ou refinar mais rosto/cabelo.
- Colar o colar-1424 quando enviado.
