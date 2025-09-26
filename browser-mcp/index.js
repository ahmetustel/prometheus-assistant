#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

class BrowserMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'browser-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.browser = null;
    this.page = null;
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'open_browser',
            description: 'Open a browser and navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to',
                },
                headless: {
                  type: 'boolean',
                  description: 'Run browser in headless mode',
                  default: false,
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'get_console_logs',
            description: 'Get console logs from the current page',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of logs to return',
                  default: 50,
                },
              },
            },
          },
          {
            name: 'take_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to save screenshot',
                  default: '/tmp/screenshot.png',
                },
              },
            },
          },
          {
            name: 'evaluate_js',
            description: 'Execute JavaScript in the browser',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'JavaScript code to execute',
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'close_browser',
            description: 'Close the browser',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'open_browser':
            return await this.handleOpenBrowser(args);
          case 'get_console_logs':
            return await this.handleGetConsoleLogs(args);
          case 'take_screenshot':
            return await this.handleTakeScreenshot(args);
          case 'evaluate_js':
            return await this.handleEvaluateJS(args);
          case 'close_browser':
            return await this.handleCloseBrowser(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async initBrowser(headless = false) {
    if (!this.browser) {
      try {
        const puppeteer = await import('puppeteer');
        this.browser = await puppeteer.default.launch({
          headless,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        this.page = await this.browser.newPage();

        // Collect console logs
        this.consoleLogs = [];
        this.page.on('console', msg => {
          this.consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString(),
          });
          // Keep only last 200 logs
          if (this.consoleLogs.length > 200) {
            this.consoleLogs.shift();
          }
        });
      } catch (error) {
        throw new Error(`Failed to launch browser: ${error.message}`);
      }
    }
  }

  async handleOpenBrowser(args) {
    const { url, headless = false } = args;

    await this.initBrowser(headless);
    await this.page.goto(url, { waitUntil: 'networkidle2' });

    return {
      content: [
        {
          type: 'text',
          text: `Browser opened and navigated to: ${url}`,
        },
      ],
    };
  }

  async handleGetConsoleLogs(args) {
    const { limit = 50 } = args;

    if (!this.page) {
      throw new Error('No browser page open. Use open_browser first.');
    }

    const recentLogs = this.consoleLogs.slice(-limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            logs: recentLogs,
            total: this.consoleLogs.length,
            page_url: this.page.url(),
          }, null, 2),
        },
      ],
    };
  }

  async handleTakeScreenshot(args) {
    const { path = '/tmp/screenshot.png' } = args;

    if (!this.page) {
      throw new Error('No browser page open. Use open_browser first.');
    }

    await this.page.screenshot({ path, fullPage: true });

    return {
      content: [
        {
          type: 'text',
          text: `Screenshot saved to: ${path}`,
        },
      ],
    };
  }

  async handleEvaluateJS(args) {
    const { code } = args;

    if (!this.page) {
      throw new Error('No browser page open. Use open_browser first.');
    }

    const result = await this.page.evaluate(code);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ result }, null, 2),
        },
      ],
    };
  }

  async handleCloseBrowser(args) {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.consoleLogs = [];
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Browser closed successfully',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Browser MCP server running on stdio');
  }
}

const server = new BrowserMCPServer();
server.run().catch(console.error);