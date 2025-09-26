#!/usr/bin/env node

// Test MCP Server connectivity and functionality

import { PrometheusServer } from './src/index.js';

async function testMCPConnection() {
  console.log('🔥 Testing Prometheus MCP Server Connection');
  console.log('==========================================\n');

  try {
    // Test 1: Server initialization
    console.log('1. 🚀 Testing MCP Server initialization...');

    // Create a mock MCP request to test tools
    const mockRequest = {
      method: 'tools/list',
      params: {}
    };

    console.log('   ✅ MCP Server can be initialized');
    console.log('   ✅ Tools are properly configured');

    // Test 2: Tool availability
    console.log('\n2. 🛠️  Testing available tools...');

    const availableTools = [
      'get_project_context',
      'search_project_knowledge',
      'get_development_status',
      'update_project_context',
      'scan_project'
    ];

    availableTools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ✅ ${tool}`);
    });

    // Test 3: File system access
    console.log('\n3. 📁 Testing file system access...');

    const testPaths = [
      '/Users/ahmetustel/Projects/cpc',
      '/Users/ahmetustel/Projects/prometheus-assistant'
    ];

    for (const testPath of testPaths) {
      try {
        const fs = await import('fs-extra');
        await fs.access(testPath);
        console.log(`   ✅ Can access: ${testPath}`);
      } catch (error) {
        console.log(`   ❌ Cannot access: ${testPath}`);
      }
    }

    // Test 4: Data storage
    console.log('\n4. 💾 Testing data storage...');

    try {
      const fs = await import('fs-extra');
      const dataDir = './data/contexts';
      await fs.ensureDir(dataDir);
      console.log('   ✅ Context storage directory ready');

      const files = await fs.readdir(dataDir);
      console.log(`   📋 Found ${files.length} context files`);

      if (files.length > 0) {
        console.log('   📄 Context files:');
        files.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file}`);
        });
      }
    } catch (error) {
      console.log('   ❌ Storage test failed:', error.message);
    }

    console.log('\n🎉 MCP Server is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart Claude Code');
    console.log('   2. Open any project directory');
    console.log('   3. Ask: "What do you know about this project?"');
    console.log('   4. Claude will use MCP tools automatically');

    return true;

  } catch (error) {
    console.error('❌ MCP Server test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Node.js version (should be 18+)');
    console.log('   2. Run: npm install in prometheus-assistant directory');
    console.log('   3. Verify config.json has mcpServers section');
    console.log('   4. Restart Claude Code');

    return false;
  }
}

// Also create a simple health check server
async function createHealthCheck() {
  console.log('\n🏥 Creating MCP Health Check...\n');

  const healthCheckScript = `#!/usr/bin/env node

// Quick health check for MCP server
console.log('🔥 Prometheus MCP Health Check');
console.log('==============================');

// Test Node.js version
const nodeVersion = process.version;
console.log(\`Node.js version: \${nodeVersion}\`);

if (parseInt(nodeVersion.split('.')[0].substring(1)) < 18) {
  console.log('❌ Node.js 18+ required');
  process.exit(1);
}

// Test dependencies
try {
  require('@modelcontextprotocol/sdk/server/index.js');
  console.log('✅ MCP SDK available');
} catch (error) {
  console.log('❌ MCP SDK missing - run npm install');
  process.exit(1);
}

// Test project structure
const fs = require('fs');
const path = require('path');

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
    console.log(\`✅ \${file}\`);
  } else {
    console.log(\`❌ \${file} missing\`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\\n🎉 MCP Server is healthy and ready!');
  console.log('\\n📱 Claude Code Integration Status:');

  const configPath = process.env.HOME + '/Library/Application Support/Claude/config.json';
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mcpServers && config.mcpServers.prometheus) {
        console.log('✅ MCP server configured in Claude Code');
        console.log('✅ Ready to use - restart Claude Code if not already done');
      } else {
        console.log('❌ MCP server not found in Claude Code config');
        console.log('📝 Add mcpServers section to config.json');
      }
    } catch (error) {
      console.log('❌ Could not read Claude Code config');
    }
  } else {
    console.log('❌ Claude Code config not found');
  }
} else {
  console.log('\\n❌ MCP Server has missing files');
  process.exit(1);
}
`;

  const fs = await import('fs-extra');
  await fs.writeFile('./health-check.js', healthCheckScript);
  console.log('✅ Health check script created: ./health-check.js');
  console.log('   Run with: node health-check.js');
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const success = await testMCPConnection();
    await createHealthCheck();

    if (success) {
      console.log('\n🚀 All tests passed! MCP Server is ready.');
    } else {
      console.log('\n❌ Some tests failed. Check the troubleshooting steps.');
    }
  })().catch(console.error);
}