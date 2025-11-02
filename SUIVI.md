# SUIVI - Session 2025-11-02

## Problème découvert

**Status actuel**: Serveur HTTP custom qui imite MCP, mais **pas un vrai MCP server**.

**Symptômes**:
- `claude mcp list` ne détecte pas le serveur
- Besoin de curl manuel pour tester
- SDK MCP (@modelcontextprotocol/sdk) jamais initialisé correctement

**Cause racine**:
- J'ai créé un endpoint HTTP `/mcp` custom avec Hono
- J'ai implémenté manuellement le protocole JSON-RPC MCP
- Je n'ai **pas utilisé** le vrai transport MCP du SDK officiel

## Code problématique

`src/server/http.ts`: Implémentation custom, pas le vrai SDK.

```typescript
// ❌ MAUVAIS - Custom Hono endpoint
app.post('/mcp', async (c) => {
  // Manual JSON-RPC handling
});
```

## Solution attendue

Utiliser le vrai SDK MCP avec **HTTP transport**.

```typescript
// ✅ BON - Vrai SDK MCP
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { HTTPServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
```

## Questions résolues

1. **MCP Server ou MCP Client?**
   - ✅ **Server** (expose des tools à Claude)
   - ❌ Client (consomme des tools - pas notre cas)

2. **HTTP Transport existe dans le SDK?**
   - ✅ **OUI**: `StreamableHTTPServerTransport` depuis SDK v1.20.2
   - Import: `@modelcontextprotocol/sdk/server/streamableHttp.js`
   - Protocole: Streamable HTTP (2025-03-26 spec)

## Solution technique

**Stack final**:
- Express (remplace Hono) - serveur HTTP standard
- `StreamableHTTPServerTransport` - transport MCP officiel
- `Server` du SDK - gestion MCP complète

**Pattern**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const server = new Server({...});
const app = express();

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

## Actions

- [x] Relire doc MCP SDK
- [x] Vérifier HTTPServerTransport → `StreamableHTTPServerTransport` trouvé
- [x] Update TECHNICAL.md (Express + StreamableHTTPServerTransport)
- [x] Install Express dependency
- [x] Réécrire src/server/http.ts avec vrai SDK
- [x] Tester avec `claude mcp list`
- [x] Valider détection automatique

## ✅ Résolution finale

**Date**: 2025-11-02

**Problème résolu**: Serveur MCP non détecté par `claude mcp list`

**Solution implémentée**:
1. Remplacé Hono par Express
2. Implémenté StreamableHTTPServerTransport du SDK officiel
3. Utilisé `Server.setRequestHandler()` pour enregistrer les tools
4. Découvert commande d'installation correcte: `claude mcp add --transport http`

**Résultat**:
```bash
$ claude mcp list
obsidian-http: http://localhost:3000/mcp (HTTP) - ✓ Connected
```

**Installation user**:
```bash
# 1. Start server
npm run dev

# 2. Add to Claude CLI
claude mcp add --transport http obsidian http://localhost:3000/mcp

# 3. Verify
claude mcp list
```

**Commit**: fee8b6c - "Fix: Replace custom HTTP with StreamableHTTPServerTransport"

**Status**: ✅ **FONCTIONNEL** - Serveur MCP conforme spec 2025-03-26

## Contexte technique final

**Env**: WSL2 (dev) + Windows (test avec Obsidian)
- Serveur dev sur WSL2 (localhost:3000)
- Obsidian REST API sur Windows (172.19.32.1:27123 depuis WSL2)

**Stack finale**:
- Node.js, TypeScript
- Express 4.21.2
- @modelcontextprotocol/sdk v1.20.2 (StreamableHTTPServerTransport)
- axios (Obsidian REST API)
