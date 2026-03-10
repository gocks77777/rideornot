-- 1. Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, kakao_id, nickname, avatar_url, manner_score, created_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'provider_id',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '운전자'),
    NEW.raw_user_meta_data->>'avatar_url',
    36.5,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that calls the function whenever a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill existing users (since you already logged in before this trigger existed)
INSERT INTO public.users (id, kakao_id, nickname, avatar_url, manner_score, created_at)
SELECT 
  id,
  raw_user_meta_data->>'provider_id',
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '운전자'),
  raw_user_meta_data->>'avatar_url',
  36.5,
  now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
