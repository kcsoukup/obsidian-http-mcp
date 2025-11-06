#!/usr/bin/env node

import { VERSION } from './utils/version.js';
import { createInterface } from 'readline';
import { mkdirSync, writeFileSync, existsSync, chmodSync } from 'fs';
import { CONFIG_DIR, CONFIG_FILE } from './utils/config.js';

interface CliArgs {
  apiKey?: string;
  baseUrl?: string;
  port?: number;
  setup?: boolean;
  help?: boolean;
  version?: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--version' || arg === '-v') {
      args.version = true;
    } else if (arg === '--setup') {
      args.setup = true;
    } else if (arg === '--api-key' && i + 1 < argv.length) {
      args.apiKey = argv[++i];
    } else if (arg === '--base-url' && i + 1 < argv.length) {
      args.baseUrl = argv[++i];
    } else if (arg === '--port' && i + 1 < argv.length) {
      args.port = parseInt(argv[++i], 10);
    }
  }

  return args;
}

export function showHelp(): void {
  console.log(`
Obsidian HTTP MCP Server

USAGE:
  obsidian-http-mcp [OPTIONS]

OPTIONS:
  --setup              Interactive setup (saves config to ~/.obsidian-mcp/config.json)
  --api-key <key>      Obsidian REST API key
  --base-url <url>     Obsidian REST API URL (default: http://127.0.0.1:27123)
  --port <number>      Server port (default: 3000)
  --help, -h           Show this help message
  --version, -v        Show version

CONFIG PRIORITY:
  1. CLI arguments (--api-key, --base-url, --port)
  2. Environment variables (OBSIDIAN_API_KEY, OBSIDIAN_BASE_URL, PORT)
  3. Config file (~/.obsidian-mcp/config.json)
  4. .env file in current directory

EXAMPLES:
  obsidian-http-mcp --setup
  obsidian-http-mcp
  obsidian-http-mcp --api-key YOUR_API_KEY --port 3000
  OBSIDIAN_API_KEY=xxx obsidian-http-mcp

For more info: https://github.com/yourusername/obsidian-http-mcp
  `);
}

export function showVersion(): void {
  console.log(`obsidian-http-mcp v${VERSION}`);
}

/**
 * Prompt user for input (async)
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const displayQuestion = defaultValue
      ? `${question} (default: ${defaultValue}): `
      : `${question}: `;

    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Interactive setup wizard
 */
export async function runSetup(): Promise<void> {
  console.log('\n=== Obsidian HTTP MCP Setup ===\n');

  // Prompt for API key (required)
  const apiKey = await prompt('Enter your Obsidian REST API key');

  if (!apiKey) {
    console.error('Error: API key is required');
    process.exit(1);
  }

  // Prompt for base URL (optional)
  const baseUrl = await prompt(
    'Enter Obsidian REST API URL',
    'http://127.0.0.1:27123'
  );

  // Prompt for port (optional)
  const portStr = await prompt(
    'Enter server port',
    '3000'
  );

  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`Error: Invalid port "${portStr}". Must be a number between 1 and 65535.`);
    process.exit(1);
  }

  // Create config directory
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Create config object
  const config = {
    apiKey,
    baseUrl,
    port,
  };

  // Write config file
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

    // Set file permissions to 0600 (owner read/write only)
    // Note: chmod doesn't work on Windows, but won't throw error
    try {
      chmodSync(CONFIG_FILE, 0o600);
    } catch {
      // Ignore on Windows
    }

    console.log(`\n✓ Configuration saved to: ${CONFIG_FILE}`);
    console.log('\nYou can now start the server with:');
    console.log('  obsidian-http-mcp\n');
  } catch (error) {
    console.error('Error writing config file:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
