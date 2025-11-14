# Plan: Partial Read Implementation (Option D)

**Date:** 2025-11-14
**Status:** edit_file Phase 1 ✅ DONE | Next: Partial read for 94% token reduction
**Goal:** Add offset/limit params to read_file for true token optimization

---

## ✅ Current State (Phase 1 Complete)

**Implemented:**
- `edit_file` tool (src/tools/edit.ts - 88 lines)
- Pattern matching: old_string/new_string
- replace_all flag
- Uniqueness validation
- Cache invalidation

**Limitation:**
- Reads FULL file every time
- No token optimization yet

---

## 🎯 Why Option D Wins

### PATCH (rejected) vs Partial Read (optimal)

| Approach | Token Cost | Flexibility | Real Use Case |
|----------|------------|-------------|---------------|
| **PATCH (v3.0+)** | Full file read | Heading/block only | AI must read full file to find heading path |
| **Partial Read** | 50 lines only | Universal | Read top 50 lines → edit title → 94% saved |

**PATCH false promise:**
- AI doesn't know heading paths without reading file first
- Heading names change → brittle
- Pattern matching works anywhere (no structure dependency)

**Partial read truth:**
- AI reads 50 lines instead of 300 (94% reduction)
- Works with edit_file (universal pattern)
- Works with any tool (search, write, etc.)

---

## 📐 Implementation Plan

### File to Modify

**Single file:** `src/tools/read.ts` (~20 lines added)

### API Extension

```typescript
read_file({
  path: string,
  offset?: number,  // Start line (0-based)
  limit?: number    // Number of lines to read
})
```

**Backward compatible:** Default = full file (offset/limit omitted)

### Logic

```typescript
export async function readFile(
  client: ObsidianClient,
  args: { path: string; offset?: number; limit?: number }
): Promise<ToolResult> {
  try {
    const content = await client.readFile(args.path);

    // Partial read requested
    if (args.offset !== undefined || args.limit !== undefined) {
      const lines = content.split('\n');
      const start = args.offset || 0;
      const end = args.limit ? start + args.limit : lines.length;
      const partial = lines.slice(start, end).join('\n');

      return {
        success: true,
        data: {
          content: partial,
          total_lines: lines.length,
          returned_lines: end - start,
          offset: start
        }
      };
    }

    // Full read (backward compatible)
    return {
      success: true,
      data: content
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Tool Schema Update

```typescript
// src/server/http.ts
{
  name: 'read_file',
  description: 'Read file content. Use offset/limit for partial reads (94% token reduction).',
  inputSchema: {
    properties: {
      path: { type: 'string', description: 'File path' },
      offset: { type: 'number', description: 'Start line (0-based, optional)' },
      limit: { type: 'number', description: 'Lines to read (optional, omit for all)' }
    },
    required: ['path']
  }
}
```

---

## 📊 Real Use Cases

### Case 1: Edit title (top of file)
**Before:**
```
read_file("note.md") → 5000 tokens (300 lines)
edit_file(old="# Old", new="# New") → 0 tokens
```
Total: 5000 tokens

**After:**
```
read_file("note.md", offset=0, limit=20) → 300 tokens (20 lines)
edit_file(old="# Old", new="# New") → 0 tokens
```
Total: 300 tokens → **94% reduction**

### Case 2: Edit frontmatter
```
read_file("note.md", offset=0, limit=10) → 150 tokens
edit_file(old="status: draft", new="status: done") → 0 tokens
```

### Case 3: Replace all occurrences (needs full file)
```
read_file("note.md") → 5000 tokens (full file required)
edit_file(old="oldterm", new="newterm", replace_all=true) → 0 tokens
```

**Flexibility:** AI chooses partial or full based on need

---

## ⏱️ Implementation Timeline

**1 hour total:**

1. Update `src/tools/read.ts` logic (30 min)
2. Update `src/server/http.ts` schema (10 min)
3. Update `src/types/tools.ts` interface (5 min)
4. Test cases (15 min):
   - Full read (backward compat)
   - Partial read (offset only)
   - Partial read (limit only)
   - Partial read (offset + limit)
   - Edge: offset > file length
   - Edge: limit = 0

---

## 🎯 Success Metrics

**Before (edit_file Phase 1):**
- edit_file works ✅
- Token cost: 5000 (full read required)

**After (Option D):**
- edit_file works ✅ (unchanged)
- Token cost: 300 (partial read)
- **94% reduction**
- Universal (works with search, write, etc.)

---

## 🚀 Next Steps

1. Implement partial read (1h)
2. Test with real vault
3. Update ROADMAP.md (v1.1 complete)
4. Merge to master
5. Publish v1.1.0 to npm

---
