# Documento de Especificação de Projeto (PRD)
## Sistema de Gestão e Votação — Clube do Livro

**Versão:** 2.7  
**Status:** Em planejamento

---

## 1. Visão geral

Sistema web para automatizar a operação de um clube do livro: eliminar trabalho manual da curadora, coibir fraudes em votações, validar indicações de livros por tema e engajar os membros com gamificação e dados literários.

**Princípio central:** custo de infraestrutura zero (ou próximo disso), usando exclusivamente serviços com camadas gratuitas generosas.

---

## 2. Objetivos

- **Segurança na votação:** impedir votos duplicados e autovoto (membro não vota no próprio livro).
- **Curadoria assistida por IA:** gerar um parecer semântico (score + opinião do LLM na zona cinza) sobre se o livro indicado corresponde ao tema do mês, para apoiar a decisão da curadora — sem que ela precise ler a sinopse manualmente, mas com decisão final sempre humana.
- **Prevenção de duplicidade:** bloquear indicações repetidas do mesmo livro na mesma rodada.
- **Cadastro self-service:** membros criam a própria conta e já têm acesso imediato; sem aprovação manual.
- **Engajamento:** gamificação com streaks, badges e perfil literário; painel de dados do grupo.

---

## 3. Stack técnica

| Camada | Tecnologia | Hospedagem gratuita |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend | FastAPI (Python) | Render / Koyeb |
| Banco de dados | PostgreSQL + pgvector | Neon ou Supabase |
| Autenticação | Supabase Auth (Google OAuth apenas) | Supabase |
| Embeddings | nomic-embed-text (Ollama local) ou API Nomic | Gratuito |
| LLM fallback | Gemini 2.0 Flash (Google AI Studio) ou Qwen 2.5 (Groq) | Gratuito |
| Metadados de livros | BrasilAPI (ISBN nacional) + Google Books API (fallback) | Gratuito |
| Email transacional | Supabase SMTP embutido (limite: 4/hora) ou Resend (3k/mês) | Gratuito |

---

## 4. Arquitetura e fluxo de dados

```
[ Frontend React ]
       |  REST (JWT)
       v
[ Backend FastAPI ]
       |
       |----[ Supabase Auth ]  — valida identidade (Google OAuth)
       |----[ PostgreSQL + pgvector ]  — dados, embeddings, votos
       |----[ BrasilAPI / Google Books ]  — metadados do livro
       |----[ Embedding API ]  — gera vetor da sinopse
       |----[ Gemini Flash / Qwen ]  — fallback semântico (zona cinza)
```

---

## 5. Fluxo de autenticação e cadastro

O Supabase gerencia identidade. O backend mantém a tabela `members` sincronizada via webhook do Supabase Auth.

**Decisão (v2.1):** login exclusivamente via Google OAuth — o fluxo de e-mail + senha / magic link foi removido. Motivo: o SMTP embutido do Supabase tem limite de 4 envios/hora, o que travava o cadastro em picos de adesão; com Google OAuth o handshake inteiro acontece do lado do Google, sem envio de e-mail de confirmação pelo Supabase, então esse gargalo deixa de existir.

```
[ Membro acessa o sistema ]
         |
         v
    Google OAuth
         |
         v
  Conta criada — status: "active"
  (acesso imediato, sem aprovação manual)
         |
         v
 Membro pode sugerir livros e votar
```

**Identificador único:** o `sub` (subject ID) retornado pelo Google no token OAuth vira o `supabase_uid` na tabela `members` — não exige mudança de schema.

**Proteção antifraude:** criar múltiplas contas Google reais é bem mais custoso do que gerar e-mails descartáveis (o próprio Google já aplica suas barreiras de verificação em contas suspeitas), então a barreira contra votos duplicados sobe sem esforço de implementação extra. Não é uma garantia absoluta, mas é proporcional ao risco real de um clube pequeno e majoritariamente formado por conhecidos. A coluna `status` na tabela `members` permanece no modelo de dados para permitir que a curadora bloqueie um membro específico (`blocked`) caso necessário.

---

## 6. Fluxo de validação semântica de indicações

