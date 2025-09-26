import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
import mime from 'mime-types';
import matter from 'gray-matter';
import { ChromaDBService } from './ChromaDBService.js';

export class ProjectScanner {
  constructor() {
    this.chromaDB = new ChromaDBService();
    this.defaultIgnorePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      'target/**',
      '*.log',
      '.env*',
      '*.min.js',
      '*.bundle.js',
      'coverage/**',
      '.nyc_output/**',
      'vendor/**',
      'bin/**',
      'obj/**',
      '.vscode/**',
      '.idea/**',
      '*.pyc',
      '__pycache__/**',
      '.pytest_cache/**',
      'Cargo.lock',
      'package-lock.json',
      'yarn.lock',
    ];
  }

  /**
   * Scan a project directory and extract comprehensive information
   */
  async scanProject(projectPath, options = {}) {
    const { force_refresh = false } = options;

    try {
      await fs.access(projectPath);
    } catch (error) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    console.error(`Scanning project: ${projectPath}`);

    const startTime = Date.now();
    const result = {
      timestamp: new Date().toISOString(),
      projectPath,
      fileCount: 0,
      directoryCount: 0,
      fileStructure: {
        directories: [],
        files: [],
        total_files: 0,
        total_directories: 0,
      },
      projectInfo: await this.detectProjectInfo(projectPath),
      codeAnalysis: {
        languages: new Map(),
        frameworks: [],
        patterns: [],
      },
      importantFiles: [],
    };

    // Setup ignore patterns
    const ig = ignore().add(this.defaultIgnorePatterns);

    // Add project-specific ignore patterns
    const gitignorePath = path.join(projectPath, '.gitignore');
    if (await fs.pathExists(gitignorePath)) {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      ig.add(gitignoreContent.split('\n').filter(line => line.trim() && !line.startsWith('#')));
    }

    // Scan files
    const allFiles = await glob('**/*', {
      cwd: projectPath,
      dot: false,
      followSymbolicLinks: false,
    });

    const filteredFiles = allFiles.filter(file => !ig.ignores(file));

    for (const file of filteredFiles) {
      const fullPath = path.join(projectPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        result.directoryCount++;
        result.fileStructure.directories.push({
          path: file,
          name: path.basename(file),
        });
      } else {
        result.fileCount++;
        const fileInfo = await this.analyzeFile(fullPath, file);
        result.fileStructure.files.push(fileInfo);

        // Update language statistics
        if (fileInfo.language) {
          const current = result.codeAnalysis.languages.get(fileInfo.language) || 0;
          result.codeAnalysis.languages.set(fileInfo.language, current + 1);
        }

        // Check if it's an important file
        if (this.isImportantFile(file, fileInfo)) {
          result.importantFiles.push(fileInfo);
        }
      }
    }

    // Convert Map to Object for serialization
    result.codeAnalysis.languages = Object.fromEntries(result.codeAnalysis.languages);

    // Detect frameworks and patterns
    result.codeAnalysis.frameworks = this.detectFrameworks(result.fileStructure.files);
    result.codeAnalysis.patterns = this.detectPatterns(result.fileStructure.files);

    result.fileStructure.total_files = result.fileCount;
    result.fileStructure.total_directories = result.directoryCount;

    const scanDuration = Date.now() - startTime;
    console.error(`Scan completed in ${scanDuration}ms: ${result.fileCount} files, ${result.directoryCount} directories`);

    // Extract and store code chunks in ChromaDB
    const projectName = path.basename(projectPath);
    await this.processForChromaDB(projectName, result.fileStructure.files, projectPath);

    return result;
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(fullPath, relativePath) {
    const stat = await fs.stat(fullPath);
    const ext = path.extname(relativePath).toLowerCase();
    const mimeType = mime.lookup(relativePath) || 'unknown';

    const fileInfo = {
      path: relativePath,
      name: path.basename(relativePath),
      extension: ext,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      mime_type: mimeType,
      language: this.detectLanguage(ext, relativePath),
      is_text: this.isTextFile(mimeType, ext),
    };

    // For small text files, extract some content
    if (fileInfo.is_text && stat.size < 50000) { // Less than 50KB
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        fileInfo.preview = content.substring(0, 500); // First 500 chars

        // Parse frontmatter if it's markdown
        if (ext === '.md') {
          try {
            const parsed = matter(content);
            if (Object.keys(parsed.data).length > 0) {
              fileInfo.frontmatter = parsed.data;
            }
          } catch (e) {
            // Ignore frontmatter parsing errors
          }
        }

        // Extract imports/dependencies for code files
        if (this.isCodeFile(ext)) {
          fileInfo.imports = this.extractImports(content, fileInfo.language);
        }

      } catch (error) {
        // Can't read file, skip content analysis
        fileInfo.read_error = error.message;
      }
    }

    return fileInfo;
  }

  /**
   * Detect project information from common files
   */
  async detectProjectInfo(projectPath) {
    const info = {
      name: path.basename(projectPath),
      type: 'unknown',
      main_language: 'unknown',
      framework: 'unknown',
      version: '1.0.0',
      dependencies: [],
      scripts: {},
    };

    // Check package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        info.name = packageJson.name || info.name;
        info.version = packageJson.version || info.version;
        info.main_language = 'javascript';
        info.type = 'nodejs';
        info.dependencies = Object.keys(packageJson.dependencies || {});
        info.scripts = packageJson.scripts || {};

        // Detect framework from dependencies
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
          info.framework = 'react';
        } else if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
          info.framework = 'vue';
        } else if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
          info.framework = 'nextjs';
        }
      } catch (error) {
        console.error('Error reading package.json:', error.message);
      }
    }

    // Check Cargo.toml
    const cargoPath = path.join(projectPath, 'Cargo.toml');
    if (await fs.pathExists(cargoPath)) {
      info.main_language = 'rust';
      info.type = 'rust';
      info.framework = 'cargo';
    }

    // Check requirements.txt or setup.py
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const setupPyPath = path.join(projectPath, 'setup.py');
    if (await fs.pathExists(requirementsPath) || await fs.pathExists(setupPyPath)) {
      info.main_language = 'python';
      info.type = 'python';
    }

    // Check go.mod
    const goModPath = path.join(projectPath, 'go.mod');
    if (await fs.pathExists(goModPath)) {
      info.main_language = 'go';
      info.type = 'go';
    }

    return info;
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(ext, filename) {
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.clj': 'clojure',
      '.md': 'markdown',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.sql': 'sql',
      '.sh': 'shell',
      '.bash': 'shell',
      '.zsh': 'shell',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Check if file is a text file
   */
  isTextFile(mimeType, ext) {
    if (mimeType.startsWith('text/')) return true;

    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
      '.py', '.rs', '.go', '.java', '.cpp', '.c', '.h', '.hpp', '.cs',
      '.php', '.rb', '.swift', '.kt', '.scala', '.clj', '.html', '.css',
      '.scss', '.sass', '.xml', '.sql', '.sh', '.bash', '.zsh', '.env',
      '.gitignore', '.dockerignore', '.editorconfig'
    ];

    return textExtensions.includes(ext);
  }

  /**
   * Check if file is a code file
   */
  isCodeFile(ext) {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.go', '.java',
      '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.swift',
      '.kt', '.scala', '.clj'
    ];

    return codeExtensions.includes(ext);
  }

  /**
   * Check if file is important (should be highlighted)
   */
  isImportantFile(relativePath, fileInfo) {
    const importantFiles = [
      'package.json', 'Cargo.toml', 'requirements.txt', 'setup.py',
      'go.mod', 'pom.xml', 'build.gradle', 'Dockerfile', 'docker-compose.yml',
      'README.md', 'CHANGELOG.md', 'LICENSE', '.gitignore', 'tsconfig.json',
      'webpack.config.js', 'vite.config.js', 'next.config.js'
    ];

    const fileName = path.basename(relativePath);
    if (importantFiles.includes(fileName)) return true;

    // Main entry points
    if (['index.js', 'main.js', 'app.js', 'server.js', 'main.py', 'main.rs', 'main.go'].includes(fileName)) {
      return true;
    }

    // Config files
    if (fileName.includes('config') || fileName.startsWith('.')) return true;

    return false;
  }

  /**
   * Extract import statements from code
   */
  extractImports(content, language) {
    const imports = [];

    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          // ES6 imports
          const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
          }
          // require() statements
          const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
          while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
          }
          break;

        case 'python':
          const pythonImportRegex = /(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g;
          while ((match = pythonImportRegex.exec(content)) !== null) {
            if (match[1]) {
              imports.push(match[1]);
            }
            imports.push(...match[2].split(',').map(s => s.trim()));
          }
          break;

        case 'go':
          const goImportRegex = /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g;
          while ((match = goImportRegex.exec(content)) !== null) {
            if (match[2]) {
              imports.push(match[2]);
            } else if (match[1]) {
              const multiImports = match[1].match(/"([^"]+)"/g);
              if (multiImports) {
                imports.push(...multiImports.map(imp => imp.replace(/"/g, '')));
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Error extracting imports for ${language}:`, error.message);
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  /**
   * Process files for ChromaDB storage
   */
  async processForChromaDB(projectName, files, projectPath) {
    console.log(`Processing ${files.length} files for ChromaDB...`);

    const codeChunks = [];

    for (const file of files) {
      if (!this.shouldProcessForChromaDB(file)) {
        continue;
      }

      try {
        const fullPath = path.join(projectPath, file.path);
        const content = await fs.readFile(fullPath, 'utf8');

        // Create chunks from the file content
        const chunks = this.chromaDB.chunkText(content, 1500, 200);

        chunks.forEach((chunk, index) => {
          if (chunk.trim().length > 100) { // Only meaningful chunks
            codeChunks.push({
              content: chunk,
              filePath: file.path,
              language: file.language,
              type: this.getChunkType(file),
              startLine: index * 40, // Rough estimation
              endLine: (index + 1) * 40
            });
          }
        });

        // Also add function/class level chunks for code files
        if (this.isCodeFile(file.extension)) {
          const semanticChunks = this.extractSemanticChunks(content, file.language);
          codeChunks.push(...semanticChunks.map(chunk => ({
            ...chunk,
            filePath: file.path,
            language: file.language
          })));
        }

      } catch (error) {
        console.error(`Error processing ${file.path} for ChromaDB:`, error.message);
      }
    }

    // Store chunks in ChromaDB
    if (codeChunks.length > 0) {
      try {
        await this.chromaDB.addCodeChunks(projectName, codeChunks);
        console.log(`Stored ${codeChunks.length} code chunks in ChromaDB`);
      } catch (error) {
        console.error(`Failed to store chunks in ChromaDB:`, error.message);
      }
    }
  }

  /**
   * Check if file should be processed for ChromaDB
   */
  shouldProcessForChromaDB(file) {
    // Skip binary files
    if (!file.is_text) return false;

    // Skip very large files
    if (file.size > 500000) return false; // 500KB

    // Skip certain file types
    const skipExtensions = ['.log', '.lock', '.md5', '.sha1'];
    if (skipExtensions.includes(file.extension)) return false;

    return true;
  }

  /**
   * Get chunk type based on file
   */
  getChunkType(file) {
    if (file.extension === '.md') return 'documentation';
    if (file.extension === '.json') return 'config';
    if (file.name.toLowerCase().includes('test')) return 'test';
    if (this.isCodeFile(file.extension)) return 'code';
    return 'text';
  }

  /**
   * Extract semantic chunks (functions, classes) from code
   */
  extractSemanticChunks(content, language) {
    const chunks = [];

    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          // Extract functions
          const functionRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>)|class\s+\w+)[\s\S]*?(?=\n(?:function|const\s+\w+\s*=|class\s+\w+|export|$)|$)/g;
          let match;
          while ((match = functionRegex.exec(content)) !== null) {
            if (match[0].trim().length > 150) {
              chunks.push({
                content: match[0].trim(),
                type: 'function'
              });
            }
          }
          break;

        case 'python':
          // Extract functions and classes
          const pythonRegex = /(?:def\s+\w+|class\s+\w+)[\s\S]*?(?=\n(?:def\s+\w+|class\s+\w+|$)|$)/g;
          while ((match = pythonRegex.exec(content)) !== null) {
            if (match[0].trim().length > 150) {
              chunks.push({
                content: match[0].trim(),
                type: match[0].trim().startsWith('class') ? 'class' : 'function'
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Error extracting semantic chunks:`, error.message);
    }

    return chunks;
  }

  /**
   * Detect frameworks from file analysis
   */
  detectFrameworks(files) {
    const frameworks = new Set();

    for (const file of files) {
      if (file.imports) {
        for (const imp of file.imports) {
          if (imp.includes('react')) frameworks.add('React');
          if (imp.includes('vue')) frameworks.add('Vue');
          if (imp.includes('angular')) frameworks.add('Angular');
          if (imp.includes('express')) frameworks.add('Express');
          if (imp.includes('fastapi')) frameworks.add('FastAPI');
          if (imp.includes('django')) frameworks.add('Django');
          if (imp.includes('flask')) frameworks.add('Flask');
        }
      }

      // Check file names
      if (file.name.includes('component')) frameworks.add('Component-based');
      if (file.name.includes('service')) frameworks.add('Service-oriented');
      if (file.name.includes('controller')) frameworks.add('MVC');
    }

    return Array.from(frameworks);
  }

  /**
   * Detect architectural patterns
   */
  detectPatterns(files) {
    const patterns = new Set();

    // Check directory structure patterns
    const dirs = new Set(files.map(f => path.dirname(f.path)).filter(d => d !== '.'));

    if (dirs.has('src') || dirs.has('lib')) patterns.add('Source separation');
    if (dirs.has('components')) patterns.add('Component architecture');
    if (dirs.has('services')) patterns.add('Service layer');
    if (dirs.has('controllers')) patterns.add('MVC pattern');
    if (dirs.has('models') || dirs.has('entities')) patterns.add('Data modeling');
    if (dirs.has('utils') || dirs.has('helpers')) patterns.add('Utility functions');
    if (dirs.has('types') || dirs.has('interfaces')) patterns.add('Type definitions');
    if (dirs.has('tests') || dirs.has('__tests__')) patterns.add('Testing');

    return Array.from(patterns);
  }
}