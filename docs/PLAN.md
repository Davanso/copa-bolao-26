# Plano do App Bolao da Copa 2026

## Visao geral

A ideia e criar um app simples, responsivo e divertido para um bolao da Copa do Mundo 2026. O app deve funcionar bem no celular, ter cadastro rapido, permitir palpites de placar dos jogos, mostrar os jogos em ordem cronologica, exibir ranking de usuarios e incluir uma experiencia de jogo ao vivo com placar/status em tempo quase real.

O projeto e casual, feito para brincar com amigos, sem vendas, pagamentos ou apostas com dinheiro.

## Stack recomendada

### Frontend

- React
- Vite
- TypeScript
- MUI
- React Router
- TanStack Query
- Axios ou `fetch`

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- bcrypt para hash de senha
- JWT para sessao
- Zod para validacao de payloads

### Deploy

- Frontend: Vercel ou Netlify
- Backend: Render, Railway ou Fly.io
- Banco: Neon ou Supabase Postgres

## MVP

O MVP deve focar no fluxo principal do bolao:

1. Cadastro/login com `username` e `password`.
2. Lista de jogos ordenada por data e horario.
3. Palpite de placar por jogo.
4. Edicao de palpite apenas antes do inicio do jogo.
5. Ranking de usuarios por pontos.
6. Tela admin simples para inserir resultados reais.
7. Recalculo de pontos quando um resultado for salvo.
8. Tela Ao Vivo com jogos em andamento, placar atual, minuto/status e atualizacao periodica.
9. Badge `Ao vivo` na lista de jogos quando uma partida estiver acontecendo.
10. Criacao de grupos de bolao para convidar amigos por codigo ou link.

## Navegacao principal

- Jogos
- Ao Vivo
- Meus Palpites
- Ranking
- Grupos
- Perfil/Login
- Admin

No celular, a navegacao pode usar `BottomNavigation` do MUI. No desktop, pode virar uma topbar ou menu lateral simples.

## Regra de pontuacao

Regra inicial recomendada:

- 3 pontos: acertou o placar exato.
- 1 ponto: acertou o vencedor ou acertou que seria empate, mas errou o placar.
- 0 pontos: errou o resultado.

Exemplo: se o resultado real foi `Brasil 2 x 1 Franca`:

- Palpite `2 x 1`: 3 pontos.
- Palpite `1 x 0`, `3 x 1` ou `4 x 2`: 1 ponto.
- Palpite `1 x 1` ou `0 x 2`: 0 pontos.

## Regras de palpite

- Cada usuario pode ter apenas um palpite por jogo.
- O usuario pode criar ou editar um palpite ate o horario de inicio do jogo.
- Depois que o jogo comecar, o palpite fica bloqueado.
- O backend deve validar essa regra, mesmo que o frontend tambem esconda/desabilite os controles.

## Modelo de dados

### `users`

Campos sugeridos:

- `id`
- `username`
- `password_hash`
- `role`
- `created_at`

Observacoes:

- `username` deve ser unico.
- `role` pode ser `user` ou `admin`.

### `games`

Campos sugeridos:

- `id`
- `external_id`
- `team_home`
- `team_away`
- `starts_at`
- `stage`
- `group_name`
- `score_home`
- `score_away`
- `status`
- `live_minute`
- `last_live_sync_at`

Observacoes:

- `external_id` e opcional e serve para mapear o jogo com uma API externa de placar ao vivo.
- `status` pode ser algo como `scheduled`, `live`, `finished`, `postponed`.

### `guesses`

Campos sugeridos:

- `id`
- `user_id`
- `game_id`
- `guess_home`
- `guess_away`
- `points`
- `created_at`
- `updated_at`

Observacoes:

- Deve existir uma constraint unica para `user_id + game_id`.
- `points` pode ficar `null` ate o resultado oficial ser salvo.

### `groups`

Campos sugeridos:

- `id`
- `name`
- `description`
- `owner_user_id`
- `invite_code`
- `created_at`

Observacoes:

- `owner_user_id` indica quem criou o grupo.
- `invite_code` deve ser unico e facil de compartilhar.
- No MVP, o grupo pode usar os mesmos jogos e palpites globais, mudando apenas o ranking exibido para os membros daquele grupo.

### `group_members`

Campos sugeridos:

- `id`
- `group_id`
- `user_id`
- `role`
- `joined_at`

Observacoes:

- Deve existir uma constraint unica para `group_id + user_id`.
- `role` pode ser `owner`, `admin` ou `member`.

## Backend MVP

