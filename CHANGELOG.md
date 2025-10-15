# Changelog

All notable changes to tm-view will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-15

### Fixed
- Fixed flexbox scrolling throughout entire application
- Proper viewport height constraints for scrollable regions
- All content areas now scroll correctly (tasks, PRDs, details)

### Added
- Markdown rendering for PRD `.md` files with beautiful formatting
- Complete flexbox scrolling documentation in SCROLLING_FIX.md
- Enhanced metadata in package.json (repository, bugs, homepage)

## [1.0.0] - 2025-10-15

### Added
- Initial release of tm-view
- Task Master project viewer with hierarchical task display
- PRD document viewer with markdown rendering support
- Task filtering by status, priority, and search
- Statistics dashboard with real-time project overview
- Support for tagged task lists (multi-context projects)
- Smart port handling (auto-finds available port from 3737-3746)
- Dark theme optimized for developer workflows
- Vanilla JavaScript frontend (no build step required)
- RESTful API for task and project data
- Auto-opening browser on server start
- Task detail panel with full task information
- Collapsible task hierarchy with subtask support

### Technical Details
- Built with vanilla JavaScript (no React or build tools)
- Express.js backend with CORS support
- Marked.js for markdown rendering
- ~89 npm packages (lightweight!)
- Supports Node.js 16+

[1.0.0]: https://github.com/pyrex41/tm-view/releases/tag/v1.0.0
