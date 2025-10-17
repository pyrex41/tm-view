# PRD: Refactor tm-view to Elm

## Overview

Refactor the Task Master Viewer (tm-view) from vanilla JavaScript to Elm, maintaining all existing functionality while leveraging Elm's type safety, immutability, and functional architecture. The application should be distributable as a standalone binary or JavaScript package without requiring Elm to be installed on end-user systems.

## Current State Analysis

### Technology Stack
- **Backend**: Express.js (Node.js) with RESTful API
- **Frontend**: Vanilla JavaScript (~1000 lines)
- **Styling**: Custom CSS with dark theme
- **Distribution**: npm package (`npm install -g tm-view`)
- **No build step**: Direct HTML/CSS/JS serving

### Core Features
1. **Task Management**
   - Hierarchical task tree with expand/collapse
   - Task detail panel with comprehensive information
   - Multi-level subtask support (tasks → subtasks → sub-subtasks)
   - Task selection and navigation

2. **Filtering & Search**
   - Filter by status (pending, in-progress, done, review, deferred, cancelled, blocked)
   - Filter by priority (low, medium, high, critical)
   - Real-time text search across titles/descriptions
   - Tag switching for multi-context projects

3. **PRD Viewer**
   - Browse PRD documents (`.txt` and `.md` files)
   - Markdown rendering with marked.js
   - Plain text display with syntax preservation

4. **Statistics Dashboard**
   - Total task count
   - Breakdown by status
   - Breakdown by priority
   - Tag-based statistics

5. **Hot Reloading**
   - Server-Sent Events (SSE) for real-time updates
   - Automatic data refresh when files change
   - View state preservation (scroll position, expanded tasks, selected task)

6. **Context Bar**
   - Project path
   - Git information (branch, commit hash, dirty status)
   - Current tag
   - Port number with color coding

7. **Smart Port Handling**
   - Auto-detect available port (3737-3746)
   - Display which port is being used

## Goals

### Primary Goals
1. **Type Safety**: Leverage Elm's compiler to eliminate runtime errors
2. **Maintainability**: Improve code organization and documentation
3. **Distribution**: Package as binary or JavaScript file for easy installation
4. **Feature Parity**: Maintain 100% of existing functionality
5. **Performance**: Match or exceed current performance

### Secondary Goals
1. **Better State Management**: Use Elm Architecture for cleaner state flow
2. **Improved Testing**: Leverage Elm's testability
3. **Enhanced Developer Experience**: Better IDE support and refactoring capabilities

## Technical Architecture

### Frontend (Elm)

#### Elm Application Structure
```
src/
├── Main.elm              # Application entry point
├── Types.elm             # Core types and aliases
├── State.elm             # Application state and initial values
├── Update.elm            # Update logic (Msg handling)
├── View/
│   ├── Layout.elm        # Main layout structure
│   ├── Header.elm        # Header with tabs and context bar
│   ├── Sidebar.elm       # Filters and search
│   ├── TaskList.elm      # Task tree view
│   ├── TaskDetail.elm    # Task detail panel
│   ├── PRDList.elm       # PRD document list
│   ├── PRDViewer.elm     # PRD content display
│   └── Stats.elm         # Statistics panel
├── Api.elm               # HTTP requests and decoders
├── Ports.elm             # JavaScript interop (SSE, markdown)
└── Utils/
    ├── Task.elm          # Task utilities and filters
    └── Scroll.elm        # Scroll position management
```

#### Core Types
```elm
type alias Model =
    { project : Maybe Project
    , tasks : TaskData
    , prds : List PRDDocument
    , stats : Maybe Statistics
    , selectedTask : Maybe Task
    , selectedPRD : Maybe String
    , currentTag : String
    , filters : Filters
    , view : ViewMode
    , expandedTasks : Set String
    , expandedSubtasksInDetail : Set String
    , scrollPositions : Dict String Float
    }

type Msg
    = DataLoaded (Result Http.Error LoadedData)
    | TasksReloaded (Result Http.Error TaskData)
    | TaskSelected Task
    | TaskExpanded String
    | SubtaskExpanded String
    | FilterChanged FilterType
    | SearchUpdated String
    | ViewChanged ViewMode
    | TagChanged String
    | PRDSelected String
    | PRDContentLoaded (Result Http.Error PRDContent)
    | CloseTaskDetail
    | ClosePRDViewer
    | ClearFilters
    | HotReloadEvent Value  -- From SSE port
    | ScrollPositionSaved String Float
    | NoOp
```