**Decisão (v2.4):** a IA nunca aprova nem recusa uma indicação sozinha — ela gera um **parecer** (score + opinião do LLM, quando aplicável) que vai pro painel do admin. A curadora decide todas as indicações. Isso evita a fricção de um membro ter sua indicação recusada por uma decisão automática, especialmente em temas mais abertos a interpretação ("um livro épico", "leitura de verão").

A abordagem híbrida da v2.0 é mantida como economia de chamada de IA — só que agora ela dosa **quanto de parecer** a curadora recebe, não decide sozinha:

```
[ Membro sugere livro ]
         |
         v
[ Google Books API ] — busca sinopse e metadados
         |
         v
[ Gera embedding da sinopse ]
         |
         v
[ Busca vetorial (pgvector) ]
  compara com livros de referência do tema
         |
   +-----|-----+----------+
   |           |          |
Score > 0.75  0.50–0.75  Score < 0.50
   |      (zona cinza)    |
   v           |          v
Parecer:       v       Parecer:
"forte match"  |       "match fraco"
   |      [ LLM ]          |
   |     Gemini/Qwen       |
   |    prompt: "SIM        |
   |    ou NÃO? + por quê"  |
   |           |            |
   +-----------+------------+
               |
               v
   nomination.status = 'pending'
   (score + opinião do LLM anexados como parecer)
               |
               v
   [ Painel do administrador ]
   curadora aprova ou recusa
   (com justificativa, se recusar)
```

**Cadastro do tema:** a curadora define o tema e cadastra 3–4 livros exemplares. O sistema gera os embeddings das sinopses como referência.

---

## 7. Fluxo de check-in de presença

Gap identificado na v2.0: a tabela `attendances` existia no modelo de dados, mas nenhum fluxo populava o campo `attended`. Mecanismo definido: **QR Code self-service + override manual da curadora**.

```
[ Curadora abre o encontro no painel ]
         |
         v
[ Sistema gera QR Code único da rodada ]
  (token com expiração — válido só na janela do encontro)
         |
         v
[ Membro escaneia o QR Code no local ]
         |
         v
[ Endpoint /checkin valida token + round_id + user_id ]
         |
         v
  attendances.attended = true
  attendances.checked_in_at = now()
         |
         v
[ Curadora pode revisar/ajustar manualmente após o encontro ]
  (override: marcar presença de quem não conseguiu escanear,
   ou remover presença indevida)
```

**Por que esse desenho:** self-service reduz o trabalho manual da curadora no dia a dia (objetivo central do projeto), e o override cobre exceções (celular sem internet, esqueceu de escanear, etc.) sem exigir aprovação prévia de ninguém. O token com expiração evita que alguém escaneie o QR Code fora da janela do encontro.

**Uso downstream:** esse check-in alimenta tanto os streaks/badges de presença (seção 10) quanto o peso de voto por presença (seção 8).

---

## 8. Regras de negócio

### Votação
- 1 voto por membro por rodada (chave única `user_id + rodada_id` no banco).
- Membro não pode votar no livro que ele mesmo indicou (validado no endpoint de voto).
- Rodada tem prazo de abertura e fechamento configurável pela curadora.

### Peso de voto por presença
- Voto de quem fez check-in no encontro anterior (`attendances.attended = true` na rodada imediatamente anterior) vale **peso 1.3**; demais votos valem peso 1.0.
- Peso reduzido (1.3 em vez de, por exemplo, 2x) é intencional: recompensa quem participa presencialmente sem deixar a mecânica dominar o resultado e incentivar voto em bloco ("panelinha") entre quem frequenta os encontros.
- Peso é **visível ao membro** no momento do voto e no resultado (ex.: "seu voto vale 1.3x por ter ido ao último encontro"), para evitar sensação de manipulação.
- Apuração passa a ser soma de pesos por indicação, não contagem simples de votos.

### Critério de desempate
1. Se a soma de pesos empatar entre duas ou mais indicações, desempata quem teve mais votos vindos de membros presentes no encontro anterior (contagem de votantes elegíveis ao peso 1.3, não a soma de pesos em si).
2. Persistindo o empate, sorteio — disparado manualmente pela curadora no painel do administrador.

