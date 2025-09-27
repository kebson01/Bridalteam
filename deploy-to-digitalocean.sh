#!/bin/bash

# DigitalOcean Docker Deployment Script for Bridalteam
set -e

echo "🚀 Deploying Bridalteam to DigitalOcean..."

# Configuration
DROPLET_NAME="bridalteam-server"
REGION="nyc1"
SIZE="s-2vcpu-2gb"
IMAGE="docker-20-04"
SSH_KEY_NAME="bridalteam-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating DigitalOcean Droplet...${NC}"

# Create droplet (requires doctl CLI)
if command -v doctl &> /dev/null; then
    echo "Creating droplet with doctl..."
    doctl compute droplet create $DROPLET_NAME \
        --image $IMAGE \
        --size $SIZE \
        --region $REGION \
        --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
        --enable-monitoring \
        --wait
    
    DROPLET_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)
    echo -e "${GREEN}Droplet created with IP: $DROPLET_IP${NC}"
else
    echo -e "${RED}doctl not found. Please create droplet manually and update DROPLET_IP variable${NC}"
    echo "Manual steps:"
    echo "1. Go to DigitalOcean dashboard"
    echo "2. Create droplet with Docker image"
    echo "3. Update DROPLET_IP below"
    DROPLET_IP="YOUR_DROPLET_IP_HERE"
fi

echo -e "${YELLOW}Step 2: Waiting for droplet to be ready...${NC}"
sleep 30

echo -e "${YELLOW}Step 3: Deploying application...${NC}"

# Copy files to droplet
echo "Copying application files..."
scp -r . root@$DROPLET_IP:/opt/bridalteam/

# Connect and deploy
ssh root@$DROPLET_IP << 'EOF'
cd /opt/bridalteam

# Copy production environment
cp production.env .env

# Start the application
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec -T app php artisan migrate --force

echo "🎉 Deployment complete!"
echo "Your application is running at: http://$(curl -s ifconfig.me)"
EOF

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Point your domain to IP: $DROPLET_IP"
echo "2. Set up SSL certificate"
echo "3. Configure monitoring"
