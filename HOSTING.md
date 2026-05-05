# Hosting Guide (Vercel + Render + Supabase + R2)

## 1) Backend on Render

- Create a new **Web Service** from this repo.
- Render can auto-detect settings from `render.yaml` in repo root.
- Ensure service uses `rootDir: backend`.

Set these required environment variables in Render:

- `DATABASE_URL` (Supabase pooled connection string)
- `DIRECT_URL` (Supabase direct connection string)
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID` (if using Google login)
- `CORS_ORIGIN` (your Vercel frontend URL)
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_PUBLIC_URL`

After first successful deploy, run migration:

```bash
npx prisma migrate deploy
```

## 2) Frontend on Vercel

- Import this repo as a Vercel project.
- Set **Root Directory** to `frontend`.
- Add environment variables:
  - `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com`
  - `NEXT_PUBLIC_APP_URL=https://<your-vercel-project>.vercel.app`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same-google-client-id>`

Deploy and copy the Vercel URL.

## 3) Final Wiring

- Update Render `CORS_ORIGIN` with the exact Vercel domain (or comma-separated domains).
- Redeploy backend.
- Verify login, event CRUD, and uploads.

## 4) Local env templates

- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`
