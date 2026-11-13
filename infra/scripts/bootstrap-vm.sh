#!/usr/bin/env bash
# cloud-init / provisioning script for the AnnexEvoice production VM (Ubuntu 24.04).
# Idempotent — safe to re-run.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release ufw fail2ban unattended-upgrades jq age
dpkg-reconfigure -plow unattended-upgrades

# Docker
if ! command -v docker >/dev/null; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" >/etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

# App layout
install -d -m 0750 /opt/annexevoice
install -d -m 0755 /mnt/data/postgres /mnt/data/redis

# UFW mirrors GCP firewall. SSH only via IAP so port 22 stays denied here.
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban
echo "AnnexEvoice VM bootstrap complete."
