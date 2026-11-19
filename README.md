# 🌟 Reino da Tabuada Mágica

Jogo educativo em português (pt-BR) para praticar a tabuada no 3º ano do Ensino Fundamental, com aventura, corrida, minijogos, mascotes para colecionar e um reino-desafio para alunos de altas habilidades.

**Jogue:** https://beltraoluis.github.io/GamesEduReinoTabuada/

É uma aplicação estática feita com React 19, Vite e Tailwind CSS 4. Não tem servidor, conta de usuário nem chave de API. O progresso fica salvo no próprio navegador.

## O que tem no jogo

### Modos de jogo
- **Corrida dos 5 reinos:** cada reino trabalha uma tabuada com uma estratégia (o dobro, o triplo, o truque do 9, tabuada do 10). Em cada fase o aluno escolhe entre 3 pistas, tem 3 vidas e 5 segundos por pergunta. Uma explicação mostra como chegar ao resultado depois de cada erro.
- **Festa dos Balões:** estourar os balões com a resposta certa.
- **Caldeirão Mágico:** preparar poções somando frascos iguais (multiplicação como soma repetida).
- **Laboratório Visual:** matrizes de figurinhas para ver a multiplicação como linhas e colunas.
- **Torre dos Mestres 🗼:** desafio que só abre depois de concluir os 5 reinos e pagar 5.000 gemas (uma vez). São 24 multiplicações diretas em 3 fases, com fatores de 2 a 50, resposta **digitada** e 1, 2 e 3 minutos por questão nas fases 1, 2 e 3, respectivamente. A recompensa é uma medalha (bronze, prata ou ouro) e um título no certificado. A Torre não dá estrelas nem gemas e não interfere nos demais reinos.

### Progressão e recompensas
- **Estrelas** liberam os reinos em ordem. **Gemas** compram mascotes e acessórios.
- Os ganhos de gemas dependem da **dificuldade da pergunta**, da **velocidade da resposta** e do **reino**. Cada erro ou tempo esgotado reduz em 10% as gemas da rodada. Os minijogos pagam menos que a corrida e têm teto por partida.
- Os itens mais caros (Coroa e o mascote Gatito) exigem concluir todos os 5 reinos.
- **Camarim do Mascote:** 5 mascotes e 5 acessórios (chapéus, óculos, flor). **Conquistas** e **certificado** imprimível.

### Cuidados com o público infantil
- Nenhum dado sai do aparelho: sem cadastro, sem anúncios, sem rastreamento e sem fontes externas.
- O campo de nome bloqueia palavrões em português, inglês, alemão e italiano, e mostra uma mensagem gentil.
- Interface com alvos de toque grandes, rótulos para leitores de tela e leitura das perguntas em voz alta (opcional).
- Política de segurança de conteúdo (CSP) no build de produção.

## Desenvolvimento

