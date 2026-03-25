#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash docker/setup-nginx.sh your-domain.com"
  exit 1
fi

DOMAIN="$1"
NGINX_SITE="/etc/nginx/sites-available/travel"

sudo cp docker/nginx-travel.conf.example "$NGINX_SITE"
sudo sed -i "s/your-domain.com/${DOMAIN}/g" "$NGINX_SITE"

if [[ ! -L /etc/nginx/sites-enabled/travel ]]; then
  sudo ln -s "$NGINX_SITE" /etc/nginx/sites-enabled/travel
fi

sudo nginx -t
sudo systemctl reload nginx

echo "Nginx site enabled for ${DOMAIN}."
echo "Run certbot next: sudo certbot --nginx -d ${DOMAIN}"
