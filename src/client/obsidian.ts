import axios, { type AxiosInstance } from 'axios';
import type { ObsidianFile } from '../types/index.js';

export class ObsidianClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async listVault(path: string = ''): Promise<{ files: string[]; folders: string[] }> {
    const response = await this.client.get(`/vault/${path}`);
    return response.data;
  }

  async readFile(path: string): Promise<string> {
    const response = await this.client.get(`/vault/${path}`);
    return response.data;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.client.put(`/vault/${path}`, content, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  async appendFile(path: string, content: string): Promise<void> {
    await this.client.patch(`/vault/${path}`, content, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  async deleteFile(path: string): Promise<void> {
    await this.client.delete(`/vault/${path}`);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await this.client.get(`/vault/${path}`);
      return true;
    } catch {
      return false;
    }
  }
}
