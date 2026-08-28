# Track D — Matriz de Rotas (navegação mobile)

Destinos descobertos pelos registros reais de navegação
(`sidebar/registry/registry.js` + `sidebar/integration/navigation-model-loader.js`
e `nav-rail/registry/items.ts` → `MOBILE_ITEMS`) e pela lista da conta de teste.

> **Registros fragmentados (achado):** sidebar e nav-rail usam registros
> distintos. Pré-requisito da bottom-nav "derivar do mesmo registro" é unificar a
> fonte (próxima onda, JS). Enquanto isso, a bottom-nav usa `MOBILE_ITEMS`.

## Módulos da conta de teste (validação por rota)
| Módulo | Classe da validação | Quem valida ao vivo |
|---|---|---|
| Geral | permitido | Jhony (sessão autenticada) |
| Geral Compras | permitido | Jhony |
| Koala | permitido | Jhony |
| Docs | permitido | Jhony |
| Trânsito | permitido | Jhony |
| DataTables | permitido | Jhony |
| Outlook | permitido | Jhony |
| Ads Meta | permitido | Jhony |
| Google Analytics | permitido | Jhony |
| Anúncios | permitido | Jhony |
| Pipedrive | permitido | Jhony |
| Bling | permitido | Jhony |
| Avatar Studio | permitido (Track C mobile) | Jhony |
| Google Calendar | permitido | Jhony |

## Protocolo por destino (a rodar na sessão autenticada)
Para cada rota: (1) abrir o menu mobile; (2) selecionar; (3) confirmar estado
ativo (`aria-current`); (4) painel renderizado; (5) shell utilizável; (6) voltar;
(7) sem overlay órfão; (8) sem scroll-lock órfão; (9) sem erro fatal; (10) evidência.
Rotas indisponíveis por permissão = classe **separada**, não falha responsiva.

## Por que a validação por rota é do Jhony
O shell é uma SPA **autenticada** (auth/session/CSRF/kernel). Este ambiente de
nuvem não tem sessão autenticada — por regime, "validação visual e de sessão
autenticada é sempre do Jhony". O `02-validar-candidato.sh` e o
`global-mobile-css.mjs` (harness isolado) cobrem o que é validável sem auth; a
navegação por módulo roda na sessão autenticada com o override de flag por navegador.
