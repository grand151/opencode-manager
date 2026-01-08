# OpenCode Manager - Termux Installation Guide

Run OpenCode Manager directly on your Android device using Termux - no Docker, no desktop required. Full backend and frontend support with Git integration and AI agent capabilities.

## Prerequisites

### 1. Install Termux
- **Download from F-Droid**: https://f-droid.org/packages/com.termux/
- **⚠️ Important**: Do NOT install from Google Play Store (outdated version)
- Recommended: Also install **Termux:API** and **Termux:Widget** from F-Droid

### 2. System Requirements
- Android 7.0 or higher
- At least 2GB free storage space
- Stable internet connection (for installation)
- Recommended: 2GB+ RAM for smooth operation

## Quick Start

### Step 1: Update Termux Packages

Open Termux and run:

```bash
pkg update && pkg upgrade
```

Press `Y` when prompted to confirm updates.

### Step 2: Grant Storage Access (Optional but Recommended)

Allow Termux to access your device storage:

```bash
termux-setup-storage
```

This lets you access files from your device's Downloads, Pictures, etc.

### Step 3: Clone the Repository

```bash
# Install git if not already installed
pkg install git

# Clone the repository
git clone https://github.com/grand151/opencode-manager.git
cd opencode-manager
```

### Step 4: Run Automated Setup

The setup script will install all required dependencies automatically:

```bash
bash scripts/setup-termux.sh
```

This script will:
- ✅ Install Node.js (if not present)
- ✅ Install pnpm package manager
- ✅ Install Git
- ✅ Install OpenCode CLI
- ✅ Create workspace directories
- ✅ Install all project dependencies
- ✅ Set up environment configuration

**Note**: The setup process may take 5-15 minutes depending on your internet speed.

### Step 5: Start the Application

```bash
pnpm dev:termux
```

Or using the root npm scripts:

```bash
pnpm setup:termux  # One-time setup
pnpm dev:termux    # Start the app
```

## Accessing the Application

### On Your Device (Local)

Open your browser (Chrome, Firefox, etc.) and navigate to:

```
http://127.0.0.1:5173
```

### From Other Devices on Your Network

1. Find your device's IP address:
   ```bash
   ifconfig wlan0 | grep 'inet '
   ```

2. Edit `.env` to allow external connections:
   ```bash
   nano .env
   # Change HOST=127.0.0.1 to HOST=0.0.0.0
   ```

3. Restart the application

4. Access from another device:
   ```
   http://YOUR_DEVICE_IP:5173
   ```

## Configuration

### Environment Settings

The application uses `.env` for configuration. Termux-specific defaults are in `.env.termux`:

```bash
PORT=5001              # Backend API port
HOST=127.0.0.1         # Use 0.0.0.0 for network access
OPENCODE_SERVER_PORT=5551
DATABASE_PATH=./data/opencode.db
WORKSPACE_PATH=./workspace
MAX_FILE_SIZE_MB=20    # Reduced for mobile
```

### OpenCode Configuration

Configure your AI providers through the web UI:
1. Open the app at http://127.0.0.1:5173
2. Navigate to Settings → Provider Credentials
3. Add your API keys or use OAuth authentication

## Performance Optimization

### Recommended Settings

1. **Enable Wakelock** (prevents sleep interruptions):
   - Termux → Settings → "Acquire wakelock"

2. **Close Background Apps**:
   - Free up RAM by closing unnecessary apps
   - Especially important for devices with <2GB RAM

3. **Use Wi-Fi**:
   - More stable than mobile data
   - Faster package downloads

4. **Battery Optimization**:
   - Disable battery optimization for Termux in Android settings
   - Settings → Apps → Termux → Battery → Don't optimize

### Quick Launch with Termux:Widget

1. Install **Termux:Widget** from F-Droid
2. Create startup script:
   ```bash
   mkdir -p ~/.shortcuts
   cat > ~/.shortcuts/opencode-start.sh << 'EOF'
   #!/data/data/com.termux/files/usr/bin/bash
   cd ~/opencode-manager
   pnpm dev:termux
   EOF
   chmod +x ~/.shortcuts/opencode-start.sh
   ```
3. Add widget to home screen
4. Tap widget to start OpenCode Manager

## Troubleshooting

### Port Already in Use

If you see "Port 5001 already in use":

