# Jastip Moncha (Next.js + Neon)

Single-page jastip tracker: customer info, shipping, multi-item orders, and profit summary (matches your Excel logic).

## Local setup

```bash
cd jastip-web
cp .env.example .env.local   # paste your Neon DATABASE_URL
npm install
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this folder to GitHub (do **not** commit `.env.local`).
2. Import the repo in [Vercel](https://vercel.com).
3. Set environment variable **`DATABASE_URL`** to your Neon connection string (pooler URL recommended).
4. Deploy. After first deploy, run **`npm run db:init`** locally once (or run the SQL in `scripts/init-db.mjs` in the Neon SQL editor).

## Stack

- Next.js App Router
- Neon Postgres (`@neondatabase/serverless`)
- Tailwind CSS
