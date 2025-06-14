
-- Supabase Trigger Function Definition for: public.handle_new_user
-- This function should be triggered AFTER INSERT ON auth.users FOR EACH ROW.

-- Ensure you have a table named 'public.users' with at least these columns:
-- auth_id UUID (REFERENCES auth.users(id) ON DELETE CASCADE if desired)
-- email TEXT
-- name TEXT
-- role TEXT

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Allows the function to operate with higher privileges, necessary for accessing auth.users data
SET search_path = public -- Sets the search path for unqualified object names
AS $$
BEGIN
  -- Insert a new row into public.users
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (
    NEW.id,                         -- The id of the new user from auth.users
    NEW.email,                      -- The email of the new user from auth.users
    NEW.raw_user_meta_data->>'name', -- Extracts the 'name' field from the raw_user_meta_data JSON,
                                    -- assumes 'name' was passed in the options.data during supabase.auth.signUp
    'customer'                      -- Sets a default role for the new user. Change 'customer' as needed.
  );
  RETURN NEW; -- The  return value for an AFTER trigger is ignored, but it's good practice.
END;
$$;

-- After creating or replacing this function in your Supabase SQL editor,
-- you need to create the trigger itself (if it doesn't exist or you want to re-create it).
-- You can do this in the Supabase Dashboard under Database > Triggers,
-- or by running the following SQL:

/*
-- First, drop the existing trigger if you are updating it.
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
*/

-- Notes:
-- 1. Adjust 'customer' to your desired default role (e.g., 'user').
-- 2. Ensure the 'name' field in `NEW.raw_user_meta_data->>'name'` matches what you provide
--    in the `options: { data: { name: 'User Name' } }` during `supabase.auth.signUp`.
-- 3. If your `public.users.name` column has a NOT NULL constraint, ensure a name is always provided during sign-up
--    or modify this function to handle NULL names (e.g., provide a default name or allow NULL in the table).
-- 4. The `SECURITY DEFINER` clause is often necessary for trigger functions that need to access
--    data in schemas like `auth` that the calling user might not have direct permission for.
--    Use with caution and ensure the function logic is secure.
    