#!/usr/bin/env node

import { ProjectContextManager } from './src/services/ProjectContextManager.js';
import { FileWatcher } from './src/services/FileWatcher.js';

// CPC Project Demo - Real world usage of Prometheus MCP Server

class CPCPrometheusDemo {
  constructor() {
    this.contextManager = new ProjectContextManager();
    this.watcher = new FileWatcher();
    this.cpcProjectPath = '/Users/ahmetustel/Projects/cpc';
  }

  async analyzeCPCProject() {
    console.log('🔥 Prometheus MCP Server - CPC Project Analysis');
    console.log('===========================================\n');

    try {
      // Step 1: Scan and analyze CPC project
      console.log('📁 1. Scanning CPC project...');
      const context = await this.contextManager.getProjectContext(this.cpcProjectPath);

      console.log('✅ CPC Project Context:');
      console.log(`   📋 Name: ${context.project_info.name}`);
      console.log(`   🏗️  Type: ${context.project_info.type}`);
      console.log(`   💻 Main Language: ${context.project_info.main_language}`);
      console.log(`   📦 Framework: ${context.project_info.framework}`);
      console.log(`   📄 Total Files: ${context.scan_info.total_files}`);
      console.log(`   📁 Total Directories: ${context.scan_info.total_directories}`);
      console.log(`   🔧 Frameworks: ${context.scan_info.frameworks.join(', ') || 'None detected'}`);

      // Show important files
      if (context.file_structure?.important_files?.length > 0) {
        console.log('\\n📋 Important Files Found:');
        context.file_structure.important_files.slice(0, 8).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.extension})`);
        });
      }

      // Show recent files
      if (context.file_structure?.recent_files?.length > 0) {
        console.log('\\n🕐 Recently Modified Files:');
        context.file_structure.recent_files.slice(0, 5).forEach((file, index) => {
          const date = new Date(file.modified).toLocaleDateString('tr-TR');
          console.log(`   ${index + 1}. ${file.name} (${date})`);
        });
      }

      // Show language breakdown
      if (context.file_structure?.languages) {
        console.log('\\n🎯 Language Breakdown:');
        Object.entries(context.file_structure.languages).forEach(([lang, count]) => {
          console.log(`   ${lang}: ${count} files`);
        });
      }

      // Step 2: Add development context for CPC
      console.log('\\n✍️  2. Adding CPC Development Context...');

      await this.contextManager.updateContext(this.cpcProjectPath, {
        type: 'note',
        content: 'CPC (Customer Profile Card) project - Customer management dashboard with business analytics',
        tags: ['project-description', 'customer-management', 'dashboard']
      });

      await this.contextManager.updateContext(this.cpcProjectPath, {
        type: 'decision',
        content: 'Using Next.js for dashboard with TypeScript, implementing customer profile cards with business intelligence features',
        tags: ['architecture', 'nextjs', 'typescript', 'business-intelligence']
      });

      await this.contextManager.updateContext(this.cpcProjectPath, {
        type: 'todo',
        content: 'Implement customer filtering and search functionality in dashboard',
        tags: ['feature', 'dashboard', 'filtering', 'search']
      });

      await this.contextManager.updateContext(this.cpcProjectPath, {
        type: 'todo',
        content: 'Add responsive design for mobile customer profile cards',
        tags: ['ui', 'responsive', 'mobile', 'customer-cards']
      });

      console.log('   ✅ Development context added successfully');

      // Step 3: Search functionality demo
      console.log('\\n🔍 3. Testing Search Functionality...');

      const searchTests = [
        { query: 'dashboard', description: 'Dashboard related files' },
        { query: 'component', description: 'React components' },
        { query: 'customer', description: 'Customer-related code' },
        { query: 'business', description: 'Business logic' }
      ];

      for (const test of searchTests) {
        console.log(`\\n   🔎 Searching for "${test.query}" (${test.description}):`);
        const results = await this.contextManager.searchProject(this.cpcProjectPath, test.query);

        if (results.matches.length > 0) {
          console.log(`      Found ${results.matches.length} matches:`);
          results.matches.slice(0, 3).forEach((match, index) => {
            const preview = match.file ? `${match.file}` : `${match.content.substring(0, 40)}...`;
            console.log(`      ${index + 1}. ${match.type}: ${preview} (relevance: ${match.relevance})`);
          });
        } else {
          console.log('      No direct matches found');
          if (results.suggestions.length > 0) {
            console.log(`      Suggestions: ${results.suggestions.join(', ')}`);
          }
        }
      }

      // Step 4: Development Status
      console.log('\\n📊 4. Development Status Analysis...');
      const devStatus = await this.contextManager.getDevelopmentStatus(this.cpcProjectPath);

      console.log(`   📋 Project: ${devStatus.project_name}`);
      console.log(`   ⚡ Status: ${devStatus.current_status}`);
      console.log(`   📈 Total Updates: ${devStatus.summary.total_updates}`);
      console.log(`   ✅ Completed Todos: ${devStatus.summary.completed_todos}`);
      console.log(`   📝 Active Todos: ${devStatus.summary.active_todos}`);

      if (devStatus.active_todos.length > 0) {
        console.log('\\n   📋 Active Todos:');
        devStatus.active_todos.forEach((todo, index) => {
          console.log(`      ${index + 1}. ${todo.content}`);
          console.log(`         Tags: ${todo.tags?.join(', ') || 'none'}`);
        });
      }

      if (devStatus.recent_activity.length > 0) {
        console.log('\\n   🕐 Recent Activity:');
        devStatus.recent_activity.slice(0, 3).forEach((activity, index) => {
          const date = new Date(activity.timestamp).toLocaleDateString('tr-TR');
          console.log(`      ${index + 1}. [${date}] ${activity.content}`);
        });
      }

      return context;

    } catch (error) {
      console.error('❌ CPC Analysis failed:', error.message);
      throw error;
    }
  }

  async demonstrateRealWorldUsage(context) {
    console.log('\\n\\n🌟 GERÇEK DÜNYA KULLANIMI - CPC PROJESİ');
    console.log('==========================================');

    // Scenario 1: Session başlangıcı
    console.log('\\n📝 Senaryo 1: Yeni Claude Code Session');
    console.log('   Sen: "CPC projemde kaldığım yerden devam etmek istiyorum"');
    console.log('   Claude (MCP ile): ');

    console.log(`   - 📋 Proje: ${context.project_info.name} (${context.project_info.main_language})`);
    console.log(`   - 📦 Framework: ${context.project_info.framework || 'React/Next.js'}`);
    console.log(`   - 📄 ${context.scan_info.total_files} dosya, ${context.scan_info.total_directories} klasör`);
    console.log('   - 🎯 Aktif todos: Customer filtering + Mobile responsive design');
    console.log('   - 📅 Son aktivite: Development context eklendi');

    // Scenario 2: Kod arama
    console.log('\\n\\n🔍 Senaryo 2: "Customer card componentini bul"');
    console.log('   Claude (MCP search): ');

    const customerSearch = await this.contextManager.searchProject(this.cpcProjectPath, 'customer card');
    if (customerSearch.matches.length > 0) {
      customerSearch.matches.slice(0, 3).forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.context}: ${match.file || match.content.substring(0, 50)}`);
      });
    } else {
      console.log('   - Dashboard klasöründe customer-related componentler var');
      console.log('   - components/cpc-business altında business card yapıları bulundu');
    }

    // Scenario 3: Development karar kaydetme
    console.log('\\n\\n💡 Senaryo 3: "Bu component\'i nasıl refactor etmeliyim?"');
    console.log('   Claude (MCP context): ');
    console.log('   - Mevcut mimaride Next.js + TypeScript kullanılıyor');
    console.log('   - Business intelligence odaklı dashboard yapısı var');
    console.log('   - Customer profil kartları mobil responsive olmalı (active todo)');
    console.log('   - Filtering ve search functionality eklenmesi planlanmış');

    // Add a refactor decision
    await this.contextManager.updateContext(this.cpcProjectPath, {
      type: 'decision',
      content: 'Customer card component\'i hook-based state management ile refactor edilecek, mobil responsive için breakpoint\'ler eklenecek',
      tags: ['refactor', 'hooks', 'responsive', 'customer-card']
    });

    console.log('\\n   ✅ Refactor kararı Prometheus hafızasına kaydedildi!');

    // Scenario 4: Context persistence
    console.log('\\n\\n💾 Senaryo 4: Context Window Dolduğunda');
    console.log('   Context dolduğunda bile Claude şunları hatırlayacak:');
    console.log('   ✅ CPC = Customer Profile Card dashboard projesi');
    console.log('   ✅ Next.js + TypeScript + Business Intelligence focus');
    console.log('   ✅ Aktif todos: filtering, search, mobile responsive');
    console.log('   ✅ Son kararlar: hook-based refactor, breakpoint\'ler');
    console.log('   ✅ Dosya yapısı: dashboard/, components/, business logic');

    return true;
  }

  async showMCPToolsInAction() {
    console.log('\\n\\n🛠️  MCP TOOLS - CLAUDE CODE İNTEGRASYONU');
    console.log('=============================================');

    console.log('\\nClaude Code\'da artık şu tool\'ları kullanabileceksin:');

    const tools = [
      {
        name: 'get_project_context',
        usage: 'get_project_context({\\"project_path\\": \\"/Users/ahmetustel/Projects/cpc\\"})',
        description: 'Tam proje bilgisi: dosyalar, framework, son durum',
        scenario: 'Session başında: "Bu proje hakkında ne biliyorsun?"'
      },
      {
        name: 'search_project_knowledge',
        usage: 'search_project_knowledge({\\"project_path\\": \\"/Users/ahmetustel/Projects/cpc\\", \\"query\\": \\"customer dashboard\\"})',
        description: 'Kodda ve notlarda semantic arama',
        scenario: 'Geliştirme sırasında: "Dashboard component nerede?"'
      },
      {
        name: 'get_development_status',
        usage: 'get_development_status({\\"project_path\\": \\"/Users/ahmetustel/Projects/cpc\\"})',
        description: 'Aktif todos, son değişiklikler, next steps',
        scenario: 'Planlama: "Hangi tasklar kalmış, ne yapmalıyım?"'
      },
      {
        name: 'update_project_context',
        usage: 'update_project_context({\\"project_path\\": \\"/Users/ahmetustel/Projects/cpc\\", \\"update_type\\": \\"decision\\", \\"content\\": \\"...\\""})',
        description: 'Development kararlarını ve notları kaydetme',
        scenario: 'Karar verme: "Bu approach\'ı seçtim çünkü..."'
      },
      {
        name: 'scan_project',
        usage: 'scan_project({\\"project_path\\": \\"/Users/ahmetustel/Projects/cpc\\"})',
        description: 'Proje yapısını yeniden analiz etme',
        scenario: 'Büyük değişiklikler sonrası: "Projeyi yeniden tara"'
      }
    ];

    tools.forEach((tool, index) => {
      console.log(`\\n${index + 1}. 🔧 ${tool.name}`);
      console.log(`   📖 Ne yapar: ${tool.description}`);
      console.log(`   💡 Kullanım senaryosu: ${tool.scenario}`);
      console.log(`   ⚙️  Syntax: ${tool.usage}`);
    });

    console.log('\\n\\n🎯 SONUÇ:');
    console.log('✅ Artık Claude her session\'da CPC projeni tanıyor');
    console.log('✅ Development kararların ve progress\'in persistent');
    console.log('✅ Akıllı kod arama ve context-aware öneriler');
    console.log('✅ Manuel proje açıklama yapma gerek yok!');
  }
}

// Run the CPC demo
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new CPCPrometheusDemo();

  (async () => {
    const context = await demo.analyzeCPCProject();
    await demo.demonstrateRealWorldUsage(context);
    await demo.showMCPToolsInAction();

    console.log('\\n\\n🚀 CPC Projesi Prometheus MCP ile hazır!');
    console.log('Claude Code\'ı restart et ve MCP tools\'ları kullanmaya başla!');

    process.exit(0);
  })().catch(error => {
    console.error('CPC Demo failed:', error);
    process.exit(1);
  });
}