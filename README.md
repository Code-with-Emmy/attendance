# Office Attendance Kiosk (Admin + Face Identification)

Next.js app with:
- Admin-only dashboard/login
- Employee records (no employee passwords)
- Kiosk clock in/out using liveness + face identification (1:N)

## Features

- Public kiosk page at `/attendance`
- Admin employee management at `/admin/enroll`
  - Add employee profile (`name`, `email`, `phone`, `department`, `title`, `bio`)
  - Enroll/delete employee face embedding
- Admin attendance history at `/admin/history`
- Privacy: embeddings only, no raw photos stored in DB

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase Auth (admin login only)
- Prisma + Postgres
- face-api.js in browser
- Zod validation + in-memory rate limiting

## Environment

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` (pooled runtime URL)
- `DIRECT_URL` (direct DB URL for migrations)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` (comma-separated admin emails)

## Install

```bash
npm install
```

## Face Models

Download models into `public/models`:

```bash
npm run models:download
```

Required files:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

## Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

## Run

```bash
npm run dev
```

## Routes

UI:
- `/` admin login
- `/attendance` office kiosk (no employee login)
- `/admin/enroll` admin employee management + face enrollment
- `/admin/history` admin attendance history

API:
- `GET /api/me`
- `PUT /api/me`
- `GET /api/admin/employees`
- `POST /api/admin/employees`
- `PUT /api/admin/employees/:id`
- `DELETE /api/admin/employees/:id`
- `POST /api/admin/employees/:id/face`
- `DELETE /api/admin/employees/:id/face`
- `GET /api/admin/history`
- `POST /api/kiosk/clock` body: `{ type: "CLOCK_IN" | "CLOCK_OUT", embedding: number[] }`

## Notes

- Kiosk mode uses face identification (1:N) by design.
- If face is not recognized, API returns: `Face not recognized. Try again.`
- If liveness fails, clock action is blocked.