### Indicações
- 1 indicação por membro por rodada.
- Sistema verifica duplicidade por ISBN ou similaridade de título antes de aceitar.
- Livro recusado pela curadora notifica o membro com a justificativa informada.
- **Bloqueio de livros já lidos:** antes da validação semântica, o sistema compara título/ISBN da indicação com o histórico de livros vencedores de rodadas anteriores (`rounds.winning_nomination_id`); havendo correspondência, a indicação é recusada automaticamente com a justificativa "livro já lido pelo clube".
- **Fallback sem ISBN/metadados:** quando BrasilAPI e Google Books não retornam resultado para o livro, a indicação fica com status `pending_metadata` até a curadora preencher manualmente título, autor, sinopse e capa no painel do administrador; a partir daí segue o fluxo normal de validação semântica (seção 6).

### Roles
- `member`: pode sugerir, votar, ver resultados, ver próprio perfil.
- `admin`: tudo acima + gerenciar rodadas, bloquear membros se necessário, ver painel analytics.

---

## 9. Painel do Administrador (curadora)

Área exclusiva para role `admin`, consolidando ações operacionais que hoje apareciam dispersas nas demais seções.

**Gestão de rodadas**
- Criar rodada: tema, descrição, 3–4 livros de referência (embeddings gerados automaticamente), data e local do encontro, prazos de abertura/fechamento.
- Editar ou encerrar rodada manualmente.
- Aprovar ou recusar cada indicação, com o parecer semântico (score + opinião do LLM, quando houver) como apoio — decisão final é sempre da curadora.
- Preencher metadados manualmente para indicações em `pending_metadata` (fallback sem ISBN).
- Disparar sorteio de desempate quando os critérios da seção 8 não resolverem.

**Gestão de membros**
- Listar membros ativos.
- Bloquear/desbloquear membro (`status = blocked`).

**Encontro presencial**
- Gerar QR Code de check-in da rodada corrente.
- Acompanhar check-ins em tempo real.
- Override manual de presença (marcar/desmarcar), incluindo **marcação em lote** — cobre encontros online/híbridos (Meet, Discord) onde quem participa remoto não consegue escanear o próprio QR Code.

**Analytics**
- Painel de dados do grupo — gêneros, países, autores, placar anual (detalhado na seção 11 — Gamificação).

---

## 10. Modelo de dados (entidades principais)

```sql
-- Membros
members (
  id uuid PK,
  supabase_uid text UNIQUE,   -- ID do Supabase Auth (sub do Google OAuth)
  name text,
  email text UNIQUE,          -- vem da conta Google
  avatar_url text,
  role text DEFAULT 'member', -- 'member' | 'admin'
  status text DEFAULT 'active',  -- 'active' | 'blocked'
  joined_at timestamptz
)

-- Rodadas mensais
rounds (
  id uuid PK,
  theme_name text,
  theme_description text,
  month_year text,            -- ex: "2025-06"
  voting_opens_at timestamptz,
  voting_closes_at timestamptz,
  meeting_date timestamptz,   -- data/hora do encontro presencial
  meeting_location text,      -- local do encontro
  winning_nomination_id uuid FK,  -- preenchido ao fechar a rodada; usado no bloqueio de livros já lidos
  status text                 -- 'open_suggestions' | 'voting' | 'closed'
)

-- Livros de referência do tema
theme_references (
  id uuid PK,
  round_id uuid FK,
  title text,
  synopsis text,
  embedding vector(768)
)

-- Indicações de livros
nominations (
  id uuid PK,
  round_id uuid FK,
  user_id uuid FK,
  title text,
  author text,
  isbn text,
  cover_url text,
  synopsis text,
  embedding vector(768),
  validation_score float,
  llm_opinion text,           -- opinião do LLM na zona cinza (parte do parecer, quando gerada)
  rejection_reason text,      -- motivo informado pela curadora caso status = 'rejected'
  status text                 -- 'approved' | 'pending' (aguardando curadora) | 'rejected' | 'pending_metadata' | 'rejected_already_read'
)

-- Votos
votes (
  id uuid PK,
  round_id uuid FK,
  nomination_id uuid FK,
  user_id uuid FK,
  weight numeric DEFAULT 1.0,  -- 1.3 se o membro fez check-in na rodada anterior
  voted_at timestamptz,
  UNIQUE (user_id, round_id)  -- 1 voto por membro por rodada
)

-- Presenças nos encontros
attendances (
  id uuid PK,
  round_id uuid FK,
  user_id uuid FK,
  attended boolean DEFAULT false,
  checked_in_at timestamptz,      -- preenchido no check-in via QR Code
  checkin_method text             -- 'qrcode' | 'manual' (override da curadora)
)

-- Status de leitura do membro por rodada
reading_status (
  id uuid PK,
  round_id uuid FK,
  user_id uuid FK,
  status text,                 -- 'not_started' | 'reading' | 'finished' | 'dnf'
  updated_at timestamptz,
  UNIQUE (user_id, round_id)
)

-- Badges conquistados
badges (
  id uuid PK,
  user_id uuid FK,
  badge_type text,            -- ver seção de gamificação
  earned_at timestamptz,
  round_id uuid FK            -- rodada que gerou o badge (opcional)
)

-- Resenhas (resenha relâmpago / badge "Crítico ferrenho")
reviews (
  id uuid PK,
  round_id uuid FK,
  user_id uuid FK,
  content text,
  created_at timestamptz,
  UNIQUE (user_id, round_id)
)

-- Apostas do Preditor
predictions (
  id uuid PK,
  round_id uuid FK,
  user_id uuid FK,
  nomination_id uuid FK,
  created_at timestamptz,
  UNIQUE (user_id, round_id)
)
```

