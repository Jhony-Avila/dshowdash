# SINGLE_2D_FEATURE_PARITY_V43 (§4)

> Inventário LIDO do código (App.tsx clássico × ShellStudio novo), não assumido.
> Correção aceita: V4.2 SINGLE 2D = **PARTIAL** — esconder a troca de modo sem
> absorver as features criava **feature loss**. V4.3 dá DESTINO no shell a toda
> feature relevante. Colunas: FEATURE · CLASSIC · NEW SHELL (antes) · USER-FACING ·
> KEEP · DESTINATION · STATUS (depois do #66).

| FEATURE | CLASSIC (App.tsx) | NEW SHELL (antes) | USER-FACING | KEEP | DESTINATION | STATUS |
|---|---|---|---|---|---|---|
| Avatar/Character | GradeItens+Cores (aba itens) | ✅ PainelCatalogo | sim | sim | catálogo do shell | já ✅ |
| Presets (curados) | `Presets` (aba presets) | ⚠️ só PresetsShell (pessoais) | sim | sim | ferramenta "Presets prontos" (overlay reusa `Presets`) | ✅ #66 |
| Presets pessoais | — | ✅ PresetsShell | sim | sim | catálogo `presets` | já ✅ |
| Favoritos | GradeItens | ✅ aba favoritos | sim | sim | catálogo | já ✅ |
| Busca/recentes/novos/desbloqueios | GradeItens filtros | ✅ filtroAba | sim | sim | catálogo | já ✅ |
| Comparação | atual×salvo | ✅ hold-V / "Original" | sim | sim | palco | já ✅ |
| Export PNG | (sem no 2D) | ✅ capturarPalco | sim | sim | palco | já ✅ |
| 3D entry | Estudio3D (aba 3d) | ✅ Palco3d + ferramenta | sim | sim | ferramenta estudio3d | já ✅ |
| Progressão/Evolução | (dentro de conquistas) | ✅ Evolucao/Missoes/Timeline | sim | sim | ferramentas do shell | já ✅ |
| **Coleções** | `Colecoes` (aba colecoes) | ❌ ausente | sim | sim | ferramenta `colecoes` → overlay `Colecoes` | ✅ #66 |
| **Conquistas** (+ Minha Vitrine, Temporadas) | `Conquistas` (aba conquistas) | ❌ ausente | sim | sim | ferramenta `conquistas` → overlay `Conquistas` | ✅ #66 |
| **Criar com IA** | `CriarIA` (aba ia) | ❌ ausente | sim | sim | ferramenta `ia` → overlay `CriarIA` (vida.iaDisponivel) | ✅ #66 |
| **Vitrine** | `Vitrine` (aba vitrine) | ❌ ausente | sim | sim | ferramenta `vitrine` → overlay `Vitrine` | ✅ #66 |
| **Minha Vitrine** | embed em `Conquistas` | ❌ ausente | sim | sim | dentro do overlay Conquistas | ✅ #66 |
| **Histórico** (servidor/reativar) | `Historico` (aba historico) | ⚠️ só sessão (Equipados/§619) | sim | sim | ferramenta `historico_srv` → overlay `Historico` | ✅ #66 |
| **Foto / Photo Studio** | `Foto` (aba foto) | ❌ ausente (só capturarPalco) | sim | sim | ferramenta `foto` → overlay `Foto` (salva → confirmarPersistencia) | ✅ #66 |
| **Arquétipos** | `Arquetipos` (aba arquetipo) | ❌ ausente | sim | sim | ferramenta `arquetipos` → overlay `Arquetipos` | ✅ #66 |
| **Títulos** (picker) | `Titulos` (aba titulo) | ⚠️ só selo no palco | sim | sim | ferramenta `titulos` → overlay `Titulos` | ✅ #66 |
| Temporadas | dentro de `Conquistas` | ❌ ausente | sim | sim | dentro do overlay Conquistas | ✅ #66 |
| QA / dev | — | ✅ QaStudio/Telemetria/CmsRo | não (dev) | sim | DEV/QA (as6.qa_route) | já ✅ (§37) |

## Como foi feito (§5/§12 — reuso, não duplicação, sem novo shell)
`shell/Ferramentas2D.tsx` (sub-componente do shell, NÃO um shell novo; renomeado
de `FerramentasClassicas.tsx` na V4.3 FINAL / §12 — o arquivo entregue é
`Ferramentas2D.tsx`) lazy-roteia os componentes `components/*` EXISTENTES num
overlay modal, alimentando
`config` do store e aplicando pelo mesmo adaptador `aoAplicar → aplicarComando`
(o mesmo padrão de Consultor/Evolucao/VersoesAvatar). Foto/Histórico salvam
internamente e reportam a versão → `store.confirmarPersistencia` + `espelhar619`.
`vida`/`vidaCarregando` passam do App.tsx (que já os carrega) para o shell.
Ferramentas gated por `as6.single_2d` (flag OFF = produção byte-idêntica).

## Prova
`v43-single2d-parity.mjs` (na suíte): as 9 ferramentas abrem DENTRO do shell, com
conteúdo, sem sair; flag OFF = ausentes. Board `12_V43_SINGLE2D_E2E.png`.

## DoD do Track A (§26)
- [x] sem troca user-facing para Classic (V4.2 gating + §26 no E2E)
- [x] todas as features mantidas têm destino no shell
- [x] nenhum recurso relevante inacessível
- [x] "Classic Premium" fora do branding (presets → Boardroom/Off-duty/Neon/Gala; coleção → Coleção Premium; premium-bar aria → Estilo)
- [x] Candidate representa o V4 (FLAGS_CANDIDATE += single_2d/hero_2d/fit_v2)
- [x] footwear focus funciona (Calçados → zoom no baixo-corpo/pés)
- [x] Legacy compatível (single_2d OFF = experiência atual; save/load intocado)
- [x] QA testa fallback clássico (as6.qa_route → "Compat clássico")

Status: **SINGLE_2D_READY_FOR_HUMAN_REVIEW** (validação visual/sessão = Jhony).
