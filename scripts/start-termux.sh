#!/data/data/com.termux/files/usr/bin/bash

set -e

echo "🚀 Starting OpenCode Manager in Termux..."
echo "=========================================="
echo ""

export PATH="$HOME/.opencode/bin:$PATH"

if [ ! -f ".env" ]; then
  echo "❌ .env file not found. Please run setup-termux.sh first"
  exit 1
fi

source .env

BACKEND_PORT=${PORT:-5001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
OPENCODE_PORT=${OPENCODE_SERVER_PORT:-5551}

echo "📋 Configuration:"
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "  OpenCode: http://127.0.0.1:$OPENCODE_PORT"
echo ""

cleanup() {
  echo ""
  echo "🛑 Shutting down servers..."
  
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
    echo "  ✅ Backend stopped"
  fi
  
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
    echo "  ✅ Frontend stopped"
  fi
  
  echo "👋 Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "🔧 Starting backend server..."

if command -v bun &> /dev/null; then
  echo "  Using Bun runtime"
  bun backend/src/index.ts &
  BACKEND_PID=$!
else
  echo "  Using Node.js runtime (Bun not available)"
  cd backend
  pnpm dev:node &
  BACKEND_PID=$!
  cd ..
fi

echo "  ✅ Backend started (PID: $BACKEND_PID)"

sleep 3

echo ""
echo "🔧 Starting frontend development server..."
cd frontend
VITE_API_URL=http://127.0.0.1:$BACKEND_PORT pnpm dev --host 127.0.0.1 --port $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

echo "  ✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

sleep 2

echo "✅ All servers are running!"
echo ""
echo "📱 Access the application at:"
echo "   http://127.0.0.1:$FRONTEND_PORT"
echo ""
echo "🔗 API endpoint:"
echo "   http://127.0.0.1:$BACKEND_PORT"
echo ""
echo "💡 Tips:"
echo "   - To access from other devices on your network, use your device's IP"
echo "   - Configure HOST=0.0.0.0 in .env to allow external connections"
echo "   - Press Ctrl+C to stop all servers"
echo ""
echo "📝 Watching for changes..."

wait
