# Publish Checklist for tm-view

## ✅ Pre-Publish Checklist (Completed)

- [x] GitHub repository linked in package.json
- [x] README.md updated with badges and repo link
- [x] LICENSE file created (MIT)
- [x] CHANGELOG.md created
- [x] .npmignore configured
- [x] package.json metadata complete
- [x] All features tested locally

## 📦 Ready to Publish!

### Step 1: Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### Step 2: Test Package Locally

```bash
# Install dependencies
npm install

# Link globally for testing
npm link

# Test in a Task Master project
cd /path/to/taskmaster/project
tm-view
```

### Step 3: Publish to npm

```bash
# Dry run (see what will be published)
npm publish --dry-run

# Actually publish
npm publish
```

### Step 4: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "feat: initial release v1.0.0"

# Create tag
git tag v1.0.0

# Push to GitHub
git push origin main
git push origin --tags
```

### Step 5: Verify Publication

1. **Check npm**: https://www.npmjs.com/package/tm-view
2. **Test install**: `npm install -g tm-view`
3. **Create GitHub release**: https://github.com/pyrex41/tm-view/releases/new
   - Tag: v1.0.0
   - Title: v1.0.0 - Initial Release
   - Description: Copy from CHANGELOG.md

## 🔄 Future Updates

When making changes:

```bash
# Make your changes
git add .
git commit -m "feat: description"

# Update version (patch/minor/major)
npm version patch  # 1.0.0 -> 1.0.1

# Publish
npm publish

# Push
git push origin main --tags
```

## 📊 Package Info

- **Name**: tm-view
- **Version**: 1.0.0
- **Registry**: https://registry.npmjs.org/
- **GitHub**: https://github.com/pyrex41/tm-view
- **License**: MIT

## 🎉 What Users Will Get

After publishing, users can install with:

```bash
npm install -g tm-view
```

And use immediately:

```bash
cd /path/to/taskmaster/project
tm-view
```

The package size is very small (~89 dependencies, all essential).
