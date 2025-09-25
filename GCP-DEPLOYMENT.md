# Bridalteam – Google Cloud (GCE + Cloud SQL) Deployment

This guide deploys Bridalteam on a Google Compute Engine VM with a managed MySQL (Cloud SQL) instance via the Cloud SQL Auth Proxy.

## Prereqs
- Google Cloud project with billing enabled
- gcloud installed locally (optional if using Console)
- Docker installed on the VM (use `gcp/install.sh`)

## 1) Create Cloud SQL (MySQL)
- Create a MySQL 8 Cloud SQL instance
- Create DBs: `bridalteam`, `bridalteam_admin`, `bridalteam_blog`
- Create user `bridalteam_user` with a strong password
- Note the Instance Connection Name: `project:region:instance`

## 2) Service Account
- Create a service account (e.g., `cloud-sql-proxy@...`)
- Grant role: Cloud SQL Client
- Create a JSON key and download it
- Place it at `gcp/key.json` in the repository on the VM

## 3) Compute Engine VM
- Create an Ubuntu 22.04 VM (e2-medium or better)
- Allow HTTP/HTTPS firewall
- SSH into the VM

Install Docker:
```bash
bash gcp/install.sh
```

## 4) Prepare env files
On the VM, in the project directory:
```bash
cp env.gcp.example .env.gcp
nano .env.gcp   # set CLOUD_SQL_CONNECTION_NAME and DB_* values

cp website/.env.gcp.example website/.env
```

Ensure DB values in `website/.env` match Cloud SQL credentials and set `APP_URL` to your VM external IP/domain.

## 5) Deploy
```bash
bash gcp/deploy.sh
```
This will:
- Start the Cloud SQL Proxy sidecar and the app (`docker-compose.gce.yml`)
- Install Composer deps in the web container
- Generate Laravel app key
- Run DB migrations

## 6) WordPress
- Admin: http://YOUR_VM_EXTERNAL_IP/admin
- Blog: http://YOUR_VM_EXTERNAL_IP/blog
Complete the WordPress installers using the Cloud SQL credentials.

## Operations
- Logs: `docker compose -f docker-compose.gce.yml logs -f`
- Restart: `docker compose -f docker-compose.gce.yml restart`
- Stop: `docker compose -f docker-compose.gce.yml down`

## Notes
- The image includes Apache/PHP 7.4 + Composer v1 for Laravel 5.5
- For TLS, place certificates on the VM and front with a Google HTTPS Load Balancer or use a reverse proxy container


