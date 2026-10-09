# Source Backup

This repository contains a clean snapshot of the local project, without the
history of the earlier recovery repository. The earlier repository is unchanged.

The active deployment is `php-cpanel` (PHP/MySQL), with the public React/Vite
source in `seko-deneme-front-main`. Legacy Next.js sources remain for reference.

## Deliberately Excluded

- Real `.env` files and `php-cpanel/config/config.php`.
- Private keys, local credentials, database dumps and password hashes.
- Uploaded files, customer data, logs and runtime caches.
- Deployment ZIPs and extracted release copies.
- `node_modules`, `vendor`, temporary files and generated application bundles.

Schema migration SQL and sanitized example configuration are included. Public
bank sandbox fixtures in tests are not live credentials.

This is a SOURCE backup, not a complete live-server backup. Keep server config,
database contents and uploads in separate private backups. No live-server files
were downloaded as part of this export.

## Local Configuration

Use `.env.example` only as a template. Populate actual values privately and never
commit them. Docker Compose requires `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD`
from your private environment (for example, an ignored `.env` or an explicit
`--env-file .env.local`). Do not replace passwords of an existing database volume
merely to match an example. DATABASE_URL must match the actual database user.

The frontend build and any dependencies needed by the deployment packager must
be restored locally before generating a deployment. This source repository is
not a ZIP that can be directly extracted onto a running cPanel installation.
