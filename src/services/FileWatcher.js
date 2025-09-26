import chokidar from 'chokidar';
import { ContextStorage } from './ContextStorage.js';
import { ProjectScanner } from './ProjectScanner.js';
import path from 'path';
import fs from 'fs-extra';

export class FileWatcher {
  constructor(options = {}) {
    this.watchedProjects = new Map();
    this.storage = new ContextStorage();
    this.scanner = new ProjectScanner();

    this.defaultOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/target/**',
        '**/*.log',
        '**/.env*',
        '**/coverage/**',
      ],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
      ...options,
    };
  }

  /**
   * Start watching a project directory
   */
  async startWatching(projectPath, options = {}) {
    const absolutePath = path.resolve(projectPath);

    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`Project path does not exist: ${absolutePath}`);
    }

    // Stop existing watcher if any
    if (this.watchedProjects.has(absolutePath)) {
      await this.stopWatching(absolutePath);
    }

    console.error(`Starting file watcher for: ${absolutePath}`);

    const watcher = chokidar.watch(absolutePath, {
      ...this.defaultOptions,
      ...options,
    });

    const watcherInfo = {
      watcher,
      projectPath: absolutePath,
      startTime: new Date(),
      fileChangeCount: 0,
      lastUpdate: null,
    };

    // Set up event listeners
    watcher
      .on('add', (filePath) => this.handleFileChange('add', absolutePath, filePath, watcherInfo))
      .on('change', (filePath) => this.handleFileChange('change', absolutePath, filePath, watcherInfo))
      .on('unlink', (filePath) => this.handleFileChange('unlink', absolutePath, filePath, watcherInfo))
      .on('addDir', (dirPath) => this.handleDirectoryChange('addDir', absolutePath, dirPath, watcherInfo))
      .on('unlinkDir', (dirPath) => this.handleDirectoryChange('unlinkDir', absolutePath, dirPath, watcherInfo))
      .on('error', (error) => console.error(`Watcher error for ${absolutePath}:`, error))
      .on('ready', () => console.error(`Watcher ready for ${absolutePath}`));

    this.watchedProjects.set(absolutePath, watcherInfo);

    return watcherInfo;
  }

  /**
   * Stop watching a project
   */
  async stopWatching(projectPath) {
    const absolutePath = path.resolve(projectPath);
    const watcherInfo = this.watchedProjects.get(absolutePath);

    if (watcherInfo) {
      console.error(`Stopping file watcher for: ${absolutePath}`);
      await watcherInfo.watcher.close();
      this.watchedProjects.delete(absolutePath);
      return true;
    }

    return false;
  }

  /**
   * Stop all watchers
   */
  async stopAll() {
    const promises = Array.from(this.watchedProjects.keys()).map(projectPath =>
      this.stopWatching(projectPath)
    );

    await Promise.all(promises);
    console.error('All file watchers stopped');
  }

  /**
   * Get status of all watchers
   */
  getWatcherStatus() {
    const status = [];

    for (const [projectPath, watcherInfo] of this.watchedProjects) {
      status.push({
        project_path: projectPath,
        watching_since: watcherInfo.startTime.toISOString(),
        file_changes: watcherInfo.fileChangeCount,
        last_update: watcherInfo.lastUpdate,
        is_active: !watcherInfo.watcher.closed,
      });
    }

    return status;
  }

  /**
   * Handle file changes
   */
  async handleFileChange(event, projectPath, filePath, watcherInfo) {
    const relativePath = path.relative(projectPath, filePath);

    console.error(`File ${event}: ${relativePath}`);

    watcherInfo.fileChangeCount++;
    watcherInfo.lastUpdate = new Date();

    // Debounce updates to avoid too frequent context updates
    clearTimeout(watcherInfo.updateTimeout);
    watcherInfo.updateTimeout = setTimeout(async () => {
      try {
        await this.updateProjectContext(projectPath, {
          type: 'file_change',
          event,
          file: relativePath,
          timestamp: new Date().toISOString(),
        });

        // For significant changes, trigger a partial rescan
        if (this.isSignificantChange(event, relativePath)) {
          await this.triggerPartialRescan(projectPath, relativePath);
        }
      } catch (error) {
        console.error(`Error updating context for ${projectPath}:`, error.message);
      }
    }, 2000); // Wait 2 seconds before updating
  }

  /**
   * Handle directory changes
   */
  async handleDirectoryChange(event, projectPath, dirPath, watcherInfo) {
    const relativePath = path.relative(projectPath, dirPath);

    console.error(`Directory ${event}: ${relativePath}`);

    watcherInfo.fileChangeCount++;
    watcherInfo.lastUpdate = new Date();

    // Directory changes might be more significant
    clearTimeout(watcherInfo.updateTimeout);
    watcherInfo.updateTimeout = setTimeout(async () => {
      try {
        await this.updateProjectContext(projectPath, {
          type: 'directory_change',
          event,
          directory: relativePath,
          timestamp: new Date().toISOString(),
        });

        // Always trigger rescan for directory changes
        await this.triggerPartialRescan(projectPath, relativePath);
      } catch (error) {
        console.error(`Error updating context for ${projectPath}:`, error.message);
      }
    }, 2000);
  }

  /**
   * Update project context with change information
   */
  async updateProjectContext(projectPath, changeInfo) {
    await this.storage.addDevelopmentUpdate(projectPath, {
      type: 'file_system_change',
      content: `${changeInfo.event}: ${changeInfo.file || changeInfo.directory}`,
      metadata: changeInfo,
      tags: ['auto-generated', 'file-watcher'],
    });
  }

  /**
   * Check if a file change is significant enough to trigger rescan
   */
  isSignificantChange(event, filePath) {
    const significantFiles = [
      'package.json',
      'Cargo.toml',
      'requirements.txt',
      'go.mod',
      'pom.xml',
      'build.gradle',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.js',
      'next.config.js',
      'README.md',
    ];

    const fileName = path.basename(filePath);

    // Configuration files and documentation are always significant
    if (significantFiles.includes(fileName)) return true;

    // New files in important directories
    if (event === 'add') {
      const dir = path.dirname(filePath);
      const importantDirs = ['src', 'lib', 'components', 'pages', 'routes', 'services'];
      if (importantDirs.some(importantDir => dir.includes(importantDir))) return true;
    }

    return false;
  }

  /**
   * Trigger a partial rescan of the project
   */
  async triggerPartialRescan(projectPath, changedPath) {
    console.error(`Triggering partial rescan for: ${changedPath}`);

    try {
      // For now, do a full rescan but mark it as triggered by file change
      const scanResult = await this.scanner.scanProject(projectPath, {
        force_refresh: false,
        triggered_by: changedPath
      });

      await this.storage.saveProjectData(projectPath, scanResult);

      console.error(`Partial rescan completed for ${projectPath}`);
    } catch (error) {
      console.error(`Partial rescan failed for ${projectPath}:`, error.message);
    }
  }

  /**
   * Start watching multiple projects from a parent directory
   */
  async startWatchingMultipleProjects(parentDir, options = {}) {
    const { projectPattern = '*', excludePatterns = [] } = options;

    try {
      const entries = await fs.readdir(parentDir, { withFileTypes: true });
      const projectDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => !name.startsWith('.'))
        .filter(name => !excludePatterns.includes(name));

      const startedWatchers = [];

      for (const projectDir of projectDirs) {
        const projectPath = path.join(parentDir, projectDir);

        try {
          const watcherInfo = await this.startWatching(projectPath);
          startedWatchers.push(watcherInfo);
        } catch (error) {
          console.error(`Failed to start watching ${projectPath}:`, error.message);
        }
      }

      console.error(`Started watching ${startedWatchers.length} projects in ${parentDir}`);
      return startedWatchers;
    } catch (error) {
      console.error(`Failed to start watching projects in ${parentDir}:`, error.message);
      throw error;
    }
  }

  /**
   * Export watcher statistics
   */
  getStatistics() {
    const stats = {
      total_watched_projects: this.watchedProjects.size,
      total_file_changes: 0,
      active_watchers: 0,
      projects: [],
    };

    for (const [projectPath, watcherInfo] of this.watchedProjects) {
      stats.total_file_changes += watcherInfo.fileChangeCount;
      if (!watcherInfo.watcher.closed) stats.active_watchers++;

      stats.projects.push({
        project: path.basename(projectPath),
        path: projectPath,
        file_changes: watcherInfo.fileChangeCount,
        watching_since: watcherInfo.startTime,
        last_update: watcherInfo.lastUpdate,
        active: !watcherInfo.watcher.closed,
      });
    }

    return stats;
  }
}