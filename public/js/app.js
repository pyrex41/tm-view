// State
const state = {
  project: null,
  tasks: { tasks: [], format: 'none', tags: [] },
  prds: [],
  mermaid: [],
  stats: null,
  selectedTask: null,
  selectedPRD: null,
  selectedMermaid: null,
  currentTag: 'master',
  filters: {
    status: [],
    priority: [],
    search: ''
  },
  view: 'tasks',
  expandedTasks: new Set(), // Track which tasks have subtasks expanded in task list
  expandedSubtasksInDetail: new Set(), // Track which subtasks are expanded in detail panel
  scrollPositions: {} // Store scroll positions per view
};

// Store original unfiltered tasks (never mutate this)
let originalTasksCache = null;

// API calls
async function loadData() {
  try {
    const [projectRes, tasksRes, prdsRes, mermaidRes, statsRes] = await Promise.all([
      fetch('/api/project'),
      fetch('/api/tasks'),
      fetch('/api/prds'),
      fetch('/api/mermaid'),
      fetch('/api/stats')
    ]);

    state.project = await projectRes.json();
    state.tasks = await tasksRes.json();
    state.prds = (await prdsRes.json()).prds || [];
    state.mermaid = (await mermaidRes.json()).mermaid || [];
    state.stats = await statsRes.json();
    state.currentTag = state.project.currentTag || 'master';

    // Cache original tasks for lookups
    updateOriginalTasksCache();

    render();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('app').innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">❌</span>
        <h3>Error loading project</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Reload data without rendering (for hot-reload)
async function reloadData() {
  try {
    const [projectRes, tasksRes, prdsRes, mermaidRes, statsRes] = await Promise.all([
      fetch('/api/project'),
      fetch('/api/tasks'),
      fetch('/api/prds'),
      fetch('/api/mermaid'),
      fetch('/api/stats')
    ]);

    state.project = await projectRes.json();
    state.tasks = await tasksRes.json();
    state.prds = (await prdsRes.json()).prds || [];
    state.mermaid = (await mermaidRes.json()).mermaid || [];
    state.stats = await statsRes.json();
    state.currentTag = state.project.currentTag || 'master';

    // Cache original tasks for lookups
    updateOriginalTasksCache();
  } catch (error) {
    console.error('Error reloading data:', error);
  }
}

// Update the original tasks cache
function updateOriginalTasksCache() {
  if (state.tasks.format === 'legacy') {
    originalTasksCache = state.tasks.tasks || [];
  } else if (state.tasks.format === 'tagged') {
    if (state.tasks.currentTasks) {
      originalTasksCache = state.tasks.currentTasks;
    } else if (state.tasks.tasks[state.currentTag]) {
      originalTasksCache = state.tasks.tasks[state.currentTag].tasks || [];
    }
  }
}

async function loadTasksForTag(tag) {
  try {
    const res = await fetch(`/api/tasks/${tag}`);
    const data = await res.json();
    state.tasks.currentTasks = data.tasks;
    updateOriginalTasksCache();
    render();
  } catch (error) {
    console.error('Error loading tasks for tag:', error);
  }
}

async function loadPRDContent(filename) {
  try {
    const res = await fetch(`/api/prds/${encodeURIComponent(filename)}`);
    return await res.json();
  } catch (error) {
    console.error('Error loading PRD:', error);
    return null;
  }
}

async function loadMermaidContent(filepath) {
  try {
    console.log('Fetching Mermaid content for:', filepath);
    const res = await fetch(`/api/mermaid/${filepath}`);
    console.log('Fetch response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Mermaid data received:', data);
    return data;
  } catch (error) {
    console.error('Error loading Mermaid:', error);
    showReloadNotification('❌ Failed to load diagram: ' + error.message);
    return null;
  }
}

// Helper: Flatten tasks including subtasks
function flattenTasks(tasks) {
  const result = [];
  function flatten(taskList) {
    taskList.forEach(task => {
      result.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        flatten(task.subtasks);
      }
    });
  }
  flatten(tasks);
  return result;
}

// Helper: Check if task matches filters
function taskMatchesFilters(task) {
  if (state.filters.status.length > 0 && !state.filters.status.includes(task.status)) {
    return false;
  }
  if (state.filters.priority.length > 0 && !state.filters.priority.includes(task.priority)) {
    return false;
  }
  if (state.filters.search) {
    const searchLower = state.filters.search.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.id?.toString().includes(searchLower)
    );
  }
  return true;
}

// Deep clone a task recursively
function deepCloneTask(task) {
  const cloned = { ...task };
  if (task.subtasks && task.subtasks.length > 0) {
    cloned.subtasks = task.subtasks.map(subtask => deepCloneTask(subtask));
  }
  return cloned;
}

