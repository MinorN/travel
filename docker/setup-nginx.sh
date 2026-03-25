#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash docker/setup-nginx.sh your-domain.com"
  exit 1
fi

# Ensure Nginx is installed
if ! command -v nginx >/dev/null 2>&1; then
  echo "Nginx not found. Installing..."
  sudo apt-get update
  sudo apt-get install -y nginx certbot python3-certbot-nginx
fi

# Ensure configuration directories exist
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

DOMAIN="$1"
NGINX_SITE="/etc/nginx/sites-available/travel"

sudo cp docker/nginx-travel.conf.example "$NGINX_SITE"
sudo sed -i "s/your-domain.com/${DOMAIN}/g" "$NGINX_SITE"

if [[ ! -L /etc/nginx/sites-enabled/travel ]]; then
  sudo ln -s "${NGINX_SITE}" /etc/nginx/sites-enabled/travel
fi

# Reload Nginx to apply HTTP config
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "Nginx site enabled (HTTP only)."
  echo "You can now access your site at http://${DOMAIN}"
else
  echo "Nginx configuration test failed. Please check errors."
  exit 1
fi