Instale o [Bun](https://bun.sh/) e execute:

```sh
bun install
bun run dev
```

Abra `http://localhost:3000/GamesEduReinoTabuada/` (o servidor de desenvolvimento escuta só em `localhost`; use `bun run dev:lan` para acessar de outro aparelho da rede).

### Comandos

| Comando | O que faz |
|---|---|
| `bun run dev` | Servidor de desenvolvimento com recarga automática |
| `bun run gen:challenge` | Regenera o catálogo versionado de rotas do desafio |
| `bun run gen:challenge --check` | Confere se o catálogo corresponde ao gerador |
| `bun run lint` | Verificação de tipos (TypeScript) |
| `bun run test` | Testes com Vitest |
| `bun run build` | Build de produção em `dist/` |
| `bun run check:bundle` | Mede o JavaScript inicial/total e aplica limites gzip de 105/150 KiB |
| `bun run preview` | Serve o build de produção localmente |

### Atalhos de teste (só no servidor de desenvolvimento)
No Camarim do Mascote, salvar o nome:
- `yoda` libera todos os mascotes, acessórios e a Torre dos Mestres;
- `reset` volta o jogo ao estado original.

Esses atalhos não existem no build de produção: o código é removido do pacote.

## Estrutura do projeto

```
src/
  App.tsx                 navegação entre telas e estado do progresso
  components/             telas e jogos (GameRunner, BalloonPopGame, PotionCauldronGame,
                          ChallengeRealm, MascotWardrobe, WorldSelect, ...)
  services/
    mathEngine.ts         reinos e geração das perguntas da corrida
    rewards.ts            cálculo de gemas (dificuldade, velocidade, penalidade de 10%)
    challengeEngine.ts    seleção de rota, explicações e pontuação da Torre
    challengeConfig.ts    fases, tempo, vidas e preço da Torre
    progress.ts           validação do save, compras e trava por reinos concluídos
    profanity.ts          filtro de palavrões (PT, EN, DE, IT)
    gameData.ts           mascotes, acessórios, preços e progresso padrão
    sound.ts              sons, música e leitura em voz alta
  assets/                 ilustrações em SVG (mascotes e acessórios)
scripts/
  generate-challenge-routes.ts  geração reproduzível do catálogo da Torre
  check-bundle.ts               medição e limites do JavaScript de produção
```

As rotas progressivas da Torre são geradas por `scripts/generate-challenge-routes.ts` e verificadas no CI. O tempo e o preço estão em `src/services/challengeConfig.ts`. Os preços e o ritmo de ganho de gemas dos demais modos estão em `src/services/gameData.ts` e `src/services/rewards.ts`; a calibração é documentada nos testes de `rewards.test.ts`.

## Publicação no GitHub Pages

O deploy usa GitHub Actions: a cada push na `main`, o workflow instala as dependências com Bun, executa lint, testes, build e a checagem de tamanho do JavaScript, e publica `dist/` no Pages. Acompanhe na aba **Actions**. Também é possível iniciar manualmente pelo botão **Run workflow**.

Na primeira vez, em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.

O Vite usa `/GamesEduReinoTabuada/` como caminho base. Para hospedar em outro caminho, defina a variável no build:

```sh
VITE_BASE=/ bun run build
```

Não é preciso criar nenhum arquivo `.env`.

### Modo offline

O build gera um service worker (`dist/sw.js`, criado por `scripts/vite-plugins.ts`) que guarda o jogo inteiro (todos os modos, fontes e ícones) na primeira visita. Depois disso o jogo abre sem internet e pode ser instalado como aplicativo pelo navegador (`public/manifest.webmanifest`). O progresso continua salvo no `localStorage` do aparelho.

Uma versão nova é baixada em segundo plano e passa a valer quando todas as abas ou janelas do jogo forem fechadas e abertas de novo. O service worker só é registrado no build de produção; o `bun run dev` não usa cache offline.

## Licença

Copyright © 2026 Luis Henrique Coutinho Beltrao.

Este programa é software livre: distribuído sob a **GNU Affero General Public License, versão 3** (`AGPL-3.0-only`). Veja o texto completo em [LICENSE](LICENSE).

A AGPL exige que quem disponibiliza o jogo a outras pessoas, inclusive pela rede, ofereça o código-fonte correspondente. O rodapé do jogo traz o link **Código-fonte desta versão**, que no deploy aponta para o commit publicado (`GITHUB_REPOSITORY`/`GITHUB_SHA`). Fora do Actions o link usa o commit local (`git rev-parse HEAD`); quem publicar um fork deve definir `VITE_SOURCE_URL` com o endereço do próprio código:

```sh
VITE_SOURCE_URL=https://example.org/meu-fork bun run build
```

O build também publica `LICENSE.txt` e `THIRD-PARTY-NOTICES.txt` com as licenças das dependências incluídas no jogo (React, React DOM e o reset de CSS do Tailwind: MIT; canvas-confetti e Lucide: ISC; fontes Fredoka e Nunito: SIL OFL 1.1).

As ilustrações em SVG de `src/assets/` foram geradas com auxílio de inteligência artificial e são distribuídas sob a mesma licença, na medida em que forem protegidas por direito autoral.

Versões publicadas antes desta mudança continuam disponíveis sob a licença MIT em que foram distribuídas.
