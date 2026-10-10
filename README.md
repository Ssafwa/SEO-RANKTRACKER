# SEO Rank Pilot

SEO audits and keyword rank tracking with a React/Vite client and Express API.

## Local development

1. Install dependencies in `server/` and `client/`.
2. Configure server environment variables using `server/.env.example`.
3. Set `VITE_BACKEND_URL` in the client environment to the API URL (for local development, `http://localhost:5000`).
4. Run the API with `cd server && npm start`, then run the client with `cd client && npm run dev`.

## Rank tracking

Rank checks use Browserbase to read Google search results. Successful results are cached for 24 hours, and scheduled checks run sequentially with a delay. A blocked Google check is reported as “Google blocked this check, try again later”; there is no Serper or Google CSE fallback.

Browserbase proxies are optional and may incur charges. They are disabled by default; set `BROWSERBASE_USE_PROXY=true` only when the Browserbase account supports proxy access. Configure `CRON_SECRET` to authorize the daily Vercel rank-check cron.

## Deployment

The Vercel configuration is in `server/vercel.json`. Configure the server environment variables in Vercel, including `MONGODB_URL`, `JWT_SECRET`, `BROWSERBASE_API_KEY`, `CRON_SECRET`, and `FRONTEND_URL`. Set the client `VITE_BACKEND_URL` to the deployed API URL when deploying it separately.
