#!/usr/bin/env node

import { ProjectContextManager } from './src/services/ProjectContextManager.js';
import { FileWatcher } from './src/services/FileWatcher.js';
import { ContextStorage } from './src/services/ContextStorage.js';
import path from 'path';

// Demo script to showcase MCP server capabilities with real project data

class PrometheusDemo {
  constructor() {
    this.contextManager = new ProjectContextManager();
    this.watcher = new FileWatcher();
    this.storage = new ContextStorage();
  }

  async runDemo() {
    console.log('\n🔥 Prometheus MCP Server Demo\n');
    console.log('========================================');

    try {
      // Test 1: Scan current project (prometheus-assistant itself)
      console.log('\n📁 1. Scanning current project...');
      const currentProject = process.cwd();
      console.log(`Project path: ${currentProject}`);

      const context = await this.contextManager.getProjectContext(currentProject);
      console.log('\n✅ Project Context Retrieved:');
      console.log(`   Name: ${context.project_info.name}`);
      console.log(`   Type: ${context.project_info.type}`);
      console.log(`   Language: ${context.project_info.main_language}`);
      console.log(`   Total files: ${context.scan_info.total_files}`);
      console.log(`   Frameworks: ${context.scan_info.frameworks.join(', ') || 'None detected'}`);

      // Test 2: Look for other projects in parent directory
      console.log('\n🔍 2. Looking for other projects...');
      const projectsDir = path.dirname(currentProject);
      console.log(`Projects directory: ${projectsDir}`);

      const allProjects = await this.storage.listProjects();
      console.log(`\\n📋 Currently tracked projects: ${allProjects.length}`);

      if (allProjects.length > 0) {
        allProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.name} (${project.file_count} files)`);
        });
      }

      // Test 3: Add development update
      console.log('\\n✍️  3. Adding development update...');
      const update = await this.contextManager.updateContext(currentProject, {
        type: 'note',
        content: 'Successfully implemented MCP server with 5 core tools: get_project_context, search_project_knowledge, get_development_status, update_project_context, and scan_project',
        tags: ['demo', 'implementation', 'mcp']
      });

      console.log(`   ✅ Update added with ID: ${update.id}`);

      // Test 4: Search functionality
      console.log('\\n🔎 4. Testing search functionality...');
      const searchResults = await this.contextManager.searchProject(currentProject, 'MCP');
      console.log(`   Found ${searchResults.matches.length} matches for "MCP"`);

      searchResults.matches.slice(0, 3).forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.type}: ${match.file || match.content.substring(0, 50)}...`);
      });

      // Test 5: Development status
      console.log('\\n📊 5. Checking development status...');
      const devStatus = await this.contextManager.getDevelopmentStatus(currentProject);
      console.log(`   Project: ${devStatus.project_name}`);
      console.log(`   Status: ${devStatus.current_status}`);
      console.log(`   Total updates: ${devStatus.summary.total_updates}`);
      console.log(`   Active todos: ${devStatus.summary.active_todos}`);
      console.log(`   Recently modified files: ${devStatus.file_activity.recently_modified.length}`);

      if (devStatus.recent_activity.length > 0) {
        console.log('\\n   Recent activity:');
        devStatus.recent_activity.slice(0, 3).forEach((activity, index) => {
          const date = new Date(activity.timestamp).toLocaleDateString();
          console.log(`   ${index + 1}. [${date}] ${activity.content.substring(0, 60)}...`);
        });
      }

      // Test 6: Demonstrate MCP tool format
      console.log('\\n🛠️  6. MCP Tools Demo Output Format:');
      console.log('   This is how Claude Code will receive the data:');

      const mcpOutput = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              tool_name: 'get_project_context',
              project: context.project_info.name,
              summary: {
                files: context.scan_info.total_files,
                language: context.project_info.main_language,
                frameworks: context.scan_info.frameworks,
                last_activity: devStatus.recent_activity[0]?.timestamp || 'No recent activity'
              },
              key_files: context.file_structure?.important_files?.slice(0, 5).map(f => f.name) || []
            }, null, 2)
          }
        ]
      };

      console.log(mcpOutput.content[0].text);

      console.log('\\n🎉 Demo completed successfully!');
      console.log('\\n📝 Next steps to use with Claude Code:');
      console.log('   1. Add this MCP server to your Claude Code configuration');
      console.log('   2. Use tools like get_project_context, search_project_knowledge in your conversations');
      console.log('   3. Claude will remember your project structure and development progress');

    } catch (error) {
      console.error('\\n❌ Demo failed:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  async demonstrateRealWorldUsage() {
    console.log('\\n\\n🌟 REAL-WORLD USAGE EXAMPLES');
    console.log('========================================');

    const projectPath = process.cwd();

    // Example 1: Context-aware development
    console.log('\\n📝 Example 1: Context-Aware Development');
    console.log('   Scenario: You return to a project after a break');
    console.log('   Claude can now ask: "What was I working on last?"');

    const context = await this.contextManager.getProjectContext(projectPath);
    const status = await this.contextManager.getDevelopmentStatus(projectPath);

    console.log('\\n   MCP Response would include:');
    console.log(`   - Project: ${context.project_info.name} (${context.project_info.main_language})`);
    console.log(`   - Last scan: ${new Date(context.scan_info.last_updated || Date.now()).toLocaleDateString()}`);
    console.log(`   - Recent files: ${status.file_activity.recently_modified.slice(0, 3).map(f => f.name).join(', ')}`);
    console.log(`   - Active todos: ${status.summary.active_todos}`);

    // Example 2: Intelligent code search
    console.log('\\n\\n🔍 Example 2: Intelligent Code Search');
    console.log('   Scenario: "Find all files related to project scanning"');

    const searchResults = await this.contextManager.searchProject(projectPath, 'scanner');
    console.log(`\\n   Found ${searchResults.matches.length} relevant matches:`);

    searchResults.matches.slice(0, 3).forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.type}: ${match.file || match.content.substring(0, 40)}...`);
      console.log(`      Relevance: ${match.relevance}/10`);
    });

    // Example 3: Development continuity
    console.log('\\n\\n🔄 Example 3: Development Continuity');
    console.log('   Scenario: Your context window fills up during development');

    await this.contextManager.updateContext(projectPath, {
      type: 'todo',
      content: 'Add error handling for file scanning edge cases',
      tags: ['enhancement', 'error-handling']
    });

    await this.contextManager.updateContext(projectPath, {
      type: 'decision',
      content: 'Decided to use YAML for context storage instead of JSON for better readability',
      tags: ['architecture', 'storage']
    });

    console.log('\\n   Claude can now remember:');
    console.log('   - Architectural decisions made during development');
    console.log('   - Pending todos and their priorities');
    console.log('   - Coding patterns used in the project');
    console.log('   - Recent changes and their context');

    // Example 4: Cross-session memory
    console.log('\\n\\n💾 Example 4: Cross-Session Memory');
    console.log('   Scenario: New Claude Code session, but project context persists');

    const persistentData = {
      project_knowledge: `${context.scan_info.total_files} files analyzed`,
      development_state: `${status.summary.total_updates} updates tracked`,
      active_work: `${status.summary.active_todos} todos pending`,
      architectural_context: context.scan_info.frameworks.join(', ') || 'No frameworks detected'
    };

    console.log('\\n   Persistent context includes:');
    Object.entries(persistentData).forEach(([key, value]) => {
      console.log(`   - ${key.replace('_', ' ')}: ${value}`);
    });

    console.log('\\n\\n✨ Benefits Summary:');
    console.log('   ✅ No more re-explaining project structure');
    console.log('   ✅ Automatic tracking of development progress');
    console.log('   ✅ Intelligent search across codebase and notes');
    console.log('   ✅ Persistent memory across Claude sessions');
    console.log('   ✅ Context-aware suggestions and assistance');
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new PrometheusDemo();

  (async () => {
    await demo.runDemo();
    await demo.demonstrateRealWorldUsage();

    console.log('\\n\\n🚀 Ready to revolutionize your development workflow!');
    process.exit(0);
  })().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}