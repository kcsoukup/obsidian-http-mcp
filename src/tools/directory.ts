import type { ObsidianClient } from '../client/obsidian.js';
import type { ToolResult } from '../types/index.js';
import type { CreateDirectoryArgs, CreateDirectoryData } from '../types/tools.js';

export async function createDirectory(
  client: ObsidianClient,
  args: CreateDirectoryArgs
): Promise<ToolResult> {
  try {
    if (!args.path) {
      return {
        success: false,
        error: 'path parameter is required',
      };
    }

    // Validate no trailing slash in user input (we add it)
    if (args.path.endsWith('/')) {
      return {
        success: false,
        error: 'Path must not end with / (use "Notes" not "Notes/")',
      };
    }

    const { created } = await client.createDirectory(args.path);

    const data: CreateDirectoryData = {
      path: args.path,
      created,
      message: created
        ? `Directory created: ${args.path}/`
        : `Directory already exists: ${args.path}/`,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
