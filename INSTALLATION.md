# 🚀 Prometheus Assistant - Detaylı Kurulum Kılavuzu

Bu kılavuz, Prometheus Assistant'ı başka bilgisayarlara kurmak için adım adım talimatlar içerir.

## 🎯 Sistem Gereksinimleri

### Minimum Requirements

- **Node.js**: v18.0.0 veya üzeri
- **Docker**: ChromaDB için gerekli
- **Claude Code**: CLI sürümü kurulu
- **Git**: Repository clone etmek için
- **RAM**: Minimum 4GB (ChromaDB için)
- **Disk**: ~500MB (dependencies + data)

### Supported Operating Systems

- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu 20.04+, CentOS 8+)
- ✅ **Windows** (Windows 10+ with WSL2)

## 🔧 Adım 1: Temel Kurulum

### 1.1 Repository Clone

```bash
# Projeyi indir
git clone https://github.com/yourusername/prometheus-assistant.git
cd prometheus-assistant

# Branch kontrol et
git branch -a
git checkout main  # veya aktif branch
```

### 1.2 Node.js Version Check

```bash
# Node.js version kontrol
node --version
# v18.0.0 veya üzeri olmalı

# Eğer eski versiyon varsa:
# macOS/Linux için nvm kullan
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 1.3 Dependencies Install

```bash
# NPM packages yükle
npm install

# Eğer permission error alırsan:
sudo npm install --unsafe-perm=true --allow-root

# Başarı kontrolü
npm list --depth=0
```

## 🐳 Adım 2: ChromaDB Kurulumu

### 2.1 Docker Install (Eğer yoksa)

**macOS:**

```bash
# Homebrew ile
brew install --cask docker

# Veya Docker Desktop'tan indir
# https://www.docker.com/products/docker-desktop
```

**Linux:**

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Logout/login gerekebilir

# CentOS/RHEL
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

**Windows:**

```bash
# WSL2 + Docker Desktop gerekli
# https://docs.docker.com/desktop/windows/install/
```

### 2.2 ChromaDB Container Başlat

```bash
# Container'ı başlat
docker compose up -d

# Kontrol et
docker ps | grep chroma
# prometheus-chromadb çalışıyor olmalı

# Health check
curl http://localhost:8000/api/v1/heartbeat
# HTTP 410 alırsan normal (v1 API deprecated)
```

### 2.3 Port Conflicts Çözümü

```bash
# Eğer port 8000 meşgulse
docker ps | grep 8000

# Conflict varsa port değiştir
cp docker-compose.yml docker-compose.yml.backup
sed 's/8000:8000/8001:8000/g' docker-compose.yml > docker-compose.tmp
mv docker-compose.tmp docker-compose.yml

# Yeniden başlat
docker compose down
docker compose up -d
```

## 🔌 Adım 3: Claude Code Integration

### 3.1 Claude Code Version Check

```bash
# Claude Code kurulu mu?
which claude
claude --version

# Eğer kurulu değilse:
npm install -g @anthropics/claude-code

# Veya yarr
yarn global add @anthropics/claude-code
```

### 3.2 MCP Server Ekleme

**Otomatik Kurulum (Önerilen):**

```bash
# Setup script çalıştır
chmod +x setup-mcp.sh
./setup-mcp.sh
```

**Manuel Kurulum:**

```bash
# Tam path al
pwd
# /Users/username/Projects/prometheus-assistant

# MCP server ekle
claude mcp add prometheus node $(pwd)/src/index.js

# Test et
claude mcp list
# prometheus görünmeli
```

### 3.3 Permission Issues Çözümü

```bash
# Eğer permission denied alırsan:
chmod +x src/index.js
chmod -R 755 src/

# Config path sorunları için:
mkdir -p ~/.config/claude-desktop
mkdir -p ~/Library/Application\ Support/Claude

# MCP server'ı yeniden ekle
claude mcp remove prometheus
claude mcp add prometheus node $(pwd)/src/index.js
```

## 🧪 Adım 4: Test & Verification

### 4.1 Health Check

```bash
# Full system check
node health-check.cjs
```

**Expected Output:**

```
🔥 Prometheus MCP Health Check
✅ Node.js version OK (v18.19.0)
✅ MCP SDK available (0.4.0)
✅ ChromaDB connection OK (port 8000)
✅ Project structure OK
✅ MCP server configured in Claude Code
🚀 Status: READY TO USE
```

### 4.2 MCP Connection Test

```bash
# Terminal'de manual test
node src/index.js
# Server should start and wait for stdio input
# Ctrl+C ile çık
```

### 4.3 Claude Code Test

```bash
# Test projesi oluştur
mkdir ~/test-project
cd ~/test-project
echo "console.log('Hello World');" > test.js

