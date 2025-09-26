# 🔧 Prometheus MCP Troubleshooting Guide

Bu rehber, Prometheus MCP server kurulumu sırasında karşılaştığımız **gerçek sorunları** ve çözümlerini içerir.

## 🚨 Yaşadığımız Gerçek Sorunlar ve Çözümleri

### Problem 1: "No MCP servers configured"

**Belirti:**
```bash
/mcp
⎿  No MCP servers configured. Please run /doctor if this is unexpected.
```

**Sebep:** Claude Code farklı konfigürasyon dosyası arıyor.

**Çözüm:**
```bash
# 1. Claude Code sürümünü kontrol et
/doctor

# 2. Doğru MCP komutu kullan
claude mcp add prometheus node /path/to/prometheus-assistant/src/index.js

# 3. Permissions kontrol et
chmod +x /path/to/prometheus-assistant/src/index.js
```

### Problem 2: "Failed to reconnect to prometheus"

**Belirti:**
```bash
/mcp
⎿  Failed to reconnect to prometheus.
```

**Sebep:** File execute permissions yok.

**Çözüm:**
```bash
# File permissions düzelt
chmod +x ~/Projects/prometheus-assistant/src/index.js
chmod -R 755 ~/Projects/prometheus-assistant/src/

# MCP server'ı yeniden ekle
claude mcp remove prometheus
claude mcp add prometheus node ~/Projects/prometheus-assistant/src/index.js
```

### Problem 3: Config Dosyası Bulunamıyor

**Belirti:** MCP eklendi ama `/mcp` görmüyor.

**Sebep:** Claude Code farklı kurulum tiplerine göre farklı config yerlerinde arıyor.

**NPM Global (En Yaygın):**
```bash
# Kontrol:
which claude
# /Users/user/.nvm/versions/node/vX.X.X/bin/claude

# Çözüm: claude mcp komutu kullan
claude mcp add prometheus node /path/to/src/index.js
```

**Yarn Global:**
```bash
# Kontrol:
which claude
# /opt/homebrew/bin/claude -> yarn/global/...

# Çözüm: Aynı komut çalışır
claude mcp add prometheus node /path/to/src/index.js
```

**Manuel Config Gerekliyse:**
```bash
# Farklı lokasyonları dene
mkdir -p ~/.config/claude-desktop
cat > ~/.config/claude-desktop/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "prometheus": {
      "command": "node",
      "args": ["/full/path/to/prometheus-assistant/src/index.js"]
    }
  }
}
EOF
```

### Problem 4: "permission denied" Hatası

**Belirti:**
```bash
zsh: permission denied: /Users/.../prometheus-assistant/src/index.js
```

**Sebep:** JavaScript dosyası execute permission'ına sahip değil.

**Çözüm:**
```bash
# Shebang ekle (eğer yoksa)
head -1 ~/Projects/prometheus-assistant/src/index.js
# #!/usr/bin/env node olmalı

# Execute permission ver
chmod +x ~/Projects/prometheus-assistant/src/index.js

# Tüm src/ klasörüne permission ver
chmod -R 755 ~/Projects/prometheus-assistant/src/

# Test et
node ~/Projects/prometheus-assistant/src/index.js
# Server başlamalı ve stdio'da beklemeli
```

### Problem 5: MCP Tools Çalışmıyor

**Belirti:** MCP server görünüyor ama tools çalışmıyor.

**Sebeb:** Dependencies eksik veya server crash oluyor.

**Çözüm:**
```bash
# Dependencies kontrol
cd ~/Projects/prometheus-assistant
npm install

# MCP SDK'nın yüklendiğini kontrol et
ls node_modules/@modelcontextprotocol/

# Server'ı manual test et
timeout 5s node src/index.js
# Error çıkarsa dependency sorunu var

# Common fix: MCP SDK yeniden yükle
npm install @modelcontextprotocol/sdk
```

### Problem 6: "Config install method: unknown"

**Belirti:**
```bash
/doctor
└ Config install method: unknown
```

**Sebep:** Claude Code kurulum tipini tanımıyor.

**Çözüm:**
```bash
# Kurulum tipini manuel belirle ve test et
which claude
npm ls -g @anthropic-ai/claude-code  # NPM global ise
yarn global list | grep claude       # Yarn global ise

# MCP'yi manuel ekle
claude mcp add prometheus node $(pwd)/src/index.js

# Test et
claude mcp list
# prometheus server listede görünmeli
```

## 🧪 Debug Tools

### 1. Health Check
```bash
cd prometheus-assistant
node health-check.cjs
```

**Beklenen Output:**
```
🔥 Prometheus MCP Health Check
==============================
Node.js version: v20.19.0
✅ Node.js version OK
✅ MCP SDK available
✅ Project structure OK
✅ MCP server configured in Claude Code
🚀 Status: READY TO USE
```