---

## 11. Gamificação

### Streaks e presença
- Sequência de encontros participados consecutivamente (calculada na tabela `attendances`).
- Exibida no perfil do membro como bolinhas preenchidas/vazias por mês.

### Badges automáticos
| Badge | Critério |
|---|---|
| Indicação vencedora | Livro indicado pelo membro ganhou a votação |
| N meses seguidos | Streak de 3, 6, 12 encontros |
| Primeiro a votar | 1º voto registrado na rodada |
| Crítico ferrenho | Escreveu resenha em X rodadas seguidas |
| 10 livros lidos | Participou de 10 rodadas com presença confirmada |
| Volta ao mundo | Grupo leu livros de 10+ países diferentes |
| Fora da caixa | Indicou livro incomum que venceu mesmo assim |

### Mecânicas adicionais
- **Preditor:** antes do fechamento da votação, membro aposta qual livro vai ganhar. Acerto gera pontos.
- **Resenha relâmpago:** membro escreve 3 linhas após o encontro; quem mais escreveu no mês ganha pontos.
- **Compatibilidade literária:** cada membro tem um "vetor de gosto" — o centróide dos embeddings dos livros que indicou, votou ou marcou como lido (`reading_status = 'finished'`). Compatibilidade entre dois membros = similaridade de cosseno entre os centróides. Exibe os **top 5 membros mais próximos** de cada um (ex.: "seus 5 parceiros literários: Maria (87%), ..."), não só o mais próximo; compatibilidade com o clube = similaridade contra o centróide de todos os membros ("você é o leitor mais próximo do perfil do clube"). Só exibir pra membro com um mínimo de atividade (ex.: 3+ livros contabilizados), pra evitar centróide ruidoso de quem está começando agora. **Nota técnica:** centróide é `AVG(embedding)` agregado no Postgres; usar o operador `<=>` do pgvector (distância de cosseno) na comparação, ou normalizar os vetores (norma euclidiana = 1) antes de salvar, pra não distorcer a similaridade.
- **Mapa literário:** mapa interativo marcando países de origem de todos os livros já lidos pelo grupo (dados de nacionalidade via Google Books / Open Library).
- **Placar anual:** ranking de quem mais votou, mais indicou e mais acertou o vencedor no ano.

### Perfil literário
Gerado automaticamente a partir dos embeddings e metadados dos livros votados/lidos: gêneros favoritos, países mais lidos, autores recorrentes. Visualizado em barras no perfil do membro.

### Retrospectiva anual

Gerada uma vez por ano (dezembro/janeiro), no estilo das retrospectivas de apps de música. Exibe dois recortes: o do grupo e o individual de cada membro.

**Dados do grupo:**
- Total de livros lidos e páginas consumidas no ano
- Quantidade de gêneros e países diferentes explorados
- Membros ativos no ano
- Livro mais votado e livro mais polêmico (maior divisão de votos)
- Autor e gênero mais frequentes

