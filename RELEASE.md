# Release Process

## Quick Release (Automated via GitHub Actions)

### 1. Update version

```bash
npm version patch  # 1.0.2 → 1.0.3
# or
npm version minor  # 1.0.2 → 1.1.0
# or
npm version major  # 1.0.2 → 2.0.0
```

### 2. Update CHANGELOG.md

Add release notes for the new version.

### 3. Commit changes

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "release(vX.Y.Z): description"
```

### 4. Push tag (triggers automatic npm publish)

```bash
git push origin master
git push --tags
```

**That's it!** GitHub Actions will automatically:

- Build the project (`npm run build`)
- Publish to npm (`npm publish`)

## Manual Release (if GitHub Actions fails)

```bash
npm run build
npm publish
```

## Verify Release

- npm: <https://www.npmjs.com/package/obsidian-http-mcp>
- GitHub: <https://github.com/NasAndNora/obsidian-http-mcp/releases>

## Troubleshooting

### Token expired

1. Generate new npm token: <https://www.npmjs.com/settings/tokens>
2. Update GitHub secret: <https://github.com/NasAndNora/obsidian-http-mcp/settings/secrets/actions>
3. Secret name must be: `NPM_TOKEN`

### GitHub Actions failing

Check workflow logs: <https://github.com/NasAndNora/obsidian-http-mcp/actions>