// Filtering
function getDisplayTasks() {
  let displayTasks = [];

  if (state.tasks.format === 'legacy') {
    displayTasks = state.tasks.tasks || [];
  } else if (state.tasks.format === 'tagged') {
    if (state.tasks.currentTasks) {
      displayTasks = state.tasks.currentTasks;
    } else if (state.tasks.tasks[state.currentTag]) {
      displayTasks = state.tasks.tasks[state.currentTag].tasks || [];
    }
  }

  // Deep clone all tasks first to avoid mutating originals
  displayTasks = displayTasks.map(task => deepCloneTask(task));

  // Filter tasks (hierarchical filtering - if parent matches, show all subtasks)
  function filterTasksRecursive(tasks) {
    const filtered = [];

    for (const task of tasks) {
      const taskMatches = taskMatchesFilters(task);
      let hasMatchingSubtasks = false;

      // Check if any subtasks match (and filter them)
      if (task.subtasks && task.subtasks.length > 0) {
        const filteredSubtasks = filterTasksRecursive(task.subtasks);
        if (filteredSubtasks.length > 0) {
          hasMatchingSubtasks = true;
          task.subtasks = filteredSubtasks;
        }
      }

      if (taskMatches || hasMatchingSubtasks) {
        filtered.push(task);
      }
    }

    return filtered;
  }

  return filterTasksRecursive(displayTasks);
}

// Render functions
function render() {
  const app = document.getElementById('app');

  // Save scroll positions before render
  const taskListContent = document.querySelector('.task-list-content');
  const taskDetailContent = document.querySelector('.task-detail-content');
  const prdContentBody = document.querySelector('.prd-content-body');
  const savedTaskListScroll = taskListContent ? taskListContent.scrollTop : 0;
  const savedDetailScroll = taskDetailContent ? taskDetailContent.scrollTop : 0;
  const savedPRDScroll = prdContentBody ? prdContentBody.scrollTop : 0;

  app.innerHTML = `
    ${renderHeader()}
    <div class="app-body">
      ${renderSidebar()}
      <main class="main-content">
        ${state.view === 'tasks' ? renderTaskView() : state.view === 'prds' ? renderPRDView() : renderMermaidView()}
      </main>
      ${state.view === 'tasks' && !state.selectedTask ? renderStats() : ''}
    </div>
  `;
  attachEventListeners();

  // Restore scroll positions after render
  const newTaskListContent = document.querySelector('.task-list-content');
  if (newTaskListContent && savedTaskListScroll > 0) {
    newTaskListContent.scrollTop = savedTaskListScroll;
  }

  const newTaskDetailContent = document.querySelector('.task-detail-content');
  if (newTaskDetailContent && savedDetailScroll > 0) {
    newTaskDetailContent.scrollTop = savedDetailScroll;
  }

  const newPRDContentBody = document.querySelector('.prd-content-body');
  if (newPRDContentBody && savedPRDScroll > 0) {
    newPRDContentBody.scrollTop = savedPRDScroll;
  }
}

// Generate a consistent color from port number
function getPortColor(port) {
  // Generate a hue based on port number (0-360 degrees)
  const hue = (port * 137.508) % 360; // Use golden angle for good distribution
  // Use higher saturation and lightness for more vibrant colors
  return `hsl(${hue}, 65%, 60%)`;
}