### 2. MCP Debug
```bash
./debug-claude-mcp.sh
```

**Bu script:**
- Config dosyalarının yerlerini kontrol eder
- MCP server'ın manuel çalışıp çalışmadığını test eder
- Possible config locations'ları tarar

### 3. Manual Server Test
```bash
cd prometheus-assistant

# Server'ı başlat (5 saniye timeout)
timeout 5s node src/index.js

# Eğer hata verirse:
# 1. Dependencies eksik
# 2. File permissions yanlış
# 3. Node.js sürüm uyumsuzluğu
```

## 📋 Sistemli Debug Süreci

Sorun yaşarsan bu sırayı takip et:

### Adım 1: Basic Kontroller
```bash
# Claude Code çalışıyor mu?
claude --version

# Node.js uygun sürümde mi?
node --version  # 18+ olmalı

# Prometheus dosyaları var mı?
ls -la ~/Projects/prometheus-assistant/src/index.js
```

### Adım 2: MCP Status
```bash
# MCP command çalışıyor mu?
claude mcp --help

# Mevcut MCP servers
claude mcp list

# /doctor output
/doctor
```

### Adım 3: File Permissions
```bash
# Execute permissions
ls -la ~/Projects/prometheus-assistant/src/index.js
# -rwxr-xr-x olmalı (x'ler önemli)

# Fix permissions
chmod +x ~/Projects/prometheus-assistant/src/index.js
chmod -R 755 ~/Projects/prometheus-assistant/src/
```

### Adım 4: Dependencies
```bash
cd ~/Projects/prometheus-assistant

# Package.json var mı?
cat package.json

# Dependencies yüklü mü?
npm list

# MCP SDK var mı?
ls node_modules/@modelcontextprotocol/
```

### Adım 5: Manual Test
```bash
# Server manual başlayabiliyor mu?
cd ~/Projects/prometheus-assistant
node src/index.js &
SERVER_PID=$!
sleep 2

# Process çalışıyor mu?
ps -p $SERVER_PID

# Kill test server
kill $SERVER_PID
```

### Adım 6: Clean Reinstall
```bash
# MCP server'ı temizle
claude mcp remove prometheus

# Dependencies'i yenile
cd ~/Projects/prometheus-assistant
rm -rf node_modules package-lock.json
npm install

# Permissions tekrar ver
chmod +x src/index.js
chmod -R 755 src/

# MCP server'ı tekrar ekle
claude mcp add prometheus node $(pwd)/src/index.js

# Test et
claude mcp list
/mcp
```

## 🔄 Farklı Sistemlerde Kurulum

### macOS (Intel/M1)
```bash
# Homebrew varsa
which brew && echo "Homebrew OK"

# Node.js NVM ile
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Claude Code npm ile
npm install -g @anthropic-ai/claude-code
```

### Linux (Ubuntu/Debian)
```bash
# Node.js kurulum
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Claude Code kurulum
npm install -g @anthropic-ai/claude-code

# Prometheus kurulum
git clone <repo-url>
cd prometheus-assistant
npm install
chmod +x src/index.js
claude mcp add prometheus node $(pwd)/src/index.js
```

### Windows (WSL2)
```bash
# WSL2'de Linux komutları çalışır
# Yukarıdaki Linux adımlarını takip et

# Windows path'ları için
# /mnt/c/Users/... path'larını kullan
```

## ⚠️ Common Gotchas

### 1. Path Issues
```bash
# ❌ Relative path kullanma
claude mcp add prometheus node ./src/index.js

# ✅ Absolute path kullan
claude mcp add prometheus node $(pwd)/src/index.js
# veya
claude mcp add prometheus node /full/path/to/prometheus-assistant/src/index.js
```

### 2. Node Modules
```bash
# ❌ Global node_modules'e güvenme
npm install -g @modelcontextprotocol/sdk

# ✅ Local dependencies kullan
cd prometheus-assistant
npm install @modelcontextprotocol/sdk
```

### 3. File Extensions
```bash
# JavaScript files için shebang gerekli
head -1 src/index.js
# #!/usr/bin/env node

# Execute permission gerekli
chmod +x src/index.js
```

## 📞 Yardım Alma

Sorun devam ederse:

1. **Health check çalıştır:** `node health-check.cjs`
2. **Debug script çalıştır:** `./debug-claude-mcp.sh`
3. **Log output'u paylaş:** Issue açarken tüm debug output'ları ekle
4. **System info paylaş:** OS, Node.js version, Claude Code version

## 🎯 En Yaygın 3 Sorun ve Hızlı Çözümler

### 1. MCP Görünmüyor → `claude mcp add` kullan
### 2. "Failed to reconnect" → `chmod +x` ile permission ver
### 3. Tools çalışmıyor → `npm install` dependencies'i yükle

Bu rehber ile artık başka bilgisayarlara kurulum sorunsuz olacak! 🚀