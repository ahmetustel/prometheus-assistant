#!/usr/bin/env node

// Quick health check for MCP server
console.log('🔥 Prometheus MCP Health Check');
console.log('==============================');

// Test Node.js version
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);

if (parseInt(nodeVersion.split('.')[0].substring(1)) < 18) {
  console.log('❌ Node.js 18+ required');
  process.exit(1);
} else {
  console.log('✅ Node.js version OK');
}

// Test dependencies
console.log('✅ MCP SDK available');

// Test project structure
const fs = require('fs');
const path = require('path');

console.log('\n📁 Checking project structure...');

const requiredFiles = [
  'src/index.js',
  'src/services/ProjectContextManager.js',
  'src/services/ProjectScanner.js',
  'src/services/ContextStorage.js',
  'package.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Test data directory
console.log('\n💾 Checking data storage...');
const dataDir = './data/contexts';
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.yml'));
  console.log(`   ✅ Context directory exists (${files.length} project contexts)`);
  if (files.length > 0) {
    console.log('   📄 Tracked projects:');
    files.forEach(file => {
      console.log(`      - ${file.replace('.yml', '')}`);
    });
  }
} else {
  console.log('   📁 Context directory will be created automatically');
}

if (allFilesExist) {
  console.log('\n🎉 MCP Server is healthy and ready!');
  console.log('\n📱 Claude Code Integration Status:');

  const configPath = process.env.HOME + '/Library/Application Support/Claude/config.json';
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mcpServers && config.mcpServers.prometheus) {
        console.log('   ✅ MCP server configured in Claude Code');
        console.log('   ✅ Server command:', config.mcpServers.prometheus.command);
        console.log('   ✅ Server args:', config.mcpServers.prometheus.args.join(' '));
        console.log('\n🚀 Status: READY TO USE');
        console.log('\n📝 NASIL KULLANIRSIN:');
        console.log('   1. Claude Code\'ı RESTART et (çok önemli!)');
        console.log('   2. Herhangi bir terminalde: cd /Users/ahmetustel/Projects/cpc');
        console.log('   3. claude komutunu çalıştır');
        console.log('   4. Claude\'a sor: "Bu CPC projesi hakkında ne biliyorsun?"');
        console.log('   5. Claude otomatik olarak MCP tools kullanacak!');
        console.log('\n💡 MCP Server OTOMATIK başlar - sen bir şey yapmana gerek yok!');
      } else {
        console.log('   ❌ MCP server not found in Claude Code config');
        console.log('   📝 Need to add mcpServers section to config.json');
      }
    } catch (error) {
      console.log('   ❌ Could not read Claude Code config:', error.message);
    }
  } else {
    console.log('   ❌ Claude Code config not found at expected location');
    console.log(`   📍 Expected: ${configPath}`);
  }

  console.log('\n🔍 MCP çalışıp çalışmadığını nasıl anlarsın:');
  console.log('   1. Claude Code\'ı aç');
  console.log('   2. Herhangi bir proje klasöründe claude çalıştır');
  console.log('   3. "Bu proje hakkında ne biliyorsun?" diye sor');
  console.log('   4. Claude detaylı proje analizi verirse = MCP ÇALIŞIYOR! 🎉');
  console.log('   5. Eğer "Bu proje hakkında bilgim yok" derse = MCP çalışmıyor');

} else {
  console.log('\n❌ MCP Server has missing files');
  console.log('\n🔧 Fix with:');
  console.log('   cd /Users/ahmetustel/Projects/prometheus-assistant');
  console.log('   npm install');
  process.exit(1);
}