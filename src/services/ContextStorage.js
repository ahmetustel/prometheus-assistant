import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export class ContextStorage {
  constructor(storageDir = './data/contexts') {
    this.storageDir = storageDir;
  }

  /**
   * Get the storage path for a project
   */
  getProjectStoragePath(projectPath) {
    const projectName = this.getProjectName(projectPath);
    return path.join(this.storageDir, `${projectName}.yml`);
  }

  /**
   * Extract project name from path
   */
  getProjectName(projectPath) {
    return path.basename(projectPath).toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Load project context data
   */
  async loadProjectContext(projectPath) {
    const storagePath = this.getProjectStoragePath(projectPath);

    try {
      const content = await fs.readFile(storagePath, 'utf8');
      return yaml.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Return default context structure
        return this.createDefaultContext(projectPath);
      }
      throw error;
    }
  }

  /**
   * Save project context data
   */
  async saveProjectContext(projectPath, contextData) {
    const storagePath = this.getProjectStoragePath(projectPath);
    await fs.ensureDir(path.dirname(storagePath));

    const yamlContent = yaml.stringify(contextData, {
      indent: 2,
      lineWidth: -1,
    });

    await fs.writeFile(storagePath, yamlContent, 'utf8');
    return storagePath;
  }

  /**
   * Save project data from scanner
   */
  async saveProjectData(projectPath, scanData) {
    const context = await this.loadProjectContext(projectPath);

    // Update scan data
    context.scan = {
      ...scanData,
      last_updated: new Date().toISOString(),
    };

    // Update file structure
    context.file_structure = scanData.fileStructure;

    // Update project info if available
    if (scanData.projectInfo) {
      context.project = {
        ...context.project,
        ...scanData.projectInfo,
      };
    }

    await this.saveProjectContext(projectPath, context);
    return context;
  }

  /**
   * Add a development update to project context
   */
  async addDevelopmentUpdate(projectPath, update) {
    const context = await this.loadProjectContext(projectPath);

    if (!context.development) {
      context.development = {
        updates: [],
        todos: [],
        decisions: [],
        status: 'active',
      };
    }

    const timestampedUpdate = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...update,
    };

    switch (update.type) {
      case 'todo':
        context.development.todos.push(timestampedUpdate);
        break;
      case 'decision':
        context.development.decisions.push(timestampedUpdate);
        break;
      case 'completion':
        // Mark related todos as completed
        if (update.todo_id) {
          const todo = context.development.todos.find(t => t.id === update.todo_id);
          if (todo) {
            todo.completed = true;
            todo.completed_at = timestampedUpdate.timestamp;
          }
        }
        context.development.updates.push(timestampedUpdate);
        break;
      default:
        context.development.updates.push(timestampedUpdate);
    }

    await this.saveProjectContext(projectPath, context);
    return timestampedUpdate;
  }

  /**
   * Create default context structure
   */
  createDefaultContext(projectPath) {
    return {
      project: {
        name: path.basename(projectPath),
        path: projectPath,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        description: '',
        main_language: 'unknown',
        framework: 'unknown',
        version: '1.0.0',
      },
      file_structure: {
        directories: [],
        files: [],
        total_files: 0,
        total_directories: 0,
      },
      development: {
        status: 'active',
        current_focus: '',
        updates: [],
        todos: [],
        decisions: [],
        coding_standards: [],
      },
      architecture: {
        patterns: [],
        technologies: [],
        dependencies: [],
        key_files: [],
      },
      scan: {
        last_updated: null,
        fileCount: 0,
        directoryCount: 0,
      },
    };
  }

  /**
   * List all tracked projects
   */
  async listProjects() {
    try {
      await fs.ensureDir(this.storageDir);
      const files = await fs.readdir(this.storageDir);

      const projects = [];
      for (const file of files) {
        if (file.endsWith('.yml')) {
          try {
            const filePath = path.join(this.storageDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const context = yaml.parse(content);

            projects.push({
              name: context.project.name,
              path: context.project.path,
              last_accessed: context.project.last_accessed,
              status: context.development.status,
              file_count: context.scan.fileCount || 0,
            });
          } catch (error) {
            console.error(`Error reading project file ${file}:`, error.message);
          }
        }
      }

      return projects.sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed));
    } catch (error) {
      console.error('Error listing projects:', error.message);
      return [];
    }
  }

  /**
   * Update last accessed timestamp
   */
  async updateLastAccessed(projectPath) {
    const context = await this.loadProjectContext(projectPath);
    context.project.last_accessed = new Date().toISOString();
    await this.saveProjectContext(projectPath, context);
  }
}