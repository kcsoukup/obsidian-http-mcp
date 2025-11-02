# SUIVI - Obsidian HTTP MCP

**Dernière mise à jour**: 2025-11-02

## Problème initial

Tous les MCP Obsidian existants utilisent stdio → BrokenPipeError avec Claude Code CLI bug #3071.

## Solution implémentée

**Serveur MCP HTTP-natif** utilisant le SDK officiel:

- Express + `StreamableHTTPServerTransport` (@modelcontextprotocol/sdk v1.20.2)
- Pattern stateless (nouveau transport par requête)
- 7 tools: list_dir, list_files, read_file, write_file, search, move_file, delete_file

## Code clé (src/server/http.ts)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const mcpServer = new Server({
  name: 'obsidian-http',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

// Enregistrer tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [/* 7 tools */]
}));

// Endpoint MCP
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

## Status actuel ✅

**Tests validés**:

- ✅ Build: `npm run build` OK
- ✅ Serveur: Port 3000
- ✅ MCP Initialize: Handshake fonctionne
- ✅ tools/list: 7 tools exposés
- ✅ Claude CLI: `claude mcp list` → Connected

**Tests curl**:

```bash
# Initialize
curl -X POST http://localhost:3000/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{...}}'

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"2","method":"tools/list","params":{}}'
```

**Installation**:

```bash
# Lancer serveur
npm run dev

# Ajouter à Claude CLI
claude mcp add --transport http obsidian-http http://localhost:3000/mcp

# Vérifier
claude mcp list
# → obsidian-http: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

## Point critique

**Header requis**: `Accept: application/json, text/event-stream`

Sans, erreur: "Not Acceptable: Client must accept both..."

## Prochaines étapes

1. Tester avec Obsidian REST API lancé (port 27123)
2. Vérifier tools dans `/mcp` de Claude CLI
3. Test complet read_file, list_files

## Environnement

- WSL2 (dev sur localhost:3000)
- Obsidian REST API Windows (172.19.32.1:27123)
- Stack: Node.js, TypeScript, Express, axios
