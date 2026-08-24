# INDEX — GOLDEN SET V4.2 · verdictos por Hero (§40/§41)

> **Determinação (§40):** antes de gastar outra rodada, para cada Hero obrigatório
> digo **CAN PRODUCE** ou **ART SOURCE REQUIRED**. Resultado abaixo. Nenhum Hero
> crítico produzível por mim a ≥8 (teto de autoria de curvas em código, §28 —
> comprovado: body ~5-6, mão = mitten). **Status da fase: `V4.2 — BLOCKED_ON_ART_SOURCE`** (§57-B).

## Golden Set mínimo (§41) — não mais que isto até ≥8 (§42)
| Hero | Necessário | Verdicto (§40) | Pedido |
|---|---|---|---|
| BODY | Male/neutral + Female | **ART SOURCE REQUIRED** | `ART_REQUEST_BODY.md` |
| FACE | Male + Female + 4 estruturas | **ART SOURCE REQUIRED** | `ART_REQUEST_FACE_LIBRARY.md` |
| HAIR | Short + Afro | **ART SOURCE REQUIRED** | `ART_REQUEST_HAIR.md` |
| HAND | Neutral | **ART SOURCE REQUIRED** | `ART_REQUEST_HAND.md` |
| FOOTWEAR | Sneaker | **ART SOURCE REQUIRED** | `ART_REQUEST_SNEAKER.md` |
| CLOTHING | T-shirt | **ART SOURCE REQUIRED** | `ART_REQUEST_TSHIRT.md` |
| CLOTHING | Hoodie | **ART SOURCE REQUIRED** | `ART_REQUEST_HOODIE.md` |
| CLOTHING | Blazer | **ART SOURCE REQUIRED** | `ART_REQUEST_BLAZER.md` |
| CLOTHING | Pants | **ART SOURCE REQUIRED** | `ART_REQUEST_PANTS.md` |
| FULL | V42_FULL_MALE + FEMALE | **BLOCKED** (montagem) | `ART_REQUEST_FULL_HERO.md` |

Base de defeitos a evitar em todos: `CHEAPNESS_TELLS_V42.md`.

## FACE REVOLUTION — SIBLING SYNDROME (complementar §3/§4/§47)
Diagnóstico objetivo (mean pixel diff 0..255, limiar de identidade ≈ 12):
`IDENTITY_12 = 1.2` · `IDENTITY_12 grayscale = 1.2` · `BALD = 5.1` ·
`FACE_SHAPES_BLACK = 8.2`. Todos abaixo do limiar → **SIBLING SYNDROME
confirmado**: muitos IDs, uma pessoa. O **CHARACTER_IDENTITY_GATE** é
repetível via `tools-golden/v42face.ts` (rende + mede). Pedido completo com a
linguagem estrutural (head/eyes/brows/nose/mouth/teeth/ears/cheeks/jaw/chin/
expressions) e os testes de aceite: `ART_REQUEST_FACE_LIBRARY.md`.

## Por que ART SOURCE, não mais hand-code (§27/§28)
`HeroAsset2D` resolveu o **pipeline**, não a **arte** (§27). "Agora é autorado"
não é argumento de qualidade — a pergunta é "o desenho é bom?" (§27). Já
identifiquei minha limitação de autorar curvas visualmente no código (§28);
insistir seria "voltar ao método ruim". O gargalo é **ART SOURCE**, não redução
de qualidade (§28/§59).

## Como a arte entra (pipeline pronto — não precisa de código novo)
Cada `.svg` entregue pelo ilustrador segue as convenções já suportadas por
`importarHeroAsset` (ver `HEROES_2D` / `heroes.ts` e `domain/heroAsset.ts`):
`data-hero-layer` (base/mid/light/detail/occlusion/front), `data-channel`
(pele/cabelo/roupa/destaque), `data-material`, `data-anchor` / `<g data-hero="anchors">`,
`fitClass`. O engine **consome**, não reconstrói. Colocar o arquivo, registrar o
manifesto (id/categoria/frame/viewBox/canais/zonasMaterial/fit) e o asset entra
no catálogo atrás da flag premium — **sem** editar o motor.

## Definition of Done desta arte (§59)
Personagem completo: não parece barato / não parece avatar corporativo / não
parece app avatar / não parece cartoon procedural; possui anatomia, postura,
mãos, pés/calçados, roupa construída, face estruturada, cabelo autoral; mantém
coerência head-to-toe. Cada crítico **≥8/10 absoluto** (§51). Só então: expandir
variedade (§42) e montar os dois Full Heroes (§43/§44).
