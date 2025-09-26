#!/bin/bash

echo "🔍 Claude Code MCP Debug Tool"
echo "=============================="

echo "📋 System Information:"
echo "- Claude path: $(which claude)"
echo "- Node path: $(which node)"
echo "- NPM prefix: $(npm config get prefix)"
echo ""

echo "🔍 Searching for existing MCP configs..."

POSSIBLE_CONFIGS=(
    "$HOME/.config/claude-desktop/claude_desktop_config.json"
    "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    "$HOME/Library/Application Support/Claude/config.json"
    "$HOME/.claude_code_config.json"
    "$HOME/.claude-mcp-config.json"
    "$(npm config get prefix)/lib/node_modules/@anthropic-ai/claude-code/claude_desktop_config.json"
    "$HOME/.nvm/versions/node/v20.19.0/lib/node_modules/@anthropic-ai/claude-code/claude_desktop_config.json"
)

for config in "${POSSIBLE_CONFIGS[@]}"; do
    if [[ -f "$config" ]]; then
        echo "✅ FOUND: $config"
        echo "   Content preview:"
        head -3 "$config" | sed 's/^/     /'
        echo ""
    else
        echo "❌ NOT FOUND: $config"
    fi
done

echo ""
echo "🧪 Testing MCP Server manually..."
cd /Users/ahmetustel/Projects/prometheus-assistant

# Test if MCP server can run
timeout 3s node simple-test.js &
MCP_PID=$!
sleep 1

if ps -p $MCP_PID > /dev/null; then
    echo "✅ MCP Server can start successfully"
    kill $MCP_PID 2>/dev/null
else
    echo "❌ MCP Server failed to start"
fi

echo ""
echo "🔧 Recommended next steps:"
echo "1. Try running Claude with verbose logging"
echo "2. Check if Claude Code supports MCP in this version"
echo "3. Consider upgrading Claude Code to latest version"
echo ""
echo "💡 Alternative: Use claude mcp command to configure"