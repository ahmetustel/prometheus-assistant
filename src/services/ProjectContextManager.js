import { ContextStorage } from './ContextStorage.js';
import { ProjectScanner } from './ProjectScanner.js';
import { ChromaDBService } from './ChromaDBService.js';
import fs from 'fs-extra';
import path from 'path';

export class ProjectContextManager {
  constructor() {
    this.storage = new ContextStorage();
    this.scanner = new ProjectScanner();
    this.chromaDB = new ChromaDBService();
  }

  /**
   * Get comprehensive project context
   */
  async getProjectContext(projectPath, options = {}) {
    const { include_files = true } = options;

    // Update last accessed
    await this.storage.updateLastAccessed(projectPath);

    // Load context
    const context = await this.storage.loadProjectContext(projectPath);

    // If context is old or missing scan data, trigger a rescan
    if (!context.scan.last_updated || this.isContextStale(context)) {
      console.error('Context is stale, triggering rescan...');
      const scanResult = await this.scanner.scanProject(projectPath);
      await this.storage.saveProjectData(projectPath, scanResult);

      // Reload updated context
      const updatedContext = await this.storage.loadProjectContext(projectPath);
      return this.formatProjectContext(updatedContext, { include_files });
    }

    return this.formatProjectContext(context, { include_files });
  }

  /**
   * Search through project knowledge
   */
  async searchProject(projectPath, query, options = {}) {
    const { file_types } = options;

    const context = await this.storage.loadProjectContext(projectPath);
    const results = {
      query,
      matches: [],
      suggestions: [],
    };

    // Search in file names and paths
    const fileMatches = context.file_structure.files.filter(file => {
      if (file_types && file_types.length > 0) {
        const fileExt = path.extname(file.name).substring(1);
        if (!file_types.includes(fileExt)) return false;
      }

      return (
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        file.path.toLowerCase().includes(query.toLowerCase()) ||
        (file.preview && file.preview.toLowerCase().includes(query.toLowerCase()))
      );
    });

    results.matches.push(...fileMatches.map(file => ({
      type: 'file',
      file: file.path,
      name: file.name,
      relevance: this.calculateRelevance(file, query),
      preview: file.preview || null,
      context: `File: ${file.path}`,
    })));

    // Search in development updates
    if (context.development && context.development.updates) {
      const updateMatches = context.development.updates.filter(update =>
        update.content.toLowerCase().includes(query.toLowerCase())
      );

      results.matches.push(...updateMatches.map(update => ({
        type: 'development_update',
        content: update.content,
        timestamp: update.timestamp,
        tags: update.tags || [],
        relevance: this.calculateRelevance({ content: update.content }, query),
        context: `Development update from ${new Date(update.timestamp).toLocaleDateString()}`,
      })));
    }

    // Search in ChromaDB for semantic matches
    try {
      const projectName = path.basename(projectPath);
      const chromaResults = await this.chromaDB.searchSimilar(projectName, query, 10);

      chromaResults.forEach(result => {
        results.matches.push({
          type: 'code_semantic',
          file: result.filePath,
          content: result.content,
          language: result.language,
          chunk_type: result.chunkType,
          similarity: result.similarity,
          relevance: result.similarity * 100, // Convert to 0-100 scale
          context: `${result.chunkType} in ${result.filePath}`,
        });
      });
    } catch (error) {
      console.error('ChromaDB search failed:', error.message);
    }

    // Search in project documentation
    const docFiles = context.file_structure.files.filter(file =>
      file.extension === '.md' && file.preview
    );

    for (const docFile of docFiles) {
      if (docFile.preview.toLowerCase().includes(query.toLowerCase())) {
        results.matches.push({
          type: 'documentation',
          file: docFile.path,
          name: docFile.name,
          preview: this.extractRelevantSnippet(docFile.preview, query),
          relevance: this.calculateRelevance(docFile, query),
          context: `Documentation: ${docFile.path}`,
        });
      }
    }

    // Sort by relevance
    results.matches.sort((a, b) => b.relevance - a.relevance);

    // Add suggestions based on project structure
    if (results.matches.length === 0) {
      results.suggestions = this.generateSearchSuggestions(context, query);
    }

    return results;
  }

