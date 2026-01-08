#!/data/data/com.termux/files/usr/bin/bash

set -e

echo "🚀 OpenCode Manager - Termux Setup Script"
echo "=========================================="
echo ""

echo "📱 Checking Termux environment..."

if [ ! -d "$PREFIX" ]; then
  echo "❌ This script must be run in Termux environment"
  exit 1
fi

echo "✅ Running in Termux"
echo ""

echo "📦 Installing required Termux packages..."

REQUIRED_PACKAGES="nodejs git python openssh proot-distro"

for package in $REQUIRED_PACKAGES; do
  if ! command -v $package &> /dev/null && ! pkg list-installed | grep -q "^$package/"; then
    echo "  Installing $package..."
    pkg install -y $package
  else
    echo "  ✅ $package is already installed"
  fi
done

echo "✅ Required packages installed"
echo ""

echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Installing..."
  pkg install -y nodejs
else
  NODE_VERSION=$(node --version)
  echo "✅ Node.js is installed ($NODE_VERSION)"
fi
echo ""

echo "🔍 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm..."
  npm install -g pnpm
  echo "✅ pnpm installed"
else
  PNPM_VERSION=$(pnpm --version)
  echo "✅ pnpm is already installed ($PNPM_VERSION)"
fi
echo ""

echo "🔍 Checking Git..."
if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed. Installing..."
  pkg install -y git
else
  GIT_VERSION=$(git --version)
  echo "✅ Git is installed ($GIT_VERSION)"
fi
echo ""

echo "🔍 Checking OpenCode CLI..."
if ! command -v opencode &> /dev/null; then
  echo "⚠️  OpenCode CLI is not installed. Attempting to install..."
  if curl -fsSL https://opencode.ai/install | bash; then
    export PATH="$HOME/.opencode/bin:$PATH"
    echo "✅ OpenCode CLI installed"
  else
    echo "⚠️  OpenCode CLI installation failed. You may need to install it manually:"
    echo "   npm install -g @opencode/tui"
  fi
else
  OPENCODE_VERSION=$(opencode --version 2>&1 || echo "unknown")
  echo "✅ OpenCode CLI is installed ($OPENCODE_VERSION)"
fi
echo ""

echo "📁 Setting up workspace directories..."
WORKSPACE_PATH="./workspace"
if [ ! -d "$WORKSPACE_PATH" ]; then
  mkdir -p "$WORKSPACE_PATH/repos"
  mkdir -p "$WORKSPACE_PATH/.config/opencode"
  echo "✅ Workspace directories created at $WORKSPACE_PATH"
else
  echo "✅ Workspace directory already exists"
fi

mkdir -p ./data
echo "✅ Data directory created"
echo ""

echo "📝 Setting up environment configuration..."
if [ ! -f ".env" ]; then
  if [ -f ".env.termux" ]; then
    cp .env.termux .env
    echo "✅ Copied .env.termux to .env"
  elif [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Copied .env.example to .env"
  else
    echo "⚠️  No .env template found, creating minimal .env"
    cat > .env << 'EOF'
PORT=5001
HOST=127.0.0.1
NODE_ENV=development
OPENCODE_SERVER_PORT=5551
DATABASE_PATH=./data/opencode.db
WORKSPACE_PATH=./workspace
EOF
  fi
  echo "✅ Environment file created"
else
  echo "✅ Environment file already exists"
fi
echo ""

echo "📦 Installing project dependencies..."
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install
else
  echo "⚠️  pnpm-lock.yaml not found, running fresh install..."
  pnpm install
fi
echo "✅ Dependencies installed"
echo ""

echo "✅ Termux setup completed successfully!"
echo ""
echo "🚀 To start OpenCode Manager:"
echo "   bash scripts/start-termux.sh"
echo ""
echo "📝 Note: Make sure to configure your OpenCode credentials in the UI"
echo "   after starting the application."
