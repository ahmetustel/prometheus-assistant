#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ProjectContextManager } from './services/ProjectContextManager.js';
import { ProjectScanner } from './services/ProjectScanner.js';
import { ContextStorage } from './services/ContextStorage.js';

class PrometheusServer {
  constructor() {
    this.server = new Server(
      {
        name: 'prometheus-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.contextManager = new ProjectContextManager();
    this.scanner = new ProjectScanner();
    this.storage = new ContextStorage();

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_project_context',
            description: 'Get comprehensive context about a project including architecture, recent changes, and development status',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to the project directory',
                },
                include_files: {
                  type: 'boolean',
                  description: 'Whether to include file structure details',
                  default: true,
                },
              },
              required: ['project_path'],
            },
          },
          {
            name: 'search_project_knowledge',
            description: 'Search through project files, documentation, and context for specific information',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to the project directory',
                },
                query: {
                  type: 'string',
                  description: 'Search query or question',
                },
                file_types: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific file types to search in (e.g., ["js", "md", "json"])',
                },
              },
              required: ['project_path', 'query'],
            },
          },
          {
            name: 'get_development_status',
            description: 'Get current development status, recent changes, and next steps for a project',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to the project directory',
                },
                days_back: {
                  type: 'number',
                  description: 'Number of days to look back for recent changes',
                  default: 7,
                },
              },
              required: ['project_path'],
            },
          },
          {
            name: 'update_project_context',
            description: 'Update or add information to the project context (development notes, decisions, status)',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to the project directory',
                },
                update_type: {
                  type: 'string',
                  enum: ['note', 'decision', 'status', 'todo', 'completion'],
                  description: 'Type of update to make',
                },
                content: {
                  type: 'string',
                  description: 'Content to add or update',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags to associate with this update',
                },
              },
              required: ['project_path', 'update_type', 'content'],
            },
          },
          {
            name: 'scan_project',
            description: 'Perform a fresh scan of the project to update file structure and analyze codebase',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to the project directory',
                },
                force_refresh: {
                  type: 'boolean',
                  description: 'Force a complete refresh of project analysis',
                  default: false,
                },
              },
              required: ['project_path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_project_context':
            return await this.handleGetProjectContext(args);
          case 'search_project_knowledge':
            return await this.handleSearchProjectKnowledge(args);
          case 'get_development_status':
            return await this.handleGetDevelopmentStatus(args);
          case 'update_project_context':
            return await this.handleUpdateProjectContext(args);
          case 'scan_project':
            return await this.handleScanProject(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async handleGetProjectContext(args) {
    const { project_path, include_files = true } = args;
    const context = await this.contextManager.getProjectContext(project_path, { include_files });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context, null, 2),
        },
      ],
    };
  }

  async handleSearchProjectKnowledge(args) {
    const { project_path, query, file_types } = args;
    const results = await this.contextManager.searchProject(project_path, query, { file_types });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async handleGetDevelopmentStatus(args) {
    const { project_path, days_back = 7 } = args;
    const status = await this.contextManager.getDevelopmentStatus(project_path, { days_back });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  async handleUpdateProjectContext(args) {
    const { project_path, update_type, content, tags } = args;
    const result = await this.contextManager.updateContext(project_path, {
      type: update_type,
      content,
      tags: tags || [],
      timestamp: new Date().toISOString(),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, update: result }, null, 2),
        },
      ],
    };
  }

  async handleScanProject(args) {
    const { project_path, force_refresh = false } = args;
    const scanResult = await this.scanner.scanProject(project_path, { force_refresh });
    await this.storage.saveProjectData(project_path, scanResult);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            scanned_files: scanResult.fileCount,
            directories: scanResult.directoryCount,
            last_updated: scanResult.timestamp,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Prometheus MCP server running on stdio');
  }
}

const server = new PrometheusServer();
server.run().catch(console.error);