function renderHeader() {
  const portColor = state.project?.port ? getPortColor(state.project.port) : '#71717a';
  const portColorBg = state.project?.port ? `hsl(${(state.project.port * 137.508) % 360}, 65%, 60%, 0.15)` : 'rgba(113, 113, 122, 0.15)';

  return `
    <header class="app-header">
      ${state.project ? `
        <div class="context-bar" style="border-left: 6px solid ${portColor}; box-shadow: inset 6px 0 12px -6px ${portColor};">
          <div class="context-item">
            <span class="context-label">📁</span>
            <span class="context-value" title="${state.project.projectPath}">${state.project.projectPath}</span>
          </div>
          ${state.project.git ? `
            <div class="context-item">
              <span class="context-label">🌿</span>
              <span class="context-value">${state.project.git.branch}</span>
            </div>
            <div class="context-item">
              <span class="context-label">${state.project.git.isDirty ? '●' : '✓'}</span>
              <span class="context-value ${state.project.git.isDirty ? 'git-dirty' : 'git-clean'}">${state.project.git.isDirty ? 'modified' : 'clean'}</span>
            </div>
            <div class="context-item">
              <span class="context-label">#</span>
              <span class="context-value">${state.project.git.shortHash}</span>
            </div>
          ` : ''}
          ${state.tasks.format === 'tagged' ? `
            <div class="context-item">
              <span class="context-label">🏷️</span>
              <span class="context-value">${state.currentTag}</span>
            </div>
          ` : ''}
          ${state.project.port ? `
            <div class="context-item" style="margin-left: auto;">
              <span class="context-label">:</span>
              <span class="context-value" style="color: ${portColor}; background: ${portColorBg}; padding: 0.25rem 0.625rem; border-radius: 4px; font-weight: 600; border: 1px solid ${portColor}40;">${state.project.port}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <div class="header-content">
        <h1>📋 Task Master Viewer</h1>
        ${state.project ? `
          <div class="project-name">${state.project.projectName}</div>
        ` : ''}
      </div>
      <div class="view-tabs">
        <button class="${state.view === 'tasks' ? 'active' : ''}" data-view="tasks">Tasks</button>
        <button class="${state.view === 'prds' ? 'active' : ''}" data-view="prds">PRDs</button>
        <button class="${state.view === 'mermaid' ? 'active' : ''}" data-view="mermaid">Mermaid</button>
      </div>
    </header>
  `;
}

function renderSidebar() {
  const statusOptions = ['pending', 'in-progress', 'done', 'review', 'deferred', 'cancelled', 'blocked'];
  const priorityOptions = ['low', 'medium', 'high', 'critical'];

  return `
    <aside class="sidebar">
      <div class="sidebar-section">
        <h3>Search</h3>
        <input
          type="text"
          class="search-input"
          placeholder="Search tasks..."
          value="${state.filters.search}"
          data-search
        >
      </div>

      ${state.tasks.format === 'tagged' && state.tasks.tags.length > 1 ? `
        <div class="sidebar-section">
          <h3>Tags</h3>
          <div class="filter-group">
            ${state.tasks.tags.map(tag => `
              <button
                class="filter-tag ${tag === state.currentTag ? 'active' : ''}"
                data-tag="${tag}"
              >
                ${tag}
                ${state.stats?.byTag?.[tag] ? `<span class="count">${state.stats.byTag[tag]}</span>` : ''}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="sidebar-section">
        <h3>Status</h3>
        <div class="filter-group">
          ${statusOptions.map(status => `
            <label class="filter-option">
              <input
                type="checkbox"
                data-filter-status="${status}"
                ${state.filters.status.includes(status) ? 'checked' : ''}
              >
              <span class="badge status-${status}">${status}</span>
              ${state.stats?.byStatus?.[status] ? `<span class="count">${state.stats.byStatus[status]}</span>` : ''}
            </label>
          `).join('')}
        </div>
      </div>

      <div class="sidebar-section">
        <h3>Priority</h3>
        <div class="filter-group">
          ${priorityOptions.map(priority => `
            <label class="filter-option">
              <input
                type="checkbox"
                data-filter-priority="${priority}"
                ${state.filters.priority.includes(priority) ? 'checked' : ''}
              >
              <span class="badge priority-${priority}">${priority}</span>
              ${state.stats?.byPriority?.[priority] ? `<span class="count">${state.stats.byPriority[priority]}</span>` : ''}
            </label>
          `).join('')}
        </div>
      </div>

      ${(state.filters.status.length > 0 || state.filters.priority.length > 0 || state.filters.search) ? `
        <button class="clear-filters" data-clear-filters>Clear All Filters</button>
      ` : ''}
    </aside>
  `;
}

function renderTaskView() {
  const tasks = getDisplayTasks();

  if (tasks.length === 0) {
    return `
      <div class="task-list">
        <div class="empty-state">
          <span class="empty-icon">📝</span>
          <h3>No tasks found</h3>
          <p>No tasks match your current filters</p>
        </div>
      </div>
    `;
  }

  // Count all tasks including subtasks
  const allTasks = flattenTasks(tasks);

  return `
    <div class="task-list">
      <div class="task-list-header">
        <h2>Tasks</h2>
        <span class="task-count">${allTasks.length} tasks</span>
      </div>
      <div class="task-list-content">
        ${tasks.map(task => renderTaskItem(task, 0)).join('')}
      </div>
    </div>
    ${state.selectedTask ? renderTaskDetail() : ''}
  `;
}

// Recursive function to render a task and its subtasks
function renderTaskItem(task, depth = 0) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = state.expandedTasks.has(task.id);
  const indentStyle = depth > 0 ? `padding-left: ${depth * 1.5 + 1}rem;` : '';

  return `
    <div class="task-item ${state.selectedTask?.id === task.id ? 'selected' : ''}"
         data-task-id="${task.id}"
         style="${indentStyle}">
      <div class="task-content">
        <div class="task-header">
          ${hasSubtasks ? `
            <button class="expand-button" data-expand-task="${task.id}" title="${isExpanded ? 'Collapse' : 'Expand'}">
              ${isExpanded ? '▼' : '▶'}
            </button>
          ` : '<span style="width: 16px; display: inline-block;"></span>'}
          <span class="task-id">${task.id}</span>
          <span class="badge status-${task.status}">${task.status}</span>
          ${task.priority ? `<span class="badge priority-${task.priority}">${task.priority}</span>` : ''}
        </div>
        <div class="task-title">${task.title}</div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
      </div>
    </div>
    ${hasSubtasks && isExpanded ? task.subtasks.map(subtask => renderTaskItem(subtask, depth + 1)).join('') : ''}
  `;
}

function renderTaskDetail() {
  if (!state.selectedTask) return '';

  const task = state.selectedTask;

  return `
    <div class="task-detail">
      <div class="task-detail-header">
        <div class="task-detail-title">
          <span class="task-id-large">${task.id}</span>
          <h2>${task.title}</h2>
        </div>
        <button class="close-button" data-close-detail>✕</button>
      </div>
      <div class="task-detail-content">
        <div class="task-badges">
          <span class="badge status-${task.status}">${task.status}</span>
          ${task.priority ? `<span class="badge priority-${task.priority}">${task.priority}</span>` : ''}
        </div>

        ${task.description ? `
          <div class="detail-section">
            <h3>Description</h3>
            <p>${task.description}</p>
          </div>
        ` : ''}

        ${task.details ? `
          <div class="detail-section">
            <h3>Details</h3>
            <p class="detail-text">${task.details}</p>
          </div>
        ` : ''}

        ${task.testStrategy ? `
          <div class="detail-section">
            <h3>Test Strategy</h3>
            <p class="detail-text">${task.testStrategy}</p>
          </div>
        ` : ''}

        ${task.dependencies && task.dependencies.length > 0 ? `
          <div class="detail-section">
            <h3>Dependencies</h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${task.dependencies.map(dep => `
                <span style="background: #27272a; color: #3b82f6; padding: 0.375rem 0.75rem; border-radius: 4px; font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; font-weight: 500;">${dep}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${task.subtasks && task.subtasks.length > 0 ? `
          <div class="detail-section">
            <h3>Subtasks (${task.subtasks.length})</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${task.subtasks.map(subtask => {
                const isExpanded = state.expandedSubtasksInDetail.has(subtask.id.toString());
                return `
                  <div class="subtask-card ${isExpanded ? 'expanded' : ''}" data-subtask-id="${subtask.id}" style="background: #27272a; padding: 0.75rem; border-radius: 4px; border-left: 3px solid ${isExpanded ? '#60a5fa' : '#3b82f6'}; cursor: pointer; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <span style="font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; color: #3b82f6; font-weight: 600;">${subtask.id}</span>
                      <span class="badge status-${subtask.status}">${subtask.status}</span>
                      ${subtask.priority ? `<span class="badge priority-${subtask.priority}">${subtask.priority}</span>` : ''}
                      <span style="margin-left: auto; color: #71717a; font-size: 0.75rem;">${isExpanded ? '▼' : '▶'}</span>
                    </div>
                    <div style="color: #e4e4e7; font-weight: 500;">${subtask.title}</div>
                    ${!isExpanded && subtask.description ? `<div style="color: #a1a1aa; font-size: 0.875rem; margin-top: 0.25rem;">${subtask.description}</div>` : ''}

                    ${isExpanded ? `
                      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #3f3f46;">
                        ${subtask.description ? `
                          <div style="margin-bottom: 1rem;">
                            <div style="color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Description</div>
                            <div style="color: #e4e4e7;">${subtask.description}</div>
                          </div>
                        ` : ''}

                        ${subtask.details ? `
                          <div style="margin-bottom: 1rem;">
                            <div style="color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Details</div>
                            <div style="color: #e4e4e7; white-space: pre-wrap;">${subtask.details}</div>
                          </div>
                        ` : ''}

                        ${subtask.testStrategy ? `
                          <div style="margin-bottom: 1rem;">
                            <div style="color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Test Strategy</div>
                            <div style="color: #e4e4e7; white-space: pre-wrap;">${subtask.testStrategy}</div>
                          </div>
                        ` : ''}

                        ${subtask.dependencies && subtask.dependencies.length > 0 ? `
                          <div style="margin-bottom: 1rem;">
                            <div style="color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Dependencies</div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                              ${subtask.dependencies.map(dep => `
                                <span style="background: #18181b; color: #3b82f6; padding: 0.25rem 0.5rem; border-radius: 3px; font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; font-size: 0.75rem; font-weight: 500;">${dep}</span>
                              `).join('')}
                            </div>
                          </div>
                        ` : ''}

                        ${subtask.subtasks && subtask.subtasks.length > 0 ? `
                          <div>
                            <div style="color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Subtasks (${subtask.subtasks.length})</div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                              ${subtask.subtasks.map(subsubtask => `
                                <div style="background: #18181b; padding: 0.5rem; border-radius: 3px; border-left: 2px solid #3b82f6;">
                                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; color: #3b82f6; font-size: 0.75rem; font-weight: 600;">${subsubtask.id}</span>
                                    <span class="badge status-${subsubtask.status}" style="font-size: 0.65rem; padding: 0.125rem 0.375rem;">${subsubtask.status}</span>
                                  </div>
                                  <div style="color: #e4e4e7; font-size: 0.875rem; margin-top: 0.25rem;">${subsubtask.title}</div>
                                </div>
                              `).join('')}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderPRDView() {
  if (state.prds.length === 0) {
    return `
      <div class="prd-viewer">
        <div class="empty-state">
          <span class="empty-icon">📄</span>
          <h3>No PRDs found</h3>
          <p>Add PRD documents to .taskmaster/docs/</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="prd-viewer">
      <div class="prd-list">
        <div class="prd-list-header">
          <h2>PRD Documents</h2>
          <span class="task-count">${state.prds.length} documents</span>
        </div>
        <div class="prd-list-content">
          ${state.prds.map(prd => `
            <div class="prd-item ${state.selectedPRD === prd.path ? 'selected' : ''}" data-prd="${prd.path}">
              <span class="prd-icon">📄</span>
              <div>
                <div class="prd-name">${prd.name}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ${state.selectedPRD ? '<div id="prd-content-placeholder"></div>' : ''}
    </div>
  `;
}

function renderMermaidView() {
  if (state.mermaid.length === 0) {
    return `
      <div class="prd-viewer">
        <div class="empty-state">
          <span class="empty-icon">📊</span>
          <h3>No Mermaid files found</h3>
          <p>Add .mmd or .mermaid files to your project</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="prd-viewer">
      <div class="prd-list">
        <div class="prd-list-header">
          <h2>Mermaid Diagrams</h2>
          <span class="task-count">${state.mermaid.length} diagrams</span>
        </div>
        <div class="prd-list-content">
          ${state.mermaid.map(mmd => `
            <div class="prd-item ${state.selectedMermaid === mmd.path ? 'selected' : ''}" data-mermaid="${mmd.path}">
              <span class="prd-icon">📊</span>
              <div>
                <div class="prd-name">${mmd.name}</div>
                <div class="prd-path">${mmd.path}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ${state.selectedMermaid ? '<div id="mermaid-content-placeholder"></div>' : ''}
    </div>
  `;
}

function renderStats() {
  if (!state.stats) return '';

  return `
    <aside class="stats-panel">
      <h2>Statistics</h2>

      <div class="stat-card">
        <div class="stat-value">${state.stats.total}</div>
        <div class="stat-label">Total Tasks</div>
      </div>

      <div class="stats-section">
        <h3>By Status</h3>
        ${Object.entries(state.stats.byStatus || {}).map(([status, count]) => `
          <div class="stat-item">
            <span class="badge status-${status}">${status}</span>
            <span class="stat-count">${count}</span>
          </div>
        `).join('')}
      </div>

      <div class="stats-section">
        <h3>By Priority</h3>
        ${Object.entries(state.stats.byPriority || {}).map(([priority, count]) => `
          <div class="stat-item">
            <span class="badge priority-${priority}">${priority}</span>
            <span class="stat-count">${count}</span>
          </div>
        `).join('')}
      </div>

      ${Object.keys(state.stats.byTag || {}).length > 1 ? `
        <div class="stats-section">
          <h3>By Tag</h3>
          ${Object.entries(state.stats.byTag || {}).map(([tag, count]) => `
            <div class="stat-item">
              <span style="font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; font-weight: 500;">${tag}</span>
              <span class="stat-count">${count}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </aside>
  `;
}

// Event listeners
function attachEventListeners() {
  // View tabs
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.view = e.target.dataset.view;
      state.selectedTask = null;
      state.selectedPRD = null;
      state.selectedMermaid = null;
      render();
    });
  });

  // Search
  const searchInput = document.querySelector('[data-search]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      render();
    });
  }

  // Tag selection
  document.querySelectorAll('[data-tag]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.currentTag = e.target.dataset.tag;
      loadTasksForTag(state.currentTag);
    });
  });

  // Status filters
  document.querySelectorAll('[data-filter-status]').forEach(input => {
    input.addEventListener('change', (e) => {
      const status = e.target.dataset.filterStatus;
      if (e.target.checked) {
        state.filters.status.push(status);
      } else {
        state.filters.status = state.filters.status.filter(s => s !== status);
      }
      render();
    });
  });

  // Priority filters
  document.querySelectorAll('[data-filter-priority]').forEach(input => {
    input.addEventListener('change', (e) => {
      const priority = e.target.dataset.filterPriority;
      if (e.target.checked) {
        state.filters.priority.push(priority);
      } else {
        state.filters.priority = state.filters.priority.filter(p => p !== priority);
      }
      render();
    });
  });

  // Clear filters
  const clearBtn = document.querySelector('[data-clear-filters]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.filters = { status: [], priority: [], search: '' };
      render();
    });
  }

  // Expand/collapse buttons
  document.querySelectorAll('[data-expand-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent task selection
      const taskId = btn.dataset.expandTask;
      if (state.expandedTasks.has(taskId)) {
        state.expandedTasks.delete(taskId);
      } else {
        state.expandedTasks.add(taskId);
      }
      render();
    });
  });

  // Task selection
  document.querySelectorAll('[data-task-id]').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't select if clicking expand button
      if (e.target.closest('[data-expand-task]')) {
        return;
      }

      const taskId = item.dataset.taskId;

      // Find task by ID in the original cache
      if (originalTasksCache) {
        // First check if this is a top-level task (no dot in ID)
        const isTopLevel = !taskId.includes('.');

        if (isTopLevel) {
          // For top-level tasks, search only in top-level tasks (not subtasks)
          state.selectedTask = originalTasksCache.find(t => t.id.toString() === taskId);
        } else {
          // For subtasks, search in flattened list
          const allTasks = flattenTasks(originalTasksCache);
          state.selectedTask = allTasks.find(t => t.id.toString() === taskId);
        }

        // Clear expanded subtasks when selecting a new task
        state.expandedSubtasksInDetail.clear();

        render();
      }
    });
  });

  // Subtask expansion (click subtasks in detail panel to expand them inline)
  const subtaskCards = document.querySelectorAll('[data-subtask-id]');

  subtaskCards.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      const subtaskId = item.dataset.subtaskId;

      // Toggle expansion
      if (state.expandedSubtasksInDetail.has(subtaskId)) {
        state.expandedSubtasksInDetail.delete(subtaskId);
      } else {
        state.expandedSubtasksInDetail.add(subtaskId);
      }

      render();
    });
  });

  // Close task detail
  const closeBtn = document.querySelector('[data-close-detail]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      state.selectedTask = null;
      state.expandedSubtasksInDetail.clear(); // Clear expanded subtasks when closing
      render();
    });
  }

  // PRD selection
  document.querySelectorAll('[data-prd]').forEach(item => {
    item.addEventListener('click', async () => {
      const prdPath = item.dataset.prd;
      state.selectedPRD = prdPath;
      render();

      // Load and display PRD content
      const placeholder = document.getElementById('prd-content-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div class="prd-content">
            <div class="prd-list-header" style="border-bottom: 1px solid #27272a;">
              <h2>${prdPath}</h2>
              <button class="close-button" onclick="state.selectedPRD = null; render();">✕</button>
            </div>
            <div class="prd-content-body">
              <div class="loader-container">
                <div class="loader"></div>
                <p>Loading document...</p>
              </div>
            </div>
          </div>
        `;

        const data = await loadPRDContent(prdPath);
        if (data) {
          const isMarkdown = prdPath.toLowerCase().endsWith('.md');
          let contentHtml;

          if (isMarkdown && typeof marked !== 'undefined') {
            // Render markdown
            contentHtml = `<div class="prd-markdown">${marked.parse(data.content)}</div>`;
          } else {
            // Show as plain text
            contentHtml = `<pre class="prd-text">${data.content}</pre>`;
          }

          placeholder.innerHTML = `
            <div class="prd-content">
              <div class="prd-list-header" style="border-bottom: 1px solid #27272a;">
                <h2>${prdPath}</h2>
                <button class="close-button" onclick="state.selectedPRD = null; render();">✕</button>
              </div>
              <div class="prd-content-body">
                ${contentHtml}
              </div>
            </div>
          `;
        }
      }
    });
  });

  // Mermaid selection
  document.querySelectorAll('[data-mermaid]').forEach(item => {
    item.addEventListener('click', async () => {
      const mermaidPath = item.dataset.mermaid;
      state.selectedMermaid = mermaidPath;
      render();

      // Load and display Mermaid content
      const placeholder = document.getElementById('mermaid-content-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div class="prd-content">
            <div class="prd-list-header" style="border-bottom: 1px solid #27272a;">
              <h2>${mermaidPath}</h2>
              <button class="close-button" onclick="state.selectedMermaid = null; render();">✕</button>
            </div>
            <div class="prd-content-body">
              <div class="loader-container">
                <div class="loader"></div>
                <p>Loading diagram...</p>
              </div>
            </div>
          </div>
        `;

        const data = await loadMermaidContent(mermaidPath);
        if (data) {
          // Create a unique ID for this diagram
          const diagramId = 'mermaid-diagram-' + Date.now();
          
          // Get the full file path
          const fullFilePath = state.project.projectPath + '/' + mermaidPath;
          
          placeholder.innerHTML = `
            <div class="prd-content">
              <div class="prd-list-header" style="border-bottom: 1px solid #27272a; display: flex; align-items: center; gap: 0.5rem;">
                <h2 style="flex: 1;">${mermaidPath}</h2>
                <button class="mermaid-copy-button" title="Copy Mermaid content">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
                <button class="mermaid-cursor-button" title="Open in Cursor">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  Cursor
                </button>
                <button class="excalidraw-button" title="Edit in Excalidraw">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Excalidraw
                </button>
                <button class="close-button" onclick="state.selectedMermaid = null; render();">✕</button>
              </div>
              <div class="prd-content-body">
                <div class="mermaid-diagram" id="${diagramId}" style="display: flex; justify-content: center; align-items: center; min-height: 400px;"></div>
              </div>
            </div>
          `;

          // Copy button handler
          const copyBtn = placeholder.querySelector('.mermaid-copy-button');
          if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
              try {
                await navigator.clipboard.writeText(data.content);
                showReloadNotification('📋 Mermaid content copied to clipboard!');
              } catch (err) {
                console.error('Failed to copy:', err);
                showReloadNotification('❌ Failed to copy content');
              }
            });
          }

          // Open in Cursor button handler
          const cursorBtn = placeholder.querySelector('.mermaid-cursor-button');
          if (cursorBtn) {
            cursorBtn.addEventListener('click', () => {
              const cursorUrl = `cursor://file/${fullFilePath}`;
              const vscodeUrl = `vscode://file/${fullFilePath}`;
              
              const link = document.createElement('a');
              link.href = cursorUrl;
              link.click();
              
              showReloadNotification('🚀 Opening in Cursor...');
              
              setTimeout(() => {
                const vscodeLink = document.createElement('a');
                vscodeLink.href = vscodeUrl;
                vscodeLink.click();
              }, 500);
            });
          }

          // Excalidraw button click handler
          const excalidrawBtn = placeholder.querySelector('.excalidraw-button');
          if (excalidrawBtn) {
            excalidrawBtn.addEventListener('click', async () => {
              try {
                // Copy Mermaid content to clipboard
                await navigator.clipboard.writeText(data.content);
                showReloadNotification('📋 Copied! Opening Excalidraw - paste with Ctrl/Cmd+V');
                
                // Open Excalidraw in new tab after a brief delay
                setTimeout(() => {
                  window.open('https://excalidraw.com/', '_blank');
                }, 500);
              } catch (err) {
                console.error('Failed to copy:', err);
                // Still open Excalidraw even if copy fails
                window.open('https://excalidraw.com/', '_blank');
                showReloadNotification('⚠️ Opened Excalidraw. Copy the diagram manually.');
              }
            });
          }

          // Render the Mermaid diagram
          try {
            const diagramElement = document.getElementById(diagramId);
            if (window.mermaid && diagramElement) {
              const { svg } = await window.mermaid.render(diagramId + '-svg', data.content);
              diagramElement.innerHTML = svg;
            }
          } catch (error) {
            console.error('Error rendering Mermaid diagram:', error);
            const diagramElement = document.getElementById(diagramId);
            if (diagramElement) {
              diagramElement.innerHTML = `
                <div class="empty-state">
                  <span class="empty-icon">❌</span>
                  <h3>Error rendering diagram</h3>
                  <p>${error.message}</p>
                  <pre style="text-align: left; max-width: 600px; margin-top: 1rem;">${data.content}</pre>
                </div>
              `;
            }
          }
        }
      }
    });
  });
}

// Show reload notification
function showReloadNotification(message) {
  // Remove existing notification
  const existing = document.querySelector('.reload-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification
  const notification = document.createElement('div');
  notification.className = 'reload-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Fade in
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Hot-reloading via Server-Sent Events
function setupHotReload() {
  const eventSource = new EventSource('/api/events');

  eventSource.onopen = () => {
    console.log('🔌 Connected to hot-reload server');
  };

  eventSource.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'connected') {
        console.log('✓ Hot-reload active');
      } else if (data.type === 'tasks-updated') {
        console.log('🔄 Tasks updated, reloading...');
        showReloadNotification('🔄 Tasks updated');

        // Save current state before reload
        const selectedTaskId = state.selectedTask?.id;
        const expandedSubtasks = new Set(state.expandedSubtasksInDetail);
        const taskListScroll = document.querySelector('.task-list-content')?.scrollTop || 0;
        const detailScroll = document.querySelector('.task-detail-content')?.scrollTop || 0;

        // Reload data without rendering
        await reloadData();

        // Restore selected task with fresh data
        if (selectedTaskId && originalTasksCache) {
          const isTopLevel = !selectedTaskId.toString().includes('.');
          if (isTopLevel) {
            state.selectedTask = originalTasksCache.find(t => t.id.toString() === selectedTaskId.toString());
          } else {
            const allTasks = flattenTasks(originalTasksCache);
            state.selectedTask = allTasks.find(t => t.id.toString() === selectedTaskId.toString());
          }
        }

        // Restore expanded subtasks
        state.expandedSubtasksInDetail = expandedSubtasks;

        // Render with restored state
        render();

        // Restore scroll positions after a brief delay to ensure DOM is ready
        setTimeout(() => {
          const taskListContent = document.querySelector('.task-list-content');
          if (taskListContent && taskListScroll > 0) {
            taskListContent.scrollTop = taskListScroll;
          }

          const taskDetailContent = document.querySelector('.task-detail-content');
          if (taskDetailContent && detailScroll > 0) {
            taskDetailContent.scrollTop = detailScroll;
          }
        }, 10);
      } else if (data.type === 'prds-updated') {
        console.log('🔄 PRDs updated, reloading...');
        showReloadNotification('🔄 PRDs updated');

        // Save current state before reload
        const selectedPRDPath = state.selectedPRD;
        const prdScroll = document.querySelector('.prd-content-body')?.scrollTop || 0;

        // Reload data without rendering
        await reloadData();

        // Restore selected PRD
        if (selectedPRDPath) {
          state.selectedPRD = selectedPRDPath;
        }

        // Render with restored state
        render();

        // Reload PRD content if one was selected
        if (selectedPRDPath) {
          const placeholder = document.getElementById('prd-content-placeholder');
          if (placeholder) {
            // Show loading state
            placeholder.innerHTML = `
              <div class="prd-content">
                <div class="prd-list-header" style="border-bottom: 1px solid #27272a;">
                  <h2>${selectedPRDPath}</h2>
                  <button class="close-button" onclick="state.selectedPRD = null; render();">✕</button>
                </div>
                <div class="prd-content-body">
                  <div class="loader-container">
                    <div class="loader"></div>
                    <p>Loading document...</p>
                  </div>
                </div>
              </div>
            `;

            // Load and display content
            const prdData = await loadPRDContent(selectedPRDPath);
            if (prdData) {
              const isMarkdown = selectedPRDPath.toLowerCase().endsWith('.md');
              let contentHtml;

              if (isMarkdown && typeof marked !== 'undefined') {
                contentHtml = `<div class="prd-markdown">${marked.parse(prdData.content)}</div>`;
              } else {
                contentHtml = `<pre class="prd-text">${prdData.content}</pre>`;
              }

              placeholder.innerHTML = `
                <div class="prd-content">
                  <div class="prd-list-header" style="border-bottom: 1px solid #27272a;">
                    <h2>${selectedPRDPath}</h2>
                    <button class="close-button" onclick="state.selectedPRD = null; render();">✕</button>
                  </div>
                  <div class="prd-content-body">
                    ${contentHtml}
                  </div>
                </div>
              `;

              // Restore scroll position after content loads
              setTimeout(() => {
                const prdContentBody = document.querySelector('.prd-content-body');
                if (prdContentBody && prdScroll > 0) {
                  prdContentBody.scrollTop = prdScroll;
                }
              }, 10);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    // EventSource will automatically reconnect
  };

  // Close connection on page unload
  window.addEventListener('beforeunload', () => {
    eventSource.close();
  });
}

// Initialize
loadData();
setupHotReload();
