#!/bin/bash

# 🔄 MCP Restore Script - Claude Code güncellemeleri sonrası çalıştır
# Bu script Claude Code güncellendiğinde silinen MCP konfigürasyonunu restore eder

echo "🔄 Restoring MCP servers after Claude Code update..."

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Backup current config
echo "💾 Creating config backup..."
if [ -f ~/.claude.json ]; then
    cp ~/.claude.json ~/.claude.json.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ Backup created"
fi

# Remove any existing MCP servers (clean slate)
echo "🗑️  Cleaning existing MCP configuration..."
claude mcp remove prometheus 2>/dev/null || true
claude mcp remove browser-automation 2>/dev/null || true
claude mcp remove chrome-devtools 2>/dev/null || true

# Add Prometheus MCP
echo "📊 Adding Prometheus MCP server..."
if [ -f "$SCRIPT_DIR/src/index.js" ]; then
    chmod +x "$SCRIPT_DIR/src/index.js"
    claude mcp add prometheus node "$SCRIPT_DIR/src/index.js"
    echo "   ✅ Prometheus MCP restored"
else
    echo "   ❌ Error: Prometheus MCP not found at $SCRIPT_DIR/src/index.js"
    exit 1
fi

# Add Browser Automation MCP
echo "🌐 Adding Browser Automation MCP..."
if [ -f "$SCRIPT_DIR/browser-mcp/index.js" ]; then
    chmod +x "$SCRIPT_DIR/browser-mcp/index.js"

    # Check if dependencies are installed
    if [ ! -d "$SCRIPT_DIR/browser-mcp/node_modules" ]; then
        echo "   📦 Installing browser MCP dependencies..."
        cd "$SCRIPT_DIR/browser-mcp"
        npm install --silent --no-optional
        cd - > /dev/null
    fi

    claude mcp add browser-automation node "$SCRIPT_DIR/browser-mcp/index.js"
    echo "   ✅ Browser Automation MCP restored"
else
    echo "   ⚠️  Browser MCP not found, skipping..."
fi

# Test the setup
echo ""
echo "🧪 Testing MCP servers..."
claude mcp list

echo ""
echo "✅ MCP Restore Complete!"
echo ""
echo "📋 Your MCP servers are now restored:"
echo "   📊 Prometheus MCP - Project context and code analysis"
echo "   🌐 Browser Automation MCP - Console logs and browser control"
echo ""
echo "🔄 Next time Claude Code updates, just run:"
echo "   $SCRIPT_DIR/restore-mcp-after-update.sh"
echo ""
echo "🎉 Ready to use! Test with: claude"