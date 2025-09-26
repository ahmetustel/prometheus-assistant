#!/bin/bash
# backup-mcp-config.sh

echo "🔄 MCP Config Backup"

# Backup directory oluştur
BACKUP_DIR="$HOME/.prometheus-mcp-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Backup directory: $BACKUP_DIR"

# MCP configurations backup
echo "💾 Config files backup ediliyor..."

CONFIG_PATHS=(
    "$HOME/.config/claude-desktop/claude_desktop_config.json"
    "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    "$HOME/Library/Application Support/Claude/config.json"
    "$HOME/.claude_code_config.json"
    "$HOME/.claude-mcp-config.json"
)

for config in "${CONFIG_PATHS[@]}"; do
    if [[ -f "$config" ]]; then
        cp "$config" "$BACKUP_DIR/"
        echo "✅ Backed up: $config"
    fi
done

# Project contexts backup
if [[ -d "$HOME/Projects/prometheus-assistant/data/contexts" ]]; then
    cp -r "$HOME/Projects/prometheus-assistant/data/contexts" "$BACKUP_DIR/"
    echo "✅ Project contexts backed up"
fi

# Current claude path
which claude > "$BACKUP_DIR/claude_path.txt" 2>/dev/null
claude --version > "$BACKUP_DIR/claude_version.txt" 2>/dev/null
claude mcp list > "$BACKUP_DIR/mcp_servers.txt" 2>/dev/null || echo "No MCP servers" > "$BACKUP_DIR/mcp_servers.txt"

echo "✅ Backup completed: $BACKUP_DIR"