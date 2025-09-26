#!/usr/bin/env node

console.error('🔥 Simple MCP Server Test Started');

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'prometheus-test',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('🛠️ Tools requested by Claude Code');
  return {
    tools: [
      {
        name: 'test_tool',
        description: 'A simple test tool to verify MCP is working',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Test message',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`🚀 Tool called: ${request.params.name}`);

  if (request.params.name === 'test_tool') {
    return {
      content: [
        {
          type: 'text',
          text: `🎉 MCP Server ÇALIŞIYOR! Mesajınız: ${request.params.arguments?.message || 'Test mesajı'}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('✅ Simple MCP Server ready on stdio');