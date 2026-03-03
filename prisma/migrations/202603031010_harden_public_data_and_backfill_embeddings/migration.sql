-- Harden exposed public tables for Supabase/PostgREST-style deployments and
-- backfill new structures from legacy data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Temporarily lift FORCE so migration data updates are not blocked if the
-- executing role is subject to RLS.
ALTER TABLE public."Device" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."EmployeeFaceEmbedding" NO FORCE ROW LEVEL SECURITY;

-- Existing kiosk tokens were historically stored in plaintext. Convert all
-- existing rows to SHA-256 so the database only stores token hashes.
UPDATE public."Device"
SET "token" = encode(digest("token", 'sha256'), 'hex');

-- Backfill vector rows for employees that only have the legacy JSON embedding.
INSERT INTO public."EmployeeFaceEmbedding" (
  "id",
  "employeeId",
  "organizationId",
  "embedding",
  "createdAt"
)
SELECT
  gen_random_uuid(),
  e."id",
  e."organizationId",
  (
    '[' || string_agg(face_item.value, ',' ORDER BY face_item.ordinality) || ']'
  )::vector,
  COALESCE(e."faceEnrolledAt", e."createdAt")
FROM public."Employee" e
JOIN LATERAL jsonb_array_elements_text(
  COALESCE(e."faceEmbedding"::jsonb, '[]'::jsonb)
) WITH ORDINALITY AS face_item(value, ordinality) ON TRUE
WHERE e."faceEmbedding" IS NOT NULL
  AND jsonb_typeof(e."faceEmbedding"::jsonb) = 'array'
  AND jsonb_array_length(e."faceEmbedding"::jsonb) = 128
  AND NOT EXISTS (
    SELECT 1
    FROM public."EmployeeFaceEmbedding" efe
    WHERE efe."employeeId" = e."id"
  )
GROUP BY e."id", e."organizationId", e."faceEnrolledAt", e."createdAt";

-- Keep all flagged public tables backend-only. The app already accesses them
-- through Next.js API routes + Prisma, so no client-side table access is needed.
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."OrganizationSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrganizationSubscription" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."PayPeriod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PayPeriod" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."Shift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Shift" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."ShiftOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShiftOverride" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."AttendanceViolation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AttendanceViolation" FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."Organization" FROM anon, authenticated;
REVOKE ALL ON TABLE public."OrganizationSubscription" FROM anon, authenticated;
REVOKE ALL ON TABLE public."PayPeriod" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Shift" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ShiftOverride" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AttendanceViolation" FROM anon, authenticated;

ALTER TABLE public."Device" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."EmployeeFaceEmbedding" FORCE ROW LEVEL SECURITY;
