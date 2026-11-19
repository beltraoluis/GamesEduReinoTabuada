# Changelog

Todas as mudanças notáveis neste projeto são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

### Added
- Modo offline: um service worker gerado no build (`scripts/vite-plugins.ts`) guarda o jogo inteiro na primeira visita, com cache próprio por endereço de publicação e sem mascarar erros 404, e o manifesto com ícones permite instalar o jogo como aplicativo.
- Rodapé com os links "Código-fonte desta versão" (commit publicado; em build local, o `origin` no HEAD com aviso se houver mudanças sem commit; ou `VITE_SOURCE_URL`) e "Licenças", e build publicando `LICENSE.txt` e `THIRD-PARTY-NOTICES.txt` com as licenças das dependências incluídas no build (inclusive o reset de CSS do Tailwind).

### Changed
- Licença do projeto alterada de MIT para GNU AGPL v3 (`AGPL-3.0-only`) em `LICENSE`, `package.json` e `README.md`.
- Fonte Nunito trocada pela versão variável (`@fontsource-variable/nunito`): um único arquivo de 39 kB substitui os quatro pesos (66 kB) baixados ao abrir o jogo.
- Os balões e portais passaram a se mover sem renderizar a tela inteira a cada quadro, e o contador da corrida só é atualizado quando o segundo exibido muda.
- Com a preferência por movimento reduzido, as animações decorativas param em todas as telas e nenhum confete é disparado; balões, corrida e caldeirão também cancelam os temporizadores ao sair.
- A música pausa quando a aba fica oculta e volta quando ela é reaberta, se estiver ligada.
- A checagem de tamanho do build (`check:bundle`) também mede o CSS e as fontes latinas.
- O workflow de deploy também roda em pull requests (lint, testes, build e `check:bundle`), sem publicar.

### Fixed
- O rodapé de licença não aparece no certificado impresso.
- Enter e Espaço na tela inicial só iniciam a aventura quando nenhum botão ou link está em foco, para não atropelar a ativação pelo teclado.

## [2026-11-17]

### Added
- Teclado do desafio com ações para limpar a resposta e alternar a digitação de dígitos da esquerda para a direita; o modo ativo tem indicação visual.
- Catálogo versionado e gerador reproduzível de rotas do desafio (`scripts/generate-challenge-routes.ts`).
- Verificação do tamanho do JavaScript inicial e total no build de deploy (`scripts/check-bundle.ts`), com limites de gzip.
- Automação do changelog para agentes de IA (Claude Code, Codex, Gemini CLI e Copilot): skill `update-changelog` e hook de fim de turno que cobram o registro em `[Unreleased]`.
- Fechamento automático do changelog a cada merge na `main` (`changelog-release.yml` e `bun run changelog:release`): `[Unreleased]` vira uma seção datada por meio de um PR `changelog/release`.

### Changed
- Torre dos Mestres agora usa rotas progressivas de multiplicação com fatores de 2 a 50, custa 5.000 gemas e oferece 1, 2 e 3 minutos por questão nas fases 1, 2 e 3.
- Uma resposta que expira encerra a tentativa imediatamente, independentemente das vidas restantes. Sair do desafio pela confirmação também contabiliza uma tentativa.
- Telas secundárias são carregadas sob demanda, e as animações do camarim usam CSS em vez da dependência Motion.

### Fixed
- Separado o cálculo de medalhas (`challengeMedal.ts`) do catálogo de questões para evitar carregar as rotas do desafio no JavaScript inicial.
- Adicionada recuperação limitada para falhas de carregamento de chunks após uma atualização da aplicação.

## [2026-11-13]

