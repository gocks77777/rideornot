/*
  # Uni-Ride Taxi Sharing Schema

  ## Summary
  Creates the core database schema for a hyper-local taxi sharing platform for university students.

  ## 1. New Tables
    
    ### profiles
    - id (uuid, primary key) - References auth.users
    - name (text) - Student name
    - phone (text) - Contact number
    - university (text) - University name
    - created_at (timestamptz) - Account creation timestamp
    - updated_at (timestamptz) - Last update timestamp
    
    ### pods
    - id (uuid, primary key) - Unique pod identifier
    - creator_id (uuid) - References profiles(id)
    - departure (text) - Departure location
    - destination (text) - Destination location
    - max_members (integer) - Maximum number of members (default 4)
    - current_members (integer) - Current number of members (default 1)
    - departure_time (timestamptz) - Scheduled departure time
    - status (text) - Pod status: recruiting, full, departed, cancelled
    - created_at (timestamptz) - Pod creation timestamp
    - updated_at (timestamptz) - Last update timestamp
    
    ### pod_members
    - id (uuid, primary key) - Unique membership identifier
    - pod_id (uuid) - References pods(id)
    - user_id (uuid) - References profiles(id)
    - joined_at (timestamptz) - Join timestamp

  ## 2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, update only their own
    - Pods: Anyone can read active pods, creators can update/delete their own
    - Pod Members: Users can join pods, view members, leave pods they joined

  ## 3. Important Notes
    - All timestamps use timestamptz for timezone awareness
    - Cascade deletes ensure data integrity
    - Indexes on foreign keys for performance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  university text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pods table
CREATE TABLE IF NOT EXISTS pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  departure text NOT NULL,
  destination text NOT NULL,
  max_members integer DEFAULT 4 NOT NULL,
  current_members integer DEFAULT 1 NOT NULL,
  departure_time timestamptz NOT NULL,
  status text DEFAULT 'recruiting' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('recruiting', 'full', 'departed', 'cancelled')),
  CONSTRAINT valid_members CHECK (current_members <= max_members AND current_members > 0)
);

-- Create pod_members table
CREATE TABLE IF NOT EXISTS pod_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid REFERENCES pods(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(pod_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pods_creator ON pods(creator_id);
CREATE INDEX IF NOT EXISTS idx_pods_status ON pods(status);
CREATE INDEX IF NOT EXISTS idx_pods_departure_time ON pods(departure_time);
CREATE INDEX IF NOT EXISTS idx_pod_members_pod ON pod_members(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_members_user ON pod_members(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Pods policies
CREATE POLICY "Anyone can read active pods"
  ON pods FOR SELECT
  TO authenticated
  USING (status IN ('recruiting', 'full'));

CREATE POLICY "Authenticated users can create pods"
  ON pods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own pods"
  ON pods FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own pods"
  ON pods FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Pod members policies
CREATE POLICY "Anyone can read pod members"
  ON pod_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join pods"
  ON pod_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave pods"
  ON pod_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);