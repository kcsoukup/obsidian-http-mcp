import type { ObsidianClient } from '../client/obsidian.js';
import type { ToolResult } from '../types/index.js';
import type { GetFileInfoArgs, FileInfoData } from '../types/tools.js';

export async function getFileInfo(
  client: ObsidianClient,
  args: GetFileInfoArgs
): Promise<ToolResult> {
  try {
    if (!args.path) {
      return {
        success: false,
        error: 'path parameter is required',
      };
    }

    // Reject directory paths (must be file path without trailing slash)
    if (args.path.endsWith('/')) {
      return {
        success: false,
        error: 'Path must be a file (no trailing slash). Use list_dir for directories.',
      };
    }

    const { size, modified } = await client.getFileInfo(args.path);

    const data: FileInfoData = {
      path: args.path,
      size,
      modified,
      exists: true,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    // File not found = return exists: false (not an error)
    if (error instanceof Error && error.message.includes('not found')) {
      return {
        success: true,
        data: {
          path: args.path,
          size: 0,
          modified: '',
          exists: false,
        },
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
