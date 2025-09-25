# Bridalteam Project

A multi-component web application consisting of Laravel backend, WordPress CMS, and blog functionality.

## 🚀 Quick Deployment with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Deploy in 2 Steps

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd Bridalteam
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

### Access Your Application

Once deployed, your application will be available at:
- **Main Website**: http://localhost
- **Laravel API**: http://localhost/website
- **WordPress Admin**: http://localhost/admin
- **Blog**: http://localhost/blog

### Default Database Credentials
- **Host**: localhost:3306
- **Database**: bridalteam
- **Username**: bridalteam_user
- **Password**: userpassword
- **Root Password**: rootpassword

## 🛠️ Development

### Stop the application:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Rebuild after changes:
```bash
docker-compose up --build -d
```

## 📁 Project Structure

```
Bridalteam/
├── website/          # Laravel application
├── admin/            # WordPress admin
├── blog/             # WordPress blog
├── Dockerfile        # Container configuration
├── docker-compose.yml # Service orchestration
└── README.md         # This file
```

## 🔧 Configuration

### Environment Files
- Copy `env.production.example` to `.env` and update values
- Copy `website/.env.production` to `website/.env` for Laravel config
- Update WordPress config files in `admin/` and `blog/` directories

### WordPress Setup
1. Navigate to http://localhost/admin
2. Complete WordPress installation
3. Repeat for http://localhost/blog if needed

## 🚨 Production Deployment

For production deployment:
1. Update all passwords in configuration files
2. Configure proper domain names
3. Set up SSL certificates
4. Use a managed database service
5. Configure backups

---

**Need help?** Check the container logs with `docker-compose logs` for troubleshooting.