#### Port Requirements
```elm
-- JavaScript interop for features that require JS
port setupSSE : () -> Cmd msg
port sseMessageReceived : (Value -> msg) -> Sub msg
port renderMarkdown : String -> Cmd msg
port markdownRendered : (String -> msg) -> Sub msg
port saveScrollPosition : { key : String, position : Float } -> Cmd msg
```

### Backend (Node.js)

Keep the existing Express.js backend with minimal changes:
- No changes to API endpoints
- No changes to SSE implementation
- No changes to file watching
- Add route to serve compiled Elm JS

### Build Pipeline

#### Development Build
```bash
# Compile Elm with debug mode
elm make src/Main.elm --output=public/js/elm.js --debug

# Start Express server with watch mode
npm run dev
```

#### Production Build
```bash
# Compile Elm with optimizations
elm make src/Main.elm --output=public/js/elm.js --optimize

# Minify Elm output
terser public/js/elm.js --compress --mangle --output public/js/elm.min.js

# Bundle with Express server
npm run build
```

#### Binary Distribution
Use `pkg` or similar to create standalone executables:
```bash
# Create binaries for multiple platforms
pkg . --targets node18-linux-x64,node18-macos-x64,node18-win-x64
```

### Distribution Options

#### Option 1: npm Package (Preferred)
- Package compiled Elm JS with Express server
- User runs `npm install -g tm-view-elm`
- Zero build step for end users
- Elm not required on user's system

#### Option 2: Standalone Binary
- Bundle Node.js, Express, and compiled Elm into single binary
- Platform-specific executables (Windows, macOS, Linux)
- Larger file size but truly standalone
- Tools: `pkg`, `nexe`, or `sea` (Single Executable Applications)

#### Option 3: Hybrid Approach
- Provide both npm package and binaries
- npm for developers
- Binaries for non-technical users

## Implementation Plan

### Phase 1: Core Elm Setup
1. Initialize Elm project structure
2. Create core types and model
3. Set up basic View rendering
4. Implement API decoders for all endpoints

### Phase 2: Task View Implementation
1. Task list rendering with hierarchical structure
2. Task expansion/collapse logic
3. Task selection and detail panel
4. Subtask expansion in detail view

### Phase 3: Filtering & Search
1. Status and priority filter implementation
2. Search functionality
3. Tag switching for multi-context projects
4. Filter combination logic

### Phase 4: PRD Viewer
1. PRD list rendering
2. PRD content loading
3. Markdown rendering via ports
4. Plain text display

### Phase 5: Advanced Features
1. Statistics dashboard
2. Context bar with git info
3. Hot reload via SSE ports
4. Scroll position preservation

### Phase 6: Polish & Optimization
1. CSS integration and styling
2. Loading states and error handling
3. Accessibility improvements
4. Performance optimization

### Phase 7: Build & Distribution
1. Production build pipeline
2. Elm optimization and minification
3. Binary packaging with `pkg`
4. npm package configuration
5. Testing across platforms

## Technical Specifications

### API Integration

All existing endpoints remain unchanged:
- `GET /api/project` - Project metadata
- `GET /api/tasks` - All tasks
- `GET /api/tasks/:tag` - Tag-specific tasks
- `GET /api/prds` - List PRD documents
- `GET /api/prds/:filename` - PRD content
- `GET /api/stats` - Statistics
- `GET /api/events` - SSE endpoint for hot reload

### State Preservation Requirements

On hot reload, must preserve:
- Selected task ID and restore from fresh data
- Expanded task IDs (in task list)
- Expanded subtask IDs (in detail panel)
- Scroll position for task list
- Scroll position for detail panel
- Scroll position for PRD viewer
- Current view (tasks/PRDs)
- Active filters

### Elm-JavaScript Interop

#### SSE Integration (Port)
```javascript
// JavaScript side
app.ports.setupSSE.subscribe(function() {
  const eventSource = new EventSource('/api/events');

  eventSource.onmessage = function(event) {
    app.ports.sseMessageReceived.send(JSON.parse(event.data));
  };
});
```

