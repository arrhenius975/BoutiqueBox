
-- Function to insert a new user into public.users table and set default role
-- This function is intended to be called by a trigger after a new user signs up in auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Allows the function to run with the permissions of the user who defined it (usually a superuser or admin)
SET search_path = public -- Ensures the function looks for tables in the public schema
AS $$
BEGIN
  -- Insert the new user's auth ID, email, name (from metadata provided during sign-up),
  -- and set a default role into the public.users table.
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (
    NEW.id,                                 -- The user's ID from auth.users
    NEW.email,                              -- The user's email from auth.users
    NEW.raw_user_meta_data->>'name',        -- The 'name' field from the metadata passed during supabase.auth.signUp
    'customer'                              -- Default role for new users
  );
  RETURN NEW; -- The 'NEW' record refers to the row being inserted into auth.users
END;
$$;

-- Example of how to create the trigger in Supabase SQL Editor:
-- (Ensure you have a 'public.users' table with 'auth_id', 'email', 'name', and 'role' columns)

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Optional: Drop if it exists to recreate

-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Make sure the 'users' table in the 'public' schema has the following columns at a minimum:
-- auth_id UUID NOT NULL UNIQUE (references auth.users(id) ON DELETE CASCADE is good practice)
-- email TEXT NOT NULL UNIQUE
-- name TEXT
-- role TEXT NOT NULL DEFAULT 'customer' (or whatever your default role is)
-- created_at TIMESTAMPTZ DEFAULT now()
-- updated_at TIMESTAMPTZ DEFAULT now()

-- If your 'name' column in 'public.users' has a NOT NULL constraint,
-- ensure 'name' is always provided during signup.
-- If 'role' column has a NOT NULL constraint, ensure it has a DEFAULT value in the table definition
-- OR that this trigger explicitly sets it (as done above with 'customer').