```bash
# Find and kill the process
lsof -i :5001
kill <PID>

# Or change the port in .env
echo "PORT=5002" >> .env
```

### Node.js Module Errors

Clear and reinstall dependencies:

```bash
rm -rf node_modules */node_modules
pnpm install --no-frozen-lockfile
```

### OpenCode Installation Failed

Manually install OpenCode:

```bash
npm install -g @opencode/tui

# Verify installation
opencode --version
```

### Out of Memory Errors

1. Close other apps
2. Restart Termux
3. Consider reducing file size limits in `.env`:
   ```
   MAX_FILE_SIZE_MB=10
   MAX_UPLOAD_SIZE_MB=10
   ```

### Slow Performance

1. Check available RAM:
   ```bash
   free -h
   ```

2. Increase timeouts in `.env`:
   ```
   PROCESS_START_WAIT_MS=5000
   HEALTH_CHECK_TIMEOUT_MS=90000
   ```

3. Use Node.js watch mode instead of Bun:
   ```bash
   cd backend
   pnpm dev:node
   ```

### Storage Access Issues

Re-run storage setup:

```bash
termux-setup-storage
# Restart Termux and grant permissions when prompted
```

### Git Operations Failing

Ensure Git is properly configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Updating OpenCode Manager

To update to the latest version:

```bash
cd opencode-manager
git pull origin main
pnpm install --no-frozen-lockfile
pnpm dev:termux
```

## Uninstallation

To completely remove OpenCode Manager:

```bash
# Stop the application (Ctrl+C)

# Remove the repository
cd ~
rm -rf opencode-manager

# Optionally remove global packages
npm uninstall -g @opencode/tui pnpm
```

## Features Available in Termux

All features of OpenCode Manager work in Termux:

✅ **Full Git Integration**
- Clone, pull, push repositories
- Branch management
- View diffs and file changes
- Create worktrees

✅ **AI Agent Support**
- All OpenCode features
- Multiple AI providers
- OAuth authentication
- Custom agents

✅ **File Management**
- Browse and edit files
- Syntax highlighting
- File upload/download
- Large file support

✅ **Mobile Optimizations**
- Responsive UI
- Touch-friendly interface
- Reduced resource usage
- Network-accessible

## Advanced Usage

### Running in Background

Use `tmux` or `screen` to keep the app running when you close Termux:

```bash
# Install tmux
pkg install tmux

# Start a session
tmux new -s opencode

# Start the app
cd opencode-manager
pnpm dev:termux

# Detach: Press Ctrl+B, then D
# Reattach: tmux attach -t opencode
```

### Using with External Editor

Edit code in your favorite Android code editor:

1. Grant Termux storage access
2. Navigate to Termux files:
   ```
   /storage/emulated/0/Android/data/com.termux/files/home/opencode-manager
   ```
3. Edit with any text editor app

### Custom Port Configuration

To use different ports:

```bash
# Edit .env
nano .env

# Change ports
PORT=8080              # Backend
FRONTEND_PORT=8081     # Frontend (in start-termux.sh)

# Restart the app
```

## Security Considerations

### Local-Only Access (Recommended)

Default configuration (`HOST=127.0.0.1`) only allows local connections for security.

### Network Access

If enabling network access (`HOST=0.0.0.0`):

⚠️ **Security Warnings**:
- Anyone on your network can access the application
- No built-in authentication (yet)
- Avoid on public Wi-Fi
- Consider using a VPN or firewall

**Recommended for network access**:
1. Use only on trusted private networks
2. Close the app when not in use
3. Monitor access logs
4. Keep OpenCode Manager updated

## Support

- **Documentation**: https://github.com/grand151/opencode-manager
- **Issues**: https://github.com/grand151/opencode-manager/issues
- **OpenCode**: https://opencode.ai

## Tips & Tricks

1. **Keyboard Shortcuts**: Use Termux keyboard shortcuts (Volume Down + key combinations)
2. **Copy/Paste**: Long press in Termux for context menu
3. **Multiple Sessions**: Use tmux for multiple terminal sessions
4. **Auto-start**: Set up with Termux:Boot for automatic startup
5. **External Keyboard**: Works great with Bluetooth keyboards

---

**Enjoy using OpenCode Manager on Termux! 🚀📱**