# Claude Code başlat
claude

# Claude'da test:
/mcp
get_project_context("/Users/username/test-project")
```

**Expected Response:**

```
Project context loaded:
- Name: test-project
- Files: 1
- Languages: javascript
- Last scan: just now
```

## 🔍 Adım 5: Troubleshooting

### 5.1 Common Issues & Solutions

**Problem: "No MCP servers configured"**

```bash
# Solution:
claude mcp list
# Eğer boşsa:
claude mcp add prometheus node $(pwd)/src/index.js
```

**Problem: "ChromaDB connection failed"**

```bash
# Check Docker:
docker ps | grep chroma

# Restart if needed:
docker compose restart

# Check port:
netstat -an | grep 8000
```

**Problem: "Permission denied" on macOS**

```bash
# Fix permissions:
sudo xattr -dr com.apple.quarantine .
chmod +x src/index.js

# Re-add MCP:
claude mcp remove prometheus
claude mcp add prometheus node $(pwd)/src/index.js
```

**Problem: "Module not found"**

```bash
# Reinstall dependencies:
rm -rf node_modules package-lock.json
npm install

# Check NODE_PATH:
export NODE_PATH=$(npm root -g)
```

### 5.2 Debug Commands

```bash
# MCP debug
./debug-claude-mcp.sh

# ChromaDB debug
curl -v http://localhost:8000/api/v1/collections

# Docker debug
docker logs prometheus-chromadb

# File permissions debug
ls -la src/index.js
```

### 5.3 Log Locations

```bash
# MCP server logs
~/.config/claude-desktop/logs/

# Docker logs
docker logs prometheus-chromadb

# System logs (macOS)
tail -f /var/log/system.log | grep claude

# System logs (Linux)
journalctl -u docker -f
```

## 🚀 Adım 6: Production Setup

### 6.1 Auto-start Configuration

```bash
# Docker auto-start
docker update --restart unless-stopped prometheus-chromadb

# macOS LaunchAgent (optional)
cp extras/com.prometheus.assistant.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.prometheus.assistant.plist
```

### 6.2 Performance Optimization

```bash
# ChromaDB memory limits
docker-compose.yml içinde:
environment:
  - CHROMA_SERVER_MAX_MEMORY=2g
  - CHROMA_SERVER_WORKER_PROCESSES=2
```

### 6.3 Backup Setup

```bash
# Data backup script
#!/bin/bash
tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz \
  data/contexts/ \
  chroma_data/

# Cron job ekle
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

## 📋 Adım 7: Multi-Machine Setup

### 7.1 Shared ChromaDB (Network Setup)

```bash
# Server makinede (IP: 192.168.1.100)
docker-compose.yml içinde:
ports:
  - "0.0.0.0:8000:8000"

# Client makinelerde
export CHROMA_HOST=http://192.168.1.100:8000
```

### 7.2 Config Sync

```bash
# Config'i git ile sync et
git add data/contexts/
git commit -m "Update project contexts"
git push

# Diğer makinelerde
git pull
```

## ✅ Kurulum Tamamlandı!

### Final Check

```bash
# All-in-one test
cd ~/test-project
claude

# In Claude:
"Bu proje hakkında ne biliyorsun?"
```

**Success Response:**

```
Bu test-project projesini analiz ettim:

📁 **Proje Yapısı:**
- 1 dosya (test.js)
- JavaScript tabanlı
- Son güncelleme: az önce

🔍 **Dosyalar:**
- test.js: Simple console.log statement

📊 **Teknoloji Stack:**
- Language: JavaScript
- Type: Simple script

💾 **ChromaDB:**
- 1 chunk stored
- Semantic search ready
```

### Next Steps

1. **Real Project Test**: Gerçek bir projenizde test edin
2. **Team Rollout**: Ekip üyelerine kurulum talimatları verin
3. **Customization**: Proje gereksinimlerinize göre ayarları optimize edin

---

## 🆘 Support

Sorun yaşarsanız:

1. Bu kılavuzdaki troubleshooting adımlarını deneyin
2. GitHub Issues'de sorunu bildirin
3. Health check çıktısını ve error log'larını paylaşın

**Happy Coding! 🚀**
