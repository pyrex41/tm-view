# Changelog

All notable changes to tm-view will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - 2025-01-22

### Added
- **Task Status Editing** - Direct status updates for tasks and subtasks
- Status dropdowns in task detail view with all valid statuses (pending, in-progress, done, review, deferred, cancelled)
- Backend API endpoint `PUT /api/tasks/:tag/:taskId/status` for status updates
- Proper tag context handling - updates tasks within the correct tag namespace
- Recursive status updates for subtasks at any depth level
- Real-time UI updates with success/error notifications
- Status dropdown styling with different sizes for main tasks, subtasks, and sub-subtasks
- Event handling fixes to prevent dropdown flashing and interference with task expansion

### Fixed
- Dropdown flashing issue when clicking status selectors
- Event propagation conflicts between dropdowns and subtask expansion

## [Unreleased]

### Added
- **Mermaid diagram viewer** - New "Mermaid" tab to view diagram files
- Automatic discovery of all `.mmd` and `.mermaid` files throughout the repository
- Live rendering of Mermaid diagrams with dark theme optimization
- **Excalidraw integration** - One-click button to copy Mermaid content and open Excalidraw
- Simple workflow: Click Excalidraw button → Content copied → Excalidraw opens → Paste to convert
- **Quick action buttons**: Copy Mermaid content, Open in Cursor, Open in Excalidraw
- 95vh full-screen Excalidraw modal with dark theme integration
- Larger, more readable diagram rendering with improved spacing
- Full file path display for easy navigation to diagram sources
- Support for all Mermaid diagram types (flowcharts, sequence diagrams, class diagrams, etc.)
- Error handling with source code display if diagram rendering fails
- New API endpoints: `GET /api/mermaid` and `GET /api/mermaid/*`
- Example Mermaid diagram files for demonstration

### Improved
- Increased Mermaid diagram font size from default to 18px for better readability
- Enhanced node and actor spacing in flowcharts and sequence diagrams
- Larger diagram rendering with 800px minimum width
- Improved text contrast and stroke width for clearer visuals

### Technical
- Integrated Mermaid.js v10 from CDN with dark theme configuration
- Integrated React 18 and Excalidraw from CDN for embedded editor
- Full-screen modal component with backdrop blur and animations
- Recursive file search function to find Mermaid files across entire project
- Security validation for file path access (prevents directory traversal)
- Dynamic SVG rendering with unique IDs per diagram
- Mermaid.js initialization with custom dark theme variables and spacing configuration
- Automatic insertion of Mermaid content as text element in Excalidraw canvas
- Modal supports ESC key, backdrop click, and close button for dismissal
- React component mounting/unmounting for proper cleanup

## [1.0.6] - 2025-10-15

### Added
- Context bar at top of UI showing project information at a glance
- Project directory path display (full path on hover)
- Git information display (branch name, commit hash, clean/dirty status)
- Task Master tag display for tagged projects
- Port-based color coding for easy visual identification when running multiple instances
- Vibrant color accent on left border and port number badge
- Port number display in context bar

### Fixed
- Hot-reload now preserves scroll positions in all panels (task list, detail, PRDs)
- Hot-reload now preserves currently selected task or PRD
- Hot-reload now preserves expanded subtasks in detail panel
- Eliminated view reset on data updates

### Technical
- Added `reloadData()` function for hot-reload without rendering
- Enhanced state preservation during SSE updates
- Port color generation using golden angle algorithm for consistent, distinct colors

## [1.0.5] - 2025-10-15

### Fixed
- Fixed task filtering mutating original task data
- Task details now show correct information after filtering
- Properly deep clones tasks during filtering to preserve original data
- Fixed task titles, descriptions, and subtasks showing incorrectly in detail panel
- Fixed subtask expansion in detail panel (type mismatch issue)
- Fixed scroll position preservation for detail panel when expanding subtasks
- Fixed hot-reload to preserve currently viewed task/PRD instead of resetting view

### Improved
- Enhanced typography with developer-friendly monospace fonts (SF Mono, Cascadia Code, JetBrains Mono, Fira Code)
- Improved readability with better line-heights and font sizes
- Better font-smoothing for crisper text rendering
- Refined letter-spacing on titles and headings for better readability

## [1.0.4] - 2025-10-15

### Fixed
- Fixed task selection showing wrong task details when filters are applied
- Task detail panel now always shows correct task matching the clicked ID
- Improved task lookup to use original unfiltered task list

## [1.0.3] - 2025-10-15

### Added
- Hot-reloading via Server-Sent Events (SSE)
- Automatic updates when tasks.json changes
- Automatic updates when PRD documents are added or modified
- Visual notification toast when data updates
- Real-time synchronization with Task Master changes

### Technical
- SSE endpoint at `/api/events` for real-time updates
- File watching for `.taskmaster/tasks/` and `.taskmaster/docs/`
- Debounced file change detection (300ms)
- Automatic reconnection on connection loss

## [1.0.2] - 2025-10-15

### Fixed
- Fixed scroll position preservation when clicking tasks
- Task list no longer jumps to top when selecting a task

### Added
- Hierarchical subtask display with expand/collapse functionality
- Expand/collapse buttons (▶/▼) for tasks with subtasks
- Proper indentation for nested subtasks
- Subtasks now visible in task detail panel
- Task count now includes all subtasks in hierarchy

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
