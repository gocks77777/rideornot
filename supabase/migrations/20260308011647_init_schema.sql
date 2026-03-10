-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id TEXT UNIQUE,
  nickname TEXT,
  avatar_url TEXT,
  manner_score FLOAT DEFAULT 36.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create parties table
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_point TEXT,
  end_point TEXT,
  start_lat FLOAT,
  start_lng FLOAT,
  end_lat FLOAT,
  end_lng FLOAT,
  departure_time TIMESTAMPTZ,
  current_member INT DEFAULT 1,
  max_member INT,
  status TEXT CHECK (status IN ('recruiting', 'closed')),
  gender_filter TEXT CHECK (gender_filter IN ('any', 'same'))
);

-- Create party_members table
CREATE TABLE party_members (
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('joined', 'paid')),
  PRIMARY KEY (party_id, user_id)
);
