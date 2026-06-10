# DEPLOY.md — production deployment procedure (manual, production-only)

## One-time server setup
1. SSH in. Install Node 18+ (nvm if needed): `nvm install 18 && nvm alias default 18`
2. `npm i -g pm2`
3. Create DB + user in DirectAdmin: database `lbbs_prod`, user with full rights.
4. `git clone git@github.com:<you>/lsport.git ~/lsport`
5. `cd ~/lsport && cp server/.env.example server/.env` → fill real values (DB, JWT_SECRET 64 chars, SMTP, paths).
6. `cd server && npm ci && npx knex migrate:latest && npx knex seed:run`
7. `cd ../client && npm ci && npm run build`
8. `pm2 start ecosystem.config.cjs && pm2 save && pm2 startup` (run printed command)
9. OpenLiteSpeed (admin panel :7080):
   - Virtual hosts for portal.lbbs.co.za and work.lbbs.co.za
   - For each: External App → Web Server type, address `http://127.0.0.1:3000`; Context `/` → Proxy → that app
   - Set proxy headers: X-Forwarded-For, X-Forwarded-Proto, Host
   - Let's Encrypt SSL per subdomain via DirectAdmin; force HTTPS redirect.
10. Verify: `curl -I https://work.lbbs.co.za/api/v1/health`

## Routine deploy
```
ssh user@lbbs.co.za
cd ~/lsport && ./scripts/deploy.sh
```
deploy.sh does: backup DB → git pull main → npm ci (if lockfile changed) → migrate → client build → pm2 reload → health check. On health-check failure it prints rollback instructions.

## Rollback
```
./scripts/rollback.sh v1.0-phaseN
```
Checks out tag, reinstalls, rebuilds, reloads PM2. DB rollback: restore latest dump from ~/backups (migrations are forward-only; restore dump if a migration broke data).

## After every deploy
Append a row to memory/DEPLOY_LOG.md and push.