**Dados individuais (por membro):**
- Encontros que participou e percentual de presença
- Quantidade de livros votados, indicados e resenhas escritas
- Mapa de presença mês a mês (bolinhas cheias/vazias)
- Melhor sequência de encontros do ano
- Gêneros e países favoritos (baseado nos votos)
- Lista completa dos livros lidos com destaque para indicações vencedoras
- Badges conquistados no ano

**Implementação:** todos os dados já existem no banco ao longo do ano — a retrospectiva é uma query agregada, sem nenhum dado novo a coletar. O endpoint `/retrospectiva/{ano}` retorna o JSON completo; o frontend renderiza como uma página scrollável e visualmente destacada, com botão de compartilhamento (imagem gerada via `html2canvas` ou link público da página).

---

## 12. Roadmap de implementação

### Fase 1 — Fundação
1. Configurar monorepo (ver seção 14).
2. Modelar banco no Neon/Supabase, habilitar `pgvector`.
3. Autenticação: Google OAuth via Supabase Auth, middleware de `status` no FastAPI.
4. CRUD de membros (acesso imediato, sem painel de aprovação).

### Fase 2 — Ciclo de votação
5. CRUD de rodadas e indicações, incluindo data/local do encontro.
6. Integração BrasilAPI + Google Books para metadados automáticos, com status `pending_metadata` e fallback manual pela curadora.
7. Pipeline de embedding + busca vetorial (parecer semântico) + bloqueio de livros já lidos (checagem contra `rounds.winning_nomination_id`).
8. Fallback LLM (Gemini Flash / Qwen via Groq) para gerar opinião na zona cinza, como parte do parecer.
9. Check-in de presença: geração de QR Code por rodada + endpoint de check-in + tela de override manual para a curadora.
10. Endpoint de votação com todas as regras de negócio: peso 1.3x por presença e critério de desempate (votos de presentes → sorteio).
11. Painel do administrador (frontend): gestão de rodadas, bloqueio de membro, geração de QR Code, fila de aprovação de indicações com parecer semântico, disparo de sorteio.
12. Status de leitura do membro por rodada (endpoint + tela simples de atualização).

### Fase 3 — Engajamento
13. Gamificação: streaks, badges automáticos, preditor, resenha.
14. Perfil literário por membro.
15. Compatibilidade literária: cálculo de centróide por membro e similaridade de cosseno (par a par e contra o clube).
16. Painel analytics do grupo (gêneros, países, autores, placar anual).
17. Mapa literário interativo.
18. Retrospectiva anual (endpoint agregado + página de compartilhamento).

### Fase 4 — Polimento
19. Notificações (abertura de votação, resultado).
20. Mecanismo de recomendação (RRF sobre embeddings de rodadas anteriores).
21. PWA para acesso mobile sem instalar app.

---

## 13. Infraestrutura e custos estimados

| Serviço | Uso | Custo |
|---|---|---|
| Vercel | Frontend React | Gratuito |
| Render / Koyeb | Backend FastAPI | Gratuito (sleep por inatividade) |
| Neon / Supabase | PostgreSQL + pgvector | Gratuito |
| Supabase Auth | Google OAuth | Gratuito |
| Google AI Studio | Gemini 2.0 Flash | Gratuito (1M tokens/dia) |
| Groq | Qwen 2.5 (fallback) | Gratuito |
| Google Books API | Metadados | Gratuito |
| Resend | Emails transacionais (opcional) | Gratuito (3k/mês) |
| **Total esperado** | | **R$ 0** |

> Possível custo de ~R$ 10–15/mês se o backend no Render despertar com frequência e a equipe optar por eliminar a latência de cold start.

---

## 14. Organização dos repositórios

Ver README para estrutura detalhada de pastas.

**Estratégia recomendada: monorepo.**

```
book-club/
├── apps/
│   ├── web/          # React + Vite (frontend)
│   └── api/          # FastAPI (backend)
├── packages/
│   └── shared/       # tipos e schemas compartilhados (opcional)
├── docs/             # PRD, ADRs, diagramas
└── infra/            # configurações de deploy (render.yaml, vercel.json)
```
