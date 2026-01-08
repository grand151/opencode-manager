# Deployment Guide

This guide covers deployment options for OpenCode Manager on production environments.

**🌍 Available in:** [English](#) | [Polski (Polish)](./DEPLOYMENT.pl.md)

## Quick Start

| Deployment Method | Difficulty | Time | Best For |
|-------------------|------------|------|----------|
| [Easypanel](#easypanel-deployment-recommended) | ⭐ Easy | 10 min | Production, VPS |
| [Docker Compose](#docker-compose-on-vps) | ⭐⭐ Medium | 15 min | Custom setups |
| [Local Docker](#docker-compose-on-vps) | ⭐ Easy | 5 min | Testing, dev |

## Table of Contents

- [Easypanel Deployment (Recommended)](#easypanel-deployment-recommended)
- [Docker Compose on VPS](#docker-compose-on-vps)
- [Environment Variables](#environment-variables)
- [Backup and Restore](#backup-and-restore)

---

## Easypanel Deployment (Recommended)

Easypanel provides the easiest way to deploy OpenCode Manager with automatic SSL, domain management, and monitoring.

### Prerequisites

- VPS with Ubuntu 20.04+ (minimum 2GB RAM, 20GB storage)
- Domain name pointed to your VPS IP
- Ports 80 and 443 open in firewall

### Step 1: Install Easypanel

```bash
# Install Docker if not already installed
curl -sSL https://get.docker.com | sh

# Install Easypanel
docker run --rm \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

Access Easypanel at `http://your-vps-ip:3000` and complete the setup wizard.

### Step 2: Deploy OpenCode Manager

#### Option A: Using GitHub Repository (Recommended)

1. **Create New Project** in Easypanel
   - Click "Create" → "GitHub Repository"
   - Connect your GitHub account
   - Select repository: `grand151/opencode-manager` (or your fork)
   - Branch: `main`

2. **Configure Build Settings**
   - Build Method: Docker Compose
   - Docker Compose File: `docker-compose.yml`

3. **Set Environment Variables**
   
   Navigate to project settings and add these variables:
   
   ```env
   # Domain Configuration
   DOMAIN=opencode.yourdomain.com
   
   # Application Settings
   NODE_ENV=production
   PORT=5003
   HOST=0.0.0.0
   CORS_ORIGIN=https://opencode.yourdomain.com
   
   # Optional: Customize ports (if needed)
   APP_PORT=5003
   DEV_PORT_1=5100
   DEV_PORT_2=5101
   DEV_PORT_3=5102
   DEV_PORT_4=5103
   
   # Optional: Adjust timeouts for slower VPS
   PROCESS_START_WAIT_MS=3000
   HEALTH_CHECK_TIMEOUT_MS=45000
   
   # Optional: File upload limits (requires adequate storage and memory)
   # Note: Increasing these values requires sufficient VPS resources
   # Recommended: Add 1GB RAM per 100MB increase in file size limits
   MAX_FILE_SIZE_MB=100
   MAX_UPLOAD_SIZE_MB=100
   ```

4. **Configure Domain**
   - Go to "Domains" tab
   - Add domain: `opencode.yourdomain.com`
   - Easypanel will automatically provision SSL certificate

5. **Deploy**
   - Click "Deploy" button
   - Wait for build to complete (~5-10 minutes first time)
   - Access your app at `https://opencode.yourdomain.com`

#### Option B: Using Docker Compose File

1. **Create New Project** in Easypanel
   - Click "Create" → "Docker Compose"

2. **Paste Docker Compose Configuration**
   
   Copy the content from `docker-compose.yml` or use this simplified version:

   ```yaml
   services:
     app:
       image: ghcr.io/grand151/opencode-manager:latest
       container_name: opencode-manager
       ports:
         - "5003:5003"
       environment:
         - NODE_ENV=production
         - HOST=0.0.0.0
         - PORT=5003
         - CORS_ORIGIN=*
       volumes:
         - opencode-workspace:/workspace
         - opencode-data:/app/data
       restart: unless-stopped
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.opencode-manager.rule=Host(`opencode.yourdomain.com`)"
         - "traefik.http.routers.opencode-manager.entrypoints=websecure"
         - "traefik.http.routers.opencode-manager.tls.certresolver=letsencrypt"
         - "traefik.http.services.opencode-manager.loadbalancer.server.port=5003"

   volumes:
     opencode-workspace:
     opencode-data:
   ```

3. **Replace Domain**
   - Update `opencode.yourdomain.com` with your actual domain

4. **Deploy**
   - Click "Deploy" button

### Step 3: Verify Deployment

1. **Check Health**
   ```bash
   curl https://opencode.yourdomain.com/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "version": "0.5.7",
     "opencode": {
       "installed": true,
       "running": true
     }
   }
   ```

2. **Access Application**
   - Open `https://opencode.yourdomain.com` in browser
   - Complete initial setup

### Managing Your Deployment

#### Viewing Logs

In Easypanel:
1. Go to your project
2. Click "Logs" tab
3. View real-time logs

Or via CLI:
```bash
docker logs -f opencode-manager
```

#### Updating to Latest Version

**Automatic Updates** (Recommended):
- Enable "Auto Deploy" in Easypanel project settings
- Easypanel will automatically pull and deploy new versions

**Manual Update**:
1. Go to project in Easypanel
2. Click "Rebuild" button

Or via CLI:
```bash
docker pull ghcr.io/grand151/opencode-manager:latest
docker-compose up -d
```

#### Restarting the Application

In Easypanel:
1. Go to project
2. Click "Restart" button

Or via CLI:
```bash
docker-compose restart
```

---

## Docker Compose on VPS

Deploy without Easypanel using Docker Compose directly.

### Prerequisites

- VPS with Ubuntu 20.04+ (minimum 2GB RAM, 20GB storage)
- Docker and Docker Compose installed
- (Optional) Reverse proxy for SSL (nginx, Caddy, Traefik)

### Installation

1. **Install Docker**
   ```bash
   curl -sSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/grand151/opencode-manager.git
   cd opencode-manager
   ```

3. **Configure Environment**
   ```bash
   # Copy production environment template
   cp .env.production .env
   
   # Edit configuration
   nano .env
   ```
   
   Update these critical values:
   - `CORS_ORIGIN` - Set to your domain or `*`
   - `APP_PORT` - External port (default: 5003)

4. **Deploy**
   ```bash
   # Build and start
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   ```

5. **Access Application**
   - Direct: `http://your-vps-ip:5003`
   - With reverse proxy: `https://yourdomain.com`

### Setting Up Reverse Proxy (Optional)

#### Using Caddy (Recommended - Auto SSL)

1. **Install Caddy**
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. **Configure Caddy**
   ```bash
   sudo nano /etc/caddy/Caddyfile
   ```
   
   Add:
   ```caddy
   opencode.yourdomain.com {
       reverse_proxy localhost:5003
   }
   ```

3. **Restart Caddy**
   ```bash
   sudo systemctl restart caddy
   ```

#### Using Nginx

1. **Install Nginx**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/opencode-manager
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name opencode.yourdomain.com;

       location / {
           proxy_pass http://localhost:5003;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable Site & SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/opencode-manager /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d opencode.yourdomain.com
   ```

---

## Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `production` | `production` |
| `PORT` | Internal application port | `5003` | `5003` |
| `HOST` | Bind address | `0.0.0.0` | `0.0.0.0` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DOMAIN` | Your domain (for Traefik) | `localhost` | `opencode.example.com` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | `https://example.com` |
| `APP_PORT` | External port mapping | `5003` | `8080` |
| `MAX_FILE_SIZE_MB` | Max file upload size | `50` | `100` |
| `PROCESS_START_WAIT_MS` | Process startup timeout | `2000` | `3000` |
| `DEBUG` | Enable debug logging | `false` | `true` |

See `.env.production` for complete list of configuration options.

---

## Backup and Restore

### Backup

Your data is stored in Docker volumes. To backup:

```bash
# Stop the application
docker-compose down

# Backup volumes
docker run --rm \
  -v opencode-workspace:/workspace \
  -v opencode-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/opencode-backup-$(date +%Y%m%d).tar.gz /workspace /data

# Restart application
docker-compose up -d
```

### Restore

```bash
# Stop the application
docker-compose down

# Restore from backup
docker run --rm \
  -v opencode-workspace:/workspace \
  -v opencode-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/opencode-backup-YYYYMMDD.tar.gz -C /

# Restart application
docker-compose up -d
```

### Automated Backups

Add to crontab for daily backups:

```bash
crontab -e
```

Add:
```
0 2 * * * cd /path/to/opencode-manager && docker run --rm -v opencode-workspace:/workspace -v opencode-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/opencode-backup-$(date +\%Y\%m\%d).tar.gz /workspace /data
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker-compose logs -f
```

**Common issues:**
- Port already in use → Change `APP_PORT` in `.env`
- Permission denied → Check volume permissions
- OpenCode not installed → Container should auto-install, check logs

### Cannot Access Application

**Check container status:**
```bash
docker-compose ps
```

**Test health endpoint:**
```bash
curl http://localhost:5003/api/health
```

**Verify firewall:**
```bash
# Allow port through firewall
sudo ufw allow 5003/tcp
```

### High Memory Usage

**Check resource usage:**
```bash
docker stats opencode-manager
```

**Optimize:**
- Reduce `MAX_FILE_SIZE_MB`
- Lower `SANDBOX_TTL_HOURS`
- Increase `CLEANUP_INTERVAL_MINUTES`

### SSL Certificate Issues (Easypanel)

1. Verify domain DNS points to VPS
2. Check Traefik logs: `docker logs -f easypanel-traefik`
3. Restart Easypanel: `docker restart easypanel`

---

## Support

- **Issues:** [GitHub Issues](https://github.com/grand151/opencode-manager/issues)
- **Discussions:** [GitHub Discussions](https://github.com/grand151/opencode-manager/discussions)
- **Documentation:** [README.md](./README.md)

---

## Security Best Practices

1. **Always use HTTPS in production** (Easypanel handles this automatically)
2. **Regularly update** to latest version for security patches
3. **Backup regularly** - automate daily backups
4. **Use strong passwords** for GitHub PAT and OAuth
5. **Restrict CORS** - set `CORS_ORIGIN` to your domain instead of `*`
6. **Monitor logs** for suspicious activity
7. **Keep VPS updated**: `sudo apt update && sudo apt upgrade`

---

*Last updated: 2026-01-08*
