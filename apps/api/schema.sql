-- Ativar extensão do pgvector para buscas semânticas
CREATE EXTENSION IF NOT EXISTS vector;

-- Membros
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_uid text UNIQUE,
  name text,
  email text UNIQUE,
  avatar_url text,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  joined_at timestamptz DEFAULT now()
);

-- Rodadas mensais
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name text,
  theme_description text,
  month_year text,
  voting_opens_at timestamptz,
  voting_closes_at timestamptz,
  meeting_date timestamptz,
  meeting_location text,
  winning_nomination_id uuid, -- Será atualizado ao fechar a rodada
  status text DEFAULT 'open_suggestions' -- 'open_suggestions' | 'voting' | 'closed'
);

-- Livros de referência do tema
CREATE TABLE IF NOT EXISTS theme_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  title text,
  synopsis text,
  embedding vector(768)
);

-- Indicações de livros
CREATE TABLE IF NOT EXISTS nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  title text,
  author text,
  isbn text,
  cover_url text,
  synopsis text,
  embedding vector(768),
  validation_score float,
  llm_opinion text,
  rejection_reason text,
  status text DEFAULT 'pending' -- 'approved' | 'pending' | 'rejected' | 'pending_metadata' | 'rejected_already_read'
);

-- Atualiza FK de winning_nomination_id agora que nominations existe
ALTER TABLE rounds ADD CONSTRAINT fk_winning_nomination FOREIGN KEY (winning_nomination_id) REFERENCES nominations(id) ON DELETE SET NULL;

-- Votos
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  nomination_id uuid REFERENCES nominations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  weight numeric DEFAULT 1.0,
  voted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, round_id)
);

-- Presenças nos encontros
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  attended boolean DEFAULT false,
  checked_in_at timestamptz,
  checkin_method text,
  UNIQUE (user_id, round_id)
);

-- Status de leitura do membro por rodada
CREATE TABLE IF NOT EXISTS reading_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  status text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, round_id)
);

-- Badges conquistados
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  badge_type text,
  earned_at timestamptz DEFAULT now(),
  round_id uuid REFERENCES rounds(id) ON DELETE SET NULL
);

-- Resenhas
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, round_id)
);

-- Apostas do Preditor
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES rounds(id) ON DELETE CASCADE,
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  nomination_id uuid REFERENCES nominations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, round_id)
);
