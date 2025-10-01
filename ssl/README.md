# SSL Certificates Directory

This directory should contain your SSL certificates for production deployment.

## Required Files:
- `cert.pem` - Your SSL certificate
- `key.pem` - Your private key

## Getting SSL Certificates:

### Option 1: Let's Encrypt (Free)
```bash
# Install certbot on your DigitalOcean droplet
sudo apt update
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d bridalteam.com -d www.bridalteam.com

# Copy certificates to this directory
sudo cp /etc/letsencrypt/live/bridalteam.com/fullchain.pem ./cert.pem
sudo cp /etc/letsencrypt/live/bridalteam.com/privkey.pem ./key.pem
```

### Option 2: Custom SSL Certificate
Place your SSL certificate files in this directory:
- Rename your certificate file to `cert.pem`
- Rename your private key file to `key.pem`

## Security Note:
- Never commit actual certificate files to version control
- Add `*.pem` to your `.gitignore` file
- Set proper file permissions (600) on certificate files
