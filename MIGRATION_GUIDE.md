# Deployment Guide for Debian/Ubuntu

This guide explains how to migrate and run the **English Learning Web Platform** on a local Debian or Ubuntu machine.

## 1. System Requirements

Ensure your Debian system is up to date and has basic tools installed.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

## 2. Install Node.js (Version 20+)

The project requires Node.js v20.9.0 or later. We recommend using the official NodeSource repository.

```bash
# Download and setup Node.js 20.x repo
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node -v
# Should output v20.x.x
```

## 3. Clone the Repository

Navigate to where you want to host the app (e.g., your home directory or `/var/www`).

```bash
cd ~
git clone https://github.com/zmg95171/newslists.git
cd newslists
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Configure Environment Variables

You need to create the `.env.local` file with your API keys.

1.  **Copy the template (if available) or create new:**
    ```bash
    cp .env.example .env.local
    nano .env.local
    ```

2.  **Paste your configuration** (use the same keys from your Windows machine):
    ```env
    # Database
    MONGODB_URI=mongodb+srv://...

    # APIs
    NEWSDATA_API_KEY=...
    LLM_API_KEY=...
    LLM_BASE_URL=...
    
    # Configuration
    CRON_SECRET=...
    REQUIRE_IMAGE=false
    MIN_CONTENT_LENGTH=10
    ```
    *(Press `Ctrl+O` to save and `Ctrl+X` to exit nano)*

## 6. Build the Application

Compile the Next.js application for production.

```bash
npm run build
```

## 7. Run the Application

### Option A: Manual Run (Testing)
To run it temporarily to test connectivity:
```bash
npm start
```
Access via `http://YOUR_SERVER_IP:3000`.

### Option B: Run in Background with PM2 (Recommended)
Use PM2 to keep the app running even if you close the terminal or reboot.

1.  **Install PM2 globally:**
    ```bash
    sudo npm install -g pm2
    ```

2.  **Start the app:**
    ```bash
    pm2 start npm --name "english-news-web" -- start
    ```

3.  **Setup Startup Script (Auto-start on boot):**
    ```bash
    pm2 startup
    # Copy and paste the command PM2 displays, usually something like:
    # sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_user --hp /home/your_user
    
    pm2 save
    ```

## 8. (Optional) Setup Nginx Reverse Proxy
If you want to access the site on port 80 (standard HTTP) instead of 3000.

1.  **Install Nginx:**
    ```bash
    sudo apt install -y nginx
    ```

2.  **Configure Site:**
    ```bash
    sudo nano /etc/nginx/sites-available/english-news
    ```
    Paste configuration:
    ```nginx
    server {
        listen 80;
        server_name _;  # Or your domain name

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable and Restart:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/english-news /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default  # Remove default site if needed
    sudo nginx -t
    sudo systemctl restart nginx
    ```

Now you can access via `http://YOUR_SERVER_IP`.