Endpoints sugeridos:

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`

### Jogos

- `GET /games`
- `GET /games/:id`

A listagem deve vir ordenada por `starts_at`, com filtros opcionais por fase, status ou selecao.

### Palpites

- `GET /guesses/me`
- `POST /games/:gameId/guess`
- `PUT /games/:gameId/guess`

O backend deve bloquear criacao/edicao de palpite apos o horario de inicio do jogo.

### Ranking

- `GET /ranking`
- `GET /groups/:groupId/ranking`

O ranking pode ser calculado por query agregada sobre `guesses`, somando pontos e contando acertos. No MVP, nao e necessario duplicar total de pontos na tabela de usuarios.

Para ranking de grupo, a query deve considerar apenas usuarios presentes em `group_members`.

### Grupos

- `POST /groups`
- `GET /groups/me`
- `GET /groups/:groupId`
- `POST /groups/join`
- `POST /groups/:groupId/invite-code/regenerate`
- `DELETE /groups/:groupId/members/:userId`

Regras sugeridas:

- Qualquer usuario autenticado pode criar um grupo.
- Ao criar um grupo, o usuario vira `owner` automaticamente.
- Amigos entram usando um `invite_code` ou link com codigo.
- Apenas `owner` ou `admin` do grupo pode remover membros ou gerar novo codigo de convite.
- No MVP, os palpites continuam sendo por usuario e jogo; o grupo apenas filtra ranking e comparacoes entre amigos.

### Ao Vivo

- `GET /live-games`

Esse endpoint deve retornar jogos em andamento com placar atual, minuto/status e eventos basicos quando disponiveis.

A recomendacao e que o backend consulte uma API externa, normalize a resposta e aplique cache de 30 a 60 segundos.

### Admin

- `POST /admin/games/:gameId/result`
- `PUT /admin/games/:gameId/result`

Ao salvar o resultado de um jogo, o backend deve recalcular os pontos de todos os palpites daquele jogo.

## Frontend MVP

### Tela Login/Registro

- Alternancia simples entre login e cadastro.
- Campos para username e senha.
- Feedback de erro para usuario ja existente, senha invalida ou credenciais erradas.

### Tela Jogos

- Lista compacta, ordenada por data.
- Cards ou linhas com times, horario, fase e status.
- Inputs de placar para o usuario registrar palpite.
- Botao salvar/editar palpite.
- Badge `Ao vivo` quando aplicavel.
- Placar atual quando o jogo estiver em andamento.

### Tela Ao Vivo

- Lista de jogos em andamento.
- Placar atual em destaque.
- Minuto/status do jogo.
- Atualizacao periodica via polling.
- Estado vazio quando nao houver jogos ao vivo.

### Tela Meus Palpites

- Resumo dos palpites do usuario.
- Pontos obtidos por jogo.
- Indicacao de jogos pendentes, ao vivo e finalizados.

### Tela Ranking

- Top 3 em destaque.
- Lista/tabela dos demais usuarios.
- Pontos totais.
- Total de placares exatos.
- Total de palpites pontuados.

### Tela Grupos

- Lista dos grupos dos quais o usuario participa.
- Acao para criar novo grupo.
- Campo para entrar em grupo usando codigo de convite.
- Tela de detalhe do grupo com membros, codigo/link de convite e ranking do grupo.
- Acao para copiar link de convite.
- Controles simples para o dono remover membros ou gerar novo codigo.

### Tela Admin

- Lista de jogos.
- Inputs para placar final.
- Acao para salvar resultado.
- Feedback apos recalculo de pontos.

## Placar ao vivo

A UI deve ter uma area dedicada a jogos ao vivo e tambem refletir esse estado na lista geral de jogos.

Fluxo recomendado:

1. O frontend chama `GET /live-games`.
2. O backend consulta o provider externo.
3. O backend normaliza a resposta.
4. O backend aplica cache de 30 a 60 segundos.
5. O frontend atualiza a tela por polling.

O frontend nao deve chamar diretamente a API externa. Isso evita expor chaves, facilita cache e permite trocar de provider sem mexer na UI.

## APIs gratuitas para placar ao vivo

### SofaScore API nao oficial

Melhor opcao para um app casual.

Pontos positivos:

- Nao exige chave obrigatoria em muitos endpoints conhecidos.
- Boa cobertura de futebol ao vivo.
- Costuma ter placar, status, minuto e eventos.
- Otima para prototipos e projetos sem custo.

Pontos de atencao:

- Nao e API oficial publica com contrato estavel.
- Pode mudar sem aviso.
- Nao tem SLA ou suporte formal.
- E importante consultar os termos antes de publicar algo mais serio.

Recomendacao: usar apenas por tras do backend, com cache e provider isolado.

### Football-Data.org

Opcao mais oficial, com plano gratuito e API key.

Pontos positivos:

- API documentada.
- Mais previsivel que uma API nao oficial.
- Boa para calendario, times e competicoes populares.

Pontos de atencao:

- Free tier limitado.
- Cobertura de Copa do Mundo/live score pode nao ser ideal.
- Pode ter atraso ou limites baixos para uma tela ao vivo.

### API-Football / API-Sports via RapidAPI

Opcao com boa cobertura e documentacao.

Pontos positivos:

- Cobertura ampla.
- Documentacao clara.
- Boa chance de suportar competicoes FIFA.

Pontos de atencao:

- Free tier costuma ser muito limitado para live score.
- Pode exigir plano pago rapidamente.
- Depende de chave e limites da plataforma.

### Decisao recomendada

Criar uma abstracao no backend, por exemplo `LiveScoreProvider`, e comecar com SofaScore para uso casual. Se o projeto crescer ou precisar de estabilidade maior, trocar ou adicionar Football-Data.org/API-Football como provider alternativo.

## Estrutura de pastas sugerida

```txt
apps/
  web/
    src/
      components/
      pages/
      routes/
      services/
      hooks/
  api/
    src/
      db/
      modules/
        auth/
        games/
        guesses/
        groups/
        ranking/
        live-score/
      shared/
        auth/
        validation/
        errors/
