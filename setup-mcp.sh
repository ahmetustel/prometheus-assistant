#!/bin/bash

# 🔥 Prometheus MCP Otomatik Kurulum Scripti
# Bu script, karşılaştığımız tüm sorunları otomatik çözer

set -e  # Exit on any error

echo "🔥 Prometheus MCP Server - Otomatik Kurulum"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

echo "🔍 Sistem Kontrolü"
echo "=================="

# 1. Node.js version check
print_info "Node.js sürümü kontrol ediliyor..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
if [[ "$NODE_VERSION" == "not found" ]]; then
    print_error "Node.js bulunamadı!"
    print_info "Lütfen Node.js 18+ kurun: https://nodejs.org/"
    exit 1
fi

NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
if [[ $NODE_MAJOR -lt 18 ]]; then
    print_error "Node.js sürümü çok eski: $NODE_VERSION"
    print_info "En az Node.js 18.0.0 gerekli"
    exit 1
fi

print_success "Node.js sürümü OK: $NODE_VERSION"

# 2. Claude Code check
print_info "Claude Code kontrol ediliyor..."
if ! command -v claude &> /dev/null; then
    print_error "Claude Code bulunamadı!"
    print_info "Lütfen Claude Code kurun: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

CLAUDE_PATH=$(which claude)
print_success "Claude Code bulundu: $CLAUDE_PATH"

# 3. Claude Code type detection
print_info "Claude Code kurulum tipi tespit ediliyor..."
if [[ "$CLAUDE_PATH" == *"nvm"* ]]; then
    INSTALL_TYPE="npm-global"
elif [[ "$CLAUDE_PATH" == *"yarn"* ]]; then
    INSTALL_TYPE="yarn-global"
elif [[ "$CLAUDE_PATH" == *"homebrew"* ]]; then
    INSTALL_TYPE="homebrew"
else
    INSTALL_TYPE="unknown"
fi

print_info "Kurulum tipi: $INSTALL_TYPE"

echo ""
echo "📦 Dependencies Kurulumu"
echo "========================"

# 4. Project dependencies
print_info "Proje dependencies kontrol ediliyor..."
cd "$PROJECT_DIR"

if [[ ! -f "package.json" ]]; then
    print_error "package.json bulunamadı!"
    exit 1
fi

if [[ ! -d "node_modules" ]] || [[ ! -d "node_modules/@modelcontextprotocol" ]]; then
    print_info "Dependencies yükleniyor..."
    npm install
    print_success "Dependencies yüklendi"
else
    print_success "Dependencies zaten yüklü"
fi

echo ""
echo "🔧 File Permissions"
echo "==================="

# 5. Fix file permissions
print_info "File permissions ayarlanıyor..."

# Main server file
if [[ -f "$PROJECT_DIR/src/index.js" ]]; then
    chmod +x "$PROJECT_DIR/src/index.js"
    print_success "src/index.js execute permission verildi"
else
    print_error "src/index.js bulunamadı!"
    exit 1
fi

# All src files
chmod -R 755 "$PROJECT_DIR/src/"
print_success "src/ klasörü permissions ayarlandı"

# Test scripts
if [[ -f "$PROJECT_DIR/simple-test.js" ]]; then
    chmod +x "$PROJECT_DIR/simple-test.js"
fi

if [[ -f "$PROJECT_DIR/health-check.cjs" ]]; then
    chmod +x "$PROJECT_DIR/health-check.cjs"
fi

echo ""
echo "🧪 MCP Server Test"
echo "=================="

# 6. Test MCP server manually
print_info "MCP Server manual test ediliyor..."

cd "$PROJECT_DIR"

# Test server can start
timeout 3s node src/index.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 1

if ps -p $SERVER_PID > /dev/null 2>&1; then
    print_success "MCP Server başarıyla çalışıyor"
    kill $SERVER_PID 2>/dev/null || true
else
    print_error "MCP Server başlatılamadı!"
    print_info "Dependencies veya permissions sorunu olabilir"
    exit 1
fi

echo ""
echo "⚙️  Claude Code MCP Entegrasyonu"
echo "================================="

# 7. Claude Code MCP integration
print_info "Mevcut MCP servers kontrol ediliyor..."

# Remove existing prometheus server if exists
if claude mcp list 2>/dev/null | grep -q "prometheus"; then
    print_warning "Mevcut prometheus server bulundu, kaldırılıyor..."
    claude mcp remove prometheus 2>/dev/null || true
fi

# Add MCP server
print_info "Prometheus MCP server ekleniyor..."
MCP_SERVER_PATH="$PROJECT_DIR/src/index.js"

if claude mcp add prometheus node "$MCP_SERVER_PATH" 2>/dev/null; then
    print_success "MCP Server Claude Code'a eklendi!"
else
    print_error "MCP Server eklenemedi!"
    print_info "Manuel ekleme deneyin: claude mcp add prometheus node $MCP_SERVER_PATH"
    exit 1
fi

echo ""
echo "✅ Kurulum Testi"
echo "================"

# 8. Final verification
print_info "MCP Server test ediliyor..."

if claude mcp list | grep -q "prometheus"; then
    print_success "Prometheus MCP Server başarıyla yapılandırıldı!"
else
    print_error "MCP Server listelenmedi!"
    print_info "Manual test: claude mcp list"
    exit 1
fi

echo ""
echo "🎯 Kurulum Tamamlandı!"
echo "======================"
print_success "Prometheus MCP Server kurulumu başarıyla tamamlandı!"
echo ""

print_info "Test etmek için:"
echo "  1. Claude Code'u başlatın: cd /path/to/your/project && claude"
echo "  2. MCP kontrol: /mcp"
echo "  3. Test komutu: \"Bu proje hakkında ne biliyorsun?\""
echo ""

print_info "Available MCP Tools:"
echo "  • get_project_context     - Proje detaylı analizi"
echo "  • search_project_knowledge - Akıllı kod arama"
echo "  • get_development_status  - Geliştirme durumu"
echo "  • update_project_context  - Notlar ve kararlar"
echo "  • scan_project           - Proje yeniden analizi"
echo ""

print_warning "Önemli Notlar:"
echo "  • Claude Code güncellemesi sonrası bu scripti tekrar çalıştırın"
echo "  • Sorun yaşarsanız: node health-check.cjs çalıştırın"
echo "  • Debug için: ./debug-claude-mcp.sh kullanın"
echo ""

echo "🚀 Artık Claude Code projenizi hatırlayacak!"
echo ""

# Create success flag file
touch "$PROJECT_DIR/.mcp-setup-complete"

print_success "Setup tamamlandı! Happy coding! 🎉"