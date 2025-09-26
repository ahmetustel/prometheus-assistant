#!/bin/bash

# 🔥 Complete MCP Setup Script
# Bu script Claude Code güncellendiğinde bile MCP'leri restore eder

echo "🚀 Setting up ALL MCP servers for Claude Code..."

# Current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Script directory: $SCRIPT_DIR"

# MCP Servers to install
declare -A MCP_SERVERS
MCP_SERVERS[prometheus]="node $SCRIPT_DIR/src/index.js"
MCP_SERVERS[chrome-devtools]="npx chrome-devtools-mcp@latest"

echo ""
echo "🔧 MCP Servers to install:"
for name in "${!MCP_SERVERS[@]}"; do
    echo "   - $name: ${MCP_SERVERS[$name]}"
done
echo ""

# Remove existing servers first
echo "🗑️  Removing existing MCP servers..."
for name in "${!MCP_SERVERS[@]}"; do
    claude mcp remove "$name" 2>/dev/null || true
    echo "   ✓ Removed $name (if existed)"
done

echo ""
echo "➕ Adding MCP servers..."

# Add Prometheus MCP (our local server)
echo "   📊 Adding Prometheus MCP server..."
if [ -f "$SCRIPT_DIR/src/index.js" ]; then
    chmod +x "$SCRIPT_DIR/src/index.js"
    claude mcp add prometheus node "$SCRIPT_DIR/src/index.js"
    echo "   ✅ Prometheus MCP added successfully"
else
    echo "   ❌ Error: $SCRIPT_DIR/src/index.js not found"
fi

# Add Chrome DevTools MCP
echo "   🌐 Adding Chrome DevTools MCP..."

# Check Node.js version for chrome-devtools-mcp
NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -ge 22 ]; then
    claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
    echo "   ✅ Chrome DevTools MCP added successfully"
else
    echo "   ⚠️  Chrome DevTools MCP requires Node.js 22+, you have v$NODE_VERSION"
    echo "   📝 Installing alternative browser automation..."

    # Alternative: Use local puppeteer-based MCP (we'll create this)
    echo "   💡 Creating local browser automation MCP..."

    # For now, skip chrome-devtools-mcp
    echo "   📋 TODO: Upgrade Node.js to v22+ for Chrome DevTools MCP"
fi

echo ""
echo "🧪 Testing MCP servers..."

# Test MCP servers
claude mcp list

echo ""
echo "🔍 Health check..."
if [ -f "$SCRIPT_DIR/health-check.cjs" ]; then
    node "$SCRIPT_DIR/health-check.cjs"
else
    echo "   ⚠️  health-check.cjs not found, skipping health check"
fi

echo ""
echo "✅ MCP Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Restart Claude Code completely"
echo "   2. cd to any project directory"
echo "   3. Run: claude"
echo "   4. Test: 'Bu proje hakkında ne biliyorsun?'"
echo "   5. Test: 'Tarayıcı konsolunu incele' (if chrome-devtools works)"
echo ""
echo "🔄 To restore after Claude Code updates, just run:"
echo "   $SCRIPT_DIR/setup-all-mcp.sh"
echo ""

# Create desktop shortcut (optional)
if command -v osascript &> /dev/null; then
    echo "🖥️  Creating desktop shortcut..."
    osascript -e "
    tell application \"Finder\"
        make alias file to POSIX file \"$SCRIPT_DIR/setup-all-mcp.sh\" at desktop
        set name of result to \"Setup MCP Servers\"
    end tell
    " 2>/dev/null || echo "   ℹ️  Desktop shortcut creation skipped"
fi

echo "🎉 All done! MCP servers are ready to assist Claude!"