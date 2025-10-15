# Publishing tm-view to npm

## Prerequisites

1. You must have an npm account
2. You must be logged in: `npm login`
3. Package name must be available (check at npmjs.com/package/tm-view)

## Publishing Steps

### 1. Update Version

```bash
# For bug fixes
npm version patch

# For new features (backward compatible)
npm version minor

# For breaking changes
npm version major
```

This automatically:
- Updates version in package.json
- Creates a git commit
- Creates a git tag

### 2. Publish to npm

```bash
npm publish
```

The package includes:
- `/bin` - CLI executable
- `/src` - Server code
- `/public` - Frontend files (HTML, CSS, JS)
- `README.md`, `LICENSE`, `package.json`

### 3. Push to GitHub

```bash
git push origin main --tags
```

## What Gets Published

Files included (defined by what's NOT in `.npmignore`):
- ✅ `/bin/tm-view.js` - CLI entry point
- ✅ `/src/server.js` - Express server
- ✅ `/public/**/*` - All frontend files
- ✅ `package.json` - Package metadata
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - MIT license

Files excluded:
- ❌ `.git/` - Git history
- ❌ `node_modules/` - Dependencies (users install these)
- ❌ `SCROLLING_FIX.md` - Development docs
- ❌ `.DS_Store` - Mac files

## Post-Publish

1. Verify on npm: https://www.npmjs.com/package/tm-view
2. Test installation: `npm install -g tm-view`
3. Create GitHub release with changelog

## Updating After Publish

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"

# Update version
npm version patch  # or minor/major

# Publish
npm publish

# Push to GitHub
git push origin main --tags
```

## Version Strategy

- **Patch** (1.0.X): Bug fixes, documentation updates
- **Minor** (1.X.0): New features, non-breaking changes
- **Major** (X.0.0): Breaking changes, major refactors

Current version: 1.0.0 (initial release)
