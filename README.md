# Reino da Tabuada Mágica

Jogo educativo em português para praticar a tabuada no 3º ano do Ensino Fundamental. Inclui aventuras, corrida, balões, poções, laboratório visual, mascotes e conquistas. O progresso fica salvo no navegador.

Aplicação estática feita com React 19, Vite e Tailwind CSS 4, sem servidor de aplicação ou chave de API.

## Desenvolvimento

Instale o [Bun](https://bun.sh/) e execute:

```sh
bun install
bun run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:3000/GamesEduReinoTabuada/`.

## Verificação e build

```sh
bun run lint
bun run test
bun run build
bun run preview
```

O lint verifica os tipos com TypeScript; os testes usam Vitest. O build gera a pasta `dist/`, e o preview permite conferir a versão de produção localmente.

## Publicação no GitHub Pages

Site: https://beltraoluis.github.io/GamesEduReinoTabuada/

O deploy usa GitHub Actions: o workflow instala as dependências com Bun, executa as verificações e o build, envia `dist/` como artefato do Pages e publica o site. Acompanhe o resultado na aba **Actions** do repositório.

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. Após enviar as alterações à branch configurada no workflow, aguarde a conclusão do deploy; também é possível iniciar manualmente se o workflow disponibilizar essa opção.

O Vite usa `/GamesEduReinoTabuada/` como caminho base para os arquivos publicados. Para hospedar em outro caminho, defina a variável no comando de build, por exemplo:

```sh
VITE_BASE=/ bun run build
```

Não é necessário criar um arquivo `.env` para executar ou publicar o jogo.
