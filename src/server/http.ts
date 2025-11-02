import { Hono } from 'hono';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type { ObsidianClient } from '../client/obsidian.js';
import { listDir, listFiles } from '../tools/list.js';
import { readFile } from '../tools/read.js';
import { writeFile } from '../tools/write.js';
import { search } from '../tools/search.js';
import { moveFile } from '../tools/move.js';
import { deleteFile } from '../tools/delete.js';

export function createHttpServer(client: ObsidianClient, port: number) {
  const app = new Hono();

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({ status: 'ok' });
  });

  // MCP endpoint
  app.post('/mcp', async (c) => {
    try {
      const request = await c.req.json();

      // Handle tools/list
      if (request.method === 'tools/list') {
        return c.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'list_dir',
                description: 'List subdirectories in a path',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'Path to list (optional, default: root)' },
                  },
                },
              },
              {
                name: 'list_files',
                description: 'List files in a directory',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'Path to list (optional, default: root)' },
                    extension: { type: 'string', description: 'Filter by extension (e.g., "md")' },
                  },
                },
              },
              {
                name: 'read_file',
                description: 'Read content of a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'Path to file' },
                  },
                  required: ['path'],
                },
              },
              {
                name: 'write_file',
                description: 'Create or update a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'Path to file' },
                    content: { type: 'string', description: 'File content' },
                    mode: {
                      type: 'string',
                      enum: ['create', 'overwrite', 'append'],
                      description: 'Write mode',
                    },
                  },
                  required: ['path', 'content'],
                },
              },
              {
                name: 'search',
                description: 'Search for text across all files',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    case_sensitive: { type: 'boolean', description: 'Case sensitive search' },
                    regex: { type: 'boolean', description: 'Use regex pattern' },
                    max_results: { type: 'number', description: 'Maximum results (default: 100)' },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'move_file',
                description: 'Move or rename a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    source: { type: 'string', description: 'Source path' },
                    destination: { type: 'string', description: 'Destination path' },
                    overwrite: { type: 'boolean', description: 'Overwrite if exists' },
                  },
                  required: ['source', 'destination'],
                },
              },
              {
                name: 'delete_file',
                description: 'Delete a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'Path to file' },
                    confirm: { type: 'boolean', description: 'Confirm deletion (required)' },
                  },
                  required: ['path', 'confirm'],
                },
              },
            ],
          },
        });
      }

      // Handle tools/call
      if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;

        let result;
        switch (name) {
          case 'list_dir':
            result = await listDir(client, args);
            break;
          case 'list_files':
            result = await listFiles(client, args);
            break;
          case 'read_file':
            result = await readFile(client, args);
            break;
          case 'write_file':
            result = await writeFile(client, args);
            break;
          case 'search':
            result = await search(client, args);
            break;
          case 'move_file':
            result = await moveFile(client, args);
            break;
          case 'delete_file':
            result = await deleteFile(client, args);
            break;
          default:
            return c.json({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32601,
                message: `Unknown tool: ${name}`,
              },
            });
        }

        if (result.success) {
          return c.json({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result.data, null, 2),
                },
              ],
            },
          });
        } else {
          return c.json({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: result.error,
            },
          });
        }
      }

      return c.json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      });
    } catch (error) {
      return c.json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      });
    }
  });

  return app;
}
