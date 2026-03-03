-- Lock down highly sensitive tables so they are backend-only.
-- This is intended for Supabase/PostgREST environments where public schema tables
-- may otherwise be exposed to client roles.

ALTER TABLE public."Device" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Device" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."EmployeeFaceEmbedding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmployeeFaceEmbedding" FORCE ROW LEVEL SECURITY;

-- No client-facing RLS policies are created on purpose.
-- With RLS enabled and no policies, client roles cannot read or mutate rows.

REVOKE ALL ON TABLE public."Device" FROM anon, authenticated;
REVOKE ALL ON TABLE public."EmployeeFaceEmbedding" FROM anon, authenticated;
