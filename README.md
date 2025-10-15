# tm-view

[![GitHub](https://img.shields.io/badge/github-pyrex41%2Ftm--view-blue)](https://github.com/pyrex41/tm-view)
[![npm version](https://img.shields.io/npm/v/tm-view.svg)](https://www.npmjs.com/package/tm-view)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Browser-based viewer for Task Master AI projects. View tasks, PRDs, and project statistics in a clean, intuitive interface.

**Repository**: [github.com/pyrex41/tm-view](https://github.com/pyrex41/tm-view)

## Features

- 📋 View all tasks in a hierarchical tree structure
- 🔍 Filter tasks by status, priority, and search
- 🏷️ Support for tagged task lists (multi-context projects)
- 📄 View PRD documents directly in the browser
- 📊 Real-time statistics and project overview
- 🎨 Clean, dark-themed UI optimized for developer workflows

## Installation

```bash
npm install -g tm-view
```

## Usage

Navigate to any directory containing a Task Master project (with a `.taskmaster` folder) and run:

```bash
tm-view
```

The viewer will automatically:
1. Detect your Task Master project
2. Start a local server (with smart port handling)
3. Open your default browser to the viewer interface

### Smart Port Handling

If port 3737 is already in use, `tm-view` automatically finds the next available port (up to 3746):

```
✓ Task Master Viewer running!

  ➜ Local:   http://localhost:3738
  (Port 3737 was busy, using 3738)

  Project: /path/to/project
  Press Ctrl+C to stop
```

## Requirements

- Node.js >= 16.0.0
- A Task Master AI project initialized with `task-master init`

## Project Structure

The viewer reads from your `.taskmaster` directory:

```
.taskmaster/
├── tasks/
│   └── tasks.json       # Task data (required)
├── docs/                # PRD documents
│   ├── prd.txt
│   └── requirements.md
├── config.json          # Task Master config
└── state.json           # Current tag/state
```

## Features in Detail

### Task Viewing
- Hierarchical task tree with expand/collapse
- Task details panel with full information
- Dependency visualization
- Subtask navigation

### Filtering
- Filter by task status (pending, in-progress, done, etc.)
- Filter by priority (low, medium, high, critical)
- Real-time search across task titles and descriptions
- Tag switching for multi-context projects

### PRD Viewer
- Browse all PRD documents in your project
- View full document content
- **Markdown rendering** for `.md` files with beautiful formatting
- Plain text display for `.txt` files with syntax preservation

### Statistics
- Total task count
- Breakdown by status
- Breakdown by priority
- Tag-based statistics

## Development

To work on tm-view locally:

```bash
# Clone and install dependencies
git clone git@github.com:pyrex41/tm-view.git
cd tm-view
npm install

# Test locally (no build step needed!)
npm link
cd /path/to/taskmaster/project
tm-view
```

## Tech Stack

- **Backend**: Express.js server with RESTful API
- **Frontend**: Vanilla JavaScript (no framework!)
- **Styling**: Custom CSS with dark theme

### Why Vanilla JS?

This tool is intentionally built without React or any build step:
- **Faster install**: ~89 packages vs 150+ with React
- **Zero build time**: No compilation needed
- **Lighter weight**: Smaller footprint, faster startup
- **Simple to modify**: Just edit HTML/CSS/JS directly
- **No dependencies bloat**: Only essential packages

## API Endpoints

The server exposes these endpoints:

- `GET /api/project` - Project metadata
- `GET /api/tasks` - All tasks (supports both legacy and tagged formats)
- `GET /api/tasks/:tag` - Tasks for specific tag
- `GET /api/prds` - List of PRD documents
- `GET /api/prds/:filename` - Specific PRD content
- `GET /api/stats` - Project statistics

## License

MIT

## Related Projects

- [Task Master AI](https://github.com/eyaltoledano/claude-task-master) - The main task management system
