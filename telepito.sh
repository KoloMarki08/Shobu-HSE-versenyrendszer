#!/usr/bin/env bash
set -e

echo "=================================================================="
echo " TATAMI MASTER - AUTOMATIKUS DEBIAN VPS TELEPÍTŐ (tatamimaster.hu)"
echo "=================================================================="

# Ha nem rootként futtatják, sudo-val indítjuk újra
if [ "$EUID" -ne 0 ]; then
  echo "Root jogosultság szükséges, átváltás sudo-ra..."
  exec sudo bash "$0" "$@"
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/6] Alapcsomagok (Nginx, MariaDB, curl, unzip) telepítése..."
apt-get update -y
apt-get install -y nginx mariadb-server curl wget unzip ca-certificates libicu-dev

echo "[2/6] MariaDB adatbázis-szerver indítása és jogosultságok beállítása..."
systemctl enable mariadb
systemctl start mariadb

mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
CREATE DATABASE IF NOT EXISTS shobu_verseny_db CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
FLUSH PRIVILEGES;
EOF

echo "[3/6] .NET 10.0 ASP.NET Core Runtime telepítése..."
if [ ! -x "/usr/share/dotnet/dotnet" ]; then
  curl -sSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  chmod +x /tmp/dotnet-install.sh
  /tmp/dotnet-install.sh --channel 10.0 --runtime aspnetcore --install-dir /usr/share/dotnet
  ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
fi

echo "[4/6] Projektfájlok bemásolása a /var/www/tatamimaster mappába..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p /var/www/tatamimaster/frontend
mkdir -p /var/www/tatamimaster/backend

cp -r "$SCRIPT_DIR/index.html" "$SCRIPT_DIR/views" "$SCRIPT_DIR/CSS" "$SCRIPT_DIR/JS" /var/www/tatamimaster/frontend/
for f in favicon.svg logo.svg logo.jpg eye-fill.svg eye-slash-fill.svg undo.svg redo.svg undo.png redo.png; do
  if [ -f "$SCRIPT_DIR/$f" ]; then
    cp "$SCRIPT_DIR/$f" /var/www/tatamimaster/frontend/
  fi
done

cp -r "$SCRIPT_DIR/linux-publish/"* /var/www/tatamimaster/backend/
chown -R www-data:www-data /var/www/tatamimaster

echo "[5/6] C# Backend systemd szolgáltatás (tatamimaster.service) beállítása..."
cat >/etc/systemd/system/tatamimaster.service <<'EOF'
[Unit]
Description=Tatami Master Kyokushin Karate Versenyrendszer (.NET 10.0 API)
After=network.target mariadb.service

[Service]
WorkingDirectory=/var/www/tatamimaster/backend
ExecStart=/usr/share/dotnet/dotnet /var/www/tatamimaster/backend/Versenyrendszer.dll --urls "http://127.0.0.1:5008"
Restart=always
RestartSec=5
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tatamimaster.service
systemctl restart tatamimaster.service

echo "[6/6] Nginx webszerver és Reverse Proxy beállítása (tatamimaster.hu + 80.249.163.58)..."
cat >/etc/nginx/sites-available/tatamimaster <<'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      keep-alive;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name tatamimaster.hu www.tatamimaster.hu vps.tatamimaster.hu 80.249.163.58 _;

    root /var/www/tatamimaster/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5008/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }

    location /hubs/ {
        proxy_pass http://127.0.0.1:5008/hubs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/tatamimaster /etc/nginx/sites-enabled/tatamimaster
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "=================================================================="
echo " TELEPÍTÉS KÉSZ! A rendszer él:"
echo "   -> http://80.249.163.58"
echo "   -> http://tatamimaster.hu"
echo "=================================================================="
