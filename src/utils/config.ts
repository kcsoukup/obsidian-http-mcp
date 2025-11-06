import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Config } from '../types/index.js';

loadEnv();

export const CONFIG_DIR = join(homedir(), '.obsidian-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface PartialConfig {
  apiKey?: string;
  baseUrl?: string;
  port?: number;
}

/**
 * Load config from ~/.obsidian-mcp/config.json
 * Returns partial config (all fields optional)
 */
export function loadConfigFile(): PartialConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    // Validate structure
    const config: PartialConfig = {};

    if (typeof parsed.apiKey === 'string') {
      config.apiKey = parsed.apiKey;
    }

    if (typeof parsed.baseUrl === 'string') {
      // Basic URL validation
      if (!parsed.baseUrl.startsWith('http://') && !parsed.baseUrl.startsWith('https://')) {
        console.warn(`Warning: baseUrl should start with http:// or https://, got: ${parsed.baseUrl}`);
      }
      config.baseUrl = parsed.baseUrl;
    }

    if (typeof parsed.port === 'number') {
      config.port = parsed.port;
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${CONFIG_FILE}: ${error.message}`);
    }
    throw new Error(`Error reading ${CONFIG_FILE}: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Load config with priority chain:
 * 1. CLI args (passed separately in index.ts)
 * 2. Environment variables
 * 3. ~/.obsidian-mcp/config.json
 * 4. .env file (via dotenv)
 * 5. Defaults
 */
export function loadConfig(): Config {
  // Load from config file
  const fileConfig = loadConfigFile();

  // Priority chain (env vars override file config)
  const apiKey = process.env.OBSIDIAN_API_KEY || fileConfig.apiKey;
  const baseUrl = process.env.OBSIDIAN_BASE_URL || fileConfig.baseUrl || 'http://127.0.0.1:27123';
  const portStr = process.env.PORT || (fileConfig.port ? String(fileConfig.port) : '3000');

  // Validate API key
  if (!apiKey) {
    throw new Error(
      'API key not found. Please run "obsidian-http-mcp --setup" or set OBSIDIAN_API_KEY env var.'
    );
  }

  // Validate port
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${portStr}. Must be a number between 1 and 65535.`);
  }

  return {
    apiKey,
    baseUrl,
    port,
  };
}
