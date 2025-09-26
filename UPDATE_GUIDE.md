# 🔄 Prometheus MCP - Update Safe Guide

Bu rehber, Claude Code güncellemeleri ve sistem değişiklikleri sonrasında Prometheus MCP'nin çalışmaya devam etmesi için gereken adımları açıklar.

## 🚨 Neden Update Sonrası Sorun Yaşanır?

### Claude Code Update'leri
```bash
# Yaygın update komutları:
npm update -g @anthropic-ai/claude-code
yarn global upgrade @anthropic-ai/claude-code

# Bu komutlar şunları sıfırlar:
❌ MCP server configurations
❌ Custom config files
❌ Local project settings (.claude.json)
```

### Node.js Sürüm Değişiklikleri
```bash
# NVM ile Node.js değişimi:
nvm install 22
nvm use 22

# Bu değişimle:
❌ Global packages yeniden kurulmalı
❌ npm prefix path'i değişir
❌ MCP config paths invalid olur
```

### Sistem Migration
- Yeni bilgisayar kurulumu
- MacOS reinstall / update
- Development environment değişimi

## ✅ Update-Safe Prosedürler

### 1. Claude Code Update Öncesi Backup

```bash
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
which claude > "$BACKUP_DIR/claude_path.txt"
claude --version > "$BACKUP_DIR/claude_version.txt"
claude mcp list > "$BACKUP_DIR/mcp_servers.txt" 2>/dev/null || echo "No MCP servers" > "$BACKUP_DIR/mcp_servers.txt"

echo "✅ Backup completed: $BACKUP_DIR"
```

### 2. Claude Code Update Sonrası Restore

```bash
#!/bin/bash
# restore-mcp-after-update.sh

echo "🔄 Claude Code Update Sonrası MCP Restore"
echo "========================================"

# Find latest backup
LATEST_BACKUP=$(ls -dt $HOME/.prometheus-mcp-backup-* 2>/dev/null | head -1)

if [[ -z "$LATEST_BACKUP" ]]; then
    echo "⚠️  Backup bulunamadı, fresh install yapılıyor..."
    exec ./setup-mcp.sh
    exit $?
fi

echo "📦 Latest backup: $LATEST_BACKUP"

# Check if Claude Code still exists
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code bulunamadı!"
    echo "Lütfen önce Claude Code'u yeniden kurun:"
    echo "  npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Check path change
OLD_CLAUDE_PATH=$(cat "$LATEST_BACKUP/claude_path.txt" 2>/dev/null)
NEW_CLAUDE_PATH=$(which claude)

if [[ "$OLD_CLAUDE_PATH" != "$NEW_CLAUDE_PATH" ]]; then
    echo "⚠️  Claude Code path değişmiş:"
    echo "  Old: $OLD_CLAUDE_PATH"
    echo "  New: $NEW_CLAUDE_PATH"
    echo "  Fresh configuration gerekli..."
fi

# Restore configurations
echo "💾 Config files restore ediliyor..."

# Remove old prometheus server (if exists)
claude mcp remove prometheus 2>/dev/null || true

# Re-add MCP server with current paths
PROMETHEUS_PATH="$HOME/Projects/prometheus-assistant/src/index.js"

if [[ -f "$PROMETHEUS_PATH" ]]; then
    # Fix permissions
    chmod +x "$PROMETHEUS_PATH"
    chmod -R 755 "$HOME/Projects/prometheus-assistant/src/"

    # Add MCP server
    if claude mcp add prometheus node "$PROMETHEUS_PATH"; then
        echo "✅ MCP Server restored successfully!"
    else
        echo "❌ MCP Server restore failed!"
        exit 1
    fi
else
    echo "❌ Prometheus files bulunamadı: $PROMETHEUS_PATH"
    exit 1
fi

# Restore project contexts (if exists)
if [[ -d "$LATEST_BACKUP/contexts" ]]; then
    mkdir -p "$HOME/Projects/prometheus-assistant/data"
    cp -r "$LATEST_BACKUP/contexts" "$HOME/Projects/prometheus-assistant/data/"
    echo "✅ Project contexts restored"
fi

# Test
if claude mcp list | grep -q "prometheus"; then
    echo "✅ MCP Server test başarılı!"
    echo "🎉 Restore tamamlandı!"
else
    echo "❌ MCP Server test failed!"
    exit 1
fi
```

### 3. Automated Update Detection

```bash
#!/bin/bash
# check-mcp-health.sh (Cron job için)

# MCP server çalışıyor mu kontrol et
if ! claude mcp list 2>/dev/null | grep -q "prometheus"; then
    echo "$(date): MCP Server not found, attempting restore..." >> ~/prometheus-mcp.log

    # Auto-restore attempt
    cd "$HOME/Projects/prometheus-assistant"
    ./restore-mcp-after-update.sh >> ~/prometheus-mcp.log 2>&1

    if [[ $? -eq 0 ]]; then
        echo "$(date): MCP Server auto-restored successfully" >> ~/prometheus-mcp.log
    else
        echo "$(date): MCP Server auto-restore failed, manual intervention needed" >> ~/prometheus-mcp.log
    fi
fi
```

