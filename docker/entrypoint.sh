#!/bin/sh
set -e

echo "[lalink] Waiting for database..."
# Wait for DATABASE_URL to be reachable (up to ~120s)
node -e "
const { Client } = require('pg');
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  for (let i = 0; i < 60; i++) {
    const client = new Client({ connectionString: url });
    try { await client.connect(); await client.end(); console.log('[lalink] Database is reachable'); process.exit(0); }
    catch (e) { await sleep(2000); }
  }
  console.error('[lalink] Database not reachable after 120s');
  process.exit(1);
})();
"

echo "[lalink] Running prisma migrate deploy..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "[lalink] Seeding database..."
  npm run prisma:seed
fi

echo "[lalink] Starting Next.js server..."
exec node_modules/.bin/next start -H 0.0.0.0 -p "$PORT"