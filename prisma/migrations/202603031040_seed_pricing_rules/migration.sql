-- Seed the pricing catalog used by billing enforcement and align legacy
-- bootstrap subscriptions with the Starter plan.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- If an older "free" bootstrap plan exists and Starter does not, convert that
-- row in place so existing subscriptions retain their plan reference.
UPDATE public."SubscriptionPlan"
SET
  "name" = 'Starter',
  "code" = 'starter',
  "maxEmployees" = 10,
  "maxDevices" = 1,
  "priceMonthly" = 2900,
  "features" = '{"attendance":true,"kiosk":true}'::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'free'
  AND NOT EXISTS (
    SELECT 1
    FROM public."SubscriptionPlan"
    WHERE "code" = 'starter'
  );

INSERT INTO public."SubscriptionPlan" (
  "id",
  "name",
  "code",
  "maxEmployees",
  "maxDevices",
  "priceMonthly",
  "features",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    gen_random_uuid(),
    'Starter',
    'starter',
    10,
    1,
    2900,
    '{"attendance":true,"kiosk":true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'Growth',
    'growth',
    50,
    3,
    9900,
    '{"attendance":true,"kiosk":true,"shifts":true,"payroll":true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'Pro',
    'pro',
    200,
    10,
    24900,
    '{"attendance":true,"kiosk":true,"shifts":true,"payroll":true,"prioritySupport":true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'Enterprise',
    'enterprise',
    1000000,
    10000,
    0,
    '{"attendance":true,"kiosk":true,"shifts":true,"payroll":true,"prioritySupport":true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "maxEmployees" = EXCLUDED."maxEmployees",
  "maxDevices" = EXCLUDED."maxDevices",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "features" = EXCLUDED."features",
  "updatedAt" = CURRENT_TIMESTAMP;

-- If both legacy free and starter exist, move subscriptions onto starter so the
-- runtime plan logic is consistent.
UPDATE public."OrganizationSubscription" os
SET
  "planId" = starter."id",
  "updatedAt" = CURRENT_TIMESTAMP
FROM public."SubscriptionPlan" starter
JOIN public."SubscriptionPlan" legacy
  ON legacy."code" = 'free'
WHERE starter."code" = 'starter'
  AND os."planId" = legacy."id";

DELETE FROM public."SubscriptionPlan"
WHERE "code" = 'free'
  AND NOT EXISTS (
    SELECT 1
    FROM public."OrganizationSubscription" os
    WHERE os."planId" = public."SubscriptionPlan"."id"
  );
