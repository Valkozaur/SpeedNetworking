# Speed Networking Categories

Mobile-first speed networking game where participants scan each other after
conversations, self-submit category claims, and admins approve final results.

## Local Development

```bash
cp .env.example .env.local
npm install
docker compose up -d db
DATABASE_URL=postgresql://speed_networking:speed_networking@localhost:5433/speed_networking npm run db:migrate
npm run dev
```

Open `http://localhost:3001/admin/new` and create a room.

## Dokploy Deployment

1. Create a Docker Compose application in Dokploy using this repository.
2. Set `NEXT_PUBLIC_APP_URL` to your HTTPS domain, for example
   `https://networking.example.com`.
3. Keep the default internal `DATABASE_URL` from `docker-compose.yml`, or
   replace it with an external Postgres connection string.
4. Attach the custom domain to the `app` service on port `3000`.

Run migrations before starting the app:

```bash
docker compose run --rm migrate
docker compose up -d app
```

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
