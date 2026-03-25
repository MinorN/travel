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
  sudo ln -s "${NGINX_SITE}" /etc/nginx/sites-enabled/travel
fi

# Reload Nginx to apply HTTP config
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "Nginx site enabled (HTTP only)."
else
  echo "Nginx configuration test failed. Please check errors."
  exit 1
fi

echo "Running Certbot to enable HTTPS..."
# Use --non-interactive if you want to automate fully, but manual is safer for first run
sudo certbot --nginx -d "${DOMAIN}" --register-unsafely-without-email --agree-tos --redirect

echo "Done! Your site should be live at https://${DOMAIN}"
