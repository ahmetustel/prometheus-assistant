#!/bin/bash

echo "🔥 Prometheus MCP Server Installer"
echo "=================================="

# Check Claude installation type
CLAUDE_PATH=$(which claude)
echo "Claude path: $CLAUDE_PATH"

# Function to install MCP config
install_mcp_config() {
    local config_path="$1"
    local config_content='{
  "mcpServers": {
    "prometheus": {
      "command": "node",
      "args": ["'$HOME'/Projects/prometheus-assistant/src/index.js"],
      "env": {
        "NODE_PATH": "'$HOME'/Projects/prometheus-assistant/node_modules"
      }
    }
  }
}'

    echo "Installing MCP config to: $config_path"
    mkdir -p "$(dirname "$config_path")"
    echo "$config_content" > "$config_path"
    echo "✅ MCP config installed"
}

# Detect installation type and install accordingly
if [[ "$CLAUDE_PATH" == *"yarn"* ]]; then
    echo "📦 Detected: Yarn global installation"

    # Multiple possible locations for yarn global Claude
    YARN_CLAUDE_DIR="$HOME/.config/yarn/global/node_modules/@anthropic-ai/claude-code"
    CONFIG_LOCATIONS=(
        "$YARN_CLAUDE_DIR/claude_desktop_config.json"
        "$HOME/.config/claude-desktop/claude_desktop_config.json"
        "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        "$HOME/.claude-mcp-config.json"
    )

elif [[ "$CLAUDE_PATH" == *"homebrew"* ]] && [[ ! "$CLAUDE_PATH" == *"yarn"* ]]; then
    echo "🍺 Detected: Homebrew installation"
    CONFIG_LOCATIONS=(
        "$HOME/.config/claude-desktop/claude_desktop_config.json"
        "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    )

else
    echo "📱 Detected: Standard installation"
    CONFIG_LOCATIONS=(
        "$HOME/.config/claude-desktop/claude_desktop_config.json"
        "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        "$HOME/Library/Application Support/Claude/config.json"
    )
fi

# Install to all possible locations (one will work)
for config_path in "${CONFIG_LOCATIONS[@]}"; do
    install_mcp_config "$config_path"
done

echo ""
echo "🎯 POST-INSTALLATION STEPS:"
echo "1. Restart Claude Code completely (Cmd+Q then reopen)"
echo "2. Run: claude"
echo "3. Test with: /mcp"
echo "4. Test with: \"Use get_project_context for CPC project\""
echo ""
echo "🔄 AFTER CLAUDE UPDATES:"
echo "1. Run this script again: bash install-mcp.sh"
echo "2. This will restore your MCP configuration"
echo ""
echo "✅ Installation complete!"