## 🛠️ Farklı Update Senaryoları

### Scenario 1: NPM Global Claude Code Update

```bash
# Update öncesi
./backup-mcp-config.sh

# Claude Code update
npm update -g @anthropic-ai/claude-code

# Restore
./restore-mcp-after-update.sh

# Test
claude mcp list
/mcp (Claude Code'da)
```

### Scenario 2: Node.js Version Change

```bash
# Mevcut durumu kaydet
which claude > old_claude_path.txt
which node > old_node_path.txt

# Node.js değiştir
nvm install 22
nvm use 22

# Claude Code yeniden kur
npm install -g @anthropic-ai/claude-code

# MCP restore
cd ~/Projects/prometheus-assistant
./setup-mcp.sh
```

### Scenario 3: System Migration (Yeni Bilgisayar)

```bash
# Eski bilgisayarda
cd ~/Projects/prometheus-assistant
tar -czf prometheus-mcp-backup.tar.gz \
  src/ \
  data/ \
  *.md \
  *.sh \
  *.json \
  *.cjs

# Yeni bilgisayarda
# 1. Node.js kur
# 2. Claude Code kur
# 3. Prometheus restore et

scp old-computer:~/prometheus-mcp-backup.tar.gz .
tar -xzf prometheus-mcp-backup.tar.gz -C ~/Projects/
cd ~/Projects/prometheus-assistant
npm install
./setup-mcp.sh
```

### Scenario 4: Yarn ↔ NPM Migration

```bash
# Yarn'dan NPM'e geçiş
yarn global remove @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# MCP config update
claude mcp remove prometheus
claude mcp add prometheus node ~/Projects/prometheus-assistant/src/index.js

# Test
claude mcp list
```

## 📋 Update Checklist

### Claude Code Update Sonrası Kontrol Listesi

- [ ] `claude --version` - Version updated?
- [ ] `claude mcp list` - Prometheus server görünüyor mu?
- [ ] `/mcp` (Claude Code'da) - MCP working?
- [ ] `node ~/Projects/prometheus-assistant/health-check.cjs` - Health OK?
- [ ] Test project context - "Bu proje hakkında ne biliyorsun?"

### Troubleshooting After Update

```bash
# 1. Basic checks
which claude
claude --version
node --version

# 2. Permissions
ls -la ~/Projects/prometheus-assistant/src/index.js
chmod +x ~/Projects/prometheus-assistant/src/index.js

# 3. Dependencies
cd ~/Projects/prometheus-assistant
npm install

# 4. Re-add MCP
claude mcp remove prometheus
claude mcp add prometheus node $(pwd)/src/index.js

# 5. Test
claude mcp list
```

## 🤖 Automated Update Safety

### Cron Job Setup (Optional)

```bash
# Günlük MCP health check
crontab -e

# Add line:
0 9 * * * /Users/ahmetustel/Projects/prometheus-assistant/check-mcp-health.sh
```

### Git Hook Integration

```bash
# .git/hooks/post-merge
#!/bin/bash
# Prometheus auto-update after git pull

if [[ -f "package.json" ]] && grep -q "@anthropic-ai/claude-code" package.json; then
    echo "Claude Code dependency found, checking MCP health..."
    ./check-mcp-health.sh
fi
```

### Environment Variable Backup

```bash
# ~/.bashrc or ~/.zshrc
export PROMETHEUS_MCP_PATH="$HOME/Projects/prometheus-assistant"
export CLAUDE_MCP_AUTO_RESTORE="true"

# Auto-check function
prometheus_health() {
    if ! claude mcp list 2>/dev/null | grep -q "prometheus"; then
        echo "🔄 MCP Server not found, auto-restoring..."
        cd "$PROMETHEUS_MCP_PATH" && ./setup-mcp.sh
    else
        echo "✅ Prometheus MCP healthy"
    fi
}

# Alias for quick check
alias pmcp="prometheus_health"
```

## 🎯 Best Practices Summary

### 1. **Always Backup Before Updates**
```bash
# Her major update öncesi
./backup-mcp-config.sh
```

### 2. **Use Automated Setup Scripts**
```bash
# Manual config yerine
./setup-mcp.sh
```

### 3. **Version Control Everything**
```bash
git add -A
git commit -m "Working MCP configuration backup"
```

### 4. **Test After Every Change**
```bash
claude mcp list
# Test in Claude Code:
/mcp
"Bu proje hakkında ne biliyorsun?"
```

### 5. **Monitor Health Regularly**
```bash
# Haftalık check
node health-check.cjs
```

## 🚀 Emergency Recovery

Eğer hiçbir şey çalışmıyorsa:

```bash
# Nuclear option: Complete fresh install
cd ~/Projects/prometheus-assistant
rm -rf node_modules package-lock.json
npm install
chmod -R 755 src/
claude mcp remove prometheus
claude mcp add prometheus node $(pwd)/src/index.js
```

Bu prosedürlerle Claude Code güncellemelerinden sonra da Prometheus MCP sisteminiz sorunsuz çalışmaya devam edecek! 🔒