import type { ObsidianClient } from '../client/obsidian.js';
import type { ToolResult } from '../types/index.js';

export async function readFile(
  client: ObsidianClient,
  args: { path: string }
): Promise<ToolResult> {
  try {
    if (!args.path) {
      return {
        success: false,
        error: 'path parameter is required',
      };
    }

    const content = await client.readFile(args.path);

    return {
      success: true,
      data: { content },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