```elm
-- Elm side
port setupSSE : () -> Cmd msg
port sseMessageReceived : (Value -> msg) -> Sub msg

subscriptions : Model -> Sub Msg
subscriptions model =
    sseMessageReceived HotReloadEvent
```

#### Markdown Rendering (Port)
```javascript
// JavaScript side
app.ports.renderMarkdown.subscribe(function(markdown) {
  const html = marked.parse(markdown);
  app.ports.markdownRendered.send(html);
});
```

```elm
-- Elm side
port renderMarkdown : String -> Cmd msg
port markdownRendered : (String -> msg) -> Sub msg
```

### Build Configuration

#### elm.json
```json
{
  "type": "application",
  "source-directories": ["src"],
  "elm-version": "0.19.1",
  "dependencies": {
    "direct": {
      "elm/browser": "1.0.2",
      "elm/core": "1.0.5",
      "elm/html": "1.0.0",
      "elm/http": "2.0.0",
      "elm/json": "1.1.3",
      "elm/url": "1.0.0"
    },
    "indirect": {
      "elm/bytes": "1.0.8",
      "elm/file": "1.0.5",
      "elm/time": "1.0.0",
      "elm/virtual-dom": "1.0.3"
    }
  },
  "test-dependencies": {
    "direct": {},
    "indirect": {}
  }
}
```

#### package.json (additions)
```json
{
  "scripts": {
    "elm:dev": "elm make src/Main.elm --output=public/js/elm.js --debug",
    "elm:prod": "elm make src/Main.elm --output=public/js/elm.js --optimize",
    "elm:watch": "chokidar 'src/**/*.elm' -c 'npm run elm:dev'",
    "build": "npm run elm:prod && terser public/js/elm.js -o public/js/elm.min.js",
    "dev": "concurrently 'npm run elm:watch' 'node src/server.js'",
    "package:binary": "npm run build && pkg . --targets node18-linux-x64,node18-macos-x64,node18-win-x64"
  },
  "devDependencies": {
    "chokidar-cli": "^3.0.0",
    "concurrently": "^8.0.0",
    "terser": "^5.19.0",
    "pkg": "^5.8.1"
  }
}
```

## UI/UX Preservation

All existing UI/UX must be preserved:
- Dark theme with zinc/blue color scheme
- Responsive layout
- Smooth transitions and animations
- Badge styling for status and priority
- Monospace font for code elements
- Task expansion arrows (▶ collapsed, ▼ expanded)
- Context bar with colored port indicator
- Empty states with emoji icons

## Data Structures

### Task Format
```elm
type alias Task =
    { id : String
    , title : String
    , description : Maybe String
    , status : Status
    , priority : Maybe Priority
    , dependencies : List String
    , details : Maybe String
    , testStrategy : Maybe String
    , subtasks : List Task
    }

type Status
    = Pending
    | InProgress
    | Done
    | Review
    | Deferred
    | Cancelled
    | Blocked

type Priority
    = Low
    | Medium
    | High
    | Critical
```

### Filter Logic
```elm
type alias Filters =
    { status : List Status
    , priority : List Priority
    , search : String
    }

-- Hierarchical filtering:
-- - If parent matches, show all subtasks
-- - If subtask matches, show parent
-- - Combine filters with AND logic
```

## Testing Strategy

### Unit Tests (Elm Test)
- Filter logic
- Task tree flattening
- JSON decoders
- State updates

### Integration Tests
- API integration
- Port communication
- Hot reload behavior

### Manual Testing
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Platform testing (macOS, Linux, Windows)
- Binary distribution testing
- npm package installation testing

## Migration Strategy

### Parallel Development
1. Keep existing vanilla JS version functional
2. Develop Elm version in parallel
3. Run both side-by-side for comparison
4. Switch over when feature parity is achieved

### Gradual Migration (Alternative)
1. Set up Elm alongside existing JS
2. Migrate components one at a time
3. Use ports for communication between Elm and remaining JS
4. Complete migration incrementally

### Recommended: Parallel Development
- Cleaner separation
- Easier testing
- No hybrid state to manage
- Clear cutover point

