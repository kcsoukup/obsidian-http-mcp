import { config as loadEnv } from 'dotenv';
import type { Config } from '../types/index.js';

loadEnv();

export function loadConfig(): Config {
  const apiKey = process.env.OBSIDIAN_API_KEY;

  if (!apiKey) {
    throw new Error('OBSIDIAN_API_KEY environment variable is required');
  }

  return {
    apiKey,
    baseUrl: process.env.OBSIDIAN_BASE_URL || 'http://127.0.0.1:27123',
    port: parseInt(process.env.PORT || '3000', 10),
  };
}