  /**
   * Get development status and recent activity
   */
  async getDevelopmentStatus(projectPath, options = {}) {
    const { days_back = 7 } = options;

    const context = await this.storage.loadProjectContext(projectPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_back);

    const status = {
      project_name: context.project.name,
      current_status: context.development?.status || 'unknown',
      current_focus: context.development?.current_focus || 'No current focus set',

      recent_activity: [],
      active_todos: [],
      recent_decisions: [],
      next_steps: [],

      file_activity: {
        recently_modified: [],
        most_active: [],
      },

      summary: {
        total_files: context.scan?.fileCount || 0,
        total_updates: context.development?.updates?.length || 0,
        active_todos: 0,
        completed_todos: 0,
      }
    };

    // Get recent updates
    if (context.development?.updates) {
      status.recent_activity = context.development.updates
        .filter(update => new Date(update.timestamp) > cutoffDate)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    }

    // Get active todos
    if (context.development?.todos) {
      status.active_todos = context.development.todos
        .filter(todo => !todo.completed)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      status.summary.active_todos = status.active_todos.length;
      status.summary.completed_todos = context.development.todos.filter(t => t.completed).length;
    }

    // Get recent decisions
    if (context.development?.decisions) {
      status.recent_decisions = context.development.decisions
        .filter(decision => new Date(decision.timestamp) > cutoffDate)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Analyze file activity
    if (context.file_structure?.files) {
      status.file_activity.recently_modified = context.file_structure.files
        .filter(file => new Date(file.modified) > cutoffDate)
        .sort((a, b) => new Date(b.modified) - new Date(a.modified))
        .slice(0, 10)
        .map(file => ({
          path: file.path,
          name: file.name,
          modified: file.modified,
          language: file.language,
        }));
    }

    // Generate next steps based on todos and recent activity
    status.next_steps = this.generateNextSteps(context, status);

    return status;
  }

  /**
   * Update project context with new information
   */
  async updateContext(projectPath, update) {
    return await this.storage.addDevelopmentUpdate(projectPath, update);
  }

  /**
   * Check if context data is stale
   */
  isContextStale(context) {
    if (!context.scan?.last_updated) return true;

    const lastScan = new Date(context.scan.last_updated);
    const now = new Date();
    const hoursSinceLastScan = (now - lastScan) / (1000 * 60 * 60);

    return hoursSinceLastScan > 24; // Consider stale after 24 hours
  }

  /**
   * Format project context for output
   */
  formatProjectContext(context, options = {}) {
    const { include_files = true } = options;

    const formatted = {
      project_info: context.project,
      development_status: {
        status: context.development?.status || 'active',
        current_focus: context.development?.current_focus || 'Not specified',
        active_todos: context.development?.todos?.filter(t => !t.completed) || [],
        recent_updates: context.development?.updates?.slice(-5) || [],
      },
      architecture: context.architecture,
      scan_info: {
        last_updated: context.scan?.last_updated,
        total_files: context.scan?.fileCount || 0,
        total_directories: context.scan?.directoryCount || 0,
        main_language: context.project?.main_language,
        frameworks: context.codeAnalysis?.frameworks || [],
      }
    };

    if (include_files) {
      formatted.file_structure = {
        important_files: context.importantFiles || [],
        directory_count: context.file_structure?.total_directories || 0,
        file_count: context.file_structure?.total_files || 0,
        languages: context.codeAnalysis?.languages || {},
        recent_files: context.file_structure?.files
          ?.sort((a, b) => new Date(b.modified) - new Date(a.modified))
          ?.slice(0, 10) || [],
      };
    }

    return formatted;
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(item, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    if (item.name && item.name.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    if (item.path && item.path.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }

    if (item.content && item.content.toLowerCase().includes(lowerQuery)) {
      score += 3;
    }

    if (item.preview && item.preview.toLowerCase().includes(lowerQuery)) {
      score += 2;
    }

    return score;
  }

  /**
   * Extract relevant snippet around search query
   */
  extractRelevantSnippet(content, query, maxLength = 200) {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) return content.substring(0, maxLength);

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 150);

    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Generate search suggestions
   */
  generateSearchSuggestions(context, query) {
    const suggestions = [];

    // Suggest based on file types
    const languages = Object.keys(context.codeAnalysis?.languages || {});
    if (languages.length > 0) {
      suggestions.push(`Search in ${languages[0]} files`);
    }

    // Suggest based on important files
    if (context.importantFiles?.length > 0) {
      suggestions.push(`Check ${context.importantFiles[0].name}`);
    }

    // Suggest based on recent activity
    if (context.development?.updates?.length > 0) {
      suggestions.push('Search recent development updates');
    }

    return suggestions;
  }

  /**
   * Generate next steps based on project context
   */
  generateNextSteps(context, status) {
    const steps = [];

    // Based on active todos
    if (status.active_todos.length > 0) {
      steps.push(`Continue with: ${status.active_todos[0].content}`);
    }

    // Based on recent activity
    if (status.recent_activity.length === 0) {
      steps.push('No recent activity - consider updating project status');
    }

    // Based on file structure
    if (context.scan?.fileCount === 0) {
      steps.push('Project appears empty - initialize with basic structure');
    }

    return steps.slice(0, 5); // Limit to 5 suggestions
  }
}