## Success Criteria

### Functional Requirements
- [ ] All existing features work identically
- [ ] No regression in user experience
- [ ] Hot reload preserves all state correctly
- [ ] Filters work with hierarchical logic
- [ ] Markdown rendering works via ports
- [ ] SSE connection is stable

### Non-Functional Requirements
- [ ] Compilation time < 10 seconds for dev builds
- [ ] Binary size < 100MB per platform
- [ ] npm package installs without Elm dependency
- [ ] Initial page load < 2 seconds
- [ ] Memory usage similar to vanilla JS version

### Code Quality
- [ ] Zero runtime errors in Elm code
- [ ] Type coverage at 100%
- [ ] All public functions documented
- [ ] Consistent naming conventions
- [ ] Module structure is logical and navigable

## Risks & Mitigations

### Risk 1: Port Complexity
**Risk**: JavaScript interop via ports may be complex
**Mitigation**: Keep ports minimal (SSE, markdown only), use robust JSON encoding

### Risk 2: Binary Size
**Risk**: Standalone binaries may be too large
**Mitigation**: Offer both npm package and binary options

### Risk 3: Build Complexity
**Risk**: Build pipeline may become complex
**Mitigation**: Use simple npm scripts, document clearly, provide makefile

### Risk 4: Learning Curve
**Risk**: Team unfamiliar with Elm
**Mitigation**: Comprehensive documentation, pair programming, incremental learning

### Risk 5: Performance Regression
**Risk**: Elm version may be slower than vanilla JS
**Mitigation**: Profile early, use lazy rendering, optimize JSON decoders

## Documentation Requirements

### Developer Documentation
- [ ] README with setup instructions
- [ ] Architecture decision records (ADRs)
- [ ] API documentation
- [ ] Port usage guide
- [ ] Build and deployment guide

### User Documentation
- [ ] Installation instructions (npm and binary)
- [ ] No functional changes from user perspective
- [ ] Migration guide (if any user-facing changes)

## Timeline Estimation

- **Phase 1**: Core Setup - 2 days
- **Phase 2**: Task View - 3 days
- **Phase 3**: Filtering - 2 days
- **Phase 4**: PRD Viewer - 2 days
- **Phase 5**: Advanced Features - 3 days
- **Phase 6**: Polish - 2 days
- **Phase 7**: Distribution - 2 days
- **Testing & QA**: 2 days

**Total**: ~18 days (3-4 weeks with buffer)

## Future Enhancements (Post-Migration)

1. **Improved Error Handling**: Better error messages with Elm's type system
2. **Undo/Redo**: Leverage Elm's immutability for time-travel debugging
3. **Keyboard Navigation**: Full keyboard shortcuts
4. **Advanced Filtering**: Saved filter presets
5. **Export Features**: Export tasks to JSON/CSV
6. **Dark/Light Theme Toggle**: User preference persistence
7. **Accessibility**: ARIA labels, screen reader support
8. **Offline Support**: Service worker integration

## Appendix

### Key Elm Packages to Use
- `elm/core` - Core language features
- `elm/html` - HTML generation
- `elm/json` - JSON encoding/decoding
- `elm/http` - HTTP requests
- `elm/browser` - Browser APIs
- `elm/url` - URL parsing
- `elm-community/list-extra` - List utilities
- `elm-community/dict-extra` - Dict utilities

### Resources
- [Elm Guide](https://guide.elm-lang.org/)
- [Elm Architecture](https://guide.elm-lang.org/architecture/)
- [Elm JSON Decoders](https://guide.elm-lang.org/effects/json.html)
- [Elm Ports](https://guide.elm-lang.org/interop/ports.html)
- [pkg - Node.js Binary Packaging](https://github.com/vercel/pkg)

### Open Questions
1. Should we use elm-ui or stick with HTML/CSS?
   - **Recommendation**: Stick with HTML/CSS for easier migration and styling preservation
2. Do we need elm-test for this project?
   - **Recommendation**: Yes, for decoder testing and filter logic
3. Should we support older browsers?
   - **Recommendation**: Modern browsers only (same as current version)
4. What's the minimum Node.js version for binaries?
   - **Recommendation**: Node 18+ (LTS)