docs/
  PLAN.md
```

## Arquivos relevantes planejados

- `package.json`: scripts da raiz ou workspace.
- `apps/web`: frontend React/Vite/MUI.
- `apps/api`: backend Express.
- `apps/api/src/db`: migrations, conexao e seed de jogos.
- `apps/api/src/modules/auth`: registro, login, JWT e hash de senha.
- `apps/api/src/modules/games`: listagem de jogos e admin de resultados.
- `apps/api/src/modules/guesses`: criacao/edicao de palpites e calculo de pontos.
- `apps/api/src/modules/groups`: criacao de grupos, convites, membros e ranking por grupo.
- `apps/api/src/modules/ranking`: consulta agregada do ranking.
- `apps/api/src/modules/live-score`: provider de API externa, normalizacao de dados, cache e endpoint de jogos ao vivo.

## Ideias extras para depois do MVP

- Filtro por selecao, fase e status.
- Favoritar uma selecao para destacar jogos.
- Grupos privados com logo, descricao e permissao para admins auxiliares.
- Badges: placar cravado, rodada perfeita, maior subida no ranking.
- Estatisticas: palpites mais comuns, percentual por vencedor, aproveitamento por fase.
- Ranking por fase da Copa.
- Historico de mudancas de posicao no ranking.
- Importacao/atualizacao de calendario por seed versionado ou API externa.

## Verificacao

Antes de considerar o MVP pronto:

1. Rodar lint/typecheck do frontend e backend.
2. Testar registro e login.
3. Testar listagem dos jogos.
4. Testar salvar e editar palpite antes do inicio do jogo.
5. Testar bloqueio de palpite apos o inicio do jogo.
6. Testar admin salvando resultado e recalculando pontos.
7. Testar ranking com pelo menos 3 usuarios e palpites diferentes.
8. Testar criacao de grupo, entrada por codigo de convite e ranking filtrado por membros.
9. Testar tela Ao Vivo com mock de jogo em andamento.
10. Testar tela Ao Vivo com resposta real da API escolhida.
11. Verificar cache do backend para evitar chamadas excessivas ao provider externo.
12. Validar layout em viewport mobile e desktop.
13. Testar deploy com variaveis de ambiente reais e CORS configurado.

## Decisoes iniciais

- Usar TypeScript no frontend e backend.
- Usar PostgreSQL por causa do relacionamento natural entre usuarios, jogos, palpites e ranking.
- Calcular ranking por query no MVP.
- Incluir grupos no MVP, mantendo palpites globais e ranking filtrado por membros do grupo.
- Usar auth simples com username/senha, bcrypt e JWT.
- Implementar placar ao vivo por provider isolado no backend.
- Iniciar com SofaScore apenas se aceitarmos o risco de ser uma API nao oficial.
- Evitar dinheiro, pagamentos ou mecanicas de aposta real.

## Pontos a decidir depois

1. Backend proprio ou Supabase.
2. Provider final para placar ao vivo.
3. Se os jogos da Copa serao cadastrados por seed manual ou importados de API.
4. Onde o app sera hospedado.
5. Se grupos terao apenas ranking proprio ou tambem regras/pontuacao customizadas no futuro.
