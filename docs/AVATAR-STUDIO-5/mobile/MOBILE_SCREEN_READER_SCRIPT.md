# Track C Mobile — Roteiro VoiceOver (iOS) / TalkBack (Android)

Executar no device real (kit). Frases esperadas são aproximadas (variam por SO/idioma).

## Ordem de navegação esperada (swipe →)
1. Cabeçalho/logo "Avatar Studio"
2. Ações do header (idioma, aleatório, mudo, desfazer, refazer, ajuda) — cada uma anunciada por nome (aria-label)
3. Palco (imagem do avatar) / seletor de enquadramento (Auto/Rosto/Busto/Corpo)
4. Navegação "Categorias" (landmark/nav) → cada categoria anuncia NOME + estado ("selecionado" na ativa via aria-current)
5. Catálogo: abas de filtro, busca ("campo de busca"), botão "Filtros", grade de assets (cada card: nome + estado equipado)
6. Barra de salvar: botão "Salvar" (e estado pendente/salvo)

## Verificações
- [ ] Categoria ativa anuncia "selecionado" (aria-current="true")
- [ ] Abrir ferramenta: anuncia "diálogo" (role=dialog, aria-modal); foco entra
- [ ] Dentro do diálogo: título é lido; botão "Fechar" nomeado
- [ ] Fechar: foco RETORNA ao controle de origem (não "salta" para o topo)
- [ ] Salvar: transição pendente→salvo perceptível; erro (se houver) anunciado
- [ ] Nenhum controle sem nome ("botão" sem rótulo)
- [ ] Ícones decorativos ignorados (aria-hidden)

## aria-live (pendente de device)
Anúncios de "salvando/salvo/erro" via região aria-live devem ser confirmados no
leitor real — o smoke automatizado cobre presença de rótulos/roles, não a fala.