### Added
- **Estrutura inicial do jogo (`413bb08`):** projeto React + Vite + Tailwind CSS do *Reino da Tabuada Mágica*, com seleção de 5 reinos na corrida da tabuada, Festa dos Balões, Caldeirão Mágico, Laboratório Visual, camarim de mascotes/acessórios, conquistas, certificado e efeitos sonoros/narração em voz alta.
- **Torre dos Mestres (`97263bb`):** reino de desafio extra desbloqueado após concluir os 5 reinos e pagar gemas uma única vez, com 24 desafios de resposta digitada divididos em 3 fases com chefões, 3 vidas, explicações pedagógicas, medalhas (bronze, prata e ouro) e títulos no certificado, sem interferir nas estrelas e gemas dos demais reinos.
- **Sistema de recompensas e economia da loja (`7381394`, `2886650`, `485b8a2`, `5f15332`, `7050644`):**
  - Cálculo de gemas por resposta correta escalando com dificuldade da pergunta, velocidade de resposta e multiplicador do reino, com penalidade de 10% por erro ou tempo esgotado (`rewards.ts`).
  - Limite de ganhos por sessão nos modos livres (Festa dos Balões e Caldeirão Mágico) e detalhamento das gemas ganhas nas telas de resultado.
  - Trava de conclusão de todos os 5 reinos da corrida para desbloquear o mascote Gatito e o acessório Coroa, além do rebalanceamento geral de preços da loja (Flor e Boné a 80 gemas, Coroa a 1.000 gemas, Gatito a 1.550 gemas).
- **Ilustrações e novos visuais no camarim (`0effdc9`, `71652b8`, `7050644`):**
  - Ilustrações em SVG para os rostos dos mascotes Pip (`pip.svg`) e Dino (`dino.svg`).
  - Substituição dos fones de ouvido por óculos de sol em SVG (`sunglasses.svg`, com migração de ID legado) e ajustes individuais de posicionamento/escala para boné e flor.
  - Padronização dos cartões e botões de ação do camarim (`WardrobeItemCard` e `WardrobeActionButton`) com altura uniforme de 44px, estados visuais consistentes e rótulos de acessibilidade (`aria-label`).
- **Filtro de palavras impróprias (`eb1929a`):** bloqueio multilíngue (PT, EN, DE, IT) no nome do jogador com normalização de acentos, *leetspeak*, separadores e caracteres confusos, mensagem amigável para crianças, higienização de nomes salvos e mais de 900 testes de regressão.
- **Atalhos exclusivos de desenvolvimento (`ef102c9`, `94c0899`):** nomes especiais `yoda` (desbloqueia todos os mascotes, acessórios e a Torre dos Mestres) e `reset` (restaura o estado original do jogo), ativos apenas em ambiente de desenvolvimento (`import.meta.env.DEV`) e removidos do bundle de produção.
- **Deploy, CI e documentação (`3b3e98f`, `9642ca6`):** workflow de publicação no GitHub Pages (lint, testes, build e deploy), configuração de base path no Vite, suíte de testes com Vitest, visão geral no `README.md` e licença MIT (`LICENSE`).

### Changed
- **Segurança e privacidade (`85b68a5`, `e45520e`):**
  - Fontes auto-hospedadas (`@fontsource/fredoka` e `@fontsource/nunito`) sem requisições externas ao Google Fonts, além de política de segurança de conteúdo (CSP) e `no-referrer` no build.
  - Actions do GitHub fixadas por SHA, permissões de Pages/OIDC restritas ao job de deploy e configuração do Dependabot.
  - Validação e sanitização rigorosas do progresso salvo no `localStorage` (`progress.ts`), acesso seguro ao armazenamento no `SoundManager` e preferência por vozes locais na síntese de fala para evitar envio do nome do jogador a serviços de rede.
  - Servidor de desenvolvimento restrito a `localhost` por padrão (com script `dev:lan` separado para rede local).

### Fixed
- **Geração de questões (`3b3e98f`):** embaralhamento Fisher-Yates com opções distintas e sem repetição imediata de perguntas.
- **Pergunta final da corrida (`7381394`):** errar ou deixar o tempo acabar na 7ª questão agora permite tentar novamente a pergunta (sem bônus de velocidade) em vez de entrar em loop para o fim de jogo.
- **Chapéu de mago e posicionamento de chapéus (`b38ffdd`):** substituição do emoji de mago pela ilustração `wizard-hat.svg` centralizada sobre a cabeça dos mascotes em todos os tamanhos.
- **Ícone de cadeado no camarim (`5d6de0b`):** ocultado o ícone de cadeado nos botões de itens do camarim que já podem ser comprados.
- **Caldeirão Mágico (`5233e38`):** estrelas decorativas movidas para baixo do cabeçalho para não sobrepor a interface.
- **Estabilidade dos testes no CI (`9c86501`):** aumento do timeout para 60s nas simulações pesadas do motor de desafios da Torre dos Mestres no Vitest.
