# 🚀 GRUDGE Warlords - Self-Hosted Deployment Guide

Complete guide for deploying GRUDGE Warlords on your own servers without Replit.

---

## 📋 **System Requirements**

### **Development Machine (Your PC)**

- Windows 10/11
- Node.js 20+ (LTS)
- PostgreSQL 16+
- Git
- VSCode (recommended)

### **Production Server**

- Windows Server or Linux (Ubuntu 22.04+ recommended)
- Node.js 20+ (LTS)
- PostgreSQL 16+
- Nginx or Apache (for reverse proxy)
- SSL Certificate (Let's Encrypt recommended)
- Minimum 2GB RAM, 20GB storage

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT (Local PC)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │      │
│  │ React + Vite │  │ Express + TS │  │   Database   │      │
│  │ Port: 5000   │  │ Port: 5000   │  │ Port: 5432   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ Deploy
┌─────────────────────────────────────────────────────────────┐
│              PRODUCTION (Your Server)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Nginx     │→ │   Node.js    │→ │  PostgreSQL  │      │
│  │ Port: 80/443 │  │ Port: 5000   │  │ Port: 5432   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                                                    │
│  SSL Certificate (HTTPS)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Part 1: Local Development Setup**

### **Step 1: Install Prerequisites**

```powershell
# Check Node.js version (should be 20+)
node --version

# Check npm version
npm --version

# Check PostgreSQL
psql --version
```

If not installed:

- **Node.js**: Download from <https://nodejs.org/>
- **PostgreSQL**: Download from <https://www.postgresql.org/download/windows/>

### **Step 2: Setup Local Database**

```powershell
# Open PostgreSQL command line (psql)
psql -U postgres

# Create database
CREATE DATABASE grudge_warlords_dev;

# Create user
CREATE USER grudge_dev WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE grudge_warlords_dev TO grudge_dev;

# Exit
\q
```

### **Step 3: Configure Environment Variables**

Create `.env.local` file in your project root:

```env
# Development Environment
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://grudge_dev:your_secure_password@localhost:5432/grudge_warlords_dev

# Session Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your_generated_secret_here

# Optional: Puter Integration (if still using)
PUTER_CLOUD_URL=https://grudge-auth-73v97.puter.site
```

### **Step 4: Install Dependencies & Run**

```powershell
# Install all dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Your app should now be running at `http://localhost:5000`

---

## 🖥️ **Part 2: Production Server Setup**

### **Option A: Windows Server with IIS/Nginx**

#### **1. Install Node.js on Server**

Download and install Node.js LTS from <https://nodejs.org/>

```powershell
# Verify installation
node --version
npm --version
```

#### **2. Install PostgreSQL on Server**

Download from <https://www.postgresql.org/download/windows/>

```powershell
# Create production database
psql -U postgres

CREATE DATABASE grudge_warlords_prod;
CREATE USER grudge_prod WITH PASSWORD 'strong_production_password';
GRANT ALL PRIVILEGES ON DATABASE grudge_warlords_prod TO grudge_prod;
\q
```

#### **3. Setup Application Directory**

```powershell
# Create app directory
mkdir C:\grudge-warlords
cd C:\grudge-warlords

# Clone your repository (or upload files via Radmin)
git clone https://github.com/yourusername/Warlord-Crafting-Suite.git .

# Install dependencies
npm install --production
```

#### **4. Create Production Environment File**

Create `.env` in `C:\grudge-warlords\`:

```env
NODE_ENV=production
PORT=5000

# Production Database
DATABASE_URL=postgresql://grudge_prod:strong_production_password@localhost:5432/grudge_warlords_prod

# Session Secret (MUST be different from dev!)
SESSION_SECRET=generate_new_secret_for_production

# Your domain
BACKEND_URL=https://yourdomain.com
```

#### **5. Build the Application**

```powershell
npm run build
```

This creates optimized production files in `dist/` folder.

#### **6. Install PM2 (Process Manager)**

PM2 keeps your app running and restarts it if it crashes:

```powershell
npm install -g pm2

# Start your app
pm2 start dist/index.cjs --name grudge-warlords

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### **7. Setup Nginx as Reverse Proxy**

Download Nginx for Windows: <https://nginx.org/en/download.html>

Edit `nginx.conf`:

```nginx
http {
    upstream grudge_backend {
        server 127.0.0.1:5000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Certificate (use Let's Encrypt or your own)
        ssl_certificate C:/nginx/ssl/cert.pem;
        ssl_certificate_key C:/nginx/ssl/key.pem;

        location / {
            proxy_pass http://grudge_backend;
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
}
```

Start Nginx:

```powershell
cd C:\nginx
start nginx
```

---

### **Option B: Linux Server (Ubuntu) - RECOMMENDED**

#### **1. Connect to Server via SSH**

```bash
ssh your_username@your_server_ip
```

#### **2. Install Node.js**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

#### **3. Install PostgreSQL**

```bash
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql

CREATE DATABASE grudge_warlords_prod;
CREATE USER grudge_prod WITH PASSWORD 'strong_production_password';
GRANT ALL PRIVILEGES ON DATABASE grudge_warlords_prod TO grudge_prod;
\q
```

#### **4. Setup Application**

```bash
# Create app directory
sudo mkdir -p /var/www/grudge-warlords
sudo chown $USER:$USER /var/www/grudge-warlords
cd /var/www/grudge-warlords

# Clone repository
git clone https://github.com/yourusername/Warlord-Crafting-Suite.git .

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Paste production environment variables (same as Windows example above).

```bash
# Build application
npm run build

# Push database schema
npm run db:push
```

#### **5. Install PM2**

```bash
sudo npm install -g pm2

# Start app
pm2 start dist/index.cjs --name grudge-warlords

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

#### **6. Install and Configure Nginx**

```bash
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/grudge-warlords
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/grudge-warlords /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **7. Setup SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is setup automatically
```

---

## 🔄 **Part 3: Deployment Workflow**

### **Development → Production Pipeline**

#### **Method 1: Git-Based Deployment (Recommended)**

```bash
# On your local machine
git add .
git commit -m "Update feature X"
git push origin main

# On production server
cd /var/www/grudge-warlords
git pull origin main
npm install --production
npm run build
pm2 restart grudge-warlords
```

#### **Method 2: Automated Deployment Script**

Create `deploy.sh` on your server:

```bash
#!/bin/bash
cd /var/www/grudge-warlords
git pull origin main
npm install --production
npm run build
pm2 restart grudge-warlords
echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

Now you can deploy with:

```bash
./deploy.sh
```

---

## 🔐 **Part 4: Security Best Practices**

### **1. Firewall Configuration**

```bash
# Ubuntu/Linux
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Block direct access to Node.js port
sudo ufw deny 5000
```

### **2. Environment Variables Security**

- **NEVER** commit `.env` files to Git
- Use different secrets for dev/staging/production
- Rotate secrets regularly

### **3. Database Security**

```bash
# Only allow local connections
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add this line:
local   all   grudge_prod   md5
```

### **4. Regular Updates**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit fix
```

---

## 📊 **Part 5: Monitoring & Maintenance**

### **PM2 Monitoring**

```bash
# View logs
pm2 logs grudge-warlords

# Monitor resources
pm2 monit

# View status
pm2 status

# Restart app
pm2 restart grudge-warlords

# Stop app
pm2 stop grudge-warlords
```

### **Database Backups**

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/grudge-warlords"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U grudge_prod grudge_warlords_prod > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "✅ Backup complete: db_$DATE.sql"
```

Setup daily backups with cron:

```bash
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /var/www/grudge-warlords/backup.sh
```

---

## 🌐 **Part 6: Domain & DNS Setup**

### **Point Your Domain to Server**

1. Get your server's IP address:

   ```bash
   curl ifconfig.me
   ```

2. In your domain registrar (GoDaddy, Namecheap, etc.):
   - Create an **A Record**: `@` → `your_server_ip`
   - Create an **A Record**: `www` → `your_server_ip`

3. Wait for DNS propagation (5-30 minutes)

4. Test:

   ```bash
   ping yourdomain.com
   ```

---

## 🚀 **Part 7: Using Radmin & EasyWeb Server**

### **Radmin Server Setup**

Radmin is great for remote administration. Here's how to use it:

1. **Install Radmin Server** on your production machine
2. **Configure firewall** to allow Radmin port (default: 4899)
3. **Connect from your PC** using Radmin Viewer
4. **Manage your server** remotely (file transfer, remote desktop, etc.)

### **EasyWeb Server Alternative**

If you prefer EasyWeb Server instead of Nginx:

1. **Install EasyWeb Server** on your production machine
2. **Configure it** to proxy requests to `localhost:5000`
3. **Setup SSL certificate** in EasyWeb Server settings
4. **Point your domain** to the server

**Note:** Nginx is recommended for production due to better performance and security features.

---

## 📝 **Part 8: Environment Comparison**

| Feature | Development | Production |
|---------|-------------|------------|
| **Location** | Your PC | Your Server |
| **Database** | `grudge_warlords_dev` | `grudge_warlords_prod` |
| **Port** | 5000 (direct) | 80/443 (via Nginx) |
| **SSL** | No | Yes (Let's Encrypt) |
| **Process Manager** | None (npm run dev) | PM2 |
| **Hot Reload** | Yes (Vite HMR) | No |
| **Minified** | No | Yes |
| **Logging** | Console | PM2 logs |

---

## 🎯 **Quick Start Checklist**

### **Development Setup**

- [ ] Install Node.js 20+
- [ ] Install PostgreSQL
- [ ] Clone repository
- [ ] Create `.env.local`
- [ ] Run `npm install`
- [ ] Run `npm run db:push`
- [ ] Run `npm run dev`
- [ ] Access `http://localhost:5000`

### **Production Setup**

- [ ] Setup server (Windows/Linux)
- [ ] Install Node.js, PostgreSQL, Nginx
- [ ] Clone repository to server
- [ ] Create production `.env`
- [ ] Run `npm install --production`
- [ ] Run `npm run build`
- [ ] Setup PM2
- [ ] Configure Nginx
- [ ] Setup SSL certificate
- [ ] Configure firewall
- [ ] Setup backups
- [ ] Point domain to server

---

## 🆘 **Troubleshooting**

### **App won't start**

```bash
# Check PM2 logs
pm2 logs grudge-warlords

# Check if port is in use
sudo lsof -i :5000

# Restart PM2
pm2 restart grudge-warlords
```

### **Database connection failed**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U grudge_prod -d grudge_warlords_prod -h localhost
```

### **Nginx errors**

```bash
# Check Nginx config
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📚 **Additional Resources**

- **PM2 Documentation**: <https://pm2.keymetrics.io/>
- **Nginx Documentation**: <https://nginx.org/en/docs/>
- **PostgreSQL Documentation**: <https://www.postgresql.org/docs/>
- **Let's Encrypt**: <https://letsencrypt.org/>
- **Node.js Best Practices**: <https://github.com/goldbergyoni/nodebestpractices>

---

## 🎉 **You're Done!**

Your GRUDGE Warlords app is now running on your own infrastructure!

**Next Steps:**

1. Update Puter apps to point to your new backend URL
2. Test all features thoroughly
3. Setup monitoring and alerts
4. Create a staging environment for testing updates

**Need Help?** Check the troubleshooting section or review the logs with `pm2 logs`.
